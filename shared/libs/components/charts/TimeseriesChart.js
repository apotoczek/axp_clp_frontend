/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    if (opts.title) {
        opts.label = opts.title;
        opts.label_in_chart = true;
    }

    let self = new BaseChart(opts, components);

    let _dfd = self.new_deferred();

    self.show_markers = opts.show_markers || false;
    self.show_arearange_markers = opts.show_arearange_markers || false;

    self.shared_tooltip = opts.shared_tooltip || false;

    self.data_event = opts.data_event;
    self.series_conf = opts.series;
    self.y_axes = opts.y_axes;
    self.plotlines_conf = opts.plotlines_conf;
    self.x_units = opts.x_units || undefined;

    self.disable_mouse_interaction = opts.disable_mouse_interaction || false;
    self.last_point_static_tooltip = opts.last_point_static_tooltip || false;
    self.sticky_tooltip_on_click = opts.sticky_tooltip_on_click || false;
    self.stacking = Utils.default_value(opts.stacking, true);
    self.max_point_width = Utils.default_value(opts.max_point_width, 15);

    self.x_categories = opts.x_categories || undefined;
    self.x_categories_key = opts.x_categories_key || false;

    self.x_quarter_offset = opts.x_quarter_offset || false;

    self.zoom_event = opts.zoom_event;

    if (self.x_categories_key) {
        self.x_categories = ko.pureComputed(() => {
            let data = self.data();

            if (data) {
                let categories = Utils.extract_data(self.x_categories_key, data);

                if (categories) {
                    return categories.map(Utils.unescape_html);
                }
            }

            return [];
        });
    }

    if (self.shared_tooltip) {
        self.crosshair_conf = {
            // zIndex: 100,
            color: 'rgba(150,150,150,0.8)',
            width: 1,
        };
    } else {
        self.crosshair_conf = undefined;
    }

    self.x_formatter = opts.x_formatter || Formatters.date;

    if (self.x_quarter_offset) {
        self.x_formatter = function(value) {
            if (value === 0) {
                return 'Inception';
            }

            return `Q${value}`;
        };

        self.x_axis_conf = {
            crosshair: self.crosshair_conf,
            allowDecimals: false,
            labels: {
                formatter: function() {
                    return self.x_formatter(this.value);
                },
            },
        };
    } else if (self.x_categories) {
        self.x_axis_conf = {
            crosshair: self.crosshair_conf,
        };
    } else {
        self.x_axis_conf = {
            type: 'datetime',
            crosshair: self.crosshair_conf,
        };

        // Only apply x formatter to labels if it's explicitly passed in
        // This let's us rely on highcharts automatic date formatting by
        // default
        if (opts.x_formatter) {
            self.x_axis_conf.labels = {
                formatter: function() {
                    return self.x_formatter(this.value);
                },
            };
        }
    }

    self.tooltip_formatter = opts.tooltip_formatter || self.x_formatter;

    self._get_y_axis = function(opts) {
        return {
            title: {
                text: opts.title || undefined,
            },
            opposite: opts.opposite || false,
            min: opts.min,
            max: opts.max,
            minRange: opts.minRange,
            categories: opts.categories,
            allowDecimals: opts.allow_decimals,
            labels: {
                formatter: function() {
                    if (opts.categories) {
                        return this.value;
                    }

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
                    let tooltip = self.tooltip_formatter ? self.tooltip_formatter(this.x) : this.x;
                    for (let i = 0, l = this.points.length; i < l; i++) {
                        tooltip += self._tooltip_point(
                            this.points[i],
                            self.formatters[this.points[i].series.options.yAxis || 0],
                        );
                    }

                    return tooltip;
                }

                let tooltip = self.tooltip_formatter ? self.tooltip_formatter(this.x) : this.x;
                return (
                    tooltip +
                    self._tooltip_point(this, self.formatters[this.series.options.yAxis || 0])
                );
            },
        };
    };

    let _generate_y_axes = y_axes => {
        let y_axis_conf = [],
            formatters = [];
        for (let i = 0, l = y_axes.length; i < l; i++) {
            let formatter = y_axes[i].formatter || Formatters.gen_formatter(y_axes[i]);
            formatters.push(formatter);

            y_axis_conf.push(
                self._get_y_axis({
                    formatter: formatter,
                    min: y_axes[i].min || opts.min,
                    max: y_axes[i].max || opts.max,
                    allow_decimals: y_axes[i].allow_decimals,
                    categories: y_axes[i].categories,
                    opposite: y_axes[i].opposite,
                    title: y_axes[i].title,
                    reversed_stacks: y_axes[i].reversed_stacks,
                }),
            );
        }

        return {y_axis_conf, formatters};
    };
    if (self.y_axes) {
        self.formatters = [];
        self.y_axis_conf = [];

        let {y_axis_conf, formatters} = _generate_y_axes(ko.unwrap(self.y_axes));
        self.formatters = formatters;

        if (ko.isObservable(self.y_axes)) {
            self.y_axis_conf = ko.observableArray(y_axis_conf);
            self.y_axes.subscribe(y_axes => {
                let {y_axis_conf, formatters} = _generate_y_axes(y_axes);
                self.y_axis_conf(y_axis_conf);
                self.formatters = formatters;
            });
        } else {
            self.y_axis_conf = y_axis_conf;
        }
    } else {
        self.formatters = [opts.formatter || Formatters.gen_formatter(opts)];
        self.y_axis_conf = self._get_y_axis({
            formatter: self.formatters[0],
            min: opts.min,
            max: opts.max,
            minRange: opts.min_range,
            allow_decimals: opts.allow_decimals,
            categories: opts.y_categories,
            reversed_stacks: opts.reversed_stacks,
        });
    }

    self.tooltip_conf = self._get_tooltip({
        formatters: self.formatters,
        shared: self.shared_tooltip,
    });

    if (self.plotlines_conf) {
        self.plotlines = ko.pureComputed(() => {
            let data = self.data();

            let plotlines = [];

            if (data) {
                for (let i = 0, l = self.plotlines_conf.length; i < l; i++) {
                    if (data[self.plotlines_conf[i].key]) {
                        let value = data[self.plotlines_conf[i].key];

                        let label = self.plotlines_conf[i].name;
                        if (self.plotlines_conf[i].display_value) {
                            label = `${label} ${self.formatters[0](value)}`;
                        }

                        plotlines.push({
                            id: self.plotlines_conf[i].key,
                            label: {
                                text: label,
                                align: 'left',
                                style: {
                                    'font-family': 'Lato',
                                    color: self.plotlines_conf[i].text_color || '#222222',
                                },
                            },
                            value: value,
                            color: self.plotlines_conf[i].color || 'black',
                            yAxis: self.plotlines_conf[i].y_axis,
                            xAxis: self.plotlines_conf[i].x_axis,
                            width: self.plotlines_conf[i].width || 2,
                            dashStyle: self.plotlines_conf[i].dashStyle || 'dash',
                            zIndex: 100,
                        });
                    }
                }
            }

            return plotlines;
        });
    }

    if (self.series_conf) {
        self.series = ko.pureComputed(() => {
            let data = self.data();

            let series = [];

            if (data) {
                let series_idx = 0;

                let series_conf = ko.unwrap(self.series_conf);

                for (let i = 0, l = series_conf.length; i < l; i++) {
                    let series_data = Utils.extract_data(series_conf[i].key, data);
                    if (series_data) {
                        if (Object.isObject(series_data)) {
                            let keys = Object.keys(series_data);

                            if (series_conf[i].reverse_keys) {
                                keys = keys.reverse();
                            }
                            for (let j = 0, k = keys.length; j < k; j++) {
                                series.push({
                                    id: keys[j],
                                    name: Utils.unescape_html(keys[j]),
                                    data: series_data[keys[j]],
                                    type: series_conf[i].type || 'line',
                                    color:
                                        self.get_color(series_conf[i].color) ||
                                        self.get_color_from_int(series_idx),
                                    yAxis: series_conf[i].y_axis || undefined,
                                    stack: series_conf[i].stack_by_key
                                        ? keys[i]
                                        : series_conf[i].stack,
                                    dashStyle: series_conf[i].dash_style || undefined,
                                });

                                series_idx++;
                            }
                        } else {
                            series.push({
                                id: series_conf[i].key,
                                name: Utils.unescape_html(series_conf[i].name),
                                data: series_data,
                                type: series_conf[i].type || 'line',
                                color:
                                    self.get_color(series_conf[i].color) ||
                                    self.get_color_from_int(series_idx),
                                yAxis: series_conf[i].y_axis || undefined,
                                stack: series_conf[i].stack,
                                dashStyle: series_conf[i].dash_style || undefined,
                            });

                            series_idx++;
                        }
                    }
                }
            }

            return series;
        });
    } else {
        self.series = ko.pureComputed(() => {
            return self.data() || [];
        });
    }

    if (self.data_event) {
        Observer.register(self.data_event, self.data);
    }

    if (self.disable_mouse_interaction) {
        self._container_style['pointer-events'] = 'none';
    }

    self.chart_events = {};
    self.series_events = {};

    if (self.zoom_event) {
        self.chart_events.selection = function(event) {
            let minX = Math.floor(event.xAxis[0].min / 1000);
            let maxX = Math.floor(event.xAxis[0].max / 1000);
            Observer.broadcast(self.zoom_event, {start: minX, end: maxX});

            event.preventDefault();
        };
    }

    if (self.last_point_static_tooltip) {
        self.chart_events.redraw = function() {
            let points = this.series.map(series => series.points[series.points.length - 1]);

            if (points && points.length > 0) {
                this.tooltip.refresh(points);
            }
        };
    }

    if (self.sticky_tooltip_on_click) {
        self._cloned_tooltip = null;

        self._clear_cloned_tooltip = function(chart) {
            if (self._cloned_tooltip && chart.container.firstChild.contains(self._cloned_tooltip)) {
                chart.container.firstChild.removeChild(self._cloned_tooltip);
            }

            self._cloned_tooltip = null;
        };

        self._clone_tooltip = function(chart) {
            if (chart.tooltip.label) {
                self._cloned_tooltip = chart.tooltip.label.element.cloneNode(true);

                chart.container.firstChild.appendChild(self._cloned_tooltip);
            }
        };

        self.chart_events.click = function() {
            self._clear_cloned_tooltip(this);
            self._clone_tooltip(this);
        };

        self.series_events.click = function() {
            self._clear_cloned_tooltip(this.chart);
            self._clone_tooltip(this.chart);
        };
    }

    self.options = Utils.deep_merge(self.options, {
        colors: opts.colors || self.get_color_set(),
        chart: {
            zoomType: 'x',
            type: 'line',
            events: self.chart_events,
        },
        xAxis: self.x_axis_conf,
        yAxis: self.y_axis_conf,
        legend: {
            enabled: opts.legend === undefined ? true : opts.legend,
        },
        tooltip: self.tooltip_conf,
        plotOptions: {
            series: {
                events: self.series_events,
            },
            bar: {
                stacking: self.stacking ? 'normal' : undefined,
                maxPointWidth: self.max_point_width,
            },
            column: {
                stacking: self.stacking ? 'normal' : undefined,
                maxPointWidth: self.max_point_width,
            },
            line: {
                lineWidth: 2,
                marker: {
                    enabled: self.show_markers,
                    radius: 3,
                    symbol: 'circle',
                },
            },
            scatter: {
                marker: {
                    radius: 3,
                    symbol: 'circle',
                },
            },
            spline: {
                lineWidth: 2,
                marker: {
                    enabled: self.show_markers,
                    radius: 3,
                    symbol: 'circle',
                },
            },
            arearange: {
                lineWidth: 1,
                marker: {
                    enabled: self.show_arearange_markers,
                    radius: 3,
                    symbol: 'circle',
                },
            },
        },
    });

    _dfd.resolve();

    return self;
}
