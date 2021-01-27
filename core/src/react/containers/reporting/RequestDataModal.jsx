import React, {useState, useCallback} from 'react';
import styled from 'styled-components';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';

import {H1, H2} from 'components/basic/text';

import {Flex, Box} from '@rebass/grid';
import DataTable from 'components/basic/DataTable';
import Checkbox from 'components/basic/forms/Checkbox';
import Button from 'components/basic/forms/Button';

import {ModalHeader, Heading} from 'components/reporting/shared';
import MandateForm from 'components/reporting/mandates/MandateForm';
import DataRequestForm from 'components/reporting/mandates/DataRequestForm';
import Modal, {ModalContent} from 'components/basic/Modal';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import Loader from 'components/basic/Loader';

import {is_set, date_to_epoch, getOptionLabel} from 'src/libs/Utils';
import {offset_to_relative, relative_to_offset, frequencies} from 'src/helpers/reporting';

const to_epoch = d => (d ? date_to_epoch(d) : null);

const TableWrapper = styled.div`
    height: 200px;
`;

const Radiobox = props => (
    <Checkbox checkedIcon='dot-circled' uncheckedIcon='circle-empty' {...props} />
);

const Mode = {
    ExistingMandate: 1,
    NewMandate: 2,
    NewDataRequest: 3,
};

const Labels = {
    [Mode.NewMandate]: 'New Recurring request',
    [Mode.ExistingMandate]: 'Existing Recurring Request',
    [Mode.NewDataRequest]: 'New one-off request',
};

class FormWrapper extends React.Component {
    state = {
        values: this.props.defaults,
        errors: {},
    };

    handleValueChanged = (key, value) => {
        const {values} = this.state;

        this.setState({values: {...values, [key]: value}});
    };

    handleSave = () => {
        const {validator, onSave} = this.props;
        const {values} = this.state;

        const errors = validator(values);

        if (is_set(errors, true)) {
            this.setState({errors});
            return;
        }

        onSave(values);
    };

    handleCancel = () => {
        this.props.onCancel();
    };

    render() {
        const {formComponent: Form, ...rest} = this.props;
        const {values, errors} = this.state;

        return (
            <Box>
                <Form
                    values={values}
                    errors={errors}
                    onValueChanged={this.handleValueChanged}
                    {...rest}
                />
                <Flex justifyContent='flex-end' p={2}>
                    <Button mr={1} primary onClick={this.handleSave}>
                        Save
                    </Button>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                </Flex>
            </Box>
        );
    }
}

const validateMandate = mandate => {
    const errors = {};

    if (!is_set(mandate.name, true)) {
        errors.name = 'Name is required';
    }

    if (!is_set(mandate.frequency, true)) {
        errors.frequency = 'Frequency is required';
    }

    if (!is_set(mandate.templateUid, true)) {
        errors.templateUid = 'Data template is required';
    }

    return errors;
};

const validateDataRequest = request => {
    const errors = {};

    const today = new Date();
    today.reset('day');

    if (!is_set(request.templateUid, true)) {
        errors.templateUid = 'Data template is required';
    }

    if (!is_set(request.requestDate, true)) {
        errors.requestDate = 'Request date is required';
    } else if (request.requestDate < today) {
        errors.requestDate = 'Request date has to be in the future';
    }

    if (!is_set(request.dueDate, true)) {
        errors.dueDate = 'Due date is required';
    } else if (request.dueDate < today) {
        errors.dueDate = 'Due date has to be in the future';
    }

    if (!is_set(request.asOfDate, true)) {
        errors.asOfDate = 'As of date is required';
    }

    return errors;
};

const NewDataRequest = props => (
    <Box>
        <Heading label='Add New One-off Request'>
            A data request is the formal process by which you ask your clients to submit their data.
            Fill out the form to create a one-off data request.
        </Heading>
        <FormWrapper validator={validateDataRequest} formComponent={DataRequestForm} {...props} />
    </Box>
);

