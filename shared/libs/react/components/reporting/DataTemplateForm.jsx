import React, {useState} from 'react';
import styled from 'styled-components';

import {Box, Flex} from '@rebass/grid';
import {H3, Description} from 'components/basic/text';

import TextInput from 'components/basic/forms/input/TextInput';

import TextDropdown from 'components/basic/forms/dropdowns/TextDropdown';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import MetricList from 'components/reporting/MetricList';
import {array_move} from 'src/libs/Utils';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Icon from 'components/basic/Icon';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';
import {MetricVersionType} from 'src/libs/Enums';
import {ErrorDescription} from 'components/basic/forms/base';
import TextBlock from 'components/basic/TextBlock';
import Checkbox from 'components/basic/forms/Checkbox';
import Button from 'components/basic/forms/Button';
import * as MetaTable from 'components/reporting/MetaDataTable';

function addMetric(metric, metrics) {
    return {
        metrics: [...metrics, {required: false, metric}],
    };
}

function toggleRequired(index, metrics) {
    const newMetrics = [...metrics];

    const metric = newMetrics[index];

    newMetrics[index] = {...metric, required: !metric.required};

    return {metrics: newMetrics};
}

function removeMetric(index, metrics) {
    const newMetrics = [...metrics];

    newMetrics.splice(index, 1);

    return {metrics: newMetrics};
}

const moveMetric = (oldIdx, newIdx, metrics) => ({metrics: array_move(metrics, oldIdx, newIdx)});

const Well = styled(Box)`
    padding: 10px;
    border: 1px solid rgb(190, 194, 213);
    border-radius: 3px;
    position: relative;
`;

const Separator = styled.div`
    border-right: 1px solid rgb(190, 194, 213);
    margin: 20px 6px;
`;

const DashedWell = styled(Well)`
    border: 2px dashed rgb(190, 194, 213);
    padding: 20px;
`;

const Help = styled(Box)`
    padding: 10px;
    color: rgb(68, 68, 68);
`;

const PlainCheckboxWrapper = styled.span`
    cursor: pointer;
    user-select: none;
    &::after {
        content: ' ';
    }
`;

const PlainCheckbox = ({checked, onValueChanged, children}) => (
    // Special checkbox without a surrounding box
    <PlainCheckboxWrapper onClick={() => onValueChanged(!checked)}>
        <Icon name={checked ? 'check' : 'check-empty'} checked={checked} /> {children}
    </PlainCheckboxWrapper>
);
const Label = styled(Box)`
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    color: #566174;
    visibility: ${({invisible}) => (invisible ? 'hidden' : 'visible')};
`;

function LabeledBox({children, label, hideLabel, ...rest}) {
    // We can use `hideLabel` to use this component to align non-labeled elements
    return (
        <Box {...rest}>
            <Label invisible={hideLabel}>{label}</Label>
            {children}
        </Box>
    );
}

const SheetSettings = ({versionType, sheet, updateSheet, options}) =>
    versionType === MetricVersionType.Backward ? (
        <BackwardLookingSettings updateSheet={updateSheet} sheet={sheet} options={options} />
    ) : (
        <ForwardLookingSettings updateSheet={updateSheet} sheet={sheet} options={options} />
    );
const HelpCircle = ({children}) => (
    <TextDropdown content={children}>
        <Icon name='help-circled' />
    </TextDropdown>
);
const ForwardLookingSettings = ({sheet, updateSheet, options}) => (
    <div>
        <Label mb={2}>
            Forecast Forward{' '}
            <HelpCircle>
                Select the number of months of data you would like submitted in the template
            </HelpCircle>
        </Label>
        <DropdownList
            small
            manualValue={getLabel(sheet.collectMonths, options.collect)}
            options={options.collect}
            onValueChanged={value => updateSheet({collectMonths: value})}
        />
    </div>
);
const BackwardLookingSettings = ({sheet, updateSheet, options}) => (
    <div>
        <Label mb={2}>
            Collect{' '}
            <HelpCircle>
                Select the number of months of data you would like submitted in the template
            </HelpCircle>
        </Label>
        <DropdownList
            small
            manualValue={getLabel(sheet.collectMonths, options.collect)}
            options={options.collect}
            onValueChanged={value => updateSheet({collectMonths: value})}
        />
        <Label mb={2} mt={3}>
            <PlainCheckbox
                checked={sheet.enableBackfill}
                onValueChanged={value => updateSheet({enableBackfill: value})}
            >
                Include Historical Data
            </PlainCheckbox>
            <HelpCircle>
                With this option checked, the template will include read only fields of historic
                data for data validation purposes.
            </HelpCircle>
        </Label>
        <DropdownList
            small
            disabled={!sheet.enableBackfill}
            manualValue={getLabel(sheet.backfillMonths, options.backfill)}
            options={options.backfill}
            onValueChanged={value => updateSheet({backfillMonths: value})}
        />
    </div>
);
const Heading = styled.div`
    margin: 0 5px 8px;
    font-weight: 500;
    font-size: 20px;
    letter-spacing: 1px;
    color: #4a4a4a;
`;

