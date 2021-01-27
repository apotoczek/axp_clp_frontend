/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.render_currency = opts.render_currency;

    self.shared_tooltip = opts.shared_tooltip;

    self.sum_stack = opts.sum_stack;

    self.series_conf = opts.series;

    self.series = ko.pureComputed(() => {
        let data = self.data();

        let series = [];

        if (data && self.series_conf) {
            for (let config of self.series_conf) {
                let series_data = data[config.key];

                if (series_data) {
                    if (Object.isObject(series_data)) {
                        let keys = Object.keys(series_data);

                        if (config.reverse_keys) {
                            keys = keys.reverse();
                        }

                        for (let key of keys) {
                            series.push({
                                name: Utils.unescape_html(key),
                                data: series_data[key],
                                stack: config.stack,
                                type: config.type,
                            });
                        }
                    } else {
                        series.push({
                            name: Utils.unescape_html(config.name),
                            data: series_data,
                            stack: config.stack,
                            color: config.color,
                            type: config.type,
                        });
                    }
                }
            }
        }

        return series;
    });

    self.options = Utils.deep_merge(self.options, {
        colors: self.get_color_set(),
        chart: {
            zoomType: 'x',
            type: 'areaspline',
        },
        xAxis: {
            minPadding: 0,
            maxPadding: 0,
            type: 'datetime',
            crosshair: {
                zIndex: 100,
                color: 'rgba(50,50,50,0.8)',
                width: 1,
            },
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
        tooltip: {
            shared: self.shared_tooltip,
            formatter: function() {
                if (self.shared_tooltip) {
                    let tooltip = Formatters.date(this.x);

                    let sum_points = [];
                    let rest = [];
                    let sum_total = undefined;

                    for (let i = 0, l = this.points.length; i < l; i++) {
                        if (this.points[i].series.options.stack == self.sum_stack) {
                            sum_points.push(this.points[i]);
                            sum_total = this.points[i].total;
                        } else {
                            rest.push(this.points[i]);
                        }
                    }

                    for (let i = 0, l = sum_points.length; i < l; i++) {
                        tooltip += `<br><span style="font-size:10px;">${
                            sum_points[i].series.name
                        }: </span><span style="font-weight: bold;font-size:10px;">${Formatters.money(
                            sum_points[i].y,
                            false,
                            {render_currency: self.render_currency},
                        )}</span><br/>`;
                    }

                    if (Utils.is_set(sum_total)) {
                        tooltip += `<br><span style="font-size:10px;">Total: </span><span style="font-weight: bold;font-size:10px;">${Formatters.money(
                            sum_total,
                            false,
                            {render_currency: self.render_currency},
                        )}</span><br/>`;
                    }

                    for (let i = 0, l = rest.length; i < l; i++) {
                        tooltip += `<br><span style="font-size:10px;">${
                            rest[i].series.name
                        }: </span><span style="font-weight: bold;font-size:10px;">${Formatters.money(
                            rest[i].y,
                            false,
                            {render_currency: self.render_currency},
                        )}</span><br/>`;
                    }

                    return tooltip;
                }
                let tooltip = `<span style="font-size:10px;">${Formatters.date(this.x)}</span><br>${
                    this.series.name
                }: <b>${Formatters.money(this.y, false, {
                    render_currency: self.render_currency,
                })}</b><br/>`;
                if (this.point.stackTotal) {
                    tooltip += `Total: <b>${Formatters.money(this.point.stackTotal, false, {
                        render_currency: self.render_currency,
                    })}</b><br/>`;
                }

                return tooltip;
            },
        },
        plotOptions: {
            areaspline: {
                connectNulls: true,
                stacking: 'normal',
                fillOpacity: 1,
                lineColor: '#fff',
                lineWidth: 1,
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
            line: {
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
            },
        },
        legend: {
            enabled: true,
        },
    });

    return self;
}
