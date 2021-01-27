import React from 'react';

import auth from 'auth';

import {is_set} from 'src/libs/Utils';
import {TimeFrame} from 'src/libs/Enums';
import * as Formatters from 'src/libs/Formatters';
import * as Constants from 'src/libs/Constants';

import DataTable from 'components/basic/DataTable';
import {
    defaultCellRenderer,
    contextMenuCellRenderer,
} from 'components/basic/DataTable/cellRenderers';

function metricValueFormatter(renderCurrency, {cellData, rowData}) {
    let formatter;

    if (rowData.metricFormat == 'money') {
        formatter = Formatters.gen_formatter({
            format: 'money',
            format_args: {render_currency: renderCurrency},
        });
    } else if (rowData.metricFormat === 'integer') {
        formatter = Formatters.gen_formatter({format: 'number', format_args: {decimals: 0}});
    } else if (rowData.metricFormat === 'float') {
        formatter = Formatters.gen_formatter({format: 'number', format_args: {decimals: 2}});
    } else {
        formatter = Formatters.gen_formatter({format: rowData.metricFormat});
    }

    return formatter(cellData);
}

function metricValueCellRenderer(
    enableAuditTrail,
    displayMode,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
    {cellData, columnData, rowData},
) {
    if (!is_set(cellData)) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    // Checks to make sure that the frequency of the selected metric and the frequency in
    // the cpanel are the same. If they are not the same, we have "converted" the metric
    // values on the backend, and cannot show an audit trail for them.
    const matchingFrequency =
        rowData.timeFrame === TimeFrame.PointInTime || rowData.frequency === displayMode;

    if (!enableAuditTrail || !matchingFrequency || rowData.isCalculated) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    return contextMenuCellRenderer(({columnData, rowData}) => {
        const metric = {
            metricSetUid: rowData.metricSetUid,
            date: columnData.asOfDate / 1000,
        };

        return [
            {
                key: 1,
                label: 'Edit Value',
                onClick: onOpenEditMetricValueModal.bind(null, metric),
            },
            {
                key: 2,
                label: 'View Audit Trail',
                onClick: onOpenAuditTrailModal.bind(null, metric),
            },
        ];
    })({cellData, columnData, rowData});
}

function calculateValuesDateColumns(
    data,
    renderCurrency,
    displayMode,
    aggregateSelected,
    disableAuditTrail,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
) {
    const columns = [
        {
            link: '<link>',
            label: 'Metric',
            key: 'name',
            width: 300,
        },
    ];
    const dates = new Set();
    for (const {trends} of Object.values(data)) {
        for (const {values} of Object.values(trends)) {
            for (const [date, _] of values) {
                dates.add(date);
            }
        }
    }

    const enableAuditTrail = !aggregateSelected;
    const sorted_dates = Array.from(dates).sort();
    for (const date of sorted_dates) {
        const columnCellRenderer = disableAuditTrail
            ? undefined
            : metricValueCellRenderer.bind(
                  null,
                  enableAuditTrail,
                  displayMode,
                  onOpenAuditTrailModal,
                  onOpenEditMetricValueModal,
              );

        columns.push({
            label: Formatters.date(date),
            formatter: metricValueFormatter.bind(null, renderCurrency),
            key: `value_${date}`,
            disableSort: true,
            asOfDate: date,
            cellRenderer: columnCellRenderer,
        });
    }

    return columns;
}

function calculateValuesMetricRows(data, companyUid) {
    const rows = [];

    for (const version of Object.keys(data).sort()) {
        const trends = data[version].trends;
        for (const [name, metricData] of Object.entries(trends)) {
            const formattedName = auth.user_has_feature('metric_versions')
                ? `${name} - ${version}`
                : name;

            const row_data = {
                name: formattedName,
                metricFormat:
                    Constants.format_options.find(format => format.value === metricData.format)
                        .format || 'money',
                metricSetUid: metricData.metric_set_uid,
                timeFrame: metricData.time_frame,
                frequency: metricData.frequency,
                isCalculated: metricData.is_calculated,
                link: metricData.is_calculated
                    ? `company-analytics/${companyUid}/calculated-metric-sets/${metricData.calculated_metric_uid}/${metricData.frequency}/${metricData.time_frame}/${metricData.metric_version_uid}`
                    : `company-analytics/${companyUid}/metric-sets/${metricData.metric_set_uid}`,
            };

            for (const [date, value] of metricData.values) {
                row_data[`value_${date}`] = value;
            }

            rows.push(row_data);
        }
    }

    return rows;
}

export const ValuesTable = React.forwardRef(
    (
        {
            data = {},
            renderCurrency,
            onOpenAuditTrailModal,
            onOpenEditMetricValueModal,
            displayMode,
            aggregateSelected,
            disableAuditTrail,
            companyUid,
        },
        ref,
    ) => {
        const rows = calculateValuesMetricRows(data, companyUid);
        const columns = calculateValuesDateColumns(
            data,
            renderCurrency,
            displayMode,
            aggregateSelected,
            disableAuditTrail,
            onOpenAuditTrailModal,
            onOpenEditMetricValueModal,
        );

        return (
            <DataTable
                ref={ref}
                enablePagination
                resultsPerPage={10}
                columns={columns}
                rows={rows}
                enableContextHeader
                enableHorizontalScrolling
                label='Values'
                pushHeight
            />
        );
    },
);
ValuesTable.displayName = 'ValuesTable';

function calculateStatisticsRows(data) {
    const rows = [];

    for (const version of Object.keys(data).sort()) {
        const statistics = data[version].statistics;
        for (const [name, metricData] of Object.entries(statistics)) {
            const formattedName = auth.user_has_feature('metric_versions')
                ? `${name} - ${version}`
                : name;

            const row_data = {
                ...metricData.values,
                name: formattedName,
                metricFormat:
                    Constants.format_options.find(format => format.value === metricData.format)
                        .format || 'money',
            };

            rows.push(row_data);
        }
    }

    return rows;
}

export const StatisticsTable = React.forwardRef(({data = {}, renderCurrency}, ref) => {
    const rows = calculateStatisticsRows(data);

    return (
        <DataTable
            ref={ref}
            enablePagination
            resultsPerPage={10}
            enableContextHeader
            enableHorizontalScrolling
            label='Statistics'
            rows={rows}
            pushHeight
            columns={[
                {
                    label: 'Metric',
                    key: 'name',
                    width: 300,
                },
                {
                    label: 'Start',
                    key: 'first_date',
                    right: true,
                    format: 'backend_date',
                },
                {
                    label: 'End',
                    key: 'last_date',
                    right: true,
                    format: 'backend_date',
                },
                {
                    label: 'Start Value',
                    key: 'first_value',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrency),
                },
                {
                    label: 'End Value',
                    key: 'last_value',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrency),
                },
                {
                    label: 'Growth Rate',
                    key: 'rate_of_change',
                    right: true,
                    format: 'percent',
                    width: 150,
                },
                {
                    label: 'Ann. Growth Rate',
                    key: 'annualized_rate_of_change',
                    right: true,
                    format: 'percent',
                    width: 225,
                },
                {
                    label: 'Count',
                    key: 'count',
                    right: true,
                    format: 'number',
                },
                {
                    label: 'Mean',
                    key: 'mean',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrency),
                },
                {
                    label: 'Median',
                    key: 'median',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrency),
                },
                {
                    label: 'Std Dev',
                    key: 'std_dev',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrency),
                },
            ]}
        />
    );
});
StatisticsTable.displayName = 'StatisticsTable';