const RemoveVersion = styled.div`
    color: #7b869a;
    font-size: 12px;
    margin-top: 10px;
    cursor: pointer;
    user-select: none;
`;

const SheetForm = ({idx, sheets, onValueChanged, options}) => {
    const sheet = sheets[idx];

    const metricVersion = sheet.metricVersion;

    const updateSheet = updates => {
        const newSheets = [...sheets];

        newSheets[idx] = {...sheet, ...updates};

        onValueChanged(newSheets);
    };

    const removeSheet = () => {
        const newSheets = [...sheets];

        newSheets.splice(idx, 1);

        onValueChanged(newSheets);
    };

    const metricUids = sheet.metrics.map(m => m.metric.uid);

    return (
        <SheetWrapper mt={2}>
            <Flex justifyContent='space-between'>
                <Heading>{metricVersion.name}</Heading>
                <ConfirmDropdown
                    onConfirm={removeSheet}
                    text='Are you sure you want to remove the version?'
                    subText='All unsaved changes to this version will be lost.'
                >
                    <RemoveVersion>
                        Remove <Icon name='cancel-circled' />
                    </RemoveVersion>
                </ConfirmDropdown>
            </Flex>

            <Well>
                <Flex justifyContent='space-between'>
                    <Box flexBasis={300} p={3}>
                        <SheetSettings
                            versionType={metricVersion.versionType}
                            updateSheet={updateSheet}
                            sheet={sheet}
                            options={options}
                        />
                    </Box>
                    <Separator />
                    <Box flex={1} p={3}>
                        <FilterableDropdownList
                            my={3}
                            label='Add Metric'
                            labelKey='baseMetricName'
                            valueKey='uid'
                            subLabelKey='reportingPeriod'
                            options={options.metrics.filter(m => metricUids.indexOf(m.uid) === -1)}
                            onValueChanged={uid =>
                                updateSheet(
                                    addMetric(
                                        options.metrics.find(m => m.uid == uid),
                                        sheet.metrics,
                                    ),
                                )
                            }
                        />
                        <MetricList
                            metrics={sheet.metrics}
                            onRemove={index => updateSheet(removeMetric(index, sheet.metrics))}
                            onToggleRequired={index =>
                                updateSheet(toggleRequired(index, sheet.metrics))
                            }
                            onMove={(oldIdx, newIdx) =>
                                updateSheet(moveMetric(oldIdx, newIdx, sheet.metrics))
                            }
                        />
                    </Box>
                </Flex>
            </Well>
        </SheetWrapper>
    );
};

const SheetWrapper = styled(Flex)`
    flex-direction: column;
`;

const SheetsWrapper = styled(Flex)`
    overflow-x: auto;
    flex-direction: column;
`;

