import React, {useState, useCallback, useEffect} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import {dealType} from 'components/data-admin/shared';
import DealUploadModal, {sheetType} from 'components/data-admin/DealUploadModal';

import CPanel, {
    CPanelSection,
    CPanelSectionTitle,
    CPanelButton,
} from 'components/basic/cpanel/base';
import CPanelMeta from 'components/basic/cpanel/CPanelMeta';
import CPanelInput from 'components/basic/cpanel/CPanelInput';

import Button from 'components/basic/forms/Button';
import Icon from 'components/basic/Icon';
import DataTable from 'components/basic/DataTable';
import {H1} from 'components/basic/text';
import {is_set, recursive_get} from 'src/libs/Utils';

const Page = styled(Flex)`
    height: 100%;
`;

const Content = styled(Flex)`
    flex: 1 0 auto;
`;

function attributeCellDataGetter({rowData, dataKey}) {
    const attribute = recursive_get(rowData, dataKey.split(':'));
    if (!is_set(attribute, true)) {
        return;
    }
    return (attribute.values || []).join(', ');
}

function getColumns(deals) {
    const columns = [
        {label: 'Uid', key: 'uid', link: 'deal/<uid>'},
        {label: 'Fund Name', key: 'fund:name', link: 'funds/<fund:uid>'},
        {label: 'Company Name', key: 'company:name', link: 'company/<company:uid>'},
        {label: 'Deal Team Leader', key: 'deal_team_leader', format: 'string'},
        {label: 'Deal Team Second', key: 'deal_team_second', format: 'string'},
        {label: 'Investment Amount', key: 'investment_amount', format: 'money'},
        {label: 'Currency', key: 'base_currency_sym'},
        {label: 'Acquisition Date', key: 'acquisition_date', format: 'backend_date'},
        {label: 'Exit Date', key: 'exit_date', format: 'backend_date'},
        {label: 'Deal Source', key: 'deal_source'},
        {label: 'Deal Type', key: 'deal_type'},
        {label: 'Deal Role', key: 'deal_role'},
        {label: 'Seller Type', key: 'seller_type'},
    ];

    // Find all attributes across all deals. Make unique.
    const attributeColumns = {};
    for (const {attributes} of deals) {
        for (const [attributeUid, attribute] of Object.entries(attributes)) {
            attributeColumns[attributeUid] = attribute.name;
        }
    }

    // Create columns from the unique attributes.
    for (const [attributeUid, attributeName] of Object.entries(attributeColumns)) {
        columns.push({
            label: attributeName,
            key: `attributes:${attributeUid}`,
            cellDataGetter: attributeCellDataGetter,
        });
    }

    return columns;
}

function DealsListCPanel({onFilterChange, dealCount, totalDealCount}) {
    const [filters, setFilters] = useState({
        fundName: '',
        companyName: '',
    });

    function handleChangeFilter(key) {
        return event => {
            const value = event.target.value;
            setFilters(filters => ({...filters, [key]: value}));
        };
    }
    useEffect(() => onFilterChange(filters), [filters, onFilterChange]);

    const handleClearAll = useCallback(() => {
        const newFilters = {fundName: '', companyName: ''};
        setFilters(newFilters);
        onFilterChange(newFilters);
    }, [onFilterChange]);

    return (
        <CPanel width={230}>
            <CPanelSection>
                <CPanelSectionTitle>Filters</CPanelSectionTitle>
                <CPanelInput
                    placeholder='Fund Name...'
                    value={filters.fundName}
                    onChange={handleChangeFilter('fundName')}
                />
                <CPanelInput
                    placeholder='Company Name...'
                    value={filters.companyName}
                    onChange={handleChangeFilter('companyName')}
                />
                <CPanelMeta title='Deals' count={dealCount} totalCount={totalDealCount} />
                <CPanelButton onClick={handleClearAll}>Clear All</CPanelButton>
            </CPanelSection>
        </CPanel>
    );
}

