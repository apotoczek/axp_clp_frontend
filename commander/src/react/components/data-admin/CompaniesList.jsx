import React, {Component, useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import {companyType} from 'components/data-admin/shared';

import CPanel, {
    CPanelSection,
    CPanelSectionTitle,
    CPanelButton,
} from 'components/basic/cpanel/base';
import CPanelInput from 'components/basic/cpanel/CPanelInput';
import DataTable from 'components/basic/DataTable';
import Button from 'components/basic/forms/Button';
import Icon from 'components/basic/Icon';
import {H1} from 'src/libs/react/components/basic/text';

const Page = styled(Flex)`
    height: 100%;
`;

const Content = styled(Flex)`
    height: 100%;
    width: 100%;
`;

function CompaniesListCPanel() {
    const [companyName, setCompanyName] = useState('');
    const handleClearAllFilters = useCallback(() => setCompanyName(''), []);

    return (
        <CPanel width={230}>
            <CPanelSection>
                <CPanelSectionTitle>Filters</CPanelSectionTitle>
                <CPanelInput
                    placeholder='Name...'
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                />
                <CPanelButton onClick={handleClearAllFilters}>Clear All</CPanelButton>
            </CPanelSection>
        </CPanel>
    );
}

export default class CompaniesList extends Component {
    static propTypes = {
        companies: PropTypes.shape({
            results: PropTypes.arrayOf(companyType),
            count: PropTypes.number,
            limit: PropTypes.number,
            offset: PropTypes.number,
        }).isRequired,
        onCompanyListPageChange: PropTypes.func,
        isCompaniesLoading: PropTypes.bool.isRequired,
        onDeleteCompanies: PropTypes.func,
    };

    static defaultProps = {
        onDeleteCompanies: () => {},
        onCompanyListPageChange: () => {},
    };

    state = {
        selectedCompanies: [],
    };

    handleCompanySelected = selection => {
        this.setState({selectedCompanies: selection});
    };

    handleDeleteCompanies = () => {
        this.props.onDeleteCompanies(this.state.selectedCompanies);
        this.setState({selectedCompanies: []});
    };

    render() {
        const {
            companies,
            isCompaniesLoading,
            onCompanyListPageChange,
            onDownloadCashflows,
        } = this.props;

        const {selectedCompanies} = this.state;

        return (
            <Page>
                <CompaniesListCPanel />
                <Content flexDirection='column' p={3}>
                    <Flex>
                        <Box flex={1}>
                            <H1>Companies</H1>
                        </Box>
                        <Flex alignSelf='flex-end' mb={3}>
                            <Button
                                onClick={this.handleDeleteCompanies}
                                disabled={this.state.selectedCompanies.length <= 0}
                                danger
                                small
                                mr={2}
                            >
                                <Icon name='trash' left />
                                Delete Companies
                            </Button>
                            <Button onClick={onDownloadCashflows} small mr={2}>
                                <Icon name='download' left />
                                Download Cashflows
                            </Button>
                        </Flex>
                    </Flex>
                    <DataTable
                        columns={[
                            {label: 'Name', key: 'name', link: 'company/<uid>'},
                            {label: 'Uid', key: 'uid'},
                        ]}
                        enableContextHeader
                        enablePagination
                        enableSelection
                        isLoading={isCompaniesLoading}
                        label='Companies'
                        onPageChanged={onCompanyListPageChange}
                        onSelectionChanged={this.handleCompanySelected}
                        paginateInline={false}
                        resultsPerPage={companies.limit}
                        rowKey='uid'
                        rows={companies.results || []}
                        sortInline={false}
                        selection={selectedCompanies}
                        totalCount={companies.count}
                    />
                </Content>
            </Page>
        );
    }
}
