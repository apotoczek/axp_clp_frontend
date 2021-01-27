import ko from 'knockout';

import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';

import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ScoringChart from 'src/libs/components/charts/ScoringChart';

const ViewMode = {
    NoCashflows: 'no_cashflows',
    HasCashflows: 'has_cashflows',
};
class AnalyticsSideBySide extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.define_template(`
            <div data-bind="attr: { id: html_id() }">
                <!-- ko renderComponent: page_wrapper --><!-- /ko -->
            </div>
        `);

        const {
            register_export_event,
            available_results_per_page_event,
            results_per_page_event,
            has_cashflows_event,
            sort_order_event,
            currency_event,
            as_of_date_event,
            post_date_navs_event,
            user_fund_uid_event,
            market_data_fund_uid_event,
            enums_event,
            vintage_year_event,
            fund_size_event,
            show_currency_event,
            lists_event,
            show_lists_event,
            cf_filters,
        } = opts;

        this.events = this.new_instance(EventRegistry);
        this.events.resolve_and_add(
            'no_cashflows_data_table',
            'DataTable.results_per_page',
            'no_cashflows_results_per_page',
        );
        this.events.resolve_and_add(
            'has_cashflows_data_table',
            'DataTable.results_per_page',
            'has_cashflows_results_per_page',
        );
        this.events.add({
            name: 'export_csv_event',
            event: 'AnalyticsSideBySide.export_funds',
        });
        this.events.new('exclude_fund_uid');

        const mode_event = Observer.map(has_cashflows_event, has_cashflows =>
            has_cashflows ? ViewMode.HasCashflows : ViewMode.NoCashflows,
        );
        this.mode = ko.observable(ViewMode.NoCashflows);
        Observer.register(mode_event, mode =>
            this.toggle_mode(
                mode,
                show_currency_event,
                show_lists_event,
                available_results_per_page_event,
            ),
        );

        this.currency = ko.observable();
        Observer.register(currency_event, this.currency);
        if (market_data_fund_uid_event) {
            Observer.register(market_data_fund_uid_event, payload => {
                Observer.broadcast(this.events.get('exclude_fund_uid'), payload);
            });
        } else {
            Observer.register(user_fund_uid_event, payload => {
                Observer.broadcast(this.events.get('exclude_fund_uid'), payload);
            });
        }

        if (register_export_event) {
            this.register_export_event(register_export_event);
        }

        this.datasources = {
            [ViewMode.HasCashflows]: this.init_has_cashflow_datasource(
                as_of_date_event,
                user_fund_uid_event,
                market_data_fund_uid_event,
                this.events.get('exclude_fund_uid'),
                currency_event,
                post_date_navs_event,
                sort_order_event,
                enums_event,
                vintage_year_event,
                fund_size_event,
                lists_event,
            ),
            [ViewMode.NoCashflows]: this.init_no_cashflow_datasource(
                as_of_date_event,
                sort_order_event,
                enums_event,
                vintage_year_event,
                fund_size_event,
                this.events.get('exclude_fund_uid'),
            ),
        };

        this.active_chart_data = ko.pureComputed(() => {
            let data = this.datasources[this.mode()].data();
            switch (this.mode()) {
                case ViewMode.HasCashflows:
                    return (data && data.funds) || [];
                case ViewMode.NoCashflows:
                    return (data && data.results) || [];
                default:
                    throw oneLine`
                    [cashflows-side-by-side]: Invalid view mode, please make
                    use the ViewMode enum to change view mode.
                `;
            }
        });

        this.active_table_data = ko.pureComputed(() => {
            let data = this.datasources[this.mode()].data();
            switch (this.mode()) {
                case ViewMode.HasCashflows:
                    return (data && data.funds) || [];
                case ViewMode.NoCashflows:
                    return (data && data.results) || [];
                default:
                    throw oneLine`
                    [cashflows-side-by-side]: Invalid view mode, please make use
                    the ViewMode enum to change view mode.
                `;
            }
        });

        this.mode.subscribe(mode => {
            this.datasources[mode].set_auto_get_data(true);

            if (mode == ViewMode.HasCashflows) {
                this.datasources[ViewMode.NoCashflows].set_auto_get_data(false);
            } else {
                this.datasources[ViewMode.HasCashflows].set_auto_get_data(false);
            }
        });

        this.compset = this.compset_config(
            as_of_date_event,
            post_date_navs_event,
            user_fund_uid_event,
            market_data_fund_uid_event,
            cf_filters,
        );

        const chart_config = this.chart_config();
        this.data_tables_wrapper = this.init_data_tables_wrapper(
            mode_event,
            this.no_cashflows_data_table_config(results_per_page_event),
            this.has_cashflows_data_table_config(results_per_page_event),
        );
        this.page_wrapper = this.init_page_wrapper(chart_config, this.data_tables_wrapper);

        this.when(
            Object.values(this.datasources),
            this.page_wrapper,
            this.data_tables_wrapper,
        ).done(() => {
            dfd.resolve();
        });
    }

    set_auto_get_data(value) {
        this.datasources[this.mode()].set_auto_get_data(value);
    }

    init_no_cashflow_datasource(
        as_of_date_event,
        sort_order_event,
        enums_event,
        vintage_year_event,
        fund_size_event,
        exclude_fund_uid_event,
    ) {
        return this.new_instance(DataSource, {
            auto_get_data: this._auto_get_data,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'market_data:funds',
                    order_by: {
                        type: 'observer',
                        event_type: sort_order_event,
                    },
                    filters: {
                        type: 'dynamic',
                        query: {
                            as_of_date: {
                                type: 'observer',
                                event_type: as_of_date_event,
                                required: true,
                                mapping: 'get_value',
                            },
                            enums: {
                                type: 'observer',
                                event_type: enums_event,
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: vintage_year_event,
                            },
                            fund_size: {
                                type: 'observer',
                                event_type: fund_size_event,
                            },
                            exclude_fund_uid: {
                                type: 'observer',
                                event_type: exclude_fund_uid_event,
                                required: true,
                            },
                        },
                    },
                },
            },
        });
    }

    init_has_cashflow_datasource(
        as_of_date_event,
        user_fund_uid_event,
        market_data_fund_uid_event,
        exclude_fund_uid_event,
        currency_event,
        post_date_navs_event,
        sort_order_event,
        enums_event,
        vintage_year_event,
        fund_size_event,
        lists_event,
    ) {
        return this.new_instance(DataSource, {
            auto_get_data: false,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:side_by_side_comparison',
                    one_required: ['user_fund_uid', 'market_data_fund_uid'],
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                    },
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                    },
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: market_data_fund_uid_event,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: currency_event,
                        required: true,
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: post_date_navs_event,
                        default: true,
                    },
                    peer_order_by: {
                        type: 'observer',
                        event_type: sort_order_event,
                    },
                    peer_filters: {
                        type: 'dynamic',
                        query: {
                            enums: {
                                type: 'observer',
                                event_type: enums_event,
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: vintage_year_event,
                            },
                            fund_size: {
                                type: 'observer',
                                event_type: fund_size_event,
                            },
                            exclude_fund_uid: {
                                type: 'observer',
                                event_type: exclude_fund_uid_event,
                            },
                            lists: {
                                type: 'observer',
                                event_type: lists_event,
                            },
                        },
                    },
                },
            },
        });
    }

    compset_config(
        as_of_date_event,
        post_date_navs_event,
        user_fund_uid_event,
        market_data_fund_uid_event,
        cf_filters,
    ) {
        return {
            comps: [
                {
                    color: '#4D4D4D',
                    mapping: 'vehicle_to_market_data',
                    datasource: {
                        type: 'dynamic',
                        one_required: ['user_fund_uid', 'market_data_fund_uid'],
                        query: {
                            target: 'vehicle:overview',
                            as_of_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: as_of_date_event,
                                required: true,
                            },
                            post_date_navs: {
                                type: 'observer',
                                event_type: post_date_navs_event,
                                default: true,
                            },
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                            },
                            filters: cf_filters,
                        },
                    },
                },
            ],
        };
    }

    init_page_wrapper(chart_config, data_tables_wrapper) {
        return this.new_instance(Aside, {
            id: 'page_wrapper',
            template: 'tpl_aside_body',
            layout: {
                body: ['chart', 'data_tables_wrapper'],
            },
            components: [chart_config, data_tables_wrapper],
        });
    }

    no_cashflows_data_table_config(results_per_page_event) {
        const data_table_config = this.data_table_config(
            results_per_page_event,
            ViewMode.NoCashflows,
        );
        return {
            ...data_table_config,
            id: 'no_cashflows_data_table',
            id_callback: this.events.register_alias('no_cashflows_data_table'),
            columns: [
                ...data_table_config.columns,
                {
                    label: 'Fund Size',
                    sort_key: 'target_size_usd',
                    format: 'money',
                    format_args: {
                        currency_key: 'target_size_currency',
                        value_key: 'target_size_value',
                    },
                },
            ],
            dynamic_columns: [
                {
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'table_columns',
                            public_taxonomy: true,
                        },
                    },
                    placement: {
                        relative: 'Name',
                        position: 'right',
                    },
                },
            ],
        };
    }

    has_cashflows_data_table_config(results_per_page_event) {
        const data_table_config = this.data_table_config(
            results_per_page_event,
            ViewMode.HasCashflows,
        );
        return {
            ...data_table_config,
            id: 'has_cashflows_data_table',
            id_callback: this.events.register_alias('has_cashflows_data_table'),
        };
    }

    data_table_config(results_per_page_event, mode) {
        return {
            component: DataTable,
            dependencies: [this.datasources[mode].get_id()],
            css: {'table-light': true, 'table-sm': true},
            label: 'Peer Set',
            comp_color: '#61C38C',
            inline_data: true,
            data: this.active_table_data,
            compset: this.compset,
            results_per_page: 15,
            results_per_page_event,
            disable_sorting: true,
            enable_column_toggle: true,
            column_toggle_placement: 'left',
            columns: [
                {key: 'name', label: 'Name'},
                {key: 'vintage_year', label: 'Vintage'},
                {key: 'as_of_date', label: 'As of Date', format: 'backend_date'},
                ...this.available_metrics('key', mode),
            ],
            enable_csv_export: true,
            export_type: 'analytics_side_by_side',
        };
    }

    init_data_tables_wrapper(mode_event, ...tables) {
        return this.new_instance(DynamicWrapper, {
            id: 'data_tables_wrapper',
            active_component: `${this.mode()}_data_table`,
            set_active_event: Observer.map(mode_event, mode => `${mode}_data_table`),
            components: tables,
        });
    }

    chart_config() {
        return {
            id: 'chart',
            component: ScoringChart,
            title: 'Side By Side',
            margin: '20px',
            metrics: ko.pureComputed(() => this.available_metrics('value', this.mode())),
            data: this.active_chart_data,
            compset: this.compset,
            dependencies: Object.values(this.datasources).map(ds => ds.get_id()),
        };
    }

    available_metrics(value_key, mode) {
        let metrics = [
            {
                label: 'IRR',
                [value_key]: 'irr',
                format: 'irr',
            },
            {
                label: 'TVPI',
                [value_key]: mode == ViewMode.NoCashflows ? 'multiple' : 'tvpi', // multiple is legacy
                format: 'multiple',
            },
            {
                label: 'DPI',
                [value_key]: 'dpi',
                format: 'multiple',
            },
            {
                label: 'RVPI',
                [value_key]: 'rvpi',
                format: 'multiple',
            },
        ];
        if (mode != ViewMode.HasCashflows) {
            return metrics;
        }

        return metrics.concat([
            {
                label: '3 Year Momentum',
                [value_key]: 'momentum:3_year',
                format: 'percent',
                visible: false,
            },
            {
                label: '1 Year Momentum',
                [value_key]: 'momentum:1_year',
                format: 'percent',
            },
            {
                label: 'Paid In %',
                [value_key]: 'picc',
                format: 'percent',
            },
            {
                label: 'Paid In',
                [value_key]: 'paid_in',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
            },
            {
                label: 'Distributed',
                [value_key]: 'distributed',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
            },
            {
                label: 'NAV',
                [value_key]: 'nav',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
            },
            {
                label: 'Total Value',
                [value_key]: 'total_value',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
            },
            {
                label: 'Commitment',
                [value_key]: 'commitment',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
                visible: false,
            },
            {
                label: 'Unfunded',
                [value_key]: 'unfunded',
                format: 'money',
                format_args: {
                    render_currency: this.currency,
                },
                visible: false,
            },
            {
                label: 'Age',
                [value_key]: 'age_years',
                format: 'years',
                visible: false,
            },
        ]);
    }

    register_export_event(register_export_event) {
        Observer.broadcast(
            register_export_event,
            {
                title: 'Funds',
                subtitle: 'CSV',
                type: 'Side by Side',
                event_type: this.events.get('export_csv_event'),
            },
            true,
        );

        Observer.register(this.events.get('export_csv_event'), () => {
            const table = this.data_tables_wrapper.components[
                this.data_tables_wrapper._active_component()
            ];
            table.export_csv();
        });
    }

    toggle_mode(mode, show_currency_event, show_lists_event, available_results_per_page_event) {
        this.mode(mode);

        Observer.broadcast(show_currency_event, mode == ViewMode.HasCashflows);
        Observer.broadcast(show_lists_event, mode == ViewMode.HasCashflows);

        let has_cashflows_results_per_page_event = this.events.get(
            'has_cashflows_results_per_page',
        );
        let no_cashflows_results_per_page_event = this.events.get('no_cashflows_results_per_page');
        if (mode == ViewMode.NoCashflows) {
            if (has_cashflows_results_per_page_event) {
                Observer.unregister(has_cashflows_results_per_page_event);
            }
            if (no_cashflows_results_per_page_event) {
                Observer.register(no_cashflows_results_per_page_event, per_page => {
                    Observer.broadcast(available_results_per_page_event, per_page);
                });
            }
        } else {
            if (no_cashflows_results_per_page_event) {
                Observer.unregister(no_cashflows_results_per_page_event);
            }
            if (available_results_per_page_event) {
                Observer.register(has_cashflows_results_per_page_event, per_page => {
                    Observer.broadcast(available_results_per_page_event, per_page);
                });
            }
        }
    }
}

export default AnalyticsSideBySide;
