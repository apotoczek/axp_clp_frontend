import React, {useState, useMemo, useCallback, useEffect} from 'react';
import styled from 'styled-components';
import {useBackendData} from 'utils/backendConnect';
import {callActionEndpoint, formPost, dataThing} from 'api';
import config from 'config';

import {Page, Content, Section} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Description} from 'components/basic/text';

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

    const [hasTriggered, setHasTriggered] = useState(false);
    useEffect(() => setHasTriggered(false), [isOpen]);

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
                        {hasTriggered ? (
                            <Description>Updating currencies, please wait</Description>
                        ) : (
                            <>
                                <Button mr={1} onClick={toggleModal}>
                                    Cancel
                                </Button>
                                <Button
                                    primary
                                    onClick={() => {
                                        setHasTriggered(true);
                                        onSave(currencyId);
                                    }}
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </Flex>
                </Box>
            </ModalContent>
        </Modal>
    );
};

function MetricsCPanel({setMode, activeMode, modes, filterValues, onFilterChanged, clearFilters}) {
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

function getMetricSetLink(metricSet, companyUid, linkTarget = 'analytics') {
    if (linkTarget === 'analytics') {
        if (metricSet.calculated) {
            return `company-analytics/${companyUid}/calculated-metric-sets/${[
                metricSet.metric_uid,
                metricSet.frequency,
                metricSet.time_frame,
                metricSet.metric_version_uid,
            ].join('/')}`;
        }
        return `company-analytics/${companyUid}/metric-sets/${metricSet.uid}`;
    }
    if (metricSet.calculated) {
        return `data-manager/calculated-metric-sets/${[
            metricSet.company_uid,
            metricSet.metric_uid,
            metricSet.frequency,
            metricSet.time_frame,
            metricSet.metric_version_uid,
        ].join('/')}`;
    }
    return `data-manager/metric-sets/${metricSet.uid}`;
}

function CompanyMetricSets({
    isLoading,
    company,
    modes,
    setMode,
    activeMode,
    options,
    showUploadWizard,
    linkTarget, //One of ['analytics', 'data-manager'], default analytics
}) {
    const [modalKey, setModalKey] = useState(null);
    const toggleModal = key => () => setModalKey(key === modalKey ? null : key);

    const [selection, setSelection] = useState([]);
    const [filterValues, setFilterValues] = useState({});

    const {
        data: {metric_sets: metricSets},
        isLoadingMetricSets,
    } = useBackendData(
        'metric/sets/list_for_company',
        {company_uid: company.uid},
        {initialData: {metric_sets: []}},
    );

    const filteredSets = useMemo(
        () =>
            metricSets
                .map(set => ({
                    ...set,
                    link: getMetricSetLink(set, company.uid, linkTarget),
                }))
                .filter(metric => {
                    const nameFilter = filterValues.name || '';
                    return metric.metric_name.toLowerCase().includes(nameFilter.toLowerCase());
                }),
        [metricSets, company.uid, linkTarget, filterValues.name],
    );

    const hasFilter = !!filterValues.name?.length;

    const updateSets = useCallback(({uids, timeFrame, currencyId}) => {
        let metric_sets = uids.map(uid => {
            const item = {uid};
            if (timeFrame !== undefined) {
                item.time_frame = timeFrame;
            }
            if (currencyId !== undefined) {
                item.base_currency_id = currencyId;
            }
            return item;
        });
        return callActionEndpoint('useractionhandler/update_metric_sets', {metric_sets});
    }, []);

    const downloadMetrics = useCallback(() => {
        return callActionEndpoint('useractionhandler/prepare_metrics_template', {
            company_uids: [company.uid],
        }).then(key => formPost(`${config.download_file_base}${key}`));
    }, [company]);

    const handleFilterChanged = (key, value) => setFilterValues({...filterValues, [key]: value});
    const handleClearFilters = () => setFilterValues({});

    const handleSetCurrency = currencyId => {
        updateSets({uids: selection, currencyId}).then(() => {
            setModalKey(null);
            dataThing.statusCheck();
        });
    };

    const handleDeleteMetrics = useCallback(
        () =>
            callActionEndpoint('useractionhandler/delete_metric_sets', {
                metric_set_uids: selection,
            }).then(() => dataThing.statusCheck()),
        [selection],
    );

    const noSelection = !selection.length;

    return (
        <Page>
            <SetCurrencyModal
                currencies={options.currencies}
                isOpen={modalKey == 'setCurrency'}
                toggleModal={toggleModal('setCurrency')}
                onSave={handleSetCurrency}
            />
            <AddMetricModal
                companyUid={company?.uid}
                isOpen={modalKey === 'addMetric'}
                toggleModal={toggleModal('addMetric')}
            />
            <MetricsCPanel
                activeMode={activeMode}
                setMode={setMode}
                filterValues={filterValues}
                onFilterChanged={handleFilterChanged}
                clearFilters={handleClearFilters}
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
                    <ToolbarItem key='upload' onClick={showUploadWizard} icon='upload' left>
                        Upload
                    </ToolbarItem>
                    <ToolbarConfirm
                        disabled={noSelection}
                        key='deleteSets'
                        onConfirm={handleDeleteMetrics}
                        text='Are you sure you want to delete the selected metrics?'
                        subText='This action cannot be undone.'
                    >
                        <ToolbarItem icon='trash' glyphicon disabled={noSelection}>
                            Delete Selected
                        </ToolbarItem>
                    </ToolbarConfirm>
                    <ToolbarItem onClick={toggleModal('addMetric')} icon='plus' glyphicon right>
                        Add Metric Value
                    </ToolbarItem>
                    <ToolbarItem
                        key='setCurrency'
                        onClick={toggleModal('setCurrency')}
                        icon='edit'
                        glyphicon
                        right
                        disabled={noSelection}
                    >
                        Set Currency
                    </ToolbarItem>
                </Toolbar>
                <Section>
                    <DataTable
                        rowKey='uid'
                        rows={filteredSets}
                        enableSelection
                        onSelectionChanged={setSelection}
                        rowSelectablePredicate={({calculated}) => !calculated}
                        isLoading={isLoading || isLoadingMetricSets}
                        rowsAreFiltered={hasFilter}
                        enableContextHeader
                        label='Metrics'
                        columns={[
                            {
                                label: 'Metric',
                                key: 'metric_name',
                                link: '<link>',
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
                </Section>
            </Content>
        </Page>
    );
}

export default CompanyMetricSets;
