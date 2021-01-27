import React, {useCallback, useMemo, useState} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Box, Flex} from '@rebass/grid';

import {Viewport} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';

import DataTable from 'components/basic/DataTable';

import MetricTable from 'components/basic/MetricTable';
import Modal, {ModalContent} from 'components/basic/Modal';
import {
    ModalHeader,
    ModalButton,
    formatRequestStatus,
    RequestColors,
    RequestStatusOptions,
} from 'components/reporting/shared';
import {LightTheme} from 'themes';
import {Page, Content} from 'components/layout';
import ReviewSubmission from 'containers/reporting/ReviewSubmission';
import CPanelPopoverChecklist from 'components/basic/cpanel/CPanelPopoverChecklist';
import CPanel, {
    CPanelSection,
    CPanelSectionTitle,
    CPanelButton,
} from 'components/basic/cpanel/base';
import CPanelInput from 'components/basic/cpanel/CPanelInput';
import {H1, H2} from 'components/basic/text';
import {useBackendData} from 'utils/backendConnect';
import Loader from 'components/basic/Loader';

const Footer = styled(Flex)`
    min-height: 100px;
    margin-top: 15px;
    margin-bottom: 8px;
`;

const Body = styled(Box)`
    background-color: #ffffff;
    padding: 15px;
    border-radius: 2px;
`;

class ViewRequestModal extends React.Component {
    static propTypes = {
        request: PropTypes.object,
        toggleModal: PropTypes.func.isRequired,
    };

    renderContent = () => {
        const {request, toggleModal} = this.props;

        if (!request) {
            return null;
        }

        return (
            <ModalContent flexDirection='column' fullHeight>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>
                        <H1>{request.name}</H1>
                        <H2>For {request.relationship.company_name}</H2>
                    </Box>
                </ModalHeader>
                <Box flex={1}>
                    <Body>
                        <MetricTable
                            numColumns={2}
                            rows={[
                                {
                                    label: 'Request Date',
                                    value: request.request_date,
                                    format: 'backend_date',
                                },
                                {label: 'Requested By', value: request.requested_by.name},
                                {
                                    label: 'As of Date',
                                    value: request.as_of_date,
                                    format: 'backend_date',
                                },
                                {label: 'Template', value: request.template.name},
                                {
                                    label: 'Due Date',
                                    value: request.due_date,
                                    format: 'backend_date',
                                },
                                {label: 'Status', value: request.status_text},
                                {
                                    label: 'Recurring',
                                    value: request.recurring
                                        ? request.mandate.frequency_text
                                        : 'No',
                                },
                                {
                                    label: 'Email Sequence',
                                    value: request.email_sequence?.name ?? 'None',
                                },
                            ]}
                        />
                    </Body>
                </Box>
                <Footer>
                    <Flex width={1} flexWrap='nowrap' alignItems='center' justifyContent='flex-end'>
                        <Box width={1 / 4} m={1}>
                            <ModalButton onClick={toggleModal}>Close</ModalButton>
                        </Box>
                    </Flex>
                </Footer>
            </ModalContent>
        );
    };

    render() {
        const {isOpen, toggleModal} = this.props;

        return (
            <Modal
                openStateChanged={toggleModal}
                isOpen={isOpen}
                render={() => this.renderContent()}
            />
        );
    }
}

function ActivityCPanel({templates, filterValues, onClear, onFilterChanged}) {
    const onNameChanged = useCallback(event => onFilterChanged('name', event.target.value), [
        onFilterChanged,
    ]);

    const onStatusChanged = useCallback(v => onFilterChanged('status', v), [onFilterChanged]);

    const onTemplateChanged = useCallback(v => onFilterChanged('template', v), [onFilterChanged]);

    const templateOptions = useMemo(
        () => templates.map(({uid, name}) => ({value: uid, label: name})),
        [templates],
    );

    return (
        <CPanel>
            <CPanelSection>
                <CPanelSectionTitle>Filter requests</CPanelSectionTitle>
                <CPanelInput
                    placeholder='Company...'
                    value={filterValues.name}
                    onChange={onNameChanged}
                />
                <CPanelPopoverChecklist
                    label='Status'
                    options={RequestStatusOptions}
                    selectedValues={filterValues.status}
                    onValueChanged={onStatusChanged}
                />
                <CPanelPopoverChecklist
                    label='Template'
                    options={templateOptions}
                    selectedValues={filterValues.template}
                    onValueChanged={onTemplateChanged}
                />
                <CPanelButton onClick={onClear}>Clear All</CPanelButton>
            </CPanelSection>
        </CPanel>
    );
}

const SummaryHeader = styled(Flex)`
    height: 100px;
    align-items: center;
    justify-content: space-around;
`;

const Callout = styled(Box)`
    text-align: center;
`;

const CalloutLabel = styled(Box)`
    font-size: 16px;
    color: #000000;
`;
const CalloutItem = styled(Box)`
    font-size: 18px;
    color: ${props => RequestColors[props.state]};
`;

function hasFilter(filterValues) {
    const {status, template, name} = filterValues;

    return !!((name && name.length) || (status && status.length) || (template && template.length));
}

