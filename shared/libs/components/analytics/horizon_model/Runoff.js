import config from 'config';
import ko from 'knockout';

import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import NavChart from 'src/libs/components/charts/NavChart';
import SimpleCashflowChart from 'src/libs/components/charts/SimpleCashflowChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';

const DEFAULT_TEMPLATE = `
    <div class="big-message" data-bind="visible: loading">
        <span class="glyphicon glyphicon-cog animate-spin"></span>
        <h1>Calculating Runoff Scenario..</h1>
    </div>
    <!-- ko if: !loading() && error() && error_template() -->
        <!-- ko template: error_template --><!-- /ko -->
    <!-- /ko -->
    <!-- ko if: !loading() && !error()-->
        <div class="component-box">
            <!-- ko renderComponent: cashflow_chart --><!-- /ko -->
            <!-- ko renderComponent: performance_chart --><!-- /ko -->
            <!-- ko renderComponent: nav_chart --><!-- /ko -->
        </div>
        <!-- ko renderComponent: data_table --><!-- /ko -->
    <!-- /ko -->
`;

class Runoff extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_template(DEFAULT_TEMPLATE);

        let _dfd = this.new_deferred();

        this.portfolio_uid_event = opts.portfolio_uid_event;
        this.base_query = opts.base_query || {};
        this.filters = opts.filters;
        this.time_interval = opts.time_interval;

        this.attribute_event = opts.attribute;
        this.attribute = Observer.observable(this.attribute_event);

        this.group_event = opts.group;
        this.group = Observer.observable(this.group_event);
        this.results_per_page_event = opts.results_per_page_event;
        this.render_currency = opts.render_currency;

        if (opts.register_export_event) {
            let export_excel_event = Utils.gen_event('HorizonModelRunoff.export', this.get_id());

            Observer.broadcast(
                opts.register_export_event,
                {
                    title: 'Cash Flow Runoff',
                    subtitle: 'XLS',
                    type: 'Horizon Model',
                    event_type: export_excel_event,
                },
                true,
            );

            Observer.register(export_excel_event, () => this.export_runoff());
        }

        this._setup_datasources(opts.auto_get_data);
        this._setup_nav_chart(opts.colors);
        this._setup_cash_flow_chart();
        this._setup_performance_chart();
        this._setup_data_table();

        this.add_dependency(this.datasource);

        this.when(
            this.nav_chart,
            this.cashflow_chart,
            this.performance_chart,
            this.data_table,
        ).done(() => {
            _dfd.resolve();
        });
    }

    set_auto_get_data(value) {
        this.datasource.set_auto_get_data(value);
    }

    _setup_datasources(auto_get_data) {
        this.datasource = this.new_instance(DataSource, {
            auto_get_data,
            datasource: {
                type: 'dynamic',
                query: {
                    ...this.base_query,
                    target: 'vehicle:projected_runoff',
                    attribute: {
                        type: 'observer',
                        event_type: this.attribute_event,
                        mapping: 'get_value',
                    },
                    group: {
                        type: 'observer',
                        event_type: this.group_event,
                        mapping: 'get_tiered_breakdown_key',
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: this.portfolio_uid_event,
                        required: true,
                    },
                    date_multiplier: 1000,
                    filters: this.filters,
                    time_interval: {
                        type: 'observer',
                        event_type: this.time_interval,
                        required: true,
                    },
                },
            },
        });
    }

    _prepare_runoff_export(data) {
        if (!this._prepare_runoff_export_endpoint) {
            this._prepare_runoff_export_endpoint = DataThing.backends.useractionhandler({
                url: 'prepare_runoff_export',
            });
        }

        this._prepare_runoff_export_endpoint(data);
    }

    export_runoff() {
        if (!this.datasource) {
            throw oneLine`
                [Runoff]: Cannot export without initializing the datasource
                first.
            `;
        }

        this._prepare_runoff_export({
            data: this.datasource.get_query_params(),
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
        });
    }

    //
    // Component Setups
    //

    _setup_nav_chart(colors) {
        if (!this.datasource) {
            throw oneLine`
                [Runoff]: Cannot initialize NavChart without having the
                datasource initialized first.
            `;
        }

        this.nav_chart = this.new_instance(NavChart, {
            id: 'nav_chart',
            colors: colors || ['#39C5EB'],
            shared_tooltip: true,
            label_in_chart: true,
            label: 'Projected NAV',
            render_currency: this.render_currency,
            exporting: true,
            sum_stack: 'allocations',
            series: [
                {
                    name: 'Allocations',
                    key: 'nav_breakdown',
                    stack: 'allocations',
                },
            ],
            data: ko.computed(() => {
                let data = this.datasource.data();
                return data ? data.nav_data : undefined;
            }),
        });

        this.nav_chart.add_dependency(this.datasource);
    }

    _setup_cash_flow_chart() {
        if (!this.datasource) {
            throw oneLine`
                [Runoff]: Cannot initialize CashFlow chart without having
                the datasource initialized first.
            `;
        }

        this.cashflow_chart = this.new_instance(SimpleCashflowChart, {
            id: 'cashflow_chart',
            shared_tooltip: true,
            label_in_chart: true,
            label: 'Projected Cash Flows',
            categories_key: 'dates',
            exporting: true,
            render_currency: this.render_currency,
            series: [
                {
                    name: 'Cumulative Net Cash Flows',
                    color: '#B4B4B4',
                    type: 'line',
                    key: 'running_net_cashflows',
                },
                {
                    name: 'Distributions',
                    key: 'dists',
                    color: '#39C5EB',
                    stack: 'distributions',
                },
                {
                    name: 'Contributions',
                    color: '#ff006e',
                    key: 'conts',
                    stack: 'contributions',
                },
                {
                    name: 'Net Cash Flows',
                    color: '#4D4D4D',
                    key: 'net_cashflows',
                    stack: 'net_cashflows',
                },
                {
                    name: 'NAV',
                    type: 'line',
                    key: 'navs',
                },
                {
                    name: 'Unfunded',
                    type: 'line',
                    key: 'unfunded',
                },
            ],
            data: ko.computed(() => {
                let data = this.datasource.data();
                return data ? data.cashflow_data : undefined;
            }),
        });

        this.cashflow_chart.add_dependency(this.datasource);
    }

    _setup_performance_chart() {
        if (!this.datasource) {
            throw oneLine`
                [Runoff]: Cannot initialize Performance chart without having
                the datasource initialized first.
            `;
        }

        this.performance_chart = this.new_instance(TimeseriesChart, {
            id: 'performance_chart',
            title: 'Projected Performance',
            show_markers: true,
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
                    name: 'IRR',
                    key: 'irr',
                    y_axis: 0,
                },
                {
                    name: 'TVPI',
                    key: 'tvpi',
                    y_axis: 1,
                },
                {
                    name: 'DPI',
                    key: 'dpi',
                    y_axis: 1,
                },
                {
                    name: 'RVPI',
                    key: 'rvpi',
                    y_axis: 1,
                },
            ],
            data: ko.computed(() => {
                let data = this.datasource.data();
                return data ? data.performance_data : undefined;
            }),
        });
        this.performance_chart.add_dependency(this.datasource);
    }

    _setup_data_table() {
        this.data_table = this.new_instance(DataTable, {
            id: 'data_table',
            enable_column_toggle: true,
            label: ko.pureComputed(() => {
                if (Utils.is_set(this.attribute(), true) && Utils.is_set(this.group(), true)) {
                    return oneLine`
                        ${this.attribute().label} by ${this.group().label}
                    `;
                }
                return 'Projection Overview';
            }),
            inline_data: true,
            results_per_page_event: this.results_per_page_event,
            enable_local_storage: true,
            enable_csv_export: true,
            css: {
                'table-light': true,
                'table-sm': true,
            },
            dynamic_columns: {
                data: ko.pureComputed(() => {
                    let data = this.datasource.data();

                    if (Utils.is_set(this.attribute(), true) && Utils.is_set(this.group(), true)) {
                        if (
                            !Utils.is_set(data, true) ||
                            !Utils.is_set(data.table.data, true) ||
                            !Utils.is_set(data.table.columns, true)
                        ) {
                            return [];
                        }

                        let format_map = {
                            irr: 'percent',
                            tvpi: 'multiple',
                            dpi: 'multiple',
                            rvpi: 'multiple',
                            running_net_cashflow: 'money',
                            dist: 'money',
                            cont: 'money',
                            net_cashflow: 'money',
                            nav: 'money',
                            unfunded: 'money',
                            commitment: 'money',
                        };

                        // The keys inside each entry in the table data are
                        // the columns.
                        return data.table.columns.map(name => {
                            let column_format;
                            let column_format_args;
                            if (name === 'date') {
                                return null;
                            }

                            column_format = format_map[this.attribute().value];

                            if (column_format === 'money') {
                                column_format_args = {
                                    render_currency: this.render_currency,
                                };
                            }

                            return {
                                label: name,
                                key: name,
                                format: column_format,
                                format_args: column_format_args,
                            };
                        });
                    }
                    return [
                        {
                            label: 'IRR',
                            key: 'irr',
                            format: 'percent',
                        },
                        {
                            label: 'TVPI',
                            key: 'tvpi',
                            format: 'multiple',
                        },
                        {
                            label: 'DPI',
                            key: 'dpi',
                            format: 'multiple',
                        },
                        {
                            label: 'RVPI',
                            key: 'rvpi',
                            format: 'multiple',
                        },
                        {
                            label: 'Cumulative Net Cash Flows',
                            key: 'running_net_cashflow',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'Distributions',
                            key: 'dist',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'Contributions',
                            key: 'cont',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'Net Cash Flows',
                            key: 'net_cashflow',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'NAV',
                            key: 'nav',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'Unfunded',
                            key: 'unfunded',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                        {
                            label: 'Commitment',
                            key: 'commitment',
                            format: 'money',
                            format_args: {
                                render_currency: this.render_currency,
                            },
                        },
                    ];
                }),
            },
            columns: [{key: 'date', label: 'Date', format: 'date'}],
            data: ko.computed(() => {
                let data = this.datasource.data();
                return data ? Object.values(data.table.data) : undefined;
            }),
        });
    }
}

export default Runoff;
