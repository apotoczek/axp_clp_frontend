import React from 'react';
import {useBackendData} from 'utils/backendConnect';
import DataTable from 'components/basic/DataTable';
import {money} from 'utils/formatters';

export default function DealOverview({companyUid, renderCurrencyId, asOfDate}) {
    const {data, hasData} = useBackendData(
        'dataprovider/vehicle_company_deal_overviews',
        {
            company_uid: companyUid,
            as_of_date: asOfDate,
            render_currency: renderCurrencyId,
        },
        {initialData: []},
    );

    const formatMoney = ({cellData, rowData: {render_currency}}) =>
        money(cellData, {
            abbreviateAs: 'auto',
            showUnit: true,
            render_currency,
        });

    return (
        <DataTable
            pushHeight
            enableContextHeader
            label='Deal Overview'
            rowKey='uid'
            defaultHiddenColumns={['vintage_year']}
            isLoading={!hasData}
            rows={data ?? []}
            columns={[
                {label: 'Fund', key: 'fund_name', width: 250},
                {label: 'Vintage Year', key: 'vintage_year'},
                {label: 'First Close', key: 'first_close', format: 'backend_date'},
                {label: 'As of Date', key: 'as_of_date', format: 'backend_date'},
                {label: 'Invested', key: 'paid_in', formatter: formatMoney},
                {label: 'Realized Value', key: 'distributed', formatter: formatMoney},
                {label: 'Unrealized Value', key: 'nav', formatter: formatMoney},
                {label: 'Total Value', key: 'total_value', formatter: formatMoney},
                {label: 'IRR', key: 'irr', format: 'irr'},
                {label: 'MOIC', key: 'tvpi', format: 'multiple'},
                {label: 'DPI', key: 'dpi', format: 'multiple'},
                {label: 'RVPI', key: 'rvpi', format: 'multiple'},
            ]}
        />
    );
}
