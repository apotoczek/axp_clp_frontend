import uuid from 'uuid/v4';
import React from 'react';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import TextInput from 'components/basic/forms/input/TextInput';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Box} from '@rebass/grid';
import {Viewport} from 'components/layout';
import {is_set} from 'src/libs/Utils';
import styled from 'styled-components';
import {stripIndent} from 'common-tags';
import {ErrorDescription} from 'components/basic/forms/base';

import {EditingPage, EditingSection} from 'components/reporting/shared';

import SequenceStepEditor from 'components/reporting/emails/SequenceStepEditor';

const PAGE_DESCRIPTION = stripIndent`
    An email sequence is a series of emails that will be sent, one by
    one, in specified time gaps that you set to each of your clients.
    Every sequence needs a name, at least one step, and a schedule for
    sending.
`;

const DEFAULT_STEP = {
    relativeBase: 3,
    daysOffset: 0,
    condition: null,
    body: '',
    subject: '',
};

const DEFAULT_SEQUENCE = {
    name: '',
    steps: [],
};

export default class SequenceEditor extends React.Component {
    state = {
        errors: {},
        stepErrors: [],
        sequence: {
            ...DEFAULT_SEQUENCE,
            ...this.props.sequence,
        },
    };

    scrollDummy = React.createRef();

    validate = sequence => {
        const errors = {};

        if (!is_set(sequence.name, true)) {
            errors.name = 'Name is required';
        }

        const stepErrors = sequence.steps.map(step => {
            const errors = {};

            if (!is_set(step.subject, true)) {
                errors.subject = 'Subject is required';
            }

            if (!is_set(step.body, true)) {
                errors.body = 'Body is required';
            }

            return errors;
        });

        return [errors, stepErrors];
    };

    handleSave = () => {
        const {sequence} = this.state;

        const [errors, stepErrors] = this.validate(sequence);

        if (is_set(errors, true) || stepErrors.some(e => is_set(e, true))) {
            this.setState({errors, stepErrors});
            return;
        }

        this.props.onSave({
            ...sequence,
            steps: sequence.steps.map(({uid: _uid, ...rest}) => rest),
        });
    };

    handleCancel = () => {
        this.props.onCancel();
    };

    handleStepDelete = step => {
        const steps = this.state.sequence.steps.filter(s => s.uid !== step.uid);
        this.setState({
            sequence: {
                ...this.state.sequence,
                steps,
            },
        });
    };

    appendEmptyStep = () => {
        this.setState(
            {
                sequence: {
                    ...this.state.sequence,
                    steps: [
                        ...this.state.sequence.steps,
                        {
                            ...DEFAULT_STEP,
                            uid: uuid(),
                        },
                    ],
                },
            },
            () => {
                this.scrollDummy.current.scrollIntoView({behavior: 'smooth'});
            },
        );
    };

    handleSequenceChange = sequenceData => {
        this.setState({
            sequence: {
                ...this.state.sequence,
                ...sequenceData,
            },
        });
    };

    handleStepChange = (index, stepData) => {
        const steps = [...this.state.sequence.steps];
        const step = {...steps[index]};
        const newStep = {
            ...step,
            ...stepData,
        };
        steps[index] = newStep;

        this.setState({
            sequence: {
                ...this.state.sequence,
                steps: [...steps],
            },
        });
    };

    render() {
        const {sequence, errors, stepErrors} = this.state;
        const {breadcrumbs, createNew, templates, sequence: staticSequence} = this.props;

        const breadcrumbLeaf = createNew ? 'Create' : staticSequence.name;

        const hasError = is_set(errors, true) || stepErrors.some(e => is_set(e, true));

        return (
            <Viewport>
                <Breadcrumbs
                    path={breadcrumbs.concat(['Sequence', breadcrumbLeaf])}
                    urls={['#!/reporting-relationships', '#!/reporting-emails']}
                    linkComponent={NonRouterLink}
                />
                <SaveToolbar onCancel={this.handleCancel} onSave={this.handleSave} />
                <EditingPage>
                    <EditingSection
                        heading={createNew ? 'Create Email Sequence' : 'Edit Email Sequence'}
                        description={PAGE_DESCRIPTION}
                    >
                        <Box p={1}>
                            {hasError && (
                                <Box mb={3} px={1}>
                                    <ErrorDescription>
                                        We found some problems, please look through the form and
                                        correct marked problems.
                                    </ErrorDescription>
                                </Box>
                            )}
                            <Box mb={3}>
                                <TextInput
                                    leftLabel='Sequence Name'
                                    value={sequence.name}
                                    onValueChanged={name => this.handleSequenceChange({name})}
                                    error={errors.name}
                                />
                            </Box>
                            {sequence.steps
                                .sort((a, b) => a.orderingValue - b.orderingValue)
                                .map((step, index) => (
                                    <SequenceStepEditor
                                        step={step}
                                        key={step.uid}
                                        stepNumber={index + 1}
                                        templates={templates}
                                        onUpdate={step => this.handleStepChange(index, step)}
                                        onDelete={step => this.handleStepDelete(step)}
                                        errors={stepErrors[index] || {}}
                                    />
                                ))}
                            <AddStepButton onClick={this.appendEmptyStep}>Add step</AddStepButton>
                        </Box>
                        <div ref={this.scrollDummy} />
                    </EditingSection>
                </EditingPage>
            </Viewport>
        );
    }
}

const AddStepButton = styled.div`
    border: 1px solid #666666;
    box-shadow: unset;
    font-size: 15px;
    border-radius: 3px;
    color: #000000;
    text-align: center;
    user-select: none;
    cursor: pointer;
    background-color: #d9dcec;
    transition: 0.05s linear;
    letter-spacing: 0.5px;
    &:hover {
        background-color: #c5c8d6;
    }
    text-transform: uppercase;
    padding: 10px;
`;

const SaveToolbar = ({onCancel, onSave, children}) => (
    <Toolbar flex>
        <ToolbarItem onClick={onCancel} icon='cancel' glyphicon right>
            Cancel
        </ToolbarItem>
        <ToolbarItem onClick={onSave} icon='save' glyphicon right>
            Save Sequence
        </ToolbarItem>
        {children}
    </Toolbar>
);