function filterRequests(requests, filterValues) {
    return requests.filter(request => {
        const {status, template, name = ''} = filterValues;

        if (!request.relationship.company_name.toLowerCase().includes(name.toLowerCase())) {
            return false;
        }

        if (status && status.length) {
            const options = RequestStatusOptions.filter(({value}) => status.includes(value));

            const statuses = options.reduce((res, o) => res.concat(o.statuses), []);

            return statuses.includes(request.status);
        }

        if (template && template.length && !template.includes(request.template.uid)) {
            return false;
        }

        return true;
    });
}

function genCallouts(filteredRequests) {
    return RequestStatusOptions.map(({label, statuses, state}) => ({
        label,
        state,
        count: filteredRequests.filter(request => statuses.includes(request.status)).length,
    }));
}

const States = {
    ReviewSubmission: 'review-submission',
    ViewRequest: 'view-request',
};

function Activity({internal}) {
    const [requestUid, setRequestUid] = useState(null);
    const [submissionUid, setSubmissionUid] = useState(null);
    const [filterValues, setFilterValues] = useState({});
    const [activeState, setActiveState] = useState(null);

    const {data: requestData, isLoading} = useBackendData('reporting/data-requests/outgoing', {
        internal,
    });

    const {data: templates} = useBackendData('reporting/templates', {}, {initialData: []});

    const clearUids = useCallback(() => {
        setSubmissionUid(null);
        setRequestUid(null);
    }, []);

    const closeModal = useCallback(() => {
        setActiveState(null);
    }, []);

    const closePage = useCallback(() => {
        setActiveState(null);
        clearUids();
    }, [clearUids]);

    const handleRowClick = useCallback(request => {
        setRequestUid(request.uid);
        if (request.latest_submission) {
            setSubmissionUid(request.latest_submission.uid);
            setActiveState(States.ReviewSubmission);
        } else {
            setActiveState(States.ViewRequest);
        }
    }, []);

    const handleFilterChanged = (key, value) => {
        setFilterValues(filterValues => ({...filterValues, [key]: value}));
    };

    const handleClearFilters = () => {
        setFilterValues({});
    };

    const requests = requestData.requests || [];

    if (isLoading) {
        return <Loader />;
    }

    const filteredRequests = filterRequests(requests, filterValues);

    const callouts = genCallouts(filteredRequests);

    let content;
    if (activeState === States.ReviewSubmission) {
        content = <ReviewSubmission submissionUid={submissionUid} onClose={closePage} />;
    } else {
        content = (
            <>
                <SummaryHeader>
                    {callouts.map(({label, count, state}) => (
                        <Callout key={label}>
                            <CalloutLabel>{label}</CalloutLabel>
                            <CalloutItem state={state}>{count}</CalloutItem>
                        </Callout>
                    ))}
                </SummaryHeader>
                <Box mt={3} flex={1}>
                    <DataTable
                        rowKey='uid'
                        rows={filteredRequests}
                        rowsAreFiltered={hasFilter(filterValues)}
                        defaultHiddenColumns={[
                            'request_date',
                            'requested_by:name',
                            'template:name',
                            'name',
                        ]}
                        onRowClick={handleRowClick}
                        enableRowClick
                        columns={[
                            {
                                label: 'Company',
                                key: 'relationship:company_name',
                                width: 200,
                                flexGrow: 1,
                                flexShrink: 0,
                            },
                            {
                                label: 'Request',
                                key: 'name',
                                width: 150,
                            },
                            {
                                label: 'Template',
                                key: 'template:name',
                                width: 150,
                            },
                            {
                                label: 'As of date',
                                key: 'as_of_date',
                                format: 'backend_date',
                                width: 100,
                                right: true,
                            },
                            {
                                label: 'Due date',
                                key: 'due_date',
                                format: 'backend_date',
                                width: 100,
                                right: true,
                            },
                            {
                                label: 'Requested',
                                key: 'request_date',
                                format: 'backend_date',
                                width: 100,
                                right: true,
                            },
                            {
                                label: 'Requested By',
                                key: 'requested_by:name',
                                width: 150,
                            },
                            {
                                label: 'Submitted',
                                key: 'latest_submission:created',
                                format: 'backend_local_datetime',
                                width: 200,
                                right: true,
                            },
                            {
                                label: 'Submitted By',
                                key: 'latest_submission:sent_by:name',
                                width: 150,
                            },
                            {
                                label: 'Status',
                                key: 'status_text',
                                formatter: ({cellData, rowData}) =>
                                    formatRequestStatus(cellData, rowData.state),
                                width: 250,
                            },
                        ]}
                    />
                </Box>
            </>
        );
    }

    return (
        <Viewport>
            <Breadcrumbs
                path={['Data Collection', 'Activity']}
                urls={['#!/reporting-relationships']}
                linkComponent={NonRouterLink}
            />
            <LightTheme>
                <>
                    <ViewRequestModal
                        key={requestUid || States.ViewRequest}
                        isOpen={activeState === States.ViewRequest}
                        request={requests.find(r => r.uid == requestUid)}
                        toggleModal={closeModal}
                    />
                    <Page>
                        <ActivityCPanel
                            filterValues={filterValues}
                            onFilterChanged={handleFilterChanged}
                            onClear={handleClearFilters}
                            templates={templates}
                        />
                        <Content p={4}>{content}</Content>
                    </Page>
                </>
            </LightTheme>
        </Viewport>
    );
}

export default Activity;
