import React from 'react';

import SegmentedTable from 'components/basic/SegmentedTable';
import {time_frame, backend_month_short, gen_formatter} from 'src/libs/Formatters';

const GroupedMetrics = ({
    metrics,
    onClickMetric = () => {},
    allowEdit,
    onClickEditValue,
    onClickViewHistory,
}) => {
    const segments = [
        {
            key: 'metrics',
            columns: [
                {
                    key: 'metric_name',
                    label: 'Metric',
                    width: '10%',
                    preventEdit: true,
                },
                {
                    key: 'time_frame',
                    label: 'Reporting Period',
                    formatter: row => time_frame(row.time_frame),
                    width: '10%',
                    preventEdit: true,
                },
            ],
        },
    ];

    const rows_by_key = {};
    const as_of_dates = {};
    const version_name_to_uid = {};

    const default_color = {
        header: '#107aa7',
        even: '#FFFFFF',
        odd: '#F6F8FF',
    };

    const color_by_version_name = {
        Actual: {
            header: '#1ba1cc',
            even: '#FFFFFF',
            odd: '#F6F8FF',
        },
    };

    for (const m of metrics) {
        if (!as_of_dates[m.version_name]) {
            as_of_dates[m.version_name] = [];
            version_name_to_uid[m.version_name] = m.metric_version;
        }

        if (as_of_dates[m.version_name].indexOf(m.as_of_date) === -1) {
            as_of_dates[m.version_name].push(m.as_of_date);
        }

        const key = `${m.metric_name}-${m.time_frame}`;

        if (!rows_by_key[key]) {
            rows_by_key[key] = {...m, mappings: []};
        }

        rows_by_key[key][m.as_of_date] = {
            note: m.note,
            mapping_idx: m.mapping_idx,
            value: m.value,
            metricName: m.metric_name,
            versionName: m.version_name,
            timeFrame: m.time_frame,
            asOfDate: m.as_of_date,
            metricUid: m.metric_uid,
            setUid: m.set_uid,
        };
        rows_by_key[key].mappings.push(m.mapping_idx);
    }

    for (const [version, dates] of Object.entries(as_of_dates)) {
        const color = color_by_version_name[version] || default_color;
        const version_uid = version_name_to_uid[version];

        segments.push({
            label: version,
            color: color,
            key: version,
            versionUid: version_uid,
            columns: dates.map(d => ({
                key: `${d}`,
                label: backend_month_short(d),
                textAlign: 'right',
                formatter: row => {
                    const formatter = gen_formatter(row.format);

                    if (row[d]) {
                        return formatter(row[d].value);
                    }
                },
                tooltipKey: `${d}:note`,
            })),
        });
    }
    return (
        <SegmentedTable
            segments={segments}
            rows={Object.values(rows_by_key)}
            onClickCell={cell => onClickMetric(cell)}
            allowEdit={allowEdit}
            onClickEditValue={(segment, row, column) =>
                onClickEditValue({
                    asOfDate: column.key,
                    metricName: row.metric_name,
                    versionName: segment.key,
                    versionUid: segment.versionUid,
                    timeFrame: row.time_frame,
                    format: row.format,
                    value: row[column.key] && row[column.key].value,
                    metricUid: row.metric_uid,
                    setUid: row.set_uid,
                })
            }
            onClickViewHistory={(segment, row, column) =>
                onClickViewHistory({
                    asOfDate: column.key,
                    metricName: row.metric_name,
                    versionName: segment.key,
                    versionUid: segment.versionUid,
                    timeFrame: row.time_frame,
                    format: row.format,
                    value: row[column.key] && row[column.key].value,
                    metricUid: row.metric_uid,
                    setUid: row.set_uid,
                })
            }
        />
    );
};

export default GroupedMetrics;
