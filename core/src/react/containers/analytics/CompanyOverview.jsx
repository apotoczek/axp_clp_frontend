import React, {useState, useCallback, useEffect, useMemo} from 'react';

import {date_to_epoch} from 'src/libs/Utils';
import FiscalYearModal from 'src/react/containers/datamanager/FiscalYearModal';
import Checkbox from 'components/basic/forms/Checkbox';
import Input from 'components/basic/forms/input/Input';
import {Page, ScrollableContent, Content, Section} from 'components/layout';
import CPanelPopoverRadiolist from 'components/basic/cpanel/CPanelPopoverRadiolist';
import {CPanelSection} from 'components/basic/cpanel/base';
import {backend_date} from 'utils/formatters';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import {Box, Flex} from '@rebass/grid';
import * as Utils from 'src/libs/Utils';

import CPanel from 'components/basic/cpanel/base';
import Button from 'components/basic/forms/Button';

import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';

import Icon from 'components/basic/Icon';

import {H3} from 'components/basic/text';
import TextInput from 'components/basic/forms/input/TextInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';

import DealTable from 'components/datamanager/company/DealTable';
import DeleteAttributeModal from 'components/datamanager/company/DeleteAttributeModal';
import EditAttributeModal from 'components/datamanager/company/EditAttributeModal';
import EntityAttributes from 'components/datamanager/company/EntityAttributes';
import AddAttributeModal from 'components/datamanager/company/AddAttributeModal';
import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';
import DealOverview from 'components/DealOverview';
import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import KeyStatsTable from 'containers/analytics/KeyStatsTable';

import {EntityMetaScope} from 'src/libs/Enums';

import Loader from 'components/basic/Loader';

const formatFiscalYear = value => (value ? value.format('{MM}/{date}/{year}') : 'N/A');
const CompanyInformation = ({
    companyName,
    setCompanyName,
    companyCurrency,
    setCompanyCurrency,
    companyFiscalYearEnd,
    options,
    toggleModal,
    normalizeData,
    setNormalizeData,
    errors = {},
}) => {
    return (
        <Flex flexWrap='wrap' mr={22}>
            <Box width={1 / 2} p={1}>
                <TextInput
                    leftLabel='Name'
                    value={companyName}
                    onValueChanged={setCompanyName}
                    error={errors.name}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <Input
                    button
                    label='Fiscal Year End'
                    value={formatFiscalYear(companyFiscalYearEnd).toString()}
                    rightIcon='calendar'
                    onClick={toggleModal('fiscalYear')}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <FilterableDropdownList
                    label='Currency'
                    manualValue={options.currencies[companyCurrency]}
                    options={Object.entries(options.currencies).map(([value, label]) => ({
                        value,
                        label,
                    }))}
                    onValueChanged={setCompanyCurrency}
                    error={errors.base_currency_id}
                />
            </Box>
            <Box width={1 / 2} p={1}>
                <Checkbox
                    leftLabel='Normalize Data with Calendar Year'
                    checked={normalizeData}
                    onValueChanged={setNormalizeData}
                />
            </Box>
        </Flex>
    );
};

function useCPanelFilters({company, currencies}) {
    const [asOfDate, setAsOfDate] = useState(undefined);
    const {data: _asOfDates, hasData: hasAsOfDates} = useBackendData(
        'dataprovider/vehicle_as_of_dates',
        {company_uid: company.uid},
        {initialData: []},
    );
    useEffect(() => {
        if (hasAsOfDates) {
            setAsOfDate(_asOfDates[0]);
        }
    }, [_asOfDates, hasAsOfDates]);
    const asOfDates = useMemo(() => _asOfDates.map(v => ({value: v, label: backend_date(v)})), [
        _asOfDates,
    ]);

    const [metricVersionUid, setMetricVersionUid] = useState(undefined);
    const {data: _metricVersions, hasData: hasMetricVersions} = useBackendData(
        'dataprovider/metric_versions_for_entity',
        {entity_type: 'company', entity_uid: company.uid},
        {initialData: []},
    );
    const metricVersion = metricVersionUid && _metricVersions.find(v => v.uid === metricVersionUid);
    useEffect(() => {
        if (hasMetricVersions) {
            setMetricVersionUid(_metricVersions[0]?.uid);
        }
    }, [_metricVersions, hasMetricVersions]);
    const metricVersions = useMemo(
        () => _metricVersions.map(({uid, name}) => ({value: uid, label: name})),
        [_metricVersions],
    );

    const [currencyId, setCurrencyId] = useState(company.base_currency_id);
    const currency = {value: currencyId, symbol: currencies[currencyId]?.split(' ')[0]};
    const currencyOptions = useMemo(
        () => Object.entries(currencies).map(([k, v]) => ({label: v, value: parseInt(k)})),
        [currencies],
    );

    return {
        cPanelFilterConfig: (
            <CPanelSection>
                <CPanelPopoverRadiolist
                    label='As of'
                    selectedValue={asOfDate}
                    onValueChanged={setAsOfDate}
                    emptyText='No as of dates'
                    options={asOfDates}
                    isLoading={!hasAsOfDates}
                />
                <CPanelPopoverRadiolist
                    label='Metric Version'
                    selectedValue={metricVersionUid}
                    onValueChanged={setMetricVersionUid}
                    emptyText='No metric versions found'
                    options={metricVersions}
                    isLoading={!hasMetricVersions}
                />
                <CPanelPopoverRadiolist
                    label='Currency'
                    selectedValue={currencyId}
                    onValueChanged={setCurrencyId}
                    options={currencyOptions}
                    enableSearch
                />
            </CPanelSection>
        ),
        filterAsOfDate: asOfDate,
        filterMetricVersion: metricVersion,
        filterCurrency: currency,
    };
}

