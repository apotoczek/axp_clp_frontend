import React from 'react';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TemplateEditor from 'components/reporting/emails/base/TemplateEditor';
import TextInput from 'components/basic/forms/input/TextInput';
import NumberInput from 'components/basic/forms/input/NumberInput';
import Button from 'components/basic/forms/Button';
import Icon from 'components/basic/Icon';
import PropTypes from 'prop-types';

import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';

import {is_set} from 'src/libs/Utils';

const BoxLabel = styled(Box)`
    display: flex;
    align-items: center;
    flex-direction: row;
    font-size: 14px;
    text-transform: uppercase;
    color: ${({color, theme}) => color || theme.text.h1};
`;

const StepWrapper = styled(Box)`
    min-height: 250px;
    background-color: #d9dcec;
    border-radius: 3px;
    padding: 10px;
`;

class RelativeScheduler extends React.Component {
    static propTypes = {
        relativeBase: PropTypes.number.isRequired,
        daysOffset: PropTypes.number.isRequired,
    };

    relativityOptions = [
        {label: 'On', value: 0},
        {label: 'After', value: 1},
        {label: 'Before', value: -1},
    ];

    baseOptions = [
        {label: 'Period End', value: 1},
        {label: 'Previous Step', value: 2},
        {label: 'Due Date', value: 3},
        {label: 'Request Date', value: 4},
    ];

    constructor(props) {
        super(props);
        const {daysOffset, relativeBase} = props;
        const relativity = daysOffset ? Math.abs(daysOffset) / daysOffset : 0;
        this.state = {
            selectedRelativity: this.relativityOptions.find(o => o.value === relativity),
            daysOffset: Math.abs(daysOffset),
            selectedBase: this.baseOptions.find(o => o.value === relativeBase),
        };
    }

    calculateOffset = () => {
        const {daysOffset, selectedRelativity} = this.state;
        return daysOffset * selectedRelativity.value;
    };

    render() {
        const {selectedRelativity, daysOffset, selectedBase} = this.state;
        const {relativeBase, onValueChanged} = this.props;

        return (
            <Flex ml={1}>
                <BoxLabel>Send</BoxLabel>
                <Box ml={2}>
                    <DropdownList
                        manualValue={selectedRelativity.label}
                        options={this.relativityOptions}
                        broadcastFullOption
                        onValueChanged={relativity => {
                            this.setState(
                                {
                                    selectedRelativity: relativity,
                                    daysOffset: relativity === 0 ? 0 : daysOffset || 1,
                                },
                                () =>
                                    onValueChanged({
                                        relativeBase,
                                        daysOffset: this.calculateOffset(),
                                    }),
                            );
                        }}
                    />
                </Box>
                {is_set(selectedRelativity.value) && (
                    <>
                        <Box ml={2}>
                            <NumberInput
                                value={daysOffset}
                                onValueChanged={days => {
                                    this.setState({daysOffset: days}, () => {
                                        onValueChanged({
                                            relativeBase,
                                            daysOffset: this.calculateOffset(),
                                        });
                                    });
                                }}
                            />
                        </Box>
                        <BoxLabel ml={2}>days from</BoxLabel>
                    </>
                )}
                <Box ml={2}>
                    <DropdownList
                        manualValue={selectedBase.label}
                        broadcastFullOption
                        options={this.baseOptions}
                        onValueChanged={base => {
                            this.setState({selectedBase: base}, () => {
                                onValueChanged({
                                    relativeBase: base.value,
                                    daysOffset: this.calculateOffset(),
                                });
                            });
                        }}
                    />
                </Box>
            </Flex>
        );
    }
}

export default class SequenceStepEditor extends React.Component {
    conditions = [
        {label: 'Always', value: null},
        {label: 'Data Submitted', value: 1},
        {label: 'Data Not Submitted', value: 4},
        {label: 'Submission Approved', value: 2},
        {label: 'Submission Rejected', value: 3},
    ];

    constructor(props) {
        super(props);
        this.onUpdateBody = this._handlePartialUpdate('body');
        this.onUpdateSubject = this._handlePartialUpdate('subject');
    }

    _handlePartialUpdate = key => value => {
        this.props.onUpdate({[key]: value});
    };

    fillWithTemplate = uid => {
        let {templates} = this.props;
        const selectedBase = templates.find(t => t.uid === uid);
        this.onUpdateSubject(selectedBase.subject);
        this.editor.replaceAll(selectedBase.body);
    };

    updateSendSchedule = ({relativeBase, daysOffset}) => {
        this.props.onUpdate({relativeBase, daysOffset});
    };

    render() {
        const {step, stepNumber, errors, onDelete, templates = []} = this.props;

        const DropdownComponent = templates.length > 5 ? FilterableDropdownList : DropdownList;

        return (
            <Box mb={4}>
                <Flex flexDirection='row' alignItems='center' justifyContent='space-between' p={2}>
                    <BoxLabel color='#a4a4a4'>Step {stepNumber}</BoxLabel>
                    <Flex flexDirection='row' justifyContent='flex-end' alignItems='center'>
                        <Box>
                            <DropdownComponent
                                label='Fill from template'
                                onValueChanged={this.fillWithTemplate}
                                options={templates.map(({name, uid}) => ({
                                    label: name,
                                    value: uid,
                                }))}
                            />
                        </Box>
                    </Flex>
                </Flex>

                <StepWrapper>
                    <Flex justifyContent='space-between' mb={2}>
                        <Flex flex={1}>
                            <RelativeScheduler
                                relativeBase={step.relativeBase}
                                daysOffset={step.daysOffset}
                                onValueChanged={this.updateSendSchedule}
                            />
                            <BoxLabel ml={2}>if</BoxLabel>
                            <Box ml={2}>
                                <DropdownList
                                    manualValue={
                                        this.conditions.find(c => step.condition === c.value).label
                                    }
                                    options={this.conditions}
                                    onValueChanged={condition => {
                                        this.props.onUpdate({condition});
                                    }}
                                />
                            </Box>
                        </Flex>
                        <Box>
                            <ConfirmDropdown
                                onConfirm={() => onDelete(step)}
                                text='Are you sure you want to remove the step?'
                                subText='This action can not be undone.'
                            >
                                <Button>
                                    Remove Step <Icon name='trash' />
                                </Button>
                            </ConfirmDropdown>
                        </Box>
                    </Flex>

                    <Box mb={2}>
                        <TextInput
                            leftLabel='Subject'
                            value={step.subject}
                            onValueChanged={this.onUpdateSubject}
                            error={errors.subject}
                        />
                    </Box>
                    <TemplateEditor
                        ref={el => (this.editor = el)}
                        onContentUpdated={this.onUpdateBody}
                        initialText={step.body || ''}
                        error={errors.body}
                    />
                </StepWrapper>
            </Box>
        );
    }
}
