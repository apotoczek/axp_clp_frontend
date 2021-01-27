import ko from 'knockout';
import auth from 'auth';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import CashflowOverview from 'src/libs/components/analytics/CashflowOverview';
import NumberBox from 'src/libs/components/basic/NumberBox';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import MetricTable from 'src/libs/components/MetricTable';

class DiligenceAnalyticsOverview extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading overview..</h1>
            </div>
            <div data-bind="attr: { id: html_id() }">
                <!-- ko if: !loading() && !error() -->
                    <!-- ko if: data_mode -->
                        <!-- ko renderComponent: cashflow_table --><!-- /ko -->
                    <!-- /ko -->
                    <!-- ko ifnot: data_mode -->
                        <!-- ko if: data() && data().chart_data.running_total_value.length > 0 -->
                            <!-- ko renderComponent: net_overview --><!-- /ko -->
                        <!-- /ko -->
                        <!-- ko ifnot: data() && data().chart_data.running_total_value.length > 0 -->
                            <div class="row" data-bind="foreach: callouts">
                                <div class="col-xs-12 col-md-3" data-bind="renderComponent: $data"></div>
                            </div>
                            <div class="row">
                                <div class="col-xs-12">
                                    <div
                                    style="padding: 5px 20px 10px; margin-top:30px;"
                                    data-bind="renderComponent: metric_table">
                                    </div>
                                </div>
                            </div>
                        <!-- /ko -->
                    <!-- /ko -->
                <!-- /ko -->
            </div>
        `);

        this.show_metrics_chart = true;
        this.data_mode = ko.observable(false);
        this.project_uid_event = opts.project_uid_event;
        this.user_fund_uid_event = opts.user_fund_uid_event;
        if (opts.set_mode_event) {
            Observer.register_for_id(this.get_id(), opts.set_mode_event, mode => {
                this.toggle_mode(mode);
            });
        }

        this.toggle_mode = function(mode) {
            if (mode) {
                this.data_mode(mode === 'data');
            } else {
                this.data_mode(!this.data_mode());
            }
        };

        if (opts.register_export_event) {
            let export_csv_event = Utils.gen_event(
                'AnalyticsNetOverview.export_cashflows',
                this.get_id(),
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
                this.cashflow_table.export_csv();
            });
        }

        this.metrics_datasource = this.new_instance(DataSource, {
            datasource: opts.metrics_datasource,
        });

        this.add_dependency(this.metrics_datasource);

        if (opts.register_export_event) {
            const export_performance_event = Utils.gen_event(
                'AnalyticsNetOverview.export_performance',
                this.get_id(),
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
                        query: this.metrics_datasource.get_query_params(),
                    },
                    success: key => {
                        DataThing.form_post(config.download_csv_base + key);
                    },
                    force: true,
                });
            });
        }

        this.metrics_chart = this.new_instance(TimeseriesChart, {
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
            data: this.metrics_datasource.data,
        });

        this.performance_metrics = [
            {
                label: 'Net IRR',
                value_key: 'irr',
                format: 'irr_highlight',
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
        ];

        this.cashflow_table = this.new_instance(DataTable, {
            id: 'cashflow_table',
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 15,
            template: 'tpl_data_table',
            enable_csv_export: auth.user_has_feature('dl_print_data'),
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
        });

        this.add_dependency(this.cashflow_table);

        this.net_overview = this.new_instance(CashflowOverview, {
            id: 'overview',
            data: this.data,
            cashflow_chart_template: 'tpl_chart',
            exporting: true,
            metrics_chart: this.metrics_chart,
            callouts: [
                {
                    label: 'Net IRR',
                    value_key: 'irr',
                    format: 'irr_highlight',
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

        this.metrics = [
            {
                label: 'Commitment',
                format: 'money',
                format_args: {
                    value_key: 'commitment',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Paid In',
                format: 'money',
                format_args: {
                    value_key: 'sum_paid_in',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Unfunded',
                format: 'money',
                format_args: {
                    value_key: 'unfunded',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Distributed',
                format: 'money',
                format_args: {
                    value_key: 'sum_distributed',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Remaining (NAV)',
                format: 'money',
                format_args: {
                    value_key: 'nav',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Total Value',
                format: 'money',
                format_args: {
                    value_key: 'total_value',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Vintage Year',
                value_key: 'vintage_year',
            },
            {
                label: 'First Close',
                value_key: 'first_close',
                format: 'backend_date',
            },
            {
                label: 'As of Date',
                value_key: 'as_of_date',
                format: 'backend_date',
            },
            {
                label: 'Age',
                value_key: 'age_years',
                format: 'years',
            },
        ];

        this.metric_table = this.new_instance(MetricTable, {
            template: 'tpl_metric_table',
            css: {'table-light': true},
            metrics: this.metrics,
            data: ko.pureComputed(() => {
                let data = this.data();
                if (data) {
                    return data;
                }
                return [];
            }),
        });

        this.callouts = [];

        this.init_callout = function(opts) {
            return this.new_instance(NumberBox, {
                template: 'tpl_number_box',
                label: opts.label,
                format: opts.format,
                subtext: opts.subtext,
                data: ko.pureComputed(() => {
                    let data = this.data();
                    if (data) {
                        return data[opts.value_key];
                    }
                }),
                loading: this.loading,
            });
        };
        for (const metric of this.performance_metrics) {
            this.callouts.push(this.init_callout(metric));
        }
    }
}

export default DiligenceAnalyticsOverview;
