import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import {Page, Content, Section} from 'components/layout';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import CPanel, {
    CPanelSection,
    CPanelSectionTitle,
    CPanelButton,
} from 'components/basic/cpanel/base';

import CPanelInput from 'components/basic/cpanel/CPanelInput';
import CPanelPopoverChecklist from 'components/basic/cpanel/CPanelPopoverChecklist';
import DataTable from 'components/basic/DataTable';

import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import {H1, H2, H3} from 'components/basic/text';

import {Flex, Box} from '@rebass/grid';
import Button from 'components/basic/forms/Button';

import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';

import {backend_date} from 'src/libs/Formatters';

import TextField from 'components/basic/forms/input/TextField';

import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';
import * as Utils from 'src/libs/Utils';

const ToolbarConfirm = styled(ConfirmDropdown)`
    float: right;
    height: 100%;
`;

const getValue = (value, options, key = 'label') => {
    const option = options.find(o => o.value === value);

    return option && option[key];
};

const uniqueValues = values => Array.from(new Set(values));

const ValueForm = ({values, errors, onValueChanged, textGroups, textSpecs, attributes}) => {
    const label = getValue(values.specUid, textSpecs);
    const groupLabel = getValue(values.groupUid, textGroups);

    const attributeUid = getValue(values.specUid, textSpecs, 'attributeUid');

    const attribute = attributeUid ? attributes[attributeUid] : null;

    return (
        <Box>
            <Flex width={1} mt={3}>
                <Box width={1 / 2} p={1}>
                    <H3>Group</H3>
                    <FilterableDropdownList
                        onValueChanged={value => onValueChanged('groupUid', value)}
                        options={textGroups}
                        placeholder={textGroups.length ? undefined : 'No groups available'}
                        manualValue={groupLabel}
                        error={errors.groupUid}
                    />
                </Box>
                <Box width={1 / 2} p={1}>
                    <H3>Field</H3>
                    <FilterableDropdownList
                        onValueChanged={value => onValueChanged('specUid', value)}
                        options={textSpecs}
                        placeholder={textSpecs.length ? undefined : 'No specs available'}
                        manualValue={label}
                        error={errors.specUid}
                    />
                </Box>
                <Box width={1 / 2} p={1}>
                    <H3>As of</H3>
                    <DatePickerDropdown
                        value={values.asOfDate}
                        onChange={value => onValueChanged('asOfDate', value)}
                        error={errors.asOfDate}
                    />
                </Box>
            </Flex>
            <Box width={1} p={1} mt={3}>
                <H3>Value</H3>
                {attribute ? (
                    <FilterableDropdownList
                        onValueChanged={value => onValueChanged('value', value)}
                        options={Object.values(attribute.members).map(m => ({
                            value: m.name,
                            label: m.name,
                        }))}
                        value={values.value}
                        placeholder='Please select one'
                        error={errors.value}
                    />
                ) : (
                    <TextField
                        height={150}
                        placeholder='Enter value'
                        autoGrow
                        value={values.value}
                        onValueChanged={value => onValueChanged('value', value)}
                        debounceValueChange={false}
                        error={errors.value}
                    />
                )}
            </Box>
        </Box>
    );
};

const ValueModal = ({
    isOpen,
    toggleModal,
    onSave,
    onValueChanged,
    values,
    errors,
    title,
    subTitle,
    textGroups = [],
    textSpecs = {},
    attributes = {},
}) => {
    const specs = textSpecs[values.groupUid] || [];

    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column'>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>
                        <H1>{title}</H1>
                        {subTitle && <H2>{subTitle}</H2>}
                    </Box>
                </ModalHeader>
                <ValueForm
                    values={values}
                    onValueChanged={onValueChanged}
                    errors={errors}
                    textGroups={textGroups}
                    textSpecs={specs}
                    attributes={attributes}
                />
                <Flex mt={3} justifyContent='flex-end'>
                    <Button mr={1} onClick={toggleModal}>
                        Cancel
                    </Button>
                    <Button primary onClick={onSave}>
                        Save
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
};

class TextValuesCPanel extends React.Component {
    static propTypes = {
        setMode: PropTypes.func.isRequired,
        activeMode: PropTypes.string.isRequired,
    };

