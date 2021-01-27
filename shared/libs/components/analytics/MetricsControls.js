import ko from 'knockout';
import {html} from 'common-tags';

import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';

import DataSource from 'src/libs/DataSource';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(html`
        <div class="row">
            <div class="col-xs-12 col-md-4">
                <!-- ko renderComponent: aggregate_dropdown --><!-- /ko -->
            </div>
            <div class="col-xs-12 col-md-4" style="text-align:center;">
                <div><!-- ko renderComponent: operation_dropdown --><!-- /ko --></div>
                <div>
                    <!-- ko renderComponent: left_dropdown --><!-- /ko -->
                    <!-- ko if: op_str -->
                    <span data-bind="text: op_str"></span>
                    <!-- ko renderComponent: right_dropdown --><!-- /ko -->
                    <!-- /ko -->
                </div>
            </div>
            <div class="col-xs-12 col-md-4 text-right">
                <!-- ko renderComponent: chart_type_dropdown --><!-- /ko -->
            </div>
        </div>
    `);

    let _dfd = self.new_deferred();

    self.analysis_query = {
        ...opts.base_query,
        ...opts.analysis_query,
        target: 'vehicle:metric_analysis',
        operation: {
            type: 'placeholder',
            required: true,
        },
        rate_of_change: {
            type: 'placeholder',
            required: true,
            default: false,
        },
    };

    self.time_zero = ko.observable(false).extend({rateLimit: 250});
    self.render_currency = ko.observable('USD').extend({rateLimit: 250});

    self.datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.analysis_query,
        },
    });

    self.datasource.register_query_update_callback((key, value) => {
        if (key == 'time_zero') {
            self.time_zero(value);
        } else if (key == 'render_currency') {
            self.render_currency(value);
        }
    });

    self.options_query = Object.assign({}, opts.base_query, {
        target: 'vehicle:gross:metric_options',
    });

    self.options_datasource = self.new_instance(DataSource, {
        start_loading: true,
        datasource: {
            type: 'dynamic',
            query: self.options_query,
        },
    });

    self.chart_type_dropdown = self.new_instance(NewDropdown, {
        btn_css: {},
        in_pdf: false,
        default_selected_index: 0,
        active_template: 'text-inline',
        options: Constants.chart_type_options,
        btn_style: {'padding-left': 0, 'padding-right': 0},
        menu_css: {'dropdown-menu-right': true},
    });

    self.chart_type = ko.pureComputed(() => {
        return self.chart_type_dropdown.selected_value();
    });

    self.aggregate_dropdown = self.new_instance(NewDropdown, {
        btn_css: {},
        in_pdf: false,
        default_selected_index: 0,
        active_template: 'text-inline',
        options: [
            {label: 'No Aggregate', value: 0},
            {label: 'Rate of Change', value: 1},
        ],
        btn_style: {'padding-left': 0, 'padding-right': 0},
    });

    self.operation_dropdown = self.new_instance(NewDropdown, {
        btn_css: {},
        in_pdf: false,
        default_selected_index: 0,
        active_template: 'text-inline',
        options: [
            {label: 'Single metric', value: null},
            {label: 'Ratio', value: 2},
        ],
        btn_style: {'padding-left': 0, 'padding-right': 0},
    });

    self.left_dropdown = self.new_instance(FilteredDropdown, {
        dependencies: [self.options_datasource.get_id()],
        btn_css: {},
        default_selected_index: 0,
        data: self.options_datasource.data,
        btn_style: {'padding-left': 0, 'padding-right': 0},
        value_key: 'identifier',
        active_template: 'text-inline',
    });

    self.right_options = ko.pureComputed(() => {
        let options = self.options_datasource.data();
        let left = self.left_dropdown.selected();
        let operation = self.operation_dropdown.selected_value();

        if (operation && options && left) {
            let identifier = left.identifier;
            let time_frames = left.time_frames;

            return options.filter(option => {
                let shared = time_frames.intersect(option.time_frames);

                return option.identifier !== identifier && shared.length;
            });
        }

        return [];
    });

    self.right_dropdown = self.new_instance(FilteredDropdown, {
        dependencies: [self.options_datasource.get_id()],
        btn_css: {},
        default_selected_index: 0,
        data: self.right_options,
        btn_style: {'padding-left': 0, 'padding-right': 0},
        value_key: 'identifier',
        active_template: 'text-inline',
    });

    self.precision = (multiplier = 1) => {
        let data = self.datasource.data();

        if (data && Utils.is_set(data.min) && Utils.is_set(data.max)) {
            let range = (data.max - data.min) * multiplier;

            if (range > 1) {
                return 2;
            }
            let parts = range.toString().split('.');

            if (parts.length < 2) {
                return 2;
            }

            let decimals = parts[1];
            let zero_count = 0;

            for (let digit of decimals) {
                zero_count++;
                if (digit != '0') {
                    break;
                }
            }

            return zero_count + 1;
        }

        return 2;
    };

    self.abbr_money = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && Utils.is_set(data.min) && Utils.is_set(data.max)) {
            let range = data.max - data.min;
            let threshold;

            if (data.max > 1000000000) {
                threshold = 10000000;
            } else {
                threshold = 10000;
            }

            if (range < threshold) {
                return false;
            }
            return true;
        }

        return false;
    });

    let formatters = {
        gen_percent: () => {
            return Formatters.gen_formatter({
                format: 'percent',
                format_args: {decimals: self.precision(100)},
            });
        },
        gen_multiple: () => {
            return Formatters.gen_formatter({
                format: 'multiple',
                format_args: {decimals: self.precision()},
            });
        },
        money_no_abbr: Formatters.gen_formatter({
            format: 'money',
            format_args: {abbreviate: false, render_currency: self.render_currency},
        }),
        money_abbr: Formatters.gen_formatter({
            format: 'money',
            format_args: {render_currency: self.render_currency},
        }),
        integer: Formatters.gen_formatter({format: 'number', format_args: {decimals: 0}}),
        float: Formatters.gen_formatter({format: 'number', format_args: {decimals: 2}}),
    };

    let _convert_format = function(backend_format) {
        switch (backend_format) {
            case 1:
                return self.abbr_money() ? formatters.money_abbr : formatters.money_no_abbr;
            case 2:
                return formatters.gen_percent();
            case 3:
                return formatters.gen_multiple();
            case 4:
                return formatters.integer;
            case 5:
            default:
                return formatters.float;
        }
    };

    let has_no_unit = backend_format => [4, 5].indexOf(backend_format) > -1;

    self.rate_of_change = ko.pureComputed(() => {
        return self.aggregate_dropdown.selected_value() == 1;
    });

    self.gen_formatter = ko
        .pureComputed(() => {
            let rate_of_change = self.rate_of_change();

            if (rate_of_change) {
                return formatters.gen_percent();
            }

            let left = self.left_dropdown.selected();
            let right = self.right_dropdown.selected();
            let operation = self.operation_dropdown.selected_value();

            if (left) {
                if (right && operation) {
                    if (has_no_unit(right.format)) {
                        return _convert_format(left.format);
                    } else if (has_no_unit(left.format)) {
                        return Formatters.no_format;
                    }

                    return formatters.gen_multiple();
                }

                return _convert_format(left.format);
            }

            return Formatters.no_format;
        })
        .extend({rateLimit: 250});

    self.statistics = self.new_instance(DataTable, {
        id: 'statistics',
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        label: 'Statistics',
        export_type: 'analytics_operating_metrics_statistics_table',
        results_per_page: 15,
        results_per_page_event: opts.results_per_page_event,
        columns: [
            {
                key: 'name',
                label: 'Company',
            },
            {
                label: 'Start',
                key: 'first_date',
                format: 'backend_date',
            },
            {
                label: 'End',
                key: 'last_date',
                format: 'backend_date',
            },
            {
                label: 'Start Value',
                key: 'first_value',
                type: 'numeric',
                format: value => self.y_formatter(value),
            },
            {
                label: 'End Value',
                key: 'last_value',
                type: 'numeric',
                format: value => self.y_formatter(value),
            },
            {
                label: 'Growth Rate',
                key: 'rate_of_change',
                type: 'numeric',
                format: 'percent',
            },
            {
                label: 'Ann. Growth Rate',
                key: 'annualized_rate_of_change',
                type: 'numeric',
                format: 'percent',
            },
            {
                label: '#',
                key: 'count',
                type: 'numeric',
                format: 'number',
            },
            {
                label: 'Mean',
                key: 'mean',
                type: 'numeric',
                format: value => self.y_formatter(value),
            },
            {
                label: 'Median',
                key: 'median',
                type: 'numeric',
                format: value => self.y_formatter(value),
            },
            {
                label: 'Std Dev',
                key: 'std_dev',
                type: 'numeric',
                format: value => self.y_formatter(value),
            },
        ],
        data: ko.pureComputed(() => {
            const data = self.datasource.data();

            if (data && data.statistics) {
                const rows = [];

                for (const [key, {label, values}] of Object.entries(data.statistics)) {
                    rows.push({key, name: label, ...values});
                }

                return rows;
            }

            return [];
        }),
    });

    self.normalized = ko.pureComputed(() => {
        const data = self.datasource.data();
        if (data) {
            return data.normalized;
        }
        return false;
    });

    self.y_formatter = value => {
        const formatter = self.gen_formatter();
        return formatter(value);
    };

    self.chart_data = ko.pureComputed(() => {
        const data = self.datasource.data();
        const series = {};

        if (!Utils.is_set(data, true)) {
            return series;
        }

        for (const {key} of self.statistics.rows()) {
            series[data.timeseries[key].label] = data.timeseries[key].values;
        }

        return series;
    });

    self.table_data = ko.pureComputed(() => {
        const data = self.datasource.data();
        if (!Utils.is_set(data?.timeseries, true)) {
            return [];
        }

        const rows_by_date = {};
        for (const [company_uid, entry] of Object.entries(data.timeseries)) {
            const {values} = entry;
            for (const [date, value] of values) {
                rows_by_date[date] = {
                    ...rows_by_date[date],
                    date,
                    [company_uid]: value,
                };
            }
        }

        return Object.values(rows_by_date).sort((a, b) => a.date - b.date);
    });

    self.table_dynamic_columns = ko.pureComputed(() => {
        const data = self.datasource.data();
        if (!Utils.is_set(data?.timeseries, true)) {
            return [];
        }

        const formatter = self.gen_formatter();

        const columns = {};
        for (const [company_uid, {label: company_name}] of Object.entries(data.timeseries)) {
            columns[company_uid] = {
                key: company_uid,
                label: company_name,
                valueFormatter: formatter,
            };
        }

        return Object.values(columns);
    });

    self.operation = ko.pureComputed(() => {
        let left = self.left_dropdown.selected();
        let right = self.right_dropdown.selected();

        let operation = self.operation_dropdown.selected_value() || 5;

        return {
            base: true,
            operation: operation,
            left,
            right,
        };
    });

    self.rate_of_change.subscribe(rate_of_change => {
        self.datasource.update_query({rate_of_change: rate_of_change});
    });

    self.operation.subscribe(operation => {
        self.datasource.update_query({operation: operation});
    });

    self.op_str = ko.pureComputed(() => {
        let value = self.operation_dropdown.selected_value();
        if (value == 1) {
            return 'x';
        } else if (value == 2) {
            return '/';
        }
    });

    self.add_dependency(self.options_datasource);
    self.add_dependency(self.datasource);

    self.when(
        self.options_datasource,
        self.datasource,
        self.operation_dropdown,
        self.right_dropdown,
        self.left_dropdown,
    ).done(() => {
        _dfd.resolve();
    });

    return self;
}
