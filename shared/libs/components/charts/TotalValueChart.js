/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.bars = opts.bars;

    self.options = Utils.deep_merge(self.options, {
        is_total_value: true,
        chart: {
            type: 'waterfall',
            height: opts.chart_height || 400,
        },
        xAxis: {
            type: 'category',
        },
        yAxis: {
            title: {
                text: opts.y_label,
            },
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
            gridLineColor: '#e5e5e5',
        },
        legend: {
            enabled: false,
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size: 11px;">${
                    this.key
                }</span><br><strong>${self.formatter(this.y)}</strong>`;
            },
        },
        plotOptions: {
            waterfall: {
                dataLabels: {
                    style: {
                        textShadow: 'none',
                    },
                },
            },
        },
    });

    self.plotbands = ko.pureComputed(() => {
        let data = self.data();
        let value_tracker = 0;
        let bands = [];
        if (data && data.percentages) {
            for (let i = 0, l = data.percentages.length; i < l; i++) {
                if (value_tracker > 0) {
                    bands.push({
                        id: 'alpha_drivers',
                        label: {
                            text: 'Alpha Drivers',
                            style: {
                                color: '#606060',
                            },
                        },
                        xAxis: 0,
                        from: i - 0.5,
                        to: data.percentages.length + 0.5,
                        color: '#e1f8ff',
                    });
                    break;
                } else {
                    value_tracker += data.percentages[i];
                }
            }
        }

        return bands;
    });

    self.plotlines = ko.pureComputed(() => {
        let data = self.data();
        let value;
        if (data && data.percentages) {
            if (data.percentages[0] >= 0) {
                return [];
            }

            for (let i = 0, l = data.percentages.length; i < l; i++) {
                if (data.percentages[i] >= 0) {
                    value = i - 0.5;
                    break;
                }
            }
        }

        return [
            {
                id: 'minimum',
                label: {
                    text: 'Minimum',
                    style: {
                        color: '#606060',
                    },
                },
                xAxis: 0,
                value: value,
                color: '#999',
                width: 1,
                dashStyle: 'ShortDash',
            },
        ];
    });

    self.series = ko.pureComputed(() => {
        let data = self.data();

        let series_data = [];
        if (data && data.categories && data.percentages) {
            for (let i = 0, l = data.categories.length; i < l; i++) {
                series_data.push({
                    name: Utils.unescape_html(data.categories[i]),
                    y: data.percentages[i],
                });
            }
        } else {
            return [];
        }

        return [
            {
                upColor: self.get_color('first'),
                color: self.get_color('second'),
                data: series_data,
                dataLabels: {
                    enabled: true,
                    inside: false,
                    formatter: function() {
                        return self.formatter(this.y);
                    },
                    style: {
                        color: '#555',
                        fontWeight: 'bold',
                        fontSize: '12px',
                    },
                    crop: false,
                    overflow: 'none',
                },
                pointPadding: 0,
                borderWidth: 0,
            },
        ];
    });

    return self;
}
