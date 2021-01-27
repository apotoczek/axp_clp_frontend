/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import CashflowOverview from 'src/libs/components/analytics/CashflowOverview';
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(Object.assign({}, opts, {get_user: true}), components);

    self.define_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading overview..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() && data() -->
            <div data-bind="attr: { id: html_id() }">
                <!-- ko if: data_mode -->
                    <!-- ko renderComponent: cashflow_table --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot: data_mode -->
                    <!-- ko renderComponent: net_overview --><!-- /ko -->
                <!-- /ko -->
            </div>
            <!-- /ko -->
        `);

    self.user_fund_uid_event = opts.user_fund_uid_event;
    self.market_data_fund_uid_event = opts.market_data_fund_uid_event;
    self.portfolio_uid_event = opts.portfolio_uid_event;
    self.market_data_family_uid_event = opts.market_data_family_uid_event;

    self.user_fund_uid_required = opts.user_fund_uid_required || false;
    self.market_data_fund_uid_required = opts.market_data_fund_uid_required || false;
    self.portfolio_uid_required = opts.portfolio_uid_required || false;
    self.market_data_family_uid_required = opts.market_data_family_uid_required || false;
    self.entity_type = opts.entity_type;

    self.data_mode = ko.observable(false);

    self.show_metrics_chart = false;

    if (self.entity_type) {
        self.show_metrics_chart =
            self.entity_type !== 'portfolio' && self.entity_type !== 'market_data_family';
    }

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

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event(
            'AnalyticsNetOverview.export_cashflows',
            self.get_id(),
        );

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Cash Flows',
                subtitle: 'CSV',
                type: 'Overview',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.cashflow_table.export_csv();
        });
    }

    if (self.show_metrics_chart) {
        self.metrics_datasource = self.new_instance(DataSource, {
            datasource: opts.metrics_datasource,
        });

        self.add_dependency(self.metrics_datasource);

        if (opts.register_export_event) {
            const export_performance_event = Utils.gen_event(
                'AnalyticsNetOverview.export_performance',
                self.get_id(),
            );

            Observer.broadcast(
                opts.register_export_event,
                {
                    title: 'Performance Metrics',
                    subtitle: 'CSV',
                    type: 'Overview',
                    event_type: export_performance_event,
                },
                true,
            );

            Observer.register(export_performance_event, () => {
                DataThing.get({
                    params: {
                        target: 'csv_download_key',
                        columns: [
                            {key: 'date', label: 'Date'},
                            {key: 'irr', label: 'IRR'},
                            {key: 'dpi', label: 'DPI'},
                            {key: 'tvpi', label: 'TVPI'},
                            {key: 'rvpi', label: 'RVPI'},
                        ],
                        comps: [],
                        query: self.metrics_datasource.get_query_params(),
                    },
                    success: key => {
                        DataThing.form_post(config.download_csv_base + key);
                    },
                    force: true,
                });
            });
        }

        self.metrics_chart = self.new_instance(TimeseriesChart, {
            id: 'chart',
            template: 'tpl_chart_box',
            shared_tooltip: true,
            exporting: true,
            y_axes: [
                {
                    format: 'irr',
                    title: 'IRR',
                },
                {
                    format: 'multiple',
                    min: 0,
                    title: 'Multiple',
                    opposite: true,
                },
            ],
            series: [
                {
                    key: 'irr',
                    name: 'IRR',
                    type: 'line',
                    y_axis: 0,
                },
                {
                    key: 'dpi',
                    name: 'DPI',
                    type: 'line',
                    y_axis: 1,
                },
                {
                    key: 'rvpi',
                    name: 'RVPI',
                    type: 'line',
                    y_axis: 1,
                },
                {
                    key: 'tvpi',
                    name: 'TVPI',
                    type: 'line',
                    y_axis: 1,
                },
            ],
            data: self.metrics_datasource.data,
        });
    }

    self.cashflow_table = self.new_instance(DataTable, {
        id: 'cashflow_table',
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 15,
        template: 'tpl_data_table',
        inline_data: false,
        enable_csv_export: self.user_has_feature('dl_print_data'),
        enable_clear_order: true,
        columns: [
            {
                label: 'Date',
                key: 'date',
                format: 'backend_date',
            },
            {
                label: 'Amount',
                format: 'money',
                format_args: {
                    value_key: 'amount',
                    currency_key: 'base_currency',
                },
                type: 'numeric',
                disable_sorting: true,
            },
            {
                label: 'Translated Amount',
                format: 'money',
                format_args: {
                    value_key: 'translated_amount',
                    currency_key: 'translated_currency',
                },
                type: 'numeric',
                disable_sorting: true,
            },
            {
                label: 'Type',
                key: 'cf_type',
                format: 'cf_type',
            },
            {
                label: 'Non Capital',
                key: 'non_capital',
                format: 'boolean',
            },
            {
                label: 'Note',
                key: 'note',
            },
            {
                label: 'Fund',
                key: 'fund_name',
            },
        ],
        export_columns: [
            {
                label: 'Currency',
                key: 'base_currency',
                placement: {
                    position: 'left',
                    relative: 'Amount',
                },
            },
        ],
        datasource: opts.cashflow_table_datasource,
        dynamic_columns: [
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'cashflow_table_columns',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: self.user_fund_uid_event,
                            required: self.user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: self.market_data_fund_uid_event,
                            required: self.market_data_fund_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: self.portfolio_uid_event,
                            required: self.portfolio_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: self.market_data_family_uid_event,
                            required: self.market_data_family_uid_required,
                        },
                    },
                },
                placement: {
                    position: 'right',
                },
            },
        ],
    });

    self.add_dependency(self.cashflow_table);

    self.irr_subtext = ko.computed(() => {
        let data = self.data(),
            formatter = Formatters.gen_formatter('irr');

        if (data && Utils.is_set(data.irr_sub_year)) {
            if (data.irr_sub_year !== data.irr) {
                return `Sub-Year IRR: ${formatter(data.irr_sub_year)}`;
            }
        }
    });

    self.net_overview = self.new_instance(CashflowOverview, {
        id: 'overview',
        data: self.data,
        entity_type: self.entity_type,
        cashflow_chart_template: 'tpl_chart',
        exporting: true,
        metrics_chart: self.metrics_chart,
        callouts: [
            {
                label: 'Net IRR',
                value_key: 'irr',
                format: 'irr_highlight',
                subtext: self.irr_subtext,
            },
            {
                label: 'TVPI',
                value_key: 'tvpi',
                format: 'multiple_highlight',
            },
            {
                label: 'DPI',
                value_key: 'dpi',
                format: 'multiple_neutral',
            },
            {
                label: 'RVPI',
                value_key: 'rvpi',
                format: 'multiple_neutral',
            },
        ],
    });

    return self;
}
