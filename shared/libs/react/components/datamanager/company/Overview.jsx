import React, {useState} from 'react';

import {date_to_epoch} from 'src/libs/Utils';
import FiscalYearModal from 'src/react/containers/datamanager/FiscalYearModal';
import Checkbox from 'components/basic/forms/Checkbox';
import Input from 'components/basic/forms/input/Input';
import {Page, ScrollableContent, Content, Section} from 'components/layout';

import Toolbar, {ToolbarItem, NonRouterLink} from 'components/basic/Toolbar';

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
import {useBackendEndpoint} from 'utils/backendConnect';

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
            <Box width={1 / 2} p={1} style={{cursor: 'pointer'}}>
                <Input
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

const toEpoch = d => (d ? date_to_epoch(d) : null);

const OverviewCPanel = ({setMode, activeMode, modes}) => (
    <CPanel flex>
        <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
    </CPanel>
);

export default function Overview(props) {
    const [modalKey, setModalKey] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);

    const {company} = props;
    const {fiscalQuarters} = props;

    const [companyName, setCompanyName] = useState(company.name);
    const [companyCurrency, setCompanyCurrency] = useState(company.base_currency_id);
    const [companyFiscalYearEnd, setCompanyFiscalYearEnd] = useState(company.fiscal_year_end);
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

    const toggleModal = _modalKey => () => {
        setModalKey(_modalKey == modalKey ? null : _modalKey);
        setSelectedAttribute(null);
    };

    const clearModal = () => {
        setModalKey(null);
        setSelectedAttribute(null);
    };

    const clearFiscalModal = () => {
        setModalKey(null);
        setCompanyFiscalYearEnd(company.fiscal_year_end);
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

    const {
        setMode,
        activeMode,
        modes,
        attributes,
        options,
        deals,
        isLoading,
        updateCharacteristics,
    } = props;

    const handleCompanyCharacteristicsSave = () => {
        updateCharacteristics({
            name: companyName,
            base_currency_id: companyCurrency,
            fiscal_year_end: toEpoch(companyFiscalYearEnd),
            normalize_data: normalizeData,
        });
    };

    if (isReplacing || isLoading) {
        return <Loader />;
    }

    return (
        <Page>
            <FiscalYearModal
                modalKey={modalKey}
                toggleModal={clearFiscalModal}
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
                    isOpen={modalKey == 'editCompanyAttribute'}
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
            <OverviewCPanel activeMode={activeMode} setMode={setMode} modes={modes} />
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
                    <ToolbarItem onClick={() => setMode('new-deal')} icon='plus' glyphicon right>
                        New Deal
                    </ToolbarItem>
                    <ToolbarItem
                        to={`#!/company-analytics/${company.uid}`}
                        icon='chart-bar'
                        linkComponent={NonRouterLink}
                        right
                    >
                        View in Analytics
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
                            <Flex flex={1} justifyContent='flex-end'>
                                <Button
                                    flex='0 1 auto'
                                    primary
                                    onClick={toggleModal('companyAttribute')}
                                >
                                    Add Attribute
                                    <Icon name='plus' glyphicon right />
                                </Button>
                            </Flex>
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
                            fundUrl='/data-manager/vehicles/fund/gross/<user_fund_uid>'
                        />
                    </Section>
                </ScrollableContent>
            </Content>
        </Page>
    );
}
