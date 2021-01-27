import React, {useEffect} from 'react';

import {contextual_url} from 'src/libs/Utils';

import {Box, Flex} from '@rebass/grid';
import {H3} from 'components/basic/text';

import styled from 'styled-components';

import DataTable from 'components/basic/DataTable';

import Icon from 'components/basic/Icon';

import Button from 'components/basic/forms/Button';

import EntityAttributes from 'components/datamanager/company/EntityAttributes';
import {defaultTableRowRenderer} from 'react-virtualized';

const StyledExpanedRow = styled(Box)`
    height: 300px;
    align-self: flex-start;
    padding: 25px;
    background: ${({theme}) => theme.expandedTableRow.bg};
`;

const DealAttributesWrapper = styled(Box)`
    max-width: 700px;
    height: 200px;
    overflow-y: scroll;
    padding-right: 10px;
`;

export default function DealTable({
    deals,
    attributes,
    isLoading,
    selectedIndex,
    setSelectedIndex,
    selectedDeal,
    setSelectedDeal,
    toggleModal,
    toggleDealEditModal,
    toggleDealDeleteModal,
    fundUrl = '/fund-analytics/fund/gross/<user_fund_uid>',
}) {
    const dealTableRef = React.createRef();

    const expansionHeight = 300;

    useEffect(() => {
        dealTableRef.current.tableRef.current?.recomputeRowHeights();
    });

    const deSelectIndex = () => {
        setSelectedIndex(null);
        setSelectedDeal(null);
    };

    const _setSelectedIndex = (index, dealUid) => {
        if (selectedIndex === index) {
            deSelectIndex();
        } else {
            setSelectedIndex(index);
            const deal = deals.find(deal => deal.uid === dealUid);
            setSelectedDeal(deal);
        }
    };

    const actionCellRenderer = ({rowIndex, rowData}) => {
        return (
            <Icon
                name='edit'
                glyphicon
                buttonDark
                onClick={() => _setSelectedIndex(rowIndex, rowData.uid)}
            />
        );
    };

    const right = true;
    const width = 100;

    const columns = [
        {
            key: 'edit_deal_attributes',
            cellRenderer: actionCellRenderer,
        },
        {
            label: 'Company',
            key: 'company_name',
            width: 150,
        },
        {
            label: 'Fund',
            key: 'fund_name',
            formatter: ({cellData, rowData}) => {
                const url = contextual_url(rowData, {
                    url: fundUrl,
                });

                if (rowData.write) {
                    return (
                        <a href={url} onClick={e => e.stopPropagation()}>
                            {cellData}
                        </a>
                    );
                }

                return cellData;
            },
            width: 150,
        },
        {
            label: 'Acq. Date',
            key: 'acquisition_date',
            format: 'backend_date',
            width,
            right,
        },
        {
            label: 'Exit Date',
            key: 'exit_date',
            format: 'backend_date',
            width,
            right,
        },
        {
            label: 'Deal Team Leader',
            key: 'deal_team_leader',
            width,
        },
        {
            label: 'Deal Team Second',
            key: 'deal_team_second',
            width,
        },
        {
            label: 'Deal Source',
            key: 'deal_source',
            width,
        },
        {
            label: 'Deal Role',
            key: 'deal_role',
            width,
        },
        {
            label: 'Deal Type',
            key: 'deal_type',
            width,
        },
        {
            label: 'Seller Type',
            key: 'seller_type',
            width,
        },
        {
            label: 'Deal Currency',
            key: 'base_currency_symbol',
            width,
        },
        {
            label: 'Default PME Index',
            key: 'market_name',
            width,
        },
    ];

    const actionRowRenderer = rowProps => {
        const {index, style, className, key, rowData} = rowProps;
        const writeAccess = rowData.write;
        if (selectedIndex === index) {
            return (
                <div style={{...style, flexDirection: 'column'}} className={className} key={key}>
                    {defaultTableRowRenderer({
                        ...rowProps,
                        style: {width: style.width, height: 35},
                    })}

                    <StyledExpanedRow px={25} py={15} width='100%'>
                        <Flex height={50} alignItems='center'>
                            <H3>Deal Attributes</H3>
                            <Flex width={550} justifyContent='flex-end'>
                                <Button
                                    flex='0 1 auto'
                                    primary
                                    onClick={toggleModal('dealAttribute')}
                                    disabled={!writeAccess}
                                >
                                    Add Attribute
                                    <Icon name='plus' glyphicon right></Icon>
                                </Button>
                            </Flex>
                        </Flex>
                        <DealAttributesWrapper>
                            <EntityAttributes
                                entity={selectedDeal}
                                attributes={attributes}
                                toggleEditModal={toggleDealEditModal}
                                toggleDeleteModal={toggleDealDeleteModal}
                                writeAccess={writeAccess}
                            />
                        </DealAttributesWrapper>
                    </StyledExpanedRow>
                </div>
            );
        }
        return <div key={key}>{defaultTableRowRenderer(rowProps)}</div>;
    };

    const _rowHeight = ({index}) => {
        return index == selectedIndex ? expansionHeight + 35 : 35;
    };

    return (
        <DataTable
            ref={dealTableRef}
            rowKey='uid'
            rows={deals}
            isLoading={isLoading}
            pushHeight
            rowRenderer={actionRowRenderer}
            enableContextHeader
            label='Deals'
            columns={columns}
            rowHeight={_rowHeight}
            expandedTable={selectedIndex !== null}
            expansionHeight={expansionHeight}
        />
    );
}
