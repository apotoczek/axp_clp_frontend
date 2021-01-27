/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Glossary from 'src/libs/components/reports/visual_reports/Glossary';
import DataTable from 'src/libs/components/reports/visual_reports/DataTable';
import ScoringChart from 'src/libs/components/reports/visual_reports/ScoringChart';
import MultiBarChart from 'src/libs/components/reports/visual_reports/MultiBarChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import FundOverviewCallouts from 'src/libs/components/reports/visual_reports/FundOverviewCallouts';
import CashflowOverview from 'src/libs/components/analytics/CashflowOverview';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import PeerBenchmark from 'src/libs/components/reports/visual_reports/PeerBenchmark';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import ChartBooleanWrapper from 'src/libs/components/reports/visual_reports/ChartBooleanWrapper';
import $ from 'jquery';
import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import Report from 'src/libs/components/reports/visual_reports/base/Report';
import Editor from 'src/libs/components/reports/visual_reports/base/Editor';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Wizard from 'src/libs/components/reports/visual_reports/base/Wizard';
import TextGenerator from 'src/libs/components/reports/visual_reports/TextGenerator';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Enums from 'src/libs/Enums';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';

export default function(opts, components) {
    let self = new Report(opts, components);

    self.sub_type = 'fbr';
    self.__class__ = 'FBRReport';

    let report_title = 'FBR';

    let _dfd = self.new_deferred();

    self.events.new('user_fund_uid');
    self.events.new('preview');
    self.events.new('disable_preview');
    self.events.new('edit');
    self.events.new('download_pdf');
    self.events.new('pme_trend:index_max_date_event');
    self.events.new('pme_trend:index_min_date_event');
    self.events.new('horizon_analysis:index_max_date_event');
    self.events.new('horizon_analysis:index_min_date_event');

    self.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');
    self.events.resolve_and_add('as_of_date', 'PopoverButton.value');

    // Events related to closed peer set filtering
    self.events.resolve_and_add('close_peer_set:enums', 'AttributeFilters.state');
    self.events.resolve_and_add('close_peer_set:vintage_year', 'PopoverButton.value');
    self.events.resolve_and_add('close_peer_set:fund_size', 'PopoverButton.value');
    self.events.resolve_and_add('close_peer_set:lists', 'PopoverButton.value');

    // Events related to benchmark peer set filtering
    self.events.resolve_and_add('full_peer_set:enums', 'AttributeFilters.state');
    self.events.resolve_and_add('full_peer_set:vintage_year', 'PopoverButton.value');
    self.events.resolve_and_add('full_peer_set:fund_size', 'PopoverButton.value');
    self.events.resolve_and_add('full_peer_set:lists', 'PopoverButton.value');

    // Events related to the peer trend selection
    self.events.resolve_and_add('peer_trend:horizon_years', 'PopoverButton.value');

    // Events related to the pme trend
    self.events.resolve_and_add('pme_trend:horizon_years', 'PopoverButton.value');

    self.events.resolve_and_add('horizon_analysis:horizon_years', 'PopoverButton.value');

    // Time zero events
    self.events.resolve_and_add('irr_j_curve:time_zero', 'BooleanButton.state');
    self.events.resolve_and_add('remaining_value_trend:time_zero', 'BooleanButton.state');

    /**
     * Takes an array of value label pairs from a horizon years checklist
     * and calculates the unix timestamp to send as the minimum date to
     * the index options.
     */
    let horizon_years_to_timestamp = data => {
        if (!data) {
            return null;
        }

        let years;
        if (Array.isArray(data)) {
            years = Math.max(...data.map(e => e.value));
        } else {
            years = data.value;
        }

        let date = new Date();
        date.setFullYear(date.getFullYear() - years);
        return Math.ceil(date.getTime() / 1000);
    };

    self.as_of_date = Observer.observable(Observer.map(self.events.get('as_of_date'), 'get_value'));
    self.pme_trend_horizon_years = Observer.observable(self.events.get('pme_trend:horizon_years'));
    ko.computed(() => {
        Observer.broadcast(self.events.get('pme_trend:index_max_date_event'), self.as_of_date());
        Observer.broadcast(
            self.events.get('pme_trend:index_min_date_event'),
            horizon_years_to_timestamp(self.pme_trend_horizon_years()),
        );
    });

    self.horizon_analysis_horizon_years = Observer.observable(
        self.events.get('horizon_analysis:horizon_years'),
    );
    ko.computed(() => {
        Observer.broadcast(
            self.events.get('horizon_analysis:index_max_date_event'),
            self.as_of_date(),
        );
        Observer.broadcast(
            self.events.get('horizon_analysis:index_min_date_event'),
            horizon_years_to_timestamp(self.horizon_analysis_horizon_years()),
        );
    });

    self.peer_trend_mode = Observer.observable(
        self.events.resolve_event('peer_trend:mode', 'PopoverButton.value'),
    );

    self.peer_snapshots = {};

    for (let idx of [1, 2]) {
        let base_id = `peer_snapshot_${idx}`;

        self.peer_snapshots[base_id] = {
            provider: Observer.observable(
                self.events.resolve_event(`${base_id}:benchmark_provider`, 'PopoverButton.value'),
            ),
            mode: Observer.observable(
                self.events.resolve_event(`${base_id}:mode`, 'PopoverButton.value'),
            ),
        };

        self.peer_snapshots[base_id].use_provider_benchmark = ko.pureComputed(() => {
            let mode = self.peer_snapshots[base_id].mode();

            if (mode) {
                return mode.value === 'provider_benchmark';
            }

            return false;
        });
    }

    self.peer_subtitle_callback = function(page) {
        if (page && page.layout && page.layout[0] && page.layout[0].widget) {
            let data = page.layout[0].widget.data();

            if (data && data.meta && data.meta.provider) {
                return `${data.meta.provider} Benchmark`;
            }
        }

        return 'Cobalt Benchmark';
    };

    self.get_peer_snapshot_settings_popover = function(idx) {
        let base_id = `peer_snapshot_${idx}`;

        return self.helpers.cpanel.settings_popover({
            id: base_id,
            label: `Peer Snapshot ${idx}`,
            components: [
                self.helpers.cpanel.radiolist({
                    id: 'mode',
                    alias: `${base_id}:mode`,
                    label: 'Mode',
                    datasource: [
                        {
                            label: 'Market Data',
                            value: 'market_data',
                            use_benchmark_data: true,
                            use_custom_benchmark: true,
                            custom_benchmark_mode: 'investments',
                        },
                        {
                            label: 'Cash Flow Data',
                            value: 'cash_flow_data',
                            use_benchmark_data: true,
                            use_custom_benchmark: true,
                            custom_benchmark_mode: 'cashflows',
                        },
                        {
                            label: 'Provider Benchmark',
                            value: 'provider_benchmark',
                            use_benchmark_data: true,
                            use_custom_benchmark: false,
                            custom_benchmark_mode: null,
                        },
                    ],
                }),
                self.helpers.cpanel.currency_radiolist({
                    id: 'cashflow_currency',
                    label: 'Cash Flow Currency',
                    alias: `${base_id}:cashflow_currency`,
                    extra_options: [{value: null, label: 'Unadjusted'}],
                    visible_callback: () => {
                        let mode = self.peer_snapshots[base_id].mode();

                        return mode.custom_benchmark_mode === 'cashflows';
                    },
                }),
                self.helpers.cpanel.benchmark_provider({
                    id: 'benchmark_provider',
                    alias: `${base_id}:benchmark_provider`,
                    hidden_callback: () => !self.peer_snapshots[base_id].use_provider_benchmark(),
                }),
                self.helpers.cpanel.benchmark({
                    id: 'benchmark',
                    alias: `${base_id}:benchmark`,
                    hidden_callback: () => !self.peer_snapshots[base_id].use_provider_benchmark(),
                    provider_event: self.events.resolve_event(
                        `${base_id}:benchmark_provider`,
                        'PopoverButton.value',
                    ),
                }),
                self.helpers.cpanel.currency_radiolist({
                    id: 'benchmark_currency',
                    alias: `${base_id}:benchmark_currency`,
                    visible_callback: () => {
                        if (!self.peer_snapshots[base_id].use_provider_benchmark()) {
                            return false;
                        }

                        let provider = self.peer_snapshots[base_id].provider();

                        if (provider && provider.value == 'Hamilton Lane') {
                            return true;
                        }

                        return false;
                    },
                }),
            ],
        });
    };

    const post_date_navs_button = [];
    if (config.enable_roll_forward_ui) {
        post_date_navs_button.push(
            self.helpers.cpanel.boolean_button({
                id: 'post_date_navs',
                label: 'Roll Forward NAVs',
            }),
        );
    }

    self.editor_cpanel_components = [
        self.helpers.cpanel.label({
            id: 'settings_label',
            label: 'Settings',
        }),
        self.helpers.cpanel.as_of_date({
            id: 'as_of_date',
            user_fund_uid_event: self.events.get('user_fund_uid'),
        }),
        ...post_date_navs_button,
        self.helpers.cpanel.boolean_button({
            id: 'ignore_recallable',
            label: 'Ignore Recallable',
        }),
        self.helpers.cpanel.currency_radiolist({
            id: 'render_currency',
            user_fund_uid_event: self.events.get('user_fund_uid'),
        }),
        self.helpers.cpanel.label({
            id: 'peer_sets_label',
            label: 'Peer Sets',
        }),
        self.helpers.cpanel.peer_filters({
            id: 'full_peer_set',
            label: 'Benchmark',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            restrict_default_filters: [Enums.style, Enums.geography, 'vintage_year'],
        }),
        self.helpers.cpanel.peer_filters({
            id: 'close_peer_set',
            label: 'Close Peers',
        }),
        self.helpers.cpanel.label({
            id: 'section_settings_label',
            label: 'Section Settings',
        }),
        self.get_peer_snapshot_settings_popover(1),
        self.get_peer_snapshot_settings_popover(2),
        self.helpers.cpanel.settings_popover({
            id: 'peer_trend',
            label: 'Peer Trend',
            components: [
                self.helpers.cpanel.radiolist({
                    id: 'mode',
                    alias: 'peer_trend:mode',
                    label: 'Mode',
                    datasource: [
                        {
                            label: 'Market Data',
                            value: 'market_data',
                            use_cashflow_data: false,
                        },
                        {
                            label: 'Cash Flow Data',
                            value: 'cash_flow_data',
                            use_cashflow_data: true,
                        },
                    ],
                }),
                self.helpers.cpanel.currency_radiolist({
                    id: 'cashflow_currency',
                    label: 'Cash Flow Currency',
                    alias: 'peer_trend:cashflow_currency',
                    extra_options: [{value: null, label: 'Unadjusted'}],
                    visible_callback: () => {
                        let mode = self.peer_trend_mode();

                        return mode.use_cashflow_data;
                    },
                }),
                self.helpers.cpanel.checklist({
                    id: 'metrics',
                    label: 'Metrics',
                    datasource: [
                        {label: 'IRR', value: 'irr'},
                        {label: 'TVPI', value: 'tvpi'},
                        {label: 'DPI', value: 'dpi'},
                        {label: 'RVPI', value: 'rvpi'},
                    ],
                    selected_datasource: ['irr', 'tvpi', 'dpi'],
                }),
                self.helpers.cpanel.radiolist({
                    id: 'horizon_years',
                    alias: 'peer_trend:horizon_years',
                    label: 'Horizon',
                    datasource: self.helpers.misc.year_options(1, 3, 5, 10, null),
                    default_selected_value: 1,
                }),
            ],
        }),
        self.helpers.cpanel.settings_popover({
            id: 'pme_trend',
            label: 'PME Trend',
            components: [
                self.helpers.cpanel.index_checklist({
                    id: 'indexes',
                    alias: 'pme_trend:indexes',
                    user_fund_uid_event: self.events.get('user_fund_uid'),
                    max_date_event: self.events.get('pme_trend:index_max_date_event'),
                    min_date_event: self.events.get('pme_trend:index_min_date_event'),
                    default_market_id: 100101,
                }),
                self.helpers.cpanel.radiolist({
                    id: 'horizon_years',
                    label: 'Horizon',
                    datasource: self.helpers.misc.year_options(1, 3, 5, 10, null),
                    default_selected_value: 1,
                    alias: 'pme_trend:horizon_years',
                }),
            ],
        }),
        self.helpers.cpanel.settings_popover({
            id: 'horizon_analysis',
            label: 'Horizon Analysis',
            components: [
                self.helpers.cpanel.checklist({
                    id: 'horizon_years',
                    alias: 'horizon_analysis:horizon_years',
                    label: 'Horizons',
                    datasource: self.helpers.misc.year_options(1, 3, 5, 10),
                    selected_datasource: [1, 3, 5],
                }),
                self.helpers.cpanel.boolean_button({
                    id: 'include_busmi',
                    label: 'Include BUSMI',
                }),
                self.helpers.cpanel.boolean_button({
                    id: 'include_peer_set',
                    label: 'Include Peer Set',
                }),
                self.helpers.cpanel.index_checklist({
                    id: 'indexes',
                    alias: 'horizon_analysis:indexes',
                    user_fund_uid_event: self.events.get('user_fund_uid'),
                    max_date_event: self.events.get('horizon_analysis:index_max_date_event'),
                    min_date_event: self.events.get('horizon_analysis:index_min_date_event'),
                    default_market_id: 100101,
                }),
            ],
        }),
        self.helpers.cpanel.settings_popover({
            id: 'momentum_analysis',
            label: 'Momentum',
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
                    ],
                }),
            ],
        }),
        self.helpers.cpanel.j_curve_filters({
            id: 'irr_j_curve',
            label: 'IRR J-Curve',
            extra_components: [
                self.helpers.cpanel.boolean_button({
                    id: 'deannualize_sub_year_irr',
                    label: 'Deannualize Sub-Year IRR',
                    default_state: true,
                    alias: 'irr_j_curve:deannualize_sub_year_irr',
                }),
            ],
        }),
        self.helpers.cpanel.j_curve_filters({
            id: 'cashflow_j_curve',
            label: 'Cash Flow J-Curve',
        }),
        self.helpers.cpanel.j_curve_filters({
            id: 'remaining_value_trend',
            label: 'Remaining Value Trend',
        }),
    ];

    self.get_peer_filters_event = function({id, exclude_fund = true, overrides = {}}) {
        let enum_types = {
            enums: {
                event_type: self.events.get(`${id}:enums`, 'AttributeFilters.state'),
            },
            vintage_year: {
                event_type: self.events.get(`${id}:vintage_year`, 'PopoverButton.value'),
            },
            fund_size: {
                event_type: self.events.get(`${id}:fund_size`, 'PopoverButton.value'),
            },
            lists: {
                event_type: self.events.get(`${id}:lists`, 'PopoverButton.value'),
            },
        };

        if (exclude_fund) {
            enum_types.exclude_fund_uid = {
                event_type: self.events.get('user_fund_uid'),
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
        id: 'close_peer_set',
    });

    self.full_peer_set_event = self.get_peer_filters_event({
        id: 'full_peer_set',
    });

    self.peer_snapshot_filter_event = self.get_peer_filters_event({
        id: 'full_peer_set',
        overrides: {
            as_of_date: {
                mapping: 'get_value',
                event_type: self.events.get('as_of_date'),
            },
        },
    });

    /*********************************************************
     *                    DATA QUERIES                       *
     *********************************************************/
    // We use the same queries in a few different places, (for example we send them
    // to TextGenerator and into components). So we store queries in variables in
    // order to reduce duplication

    self.get_default_query = function(target, overrides = {}) {
        return Object.assign(
            {
                target: target,
                user_fund_uid: {
                    type: 'observer',
                    required: true,
                    event_type: self.events.get('user_fund_uid'),
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: self.events.resolve_event('render_currency', 'PopoverButton.value'),
                    required: true,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: self.events.resolve_event('post_date_navs', 'BooleanButton.state'),
                    default: true,
                },
                ignore_recallable: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'ignore_recallable',
                        'BooleanButton.state',
                    ),
                    required: true,
                },
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: self.events.get('as_of_date'),
                    required: true,
                },
            },
            overrides,
        );
    };

    self.get_j_curve_query = function(id, metric, overrides = {}) {
        return self.get_default_query(
            'vehicle:peer_progression',
            Object.assign(
                {
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
                        event_type: self.events.resolve_event(
                            `${id}:horizon_years`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    range_method: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            `${id}:range_method`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    time_zero: {
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            `${id}:time_zero`,
                            'BooleanButton.state',
                        ),
                        required: true,
                        default: false,
                    },
                    peer_filters: {
                        type: 'observer',
                        event_type: self.close_peer_set_event,
                    },
                },
                overrides,
            ),
        );
    };

    let vehicle_meta_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.events.get('user_fund_uid'),
                    required: true,
                },
            },
        },
    });

    let vehicle_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle', {
                irr_over_time: true,
                tvpi_over_time: true,
                dpi_over_time: true,
            }),
        },
    });

    let peer_benchmark_datasource = idx => {
        let base_id = `peer_snapshot_${idx}`;

        return self.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                mapping: 'multiple_to_tvpi',
                query: {
                    target: 'peer_benchmark',
                    benchmark_edition_uid: {
                        type: 'observer',
                        mapping: 'get',
                        event_type: self.events.resolve_event(
                            `${base_id}:benchmark`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    currency_id: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            `${base_id}:benchmark_currency`,
                            'PopoverButton.value',
                        ),
                    },
                    use_benchmark_data: {
                        type: 'observer',
                        mapping: 'get',
                        mapping_args: {
                            key: 'use_benchmark_data',
                        },
                        event_type: self.events.resolve_event(
                            `${base_id}:mode`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    mode: {
                        type: 'observer',
                        mapping: 'get',
                        mapping_args: {
                            key: 'custom_benchmark_mode',
                        },
                        event_type: self.events.resolve_event(
                            `${base_id}:mode`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    use_custom_benchmark: {
                        type: 'observer',
                        mapping: 'get',
                        mapping_args: {
                            key: 'use_custom_benchmark',
                        },
                        event_type: self.events.resolve_event(
                            `${base_id}:mode`,
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    cashflow_settings: {
                        type: 'dynamic',
                        query: {
                            currency: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    `${base_id}:cashflow_currency`,
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                        },
                    },
                    filters: {
                        type: 'observer',
                        event_type: self.peer_snapshot_filter_event,
                    },
                    include_items: false,
                },
            },
        });
    };

    let peer_benchmark_query = {};

    for (let key of [1, 2]) {
        peer_benchmark_query[key] = peer_benchmark_datasource(key);
    }

    let quartile_progression_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle:quartile_progression', {
                inverse_quartiles: true,
                horizon_years: {
                    type: 'observer',
                    mapping: 'get_value',
                    event_type: self.events.get('peer_trend:horizon_years'),
                    required: true,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'peer_trend:cashflow_currency',
                        'PopoverButton.value',
                    ),
                    required: true,
                },
                metrics: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: self.events.resolve_event('metrics', 'PopoverButton.value'),
                    required: true,
                },
                use_cashflow_data: {
                    mapping: 'get',
                    mapping_args: {
                        key: 'use_cashflow_data',
                    },
                    type: 'observer',
                    event_type: self.events.resolve_event('peer_trend:mode', 'PopoverButton.value'),
                    required: true,
                },
                peer_filters: {
                    type: 'observer',
                    event_type: self.full_peer_set_event,
                },
            }),
        },
    });

    let vehicle_pme_progression_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle:pme_progression', {
                date_multiplier: 1000,
                horizon_years: {
                    type: 'observer',
                    mapping: 'get_value',
                    event_type: self.events.get('pme_trend:horizon_years'),
                    required: true,
                },
                market_ids: {
                    type: 'observer',
                    mapping: 'get_values',
                    event_type: self.events.resolve_event(
                        'pme_trend:indexes',
                        'PopoverButton.value',
                    ),
                    required: true,
                },
            }),
        },
    });

    let time_weighted_breakdown_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle:time_weighted_breakdown', {
                horizon_years: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: self.events.get('horizon_analysis:horizon_years'),
                    required: true,
                },
            }),
        },
    });

    let time_weighted_comparison_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle:time_weighted_comparison', {
                date_multiplier: 1000,
                horizon_years: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: self.events.get('horizon_analysis:horizon_years'),
                    required: true,
                },
                market_ids: {
                    type: 'observer',
                    mapping: 'get_values',
                    event_type: self.events.resolve_event(
                        'horizon_analysis:indexes',
                        'PopoverButton.value',
                    ),
                    required: true,
                    default: [52618],
                },
                include_peer_set: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'include_peer_set',
                        'BooleanButton.state',
                    ),
                    default: true,
                },
                include_busmi: {
                    type: 'observer',
                    event_type: self.events.resolve_event('include_busmi', 'BooleanButton.state'),
                    default: true,
                },
                peer_filters: {
                    type: 'observer',
                    event_type: self.close_peer_set_event,
                },
            }),
        },
    });

    let side_by_side_comparison_funds_query = self.new_instance(DataSource, {
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
    });

    let side_by_side_comparison_target_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            key: 'target',
            query: self.get_default_query('vehicle:side_by_side_comparison', {
                peer_filters: {
                    type: 'observer',
                    event_type: self.close_peer_set_event,
                },
            }),
        },
    });

    let irr_j_curve_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_j_curve_query('irr_j_curve', 'irr'),
        },
    });

    let irr_j_curve_since_inception_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_j_curve_query('irr_j_curve', 'irr', {horizon_years: undefined}),
        },
    });

    let scaled_net_cashflows_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_j_curve_query('cashflow_j_curve', 'scaled_net_cashflows', {
                return_fund_list: true,
            }),
        },
    });

    let remaining_value_trend_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_j_curve_query('remaining_value_trend', 'rvpi', {}, true),
        },
    });

    let remaining_value_trend_since_inception_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_j_curve_query(
                'remaining_value_trend',
                'rvpi',
                {horizon_years: undefined},
                true,
            ),
        },
    });
    let close_peer_set_query = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: self.get_default_query('vehicle:side_by_side_comparison', {
                peer_filters: self.helpers.datasource.peer_filters({
                    exclude_fund_uid_event: self.events.get('user_fund_uid'),
                    prefix: 'close_peer_set',
                }),
            }),
        },
    });

    /**
     * Static descriptions which does not autogenerate from the data/filters that
     * the user selects for the report.
     */
    self.static_descriptions = {
        net_of_recallable:
            'The Net of Recallable Distributions Performance calculates ' +
            'TVPI and DPI by subtracting recallable distributions from ' +
            'both the total value and paid in capital amounts. Cobalt ' +
            'uses the &quot;all in&quot; treatment for the purpose of ' +
            'analysis throughout the rest of the report.',
        momentum_analysis_tvpi_progression:
            'Momentum analysis provides further insight ' +
            'into side-by-side comparisons by illustrating ' +
            "how the fund's performance has changed over " +
            'time in relation to its close peers. The grey ' +
            'shaded area represents the first and third ' +
            'quartile break points.',
    };

    /**
     * A set of text generators that are used to automatically generate the descriptions
     * below each chart from the filters and data provided from the backend.
     * The text changes depending on filter events and datasource-observables. Each
     * generator returns an observable that we can use as a text parameter to the
     * report component wrapper.
     */

    self.text_generators = {
        close_peer_set: TextGenerator.close_peer_set(
            self.events.get('close_peer_set:enums'),
            self.events.get('close_peer_set:vintage_year'),
            self.events.get('close_peer_set:fund_size'),
            self.attribute_filter_configs.data,
            self.events.get('close_peer_set:lists'),
            self.lists_query.data,
            vehicle_query.data,
        ),
        net_performance: TextGenerator.net_performance(vehicle_meta_query.data, vehicle_query.data),
        peer_snapshot: (() => {
            let peer_snapshot = {};

            for (let key of [1, 2]) {
                peer_snapshot[key] = TextGenerator.peer_snapshot(
                    vehicle_query.data,
                    vehicle_meta_query.data,
                    peer_benchmark_query[key].data,
                    self.events.get('full_peer_set:enums'),
                    self.events.get('full_peer_set:vintage_year'),
                    self.events.get('full_peer_set:fund_size'),
                    self.attribute_filter_configs.data,
                    self.events.get('full_peer_set:lists'),
                    self.lists_query.data,
                );
            }

            return peer_snapshot;
        })(),
        peer_trend: TextGenerator.peer_trend(
            quartile_progression_query.data,
            vehicle_meta_query.data,
            self.events.get('full_peer_set:vintage_year'),
            self.events.get('peer_trend:horizon_years'),
        ),
        pme_trend: TextGenerator.pme_trend(
            vehicle_meta_query.data,
            vehicle_query.data,
            vehicle_pme_progression_query.data,
            self.events.get('pme_trend:horizon_years'),
        ),
        horizon_overview: TextGenerator.horizon_overview(
            vehicle_meta_query.data,
            time_weighted_breakdown_query.data,
        ),
        horizon_analysis: TextGenerator.horizon_analysis(
            vehicle_meta_query.data,
            time_weighted_comparison_query.data,
            self.attribute_filter_configs.data,
            self.events.get('close_peer_set:enums'),
            self.events.get('close_peer_set:vintage_year'),
            self.events.get('close_peer_set:fund_size'),
            self.events.get('close_peer_set:lists'),
            self.lists_query.data,
            vehicle_query.data,
        ),
        side_by_side: TextGenerator.side_by_side(
            self.attribute_filter_configs.data,
            self.events.get('close_peer_set:enums'),
            self.events.get('close_peer_set:vintage_year'),
            self.events.get('close_peer_set:fund_size'),
            self.events.get('close_peer_set:lists'),
            self.lists_query.data,
            vehicle_meta_query.data,
            side_by_side_comparison_target_query.data,
            side_by_side_comparison_funds_query.data,
            vehicle_query.data,
        ),
        momentum_analysis_side_by_side: TextGenerator.momentum_side_by_side(
            vehicle_meta_query.data,
            side_by_side_comparison_target_query.data,
            side_by_side_comparison_funds_query.data,
            self.events.resolve_event('metric', 'PopoverButton.value'),
        ),
        irr_j_curve: TextGenerator.irr_j_curve(
            vehicle_meta_query.data,
            irr_j_curve_since_inception_query.data,
            self.events.get('irr_j_curve:time_zero'),
        ),
        cash_flow_j_curve: TextGenerator.cash_flow_j_curve(
            vehicle_meta_query.data,
            scaled_net_cashflows_query.data,
        ),
        remaining_value_trend: TextGenerator.remaining_value_trend(
            vehicle_meta_query.data,
            remaining_value_trend_since_inception_query.data,
            self.events.get('remaining_value_trend:time_zero'),
        ),
    };

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
            data: opts.data,
            dependencies: opts.dependencies,
        };
    };

    self.get_peer_snapshot_editor_config = function(idx) {
        let base_id = `peer_snapshot_${idx}`;
        return {
            id: base_id,
            component: ReportComponentWrapper,
            allow_description: true,
            save_event: self.events.get('save_draft'),
            caption: {
                text_body_provider: self.text_generators.peer_snapshot[idx],
                max_length: 1000,
            },
            widget_config: {
                component: PeerBenchmark,
                dependencies: [peer_benchmark_query[idx].get_id(), vehicle_query.get_id()],
                show_table: true,
                metrics: ['irr', 'tvpi', 'dpi', 'rvpi'],
                comp_in_table: true,
                data: peer_benchmark_query[idx].data,
                compset: {
                    comps: [
                        {
                            color: '#61C38C',
                            data: vehicle_query.data,
                        },
                    ],
                },
            },
        };
    };

    self.get_peer_snapshot_viewer_config = function(idx) {
        return {
            id: `peer_snapshot_${idx}`,
            component: ReportComponentWrapper,
            template: 'tpl_report_component_wrapper_view',
            caption: {
                text_body_provider: self.text_generators.peer_snapshot[idx],
            },
            widget_config: {
                component: PeerBenchmark,
                show_table: true,
                metrics: ['irr', 'tvpi', 'dpi', 'rvpi'],
                comp_in_table: true,
            },
        };
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
                title: 'Close Peers Cohort',
                // subtitle: 'Close Peers Cohort',
                layout: ['close_peer_set_table'],
            },
            {
                title: 'Fund Overview',
                subtitle: 'Net Performance',
                layout: ['net_performance', 'net_of_recallable'],
            },
            {
                title: 'Benchmarking',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot_1'],
            },
            {
                title: 'Benchmarking',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot_2'],
            },
            {
                title: 'Benchmarking',
                subtitle: 'Cobalt Benchmark Trend',
                layout: ['peer_trend'],
            },
            {
                title: 'Benchmarking',
                subtitle: 'PME Trend',
                layout: ['pme_trend'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Overview',
                layout: ['horizon_overview'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Analysis vs. Markets',
                layout: ['horizon_analysis'],
            },
            {
                title: 'Peer Tracking',
                subtitle: 'Side By Side Comparison',
                layout: ['side_by_side'],
            },
            {
                title: 'Peer Tracking',
                subtitle: 'Momentum Analysis',
                layout: ['momentum_analysis_side_by_side', 'momentum_analysis_tvpi_progression'],
            },
            {
                title: 'Fund Management',
                subtitle: 'IRR J-Curve',
                layout: ['irr_j_curve'],
            },
            {
                title: 'Fund Management',
                subtitle: 'Cash Flow J-Curve',
                layout: ['cashflow_j_curve'],
            },
            {
                title: 'Risk Exposure',
                subtitle: 'Remaining Value Trend',
                layout: ['remaining_value_trend'],
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
                    dependencies: [vehicle_meta_query.get_id()],
                    component: ReportMeta,
                    metric_table: {
                        data_key: 'characteristics',
                    },
                    logo_id: 'report_logo',
                    title_id: 'report_name',
                    data: {
                        characteristics: vehicle_meta_query.data,
                    },
                    datasources: {
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
                    text_body_provider: self.text_generators.net_performance,
                    max_length: 1000,
                },
                widget_config: {
                    component: CashflowOverview,
                    dependencies: [vehicle_query.get_id()],
                    active_template: 'visual_reports',
                    data: vehicle_query.data,
                },
            },
            {
                id: 'net_of_recallable',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Net of Recallable Method',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.static_descriptions.net_of_recallable,
                    max_length: 1000,
                },
                widget_config: {
                    component: FundOverviewCallouts,
                    template: 'tpl_fund_overview_callouts_full',
                    irr_label: 'IRR',
                    css_style: {margin: '0px 0px'},
                    datasource: {
                        type: 'dynamic',
                        query: self.get_default_query('vehicle', {
                            ignore_recallable: false,
                        }),
                    },
                },
            },
            self.get_peer_snapshot_editor_config(1),
            self.get_peer_snapshot_editor_config(2),
            {
                id: 'peer_trend',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Peer Trend',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.peer_trend,
                    max_length: 1500,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    dependencies: [quartile_progression_query.get_id()],
                    component: GroupedBarChart,
                    format: 'inverse_quartile',
                    y_min: 0,
                    y_max: 4,
                    allowDecimals: false,
                    shared_tooltip: true,
                    exporting: false,
                    data: quartile_progression_query.data,
                },
            },
            {
                id: 'pme_trend',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'PME Trend',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.pme_trend,
                    max_length: 1500,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    dependencies: [vehicle_pme_progression_query.get_id()],
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
                    data: vehicle_pme_progression_query.data,
                },
            },
            {
                id: 'horizon_overview',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Horizon Overview',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.horizon_overview,
                    max_length: 1500,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    dependencies: [time_weighted_breakdown_query.get_id()],
                    format: 'percent',
                    data: time_weighted_breakdown_query.data,
                },
            },
            {
                id: 'horizon_analysis',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Horizon Analysis vs. Markets',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.horizon_analysis,
                    max_length: 1500,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    dependencies: [time_weighted_comparison_query.get_id()],
                    format: 'percent',
                    data: time_weighted_comparison_query.data,
                },
            },
            {
                id: 'side_by_side',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Side by Side Comparison',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.side_by_side,
                    max_length: 1000,
                },
                widget_config: {
                    component: MultiBarChart,
                    dependencies: [
                        side_by_side_comparison_funds_query.get_id(),
                        side_by_side_comparison_target_query.get_id(),
                    ],
                    chart_height: 420,
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
                    data: side_by_side_comparison_funds_query.data,
                    compset: {
                        comps: [
                            {
                                color: '#4D4D4D',
                                data: side_by_side_comparison_target_query.data,
                            },
                        ],
                    },
                },
            },
            {
                id: 'momentum_analysis_side_by_side',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Momentum Analysis - Side by Side',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.momentum_analysis_side_by_side,
                    max_length: 1000,
                },
                widget_config: {
                    component: ScoringChart,
                    metric_events: {
                        y_axis: self.events.resolve_event('metric', 'PopoverButton.value'),
                    },
                    hide_label: true,
                    exporting: false,
                    datasource: {
                        type: 'dynamic',
                        key: 'funds',
                        query: self.get_default_query('vehicle:side_by_side_comparison', {
                            peer_order_by: {
                                mapping: 'get',
                                mapping_args: {
                                    key: 'order_by',
                                },
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'metric',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
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
                                            peer_order_by: {
                                                mapping: 'get',
                                                mapping_args: {
                                                    key: 'order_by',
                                                },
                                                type: 'observer',
                                                event_type: self.events.resolve_event(
                                                    'metric',
                                                    'PopoverButton.value',
                                                ),
                                                required: true,
                                            },
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
                id: 'momentum_analysis_tvpi_progression',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Momentum Analysis - TVPI Progression',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.static_descriptions.momentum_analysis_tvpi_progression,
                    max_length: 1000,
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
                            peer_filters: {
                                type: 'observer',
                                event_type: self.close_peer_set_event,
                            },
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
                    text_body_provider: self.text_generators.irr_j_curve,
                    max_length: 1500,
                },
                widget_config: self.get_j_curve_wrapper({
                    config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
                        dependencies: [irr_j_curve_query.get_id()],
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
                    boolean_event: self.events.get('irr_j_curve:time_zero'),
                    data: irr_j_curve_query.data,
                }),
            },
            {
                id: 'cashflow_j_curve',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Cash Flow J-Curve',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.cash_flow_j_curve,
                    max_length: 1500,
                },
                widget_config: self.get_j_curve_wrapper({
                    config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
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
                        'cashflow_j_curve:time_zero',
                        'BooleanButton.state',
                    ),
                    enable_currency: true,
                    currency_event: Observer.map(
                        self.events.resolve_event('render_currency', 'PopoverButton.value'),
                        {mapping: 'get', mapping_args: {key: 'symbol'}},
                    ),
                    data: scaled_net_cashflows_query.data,
                    dependencies: [scaled_net_cashflows_query.get_id()],
                }),
            },
            {
                id: 'remaining_value_trend',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Remaining Value Trend',
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.remaining_value_trend,
                    max_length: 1500,
                },
                widget_config: self.get_j_curve_wrapper({
                    config: {
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
                    },
                    data: remaining_value_trend_query.data,
                    dependencies: [remaining_value_trend_query.get_id()],
                    boolean_event: self.events.get('remaining_value_trend:time_zero'),
                }),
            },
            {
                id: 'close_peer_set_table',
                component: ReportComponentWrapper,
                allow_description: true,
                save_event: self.events.get('save_draft'),
                caption: {
                    text_body_provider: self.text_generators.close_peer_set,
                    max_length: 1000,
                },
                widget_config: {
                    id: 'table',
                    component: DataTable,
                    dependencies: [close_peer_set_query.get_id()],
                    inline_data: true,
                    comp_color: '#61C38C',
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
                            visible: false,
                        },
                        {
                            label: '3 Year Momentum',
                            key: 'momentum:3_year',
                            format: 'percent',
                            visible: false,
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
                    data: ko.computed(() => {
                        let data = close_peer_set_query.data();
                        return !data ? [] : data.funds;
                    }),
                    comps: ko.computed(() => {
                        let data = close_peer_set_query.data();
                        return !data ? [] : [data.target];
                    }),
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
                title: 'Close Peers Cohort',
                // subtitle: 'Close Peers Cohort',
                layout: ['close_peer_set_table'],
                oversized_page: true,
            },
            {
                title: 'Fund Overview',
                subtitle: 'Net Performance',
                layout: ['net_performance', 'net_of_recallable'],
            },
            {
                title: 'Benchmarking',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot_1'],
            },
            {
                title: 'Benchmarking',
                subtitle_callback: self.peer_subtitle_callback,
                layout: ['peer_snapshot_2'],
            },
            {
                title: 'Benchmarking',
                subtitle: 'Cobalt Benchmark Trend',
                layout: ['peer_trend'],
            },
            {
                title: 'Benchmarking',
                subtitle: 'PME Trend',
                layout: ['pme_trend'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Overview',
                layout: ['horizon_overview'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Analysis vs. Markets',
                layout: ['horizon_analysis'],
            },
            {
                title: 'Peer Tracking',
                subtitle: 'Side By Side Comparison',
                layout: ['side_by_side'],
            },
            {
                title: 'Peer Tracking',
                subtitle: 'Momentum Analysis',
                layout: ['momentum_analysis_side_by_side', 'momentum_analysis_tvpi_progression'],
            },
            {
                title: 'Fund Management',
                subtitle: 'IRR J-Curve',
                layout: ['irr_j_curve'],
            },
            {
                title: 'Fund Management',
                subtitle: 'Cash Flow J-Curve',
                layout: ['cashflow_j_curve'],
            },
            {
                title: 'Risk Exposure',
                subtitle: 'Remaining Value Trend',
                layout: ['remaining_value_trend'],
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
                caption: {
                    text_body_provider: self.text_generators.net_performance,
                },
                widget_config: {
                    component: CashflowOverview,
                    active_template: 'visual_reports',
                },
            },
            {
                title: 'Net of Recallable Method',
                id: 'net_of_recallable',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                caption: {
                    text_body_provider: self.static_descriptions.net_of_recallable,
                },
                widget_config: {
                    component: FundOverviewCallouts,
                    template: 'tpl_fund_overview_callouts_full',
                    irr_label: 'IRR',
                    css_style: {margin: '0px 0px'},
                },
            },
            self.get_peer_snapshot_viewer_config('1'),
            self.get_peer_snapshot_viewer_config('2'),
            {
                id: 'peer_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.peer_trend,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'inverse_quartile',
                    y_min: 0,
                    y_max: 4,
                    allowDecimals: false,
                    shared_tooltip: true,
                    exporting: false,
                },
            },
            {
                id: 'pme_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.pme_trend,
                },
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
                id: 'horizon_overview',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.horizon_overview,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                },
            },
            {
                id: 'horizon_analysis',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.horizon_analysis,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                },
            },
            {
                id: 'side_by_side',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.side_by_side,
                },
                widget_config: {
                    component: MultiBarChart,
                    chart_height: 420,
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
                id: 'momentum_analysis_side_by_side',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.momentum_analysis_side_by_side,
                },
                widget_config: {
                    component: ScoringChart,
                    chart_height: 300,
                    disable_controls: true,
                    truncate_label_length: 50,
                    axis_font_size: '8px',
                    hide_label: true,
                    hide_axis_labels: true,
                    exporting: false,
                },
            },
            {
                id: 'momentum_analysis_tvpi_progression',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'TVPI Progression',
                caption: {
                    text_body_provider: self.static_descriptions.momentum_analysis_tvpi_progression,
                },
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
                id: 'irr_j_curve',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.irr_j_curve,
                },
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
                id: 'cashflow_j_curve',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.cash_flow_j_curve,
                },
                widget_config: self.get_j_curve_wrapper({
                    enable_currency: true,
                    config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
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
                id: 'remaining_value_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.remaining_value_trend,
                },
                widget_config: self.get_j_curve_wrapper({
                    config: {
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
                }),
            },
            {
                id: 'close_peer_set_table',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.text_generators.close_peer_set,
                },
                widget_config: {
                    component: DataTable,
                    comp_color: '#61C38C',
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
                                "Can refer to IRR curve or cash flow curve. The IRR j-curve refers to the tendency of private equity funds to deliver negative returns in early years and investment gains in later years. When IRRs over time are graphed, the fund's IRR typically plot into a &quot;J&quot; shape. Similarly, the cash-flow j-curve (used in Cobalt's FBRs) plots cash flows over time. These typically also form a &quot;J&quot; shape, as cash flows are negative in a fund's early years as capital is drawn down, and then start curving upward as the fund starts making distributions.",
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
        internal_list_bison_funds: true,
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

        self.report.subscribe(self.broadcast_uid);

        self.set_state(self.initial_state);

        self.editor.body_loading.subscribe(loading => {
            Observer.broadcast(self.events.get('disable_preview'), loading);
        });

        _dfd.resolve();
    });

    return self;
}