export default function DealsList({
    deals,
    isDealsLoading,
    isUploading,
    onDealListPageChange,
    onDeleteDeals,
    onFilterChange,
    onDownloadCashflows,
    onDownloadDeals,
    onUploadSheet,
    onRemoveSheet,
    onRemoveAllSheets,
    onUploadStep,
    onSelectSheetType,
    uploadStep,
    sheets,
    uploadError,
    onResetUploadError,
}) {
    const [selectedDeals, setSelectedDeals] = useState([]);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const handleDealSelected = useCallback(selection => {
        setSelectedDeals(selection);
    }, []);

    const handleDeleteDeals = useCallback(() => {
        onDeleteDeals(selectedDeals);
        setSelectedDeals([]);
    }, [onDeleteDeals, selectedDeals]);

    const toggleUploadModal = useCallback(open => {
        setUploadModalOpen(open);
    }, []);

    return (
        <>
            <Page>
                <DealsListCPanel
                    dealCount={deals.results && deals.results.length}
                    totalDealCount={deals.count}
                    onFilterChange={onFilterChange}
                />
                <Content flexDirection='column' p={3}>
                    <Flex>
                        <Box flex={1}>
                            <H1>Deals</H1>
                        </Box>
                        <Flex alignSelf='flex-end' mb={3}>
                            <Button
                                onClick={handleDeleteDeals}
                                disabled={selectedDeals.length <= 0}
                                danger
                                mr={2}
                            >
                                <Icon name='trash' left />
                                Delete Deals
                            </Button>
                            <Button onClick={onDownloadDeals} mr={2}>
                                <Icon name='download' left />
                                Download Deals
                            </Button>
                            <Button onClick={onDownloadCashflows} mr={2}>
                                <Icon name='download' left />
                                Download Cashflows
                            </Button>
                            <Button onClick={() => toggleUploadModal(true)} mr={2} primary>
                                <Icon name='upload' left />
                                Upload
                            </Button>
                        </Flex>
                    </Flex>
                    <DataTable
                        columns={getColumns(deals.results || [])}
                        defaultHiddenColumns={['acquisition_date', 'investment_amount']}
                        enableContextHeader
                        enablePagination
                        enableSelection
                        isLoading={isDealsLoading}
                        label='Deals'
                        onPageChanged={onDealListPageChange}
                        onSelectionChanged={handleDealSelected}
                        paginateInline={false}
                        resultsPerPage={deals.limit}
                        rowKey='uid'
                        rows={deals.results || []}
                        sortInline={false}
                        selection={selectedDeals}
                        totalCount={deals.count}
                    />
                </Content>
            </Page>
            <DealUploadModal
                toggleModal={toggleUploadModal}
                uploadError={uploadError}
                onResetUploadError={onResetUploadError}
                isOpen={uploadModalOpen}
                isUploading={isUploading}
                onUploadSheet={onUploadSheet}
                onRemoveSheet={onRemoveSheet}
                onRemoveAllSheets={onRemoveAllSheets}
                uploadStep={uploadStep}
                sheets={sheets}
                onUploadStep={onUploadStep}
                onSelectSheetType={onSelectSheetType}
            />
        </>
    );
}

DealsList.defaultProps = {
    onDeleteDeals: () => {},
    onDealListPageChange: () => {},
};

DealsList.propTypes = {
    deals: PropTypes.shape({
        results: PropTypes.arrayOf(dealType),
        count: PropTypes.number,
        limit: PropTypes.number,
        offset: PropTypes.number,
    }).isRequired,
    isDealsLoading: PropTypes.bool.isRequired,
    isUploading: PropTypes.bool.isRequired,
    onDealListPageChange: PropTypes.func,
    onDeleteDeals: PropTypes.func,
    onFilterChange: PropTypes.func,
    onDownloadCashflows: PropTypes.func.isRequired,
    onDownloadDeals: PropTypes.func.isRequired,
    onUploadSheet: PropTypes.func,
    onRemoveSheet: PropTypes.func,
    onRemoveAllSheets: PropTypes.func,
    uploadStep: PropTypes.func,
    onUploadStep: PropTypes.func,
    onSelectSheetType: PropTypes.func,
    sheets: PropTypes.objectOf(sheetType),
};
