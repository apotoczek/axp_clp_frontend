import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Box, Flex} from '@rebass/grid';

import {dealType, cashflowType} from 'components/data-admin/shared';

import MetricTable from 'src/libs/react/components/basic/MetricTable';
import {H1} from 'src/libs/react/components/basic/text';
import Loader from 'src/libs/react/components/basic/Loader';
import Icon from 'src/libs/react/components/basic/Icon';
import Button from 'src/libs/react/components/basic/forms/Button';
import ConfirmDropdown from 'src/libs/react/components/basic/forms/dropdowns/ConfirmDropdown';
import DataTable from 'src/libs/react/components/basic/DataTable';

const getAttributeRows = deal =>
    Object.entries(deal.attributes || {}).map(([attributeUid, attribute]) => {
        const values = attribute.values || [];
        return {
            label: attribute.name,
            key: `attribute:${attributeUid}`,
            value: values.join(', '),
        };
    });

function DealInfo({deal, onDeleteDeal}) {
    return (
        <>
            <Flex>
                <Box mb={3} flex={1}>
                    <H1>
                        Deal between {deal.fund.name} and {deal.company.name}
                    </H1>
                </Box>
                <Box alignSelf='flex-end'>
                    <Flex alignSelf='flex-end' mb={3}>
                        <ConfirmDropdown
                            onConfirm={() => onDeleteDeal(deal.uid)}
                            text='Are you sure you want to remove this deal?'
                            subText='This action can not be undone.'
                        >
                            <Button danger small mr={2}>
                                <Icon glyphicon name='trash' left />
                                Delete Deal
                            </Button>
                        </ConfirmDropdown>
                    </Flex>
                </Box>
            </Flex>
            <MetricTable
                rows={[
                    {label: 'Uid', value: deal.uid, key: 'uid', format: 'string'},
                    {
                        label: 'Currency',
                        value: deal.default_currency,
                        key: 'base_currency_sym',
                        format: 'string',
                    },
                    {
                        label: 'Company Name',
                        value: deal.company.name,
                        key: 'company_name',
                        format: 'string',
                    },
                    {
                        label: 'Acquisition Date',
                        value: deal.acquisition_date,
                        key: 'acquisition_date',
                        format: 'date',
                    },
                    {label: 'Fund Name', value: deal.fund.name, key: 'fund_name', format: 'string'},
                    {label: 'Exit Date', value: deal.exit_date, key: 'exit_date', format: 'date'},
                    {
                        label: 'Investment Amount',
                        value: deal.investment_amount,
                        key: 'investment_amount',
                        format: 'money',
                    },
                    {
                        label: 'Deal Team Leader',
                        value: deal.deal_team_leader,
                        key: 'deal_team_leader',
                        format: 'string',
                    },
                    {
                        label: 'Deal Team Second',
                        value: deal.deal_team_second,
                        key: 'deal_team_second',
                        format: 'string',
                    },
                    {label: 'Country', value: deal.country, key: 'country', format: 'string'},
                    {
                        label: 'Deal Source',
                        value: deal.deal_source,
                        key: 'deal_source',
                        format: 'string',
                    },
                    {label: 'Deal Type', value: deal.deal_type, key: 'deal_type', format: 'string'},
                    {label: 'Deal Role', value: deal.deal_role, key: 'deal_role', format: 'string'},
                    {
                        label: 'Seller Type',
                        value: deal.seller_type,
                        key: 'seller_type',
                        format: 'string',
                    },
                    ...getAttributeRows(deal),
                ]}
                numColumns={2}
            />
        </>
    );
}
DealInfo.propTypes = {
    deal: dealType,
    onDeleteDeal: PropTypes.func.isRequired,
};

