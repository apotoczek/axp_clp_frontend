import React from 'react';

import * as Formatters from 'src/libs/Formatters';

import DataTable from 'components/basic/DataTable';
import {
    contextMenuCellRenderer,
    defaultCellRenderer,
} from 'components/basic/DataTable/cellRenderers';

function dateCellFormatter(timeZero, {cellData}) {
    if (timeZero) {
        if (cellData === 0) {
            return 'Inception';
        }

        return `Q${cellData}`;
    }

    return Formatters.date(cellData);
}

function metricCellFormatter(valueFormatter, {cellData}) {
    return valueFormatter(cellData);
}

function metricValueCellRenderer(
    enableAuditTrail,
    onOpenAuditTrailModal,
    onOpenEditMetricValueModal,
    {cellData, columnData, rowData},
) {
    if (cellData === null || cellData === undefined) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    if (!enableAuditTrail) {
        return defaultCellRenderer({cellData, columnData, rowData});
    }

    return contextMenuCellRenderer(({columnData, rowData}) => {
        const actionProps = {
            dealUid: columnData.key,
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

export const ValuesTable = React.forwardRef(
    (
        {
            dynamicColumns = [],
            data = [],
            isLoading,
            timeZero,
            aggregateSelected,
            breakdown,
            displayMode,
            singleMetricMode,
            selectedMetric,
            disableAuditTrail,
            onOpenAuditTrailModal,
            onOpenEditMetricValueModal,
        },
        ref,
    ) => {
        // Checks to make sure that the frequency of the selected metric and the frequency in
        // the cpanel are the same. If they are not the same, we have "converted" the metric
        // values on the backend, and cannot show an audit trail for them.
        // Alternatively, if the metric is point in time, we dont aggregate the values, so
        // we can still show the audit trail.
        const matchingFrequency =
            selectedMetric?.time_frame === 0 || selectedMetric?.frequency === displayMode;

        const enableAuditTrail =
            !timeZero &&
            !breakdown &&
            singleMetricMode &&
            matchingFrequency &&
            !aggregateSelected &&
            !disableAuditTrail;

        return (
            <DataTable
                ref={ref}
                enableContextHeader
                enablePagination
                enableHorizontalScrolling
                pushHeight
                label='Values'
                isLoading={isLoading}
                rows={data}
                columns={[
                    {
                        key: 'date',
                        label: 'Date',
                        formatter: dateCellFormatter.bind(null, timeZero),
                        flexGrow: 1,
                        width: 75,
                        flexShrink: 0,
                    },
                    ...dynamicColumns.map(column => ({
                        key: column.key,
                        label: column.label,
                        formatter: metricCellFormatter.bind(null, column.valueFormatter),
                        width: 200,
                        right: true,
                        disableSort: true,
                        cellRenderer: metricValueCellRenderer.bind(
                            null,
                            enableAuditTrail,
                            onOpenAuditTrailModal,
                            onOpenEditMetricValueModal,
                        ),
                    })),
                ]}
            />
        );
    },
);

ValuesTable.displayName = 'ValuesTable';
