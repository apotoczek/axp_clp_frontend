/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Glossary from 'src/libs/components/reports/visual_reports/Glossary';
import DataTablePageWrapper from 'src/libs/components/reports/visual_reports/DataTablePageWrapper';
import DataTable from 'src/libs/components/reports/visual_reports/DataTable';
import MultiBarChart from 'src/libs/components/reports/visual_reports/MultiBarChart';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import PeerBenchmark from 'src/libs/components/reports/visual_reports/PeerBenchmark';
import CashflowOverview from 'src/libs/components/analytics/CashflowOverview';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import ChartBooleanWrapper from 'src/libs/components/reports/visual_reports/ChartBooleanWrapper';
import $ from 'jquery';
import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import Report from 'src/libs/components/reports/visual_reports/base/Report';
import Editor from 'src/libs/components/reports/visual_reports/base/Editor';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Wizard from 'src/libs/components/reports/visual_reports/base/Wizard';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Enums from 'src/libs/Enums';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new Report(opts, components);

    self.sub_type = 'fund_screening';
    self.__class__ = 'FundScreeningReport';

    let report_title = 'Fund Screening Report';

    let _dfd = self.new_deferred();

    self.events.new('user_fund_uid');
    self.events.new('market_data_fund_uid');
    self.events.new('exclude_fund_uid');

    self.events.new('preview');
    self.events.new('disable_preview');
    self.events.new('edit');
    self.events.new('download_pdf');

    self.events.resolve_and_add('render_currency', 'PopoverButton.value');
    self.events.resolve_and_add('post_date_navs', 'PopoverButton.value');
    self.events.resolve_and_add('ignore_recallable', 'PopoverButton.value');
    self.events.resolve_and_add('as_of_date', 'PopoverButton.value');
    self.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');
    self.events.resolve_and_add('pme_methodology:method', 'PopoverButton.value');

    // Events related to closed peer set filtering
    self.events.resolve_and_add('private_market:close_peer_set:enums', 'AttributeFilters.state');
    self.events.resolve_and_add(
        'private_market:close_peer_set:vintage_year',
        'PopoverButton.value',
    );
    self.events.resolve_and_add('private_market:close_peer_set:fund_size', 'PopoverButton.value');
    self.events.resolve_and_add('private_market:close_peer_set:lists', 'PopoverButton.value');

    self.pme_benchmark_data = ko.observable();

    self.get_default_query = function(target, overrides = {}) {
        let query = {
            target: target,
            user_fund_uid: {
                type: 'observer',
                event_type: self.events.get('user_fund_uid'),
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: self.events.get('market_data_fund_uid'),
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.get('render_currency'),
            },
            post_date_navs: {
                type: 'observer',
                event_type: self.events.get('post_date_navs'),
                default: true,
            },
            ignore_recallable: {
                type: 'observer',
                event_type: self.events.get('ignore_recallable'),
            },
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.get('as_of_date'),
                required: true,
            },
        };
        for (let [key, config] of Object.entries(overrides)) {
            query[key] = config;
        }

        return query;
    };

    self.peer_snapshot_provider = Observer.observable(
        self.events.resolve_event('private_market:data_provider', 'PopoverButton.value'),
    );

    self.peer_subtitle_callback = function(page) {
        if (page && page.layout && page.layout[0] && page.layout[0].widget) {
            let data = page.layout[0].widget.data();
            if (data && data.meta && data.meta.provider) {
                return `${data.meta.provider} Benchmark`;
            }
        }

        return 'Bison Benchmark';
    };

    /************************************************
     *             SIDE PANEL / CONTROL PANEL        *
     ************************************************/
    const post_date_navs_button = [];
    if (config.enable_roll_forward_ui) {
        post_date_navs_button.push(
            self.helpers.cpanel.boolean_button({
                id: 'post_date_navs',
                alias: 'user_fund:post_date_navs',
                label: 'Roll Forward NAVs',
            }),
        );
    }

    self.editor_cpanel_components = [
        /******* USER FUND SETTINGS *******/
        self.helpers.cpanel.label({
            id: 'user_fund_settings',
            label: 'User Fund Settings',
        }),
        self.helpers.cpanel.as_of_date({
            id: 'as_of_date',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
        }),
        ...post_date_navs_button,
        self.helpers.cpanel.boolean_button({
            id: 'ignore_recallable',
            label: 'Ignore Recallable',
        }),
        self.helpers.cpanel.currency_radiolist({
            id: 'render_currency',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
        }),
        self.helpers.cpanel.settings_popover({
            id: 'horizon_analysis',
            label: 'Horizon Analysis',
            components: [
                self.helpers.cpanel.checklist({
                    id: 'horizon_years',
                    alias: 'horizon_analysis:horizon_years',
                    label: 'Horizons',
                    datasource: self.helpers.misc.year_options(1, 3, 5, 10, null),
                    selected_datasource: [1, 3, 5, null],
                }),
                self.helpers.cpanel.boolean_button({
                    id: 'include_peer_set',
                    alias: 'horizon_analysis:include_peer_set',
                    label: 'Include Peer Set',
                }),
                // self.helpers.cpanel.boolean_button({
                //     id: 'horizon_analysis:include_pme',
                //     label: 'Include Public Index PME',
                // }),
            ],
        }),

        /******* PRIVATE MARKET DATA *******/
        self.helpers.cpanel.label({
            id: 'private_market_data',
            label: 'Private Market Data',
        }),

        self.helpers.cpanel.benchmark_provider({
            id: 'data_provider',
            alias: 'private_market:data_provider',
            label: 'Data Provider',
        }),
        self.helpers.cpanel.peer_filters({
            id: 'private_market:full_peer_set',
            label: 'Benchmark',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
            restrict_default_filters: [Enums.style, 'vintage_year'],
        }),
        self.helpers.cpanel.benchmark({
            id: 'peer_benchmark_edition',
            label: 'As of',
            provider_event: self.events.resolve_event(
                'private_market:data_provider',
                'PopoverButton.value',
            ),
        }),
        self.helpers.cpanel.currency_radiolist({
            id: 'peer_benchmark_currency',
            visible_callback: () => {
                let provider = self.peer_snapshot_provider();
                if (
                    provider &&
                    (provider.value == 'hamilton_lane' || provider.value == 'Hamilton Lane')
                ) {
                    return true;
                }
                return false;
            },
        }),
        self.helpers.cpanel.j_curve_filters({
            id: 'irr_j_curve',
            label: 'IRR J-Curve',
            default_selected_value: null,
            time_zero_default_enabled: false,
            extra_components: [
                self.helpers.cpanel.boolean_button({
                    id: 'deannualize_sub_year_irr',
                    label: 'Deannualize Sub-Year IRR',
                    default_state: true,
                    alias: 'irr_j_curve:deannualize_sub_year_irr',
                }),
            ],
        }),
        self.helpers.cpanel.settings_popover({
            id: 'momentum_analysis',
            label: 'TVPI Progression',
            components: [
                self.helpers.cpanel.radiolist({
                    id: 'range_method',
                    label: 'Method',
                    datasource: [
                        {label: 'Quartiles', value: 'quartiles'},
                        {label: 'Extremities', value: 'extremities'},
                    ],
                }),
                self.helpers.cpanel.radiolist({
                    id: 'metric',
                    label: 'Metric',
                    datasource: [
                        {
                            label: '1 Year Momentum',
                            horizon_years: 1,
                            value: 'momentum:1_year',
                            format: 'irr',
                            order_by: [{name: 'momentum:1_year', sort: 'desc'}],
                        },
                        {
                            label: '3 Year Momentum',
                            horizon_years: 3,
                            value: 'momentum:3_year',
                            format: 'irr',
                            order_by: [{name: 'momentum:3_year', sort: 'desc'}],
                        },
                        {
                            label: 'Momentum since inception',
                            horizon_years: null,
                            value: 'momentum:since_inception',
                            format: 'irr',
                            order_by: [{name: 'momentum:since_inception', sort: 'desc'}],
                        },
                    ],
                    selected_datasource: 'momentum:since_inception',
                }),
            ],
        }),
        self.helpers.cpanel.peer_filters({
            id: 'private_market:close_peer_set',
            label: 'Close Peers',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
            restrict_default_filters: [Enums.style, 'vintage_year'],
        }),

        /******* PUBLIC MARKET DATA *******/
        self.helpers.cpanel.label({
            id: 'public_market_data',
            label: 'Public Market Data',
        }),

        self.helpers.cpanel.index_checklist({
            id: 'indexes',
            alias: 'report:indexes',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
        }),

        self.helpers.cpanel.settings_popover({
            id: 'pme_trend',
            label: 'PME Trend',
            components: [
                self.helpers.cpanel.radiolist({
                    id: 'horizon_years',
                    label: 'Horizon',
                    datasource: self.helpers.misc.year_options(1, 3, 5, 10, null),
                    default_selected_value: null,
                    alias: 'pme_trend:horizon_years',
                }),
            ],
        }),
    ];

    self.default_captions = {
        net_performance:
            'FUND_NAME IRR and TVPI decreased in Q2 from 10.42% and 1.34x in the previous quarter. The fund called $3.4 million of capital and made $239 million of distributions in the quarter. The DPI ratio increased from 0.86x in the previous quarter.',
        peer_snapshot:
            'The benchmarking peer set selected includes Global, North America, and Europe- Western buyout funds from the 2008 vintage year. Against the composite, FUND_NAME is located in the third quartile for IRR and TVPI and the second quartile for DPI.',
        pme_trend:
            'As of Q2 2016, FUND_NAME has underperformed the Russell 2000 Index by -3.46%. Over the last three years, the fund has averaged -4.69% underperformance against the Russell 2000.',
        horizon_analysis:
            "Over the last year, FUND_NAME's NAV has grown more quickly than the public markets year but underperformed its peer set. Over the three and five year period, the fund has grown slower than the public and private markets.\n\nNote: The Peer Set is a portfolio of 21 Global, North America, and European - Western buyout funds from the 2007 - 2009 vintage years with a fund size between $2.0 billion and $5.0 billion. The components of the peer portfolio can be found in the Appendix.",
        side_by_side:
            "Based on the fund's characteristics, the data set has been narrowed down to Global, North America, and Europe - Western buyout funds between $2.0 billion and $5.0 billion.\n\nAmong this peer set of 21 funds, Fund III's TVPI ranks 15th, DPI ranks 8th, and IRR ranks 13th.",
        momentum_analysis_tvpi_progression:
            "Momentum analysis provides further insight into side-by-side comparisons by illustrating how the fund's performance has changed over time in relation to its close peers. The grey shaded area represents the first and third quartile break points.",
        irr_j_curve:
            "The IRR j-curve analysis compares FUND_NAME's IRR progression to its close peers. The IRR j- curve highlights a manager's ability to mitigate the impact of fees and gauges the ability to build a portfolio that creates value and generates momentum. The grey shaded area represents the first and third quartile break points.\n\nFUND_NAME's IRR moved into positive territory in Q4 2009, which is 1.25 years after the first cash flow. FUND_NAME's IRR is below the median against its peers.",
        close_peer_set_table:
            'The cohort is comprised of Global, North America, and Europe - Western buyout funds from 2007 - 2009 with a fund size between $2.0 billion and $5.0 billion.',
    };

    self.get_peer_filters_event = function({id, exclude_fund = true, overrides = {}}) {
        let enum_types = {
            enums: {
                event_type: self.events.resolve_event(`${id}:enums`, 'AttributeFilters.state'),
            },
            vintage_year: {
                event_type: self.events.resolve_event(`${id}:vintage_year`, 'PopoverButton.value'),
            },
            fund_size: {
                event_type: self.events.resolve_event(`${id}:fund_size`, 'PopoverButton.value'),
            },
            lists: {
                event_type: self.events.resolve_event(`${id}:lists`, 'PopoverButton.value'),
            },
        };

        if (exclude_fund) {
            enum_types.exclude_fund_uid = {
                event_type: self.events.get('exclude_fund_uid'),
            };
        }

        let trigger_events = [self.events.resolve_event(id, 'PopoverButton.closed')];

        for (let [key, config] of Object.entries(overrides)) {
            enum_types[key] = config;
            trigger_events.push(config.event_type);
        }

        let proxy = Observer.proxy({
            event_types: enum_types,
            auto_trigger: false,
            trigger_events: trigger_events,
        });

        self.hooks.push('after_set_state', () => {
            proxy.trigger();
        });

        return proxy.event;
    };

    self.hooks.push('after_set_state', () => {
        $('body').trigger('highchart:reflow');
    });

    self.close_peer_set_event = self.get_peer_filters_event({
        id: 'private_market:close_peer_set',
    });

    self.full_peer_set_event = self.get_peer_filters_event({
        id: 'private_market:full_peer_set',
    });

    self.peer_snapshot_filter_event = self.get_peer_filters_event({
        id: 'private_market:full_peer_set',
        overrides: {
            as_of_date: {
                mapping: 'get_value',
                event_type: self.events.resolve_event(
                    'private_market:data_provider',
                    'PopoverButton.value',
                ),
            },
        },
    });

    self.get_j_curve_wrapper = function(opts) {
        let true_config = Object.assign({}, opts.config, {
            x_quarter_offset: true,
        });

        let false_config = Object.assign({}, opts.config);

        return {
            component: ChartBooleanWrapper,
            shared_data: true,
            enable_currency: opts.enable_currency,
            currency_event: opts.currency_event,
            boolean_event: opts.boolean_event,
            boolean_value: false,
            true_config: true_config,
            false_config: false_config,
            datasource: opts.datasource,
        };
    };

    self.get_j_curve_query = function(id, metric) {
        return self.get_default_query('vehicle:peer_progression', {
            date_multiplier: 1000,
            min_values: 3,
            metric: metric,
            deannualize_sub_year_irr: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.resolve_event(
                    `${id}:deannualize_sub_year_irr`,
                    'BooleanButton.state',
                ),
                required: true,
                default: true,
            },
            horizon_years: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.resolve_event(`${id}:horizon_years`, 'PopoverButton.value'),
                required: true,
                default: null,
            },
            range_method: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.resolve_event(`${id}:range_method`, 'PopoverButton.value'),
                required: true,
            },
            time_zero: {
                type: 'observer',
                event_type: self.events.resolve_event(`${id}:time_zero`, 'BooleanButton.state'),
                required: true,
                default: false,
            },
            allow_empty_peer_filters: true,
            peer_filters: {
                type: 'observer',
                event_type: self.full_peer_set_event,
            },
            provider: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.resolve_event(
                    'private_market:data_provider',
                    'PopoverButton.value',
                ),
            },
        });
    };

    self.editor_layout = {
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
                title: 'Fund Overview',
                subtitle: 'Net Performance',
                layout: ['net_performance'],
            },
            {
                title: 'Peer Benchmarking: Performance Quartiles',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Returns',
                layout: ['horizon_analysis'],
            },
            {
                title: 'Benchmarking',
                subtitle: 'PME Trend',
                layout: ['pme_trend'],
            },
            {
                title: 'Peer J-Curve Benchmarking',
                subtitle: 'IRR J-Curve',
                layout: ['irr_j_curve', 'momentum_analysis_tvpi_progression'],
            },
            {
                title: 'Peer Side-by-Side Comparison',
                layout: ['side_by_side'],
            },
            {
                title: 'Peer Set',
                layout: ['close_peer_set_table'],
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_1'],
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_2'],
            },
        ],
        components: [
            {
                id: 'fund_meta_data',
                component: ReportComponentWrapper,
                allow_description: false,
                can_hide: false,
                save_event: self.events.get('save_draft'),
                widget_config: {
                    id: 'fund_meta_data',
                    component: ReportMeta,
                    market_type: 'net',
                    metric_table: {
                        data_key: 'characteristics',
                    },
                    logo_id: 'report_logo',
                    title_id: 'report_name',
                    datasources: {
                        characteristics: {
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'market_data_fund_uid'],
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('user_fund_uid'),
                                },
                                market_data_fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('market_data_fund_uid'),
                                },
                                include_attributes: true,
                            },
                        },
                        params: {
                            type: 'observer',
                            event_types: {
                                as_of_date: {
                                    event_type: self.events.get('as_of_date'),
                                    mapping: 'get_value',
                                },
                                logo_src: {
                                    event_type: Utils.gen_event(
                                        'ImageCropper.chosen_image',
                                        self.get_id(),
                                        'editor',
                                        'report_logo',
                                    ),
                                },
                            },
                        },
                    },
                },
            },
            {
                id: 'net_performance',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Net Performance',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.net_performance,
                    max_length: 1000,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    component: CashflowOverview,
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle'),
                    },
                },
            },
            {
                id: 'peer_snapshot',
                component: ReportComponentWrapper,
                allow_description: true,
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.peer_snapshot,
                    max_length: 1000,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    component: PeerBenchmark,
                    show_table: true,
                    metrics: ['irr', 'tvpi', 'dpi', 'rvpi'],
                    comp_in_table: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'multiple_to_tvpi',
                        query: {
                            target: 'peer_benchmark',
                            benchmark_edition_uid: {
                                type: 'observer',
                                mapping: 'get',
                                event_type: self.events.resolve_event(
                                    'peer_benchmark_edition',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            currency_id: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'peer_benchmark_currency',
                                    'PopoverButton.value',
                                ),
                            },
                            filters: {
                                type: 'observer',
                                event_type: self.peer_snapshot_filter_event,
                            },
                            include_items: false,
                        },
                    },
                    compset: {
                        comps: [
                            {
                                color: '#61C38C',
                                datasource: {
                                    type: 'dynamic',
                                    query: self.get_default_query('vehicle'),
                                },
                            },
                        ],
                    },
                },
            },
            {
                id: 'pme_trend',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'PME Trend',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.pme_trend,
                    max_length: 1500,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    series: [
                        {
                            key: 'vehicle_irrs',
                            type: 'line',
                        },
                        {
                            key: 'irrs',
                            type: 'line',
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle:pme_progression', {
                            date_multiplier: 1000,
                            horizon_years: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: self.events.resolve_event(
                                    'pme_trend:horizon_years',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            market_ids: {
                                type: 'observer',
                                mapping: 'get_values',
                                event_type: self.events.resolve_event(
                                    'report:indexes',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            provider: 'bison_pme',
                        }),
                    },
                },
            },
            {
                id: 'horizon_analysis',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Horizon Returns',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.horizon_analysis,
                    max_length: 1500,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle:time_weighted_comparison', {
                            date_multiplier: 1000,
                            metric: 'irr',
                            provider: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'private_market:data_provider',
                                    'PopoverButton.value',
                                ),
                            },
                            peer_set_label: 'Private Market Benchmark',
                            include_peer_set: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'horizon_analysis:include_peer_set',
                                    'BooleanButton.state',
                                ),
                                default: true,
                            },
                            allow_empty_peer_filters: true,
                            peer_filters: {
                                type: 'observer',
                                event_type: self.full_peer_set_event,
                                required: true,
                            },
                            use_pme_for_indexes: true,
                            pme_methology: 'bison_pme',
                            market_ids: {
                                type: 'observer',
                                mapping: 'get_values',
                                event_type: self.events.resolve_event(
                                    'report:indexes',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            horizon_years: {
                                mapping: 'get_values',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'horizon_analysis:horizon_years',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            include_busmi: false,
                        }),
                    },
                },
            },
            {
                id: 'irr_j_curve',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'IRR J-Curve',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.irr_j_curve,
                    max_length: 1500,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: self.get_j_curve_wrapper({
                    config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
                        format: 'irr',
                        shared_tooltip: true,
                        series: [
                            {
                                key: 'ranges',
                                name: 'Peer Range',
                                type: 'arearange',
                            },
                            {
                                key: 'median',
                                name: 'Peer Median',
                                type: 'line',
                            },
                            {
                                key: 'vehicle',
                                type: 'line',
                            },
                        ],
                    },
                    boolean_event: self.events.resolve_event(
                        'irr_j_curve:time_zero',
                        'BooleanButton.state',
                    ),
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle:peer_progression', {
                            date_multiplier: 1000,
                            min_values: 3,
                            metric: 'irr',
                            deannualize_sub_year_irr: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'irr_j_curve:deannualize_sub_year_irr',
                                    'BooleanButton.state',
                                ),
                                required: true,
                                default: true,
                            },
                            horizon_years: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'irr_j_curve:horizon_years',
                                    'PopoverButton.value',
                                ),
                                required: true,
                                default: null,
                            },
                            range_method: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'irr_j_curve:range_method',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            time_zero: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'irr_j_curve:time_zero',
                                    'BooleanButton.state',
                                ),
                                required: true,
                                default: false,
                            },
                            allow_empty_peer_filters: true,
                            peer_filters: {
                                type: 'observer',
                                event_type: self.full_peer_set_event,
                            },
                            provider: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'private_market:data_provider',
                                    'PopoverButton.value',
                                ),
                            },
                        }),
                    },
                }),
            },
            {
                id: 'momentum_analysis_tvpi_progression',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'TVPI Progression',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.momentum_analysis_tvpi_progression,
                    max_length: 1000,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'multiple',
                    shared_tooltip: true,
                    series: [
                        {
                            key: 'ranges',
                            name: 'Peer Range',
                            type: 'arearange',
                        },
                        {
                            key: 'median',
                            name: 'Peer Median',
                            type: 'line',
                        },
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle:peer_progression', {
                            date_multiplier: 1000,
                            min_values: 3,
                            metric: 'tvpi',
                            horizon_years: {
                                mapping: 'get',
                                mapping_args: {
                                    key: 'horizon_years',
                                },
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'metric',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            range_method: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'range_method',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            allow_empty_peer_filters: true,
                            peer_filters: {
                                type: 'observer',
                                event_type: self.full_peer_set_event,
                            },
                            provider: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'private_market:data_provider',
                                    'PopoverButton.value',
                                ),
                            },
                        }),
                    },
                },
            },
            {
                id: 'side_by_side',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Side by Side Comparison',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.side_by_side,
                    max_length: 1000,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    component: MultiBarChart,
                    chart_height: 300,
                    charts: [
                        {
                            label: 'IRR',
                            value_key: 'irr',
                            label_key: 'name',
                            format: 'percent',
                            order_by: [{name: 'irr', sort: 'desc'}],
                        },
                        {
                            label: 'TVPI',
                            value_key: 'tvpi',
                            label_key: 'name',
                            format: 'multiple',
                            order_by: [{name: 'tvpi', sort: 'desc'}],
                        },
                        {
                            label: 'DPI',
                            value_key: 'dpi',
                            label_key: 'name',
                            format: 'multiple',
                            order_by: [{name: 'dpi', sort: 'desc'}],
                        },
                    ],
                    columns: 2,
                    exporting: false,
                    datasource: {
                        type: 'dynamic',
                        key: 'funds',
                        query: self.get_default_query('vehicle:side_by_side_comparison', {
                            peer_filters: {
                                type: 'observer',
                                event_type: self.close_peer_set_event,
                            },
                        }),
                    },
                    compset: {
                        comps: [
                            {
                                color: '#4D4D4D',
                                datasource: {
                                    type: 'dynamic',
                                    key: 'target',
                                    query: self.get_default_query(
                                        'vehicle:side_by_side_comparison',
                                        {
                                            peer_filters: {
                                                type: 'observer',
                                                event_type: self.close_peer_set_event,
                                            },
                                        },
                                    ),
                                },
                            },
                        ],
                    },
                },
            },
            {
                id: 'close_peer_set_table',
                component: ReportComponentWrapper,
                allow_description: true,
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body: self.default_captions.close_peer_set_table,
                    max_length: 1000,
                    automatic_mode: false,
                    locked_mode: true,
                },
                widget_config: {
                    id: 'table',
                    component: DataTable,
                    inline_data: true,
                    columns: [
                        {
                            key: 'name',
                            label: 'Fund',
                        },
                        {
                            key: 'vintage_year',
                            label: 'Vintage',
                        },
                        {
                            label: 'Commitment',
                            format: 'money',
                            sort_key: 'commitment',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'commitment',
                            },
                            visible: false,
                        },
                        {
                            label: 'Unfunded',
                            format: 'money',
                            sort_key: 'unfunded',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'unfunded',
                            },
                            visible: false,
                        },
                        {
                            label: 'Age',
                            key: 'age_years',
                            format: 'years',
                            visible: false,
                        },
                        {
                            key: 'irr',
                            label: 'IRR',
                            format: 'irr',
                        },
                        {
                            key: 'tvpi',
                            label: 'TVPI',
                            format: 'multiple',
                        },
                        {
                            key: 'dpi',
                            label: 'DPI',
                            format: 'multiple',
                        },
                        {
                            key: 'rvpi',
                            label: 'RVPI',
                            format: 'multiple',
                        },
                        {
                            label: '5 Year Momentum',
                            key: 'momentum:5_year',
                            format: 'percent',
                        },
                        {
                            label: '3 Year Momentum',
                            key: 'momentum:3_year',
                            format: 'percent',
                        },
                        {
                            label: '1 Year Momentum',
                            key: 'momentum:1_year',
                            format: 'percent',
                            visible: false,
                        },
                        {
                            label: 'Paid In %',
                            key: 'picc',
                            format: 'percent',
                            visible: false,
                        },
                        {
                            label: 'Paid In',
                            sort_key: 'paid_in',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'paid_in',
                            },
                            visible: false,
                        },
                        {
                            label: 'Distributed',
                            sort_key: 'distributed',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'distributed',
                            },
                            visible: false,
                        },
                        {
                            label: 'NAV',
                            sort_key: 'nav',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'nav',
                            },
                            visible: false,
                        },
                        {
                            label: 'Total Value',
                            sort_key: 'total_value',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'total_value',
                            },
                            visible: false,
                        },
                        {
                            label: 'As of Date',
                            key: 'as_of_date',
                            format: 'backend_date',
                        },
                    ],
                    enable_column_toggle: true,
                    enable_csv_export: false,
                    column_toggle_placement: 'left',
                    results_per_page: 100,
                    css: {'table-light': true, 'table-sm': true},
                    datasource: {
                        type: 'dynamic',
                        key: 'funds',
                        query: self.get_default_query('vehicle:side_by_side_comparison', {
                            peer_filters: self.helpers.datasource.peer_filters({
                                exclude_fund_uid_event: self.events.get('exclude_fund_uid'),
                                prefix: 'private_market:close_peer_set',
                            }),
                        }),
                    },
                },
            },
        ],
    };

    self.viewer_layout = {
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
                title: 'Fund Overview',
                subtitle: 'Net Performance',
                layout: ['net_performance'],
            },
            {
                title: 'Peer Benchmarking: Performance Quartiles',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Returns',
                layout: ['horizon_analysis'],
            },
            {
                title: 'Public Market Equivalent Benchmarking',
                subtitle: 'PME Benchmark',
                layout: ['pme_trend'],
            },
            {
                title: 'Peer J-Curve Benchmarking',
                subtitle: 'IRR J-Curve',
                layout: ['irr_j_curve', 'momentum_analysis_tvpi_progression'],
            },
            {
                title: 'Peer Tracking',
                subtitle: 'Side By Side Comparison',
                layout: ['side_by_side'],
            },
            {
                title: 'Peer set',
                multi_page: true,
                layout: ['close_peer_set_table'],
                oversized_page: true,
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_1'],
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_2'],
            },
        ],
        components: [
            {
                id: 'fund_meta_data',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    id: 'fund_meta_data',
                    report: self.report,
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
                            default_value: require('src/img/fake_logo.png'),
                        },
                        fund_size: {
                            key: 'characteristics',
                            format: 'money',
                            format_args: {
                                currency_key: 'base_currency',
                                value_key: 'commitment',
                            },
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
            {
                id: 'net_performance',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: CashflowOverview,
                },
            },
            {
                id: 'horizon_analysis',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                },
            },
            {
                id: 'peer_snapshot',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                widget_config: {
                    component: PeerBenchmark,
                    show_table: true,
                    metrics: ['irr', 'tvpi', 'dpi', 'rvpi'],
                    comp_in_table: true,
                },
            },
            {
                id: 'pme_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'PME Trend',
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'vehicle_irrs',
                            type: 'line',
                        },
                        {
                            key: 'irrs',
                            type: 'line',
                        },
                    ],
                },
            },
            {
                id: 'irr_j_curve',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                widget_config: self.get_j_curve_wrapper({
                    config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
                        format: 'irr',
                        shared_tooltip: true,
                        sticky_tooltip_on_click: true,
                        series: [
                            {
                                key: 'ranges',
                                name: 'Peer Range',
                                type: 'arearange',
                            },
                            {
                                key: 'median',
                                name: 'Peer Median',
                                type: 'line',
                            },
                            {
                                key: 'vehicle',
                                type: 'line',
                            },
                        ],
                    },
                }),
            },
            {
                id: 'momentum_analysis_tvpi_progression',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'TVPI Progression',
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'multiple',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'ranges',
                            name: 'Peer Range',
                            type: 'arearange',
                        },
                        {
                            key: 'median',
                            name: 'Peer Median',
                            type: 'line',
                        },
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                },
            },
            {
                id: 'side_by_side',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                widget_config: {
                    component: MultiBarChart,
                    chart_height: 300,
                    charts: [
                        {
                            label: 'IRR',
                            value_key: 'irr',
                            label_key: 'name',
                            format: 'percent',
                            order_by: [{name: 'irr', sort: 'desc'}],
                        },
                        {
                            label: 'TVPI',
                            value_key: 'tvpi',
                            label_key: 'name',
                            format: 'multiple',
                            order_by: [{name: 'tvpi', sort: 'desc'}],
                        },
                        {
                            label: 'DPI',
                            value_key: 'dpi',
                            label_key: 'name',
                            format: 'multiple',
                            order_by: [{name: 'dpi', sort: 'desc'}],
                        },
                    ],
                    columns: 2,
                    truncate_label_length: 50,
                    axis_font_size: '8px',
                    exporting: false,
                },
            },
            {
                id: 'close_peer_set_table',
                component: DataTablePageWrapper,
                template: 'tpl_report_component_wrapper_view',

                widget_config: {
                    component: DataTable,
                    inline_data: true,
                    columns: [
                        {
                            key: 'name',
                            label: 'Fund',
                        },
                        {
                            key: 'vintage_year',
                            label: 'Vintage',
                        },
                        {
                            label: 'Commitment',
                            format: 'money',
                            sort_key: 'commitment',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'commitment',
                            },
                        },
                        {
                            label: 'Unfunded',
                            format: 'money',
                            sort_key: 'unfunded',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'unfunded',
                            },
                        },
                        {
                            label: 'Age',
                            key: 'age_years',
                            format: 'years',
                        },
                        {
                            key: 'irr',
                            label: 'IRR',
                            format: 'irr',
                        },
                        {
                            key: 'tvpi',
                            label: 'TVPI',
                            format: 'multiple',
                        },
                        {
                            key: 'dpi',
                            label: 'DPI',
                            format: 'multiple',
                        },
                        {
                            key: 'rvpi',
                            label: 'RVPI',
                            format: 'multiple',
                        },
                        {
                            label: '3 Year Momentum',
                            key: 'momentum:3_year',
                            format: 'percent',
                        },
                        {
                            label: '1 Year Momentum',
                            key: 'momentum:1_year',
                            format: 'percent',
                        },
                        {
                            label: 'Paid In %',
                            key: 'picc',
                            format: 'percent',
                        },
                        {
                            label: 'Paid In',
                            sort_key: 'paid_in',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'paid_in',
                            },
                        },
                        {
                            label: 'Distributed',
                            sort_key: 'distributed',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'distributed',
                            },
                        },
                        {
                            label: 'NAV',
                            sort_key: 'nav',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'nav',
                            },
                        },
                        {
                            label: 'Total Value',
                            sort_key: 'total_value',
                            format: 'money',
                            format_args: {
                                currency_key: 'render_currency',
                                value_key: 'total_value',
                            },
                        },
                        {
                            label: 'As of Date',
                            key: 'as_of_date',
                            format: 'backend_date',
                        },
                    ],
                    enable_column_toggle: false,
                    enable_csv_export: false,
                    disable_sorting: true,
                    results_per_page: 100,
                    css: {'table-light': true, 'table-sm': true},
                },
            },
            {
                id: 'glossary_1',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Glossary,
                    glossary: [
                        {
                            title: 'Contribution',
                            desc:
                                'cash flow from the limited partners to the fund. In a cash flow spreadsheet, they should be negative amounts. (Paid-in capital = cumulative amount of capital that has been drawn down).',
                        },
                        {
                            title: 'Distribution',
                            desc: 'cash flow from the fund to the limited partners.',
                        },
                        {
                            title: 'DPI (Distributed to Paid In Capital)',
                            desc:
                                'also called the realization multiple; measures the amount that has been paid out to investors. Calculated by dividing cumulative distributions by paid in capital. This multiple tells investors how much money they have received, and is better for evaluating a fund later in its life when there are more distributions to measure against.',
                        },
                        {
                            title: 'Investment Period',
                            desc:
                                'the timespan during which a fund is allowed to make new investments (typically up to 5 years).',
                        },
                        {
                            title: 'IRR (Internal Rate of Return)',
                            desc:
                                'the discount rate which makes NPV (net present value) of a series of cash flows equal to zero. Can be used to gauge the percentage rate earned on each dollar invested for each period it is invested.',
                        },
                        {
                            title: 'J-curve',
                            desc:
                                "Can refer to IRR curve or cash flow curve. The IRR j-curve refers to the tendency of private equity funds to deliver negative returns in early years and investment gains in later years. When IRRs over time are graphed, the fund's IRR typically plot into a &quot;J&quot; shape. Similarly, the cash-flow j-curve (used in Bison's FBRs) plots cash flows over time. These typically also form a &quot;J&quot; shape, as cash flows are negative in a fund's early years as capital is drawn down, and then start curving upward as the fund starts making distributions.",
                        },
                        {
                            title: 'Maximum Outflow',
                            desc:
                                "the bottom point of a fund's cash flow j-curve (the most negative point in a fund's cash flow timeline).",
                        },
                        {
                            title: 'Momentum',
                            desc: 'percent change in TVPI over a specified time period.',
                        },
                    ],
                },
            },
            {
                id: 'glossary_2',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Glossary,
                    glossary: [
                        {
                            title: 'NAV (Net Asset Value)',
                            desc:
                                "often referred to as a fund's residual value; represents the value of all investments remaining in the portfolio. Individual companies are valued and then aggregated to compute the private equity fund value.",
                        },
                        {
                            title: 'Paid In Capital (PIC)',
                            desc:
                                'sum of capital contributions that have been made in a fund (cumulative amount of capital that has been drawn down).',
                        },
                        {
                            title: 'Paid In To Committed Capital (PICC)',
                            desc:
                                "measures how invested the fund is. Calculated by dividing paid in capital by committed capital. Can help investors measure a fund's investment pace and gauge GPs' ability to fully invest their fund. For many investors, PICC helps evaluate when a fund is coming back to market. High PICC means that the fund has invested most of its committed capital.",
                        },
                        {
                            title: 'PME (Public Market Equivalent)',
                            desc:
                                'methodology used to evaluate the performance of a private equity fund against a public benchmark or index (ex. S&P 500, Russell 3000).',
                        },
                        {
                            title: 'Quartiles',
                            desc:
                                'the three points that divide a ranked data set into four equal groups, each group comprising a quarter of the data.',
                        },
                        {
                            title: 'RVPI (Residual Value to Paid In Capital)',
                            desc:
                                "Measures remaining market value of the fund's capital that has not yet been realized. Calculated by dividing the residual value (or fair market value) by paid in capital.",
                        },
                        {
                            title: 'Time Weighted Return',
                            desc:
                                'Measures the compound rate of return on a portfolio over a stated period of time. Eliminates the effect of cash flow timing on returns.',
                        },
                        {
                            title: 'TVPI (Total Value to Paid In Multiple)',
                            desc:
                                "fund's investment multiple; measures the total value created by a fund. Can be calculated in two ways: (1) by dividing cumulative distributions + residual value by paid in capital or (2) by adding together DPI and RVPI. Since RVPI is incorporated, TVPI will fluctuate until the fund is fully realized.",
                        },
                        {
                            title: 'Vintage Year',
                            desc:
                                "year in which the fund's first cash flow occurs (i.e., first year in which the fund begins making investments).",
                        },
                    ],
                },
            },
        ],
    };

    self.editor = self.new_instance(Editor, {
        id: 'editor',
        report: self.report,
        cpanel: {
            id: 'cpanel',
            components: self.editor_cpanel_components,
        },
        body: {
            layout_engine: self.editor_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
                market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
            }),
            toolbar: self.helpers.body.editor_toolbar({
                preview_event: self.events.get('preview'),
                disable_event: self.events.get('disable_preview'),
                start_disabled: true,
            }),
        },
    });

    self.viewer = self.new_instance(Viewer, {
        id: 'viewer',
        report: self.report,
        body: {
            layout_engine: self.viewer_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
                market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
                css: {'sub-page-header': true},
            }),
            toolbar: self.helpers.body.viewer_toolbar({
                edit_event: self.events.get('edit'),
                report: self.report,
            }),
        },
    });

    self.wizard = self.new_instance(Wizard, {
        id: 'wizard',
        cashflow_type: 'net',
        list_bison_funds: true,
        breadcrumb_label: report_title,
        callback: function(entity) {
            self.create_report(entity, report => {
                self.report(report);
                self.navigate('edit', report);
            });
        },
    });

    self.when(self.editor, self.viewer, self.wizard).done(() => {
        Observer.broadcast(
            self.events.get('register_export'),
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: self.events.get('download_pdf'),
            },
            true,
        );

        Observer.relay({
            sender: self.events.get('user_fund_uid'),
            receiver: self.events.get('exclude_fund_uid'),
        });

        Observer.relay({
            sender: self.events.get('market_data_fund_uid'),
            receiver: self.events.get('exclude_fund_uid'),
        });

        Observer.register(self.events.get('download_pdf'), () => {
            let report = self.report();
            let download_url = `${config.api_base_url}download/${report.report_type}/pdf/${report.uid}`;
            if (!report.is_frozen || !report.binary_asset_uid) {
                self.publish_report(() => {
                    DataThing.form_post(download_url);
                });
            } else {
                DataThing.form_post(download_url);
            }
        });

        Observer.register(self.events.get('edit'), () => {
            self.navigate('edit', self.report());
        });

        Observer.register(self.events.get('preview'), () => {
            let updates = self.editor.get_full_snapshot();
            self.editor.loading(true);
            self.update_report(updates, report => {
                self.editor.loading(false);
                self.navigate('view', report);
            });
        });

        Observer.register(self.events.get('save_draft'), () => {
            let updates = self.editor.get_static_snapshot();

            self.update_report(updates, () => {
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

        self.report.subscribe(report => {
            if (report && report.params) {
                if (report.params.entity_type) {
                    if (report.params.entity_type == 'user_fund') {
                        Observer.broadcast(self.events.get('user_fund_uid'), undefined);
                    }
                    if (report.params.entity_type == 'market_data_fund') {
                        Observer.broadcast(self.events.get('market_data_fund_uid'), undefined);
                    }
                }
            }
            self.broadcast_uid(report);
        });

        self.set_state(self.initial_state);

        self.editor.body_loading.subscribe(loading => {
            Observer.broadcast(self.events.get('disable_preview'), loading);
        });

        Observer.register(self.events.get('pme_methodology:method'), r => {
            self.pme_benchmark_data(r);
        });

        _dfd.resolve();
    });

    return self;
}
