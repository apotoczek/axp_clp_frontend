import React from 'react';

import GroupedMetrics from 'components/reporting/GroupedMetrics';

export default function UploadedMetrics({
    metrics,
    allowEdit,
    onClickEditValue,
    onClickViewHistory,
}) {
    const first_versions = ['Actual', 'Forecast'];

    const first = metrics.filter(metric => first_versions.indexOf(metric.version_name) > -1);

    const second = metrics.filter(metric => first_versions.indexOf(metric.version_name) == -1);

    const tables = [];

    if (first.length) {
        tables.push(
            <GroupedMetrics
                key={1}
                metrics={first}
                allowEdit={allowEdit}
                onClickEditValue={onClickEditValue}
                onClickViewHistory={onClickViewHistory}
            />,
        );
    }

    if (second.length) {
        tables.push(
            <GroupedMetrics
                key={2}
                metrics={second}
                allowEdit={allowEdit}
                onClickEditValue={onClickEditValue}
                onClickViewHistory={onClickViewHistory}
            />,
        );
    }

    return <div>{tables}</div>;
}
