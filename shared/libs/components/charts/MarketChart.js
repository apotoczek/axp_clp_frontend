/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.render_currency = opts.render_currency;
    self.options = Utils.deep_merge(self.options, {
        chart: {
            zoomType: 'x',
        },
        xAxis: {
            type: 'datetime',
            minRange: 30 * 24 * 3600000,
            labels: {
                style: {
                    fontSize: '11px',
                },
            },
        },
        yAxis: [
            {
                title: {
                    text: 'Market Change',
                },
                labels: {
                    style: {
                        fontSize: '11px',
                    },
                },
                opposite: true,
            },
            {
                title: {
                    text: 'Net Cash Flows',
                },
                labels: {
                    formatter: function() {
                        return Formatters.money(this.value, false, {
                            render_currency: ko.unwrap(self.render_currency),
                        });
                    },
                    style: {
                        fontSize: '11px',
                    },
                },
                plotLines: [
                    {
                        color: '#B4B4B4',
                        width: 1,
                        value: 0,
                        zIndex: 10,
                    },
                ],
            },
        ],
        tooltip: {
            formatter: function() {
                let string = `<span style="font-size: 10px;">${Formatters.date(this.x)}</span>`;

                if (this.series.name.indexOf('Market Change') > -1) {
                    string += `<br>Market Change: <strong>${this.point.y.toFixed(2)}</strong>`;
                } else {
                    string += `<br>${this.series.name}: <strong>${Formatters.money(
                        this.point.y,
                        false,
                        {render_currency: ko.unwrap(self.render_currency)},
                    )}</strong>`;
                }

                return string;
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let data = self.data();
        let series = [];

        if (data) {
            let market_data = data.market_data;

            if (!Object.isArray(market_data)) {
                market_data = [market_data];
            }

            for (let i = 0, l = market_data.length; i < l; i++) {
                let identifier = Utils.unescape_html(market_data[i].identifier);

                series.push({
                    name: `Market Change (${identifier})`,
                    type: 'line',
                    data: market_data[i].weighted_deltas,
                    yAxis: 0,
                    color: self.get_color_from_int(i),
                    lineWidth: 1,
                    zIndex: 15,
                });
            }

            series.push(
                {
                    name: 'Distributions',
                    type: 'column',
                    data: data.cashflows.distributions,
                    color: self.get_color('first'),
                    yAxis: 1,
                    pointWidth: 5,
                },
                {
                    name: 'Contributions',
                    type: 'column',
                    data: data.cashflows.contributions,
                    color: self.get_color('second'),
                    yAxis: 1,
                    pointWidth: 5,
                },
            );
        }

        return series;
    });

    return self;
}