class Cashflows extends React.Component {
    static propTypes = {
        cashflows: PropTypes.shape({
            results: PropTypes.arrayOf(cashflowType),
            count: PropTypes.number,
            limit: PropTypes.number,
            offset: PropTypes.number,
        }).isRequired,
        onDeleteCashflows: PropTypes.func.isRequired,
        onCashflowListPageChange: PropTypes.func.isRequired,
        isCashflowsLoading: PropTypes.bool.isRequired,
    };

    state = {
        selectedCashflows: [],
    };

    handleSelectCashflow = selectedCashflows => {
        this.setState({selectedCashflows});
    };

    handleDeleteCashflows = () => {
        const {onDeleteCashflows} = this.props;
        onDeleteCashflows(this.state.selectedCashflows || []);
    };

    render() {
        const {cashflows, onCashflowListPageChange, isCashflowsLoading} = this.props;

        return (
            <>
                <Flex flexDirection='column'>
                    <Box alignSelf='flex-end'>
                        <Flex alignSelf='flex-end' mb={3}>
                            <ConfirmDropdown
                                onConfirm={this.handleDeleteCashflows}
                                text='Are you sure you want to remove theese cashflows?'
                                subText='This action can not be undone.'
                            >
                                <Button
                                    danger
                                    small
                                    mr={2}
                                    disabled={this.state.selectedCashflows.length <= 0}
                                >
                                    <Icon glyphicon name='trash' left />
                                    Delete Cashflows
                                </Button>
                            </ConfirmDropdown>
                        </Flex>
                    </Box>
                </Flex>
                <DataTable
                    columns={[
                        {label: 'Uid', key: 'uid'},
                        {label: 'Fund', key: 'fund_name', link: 'funds/<fund_uid>'},
                        {label: 'Company', key: 'company_name'},
                        {label: 'Date', key: 'date', format: 'backend_date'},
                        {label: 'Amount', key: 'amount', format: 'money'},
                        {label: 'Type', key: 'type'},
                        {label: 'Note', key: 'note'},
                    ]}
                    pushHeight
                    enableContextHeader
                    enableSelection
                    enablePagination
                    isLoading={isCashflowsLoading}
                    label='Cashflows'
                    onPageChanged={onCashflowListPageChange}
                    paginateInline={false}
                    resultsPerPage={cashflows.limit}
                    rowKey='uid'
                    rows={cashflows.results || []}
                    sortInline={false}
                    totalCount={cashflows.count}
                    onSelectionChanged={this.handleSelectCashflow}
                />
            </>
        );
    }
}

const PageWrapper = styled(Flex)`
    height: 100%;
`;

export default function DealPage({
    deal,
    cashflows,
    isDealLoading,
    isCashflowsLoading,
    onDeleteDeal,
    onDeleteCashflows,
    onCashflowListPageChange,
}) {
    return (
        <PageWrapper flexDirection='column' p={3}>
            <Flex flexDirection='column' mb={4}>
                {isDealLoading ? <Loader /> : <DealInfo deal={deal} onDeleteDeal={onDeleteDeal} />}
            </Flex>
            <Box>
                {isCashflowsLoading ? (
                    <Loader />
                ) : (
                    <Cashflows
                        cashflows={cashflows}
                        onCashflowListPageChange={onCashflowListPageChange}
                        onDeleteCashflows={onDeleteCashflows}
                        isCashflowsLoading={isCashflowsLoading}
                    />
                )}
            </Box>
        </PageWrapper>
    );
}

DealPage.propTypes = {
    deal: dealType,
    cashflows: PropTypes.shape({
        results: PropTypes.arrayOf(cashflowType),
        count: PropTypes.number,
        limit: PropTypes.number,
        offset: PropTypes.number,
    }).isRequired,
    isDealLoading: PropTypes.bool.isRequired,
    isCashflowsLoading: PropTypes.bool.isRequired,
    onDeleteDeal: PropTypes.func.isRequired,
    onDeleteCashflows: PropTypes.func.isRequired,
    onCashflowListPageChange: PropTypes.func.isRequired,
};
