import React from 'react';
import styled from 'styled-components';

import ChartConfig from 'src/react/utils/ChartConfig';
import {Chart} from 'components/charts/base';
import Loader from 'components/basic/Loader';
import * as Formatters from 'src/libs/Formatters';

function seriesFromBackendData(backendData, colors) {
    const {initial_nav: initialNav, labels, split_by_cfs} = backendData;
    const sortedLabels = Object.entries(labels).sort((l, r) => l[1].name.localeCompare(r[1].name));
    const mainData = [
        {
            name: 'NAV',
            y: initialNav.value,
            time: initialNav.time,
            color: colors.nav,
            borderColor: colors.nav,
        },
    ];

    for (const entry of backendData.results) {
        const entryCfs = entry.cfs.roll_up;
        if (!split_by_cfs) {
            mainData.push({
                name: 'Paid In',
                y: entryCfs.paid_in,
                time: entry.start,
                color: colors.paidIn,
                borderColor: colors.paidIn,
            });
            mainData.push({
                name: 'Distributed',
                y: -entryCfs.distributed,
                time: entry.start,
                color: colors.distributed,
                borderColor: colors.distributed,
            });
        } else {
            let labelIdx = 0;
            for (const [cfId, {name, chartNegate, renderInChart}] of sortedLabels) {
                const cf = entryCfs[cfId] ?? 0;
                if (renderInChart) {
                    mainData.push({
                        name,
                        y: chartNegate ? -cf : cf,
                        time: entry.start,
                        color: colors[labelIdx],
                        borderColor: colors[labelIdx],
                    });
                    labelIdx += 1;
                }
            }
        }
        mainData.push({
            name: 'Net Value Change',
            y: entry.value_change,
            time: entry.start,
            color: colors.valueChange,
            borderColor: colors.valueChange,
        });
        mainData.push({
            name: 'NAV',
            isSum: true,
            y: entry.nav, // Ignored by waterfall chart, used by tooltip
            time: entry.start,
            color: colors.nav,
            borderColor: colors.nav,
        });
    }

    const fakeData = new Array(mainData.length).fill(0);
    const series = [
        {name: 'Value Change', showInLegend: false, data: mainData},
        {name: 'Net Asset Value', color: colors.nav},
    ];

    if (!split_by_cfs) {
        series.push(
            {name: 'Paid In', color: colors.paidIn},
            {name: 'Distributed', color: colors.distributed},
        );
    } else {
        for (const [ix, [_, label]] of sortedLabels.entries()) {
            series.push({name: label.name, color: colors[ix], showInLegend: label.renderInChart});
        }
    }
    series.push({name: 'Net Value Change', color: colors.valueChange});
    for (const fakeSeries of series.slice(1)) {
        fakeSeries.data = fakeData;
        //fakeSeries.events = {legendItemClick: () => false};
        fakeSeries.opacity = 0;
        fakeSeries.includeInDataExport = false;
        fakeSeries.animation = false;
        fakeSeries.borderWidth = 0;
        fakeSeries.dataLabels = {enabled: false};
        fakeSeries.enableMouseTracking = false;
        fakeSeries.skipKeyboardNavigation = true;
    }

    return series;
}

// The waterfall chart shows n + 2 different values for each reported period
// (<the classifications or paid in, distributed>, net change, and resulting nav).
// We want the category to be the name of the period, but only show up in the middle
// of the four, so we pass empty strings for most of the bars. The fist column being the
// starting NAV throws this off just enough to warrant more than a map.
function categoriesForGroups(groups, timeInterval, labelCount) {
    const columnCount = labelCount + 2; // net change, NAV
    let halfColumnCount = columnCount / 2;
    const evenColumnCount = halfColumnCount % 1 == 0;
    halfColumnCount = Math.floor(halfColumnCount);
    const results = ['']; // Leave space for initial NAV
    const formatter = Formatters.gen_for_time_interval(timeInterval);
    for (const group of groups) {
        // We want the label to be in the middle of the grouping
        results.append(new Array(evenColumnCount ? halfColumnCount - 1 : halfColumnCount).fill(''));
        results.push(formatter(group));
        results.append(new Array(halfColumnCount).fill(''));
    }
    return results;
}

const SpinnerPadding = styled.div`
    margin-top: 2em;
    margin-bottom: 2em;
`;

export default function ValueChangeChart({
    backendData,
    chartColors,
    currency,
    timeInterval,
    loading = false,
    title = null,
}) {
    const tooltipFormatter = React.useMemo(() => {
        return function() {
            const dateFormat = Formatters.gen_for_time_interval(timeInterval);
            const moneyFormat = Formatters.money(this.y, false, {render_currency: currency});
            return `
                <span style="font-size:10px;">
                    ${this.point.name} ${dateFormat(this.point.time)}
                </span>
                <br />
                ${moneyFormat}
                <br />
            `;
        };
    }, [timeInterval, currency]);

    if (!backendData || loading) {
        return (
            <SpinnerPadding>
                <Loader />
            </SpinnerPadding>
        );
    }

    const series = seriesFromBackendData(backendData, chartColors);
    const categories = categoriesForGroups(
        backendData.groups,
        timeInterval,
        Object.keys(backendData.labels).length,
    );

    const chartBuilder = new ChartConfig('waterfall')
        .setSeries(series)
        .setYAxisTitle(`Value (${currency})`)
        .setTooltipFormatter(tooltipFormatter);
    const config = chartBuilder.buildWith({
        xAxis: {
            type: 'linear',
            categories: categories,
            labels: {
                step: 1,
                overflow: 'allow',
            },
            tickLength: 0,
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return Formatters.money(this.value, false, {render_currency: currency});
                },
            },
        },
        plotOptions: {series: {stacking: 'overlap'}},
    });

    return <Chart config={config} title={title} />;
}
