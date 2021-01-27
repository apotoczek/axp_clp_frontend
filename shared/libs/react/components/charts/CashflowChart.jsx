import React from 'react';
import styled from 'styled-components';

import ChartConfig from 'src/react/utils/ChartConfig';
import {Chart} from 'components/charts/base';
import Loader from 'components/basic/Loader';
import * as Formatters from 'src/libs/Formatters';

function seriesFromBackendData(data, colors, boostThreshold) {
    const series = [
        {
            name: 'Calculated NAV',
            data: data.calculated_navs ?? [],
            type: 'scatter',
            lineWidth: 1,
            legendIndex: 1,
            color: colors.calculatedNav,
        },
        {
            name: 'NAV',
            data: data.navs ?? [],
            type: 'scatter',
            lineWidth: 1,
            legendIndex: 1,
            color: colors.nav,
        },
        {
            boostThreshold,
            name: 'Paid In',
            data: data.contributions ?? [],
            type: 'column',
            pointWidth: 5,
            legendIndex: 6,
            color: colors.paidIn,
            visible: false,
        },
        {
            boostThreshold,
            name: 'Distributions',
            data: data.distributions ?? [],
            type: 'column',
            pointWidth: 5,
            legendIndex: 7,
            color: colors.distributed,
            visible: false,
        },
        {
            boostThreshold,
            name: 'Total Value',
            data: data.running_total_value ?? [],
            legendIndex: 2,
            color: colors.totalValue,
        },
        {
            boostThreshold,
            name: 'Total Paid In',
            data: data.running_contributions ?? [],
            legendIndex: 3,
            color: colors.paidIn,
        },
        {
            boostThreshold,
            name: 'Total Distributions',
            data: data.running_distributions ?? [],
            legendIndex: 4,
            color: colors.distributed,
        },
        {
            boostThreshold,
            name: 'Cash Flows',
            data: data.running_net_cashflows ?? [],
            legendIndex: 5,
            color: colors.cashflows,
        },
        {
            boostThreshold,
            name: 'Total Paid In (Positive)',
            data: (data.running_contributions ?? []).map(data => {
                return [data[0], data[1] * -1];
            }),
            legendIndex: 9,
            color: colors.paidIn,
            visible: false,
        },
    ];

    if (data.commitment) {
        series.push({
            name: 'Commitment',
            data: [
                [data.first_date * 1000, -data.commitment],
                [data.last_date * 1000, -data.commitment],
            ],
            type: 'line',
            legendIndex: 8,
            color: colors.commitment,
            visible: false,
        });
    }

    return series;
}

const Padding = styled.div`
    margin-top: 2em;
    margin-bottom: 2em;
`;

export default function CashflowChart({
    chartData,
    renderCurrency,
    chartColors,
    height,
    title = null,
    exporting = true,
}) {
    if (!chartData) {
        return (
            <Padding>
                <Loader />
            </Padding>
        );
    }

    const series = seriesFromBackendData(chartData, chartColors, 1000);

    const chartBuilder = new ChartConfig('line').setSeries(series);

    const config = chartBuilder.buildWith({
        chart: {
            zoomType: 'x',
            height: height,
        },
        boost: {
            enabled: true,
        },
        xAxis: {
            type: 'datetime',
            minRange: 30 * 24 * 3600000,
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return Formatters.money(this.value, false, {
                        render_currency: renderCurrency,
                    });
                },
            },
            title: {text: null},
        },
        legend: {
            enabled: true,
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size:10px;">${Formatters.date(this.x)}</span><br>${
                    this.series.name
                }: <b>${Formatters.money(this.y, false, {
                    render_currency: renderCurrency,
                })}</b><br/>`;
            },
        },
        plotOptions: {
            column: {
                grouping: false,
            },
            line: {
                lineWidth: 2,
                marker: {
                    enabled: false,
                    symbol: 'circle',
                },
            },
            scatter: {
                marker: {
                    radius: 4,
                    symbol: 'circle',
                },
            },
            series: {
                animation: false,
            },
        },
        exporting: {
            enabled: exporting,
        },
    });

    return <Chart config={config} title={title} />;
}
