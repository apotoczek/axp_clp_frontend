/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    let _dfd = self.new_deferred();

    self.shared_tooltip = opts.shared_tooltip || false;
    self.title = opts.title || '';
    self.series_conf = opts.series;
    self.y_axes = opts.y_axes;
    self.truncate_label_length = opts.truncate_label_length;

    self._get_y_axis = function(opts) {
        return {
            title: {
                text: opts.title || false,
            },
            opposite: opts.opposite || false,
            min: opts.min,
            tickInterval: opts.tick_interval,
            tickPixelInterval: 25,
            allowDecimals: opts.allow_decimals,
            labels: {
                formatter: function() {
                    return opts.formatter(this.value);
                },
            },
            reversedStacks: opts.reversed_stacks || false,
        };
    };

    self._tooltip_point = function(point, formatter) {
        if (point.series.type == 'arearange') {
            return `<br><span style="font-size:11px;">${
                point.series.name
            }: </span><span style="font-weight: bold;font-size:11px;">${formatter(
                point.point.low,
            )} - ${formatter(point.point.high)}</span><br/>`;
        }
        return `<br><span style="font-size:11px;">${
            point.series.name
        }: </span><span style="font-weight: bold;font-size:11px;">${formatter(
            point.y,
        )}</span><br/>`;
    };

    self._get_tooltip = function(opts) {
        return {
            shared: opts.shared,
            formatter: function() {
                if (opts.shared) {
                    let tooltip = this.x;

                    for (let i = 0, l = this.points.length; i < l; i++) {
                        tooltip += self._tooltip_point(
                            this.points[i],
                            self.formatters[this.points[i].series.options.yAxis || 0],
                        );
                    }

                    return tooltip;
                }
                return (
                    this.x +
                    self._tooltip_point(this, self.formatters[this.series.options.yAxis || 0])
                );
            },
        };
    };

    if (self.y_axes) {
        self.formatters = [];
        self.y_axis_conf = [];

        for (let axis of self.y_axes) {
            let formatter = Formatters.gen_formatter(axis);
            self.formatters.push(formatter);

            self.y_axis_conf.push(
                self._get_y_axis({
                    formatter: formatter,
                    min: axis.min,
                    opposite: axis.opposite,
                    title: axis.title,
                    reversed_stacks: axis.reversed_stacks,
                    allow_decimals: axis.allow_decimals,
                    tick_interval: axis.tick_interval,
                }),
            );
        }
    } else {
        self.formatters = [opts.formatter || Formatters.gen_formatter(opts)];
        self.y_axis_conf = self._get_y_axis({
            formatter: self.formatters[0],
            min: opts.min,
            reversed_stacks: opts.reversed_stacks,
            tick_interval: opts.tick_interval,
            allow_decimals: opts.allow_decimals,
        });
    }

    self.tooltip_conf = self._get_tooltip({
        formatters: self.formatters,
        shared: self.shared_tooltip,
    });

    self.x_categories = ko.pureComputed(() => {
        let data = self.data();

        if (data) {
            return Object.keys(data);
        }

        // return ['2012', '2013', '2014', '2015'];
    });

    // self.series = ko.computed(function() {
    //     return [
    //         {
    //             name: 'Count',
    //             data: [1, 3, 2, 5],
    //             color: 'green',
    //             type: 'bar',
    //             // color: conf.color || self.get_color_from_int(series_idx),
    //             yAxis: 0,
    //             stack: 'count',
    //         },
    //         {
    //             name: 'Amount',
    //             data: [2000, 3000, 4000, 5000],
    //             type: 'bar',
    //             // color: self.series_conf[i].color || self.get_color_from_int(series_idx),
    //             yAxis: 1,
    //             stack: 'amount',
    //         }
    //     ]
    // })

    if (self.series_conf) {
        self.series = ko.pureComputed(() => {
            let data = self.data();

            let series = [];

            if (data) {
                let series_idx = 0;

                for (let conf of self.series_conf) {
                    let s = {
                        name: conf.name,
                        data: [],
                        type: conf.type || 'bar',
                        color: self.get_color(conf.color || series_idx),
                        yAxis: conf.y_axis || undefined,
                        stack: conf.key,
                    };

                    for (let d of Object.values(data)) {
                        s.data.push(d[conf.key]);
                    }

                    series_idx++;

                    series.push(s);
                }
            }

            return series;
        });
    } else {
        self.series = ko.pureComputed(() => {
            return self.data() || [];
        });
    }

    self.options = Utils.deep_merge(self.options, {
        colors: opts.colors || self.get_color_set(),
        chart: {
            type: 'column',
            spacing: opts.spacing || [10, 10, 10, 10],
            zoomType: opts.zoom_type,
            height: opts.height || 400,
        },
        title: {
            text: self.title,
        },
        xAxis: {
            title: {
                text: opts.x_label || undefined,
            },
            labels: {
                formatter: function() {
                    if (self.truncate_label_length) {
                        return String(this.value).truncate(self.truncate_label_length, 'middle');
                    }
                    return this.value;
                },
            },
        },
        yAxis: self.y_axis_conf,
        legend: {
            enabled: opts.legend === undefined ? true : opts.legend,
        },
        tooltip: self.tooltip_conf,
    });

    _dfd.resolve();

    return self;
}
