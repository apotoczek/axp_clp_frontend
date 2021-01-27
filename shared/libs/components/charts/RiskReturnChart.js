/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import BubbleChart from 'src/libs/components/charts/BubbleChart';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <!-- ko if: show_dropdowns -->
                <div class="scoring-chart-controls">
                    <!-- ko if: $data.return_metric_dropdown -->
                        <!-- ko renderComponent: return_metric_dropdown --><!-- /ko -->
                    <!-- /ko -->
                    <!-- ko if: $data.risk_metric_dropdown -->
                        <!-- ko renderComponent: risk_metric_dropdown --><!-- /ko -->
                    <!-- /ko -->
                    <!-- ko if: $data.size_metric_dropdown -->
                        <!-- ko renderComponent: size_metric_dropdown --><!-- /ko -->
                    <!-- /ko -->
                </div>
            <!-- /ko -->
            <!-- ko renderComponent: chart --><!--/ko -->
        `);

    let _dfd = self.new_deferred();

    self.render_currency = opts.render_currency;

    self.risk_metrics = opts.risk_metrics;
    self.return_metrics = opts.return_metrics;
    self.size_metrics = opts.size_metrics;

    if (opts.risk_metric_event) {
        self._risk_metrics = Utils.array_to_map(self.risk_metrics, 'value');
        self.risk_metric = ko.observable(self.risk_metrics[0]);

        Observer.register(opts.risk_metric_event, metric => {
            metric = Utils.get(metric);

            self.risk_metric(self._risk_metrics[metric] || self.risk_metrics[0]);
        });
    } else {
        self.risk_metric_dropdown = self.new_instance(NewDropdown, {
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            label: 'Risk',
            data: self.risk_metrics,
            default_selected_index: 0,
            inline: true,
            btn_style: {'min-width': '200px'},
        });

        self.risk_metric = self.risk_metric_dropdown.selected;
    }

    if (opts.return_metric_event) {
        self._return_metrics = Utils.array_to_map(self.return_metrics, 'value');
        self.return_metric = ko.observable(self.return_metrics[0]);

        Observer.register(opts.return_metric_event, metric => {
            metric = Utils.get(metric);

            self.return_metric(self._return_metrics[metric] || self.return_metrics[0]);
        });
    } else {
        self.return_metric_dropdown = self.new_instance(NewDropdown, {
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            label: 'Return',
            data: self.return_metrics,
            default_selected_index: 0,
            inline: true,
            btn_style: {'min-width': '200px'},
        });

        self.return_metric = self.return_metric_dropdown.selected;
    }

    if (opts.size_metric_event) {
        self._size_metrics = Utils.array_to_map(self.size_metrics, 'value');
        self.size_metric = ko.observable(self.size_metrics[0]);

        Observer.register(opts.size_metric_event, metric => {
            metric = Utils.get(metric);

            self.size_metric(self._size_metrics[metric] || self.size_metrics[0]);
        });
    } else {
        self.size_metric_dropdown = self.new_instance(NewDropdown, {
            btn_css: {'btn-ghost-info': true, 'btn-sm': true},
            label: 'Size',
            data: self.size_metrics,
            default_selected_index: 0,
            inline: true,
            btn_style: {'min-width': '200px'},
        });

        self.size_metric = self.size_metric_dropdown.selected;
    }

    self.show_dropdowns =
        self.risk_metric_dropdown ||
        self.return_metric_dropdown ||
        self.size_metric_dropdown ||
        false;

    self.chart_data = ko.pureComputed(() => {
        let x_axis = self.risk_metric();
        let y_axis = self.return_metric();
        let z_axis = self.size_metric();
        let data = self.data();

        let comps = {};

        if (data) {
            let keys = Object.keys(data);

            for (let i = 0, l = keys.length; i < l; i++) {
                let x = Utils.extract_data(x_axis.value, data[keys[i]]);
                let y = Utils.extract_data(y_axis.value, data[keys[i]]);
                let z = Utils.extract_data(z_axis.value, data[keys[i]]);

                if (Utils.is_set(x) && Utils.is_set(y) && Utils.is_set(z)) {
                    comps[keys[i]] = {x: x, y: y, z: z};
                }
            }
        }

        return comps;
    });

    self.x_formatter = function(value) {
        let x_axis = self.risk_metric();
        if (x_axis && x_axis.format) {
            return Formatters.gen_formatter(x_axis)(value);
        }
        return value;
    };

    self.y_formatter = function(value) {
        let y_axis = self.return_metric();
        if (y_axis && y_axis.format) {
            return Formatters.gen_formatter(y_axis)(value);
        }
        return value;
    };

    self.z_formatter = function(value) {
        let z_axis = self.size_metric();
        if (z_axis && z_axis.format) {
            if (z_axis.format == 'money') {
                return Formatters.money(value, false, {render_currency: self.render_currency});
            }

            return Formatters.gen_formatter(z_axis)(value);
        }
        return value;
    };

    self.y_label = ko.computed(() => {
        let y_axis = self.return_metric();
        if (y_axis) {
            return y_axis.label;
        }
        return '';
    });

    self.x_label = ko.computed(() => {
        let x_axis = self.risk_metric();
        if (x_axis) {
            return x_axis.label;
        }
        return '';
    });

    self.z_label = ko.computed(() => {
        let z_axis = self.size_metric();
        if (z_axis) {
            return z_axis.label;
        }
        return '';
    });

    self.chart = self.new_instance(BubbleChart, {
        template: opts.chart_template,
        label: opts.label,
        label_in_chart: true,
        exporting: opts.exporting,
        height: opts.height || 600,
        data: self.chart_data,
        x_formatter: self.x_formatter,
        x_label: self.x_label,
        y_formatter: self.y_formatter,
        y_label: self.y_label,
        z_label: self.z_label,
        z_formatter: self.z_formatter,
        loading: self.loading,
    });

    self.when(self.chart).done(() => {
        _dfd.resolve();
    });

    return self;
}