const NewMandate = props => (
    <Box>
        <Heading label='Add New Recurring Request'>
            Fill out the form to create a new recurring data request. Recurring requests enable you
            to automatically request data every period, removing the need for manual data requests.
        </Heading>
        <FormWrapper validator={validateMandate} formComponent={MandateForm} {...props} />
    </Box>
);

const ExistingMandate = ({options, onRowClick}) => (
    <Box>
        <Heading label='Existing Recurring Request'>
            Add an existing recurring data request to this portal by selecting one of the
            pre-defined requests below.
        </Heading>
        <TableWrapper>
            <DataTable
                rowKey='uid'
                enableRowClick
                onRowClick={onRowClick}
                rows={options.mandates}
                isLoading={false}
                enableSorting={false}
                enableColumnToggle={false}
                columns={[
                    {
                        label: 'Name',
                        key: 'name',
                    },
                    {
                        label: 'Frequency',
                        key: 'frequency',
                        formatter: ({cellData}) => getOptionLabel(options.frequencies, cellData),
                    },
                    {
                        label: 'Template',
                        key: 'reporting_template_uid',
                        formatter: ({cellData}) =>
                            getOptionLabel(options.templates, cellData, 'uid', 'name'),
                    },
                    {
                        label: 'Email Sequence',
                        key: 'reporting_email_sequence_uid',
                        formatter: ({cellData}) =>
                            getOptionLabel(options.emailSequences, cellData, 'uid', 'name'),
                    },
                    {
                        label: 'Created On',
                        key: 'created',
                        format: 'backend_date',
                    },
                    {
                        label: 'Last Updated',
                        key: 'modified',
                        format: 'backend_date',
                    },
                ]}
            />
        </TableWrapper>
    </Box>
);

function Form({
    mode,
    mandateDefaults,
    onCreateDataRequest,
    onCreateMandate,
    onClickMandate,
    onCancel,
    formOptions,
    company,
}) {
    const today = new Date();

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const requestDefaults = {
        requestDate: today,
        dueDate: new Date(today.getFullYear(), today.getMonth(), lastDayOfMonth + 5),
        asOfDate: new Date(today.getFullYear(), today.getMonth(), lastDayOfMonth),
        templateUid: mandateDefaults.templateUid,
        emailSequenceUid: mandateDefaults.emailSequenceUid,
    };

    switch (mode) {
        case Mode.NewMandate:
            return (
                <NewMandate
                    options={formOptions}
                    defaults={mandateDefaults}
                    onSave={onCreateMandate}
                    onCancel={onCancel}
                    company={company}
                />
            );
        case Mode.NewDataRequest:
            return (
                <NewDataRequest
                    options={formOptions}
                    defaults={requestDefaults}
                    onSave={onCreateDataRequest}
                    onCancel={onCancel}
                />
            );
        case Mode.ExistingMandate:
            return <ExistingMandate options={formOptions} onRowClick={onClickMandate} />;
    }
}

function useFormOptions() {
    const {data: emailSequences} = useBackendData(
        'reporting/email-sequences',
        {},
        {initialData: []},
    );

    const {data: templates} = useBackendData('reporting/templates', {}, {initialData: []});

    const {data: mandates} = useBackendData('reporting/mandates', {}, {initialData: []});

    const {data: client} = useBackendData('dataprovider/client');

    return {
        emailSequences,
        templates,
        mandates,
        users: client.users || [],
        frequencies: frequencies(),
    };
}

function useMandateDefaults() {
    const {
        data: {
            reporting_template_uid,
            notifications,
            request_date_offset_days,
            due_date_offset_days,
            frequency,
        },
    } = useBackendData('reporting/mandate-defaults');

    return {
        frequency,
        notifications,
        templateUid: reporting_template_uid,
        relativeRequestDate: offset_to_relative(request_date_offset_days),
        relativeDueDate: offset_to_relative(due_date_offset_days),
        emailSequenceUid: null,
    };
}

