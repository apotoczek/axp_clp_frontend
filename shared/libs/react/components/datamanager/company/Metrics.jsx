import React, {useState} from 'react';
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
import DataTable from 'components/basic/DataTable';

import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import {H1, H2} from 'components/basic/text';

import {Flex, Box} from '@rebass/grid';
import Button from 'components/basic/forms/Button';

import {ModalHeader} from 'components/reporting/shared';
import Modal, {ModalContent} from 'components/basic/Modal';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';
import AddMetricModal from 'components/metrics/AddMetricModal';

const ToolbarConfirm = styled(ConfirmDropdown)`
    float: right;
    height: 100%;
`;

const SetCurrencyModal = ({isOpen, toggleModal, onSave, currencies}) => {
    const [currencyId, setCurrencyId] = useState(0);

    const label = currencies[currencyId];

    return (
        <Modal openStateChanged={toggleModal} isOpen={isOpen}>
            <ModalContent flexDirection='column'>
                <ModalHeader width={1} pb={2} mb={3}>
                    <Box width={2 / 3}>
                        <H1>Set Currency</H1>
                        <H2>for metric sets</H2>
                    </Box>
                </ModalHeader>
                <Box mt={3}>
                    <FilterableDropdownList
                        onValueChanged={setCurrencyId}
                        options={Object.entries(currencies).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        manualValue={label}
                    />
                    <Flex mt={3} justifyContent='flex-end'>
                        <Button mr={1} onClick={toggleModal}>
                            Cancel
                        </Button>
                        <Button primary onClick={() => onSave(currencyId)}>
                            Save
                        </Button>
                    </Flex>
                </Box>
            </ModalContent>
        </Modal>
    );
};

class MetricsCPanel extends React.Component {
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
            clearFilters,
        } = this.props;

        return (
            <CPanel flex>
                <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                <CPanelSection>
                    <CPanelSectionTitle>Filter</CPanelSectionTitle>
                    <CPanelInput
                        placeholder='Metric...'
                        value={filterValues.name || ''}
                        onChange={e => onFilterChanged('name', e.target.value)}
                    />
                    <CPanelButton onClick={clearFilters}>Clear All</CPanelButton>
                </CPanelSection>
            </CPanel>
        );
    }
}

class Metrics extends React.Component {
    state = {
        filterValues: {},
        selection: [],
        modalKey: null,
    };

    toggleModal = modalKey => () => {
        this.setState({modalKey: this.state.modalKey === modalKey ? null : modalKey});
    };

    renderTable = () => (
        <DataTable
            rowKey='uid'
            rows={this.filteredSets()}
            enableSelection
            onSelectionChanged={selection => this.setState({selection})}
            rowSelectablePredicate={({calculated}) => !calculated}
            isLoading={this.props.isLoading}
            rowsAreFiltered={this.hasFilter()}
            enableContextHeader
            label='Metrics'
            columns={[
                {
                    label: 'Metric',
                    key: 'metric_name',
                    link: '/data-manager/<link>',
                    flexShrink: 0,
                    flexGrow: 1,
                    width: 350,
                },
                {
                    key: 'metric_version_name',
                    label: 'Version',
                    width: 100,
                },
                {
                    key: 'base_currency',
                    label: 'Currency',
                    width: 100,
                },
            ]}
        />
    );

    filteredSets = () => {
        return this.props.metricSets
            .map(set => ({
                ...set,
                link: set.calculated
                    ? `calculated-metric-sets/${[
                          set.company_uid,
                          set.metric_uid,
                          set.frequency,
                          set.time_frame,
                          set.metric_version_uid,
                      ].join('/')}`
                    : `metric-sets/${set.uid}`,
            }))
            .filter(metric => {
                const nameFilter = this.state.filterValues.name || '';

                return metric.metric_name.toLowerCase().includes(nameFilter.toLowerCase());
            });
    };

    hasFilter = () => !!this.state.filterValues.name;

    handleFilterChanged = (key, value) => {
        const filterValues = {...this.state.filterValues};

        filterValues[key] = value;

        this.setState({filterValues});
    };

    handleClearFilters = () => {
        this.setState({filterValues: {}});
    };

    handleSetCurrency = currencyId => {
        const {updateSets} = this.props;
        const {selection} = this.state;

        updateSets({uids: selection, currencyId});
    };

    handleDeleteMetrics = () => {
        const {deleteSets} = this.props;
        const {selection} = this.state;

        deleteSets({uids: selection});
    };

    render = () => {
        const {setMode, activeMode, downloadMetrics, upload, options, modes, company} = this.props;
        const {filterValues, selection, modalKey} = this.state;

        const noSelection = !selection.length;

        return (
            <Page>
                <SetCurrencyModal
                    currencies={options.currencies}
                    isOpen={modalKey == 'setCurrency'}
                    toggleModal={this.toggleModal('setCurrency')}
                    onSave={this.handleSetCurrency}
                />
                <AddMetricModal
                    companyUid={company?.uid}
                    isOpen={modalKey === 'addMetric'}
                    toggleModal={this.toggleModal('addMetric')}
                />
                <MetricsCPanel
                    activeMode={activeMode}
                    setMode={setMode}
                    filterValues={filterValues}
                    onFilterChanged={this.handleFilterChanged}
                    clearFilters={this.handleClearFilters}
                    modes={modes}
                />
                <Content>
                    <Toolbar flex>
                        <ToolbarItem
                            key='downloadMetrics'
                            onClick={downloadMetrics}
                            icon='edit'
                            glyphicon
                            left
                        >
                            Download Editing Spreadsheet
                        </ToolbarItem>
                        <ToolbarItem key='upload' onClick={upload} icon='upload' left>
                            Upload
                        </ToolbarItem>
                        <ToolbarConfirm
                            disabled={noSelection}
                            key='deleteSets'
                            onConfirm={this.handleDeleteMetrics}
                            text='Are you sure you want to delete the selected metrics?'
                            subText='This action cannot be undone.'
                        >
                            <ToolbarItem icon='trash' glyphicon disabled={noSelection}>
                                Delete Selected
                            </ToolbarItem>
                        </ToolbarConfirm>
                        <ToolbarItem
                            onClick={this.toggleModal('addMetric')}
                            icon='plus'
                            glyphicon
                            right
                        >
                            Add Metric Value
                        </ToolbarItem>
                        <ToolbarItem
                            key='setCurrency'
                            onClick={this.toggleModal('setCurrency')}
                            icon='edit'
                            glyphicon
                            right
                            disabled={noSelection}
                        >
                            Set Currency
                        </ToolbarItem>
                    </Toolbar>
                    <Section>{this.renderTable()}</Section>
                </Content>
            </Page>
        );
    };
}

export default Metrics;
