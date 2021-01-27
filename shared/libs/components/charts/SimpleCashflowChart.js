/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.keys = opts.keys || {};

    self.categories_key = opts.categories_key || 'categories';
    self.categories = opts.categories || false;

    self.s_conf = opts.series || false;

    self.shared_tooltip = opts.shared_tooltip;

    self.render_currency = opts.render_currency;

    self.x_formatter = opts.x_formatter || Formatters.date;

    self.sum_stack = opts.sum_stack;

    self.series = ko.pureComputed(() => {
        let data = self.data();

        let series = [];

        if (data && self.s_conf) {
            let categories = self.categories || data[self.categories_key];

            if (categories) {
                for (let i = 0, l = self.s_conf.length; i < l; i++) {
                    let series_data = data[self.s_conf[i].key];

                    if (series_data) {
                        if (Object.isObject(series_data)) {
                            let keys = Object.keys(series_data);

                            for (let j = 0, k = keys.length; j < k; j++) {
                                series.push({
                                    name: Utils.unescape_html(keys[j]),
                                    data: series_data[keys[j]],
                                    stack: self.s_conf[i].stack,
                                    type: self.s_conf[i].type,
                                });
                            }
                        } else {
                            series.push({
                                name: Utils.unescape_html(self.s_conf[i].name),
                                data: series_data,
                                stack: self.s_conf[i].stack,
                                color: self.s_conf[i].color,
                                type: self.s_conf[i].type,
                            });
                        }
                    }
                }

                if (series.length > 0) {
                    series[0].categories = categories;
                }
            }
        }

        return series;
    });

    self.options = Utils.deep_merge(self.options, {
        colors: self.get_color_set(),
        chart: {
            zoomType: 'x',
            type: 'column',
        },
        xAxis: {
            type: 'categories',
            crosshair: {
                zIndex: 100,
            },
            categories_from_data: true,
            labels: {
                formatter: function() {
                    return self.x_formatter(this.value);
                },
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
                    let tooltip = self.x_formatter(this.x);

                    let sum_points = [];
                    let rest = [];
                    let sum_total = undefined;

                    for (let i = 0, l = this.points.length; i < l; i++) {
                        if (
                            self.sum_stack &&
                            this.points[i].series.options.stack == self.sum_stack
                        ) {
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
                let tooltip = `<span style="font-size:10px;">${this.x}</span><br>${
                    this.series.name
                }: <b>${Formatters.money(this.y, false, {
                    render_currency: self.render_currency,
                })}</b><br/>`;

                return tooltip;
            },
        },
        plotOptions: {
            column: {
                stacking: 'normal',
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