const MetricSelector = ({onValueChanged, sheets, options}) => {
    const versionUids = sheets.map(s => s.metricVersion.uid);
    const filteredOptions = options.metricVersions.filter(v => versionUids.indexOf(v.uid) === -1);
    return (
        <SheetsWrapper>
            {sheets.map((sheet, idx) => (
                <SheetForm
                    key={sheet.metricVersion.uid}
                    sheets={sheets}
                    idx={idx}
                    options={options}
                    onValueChanged={onValueChanged}
                />
            ))}
            <SheetWrapper key='new'>
                <DashedWell mt={36} maxWidth={545}>
                    <DropdownList
                        labelKey='name'
                        label={versionUids.length ? 'Add additional version' : 'Add version'}
                        options={filteredOptions}
                        disabled={filteredOptions.length === 0}
                        broadcastFullOption
                        onValueChanged={version => onValueChanged([...sheets, addVersion(version)])}
                    />
                    <Help>
                        A version represents the scenario for which you would like to collect
                        metrics. Each version will be its own tab in the template spreadsheet.
                    </Help>
                </DashedWell>
            </SheetWrapper>
        </SheetsWrapper>
    );
};

const DEFAULT_SHEET = {
    metrics: [],
    collectMonths: 3,
    backfillMonths: 6,
    enableBackfill: false,
};

function addVersion(version) {
    return {
        ...DEFAULT_SHEET,
        metricVersion: version,
    };
}

function getLabel(value, options) {
    const option = options.find(o => o.value === value);

    return option && option.label;
}

const StyledTextBlock = styled(TextBlock)`
    display: flex;
    flex-direction: column-reverse;

    .ql-toolbar {
        margin: 0;
        max-width: 640px;
        background-color: rgb(239, 241, 249);
        border: 1px solid rgb(190, 194, 213) !important;
        border-bottom-width: 0 !important;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
    }

    .quill {
        padding: 12px;

        border-radius: 0 3px 3px;

        background: rgb(252, 253, 255);
        border: 1px solid rgb(190, 194, 213);
    }
`;

function validateFileName(name, editing, {enableSupportingDocuments, supportingDocuments}) {
    if (!enableSupportingDocuments) {
        return '';
    }
    const n = name.trim();
    if (n.length < 1) {
        return 'Required';
    }
    if (supportingDocuments?.some(({name}) => name === n && name !== editing)) {
        return 'Name already exists';
    }

    return '';
}

const DataTemplateForm = ({onValueChanged, options, values = {}, errors = {}}) => {
    return (
        <Flex flexWrap='wrap' pb={5}>
            <Box width={1} p={1} mb={2}>
                <TextInput
                    leftLabel='Name'
                    value={values.name}
                    onValueChanged={value => onValueChanged('name', value)}
                    placeholder='Enter a name for your template'
                    error={errors.name}
                />
            </Box>
            <Box width={1} p={1}>
                <Box px={1}>
                    {errors.sheets && <ErrorDescription>{errors.sheets}</ErrorDescription>}
                    <MetricSelector
                        options={options}
                        onValueChanged={value => onValueChanged('sheets', value)}
                        sheets={values.sheets || []}
                    />
                </Box>
            </Box>
            <Box width={1} p={1} mt={3}>
                <Box p={2}>
                    <H3>What additional information should be requested?</H3>
                    <Description>
                        Add groups of pre-defined attributes and custom text fields to include in
                        the template
                    </Description>
                </Box>
                <Box px={1}>
                    <TextDataPicker
                        includedTextData={values.includedTextData}
                        options={options.textDataGroups}
                        onValueChanged={groups => onValueChanged('includedTextData', groups)}
                    />
                </Box>
            </Box>
            <Box width={1} p={1}>
                <Box p={2}>
                    <H3>Template Instructions</H3>
                    <Description></Description>
                </Box>
                <Box px={1}>
                    <StyledTextBlock
                        className=''
                        isEditing
                        text={values.instructions}
                        onTextChanged={text => onValueChanged('instructions', text)}
                        showToolbar
                    />
                </Box>
            </Box>
            <Box width={1} p={1}>
                <hr />
                <Box p={2}>
                    <H3>Request Supporting Documents</H3>
                    <Description>
                        Let the company know what supporting documents you would like and an
                        optional description of what they should include.
                    </Description>
                </Box>
                <Checkbox
                    maxWidth={350}
                    ml={3}
                    mt={2}
                    leftLabel='Additional Files Required'
                    checked={values.enableSupportingDocuments}
                    onValueChanged={v => onValueChanged('enableSupportingDocuments', v)}
                />

                <SupportingDocuments values={values} onValueChanged={onValueChanged} />
            </Box>
        </Flex>
    );
};

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import {DropdownContent} from 'components/basic/forms/dropdowns/base';

