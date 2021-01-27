/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import BubbleChart from 'src/libs/components/charts/BubbleChart';
import ScatterChart from 'src/libs/components/charts/ScatterChart';
import BarChart from 'src/libs/components/charts/BarChart';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div data-bind="style: { margin: margin }, if: visible">
                <div class="centered" data-bind="if: !hide_label && disable_controls">
                    <h2><span data-bind="text: chart_label"></span></h2>
                    <!-- ko if: chart_sub_label && chart_sub_label.length > 0 -->
                        <p data-bind="text: chart_sub_label"></p>
                    <!-- /ko -->
                </div>
                <div class="scoring-chart-controls" data-bind="if:!disable_controls">
                    <!-- ko renderComponent: y_axis_dropdown --><!-- /ko -->
                    by
                    <!-- ko renderComponent: x_axis_dropdown --><!-- /ko -->
                </div>
                <div data-bind = 'visible: !error_display()'>
                    <!-- ko with: chart -->
                        <!-- ko renderComponent: $data --><!--/ko -->
                    <!-- /ko -->
                </div>
                <div class="big-message empty-table" data-bind='visible: error_display, with: error_text'>
                    <h2 data-bind='text: heading'>No data to display</h2>
                    <h4 data-bind='text: subheading'>Please ensure that the underlying companies have data available to display</h4>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.datatable_page_event = opts.datatable_page_event;
    self.datatable_order_event = opts.datatable_order_event;

    self.margin = opts.margin || false;
    self.metric_events = opts.metric_events || false;

    self.render_currency = opts.render_currency;

    self.hide_label = opts.hide_label || false;
    self.disable_controls = opts.disable_controls || self.metric_events !== false;

    self.chart_sub_label =
        opts.chart_sub_label === undefined ? 'Only first 20 results shown' : opts.chart_sub_label;
    self.chart_label_prefix =
        opts.chart_label_prefix === undefined ? "Fund Results'" : opts.chart_label_prefix;
    self.chart_height = opts.chart_height;
    self.truncate_label_length = opts.truncate_label_length;

    self.axis_font_size = opts.axis_font_size;
    self.hide_axis_labels = opts.hide_axis_labels || false;

    self.bubble_metric_event = opts.bubble_metric_event;
    self.z_axis_metric = ko.observable({
        value: null,
        label: 'None',
    });

    if (opts.exporting === undefined) {
        self.exporting = true;
    } else {
        self.exporting = opts.exporting;
    }

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.maybe_components = [];

    if (self.disable_controls) {
        // in a column chart configuration, the y axis is the data axis, i.e. the axis to pass a default value for
        self.y_axis_metric = ko.observable(opts.y_axis_default || undefined);
        self.x_axis_metric = ko.observable(opts.x_axis_default || undefined);

        if (self.metric_events) {
            self.register_metric = function(event, observable) {
                Observer.register(event, payload => {
                    if (Object.isArray(payload)) {
                        if (payload.length > 0) {
                            observable(payload[0]);
                        } else {
                            observable(undefined);
                        }
                    } else {
                        observable(payload || undefined);
                    }
                });
            };

            if (self.metric_events.y_axis) {
                self.register_metric(self.metric_events.y_axis, self.y_axis_metric);
            }

            if (self.metric_events.x_axis) {
                self.register_metric(self.metric_events.x_axis, self.x_axis_metric);
            }
        }
    } else {
        self.x_axis_dropdown = self.new_instance(FilteredDropdown, {
            id: 'x_axis_scoring',
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            data: opts.metrics,
            inline: true,
            btn_style: {'min-width': '200px'},
        });

        self.y_axis_dropdown = self.new_instance(FilteredDropdown, {
            id: 'y_axis_scoring',
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            data: opts.metrics,
            default_selected_index: 0,
            inline: true,
            btn_style: {'min-width': '200px'},
        });

        self.x_axis_metric = ko.pureComputed({
            write: function(selected) {
                if (selected) {
                    self.x_axis_dropdown.set_selected_by_value(selected.value);
                }
            },
            read: function() {
                return self.x_axis_dropdown.selected();
            },
        });

        self.y_axis_metric = ko.pureComputed({
            write: function(selected) {
                if (selected) {
                    self.y_axis_dropdown.set_selected_by_value(selected.value);
                }
            },
            read: function() {
                return self.y_axis_dropdown.selected();
            },
        });

        self.maybe_components.push(self.y_axis_dropdown);
        self.maybe_components.push(self.x_axis_dropdown);
    }

    self.chart_label = ko.pureComputed(() => {
        let parts = [];

        if (self.chart_label_prefix && self.chart_label_prefix.length > 0) {
            parts.push(self.chart_label_prefix);
        }

        let y_axis = self.y_axis_metric();
        let x_axis = self.x_axis_metric();

        if (y_axis && y_axis.label) {
            parts.push(y_axis.label);
        }

        if (x_axis && x_axis.label) {
            parts.push('by');
            parts.push(x_axis.label);
        }

        return parts.join(' ');
    });

    self.metric_comps = ko.pureComputed(() => {
        let data = self.data();
        let comps = [];

        let y_axis = self.y_axis_metric();
        let x_axis = self.x_axis_metric();

        if (data && y_axis && y_axis.value) {
            if (self.comps) {
                data = ko.unwrap(self.comps).concat(data);
            }

            for (let i = 0, l = data.length; i < l; i++) {
                let comp = {
                    y_value: Utils.extract_data(y_axis.value, data[i]),
                    label: data[i].name,
                    color: data[i].color,
                };

                if (x_axis && x_axis.value) {
                    comp.x_value = Utils.extract_data(x_axis.value, data[i]);
                }
                comps.push(comp);
            }
        }

        return comps;
    });

    self.error_display = ko.pureComputed(() => {
        let metricComps = ko.unwrap(self.metric_comps);
        let x_axis = self.x_axis_metric();
        let display = false;

        for (let comp of metricComps) {
            if (comp.y_value === undefined) {
                display = true;
                break;
            }

            if (x_axis && comp.x_value === undefined) {
                display = true;
                break;
            }
        }

        Observer.broadcast_for_id(self.get_id(), 'ScoringChart.error', display);

        return display;
    });

    self.error_text = ko.pureComputed(() => {
        let heading,
            subheading = 'Error';
        let type_metric_y = '';
        let type_metric_x = '';

        let x_axis_metrics = self.x_axis_metric();
        let y_axis_metrics = self.y_axis_metric();

        if (y_axis_metrics !== undefined) {
            type_metric_y = y_axis_metrics.value;
        }

        if (x_axis_metrics !== undefined) {
            type_metric_x = x_axis_metrics.value;
        }

        if (type_metric_y === 'loss_ratio' || type_metric_x === 'loss_ratio') {
            heading = 'Selection error';
            subheading = 'Select a Grouping option on the panel before filtering by Loss Ratio';
        } else if (type_metric_y === 'total_loss_ratio' || type_metric_x === 'total_loss_ratio') {
            heading = 'Selection error';
            subheading =
                'Select a Grouping option on the panel before filtering by Total Loss Ratio';
        }

        return {
            heading: heading,
            subheading: subheading,
        };
    });

    self.x_formatter = function(value) {
        const x_axis = self.x_axis_metric();

        const format_args =
            x_axis.format === 'money' ? {render_currency: ko.unwrap(self.render_currency)} : {};

        if (x_axis && x_axis.format) {
            let formatter = Formatters.gen_formatter({
                ...x_axis,
                format_args,
            });
            return formatter(value);
        }

        return value;
    };

    self.y_formatter = function(value) {
        const y_axis = self.y_axis_metric();
        const format_args =
            y_axis.format === 'money' ? {render_currency: ko.unwrap(self.render_currency)} : {};

        if (y_axis && y_axis.format) {
            let formatter = Formatters.gen_formatter({
                ...y_axis,
                format_args,
            });
            return formatter(value);
        }

        return value;
    };

    self.z_formatter = function(value) {
        const z_axis = self.z_axis_metric();

        if (z_axis) {
            const format = Formatters.format_for_key(z_axis.value);
            const format_args =
                format === 'money' ? {render_currency: ko.unwrap(self.render_currency)} : {};

            if (format) {
                let formatter = Formatters.gen_formatter({
                    ...z_axis,
                    format,
                    format_args,
                });
                return formatter(value);
            }

            throw `No format associated with metric ${z_axis.value} for Bubble value`;
        }

        return value;
    };

    self.y_label = ko.pureComputed(() => {
        const y_axis = self.y_axis_metric();

        if (y_axis && y_axis['label']) {
            return y_axis.label;
        }

        return '';
    });

    self.x_label = ko.pureComputed(() => {
        const x_axis = self.x_axis_metric();

        if (x_axis && x_axis['label']) {
            return x_axis.label;
        }

        return '';
    });

    self.z_label = ko.pureComputed(() => {
        const z_axis = self.z_axis_metric();

        if (z_axis && z_axis['label']) {
            return z_axis.label;
        }

        return '';
    });

    self.y_key = ko.pureComputed(() => {
        const y_axis = self.y_axis_metric();
        return y_axis ? y_axis.value : 'irr';
    });

    self.x_key = ko.pureComputed(() => {
        const x_axis = self.x_axis_metric();
        return x_axis ? x_axis.value : '';
    });

    self.z_key = ko.pureComputed(() => {
        const z_axis = self.z_axis_metric();
        return z_axis ? z_axis['value'] : '';
    });

    if (self.datatable_page_event) {
        Observer.register(self.datatable_page_event, page => {
            self.update_query({
                page: page,
            });
        });
    }

    if (self.datatable_order_event) {
        Observer.register(self.datatable_order_event, order => {
            self.update_query({
                order_by: order,
            });
        });
    }

    if (self.bubble_metric_event) {
        Observer.register(self.bubble_metric_event, z_axis => {
            self.z_axis_metric(z_axis);
        });
    }

    self.bar_chart = self.new_instance(BarChart, {
        dependencies: [self.get_id()],
        value_key: 'y_value',
        comps: self.metric_comps,
        formatter: self.y_formatter,
        height: self.chart_height,
        y_label: self.hide_axis_labels ? undefined : self.y_label,
        truncate_label_length: self.truncate_label_length,
        axis_font_size: self.axis_font_size,
        exporting: self.exporting,
    });

    self.scatter_chart = self.new_instance(ScatterChart, {
        dependencies: [self.get_id()],
        comps: self.metric_comps,
        x_formatter: self.x_formatter,
        y_formatter: self.y_formatter,
        height: self.chart_height,
        x_label: self.hide_axis_labels ? undefined : self.x_label,
        y_label: self.hide_axis_labels ? undefined : self.y_label,
        axis_font_size: self.axis_font_size,
        exporting: self.exporting,
    });

    self.bubble_chart = self.new_instance(BubbleChart, {
        dependencies: [self.get_id()],
        label_in_chart: true,
        template: 'tpl_chart_box',
        id: 'bubble_chart',
        x_key: self.x_key,
        x_formatter: self.x_formatter,
        y_formatter: self.y_formatter,
        z_formatter: self.z_formatter,
        height: self.chart_height,
        y_key: self.y_key,
        x_label: self.hide_axis_labels ? undefined : self.x_label,
        y_label: self.hide_axis_labels ? undefined : self.y_label,
        z_key: self.z_key,
        z_label: self.z_label,
        data: self.data,
        exporting: self.exporting,
    });

    self.chart = ko.pureComputed(() => {
        let x_axis = self.x_axis_metric();

        if (x_axis && x_axis.value) {
            return self.z_key() ? self.bubble_chart : self.scatter_chart;
        }
        return self.bar_chart;
    });

    self.when(...self.maybe_components, self.scatter_chart, self.bubble_chart, self.bar_chart).done(
        () => {
            _dfd.resolve();
        },
    );

    return self;
}