    render() {
        const {
            setMode,
            activeMode,
            modes,
            filterValues,
            onFilterChanged,
            groups,
            asOfDates,
            clearFilters,
        } = this.props;

        return (
            <CPanel>
                <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                <CPanelSection>
                    <CPanelSectionTitle>Filter</CPanelSectionTitle>
                    <CPanelInput
                        placeholder='Label...'
                        value={filterValues.name || ''}
                        onChange={e => onFilterChanged('name', e.target.value)}
                    />
                    <CPanelPopoverChecklist
                        label='Group'
                        options={groups}
                        selectedValues={filterValues.groups}
                        onValueChanged={v => onFilterChanged('groups', v)}
                        emptyText='No groups available'
                    />
                    <CPanelPopoverChecklist
                        label='As of'
                        options={asOfDates}
                        selectedValues={filterValues.asOfDates}
                        onValueChanged={v => onFilterChanged('asOfDates', v)}
                        emptyText='No dates available'
                    />
                    <CPanelButton onClick={clearFilters}>Clear All</CPanelButton>
                </CPanelSection>
            </CPanel>
        );
    }
}

const EditButton = styled.button`
    font-size: 12px;
    padding: 2px 14px;
    color: ${({theme}) => theme.button.table.fg};
    background-color: ${({theme}) => theme.button.table.bg};
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.1);
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    white-space: nowrap;
    border-radius: 4px;
    user-select: none;
    border: none;

    &:hover {
        background-color: ${({theme}) => theme.button.table.bgHover};
    }
`;

const generateValueKey = (specUid, asOfDate) => `${specUid}:${asOfDate}`;

class TextValues extends React.Component {
    state = {
        filterValues: {},
        selection: [],
        modalKey: null,
        formValues: {},
        formErrors: {},
    };

    toggleModal = modalKey => () => {
        this.setState(state => ({modalKey: state.modalKey === modalKey ? null : modalKey}));
    };

    renderTable = () => (
        <DataTable
            rowKey='uid'
            rows={this.filteredValues()}
            enableSelection
            onSelectionChanged={selection => this.setState({selection})}
            isLoading={this.props.isLoading}
            rowsAreFiltered={this.hasFilter()}
            enableContextHeader
            label='Text Values'
            columns={[
                {
                    label: 'Group',
                    key: 'spec:group:label',
                },
                {
                    label: 'Label',
                    key: 'spec:label',
                },
                {
                    key: 'value',
                    label: 'Value',
                },
                {
                    key: 'as_of_date',
                    label: 'As of',
                    format: 'backend_date',
                    right: true,
                },
                {
                    key: 'uid',
                    disableSort: true,
                    cellRenderer: ({rowData}) => (
                        <Flex justifyContent='center'>
                            <EditButton onClick={() => this.openEditValueModal(rowData)}>
                                Edit
                            </EditButton>
                        </Flex>
                    ),
                    width: 150,
                },
            ]}
        />
    );

    filteredValues = () => {
        return this.props.textValues.filter(item => {
            const nameFilter = this.state.filterValues.name || '';

            if (!item.spec.label.toLowerCase().includes(nameFilter.toLowerCase())) {
                return false;
            }

            const groups = this.state.filterValues.groups;

            if (groups && groups.length && groups.indexOf(item.spec.group.label) === -1) {
                return false;
            }

            const asOfDates = this.state.filterValues.asOfDates;

            if (asOfDates && asOfDates.length && asOfDates.indexOf(item.as_of_date) === -1) {
                return false;
            }

            return true;
        });
    };

    hasFilter = () => {
        const {groups, asOfDates, name} = this.state.filterValues;

        return !!name || (groups && groups.length) || (asOfDates && asOfDates.length);
    };

    handleFilterChanged = (key, value) =>
        this.setState(prevState => ({filterValues: {...prevState.filterValues, [key]: value}}));

    handleClearFilters = () => {
        this.setState({filterValues: {}});
    };

    handleValueChanged = (key, value) =>
        this.setState(({formValues}) => {
            const newValues = {...formValues, [key]: value};

            if (key === 'groupUid') {
                // Reset spec and text value when changing group
                newValues.specUid = this.getDefaultValues(value).specUid;
                newValues.value = '';
            }

            if (key === 'specUid') {
                // Reset text value when changing spec
                newValues.value = '';
            }

            return {formValues: newValues};
        });

    openEditValueModal = activeValue => {
        this.setState({
            formValues: {
                uid: activeValue.uid,
                value: activeValue.value,
                asOfDate: Utils.epoch_to_date(activeValue.as_of_date),
                specUid: activeValue.spec.uid,
                groupUid: activeValue.spec.group.uid,
            },
            formErrors: {},
            modalKey: 'editValue',
        });
    };