const toEpoch = d => (d ? date_to_epoch(d) : null);

export default function CompanyOverview(props) {
    const [modalKey, setModalKey] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);

    const {company} = props;
    const {fiscalQuarters} = props;

    const [companyName, setCompanyName] = useState(company.name);
    const [companyCurrency, setCompanyCurrency] = useState(company.base_currency_id);
    const [companyFiscalYearEnd, setCompanyFiscalYearEnd] = useState(
        Utils.epoch_to_date(company.fiscal_year_end),
    );
    const [normalizeData, setNormalizeData] = useState(company.normalize_data);

    const [quarterOne, setQuarterOne] = useState(Utils.epoch_to_date(fiscalQuarters.quarter_one));
    const [quarterTwo, setQuarterTwo] = useState(Utils.epoch_to_date(fiscalQuarters.quarter_two));
    const [quarterThree, setQuarterThree] = useState(
        Utils.epoch_to_date(fiscalQuarters.quarter_three),
    );
    const [quarterFour, setQuarterFour] = useState(
        Utils.epoch_to_date(fiscalQuarters.quarter_four),
    );

    const attributesWithoutValues = entity => {
        const {attributes} = props;
        const existingAttribbutes = Object.keys(entity.attributes);
        const filtered = Object.fromEntries(
            Object.entries(attributes).filter(([key, _]) => !existingAttribbutes.includes(key)),
        );
        return filtered;
    };

    const toggleModal = useCallback(
        _modalKey => () => {
            setModalKey(_modalKey === modalKey ? null : _modalKey);
            setSelectedAttribute(null);
        },
        [modalKey],
    );

    const clearModal = () => {
        setModalKey(null);
        setSelectedAttribute(null);
    };

    const clearFiscalModal = () => {
        setModalKey(null);
        setCompanyFiscalYearEnd(Utils.epoch_to_date(company.fiscal_year_end));
        // Resetting the values
        setQuarterOne(Utils.epoch_to_date(fiscalQuarters.quarter_one));
        setQuarterTwo(Utils.epoch_to_date(fiscalQuarters.quarter_two));
        setQuarterThree(Utils.epoch_to_date(fiscalQuarters.quarter_three));
        setQuarterFour(Utils.epoch_to_date(fiscalQuarters.quarter_four));
    };

    const toggleEditModal = attributeUid => () => {
        const _modalKey = 'editCompanyAttribute';
        setModalKey(_modalKey == modalKey ? null : _modalKey);
        setSelectedAttribute(attributeUid);
    };

    const toggleDealEditModal = attributeUid => () => {
        const _modalKey = 'editDealAttribute';
        setModalKey(_modalKey == modalKey ? null : _modalKey);
        setSelectedAttribute(attributeUid);
    };

    const toggleDeleteModal = attributeUid => () => {
        const _modalKey = 'deleteCompanyAttribute';
        setModalKey(_modalKey == modalKey ? null : _modalKey);
        setSelectedAttribute(attributeUid);
    };

    const toggleDealDeleteModal = attributeUid => () => {
        const _modalKey = 'deleteDealAttribute';
        setModalKey(_modalKey == modalKey ? null : _modalKey);
        setSelectedAttribute(attributeUid);
    };

    const {isLoading: isReplacing, triggerEndpoint: replaceAttributeValues} = useBackendEndpoint(
        'useractionhandler/replace_attribute_values',
    );

    const {triggerEndpoint: updateFiscalQuarters} = useBackendEndpoint(
        'useractionhandler/update_fiscal_quarters',
    );

    const {triggerEndpoint: updateCharacteristics} = useBackendEndpoint(
        'useractionhandler/update_company',
    );

    const redirectToAttributesPage = () => {
        window.location.replace('#!/data-manager/attributes');
    };

    const handleCompanySave = leafs => () => {
        replaceAttributeValues({
            attribute_uid: selectedAttribute,
            attribute_member_uids: leafs,
            company_uid: company.uid,
            entity_uid: company.uid,
            entity_type: 'company',
        }).then(() => {
            clearModal();
        });
    };

    const handleCompanyDelete = () => {
        replaceAttributeValues({
            attribute_uid: selectedAttribute,
            attribute_member_uids: [],
            company_uid: company.uid,
            entity_uid: company.uid,
            entity_type: 'company',
        }).then(() => {
            clearModal();
        });
    };

    const handleDealSave = leafs => () => {
        replaceAttributeValues({
            attribute_uid: selectedAttribute,
            attribute_member_uids: leafs,
            company_uid: company.uid,
            entity_uid: selectedDeal.uid,
            entity_type: 'deal',
        }).then(() => {
            clearModal();
        });
    };

    const handleDealDelete = () => {
        replaceAttributeValues({
            attribute_uid: selectedAttribute,
            attribute_member_uids: [],
            company_uid: company.uid,
            entity_uid: selectedDeal.uid,
            entity_type: 'deal',
        }).then(() => {
            clearModal();
        });
    };

    const handleQuarterSave = () => {
        updateFiscalQuarters({
            company_uid: company.uid,
            fiscal_year_end: toEpoch(companyFiscalYearEnd),
            quarter_one: toEpoch(quarterOne),
            quarter_two: toEpoch(quarterTwo),
            quarter_three: toEpoch(quarterThree),
            quarter_four: toEpoch(quarterFour),
        }).then(() => {
            clearModal();
        });
    };

    const handleCompanyCharacteristicsSave = () => {
        updateCharacteristics({
            company_uid: company.uid,
            updates: {
                name: companyName,
                base_currency_id: companyCurrency,
                fiscal_year_end: toEpoch(companyFiscalYearEnd),
                normalize_data: normalizeData,
            },
        });
    };

    const openAuditTrailModal = useCallback(
        data => {
            setModalData(data);
            toggleModal('auditTrail')();
        },
        [toggleModal],
    );
    const openEditMetricValueModal = useCallback(
        data => {
            setModalData(data);
            toggleModal('editMetricValue')();
        },
        [toggleModal],
    );

    const {setMode, activeMode, modes, attributes, options, deals, isLoading} = props;

    const {
        cPanelFilterConfig,
        filterAsOfDate,
        filterMetricVersion,
        filterCurrency,
    } = useCPanelFilters({deals, company, currencies: options?.currencies});

    if (isReplacing || isLoading) {
        return <Loader />;
    }

    return (
        <>
            <Page>
                <CPanel>
                    <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                    {cPanelFilterConfig}
                </CPanel>
                <FiscalYearModal
                    modalKey={modalKey}
                    toggleModal={toggleModal('fiscalYear')}
                    formatFiscalYear={formatFiscalYear}
                    setCompanyFiscalYearEnd={setCompanyFiscalYearEnd}
                    companyFiscalYearEnd={companyFiscalYearEnd}
                    quarterOne={quarterOne}
                    setQuarterOne={setQuarterOne}
                    quarterTwo={quarterTwo}
                    setQuarterTwo={setQuarterTwo}
                    quarterThree={quarterThree}
                    setQuarterThree={setQuarterThree}
                    quarterFour={quarterFour}
                    setQuarterFour={setQuarterFour}
                    handleQuarterSave={handleQuarterSave}
                    clearFiscalModal={clearFiscalModal}
                />
                {selectedAttribute && (
                    <EditAttributeModal
                        isOpen={modalKey === 'editCompanyAttribute'}
                        toggleModal={toggleModal('editCompanyAttribute')}
                        attributes={attributes}
                        company={company}
                        selectedAttribute={selectedAttribute}
                        handleSave={handleCompanySave}
                        redirectToAttributesPage={redirectToAttributesPage}
                    />
                )}
                {selectedAttribute && selectedDeal && (
                    <EditAttributeModal
                        isOpen={modalKey == 'editDealAttribute'}
                        toggleModal={toggleModal('editDealAttribute')}
                        attributes={attributes}
                        company={selectedDeal}
                        selectedAttribute={selectedAttribute}
                        handleSave={handleDealSave}
                        redirectToAttributesPage={redirectToAttributesPage}
                    />
                )}
                {selectedAttribute && (
                    <DeleteAttributeModal
                        isOpen={modalKey == 'deleteCompanyAttribute'}
                        toggleModal={toggleModal('deleteCompanyAttribute')}
                        attributes={attributes}
                        company={company}
                        selectedAttribute={selectedAttribute}
                        handleDelete={handleCompanyDelete}
                    />
                )}
                {selectedAttribute && selectedDeal && (
                    <DeleteAttributeModal
                        isOpen={modalKey == 'deleteDealAttribute'}
                        toggleModal={toggleModal('deleteDealAttribute')}
                        attributes={attributes}
                        company={selectedDeal}
                        selectedAttribute={selectedAttribute}
                        handleDelete={handleDealDelete}
                    />
                )}
                <EditMetricValueModal
                    isOpen={modalKey == 'editMetricValue'}
                    toggleModal={toggleModal('editMetricValue')}
                    {...modalData}
                    companyUid={company.uid}
                />
                <AuditTrailModal
                    isOpen={modalKey == 'auditTrail'}
                    toggleModal={toggleModal('auditTrail')}
                    {...modalData}
                    companyUid={company.uid}
                />
                <AddAttributeModal
                    isOpen={modalKey == 'companyAttribute'}
                    toggleModal={toggleModal('companyAttribute')}
                    attributes={attributesWithoutValues(company)}
                    scope={EntityMetaScope.Company}
                    selectedAttribute={selectedAttribute}
                    setSelectedAttribute={setSelectedAttribute}
                    handleSave={handleCompanySave}
                    redirectToAttributesPage={redirectToAttributesPage}
                />
                {selectedDeal && (
                    <AddAttributeModal
                        isOpen={modalKey == 'dealAttribute'}
                        toggleModal={toggleModal('dealAttribute')}
                        attributes={attributesWithoutValues(selectedDeal)}
                        scope={EntityMetaScope.Deal}
                        selectedAttribute={selectedAttribute}
                        setSelectedAttribute={setSelectedAttribute}
                        handleSave={handleDealSave}
                        redirectToAttributesPage={redirectToAttributesPage}
                    />
                )}
                <Content>
                    <Toolbar>
                        <ToolbarItem
                            icon='floppy-disk'
                            glyphicon
                            onClick={handleCompanyCharacteristicsSave}
                            right
                        >
                            Save
                        </ToolbarItem>
                        <ToolbarItem
                            onClick={() => setMode('new-deal')}
                            icon='plus'
                            glyphicon
                            right
                        >
                            New Deal
                        </ToolbarItem>
                    </Toolbar>
                    <ScrollableContent>
                        <Section px={10} py={16} flex={1}>
                            <Flex py={10} alignItems='center'>
                                <H3>Company Information</H3>
                            </Flex>
                            <CompanyInformation
                                companyName={companyName}
                                setCompanyName={setCompanyName}
                                companyCurrency={companyCurrency}
                                setCompanyCurrency={setCompanyCurrency}
                                companyFiscalYearEnd={companyFiscalYearEnd}
                                setCompanyFiscalYearEnd={setCompanyFiscalYearEnd}
                                options={options}
                                company={company}
                                toggleModal={toggleModal}
                                normalizeData={normalizeData}
                                setNormalizeData={setNormalizeData}
                            />
                        </Section>

                        <Section px={10} py={16} flex={1}>
                            <Flex py={10} alignItems='center'>
                                <H3>Company Attributes</H3>
                                <Box mx={20}>
                                    <Button primary onClick={toggleModal('companyAttribute')}>
                                        Add Attribute
                                        <Icon name='plus' glyphicon right />
                                    </Button>
                                </Box>
                            </Flex>
                            <EntityAttributes
                                attributes={attributes}
                                entity={company}
                                toggleEditModal={toggleEditModal}
                                toggleDeleteModal={toggleDeleteModal}
                                writeAccess
                            />
                        </Section>
                        <Section flex={1}>
                            <DealTable
                                deals={deals}
                                attributes={attributes}
                                isLoading={isLoading}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                selectedDeal={selectedDeal}
                                setSelectedDeal={setSelectedDeal}
                                toggleModal={toggleModal}
                                toggleDealEditModal={toggleDealEditModal}
                                toggleDealDeleteModal={toggleDealDeleteModal}
                            />
                        </Section>
                        <Section py={16} flex={1}>
                            <DealOverview
                                deals={deals}
                                companyUid={props.companyUid}
                                renderCurrencyId={filterCurrency?.value}
                                asOfDate={filterAsOfDate}
                            />
                        </Section>
                        <Section my={4} flex={1}>
                            <KeyStatsTable
                                companyUid={company.uid}
                                renderCurrencySymbol={filterCurrency?.symbol}
                                metricVersion={filterMetricVersion?.uid}
                                onOpenAuditTrailModal={openAuditTrailModal}
                                onOpenEditMetricValueModal={openEditMetricValueModal}
                            />
                        </Section>
                    </ScrollableContent>
                </Content>
            </Page>
        </>
    );
}
