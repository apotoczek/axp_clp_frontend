import $ from 'jquery';
import ko from 'knockout';
import bison from 'bison';
import config from 'config';

import * as Utils from 'src/libs/Utils';

import DataTable from 'src/libs/components/reports/visual_reports/DataTable';
import BarChart from 'src/libs/components/charts/BarChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import DataTablePageWrapper from 'src/libs/components/reports/visual_reports/DataTablePageWrapper';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import ReportMultiComponentWrapper from 'src/libs/components/reports/visual_reports/ReportMultiComponentWrapper';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import Report from 'src/libs/components/reports/visual_reports/base/Report';
import Editor from 'src/libs/components/reports/visual_reports/base/Editor';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Wizard from 'src/libs/components/reports/visual_reports/base/Wizard';
import TextGenerator from 'src/libs/components/reports/visual_reports/TextGenerator';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import HLPROverview from 'src/libs/components/reports/visual_reports/hlpr/HLPROverview';
import DataSource from 'src/libs/DataSource';

class HLPortfolio extends Report {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();
        const report_title = 'Portfolio Review Report';

        this.sub_type = 'hl_portfolio_report';
        this.__class__ = 'HLPortfolio';

        this.events.new('portfolio_uid');

        this.events.new('preview');
        this.events.new('disable_preview');
        this.events.new('edit');
        this.events.new('download_pdf');

        this.events.resolve_and_add('as_of_date', 'PopoverButton.value');
        this.events.resolve_and_add('time_interval', 'PopoverButton.value');
        this.events.resolve_and_add('render_currency', 'PopoverButton.value');
        this.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
        this.events.resolve_and_add('register_export', 'DynamicActions.register_action');
        this.events.resolve_and_add('portfolio:selected_groupings', 'PopoverButton.value');
        this.events.resolve_and_add('portfolio:selected_horizons', 'PopoverButton.value');

        this.events.resolve_and_add('benchmark_filters:enums', 'AttributeFilters.state');
        this.events.resolve_and_add('benchmark_filters:vintage_year', 'PopoverButton.value');
        this.events.resolve_and_add('benchmark_filters:fund_size', 'PopoverButton.value');
        this.events.resolve_and_add('benchmark_filters:lists', 'PopoverButton.value');

        this.events.resolve_and_add('horizon_analysis:horizon_years', 'PopoverButton.value');

        this.events.resolve_and_add('post_date_navs', 'BooleanButton.state');
        this.events.resolve_and_add('ignore_recallable', 'BooleanButton.state');

        this.portfolio_uid = Observer.observable(this.events.get('portfolio_uid'));
        this.time_interval = Observer.observable(this.events.get('time_interval'));

        this.get_peer_filters_event = ({id, overrides = {}}) => {
            let enum_types = {
                enums: {
                    event_type: this.events.get(`${id}:enums`, 'AttributeFilters.state'),
                },
                vintage_year: {
                    event_type: this.events.get(`${id}:vintage_year`, 'PopoverButton.value'),
                },
                fund_size: {
                    event_type: this.events.get(`${id}:fund_size`, 'PopoverButton.value'),
                },
                lists: {
                    event_type: this.events.get(`${id}:lists`, 'PopoverButton.value'),
                },
            };

            let trigger_events = [this.events.resolve_event(id, 'PopoverButton.closed')];

            for (let [key, config] of Object.entries(overrides)) {
                enum_types[key] = config;
                trigger_events.push(config.event_type);
            }

            let proxy = Observer.proxy({
                event_types: enum_types,
                auto_trigger: false,
                trigger_events: trigger_events,
            });

            this.hooks.push('after_set_state', () => {
                proxy.trigger();
            });

            return proxy.event;
        };

        this.benchmark_filters_event = this.get_peer_filters_event({
            id: 'benchmark_filters',
        });

        /************************************************
         *   DATA QUERIES
         ************************************************/

