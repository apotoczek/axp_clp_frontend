import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Box, Flex} from '@rebass/grid';

import {companyType, cashflowType} from 'components/data-admin/shared';

import MetricTable from 'src/libs/react/components/basic/MetricTable';
import {H1} from 'src/libs/react/components/basic/text';
import Loader from 'src/libs/react/components/basic/Loader';
import Icon from 'src/libs/react/components/basic/Icon';
import Button from 'src/libs/react/components/basic/forms/Button';
import ConfirmDropdown from 'src/libs/react/components/basic/forms/dropdowns/ConfirmDropdown';
import DataTable from 'src/libs/react/components/basic/DataTable';

function CompanyInfo({company, onDeleteCompany}) {
    return (
        <>
            <Flex>
                <Box mb={3} flex={1}>
                    <H1>{company.name}</H1>
                </Box>
                <Box alignSelf='flex-end'>
                    <Flex alignSelf='flex-end' mb={3}>
                        <ConfirmDropdown
                            onConfirm={() => onDeleteCompany(company.uid)}
                            text='Are you sure you want to remove this company?'
                            subText='This action cannot be undone.'
                        >
                            <Button danger small mr={2}>
                                <Icon glyphicon name='trash' left />
                                Delete Company
                            </Button>
                        </ConfirmDropdown>
                    </Flex>
                </Box>
            </Flex>
            <MetricTable
                rows={[
                    {label: 'Uid', value: company.uid, key: 'uid'},
                    {label: 'Name', value: company.name, key: 'name'},
                ]}
                numColumns={1}
            />
        </>
    );
}
CompanyInfo.propTypes = {
    company: companyType,
    onDeleteCompany: PropTypes.func.isRequired,
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

export default function CompanyPage({
    company,
    cashflows,
    isCompanyLoading,
    isCashflowsLoading,
    onDeleteCompany,
    onDeleteCashflows,
    onCashflowListPageChange,
}) {
    return (
        <PageWrapper flexDirection='column' p={3}>
            <Flex flexDirection='column' mb={4}>
                {isCompanyLoading ? (
                    <Loader />
                ) : (
                    <CompanyInfo company={company} onDeleteCompany={onDeleteCompany} />
                )}
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

CompanyPage.propTypes = {
    company: companyType,
    cashflows: PropTypes.shape({
        results: PropTypes.arrayOf(cashflowType),
        count: PropTypes.number,
        limit: PropTypes.number,
        offset: PropTypes.number,
    }).isRequired,
    isCompanyLoading: PropTypes.bool.isRequired,
    isCashflowsLoading: PropTypes.bool.isRequired,
    onDeleteCompany: PropTypes.func.isRequired,
    onDeleteCashflows: PropTypes.func.isRequired,
    onCashflowListPageChange: PropTypes.func.isRequired,
};
