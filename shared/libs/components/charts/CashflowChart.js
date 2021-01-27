/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.cashflow_chart_series_visability = opts.cashflow_chart_series_visability || {};
    self.render_currency = opts.render_currency;

    self.series =
        opts.series ||
        ko.pureComputed(() => {
            let data = self.data();
            let series = [];
            if (data && data.contributions) {
                if (data.calculated_navs) {
                    series.push({
                        name: 'Calculated NAV',
                        data: data.calculated_navs,
                        type: 'scatter',
                        color: self.get_color('tenth'),
                        lineWidth: 1,
                        visible:
                            self.cashflow_chart_series_visability.calculated_navs !== undefined
                                ? self.cashflow_chart_series_visability.calculated_navs
                                : true,
                        legendIndex: 1,
                    });
                }

                series.push(
                    {
                        name: 'NAV',
                        data: data.navs,
                        type: 'scatter',
                        color: self.get_color('ninth'),
                        lineWidth: 1,
                        visible:
                            self.cashflow_chart_series_visability.nav !== undefined
                                ? self.cashflow_chart_series_visability.nav
                                : true,
                        legendIndex: 1,
                    },
                    {
                        name: 'Paid In',
                        data: data.contributions,
                        type: 'column',
                        color: self.get_color('second'),
                        pointWidth: 5,
                        visible:
                            self.cashflow_chart_series_visability.paid_in !== undefined
                                ? self.cashflow_chart_series_visability.paid_in
                                : false,
                        legendIndex: 6,
                    },
                    {
                        name: 'Distributions',
                        data: data.distributions,
                        type: 'column',
                        color: self.get_color('first'),
                        pointWidth: 5,
                        visible:
                            self.cashflow_chart_series_visability.distributions !== undefined
                                ? self.cashflow_chart_series_visability.distributions
                                : false,
                        legendIndex: 7,
                    },
                    {
                        name: 'Total Value',
                        data: data.running_total_value,
                        color: self.get_color('tenth'),
                        visible:
                            self.cashflow_chart_series_visability.total_value !== undefined
                                ? self.cashflow_chart_series_visability.total_value
                                : true,
                        legendIndex: 2,
                    },
                    {
                        name: 'Total Paid In',
                        data: data.running_contributions,
                        color: self.get_color('second'),
                        visible:
                            self.cashflow_chart_series_visability.total_paid_in !== undefined
                                ? self.cashflow_chart_series_visability.total_paid_in
                                : true,
                        legendIndex: 3,
                    },
                    {
                        name: 'Total Distributions',
                        data: data.running_distributions,
                        visible:
                            self.cashflow_chart_series_visability.total_distributions !== undefined
                                ? self.cashflow_chart_series_visability.total_distributions
                                : true,
                        color: self.get_color('first'),
                        legendIndex: 4,
                    },
                    {
                        name: 'Cash Flows',
                        data: data.running_net_cashflows,
                        visible:
                            self.cashflow_chart_series_visability.cash_flows !== undefined
                                ? self.cashflow_chart_series_visability.cash_flows
                                : true,
                        color: self.get_color('ninth'),
                        legendIndex: 5,
                    },
                    {
                        name: 'Total Paid In (Positive)',
                        data: data.running_contributions.map(data => {
                            return [data[0], data[1] * -1];
                        }),
                        color: self.get_color('second'),
                        visible:
                            self.cashflow_chart_series_visability.total_paid_in_positive !==
                            undefined
                                ? self.cashflow_chart_series_visability.total_paid_in_positive
                                : false,
                        legendIndex: 9,
                    },
                );

                if (data.commitment) {
                    series.push({
                        name: 'Commitment',
                        data: [
                            [data.first_date * 1000, -data.commitment],
                            [data.last_date * 1000, -data.commitment],
                        ],
                        type: 'line',
                        color: self.get_color('third'),
                        visible:
                            self.cashflow_chart_series_visability.commitment !== undefined
                                ? self.cashflow_chart_series_visability.commitment
                                : false,
                        legendIndex: 8,
                    });
                }
            }

            return series;
        });

    self.options = Utils.deep_merge(self.options, {
        chart: {
            zoomType: 'x',
            type: 'line',
        },
        xAxis: {
            type: 'datetime',
            minRange: 30 * 24 * 3600000,
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return Formatters.money(this.value, false, {
                        render_currency: self.render_currency,
                    });
                },
            },
        },
        legend: {
            enabled: opts.legend === undefined ? true : opts.legend,
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size:10px;">${Formatters.date(this.x)}</span><br>${
                    this.series.name
                }: <b>${Formatters.money(this.y, false, {
                    render_currency: self.render_currency,
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
        },
    });

    return self;
}