export default function DataRequestModal({
    relationshipUid,
    isOpen,
    toggleModal,
    internal,
    company,
}) {
    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column' scroll>
                <Content
                    relationshipUid={relationshipUid}
                    toggleModal={toggleModal}
                    internal={internal}
                    company={company}
                />
            </ModalContent>
        </Modal>
    );
}

function Content({relationshipUid, toggleModal, internal, company}) {
    const [mode, setMode] = useState(Mode.ExistingMandate);

    const formOptions = useFormOptions();
    const mandateDefaults = useMandateDefaults();

    const {
        triggerEndpoint: createMandate,
    } = useBackendEndpoint('reporting/actions/create-or-update-mandate', {action: true});

    const {
        triggerEndpoint: createRequestFromMandate,
    } = useBackendEndpoint('reporting/actions/create-data-request-from-mandate', {action: true});

    const {
        triggerEndpoint: createNewDataRequest,
    } = useBackendEndpoint('reporting/actions/add-request', {action: true});

    const handleModeChanged = usePartiallyAppliedCallback(newMode => {
        setMode(newMode);
    }, []);

    const handleCreateRequestFromMandate = useCallback(
        uid => {
            createRequestFromMandate({
                rel_uid: relationshipUid,
                mandate_uid: uid,
            }).then(() => {
                toggleModal();
            });
        },
        [createRequestFromMandate, relationshipUid, toggleModal],
    );

    const handleCreateMandate = useCallback(
        mandate => {
            createMandate({
                name: mandate.name,
                frequency: parseInt(mandate.frequency),
                reporting_template_uid: mandate.templateUid,
                notifications: mandate.notifications,
                request_date_offset_days: relative_to_offset(mandate.relativeRequestDate),
                due_date_offset_days: relative_to_offset(mandate.relativeDueDate),
                mandate_uid: mandate.uid,
                reporting_email_sequence_uid: mandate.emailSequenceUid || null,
                reply_to_user_uid: mandate.replyToUserUid || null,
            }).then(uid => {
                handleCreateRequestFromMandate(uid);
            });
        },
        [createMandate, handleCreateRequestFromMandate],
    );

    const handleCreateDataRequest = useCallback(
        request => {
            createNewDataRequest({
                rel_uid: relationshipUid,
                reporting_template_uid: request.templateUid,
                request_date: to_epoch(request.requestDate),
                due_date: to_epoch(request.dueDate),
                as_of_date: to_epoch(request.asOfDate),
                reporting_email_sequence_uid: request.emailSequenceUid || null,
                reply_to_user_uid: request.replyToUserUid || null,
            }).then(() => {
                toggleModal();
            });
        },
        [createNewDataRequest, relationshipUid, toggleModal],
    );

    const handleClickMandate = useCallback(mandate => handleCreateRequestFromMandate(mandate.uid), [
        handleCreateRequestFromMandate,
    ]);

    const {data, isLoading} = useBackendData(
        'reporting/list-relationships',
        {internal, relationship_uid: relationshipUid},
        {requiredParams: ['relationship_uid']},
    );

    const relationship = data.relationships && data.relationships[0];

    if (!relationship || isLoading) {
        return <Loader />;
    }

    return (
        <>
            <ModalHeader width={1} pb={2} mb={3}>
                <Box width={2 / 3}>
                    <H1>Request Data</H1>
                    <H2>for {relationship.company_name}</H2>
                </Box>
            </ModalHeader>
            <Flex flex='1 0 auto'>
                {Object.values(Mode).map(m => (
                    <Box key={m} flex={1} p={1}>
                        <Radiobox
                            checked={mode === m}
                            leftLabel={Labels[m]}
                            onValueChanged={handleModeChanged(m)}
                        />
                    </Box>
                ))}
            </Flex>
            <Box mt={3}>
                <Form
                    mode={mode}
                    onClickMandate={handleClickMandate}
                    onCreateDataRequest={handleCreateDataRequest}
                    onCreateMandate={handleCreateMandate}
                    onCancel={toggleModal}
                    mandateDefaults={mandateDefaults}
                    formOptions={formOptions}
                    company={company}
                />
            </Box>
        </>
    );
}