        let vehicle_query = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: this.get_default_query('vehicle'),
            },
        });

        let vehicle_funds = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: this.get_default_query('vehicle'),
                key: 'funds',
            },
        });

        let metrics_progression_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: this.get_default_query('vehicle:metrics_progression', {
                    metrics: ['irr', 'rvpi', 'tvpi', 'dpi'],
                    date_multiplier: 1000,
                }),
            },
        });

        let vehicle_meta_query = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:meta_data',
                    portfolio_uid: {
                        type: 'observer',
                        event_type: this.events.get('portfolio_uid'),
                        required: true,
                    },
                },
            },
        });

        let last_day_of_quarter = date => {
            let year = date.getFullYear();
            let month = date.getMonth();
            let quarter = Math.ceil((month + 1) / 3);
            return new Date(Date.UTC(year, quarter * 3, 0));
        };

        let last_day_of_year = date => {
            let year = date.getFullYear();
            return new Date(Date.UTC(year + 1, 0, 0));
        };

        let cashflow_time_series_by_quarter = time_series => {
            let mapped = time_series.map(date_val => [
                last_day_of_quarter(new Date(date_val[0])).getTime(),
                date_val[1],
            ]);

            let result = [];
            let date_val_sum = mapped[0];
            for (let i = 1; i < mapped.length; i++) {
                let date_val = mapped[i]; // [date, val]
                if (date_val_sum[0] == date_val[0]) {
                    date_val_sum[1] += date_val[1];
                } else {
                    result.push(date_val_sum);
                    date_val_sum = date_val;
                }
            }
            result.push(date_val_sum);
            return result;
        };
        let metric_time_series_by_quarter = time_series => {
            let mapped = time_series.map(date_val => [
                last_day_of_quarter(new Date(date_val[0])).getTime(),
                date_val[1],
            ]);

            let result = [];
            let date_val_latest = mapped[0];
            for (let i = 1; i < mapped.length; i++) {
                let date_val = mapped[i]; // [date, val]
                if (date_val_latest[0] == date_val[0]) {
                    date_val_latest[1] = date_val[1];
                } else {
                    result.push(date_val_latest);
                    date_val_latest = date_val;
                }
            }
            result.push(date_val_latest);
            return result;
        };

        let cashflow_time_series_by_year = time_series => {
            let mapped = time_series.map(date_val => [
                last_day_of_year(new Date(date_val[0])).getTime(),
                date_val[1],
            ]);

            let result = [];
            let date_val_sum = mapped[0];
            for (let i = 1; i < mapped.length; i++) {
                let date_val = mapped[i]; // [date, val]
                if (date_val_sum[0] == date_val[0]) {
                    date_val_sum[1] += date_val[1];
                } else {
                    result.push(date_val_sum);
                    date_val_sum = date_val;
                }
            }
            result.push(date_val_sum);
            return result;
        };

        let metric_time_series_by_year = time_series => {
            let mapped = time_series.map(date_val => [
                last_day_of_year(new Date(date_val[0])).getTime(),
                date_val[1],
            ]);

            let result = [];
            let date_val_latest = mapped[0];
            for (let i = 1; i < mapped.length; i++) {
                let date_val = mapped[i]; // [date, val]
                if (date_val_latest[0] == date_val[0]) {
                    date_val_latest[1] = date_val[1];
                } else {
                    result.push(date_val_latest);
                    date_val_latest = date_val;
                }
            }
            result.push(date_val_latest);
            return result;
        };

        let portfolio_data_chunked_by_period = ko.computed(() => {
            let vehicle_query_data = vehicle_query.data();
            let metrics_query_data = metrics_progression_datasource.data();
            if (vehicle_query_data && metrics_query_data) {
                let data = {};
                let cashflows = vehicle_query_data.chart_data;

                let period = this.time_interval();
                if (period.value === 'annual') {
                    data.contributions = cashflow_time_series_by_year(cashflows.contributions);
                    data.distributions = cashflow_time_series_by_year(cashflows.distributions);

                    data.navs = metric_time_series_by_year(cashflows.navs);
                    data.irr = metric_time_series_by_year(metrics_query_data.irr);
                    data.dpi = metric_time_series_by_year(metrics_query_data.dpi);
                    data.rvpi = metric_time_series_by_year(metrics_query_data.rvpi);
                    data.tvpi = metric_time_series_by_year(metrics_query_data.tvpi);
                } else {
                    data.contributions = cashflow_time_series_by_quarter(cashflows.contributions);
                    data.distributions = cashflow_time_series_by_quarter(cashflows.distributions);

                    data.navs = metric_time_series_by_quarter(cashflows.navs);
                    data.irr = metric_time_series_by_quarter(metrics_query_data.irr);
                    data.dpi = metric_time_series_by_quarter(metrics_query_data.dpi);
                    data.rvpi = metric_time_series_by_quarter(metrics_query_data.rvpi);
                    data.tvpi = metric_time_series_by_quarter(metrics_query_data.tvpi);
                }

                return data;
            }
        });

        let _this = this; // can this be removed????

        let render_currency = (_this.render_currency = ko.pureComputed(() => {
            let data = vehicle_query.data();
            if (data) {
                return data.render_currency;
            }
        }));

        let time_weighted_comparison_query = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: this.get_default_query('vehicle:time_weighted_comparison', {
                    date_multiplier: 1000,
                    horizon_years: {
                        mapping: 'get_values',
                        type: 'observer',
                        event_type: this.events.get('horizon_analysis:horizon_years'),
                        required: true,
                    },
                    market_ids: {
                        type: 'observer',
                        mapping: 'get_values',
                        event_type: this.events.resolve_event(
                            'horizon_analysis:indexes',
                            'PopoverButton.value',
                        ),
                        required: true,
                        default: [52618],
                    },
                    include_busmi: false,
                    include_peer_set: true,
                    peer_filters: {
                        type: 'observer',
                        event_type: this.benchmark_filters_event,
                    },
                    allow_empty_peer_filters: true,
                    peer_set_label: 'Private Market Benchmark',
                    provider: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: this.events.resolve_event(
                            'private_market:data_provider',
                            'PopoverButton.value',
                        ),
                    },
                }),
            },
        });

        let portfolio_detail_table_data = ko.computed(() => {
            let raw_data = portfolio_data_chunked_by_period();
            if (!raw_data) {
                return;
            }

            let res_obj = {};
            let render_currency = _this.render_currency();

            let table_metrics = [
                'contributions',
                'distributions',
                'navs',
                'irr',
                'tvpi',
                'dpi',
                'rvpi',
            ];
            for (let i = 0; i < table_metrics.length; i++) {
                let metric = table_metrics[i];
                let metric_timeseries = raw_data[metric];

                for (let j = 0; j < metric_timeseries.length; j++) {
                    let date = metric_timeseries[j][0];
                    let val = metric_timeseries[j][1];
                    if (!res_obj[date]) {
                        res_obj[date] = {};
                    }
                    res_obj[date][metric] = val;
                }
            }

            let res_arr = Object.keys(res_obj);
            res_arr = res_arr.map(date => {
                let line_item = res_obj[date];
                line_item.date = parseInt(date);
                line_item.render_currency = render_currency;
                let cont = line_item.contributions || 0;
                let dist = line_item.distributions || 0;

                if (cont != 0 || dist != 0) {
                    line_item.net_cashflows = cont + dist;
                }
                return line_item;
            });

            return res_arr.mergeSort(Utils.gen_sort_comp_fn('date'));
        });

        this.text_generators = {
            horizon_analysis: TextGenerator.horizon_analysis(
                vehicle_meta_query.data,
                time_weighted_comparison_query.data,
                this.attribute_filter_configs.data,
                this.events.get('benchmark_filters:enums'),
                this.events.get('benchmark_filters:vintage_year'),
                this.events.get('benchmark_filters:fund_size'),
                this.events.get('benchmark_filters:lists'),
                this.lists_query.data,
                vehicle_query.data,
            ),
        };

        /************************************************
         *   SIDE PANEL / CONTROL PANEL
         ************************************************/
        const post_date_navs_button = [];
        if (config.enable_roll_forward_ui) {
            post_date_navs_button.push(
                this.helpers.cpanel.boolean_button({
                    id: 'post_date_navs',
                    label: 'Roll Forward NAVs',
                    default_state: true,
                }),
            );
        }

        this.editor_cpanel_components = [
            /******* USER FUND SETTINGS *******/
            this.helpers.cpanel.label({
                id: 'user_fund_settings',
                label: 'Portfolio Settings',
            }),
            this.helpers.cpanel.as_of_date({
                id: 'as_of_date',
                portfolio_uid_event: this.events.get('portfolio_uid'),
            }),
            ...post_date_navs_button,
            this.helpers.cpanel.boolean_button({
                id: 'ignore_recallable',
                label: 'Ignore Recallable',
            }),
            this.helpers.cpanel.currency_radiolist({
                id: 'render_currency',
                portfolio_uid_event: this.events.get('portfolio_uid'),
            }),
            this.helpers.cpanel.radiolist({
                id: 'time_interval',
                label: 'Time Interval',
                datasource: [
                    {label: 'Quarterly', value: 'quarterly'},
                    {label: 'Annual', value: 'annual'},
                ],
                default_selected_value: 'quarterly',
            }),

            this.helpers.cpanel.label({
                id: 'horizon_analysis:label',
                label: 'Horizon Analysis',
            }),

            this.helpers.cpanel.benchmark_provider({
                id: 'data_provider',
                alias: 'private_market:data_provider',
                label: 'Data Provider',
            }),
            this.helpers.cpanel.checklist({
                id: 'horizon_years',
                alias: 'horizon_analysis:horizon_years',
                label: 'Horizons',
                datasource: this.helpers.misc.year_options(1, 3, 5, 10),
                selected_datasource: [1, 3, 5],
            }),
            this.helpers.cpanel.index_checklist({
                id: 'indexes',
                alias: 'horizon_analysis:indexes',
                portfolio_uid_event: this.events.get('portfolio_uid'),
                max_date_event: this.events.get('horizon_analysis:index_max_date_event'),
                min_date_event: this.events.get('horizon_analysis:index_min_date_event'),
                default_market_id: 100101,
            }),
            this.helpers.cpanel.peer_filters({
                id: 'benchmark_filters',
                label: 'Benchmark',
            }),
            // this.helpers.cpanel.settings_popover({
            //     id: 'horizon_analysis',
            //     label: 'Horizon Analysis',
            //     components: [
            //         this.helpers.cpanel.checklist({
            //             id: 'horizon_years',
            //             alias: 'horizon_analysis:horizon_years',
            //             label: 'Horizons',
            //             datasource: this.helpers.misc.year_options(1, 3, 5, 10),
            //             selected_datasource: [1, 3, 5],
            //         }),
            //         this.helpers.cpanel.boolean_button({
            //             id: 'include_peer_set',
            //             label: 'Include Peer Set',
            //             default_state: false,
            //         }),
            //         this.helpers.cpanel.index_checklist({
            //             id: 'indexes',
            //             alias: 'horizon_analysis:indexes',
            //             portfolio_uid_event: this.events.get('portfolio_uid'),
            //             max_date_event: this.events.get('horizon_analysis:index_max_date_event'),
            //             min_date_event: this.events.get('horizon_analysis:index_min_date_event'),
            //             default_market_id: 100101,
            //         }),
            //     ],
            // }),

            this.helpers.cpanel.label({
                id: 'multi_group_select',
                label: 'Multi Group Select',
            }),
            this.helpers.cpanel.checklist({
                id: 'groupings',
                alias: 'portfolio:selected_groupings',
                label: 'Groupings',
                datasource: {
                    type: 'dynamic',
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'breakdown_key',
                    },
                    query: {
                        target: 'vehicle:breakdown_options',
                        portfolio_uid: {
                            type: 'observer',
                            event_type: this.events.get('portfolio_uid'),
                            required: true,
                        },
                    },
                },
                selected_datasource: [
                    'vintage_year',
                    'attributes:d35a4b0d-b7c7-4ebd-a665-cb54c2077b82', // Geography
                    'attributes:113f2720-1cad-42ad-9a49-ba017cd3e5cc:limited', // Style
                ],
            }),
            this.helpers.cpanel.checklist({
                id: 'allocations_horizon_years',
                alias: 'portfolio:selected_horizons',
                label: 'Horizons',
                datasource: this.helpers.misc.year_options(1, 3, 5, 10, null),
                selected_datasource: [1],
            }),
        ];

        this.selected_horizons = ko.observable([]);
        Observer.register(this.events.get('portfolio:selected_horizons'), r => {
            this.selected_horizons(r);
        });
        this.selected_groupings = ko.observable([]);
        Observer.register(this.events.get('portfolio:selected_groupings'), r => {
            this.selected_groupings(r);
        });

        this.grouped_datasource_blob = {};

        this.hooks.push('after_set_state', () => {
            $('body').trigger('highchart:reflow');
        });

        let fund_details_table_cols = [
            {
                label: 'Name',
                key: 'name',
                format: 'strings',
            },
            {
                label: 'geography',
                key: 'geography',
                format: 'strings',
            },
            {
                label: 'Style/Focus',
                key: 'style',
                format: 'strings',
            },
            {
                label: 'IRR',
                key: 'irr',
                format: 'percent',
            },
            {
                label: 'TVPI',
                key: 'tvpi',
                format: 'percent',
            },
            {
                label: 'DPI',
                key: 'dpi',
                format: 'percent',
            },
            {
                label: 'Paid In',
                key: 'paid_in',
                format: 'money',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Distributed',
                key: 'distributed',
                format: 'money',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'NAV',
                key: 'nav',
                format: 'money',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Commitment',
                key: 'commitment',
                format: 'money',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Unfunded',
                key: 'unfunded',
                format: 'money',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
            },
        ];

        let portfolio_detail_table_cols = [
            {
                label: 'Date',
                key: 'date',
                format: 'date',
            },
            {
                label: 'IRR',
                key: 'irr',
                format: 'percent',
            },
            {
                label: 'TVPI',
                key: 'tvpi',
                format: 'percent',
            },
            {
                label: 'DPI',
                key: 'dpi',
                format: 'percent',
            },
            {
                label: 'RVPI',
                key: 'rvpi',
                format: 'percent',
            },
            {
                label: 'Paid In',
                format: 'money',
                key: 'contributions',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Distributed',
                format: 'money',
                key: 'distributions',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'Net Cash Flows',
                format: 'money',
                key: 'net_cashflows',
                format_args: {
                    render_currency: render_currency,
                },
            },
            {
                label: 'NAV',
                format: 'money',
                key: 'navs',
                format_args: {
                    render_currency: render_currency,
                },
            },
        ];

        // let twrr_analysis_table_cols = [
        //     {
        //         label: 'Holding Period',
        //         sort_key: 'start',
        //         type: 'string',
        //         format: 'backend_date_range',
        //         definition: 'Sub period for Time-Weighted Rate of Return',
        //     },
        //     {
        //         label: 'Start NAV',
        //         key: 'start_nav',
        //         format: 'money',
        //         format_args: {
        //             currency_key: 'render_currency',
        //             value_key: 'start_nav'
        //         },
        //     },
        //     {
        //         label: 'End NAV',
        //         format: 'money',
        //         key: 'end_nav',
        //         format_args: {
        //             currency_key: 'render_currency',
        //             value_key: 'end_nav'
        //         },
        //     },
        //     {
        //         label: 'Paid In',
        //         format: 'money',
        //         key: 'contrib',
        //         format_args: {
        //             currency_key: 'render_currency',
        //             value_key: 'contrib'
        //         },
        //         definition: 'Capital Committed / Paid In during the specified holding period.',
        //     },
        //     {
        //         label: 'Distributed',
        //         format: 'money',
        //         key: 'distrib',
        //         format_args: {
        //             currency_key: 'render_currency',
        //             value_key: 'distrib'
        //         },
        //         definition: 'Capital Committed / Paid In during the specified holding period.',
        //     },
        //     {
        //         label: 'Rate of Return',
        //         key: 'hpr',
        //         format: 'percent_highlight_delta',
        //         type: 'numeric',
        //         definition: 'Rate of Return for the specified Holding Period',
        //     }
        // ]

        this.editor_layout = {
            id: 'layout',
            component: PageLayout,
            page_css: 'fbr',
            mode: 'edit',
            pages: [
                {
                    is_cover: true,
                    layout: ['fund_meta_data'],
                },
                {
                    title: 'Portfolio Overview',
                    layout: ['portfolio_overview', 'periodic_cashflows', 'metrics_progression'],
                },
                {
                    title: 'Portfolio Detail Table',
                    layout: ['portfolio_detail_table'],
                },
                {
                    title: 'Current Allocation',
                    layout: ['nav_breakdown'],
                },
                {
                    title: 'Fund Detail',
                    layout: ['fund_details:nav_exposure_by_fund'],
                },
                {
                    title: 'Fund Detail',
                    layout: ['fund_details:table'],
                },
                {
                    title: 'Trailing Portfolio Performance',
                    layout: ['horizon_analysis'],
                },
                {
                    title: 'Trailing Portfolio Performance',
                    layout: ['trailing_performance'],
                },
                // {
                //     title: 'TWRR Analysis',
                //     layout: [
                //         'twrr_analysis:chart',
                //         // 'twrr_analysis:period_table',
                //     ],
                // },
                // {
                //     // title: 'TWRR Analysis',
                //     // multi_page: true,
                //     layout: [
                //         // 'twrr_analysis:chart',
                //         'twrr_analysis:period_table',
                //     ],
                //     // oversized_page: true, // <-- needed? prob a pag width thing... can't we just have landscape pages?
                // },
            ],
            components: [
                {
                    id: 'fund_meta_data',
                    component: ReportComponentWrapper,
                    allow_description: false,
                    can_hide: false,
                    save_event: this.events.get('save_draft'),
                    widget_config: {
                        id: 'fund_meta_data',
                        component: ReportMeta,
                        metric_table: {
                            data_key: 'characteristics',
                        },
                        logo_id: 'report_logo',
                        title_id: 'report_name',
                        datasources: {
                            characteristics: {
                                type: 'dynamic',
                                query: {
                                    target: 'vehicle:meta_data',
                                    portfolio_uid: {
                                        type: 'observer',
                                        event_type: this.events.get('portfolio_uid'),
                                        required: true,
                                    },
                                },
                            },
                            params: {
                                type: 'observer',
                                event_types: {
                                    as_of_date: {
                                        event_type: this.events.resolve_event(
                                            'as_of_date',
                                            'PopoverButton.value',
                                        ),
                                        mapping: 'get_value',
                                    },
                                    logo_src: {
                                        event_type: Utils.gen_event(
                                            'ImageCropper.chosen_image',
                                            this.get_id(),
                                            'editor',
                                            'report_logo',
                                        ),
                                    },
                                },
                            },
                        },
                    },
                },

                // - PORTFOLIO OVERVIEW - p. 1
                {
                    id: 'portfolio_overview',
                    component: ReportComponentWrapper,
                    allow_description: false,
                    title: 'Portfolio Overview',
                    save_event: this.events.get('save_draft'),
                    widget_config: {
                        component: HLPROverview,
                        datasource: {
                            type: 'dynamic',
                            query: this.get_default_query('vehicle'),
                        },
                    },
                },
                {
                    id: 'periodic_cashflows',
                    component: ReportComponentWrapper,
                    save_event: this.events.get('save_draft'),
                    widget_config: {
                        component: TimeseriesChart,
                        data: portfolio_data_chunked_by_period,
                        dependencies: [
                            vehicle_funds.get_id(),
                            metrics_progression_datasource.get_id(),
                        ],

                        id: 'chart:periodic_cashflows',
                        label: 'Cash Flows',
                        template: 'tpl_chart_box',

                        height: 300,

                        shared_tooltip: true,
                        exporting: true,
                        y_axes: [
                            {
                                format: 'money',
                                format_args: {
                                    render_currency: render_currency,
                                },
                            },
                        ],
                        series: [
                            {
                                key: 'contributions',
                                name: 'Contributions',
                                type: 'bar',
                            },
                            {
                                key: 'distributions',
                                name: 'Distributions',
                                type: 'bar',
                            },
                            {
                                key: 'navs',
                                name: 'NAV',
                                type: 'line',
                            },
                        ],
                    },
                },
                {
                    id: 'metrics_progression',
                    component: ReportComponentWrapper,
                    save_event: this.events.get('save_draft'),
                    allow_description: true,
                    caption: {
                        automatic_mode: false,
                        locked_mode: true,
                    },
                    widget_config: {
                        component: TimeseriesChart,

                        data: portfolio_data_chunked_by_period,
                        dependencies: [
                            vehicle_funds.get_id(),
                            metrics_progression_datasource.get_id(),
                        ],

                        id: 'chart:metrics_progression',
                        label: 'Metrics Progression',
                        template: 'tpl_chart_box',

                        height: 300,

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
                    },
                },

                // - PORTFOLIO OVERVIEW - Portfolio Detail Table - p. 2

                {
                    id: 'portfolio_detail_table',
                    component: ReportComponentWrapper,
                    save_event: this.events.get('save_draft'),

                    widget_config: {
                        inline_data: true,
                        css: {'table-light': true, 'table-sm': true},
                        component: DataTable,
                        columns: portfolio_detail_table_cols,

                        disable_sorting: true,
                        data: portfolio_detail_table_data,
                        dependencies: [
                            vehicle_funds.get_id(),
                            metrics_progression_datasource.get_id(),
                        ],
                    },
                },

                // - COMMITMENT ACTIVITY - p. 3

                // - CURRENT ALLOCATION - p. 4
                {
                    id: 'nav_breakdown',
                    component: ReportMultiComponentWrapper,
                    save_event: this.events.get('save_draft'),

                    edit_mode: true,
                    widget_configs_computed: ko.pureComputed(() => {
                        let selected_groupings = this.selected_groupings();
                        let components_arr = [];

                        for (let i = 0; i < selected_groupings.length; i++) {
                            let label = selected_groupings[i].label;
                            let breakdown_key = selected_groupings[i].value;
                            let datasource = this.get_vehicle_analysis_grouped_by(breakdown_key);

                            let widget_config = {
                                id: `nav_breaksown_${i}`,
                                component: BarChart,
                                component_type: 'BarChart',
                                label_in_chart: true,
                                label: `NAV % by ${label}`,
                                data: ko.pureComputed(() => {
                                    let data = datasource.data();
                                    if (data) {
                                        return data.mergeSort(Utils.gen_sort_comp_fn('name'));
                                    }
                                }),
                                loading: datasource.loading,
                                label_key: 'name',
                                value_key: 'nav_pct',
                                format: 'percent',
                                height: 240,
                            };

                            let wrapper_config = {
                                component: ReportComponentWrapper,
                                component_type: 'ReportComponentWrapper',
                                allow_description: false,
                                save_event: this.events.get('save_draft'),
                                widget_config: widget_config,
                            };
                            components_arr.push(wrapper_config);
                        }
                        return components_arr;
                    }),
                },

                // - FUND DETAIL - p. 5
                {
                    id: 'fund_details:nav_exposure_by_fund',
                    component: ReportComponentWrapper,
                    allow_description: false,
                    save_event: this.events.get('save_draft'),
                    widget_config: {
                        id: 'nav_exposure_by_fund',
                        component: BarChart,
                        label_in_chart: true,
                        label: 'Current Top 15 NAV Exposure by Fund',
                        data: ko.pureComputed(() => {
                            let data = vehicle_funds.data();

                            if (data) {
                                data.filter(a => isNaN(a.nav));
                                data.sort((a, b) => b.nav - a.nav);
                                return data.slice(0, 15);
                            }
                        }),
                        loading: vehicle_funds.loading,
                        label_key: 'name',
                        value_key: 'nav',
                        format: 'money',
                        format_args: {
                            render_currency: render_currency,
                        },
                        height: 800,
                    },
                },

                {
                    id: 'fund_details:table',
                    component: ReportComponentWrapper,
                    save_event: this.events.get('save_draft'),
                    widget_config: {
                        inline_data: true,
                        css: {'table-light': true, 'table-sm': true},
                        component: DataTable,
                        columns: fund_details_table_cols,
                        disable_sorting: true,
                        data: ko.pureComputed(() => {
                            let data = vehicle_funds.data();
                            if (data) {
                                return data.mergeSort(Utils.gen_sort_comp_fn('name'));
                            }
                        }),
                        loading: vehicle_funds.loading,
                    },
                },

                // - FUND DETAIL - p. 6

                {
                    id: 'horizon_analysis',
                    component: ReportComponentWrapper,
                    allow_description: true,
                    title: 'Horizon Analysis vs. Markets',
                    save_event: this.events.get('save_draft'),
                    caption: {
                        text_body_provider: this.text_generators.horizon_analysis,
                        max_length: 1500,
                    },
                    widget_config: {
                        template: 'tpl_chart_box',
                        component: GroupedBarChart,
                        format: 'percent',
                        data: time_weighted_comparison_query.data,
                        dependencies: [time_weighted_comparison_query.get_id()],
                    },
                },

                {
                    id: 'trailing_performance',
                    component: ReportMultiComponentWrapper,
                    save_event: this.events.get('save_draft'),

                    edit_mode: true,
                    widget_configs_computed: ko.pureComputed(() => {
                        let selected_groupings = this.selected_groupings();
                        let selected_horizons = this.selected_horizons();
                        let components_arr = [];

                        for (let j = 0; j < selected_horizons.length; j++) {
                            let time_horizon = selected_horizons[j];
                            for (let i = 0; i < selected_groupings.length; i++) {
                                let breakdown_key = selected_groupings[i].value;

                                let widget_config = {
                                    id: `tp_${i}_${j}`,
                                    component: BarChart,
                                    component_type: 'BarChart',
                                    label_in_chart: true,
                                    label: `IRR % by ${selected_groupings[i].label} (horizon: ${time_horizon.label})`,
                                    data: ko.pureComputed(() => {
                                        let data = this.get_vehicle_analysis_grouped_by(
                                            breakdown_key,
                                            time_horizon.value,
                                        ).data();
                                        if (data) {
                                            return data.mergeSort(Utils.gen_sort_comp_fn('name'));
                                        }
                                    }),
                                    loading: this.get_vehicle_analysis_grouped_by(
                                        breakdown_key,
                                        time_horizon.value,
                                    ).loading,
                                    label_key: 'name',
                                    value_key: 'irr',
                                    format: 'percent',
                                    height: 240,
                                };

                                let wrapper_config = {
                                    component: ReportComponentWrapper,
                                    component_type: 'ReportComponentWrapper',
                                    allow_description: false,
                                    save_event: this.events.get('save_draft'),
                                    widget_config: widget_config,
                                };

                                components_arr.push(wrapper_config);
                            }
                        }
                        return components_arr;
                    }),
                },

                // // - TWRR ANALYSIS - p. 7
                // {
                //     // NOTE: TWRR ANALYSIS pages might need some more hooking up, but the pdf is okay so far
                //     id: 'twrr_analysis:chart',
                //     component: ReportComponentWrapper,
                //     save_event: this.events.get('save_draft'),

                //     edit_mode: true,
                //     widget_config: {
                //         component: PointInTimeChart,
                //         render_currency: ko.pureComputed(() => {
                //             let data = twrr_analysis_datasource.data();
                //             if(data) {
                //                 return data.render_currency;
                //             }
                //         }),
                //         data: ko.computed(() => {
                //             let data = twrr_analysis_datasource.data();
                //             if(data) {
                //                 return data;
                //             }
                //         }),
                //         series_callback: chart => {
                //             let data = chart.data()
                //             if(data && data.periods && !data.error_data) {
                //                 return [
                //                     {
                //                         // name: 'Rate of Return',
                //                         data: data.periods.map(period => {
                //                             let time = period.start + (period.end - period.start) / 2;
                //                             return [time * 1000, period.hpr];
                //                         }),
                //                         type: 'column',
                //                         yAxis: 1,
                //                         color: chart.get_color('first'),
                //                         negativeColor: chart.get_color('second'),
                //                     },
                //                 ];
                //             }
                //             return [];
                //         },

                //         options: {
                //             yAxis: [
                //                 {
                //                     title: {
                //                         // text: 'Rate of Return'
                //                     },
                //                     // opposite: false,
                //                     labels: {
                //                         formatter: function() {
                //                             return Formatters.irr(this.value);
                //                         },
                //                     },
                //                 },
                //                 {
                //                     title: {
                //                         // text: 'Rate of Return'
                //                         // text: "I've got a loveley bunch of coconuts"
                //                     },
                //                     // opposite: false,
                //                     labels: {
                //                         formatter: function() {
                //                             return Formatters.irr(this.value);
                //                         },
                //                     },
                //                 },
                //             ],

                //         }
                //     }
                // },

                // {
                //     id: 'twrr_analysis:period_table',
                //     component: ReportComponentWrapper,
                //     save_event: this.events.get('save_draft'),

                //     edit_mode: true,
                //     widget_config: {
                //         component: DataTable,
                //         render_currency: render_currency,
                //         // register_export_event: register_export_event,
                //         // set_mode_event: Utils.gen_event('RadioButtons.state', self.get_id(), 'cpanel', 'dynamic_wrapper', 'point_in_time', 'view_toggle'),
                //         // dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
                //         // auto_get_data: false,
                //         // data: twrr_analysis_datasource.data,
                //         css: {'table-light': true, 'table-sm': true},
                //         inline_data: true,
                //         results_per_page: 100,
                //         // enable_clear_order: true,
                //         // enable_csv_export: true,
                //         export_type: 'analytics_point_in_time',
                //         row_key: 'start',
                //         columns: twrr_analysis_table_cols,
                //         data: ko.computed(() => {
                //             let data = twrr_analysis_datasource.data();
                //             if(data && data.error_data) {
                //                 return undefined;
                //             }
                //             if(data && data.periods) {
                //                 for(let i = 0; i < data.periods.length; i++) {
                //                     data.periods[i].render_currency = data.render_currency;
                //                 }
                //                 return data.periods;
                //             }
                //             return [];

                //         })

                //     }
                // }
            ],
        };

        this.viewer_layout = {
            id: 'layout',
            component: PageLayout,
            page_css: 'fbr',
            enable_toc: true,
            toc_page_number: 2,
            mode: 'view',
            pages: [
                {
                    is_cover: true,
                    layout: ['fund_meta_data'],
                },
                {
                    title: 'Portfolio Overview',
                    layout: ['portfolio_overview', 'periodic_cashflows', 'metrics_progression'],
                },
                {
                    title: 'Portfolio Detail Table',
                    multi_page: true,
                    layout: ['portfolio_detail_table'],
                },
                {
                    title: 'Current Allocation',
                    layout: ['nav_breakdown'],
                    multi_page_component_list: true,
                },
                {
                    title: 'Fund Detail',
                    layout: ['fund_details:nav_exposure_by_fund'],
                },
                {
                    title: 'Fund Detail',
                    exclude_from_toc: true,
                    multi_page: true,
                    layout: ['fund_details:table'],
                },
                {
                    title: 'Trailing Portfolio Performance',
                    layout: ['horizon_analysis'],
                },
                {
                    title: 'Trailing Portfolio Performance',
                    exclude_from_toc: true,
                    multi_page_component_list: true,
                    layout: ['trailing_performance'],
                },
                // {
                //     title: 'TWRR Analysis',
                //     layout: [
                //         'twrr_analysis:chart',
                //         // 'twrr_analysis:period_table',
                //     ],
                // },
                // {
                //     title: 'TWRR Analysis',
                //     // ↓ used to exclude the page title from the TOC
                //     exclude_from_toc: true,
                //     multi_page: true,
                //     layout: [
                //         // 'twrr_analysis:chart',
                //         'twrr_analysis:period_table',
                //     ],
                //     oversized_page: true, // <-- needed? prob a pag width thing... can't we just have landscape pages?
                // },
            ],
            components: [
                {
                    id: 'fund_meta_data',
                    template: 'tpl_report_component_wrapper_view',
                    component: ReportComponentWrapper,
                    widget_config: {
                        id: 'fund_meta_data',
                        report: this.report,
                        report_title: report_title,
                        template: 'tpl_fbr_report_cover',
                        component: ReportMeta,
                        data_map: {
                            as_of_date: {
                                key: 'params:as_of_date',
                                format: 'backend_date_quarterly',
                            },
                            logo_src: {
                                key: 'params:logo_src',
                            },
                            geography: {
                                key: 'characteristics:attributes:geography',
                                format: 'strings',
                            },
                            style: {
                                key: 'characteristics:attributes:style',
                                format: 'strings',
                            },
                            vintage_year: {
                                key: 'characteristics:vintage_year',
                            },
                        },
                    },
                },

                // - PORTFOLIO OVERVIEW - p. 1
                {
                    id: 'portfolio_overview',
                    component: ReportComponentWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    allow_description: false,
                    title: 'Portfolio Overview',
                    widget_config: {
                        component: HLPROverview,
                    },
                },
                {
                    id: 'periodic_cashflows',
                    component: ReportComponentWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    widget_config: {
                        component: TimeseriesChart,
                        id: 'chart:periodic_cashflows',
                        label: 'Cash Flows',
                        template: 'tpl_chart_box',
                        height: 300,
                        shared_tooltip: true,
                        exporting: true,
                        y_axes: [
                            {
                                format: 'money',
                                format_args: {
                                    render_currency: render_currency,
                                },
                            },
                        ],
                        series: [
                            {
                                key: 'contributions',
                                name: 'Contributions',
                                type: 'bar',
                                stack: 'test',
                            },
                            {
                                key: 'distributions',
                                name: 'Distributions',
                                type: 'bar',
                                stack: 'test',
                            },
                            {
                                key: 'navs',
                                name: 'NAV',
                                type: 'line',
                            },
                        ],
                    },
                },
                {
                    id: 'metrics_progression',
                    component: ReportComponentWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    allow_description: false,
                    widget_config: {
                        component: TimeseriesChart,
                        id: 'chart:metrics_progression',
                        label: 'Metrics Progression',
                        template: 'tpl_chart_box',
                        height: 300,
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
                    },
                },

                // - PORTFOLIO OVERVIEW - Portfolio Detail Table - p. 2

                {
                    id: 'portfolio_detail_table',
                    component: DataTablePageWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    widget_config: {
                        inline_data: true,
                        component: DataTable,
                        columns: portfolio_detail_table_cols,
                        disable_sorting: true,
                        enable_column_toggle: false,
                        enable_csv_export: false,
                        // results_per_page: 100,
                        css: {'table-light': true, 'table-sm': true},
                    },
                },

                // - COMMITMENT ACTIVITY - p. 3

                // - CURRENT ALLOCATION - p. 4
                {
                    id: 'nav_breakdown',
                    component: ReportMultiComponentWrapper,
                    multi_page_component_list: true,
                },

                // - FUND DETAIL - p. 5
                {
                    id: 'fund_details:nav_exposure_by_fund',
                    component: ReportComponentWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    widget_config: {
                        id: 'nav_exposure_by_fund',
                        component: BarChart,
                        label_in_chart: true,
                        label: 'Current Top 15 NAV Exposure by Fund',
                        label_key: 'name',
                        value_key: 'nav',
                        format: 'money',
                        format_args: {
                            debug: true,
                            value_key: 'nav',
                            currency_key: 'render_currency',
                        },
                        height: 800,
                    },
                },

                {
                    id: 'fund_details:table',
                    component: DataTablePageWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    widget_config: {
                        inline_data: true,
                        css: {
                            'table-light': true,
                            'table-sm': true,
                            'hl-report-portfolio-funds': true,
                        },
                        component: DataTable,
                        columns: fund_details_table_cols,
                        disable_sorting: true,
                    },
                },

                // - FUND DETAIL - p. 6

                {
                    id: 'horizon_analysis',
                    component: ReportComponentWrapper,
                    template: 'tpl_report_component_wrapper_view',
                    allow_description: true,
                    title: 'Horizon Analysis vs. Markets',
                    caption: {
                        text_body_provider: this.text_generators.horizon_analysis,
                    },
                    widget_config: {
                        template: 'tpl_chart_box',
                        component: GroupedBarChart,
                    },
                },

                {
                    id: 'trailing_performance',
                    component: ReportMultiComponentWrapper,
                    multi_page_component_list: true,
                },

                // // - TWRR ANALYSIS - p. 7
                // {
                //     id: 'twrr_analysis:chart',
                //     component: ReportComponentWrapper,
                //     template: 'tpl_report_component_wrapper_view',
                //     widget_config: {
                //         component: PointInTimeChart,
                //     }
                // },

                // // "missing navs" table? REPORT MIGHT BREAK SILENTLY WITHOUT IT
                // {
                //     id: 'twrr_analysis:period_table',
                //     // test if it breaks for multi-page data
                //     component: DataTablePageWrapper,
                //     template: 'tpl_report_component_wrapper_view',
                //     widget_config: {
                //         component: DataTable,
                //         columns: twrr_analysis_table_cols,
                //         disable_sorting: true,
                //         inline_data: true, // what does this do?
                //         enable_column_toggle: false,
                //         enable_csv_export: false,
                //         results_per_page: 100,
                //         css: {'table-light': true, 'table-sm': true},

                //     },
                // },
            ],
        };

        this.editor = this.new_instance(Editor, {
            id: 'editor',
            report: this.report,
            cpanel: {
                id: 'cpanel',
                components: this.editor_cpanel_components,
            },
            body: {
                layout_engine: this.editor_layout,
                header: this.helpers.body.breadcrumb_header({
                    report: this.report,
                    portfolio_uid_event: this.events.get('portfolio_uid'),
                }),
                toolbar: this.helpers.body.editor_toolbar({
                    preview_event: this.events.get('preview'),
                    disable_event: this.events.get('disable_preview'),
                    start_disabled: true,
                }),
            },
        });

        this.viewer = this.new_instance(Viewer, {
            id: 'viewer',
            report: this.report,
            body: {
                layout_engine: this.viewer_layout,
                header: this.helpers.body.breadcrumb_header({
                    report: this.report,
                    portfolio_uid_event: this.events.get('portfolio_uid'),
                    css: {'sub-page-header': true},
                }),
                toolbar: this.helpers.body.viewer_toolbar({
                    edit_event: this.events.get('edit'),
                    report: this.report,
                }),
            },
        });

        this.wizard = this.new_instance(Wizard, {
            id: 'wizard',
            cashflow_type: 'net',
            breadcrumb_label: report_title,
            entity_types: ['portfolio'],
            callback: entity => {
                this.create_report(entity, rep => {
                    this.report(rep);
                    this.navigate('edit', rep);
                });
            },
        });

        this.when(this.editor, this.viewer, this.wizard).done(() => {
            Observer.broadcast(
                this.events.get('register_export'),
                {
                    title: 'Current Page',
                    subtitle: 'PDF',
                    event_type: this.events.get('download_pdf'),
                },
                true,
            );

            Observer.register(this.events.get('download_pdf'), () => {
                let report = this.report();
                let download_url = `${config.api_base_url}download/${report.report_type}/pdf/${report.uid}`;
                if (!report.is_frozen || !report.binary_asset_uid) {
                    this.publish_report(() => {
                        DataThing.form_post(download_url);
                    });
                } else {
                    DataThing.form_post(download_url);
                }
            });

            Observer.register(this.events.get('edit'), () => {
                this.navigate('edit', this.report());
            });

            Observer.register(this.events.get('preview'), () => {
                let updates = this.editor.get_full_snapshot();
                this.editor.loading(true);
                this.update_report(updates, report => {
                    this.editor.loading(false);
                    this.navigate('view', report);
                });
            });

            Observer.register(this.events.get('save_draft'), () => {
                let updates = this.editor.get_static_snapshot();

                this.update_report(updates, () => {
                    bison.utils.Notify(
                        'Draft Saved!',
                        '',
                        'alert-success',
                        1500,
                        undefined,
                        '<div class="system_notification alert alert-dismissable" style="display:none; width: 200px; text-align: center; position: absolute; top: 33px; left: 50%; margin-left: 50px;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                    );
                });
            });

            this.report.subscribe(this.broadcast_uid);

            this.set_state(this.initial_state);

            this.editor.body_loading.subscribe(loading => {
                Observer.broadcast(this.events.get('disable_preview'), loading);
            });

            _dfd.resolve();
        });
    }

    get_default_query(target, overrides = {}) {
        let query = {
            target: target,
            portfolio_uid: {
                type: 'observer',
                event_type: this.events.get('portfolio_uid'),
                required: true,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: this.events.resolve_event('render_currency', 'PopoverButton.value'),
                required: true,
            },
            as_of_date: {
                type: 'observer',
                event_type: this.events.get('as_of_date'),
                required: true,
                mapping: 'get_value',
            },
            post_date_navs: {
                type: 'observer',
                event_type: this.events.resolve_event('post_date_navs', 'BooleanButton.state'),
                default: true,
            },
            ignore_recallable: {
                type: 'observer',
                event_type: this.events.resolve_event('ignore_recallable', 'BooleanButton.state'),
                required: true,
            },
        };
        for (let [key, config] of Object.entries(overrides)) {
            query[key] = config;
        }
        return query;
    }

    get_vehicle_analysis_grouped_by(breakdown_key, horizon_years) {
        let blob = this.grouped_datasource_blob;
        let key = `group:${breakdown_key}_horizon:${horizon_years}`;

        if (!blob[key]) {
            let new_datasource = this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    mapping: 'recursive_get',
                    mapping_args: {
                        keys: ['breakdown', 'items'],
                    },
                    query: this.get_default_query('vehicle', {
                        breakdown_key: breakdown_key,
                        start_date_horizon: horizon_years,
                    }),
                },
            });

            blob[key] = new_datasource;
            this.trigger_portfolio_uid_event();
        }
        return blob[key];
    }

    trigger_portfolio_uid_event() {
        let portfolio_uid = this.portfolio_uid();
        if (portfolio_uid) {
            Observer.broadcast(this.events.get('portfolio_uid'), portfolio_uid);
        }
    }
}

export default HLPortfolio;