    getDefaultValues = (groupUid = null) => {
        const {textGroups, textSpecs} = this.props.options;

        const today = new Date();

        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        const defaults = {
            value: '',
            asOfDate: new Date(today.getFullYear(), today.getMonth(), lastDayOfMonth),
            groupUid,
            specUid: null,
        };

        if (!defaults.groupUid && textGroups.length) {
            defaults.groupUid = textGroups[0].value;
        }

        const specs = textSpecs[defaults.groupUid] || [];

        if (specs.length) {
            defaults.specUid = specs[0].value;
        }

        return defaults;
    };

    openAddValueModal = () => {
        this.setState({
            formValues: this.getDefaultValues(),
            formErrors: {},
            modalKey: 'addValue',
        });
    };

    validate({uid, value, groupUid, specUid, asOfDate}, existingValues) {
        const errors = {};

        if (!value.length) {
            errors.value = 'Value is required';
        }

        if (!groupUid) {
            errors.groupUid = 'Group is required';
        }

        if (!specUid) {
            errors.specUid = 'Field is required';
        }

        if (!asOfDate) {
            errors.specUid = 'As of date is required';
        }

        if (!uid) {
            // It's a new value
            const existingKeys = new Set(
                existingValues.map(v => generateValueKey(v.spec.uid, v.as_of_date)),
            );

            if (existingKeys.has(generateValueKey(specUid, Utils.date_to_epoch(asOfDate)))) {
                errors.value = 'A value for this field and as of date already exists';
            }
        }

        return errors;
    }

    handleSave = () => {
        const {onUpdateValue, onAddValue, textValues} = this.props;

        const errors = this.validate(this.state.formValues, textValues);

        if (Utils.is_set(errors, true)) {
            this.setState({formErrors: errors});
            return;
        }

        this.setState({modalKey: null});

        const {uid, value, specUid, asOfDate} = this.state.formValues;

        if (uid) {
            onUpdateValue({uid, specUid, value, asOfDate});
        } else {
            onAddValue({specUid, value, asOfDate});
        }
    };

    handleDeleteValues = () => {
        const {onDeleteValues} = this.props;
        const {selection} = this.state;

        onDeleteValues({uids: selection});
    };

    render() {
        const {setMode, activeMode, modes, textValues, options, attributes} = this.props;
        const {filterValues, modalKey, selection, formValues, formErrors} = this.state;

        const noSelection = !selection.length;

        const groups = uniqueValues(textValues.map(item => item.spec.group.label)).map(v => ({
            label: v,
            value: v,
        }));

        const asOfDates = uniqueValues(textValues.map(item => item.as_of_date)).map(v => ({
            label: backend_date(v),
            value: v,
        }));

        return (
            <Page>
                <ValueModal
                    isOpen={modalKey == 'addValue'}
                    values={formValues}
                    errors={formErrors}
                    title='Add Text Value'
                    toggleModal={this.toggleModal('addValue')}
                    onSave={this.handleSave}
                    onValueChanged={this.handleValueChanged}
                    textGroups={options.textGroups}
                    textSpecs={options.textSpecs}
                    attributes={attributes}
                />
                <ValueModal
                    isOpen={modalKey == 'editValue'}
                    values={formValues}
                    errors={formErrors}
                    title='Edit Text Value'
                    toggleModal={this.toggleModal('editValue')}
                    onSave={this.handleSave}
                    onValueChanged={this.handleValueChanged}
                    textGroups={options.textGroups}
                    textSpecs={options.textSpecs}
                    attributes={attributes}
                />
                <TextValuesCPanel
                    activeMode={activeMode}
                    setMode={setMode}
                    filterValues={filterValues}
                    onFilterChanged={this.handleFilterChanged}
                    clearFilters={this.handleClearFilters}
                    groups={groups}
                    asOfDates={asOfDates}
                    modes={modes}
                />
                <Content>
                    <Toolbar flex>
                        <ToolbarItem
                            key='addValue'
                            onClick={() => this.openAddValueModal()}
                            icon='plus'
                            glyphicon
                            right
                        >
                            Add Value
                        </ToolbarItem>
                        <ToolbarConfirm
                            disabled={noSelection}
                            key='deleteValues'
                            onConfirm={this.handleDeleteValues}
                            text='Are you sure you want to delete the selected values?'
                            subText='This action cannot be undone.'
                        >
                            <ToolbarItem icon='trash' glyphicon disabled={noSelection}>
                                Delete Selected
                            </ToolbarItem>
                        </ToolbarConfirm>
                    </Toolbar>
                    <Section>{this.renderTable()}</Section>
                </Content>
            </Page>
        );
    }
}

export default TextValues;