const StyledDropdown = styled(Dropdown)`
    float: right;
    cursor: pointer;
`;

const ActionButton = styled.div`
    width: auto;
    padding: 12px 16px;

    color: ${({theme}) => theme.dropdownOption.fg};

    background: ${({theme}) => theme.dropdownOption.bg};
    &:hover {
        background: ${({theme}) => theme.dropdownOption.hoveredBg};
    }
    border-radius: 3px;
    cursor: pointer;

    font-family: Lato, sans-serif;
    line-height: 21px;

    opacity: ${props => (props.muted ? 0.7 : 1)};

    overflow: auto;
`;

function ActionDropdown({onRemove, children}) {
    return (
        <StyledDropdown
            render={() => (
                <DropdownContent>
                    <ActionButton onClick={onRemove}>Remove</ActionButton>
                </DropdownContent>
            )}
        >
            {children}
        </StyledDropdown>
    );
}

function TextDataTable({label, fields, onRemove}) {
    return (
        <MetaTable.Table>
            <MetaTable.Header>
                {label}
                <ActionDropdown onRemove={onRemove}>
                    <Icon name='angle-circled-down' />
                </ActionDropdown>
            </MetaTable.Header>
            {fields.map(({uid, label: fieldLabel, description}) => (
                <MetaTable.Row key={uid}>
                    <MetaTable.Label>{fieldLabel}</MetaTable.Label>
                    <MetaTable.Value>{description}</MetaTable.Value>
                </MetaTable.Row>
            ))}
        </MetaTable.Table>
    );
}

const DocumentWrapper = styled(Box)`
    opacity: ${({disabled}) => (disabled ? '0.6' : '1')};
`;
const DocumentButton = styled.a`
    cursor: pointer;
    float: right;
    margin: 0 4px;
`;
const DocumentHeader = styled(MetaTable.Header)`
    padding: 0;
`;
const DocumentTable = styled(MetaTable.Table)`
    float: none;
`;
const DocumentRow = styled(Flex)`
    ${({editing}) => (editing ? 'background-color: rgb(208, 237, 228);' : '')}
    border-bottom: 1px solid rgb(190, 194, 213);
    &:last-child {
        border-bottom: none;
    }
`;
const DocumentCell = styled(Flex)`
    border-left: ${({noBorder}) => (noBorder ? '' : '1px solid rgb(190, 194, 213)')};
    &:first-child {
        border-left: none;
    }
`;

export function SupportingDocumentsTable({
    disabled,
    supportingDocuments,
    onEdit,
    editing,
    onRemove,
    ...rest
}) {
    return (
        <DocumentWrapper disabled={disabled} {...rest}>
            {(supportingDocuments?.length || null) && (
                <DocumentTable>
                    <DocumentHeader>
                        <Flex>
                            <DocumentCell px={3} pt={2} pb={1} flex={1}>
                                Name
                            </DocumentCell>
                            <DocumentCell px={3} pt={2} pb={1} flex={2}>
                                Description
                            </DocumentCell>
                            <DocumentCell noBorder py={3} flexBasis={50} />
                            <DocumentCell noBorder py={3} flexBasis={65} mr={1} />
                        </Flex>
                    </DocumentHeader>
                    {supportingDocuments.map(({name, description}) => (
                        <MetaTable.Row key={name}>
                            <DocumentRow editing={!disabled && editing === name}>
                                <DocumentCell px={3} py={2} flex={1}>
                                    {name}
                                </DocumentCell>
                                <DocumentCell px={3} py={2} flex={2}>
                                    {description}
                                </DocumentCell>
                                <DocumentCell noBorder py={2} flexBasis={50}>
                                    {onEdit && (
                                        <DocumentButton onClick={() => onEdit({description, name})}>
                                            Edit
                                        </DocumentButton>
                                    )}
                                </DocumentCell>
                                <DocumentCell noBorder py={2} flexBasis={65} mr={1}>
                                    {onRemove && (
                                        <DocumentButton onClick={() => onRemove(name)}>
                                            Remove
                                        </DocumentButton>
                                    )}
                                </DocumentCell>
                            </DocumentRow>
                        </MetaTable.Row>
                    ))}
                </DocumentTable>
            )}
        </DocumentWrapper>
    );
}

