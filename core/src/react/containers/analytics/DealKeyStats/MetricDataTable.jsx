import React from 'react';

import {gen_formatter} from 'src/libs/Formatters';
import {is_set} from 'src/libs/Utils';
import {SystemMetricType, CalculatedMetric, TimeFrame, Format} from 'src/libs/Enums';

import {useBackendData} from 'utils/backendConnect';

import DataTable from 'components/basic/DataTable';
import {
    contextMenuCellRenderer,
    defaultCellRenderer,
} from 'components/basic/DataTable/cellRenderers';

function metricValueCellRenderer(
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
    {cellData, columnData, rowData},
) {
    if (!is_set(cellData)) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    // Checks to make sure that the time frame of the metric is either point in time
    // or TTM, matching the query.
    const matchingFrequency =
        columnData.timeFrame === TimeFrame.PointInTime || columnData.timeFrame === TimeFrame.TTM;

    // If this metric doesn't have a metric set, it's calculated, so we disable the audit trail.
    if (!columnData.metricSetUid || !matchingFrequency) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    return contextMenuCellRenderer(({columnData, rowData}) => {
        const actionProps = {
            metricSetUid: columnData.metricSetUid,
            date: rowData.date / 1000,
        };

        return [
            {
                key: 1,
                label: 'Edit Value',
                onClick: onOpenEditMetricValueModal.bind(null, actionProps),
            },
            {
                key: 2,
                label: 'View Audit Trail',
                onClick: onOpenAuditTrailModal.bind(null, actionProps),
            },
        ];
    })({cellData, columnData, rowData});
}

function metricValueCellFormatter(renderCurrencySymbol, {columnData, cellData}) {
    let formatter;
    if (columnData.metricFormat == Format.Money) {
        formatter = gen_formatter({
            format: 'money',
            format_args: {render_currency: renderCurrencySymbol},
        });
    } else if (columnData.metricFormat === Format.Integer) {
        formatter = gen_formatter({format: 'number', format_args: {decimals: 0}});
    } else if (columnData.metricFormat === Format.Float) {
        formatter = gen_formatter({format: 'number', format_args: {decimals: 2}});
    } else {
        formatter = gen_formatter({format: columnData.metricFormat});
    }

    return formatter(cellData);
}

function calculateMetricDataRows(data) {
    if (!is_set(data, true)) {
        return [];
    }

    const rows = {};

    // Exctract the data from the selected metric version. This is hack, this is life.
    const dataForMetricVersion = Object.values(data)[0];
    const {trends} = dataForMetricVersion;
    for (const [metric, metricData] of Object.entries(trends)) {
        for (const [date, value] of metricData.values) {
            rows[date] = {
                ...rows[date],
                date,
                [metric]: value,
            };
        }
    }

    return Object.values(rows);
}

function calculateMetricDataDynamicColumns(
    data,
    disableAuditTrail,
    renderCurrencySymbol,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
) {
    if (!is_set(data, true)) {
        return [];
    }

    const cellRenderer = disableAuditTrail
        ? undefined
        : metricValueCellRenderer.bind(null, onOpenAuditTrailModal, onOpenEditMetricValueModal);

    const columns = [];
    const dataForMetricVersion = Object.values(data)[0];
    const {trends} = dataForMetricVersion;

    for (let [metric, metricData] of Object.entries(trends)) {
        columns.push({
            label: metric,
            key: metric,
            formatter: metricValueCellFormatter.bind(null, renderCurrencySymbol),
            metricFormat: metricData.format,
            width: 150,
            right: true,
            metricSetUid: metricData.metric_set_uid,
            cellRenderer,
            timeFrame: metricData.time_frame,
        });
    }

    return columns;
}

export default function MetricDataTable({
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
    metricVersion,
    companyUid,
    renderCurrencySymbol,
    disableAuditTrail,
}) {
    const {data, isLoading} = useBackendData(
        'dataprovider/company_metric_analysis',
        {
            metric_versions: metricVersion ? [metricVersion] : undefined,
            company_uid: companyUid,
            render_currency: renderCurrencySymbol,
            time_frame: TimeFrame.TTM,
            system_metric_types: [
                SystemMetricType.EnterpriseValue,
                SystemMetricType.Revenue,
                SystemMetricType.Ebitda,
                SystemMetricType.NumberOfEmployees,
                SystemMetricType.NumberOfCustomers,
            ],
            calculated_identifiers: [
                CalculatedMetric.EvMultiple,
                CalculatedMetric.RevenueMultiple,
                CalculatedMetric.DebtMultiple,
                CalculatedMetric.EbitdaMargin,
            ],
        },
        {
            requiredParams: ['metric_versions', 'company_uid', 'render_currency'],
        },
    );

    const rows = calculateMetricDataRows(data.metrics_for_version);
    const dynamicColumns = calculateMetricDataDynamicColumns(
        data.metrics_for_version,
        disableAuditTrail,
        renderCurrencySymbol,
        onOpenAuditTrailModal,
        onOpenEditMetricValueModal,
    );

    return (
        <DataTable
            enablePagination
            enableHorizontalScrolling
            pushHeight
            isLoading={isLoading}
            rows={rows}
            defaultSortBy={['date']}
            columns={[
                {
                    key: 'date',
                    label: 'Date',
                    flexGrow: 1,
                    width: 75,
                    flexShrink: 0,
                    format: 'date',
                },
                ...dynamicColumns,
            ]}
        />
    );
}
