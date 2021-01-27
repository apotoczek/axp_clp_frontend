import React, {memo} from 'react';

import {gen_formatter} from 'src/libs/Formatters';
import {TimeFrame, Format} from 'src/libs/Enums';

import {useBackendData} from 'utils/backendConnect';

import {Chart} from 'components/charts/base';
import DataTable from 'components/basic/DataTable';
import {
    contextMenuCellRenderer,
    highlightedValueCellRenderer,
    defaultCellRenderer,
} from 'components/basic/DataTable/cellRenderers';

function metricValueFormatter(renderCurrencySymbol, {rowData, cellData}) {
    let formatter;
    if (rowData.format == Format.Money) {
        formatter = gen_formatter({
            format: 'money',
            format_args: {render_currency: renderCurrencySymbol},
        });
    } else if (rowData.format === Format.Integer) {
        formatter = gen_formatter({format: 'number', format_args: {decimals: 0}});
    } else if (rowData.format === Format.Float) {
        formatter = gen_formatter({format: 'number', format_args: {decimals: 2}});
    } else {
        formatter = gen_formatter({format: rowData.format});
    }

    return formatter(cellData);
}

function trendChartCellRenderer({cellData, rowData}) {
    return (
        <Chart
            title={null}
            config={{
                chart: {
                    type: 'line',
                    margin: [2, 0, 2, 0],
                    width: 120,
                    height: 20,
                    backgroundColor: null,
                    borderWidth: 0,
                    style: {
                        overflow: 'visible',
                    },
                },
                xAxis: {
                    labels: {
                        enabled: false,
                    },
                    title: {
                        text: null,
                    },
                    startOnTick: false,
                    endOnTick: false,
                    tickPositions: [],
                },
                credits: {
                    enabled: false,
                },
                legend: {
                    enabled: false,
                },
                yAxis: {
                    labels: {
                        enabled: false,
                    },
                    title: {
                        text: null,
                    },
                    startOnTick: false,
                    endOnTick: false,
                    tickPositions: [0],
                },
                tooltip: {
                    enabled: false,
                },
                plotOptions: {
                    series: {
                        lineWidth: 1,
                        shadow: false,
                        states: {
                            hover: {
                                lineWidth: 1,
                            },
                        },
                        marker: {
                            radius: 1,
                            states: {
                                hover: {
                                    radius: 2,
                                },
                            },
                        },
                        fillOpacity: 0.25,
                    },
                },
                series: [
                    {
                        data: cellData || [],
                        pointStart: 1,
                        categories: cellData.map(gen_formatter(rowData.format)),
                    },
                ],
            }}
        />
    );
}

function metricValueCellRenderer(
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
    {cellData, columnData, rowData},
) {
    if (cellData === null || cellData === undefined) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    const matchingFrequency =
        rowData.original_time_frame === TimeFrame.PointInTime ||
        rowData.original_time_frame === TimeFrame.TTM;

    if (!matchingFrequency) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    return contextMenuCellRenderer(({rowData}) => {
        const data = {date: rowData.date, metricSetUid: rowData.metric_set_uid};

        return [
            {
                key: 1,
                label: 'Edit Value',
                onClick: onOpenEditMetricValueModal.bind(null, data),
            },
            {
                key: 2,
                label: 'View Audit Trail',
                onClick: onOpenAuditTrailModal.bind(null, data),
            },
        ];
    })({cellData, columnData, rowData});
}

// This function is the actual component to be rendered. We make it a pure function so we can memoize it, since having
// a highchart on every row can make for some really slow renders. I think we could technically memoize the top-level
// component, but this is easier to reason about.
function InnerTable({
    data,
    isLoading,
    renderCurrencySymbol,
    disableAuditTrail,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
}) {
    let valueCellRenderer = disableAuditTrail
        ? undefined
        : metricValueCellRenderer.bind(null, onOpenAuditTrailModal, onOpenEditMetricValueModal);

    return (
        <DataTable
            isLoading={isLoading}
            label='Trends'
            enableContextHeader
            pushHeight
            columns={[
                {
                    key: 'label',
                    label: 'Metric',
                    width: 250,
                },
                {
                    label: 'Date',
                    key: 'date',
                    format: 'backend_date',
                    width: 100,
                },
                {
                    label: 'Value',
                    key: 'value',
                    right: true,
                    formatter: metricValueFormatter.bind(null, renderCurrencySymbol),
                    cellRenderer: valueCellRenderer,
                    width: 100,
                },
                {
                    label: 'Interval',
                    key: 'converted_time_frame',
                    format: 'time_frame',
                    width: 100,
                },
                {
                    label: 'Change',
                    key: 'outlook',
                    format: 'percent',
                    right: true,
                    width: 100,
                    cellRenderer: highlightedValueCellRenderer({max: 0, min: 0}),
                },
                {
                    label: 'Trend',
                    key: 'trend',
                    cellRenderer: trendChartCellRenderer,
                },
            ]}
            rows={data}
        />
    );
}
const MemoizedInnerTable = memo(InnerTable);

export default function KeyStatsTable({
    companyUid,
    renderCurrencySymbol,
    metricVersion,
    disableAuditTrail,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
}) {
    const {data, isLoading, hasTriggered} = useBackendData(
        'dataprovider/metric_overview',
        {
            entity_type: 'company',
            entity_uid: companyUid,
            time_frame: TimeFrame.TTM,
            render_currency: renderCurrencySymbol,
            metric_version: metricVersion,
        },
        {
            requiredParams: ['entity_uid', 'render_currency'],
            initialData: [],
        },
    );

    return (
        <MemoizedInnerTable
            data={data}
            isLoading={!hasTriggered || isLoading}
            renderCurrencySymbol={renderCurrencySymbol}
            onOpenAuditTrailModal={onOpenAuditTrailModal}
            onOpenEditMetricValueModal={onOpenEditMetricValueModal}
            disableAuditTrail={disableAuditTrail}
        />
    );
}
