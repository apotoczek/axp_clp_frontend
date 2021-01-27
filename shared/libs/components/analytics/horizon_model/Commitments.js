/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import SimpleCashflowChart from 'src/libs/components/charts/SimpleCashflowChart';
import NavChart from 'src/libs/components/charts/NavChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import PercentInput from 'src/libs/components/basic/PercentInput';
import DateInput from 'src/libs/components/basic/DateInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import ExposureForm from 'src/libs/components/analytics/horizon_model/ExposureForm';
import * as Formatters from 'src/libs/Formatters';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="component-box hidden-pdf">
                <div class="row new-world-form">
                    <div class="col-xs-3">
                        <!-- ko renderComponent: aum --><!-- /ko -->
                    </div>
                    <div class="col-xs-3">
                        <!-- ko renderComponent: aum_growth_rate --><!-- /ko -->
                    </div>
                    <div class="col-xs-3">
                        <!-- ko renderComponent: target_pe_ratio --><!-- /ko -->
                    </div>
                    <div class="col-xs-3">
                        <!-- ko renderComponent: target_timestamp --><!-- /ko -->
                    </div>
                </div>
                <hr>
                <button class="btn btn-cpanel-success btn-sm" data-bind="click: run">Run Projection</button>
                <!-- ko renderComponent: exposure_popover --><!-- /ko -->
            </div>
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Calculating Future Commitments..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error()-->
            <div class="component-box">
                <!-- ko renderComponent: cashflow_chart --><!-- /ko -->
                <!-- ko renderComponent: commitment_chart --><!-- /ko -->
                <!-- ko renderComponent: performance_chart --><!-- /ko -->
                <!-- ko renderComponent: nav_chart --><!-- /ko -->
            </div>
            <!-- ko renderComponent: data_table --><!-- /ko -->
            <!-- /ko -->
        `);

    let _dfd = self.new_deferred();
    let _prv_target_timestamp = undefined;

    self.portfolio_uid_event = opts.portfolio_uid_event;
    self.base_query = opts.base_query || {};
    self.filters = opts.filters || {};
    self.time_interval = opts.time_interval;

    self.attribute_event = opts.attribute;
    self.attribute = Observer.observable(self.attribute_event);

    self.group_event = opts.group;
    self.group = Observer.observable(self.group_event);

    self.register_export_event = opts.register_export_event;
    self.results_per_page_event = opts.results_per_page_event;

    self.render_currency = opts.render_currency;

    self.set_auto_get_data = value => {
        self.defaults.set_auto_get_data(value);
        self.datasource.set_auto_get_data(value);
        self.exposure_form.set_auto_get_data(value);
    };

    self.events = {
        target_exposure: Utils.gen_event('ExposureForm.values', self.get_id()),
        aum: Utils.gen_event('Aum.value', self.get_id()),
        target_pe_ratio: Utils.gen_event('TargetPERatio.value', self.get_id()),
        aum_growth_rate: Utils.gen_event('AUMGrowthRate.value', self.get_id()),
        target_timestamp: Utils.gen_event('TargetTimestamp.value', self.get_id()),
    };

    self.defaults = new DataSource({
        auto_get_data: opts.auto_get_data,
        datasource: {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:horizon_model_defaults',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.portfolio_uid_event,
                    required: true,
                },
            },
        },
    });

    self.datasource = self.new_instance(DataSource, {
        auto_get_data: opts.auto_get_data,
        datasource: {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:projected_commitments',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.portfolio_uid_event,
                    required: true,
                },
                target_exposure: {
                    type: 'observer',
                    event_type: self.events.target_exposure,
                    required: true,
                },
                aum: {
                    type: 'observer',
                    event_type: self.events.aum,
                    required: true,
                },
                target_pe_ratio: {
                    type: 'observer',
                    event_type: self.events.target_pe_ratio,
                    required: true,
                },
                aum_growth_rate: {
                    type: 'observer',
                    event_type: self.events.aum_growth_rate,
                    required: true,
                },
                target_timestamp: {
                    type: 'observer',
                    event_type: self.events.target_timestamp,
                    required: true,
                },
                filters: self.filters,
                date_multiplier: 1000,
                time_interval: {
                    type: 'observer',
                    event_type: self.time_interval,
                    required: true,
                },
                attribute: {
                    type: 'observer',
                    event_type: self.attribute_event,
                    mapping: 'get_value',
                },
                group: {
                    type: 'observer',
                    event_type: self.group_event,
                    mapping: 'get_tiered_breakdown_key',
                },
            },
        },
    });

    self.defaults.data.subscribe(data => {
        if (data) {
            if (!self.target_pe_ratio.value()) {
                self.target_pe_ratio.value(data.target_pe_ratio);
            }
            if (!self.aum_growth_rate.value()) {
                self.aum_growth_rate.value(0.04);
            }
            if (!self.aum.value()) {
                self.aum.value(data.aum);
            }
            if (!self.target_timestamp.value() || data.target_timestamp !== _prv_target_timestamp) {
                _prv_target_timestamp = data.target_timestamp;
                self.target_timestamp.value(data.target_timestamp);
            }
        } else {
            self.aum.value(undefined);
            self.aum_growth_rate.value(undefined);
            self.target_pe_ratio.value(undefined);
            self.target_timestamp.value(undefined);
        }
    });

    self.aum = self.new_instance(NumberInput, {
        label: 'Total Plan Size (AUM)',
    });

    self.target_pe_ratio = self.new_instance(PercentInput, {
        label: 'Target PE Exposure',
    });

    self.aum_growth_rate = self.new_instance(PercentInput, {
        label: 'Plan Return (AUM Growth)',
        css: {'ipad-label': true},
    });

    self.target_timestamp = self.new_instance(DateInput, {
        label: 'Target Exposure Date',
    });

    self.exposure_form = self.new_instance(ExposureForm, {
        auto_get_data: opts.auto_get_data,
        datasource: {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:current_exposure',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.portfolio_uid_event,
                    required: true,
                },
            },
        },
    });

    self.exposure_popover = self.new_instance(NewPopoverButton, {
        id: 'exposure_popover',
        component: NewPopoverButton,
        label: 'Customize Exposure',
        css: {
            'btn-popover': false,
            'btn-cpanel-info': true,
            'btn-sm': true,
        },
        popover_options: {
            placement: 'bottom',
            css_class: 'popover-info',
        },
        popover: self.exposure_form,
    });

    self.nav_chart = self.new_instance(NavChart, {
        id: 'nav_chart',
        shared_tooltip: true,
        label_in_chart: true,
        label: 'Projected NAV',
        render_currency: self.render_currency,
        exporting: true,
        sum_stack: 'allocations',
        series: [
            {
                name: 'Future Allocations',
                key: 'nav_breakdown',
                stack: 'allocations',
                reverse_keys: true,
            },
            {
                name: 'Current Allocation',
                key: 'current',
                stack: 'allocations',
            },
            {
                name: 'Target Allocation',
                type: 'line',
                color: '#000',
                key: 'target',
                stack: 'target',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.nav_data;
            }
        }),
    });

    self.cashflow_chart = self.new_instance(SimpleCashflowChart, {
        id: 'cashflow_chart',
        shared_tooltip: true,
        label_in_chart: true,
        label: 'Projected Cash Flows',
        render_currency: self.render_currency,
        x_formatter: Formatters.date_quarterly,
        exporting: true,
        categories_key: 'dates',
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
                name: 'PE Target',
                type: 'line',
                key: 'pe_target',
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
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.cashflow_data;
            }
        }),
    });

    self.commitment_chart = self.new_instance(SimpleCashflowChart, {
        id: 'commitment_chart',
        shared_tooltip: true,
        label_in_chart: true,
        label: 'Commitments',
        x_formatter: Formatters.date_quarterly,
        render_currency: self.render_currency,
        categories_key: 'dates',
        exporting: true,
        sum_stack: 'new_commitments_by_style',
        series: [
            {
                name: 'New Commitments',
                stack: 'new_commitments_by_style',
                key: 'commitments_by_style',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.commitment_data;
            }
        }),
    });

    self.performance_chart = self.new_instance(TimeseriesChart, {
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
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.performance_data;
            }
        }),
    });

    self.data_table = self.new_instance(DataTable, {
        id: 'data_table',
        enable_column_toggle: true,
        inline_data: true,
        results_per_page_event: self.results_per_page_event,
        label: ko.pureComputed(() => {
            if (Utils.is_set(self.attribute(), true) && Utils.is_set(self.group(), true)) {
                return oneLine`
                        ${self.attribute().label} by ${self.group().label}
                    `;
            }
            return 'Projection Overview';
        }),
        enable_csv_export: true,
        css: {
            'table-light': true,
            'table-sm': true,
        },
        dynamic_columns: {
            data: ko.pureComputed(() => {
                let data = self.datasource.data();

                if (Utils.is_set(self.attribute(), true) && Utils.is_set(self.group(), true)) {
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
                        pe_target: 'money',
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

                        column_format = format_map[self.attribute().value];

                        if (column_format === 'money') {
                            column_format_args = {
                                render_currency: self.render_currency,
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
                        label: 'Contributions',
                        key: 'cont',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'Distributions',
                        key: 'dist',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'NAV',
                        key: 'nav',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'PE Target',
                        key: 'pe_target',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'Net Cash Flows',
                        key: 'net_cashflow',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'Unfunded',
                        key: 'unfunded',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                    {
                        label: 'Commitment',
                        key: 'commitment',
                        format: 'money',
                        format_args: {
                            render_currency: self.render_currency,
                        },
                    },
                ];
            }),
        },
        columns: [{key: 'date', label: 'Date', format: 'date'}],
        data: ko.computed(() => {
            let data = self.datasource.data();
            return data ? Object.values(data.table.data) : undefined;
        }),
    });

    if (self.register_export_event) {
        self.toggle_export_event = self.register_export_event.replace(
            '.register_action',
            '.enabled',
        );

        self.toggle_export_actions = function(enable) {
            Observer.broadcast(self.toggle_export_event, {
                title: 'Future Commitments',
                subtitle: 'XLS',
                type: 'Horizon Model',
                enabled: enable,
            });

            Observer.broadcast(self.toggle_export_event, {
                title: 'Commitments',
                subtitle: 'XLS',
                type: 'Horizon Model',
                enabled: enable,
            });
        };

        let export_csv_event = Utils.gen_event('HorizonModelCommitments.export', self.get_id());
        let export_commitments_event = Utils.gen_event('CommitmentsByStyle.export', self.get_id());

        Observer.broadcast(
            self.register_export_event,
            {
                title: 'Future Commitments',
                subtitle: 'XLS',
                type: 'Horizon Model',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.broadcast(
            self.register_export_event,
            {
                title: 'Commitments',
                subtitle: 'XLS',
                type: 'Horizon Model',
                event_type: export_commitments_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.export_future_commitments();
        });

        Observer.register(export_commitments_event, () => {
            self.export_commitments();
        });

        self.toggle_export_actions(false);

        self._prepare_future_commitments_export = DataThing.backends.useractionhandler({
            url: 'prepare_future_commitments_export',
        });

        self.export_future_commitments = function() {
            let data = self.datasource.get_query_params();

            self._prepare_future_commitments_export({
                data: data,
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
            });
        };

        self._prepare_commitments_export = DataThing.backends.useractionhandler({
            url: 'prepare_commitments_export',
        });

        self.export_commitments = function() {
            let data = self.datasource.get_query_params();

            self._prepare_commitments_export({
                data: data,
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
            });
        };

        self.datasource.data.subscribe(data => {
            if (data) {
                self.toggle_export_actions(true);
            } else {
                self.toggle_export_actions(false);
            }
        });
    }

    self.run = function() {
        if (!self.exposure_form.valid()) {
            bison.utils.Notify('Heads up!', 'Exposure needs to add up to 100%.', 'alert-danger');

            return;
        }

        Observer.broadcast(self.events.target_exposure, self.exposure_form.get_values());
        Observer.broadcast(self.events.aum, self.aum.value());
        Observer.broadcast(self.events.target_pe_ratio, self.target_pe_ratio.value());
        Observer.broadcast(self.events.aum_growth_rate, self.aum_growth_rate.value());
        Observer.broadcast(self.events.target_timestamp, self.target_timestamp.value());
    };

    self.reset = function() {
        Observer.broadcast(self.events.target_exposure, undefined);
        Observer.broadcast(self.events.aum, undefined);
        Observer.broadcast(self.events.target_pe_ratio, undefined);
        Observer.broadcast(self.events.aum_growth_rate, undefined);
        Observer.broadcast(self.events.target_timestamp, undefined);

        self.datasource.clear_data();
    };

    self.datasource.add_dependency(self.defaults);
    self.datasource.add_dependency(self.exposure_form);

    self.nav_chart.add_dependency(self.datasource);
    self.cashflow_chart.add_dependency(self.datasource);
    self.commitment_chart.add_dependency(self.datasource);

    self.add_dependency(self.datasource);

    self.when(
        self.datasource,
        self.defaults,
        self.nav_chart,
        self.cashflow_chart,
        self.commitment_chart,
        self.exposure_form,
        self.exposure_popover,
    ).done(() => {
        _dfd.resolve();
    });

    return self;
}
