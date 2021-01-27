/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import WaterfallChart from 'src/libs/components/charts/WaterfallChart';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <div data-bind="attr: { id: html_id() }">
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
                <!-- ko if: data_mode -->
                    <!-- ko renderComponent: valuations_table --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot: data_mode -->
                    <!-- ko renderComponent: bridge_chart --><!--/ko -->
                    <!-- ko if: error_table() -->
                        <div class="widget-alert-error">
                            <strong>You have an error in your company valuations.</strong> <a class="btn btn-xs btn-danger pull-right" data-bind="click:scroll_to_error">View</a>
                        </div>
                    <!-- /ko -->
                    <div class="page-break"></div>
                    <!-- ko renderComponent: valuation_bridge_table --><!--/ko -->

                    <!-- ko with: error_table -->
                        <section class="error-table">
                            <!-- ko renderComponent: $data --><!--/ko -->
                        </section>
                    <!-- /ko -->

                <!-- /ko -->
            <!-- /ko -->
            </div>
        `);

    self.data_mode = ko.observable(false);

    if (opts.set_mode_event) {
        Observer.register_for_id(self.get_id(), opts.set_mode_event, mode => {
            self.toggle_mode(mode);
        });
    }

    self.toggle_mode = function(mode) {
        if (mode) {
            self.data_mode(mode === 'data');
        } else {
            self.data_mode(!self.data_mode());
        }
    };

    self.scroll_to_error = function() {
        $('.scrollable.content.page').scrollTop(10000);
    };

    if (opts.register_export_event) {
        self.register_export = function(title, subtitle, callback) {
            let namespace = title.replace(/\s+/g, '_').toLowerCase();
            let export_event = Utils.gen_event(`GrossValuationBridge.${namespace}`, self.get_id());

            Observer.broadcast(
                opts.register_export_event,
                {
                    title: title,
                    subtitle: subtitle,
                    type: 'Valuation Bridge',
                    event_type: export_event,
                },
                true,
            );

            Observer.register(export_event, callback);
        };

        self.register_export('Valuation Bridge', 'CSV', () => {
            self.valuation_bridge_table.export_csv();
        });

        self.register_export('Company Valuations', 'CSV', () => {
            self.valuations_table.export_csv();
        });
    }

    self.render_currency = ko.pureComputed(() => {
        let data = self.data();

        if (data) {
            return data.render_currency;
        }
    });

    self.valuations_table = self.new_instance(DataTable, {
        id: 'valuations_table',
        label: 'Company Valuations',
        inline_data: true,
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        enable_csv_export: true,
        export_type: 'analytics_valuations_table',
        column_toggle_placement: 'bottom',
        results_per_page: 50,
        css: {'table-light': true, 'table-sm': true},
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.valuations) {
                return data.valuations;
            }
            return [];
        }),
        columns: [
            {
                label: 'Company',
                key: 'company_name',
            },
            {
                label: 'Valuation Type',
                key: 'valuation_type',
            },
            {
                label: 'Add-on Name',
                key: 'addon_name',
            },
            {
                label: 'Date',
                key: 'date',
                format: 'backend_date',
            },
            {
                label: 'Equity Value',
                sort_key: 'equity_value',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency',
                    value_key: 'equity_value',
                },
                type: 'numeric',
            },
            {
                label: 'Enterprise Value',
                sort_key: 'enterprise_value',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency',
                    value_key: 'enterprise_value',
                },
                type: 'numeric',
            },
            {
                label: 'Net Debt',
                sort_key: 'debt',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency',
                    value_key: 'debt',
                },
                type: 'numeric',
            },
            {
                label: 'Revenue',
                sort_key: 'revenue',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency',
                    value_key: 'revenue',
                },
                type: 'numeric',
            },
            {
                label: 'EBITDA',
                sort_key: 'ebitda',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency',
                    value_key: 'ebitda',
                },
                type: 'numeric',
            },
            {
                label: 'EV/EBITDA',
                key: 'ev_multiple',
                format: 'multiple',
                type: 'numeric',
            },
            {
                label: 'Net Debt/EBITDA',
                key: 'debt_multiple',
                format: 'multiple',
                type: 'numeric',
            },
        ],
    });

    self.bridge_chart = self.new_instance(WaterfallChart, {
        id: 'bridge_chart',
        format: 'money',
        format_args: {
            render_currency: self.render_currency,
        },
        template: 'tpl_chart_box',
        exporting: true,
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.fund) {
                return data.fund;
            }
            return {};
        }),
        loading: self.loading,
        bars: [
            {
                name: 'Invested Capital',
                key: 'paid_in',
                color: '#4D4D4D',
            },
            {
                name: 'Revenue Growth',
                key: 'revenue_growth',
            },
            {
                name: 'Margin Improvement',
                key: 'margin_improvement',
            },
            {
                name: 'Platform Expansion',
                key: 'platform_expansion',
            },
            {
                name: 'Add-on Expansion',
                key: 'addon_expansion',
            },
            {
                name: 'Debt Paydown',
                key: 'debt_paydown',
            },
            {
                name: 'Other Growth',
                key: 'other',
            },
            {
                name: 'Total Value',
                sum: true,
                color: '#4D4D4D',
            },
        ],
    });

    self.valuation_bridge_table = self.new_instance(DataTable, {
        id: 'valuation_bridge_table',
        label: 'Valuation Bridge',
        inline_data: true,
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_localstorage: true,
        enable_csv_export: true,
        export_type: 'analytics_valuation_bridge_table',
        column_toggle_placement: 'left',
        css: {'table-light': true, 'table-sm': true},
        comps: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.fund) {
                return [data.fund];
            }
            return [];
        }),
        comp_color: '#61C38C',
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.fund && data.fund.companies) {
                return data.fund.companies;
            }
            return [];
        }),
        columns: [
            {
                label: 'Company',
                key: 'name',
            },
            {
                label: 'Start',
                key: 'start_date',
                format: 'backend_date',
                visible: false,
            },
            {
                label: 'End',
                key: 'end_date',
                format: 'backend_date',
                visible: false,
            },
            {
                label: 'Sector',
                key: 'sector',
                visible: false,
            },
            {
                label: 'Industry',
                key: 'industry',
                visible: false,
            },
            {
                label: 'Invested Capital',
                key: 'paid_in',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Equity Growth',
                key: 'equity_growth',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Revenue Growth',
                key: 'revenue_growth',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Margin Improvement',
                key: 'margin_improvement',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Platform Expansion',
                key: 'platform_expansion',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Add-on Expansion',
                key: 'addon_expansion',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Debt Paydown',
                key: 'debt_paydown',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Other Growth',
                key: 'other',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
            {
                label: 'Total Value',
                key: 'total_value',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
                type: 'numeric',
            },
        ],
    });

    self.bridge_error_data = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.errors) {
            return data.errors.companies;
        }

        return [];
    });

    self.bridge_error_table = self.new_instance(DataTable, {
        id: 'bridge_error_table',
        label: 'Errors',
        inline_data: true,
        enable_clear_order: true,
        enable_localstorage: true,
        enable_csv_export: true,
        export_type: 'analytics_bridge_error_table',
        css: {'table-light': true, 'table-sm': true},
        data: self.bridge_error_data,
        columns: [
            {
                label: 'Company',
                key: 'name',
            },
            {
                label: 'Problem',
                key: 'error',
            },
        ],
    });

    self.error_table = ko.pureComputed(() => {
        let bridge_error_data = self.bridge_error_data();

        if (bridge_error_data && bridge_error_data.length > 0) {
            return self.bridge_error_table;
        }

        return false;
    });

    return self;
}