function SupportingDocuments({values, onValueChanged}) {
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [touchedName, setTouchedName] = useState(false);
    const [editing, setEditing] = useState(undefined);

    const edit = ({name, description}) => {
        setNewName(name);
        setNewDescription(description ?? '');
        setEditing(name);
    };

    const cancelEdit = () => {
        setNewName('');
        setNewDescription('');
        setEditing(undefined);
    };

    const acceptEdit = () => {
        setNewName('');
        setNewDescription('');
        setEditing(undefined);
        setTouchedName(false);
        onValueChanged(
            'supportingDocuments',
            values.supportingDocuments.map(v =>
                v.name === editing ? {...v, name: newName, description: newDescription} : v,
            ),
        );
    };

    const add = () => {
        onValueChanged('supportingDocuments', [
            ...(values.supportingDocuments ?? []),
            {name: newName, description: newDescription},
        ]);
        setNewName('');
        setNewDescription('');
        setTouchedName(false);
    };

    const remove = name =>
        onValueChanged(
            'supportingDocuments',
            values.supportingDocuments.filter(v => v.name !== name),
        );

    const nameError = validateFileName(newName, editing, values ?? {});

    return (
        <>
            <Flex flexWrap='wrap' mt={3} mx={3}>
                <LabeledBox label='Requested File Description*' flex={1} mr={3}>
                    <TextInput
                        value={newName}
                        onValueChanged={v => {
                            setTouchedName(true);
                            setNewName(v);
                        }}
                        error={(touchedName && nameError) || ''}
                        disabled={!values.enableSupportingDocuments}
                    />
                </LabeledBox>
                <LabeledBox label='Additional Details (optional)' flex={1} mr={3}>
                    <TextInput
                        value={newDescription}
                        onValueChanged={setNewDescription}
                        disabled={!values.enableSupportingDocuments}
                    />
                </LabeledBox>
                {editing && (
                    <LabeledBox label='*' hideLabel flexBasis={40} mr={3}>
                        <Button onClick={cancelEdit} disabled={!values.enableSupportingDocuments}>
                            Cancel
                        </Button>
                    </LabeledBox>
                )}
                <LabeledBox label='*' hideLabel flexBasis={40}>
                    <Button
                        primary={!!editing}
                        onClick={editing ? acceptEdit : add}
                        disabled={nameError !== '' || !values.enableSupportingDocuments}
                    >
                        {editing ? 'Save' : 'Add'}
                    </Button>
                </LabeledBox>
            </Flex>
            <SupportingDocumentsTable
                disabled={!values.enableSupportingDocuments}
                supportingDocuments={values.supportingDocuments}
                onRemove={values.enableSupportingDocuments && remove}
                onEdit={values.enableSupportingDocuments && edit}
                editing={editing}
                mt={2}
                p={3}
                maxWidth={900}
            />
        </>
    );
}

function TextDataPicker({includedTextData, options, onValueChanged}) {
    const groupUids = includedTextData.map(g => g.uid);

    const filteredOptions = options.filter(g => groupUids.indexOf(g.uid) === -1);

    return (
        <Box>
            <Flex>
                {includedTextData.map(({uid, label, fields}) => (
                    <Box width={1 / 3} key={uid} mr={3}>
                        <TextDataTable
                            label={label}
                            fields={fields}
                            onRemove={() =>
                                onValueChanged(includedTextData.filter(g => g.uid != uid))
                            }
                        />
                    </Box>
                ))}
            </Flex>
            <Flex>
                <Box width={1 / 4} my={3}>
                    <FilterableDropdownList
                        label='Add Existing Group'
                        labelKey='label'
                        valueKey='uid'
                        options={filteredOptions}
                        disabled={filteredOptions.length === 0}
                        onValueChanged={uid =>
                            onValueChanged(
                                includedTextData.concat(options.filter(g => g.uid == uid)),
                            )
                        }
                    />
                </Box>
            </Flex>
        </Box>
    );
}

export default DataTemplateForm;
