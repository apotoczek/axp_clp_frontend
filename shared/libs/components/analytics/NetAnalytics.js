import $ from 'jquery';
import ko from 'knockout';
import config from 'config';
import pager from 'pager';
import auth from 'auth';
import moment from 'moment';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ExpandableMetaData from 'src/libs/components/basic/ExpandableMetaData';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ActionButton from 'src/libs/components/basic/ActionButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import QuartileProgression from 'src/libs/components/analytics/QuartileProgression';
import TimeWeightedComparison from 'src/libs/components/analytics/TimeWeightedComparison';
import TimeWeightedBreakdown from 'src/libs/components/analytics/TimeWeightedBreakdown';
import PeerProgression from 'src/libs/components/analytics/PeerProgression';
import PMEProgression from 'src/libs/components/analytics/PMEProgression';
import HorizonModel from 'src/libs/components/analytics/HorizonModel';
import PortfolioValueDrivers from 'src/libs/components/analytics/PortfolioValueDrivers';
import AnalyticsPortfolioFunds from 'src/libs/components/analytics/AnalyticsPortfolioFunds';
import AnalyticsPointInTime from 'src/libs/components/analytics/AnalyticsPointInTime';
import AnalyticsPeer from 'src/libs/components/analytics/AnalyticsPeer';
import AnalyticsSideBySide from 'src/libs/components/analytics/AnalyticsSideBySide';
import AnalyticsPME from 'src/libs/components/analytics/AnalyticsPME';
import AnalyticsHelper from 'src/libs/components/analytics/AnalyticsHelper';
import AnalyticsNetOverview from 'src/libs/components/analytics/AnalyticsNetOverview';
import NetBenchmark from 'src/libs/components/analytics/NetBenchmark';
import ValueChange from 'src/libs/components/analytics/ValueChange';
import Checklist from 'src/libs/components/basic/Checklist';
import FutureCommitmentsForm from 'src/libs/components/analytics/horizon_model/FutureCommitmentsForm';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import Label from 'src/libs/components/basic/Label';
import PopoverSortOrder from 'src/libs/components/popovers/PopoverSortOrder';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';
import TieredChecklist from 'src/libs/components/basic/TieredChecklist';
import PopoverChecklistCustomValue from 'src/libs/components/popovers/PopoverChecklistCustomValue';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import EventButton from 'src/libs/components/basic/EventButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import {Calculation} from 'src/libs/Enums';
import MessageBanner from 'src/libs/components/basic/MessageBanner';
import ActionButtons from 'src/libs/components/basic/ActionButtons';

const NetAnalytics = function(opts = {}, components = {}) {
    const self = new BaseComponent(opts, components);

    self.template = opts.template || undefined;

    const _dfd = self.new_deferred();

    const entity_type = opts.entity_type;

    const hl_deployment = config.hl || false;

    const breadcrumb_base = opts.breadcrumb_base || [
        {
            label: 'My Investments',
            link: '#!/analytics',
        },
    ];

    const bubble_control_visible = ko.observable(false);

    // axp t105 NetAnalytics (default current market ids helpers) (start)
    let default_market_id = () => {
        return default_market_id || 100101;
    };

    let current_market_id = () => {
        // let _current_market_id = self.get_id(); // axp t105 todo verify id source
        let _current_market_id = default_market_id();

        return _current_market_id || default_market_id();
    };

    let default_mode = opts.default_mode;
    let events = self.new_instance(EventRegistry);
    events.new('toggle_expand_metadata');
    events.new('side_by_side_show_currency');
    events.new('side_by_side_show_lists');
    events.new('side_by_side_available_results_per_page');
    events.new('show_cf_filters');
    events.new('create_visual_report');
    events.new('create_peer_report');
    events.new('create_lp_report');

    events.resolve_and_add('irr_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('paid_in_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('distributed_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('quarterly_cashflows_bool', 'BooleanButton.state');
    events.resolve_and_add('nav_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('revision_selected', 'PopoverButton.value');
    events.resolve_and_add('value_change:split_by_cfs', 'BooleanButton.value');

    /********************************************************************
     * Events used frequently in config, broadcasted by analytics.js
     based on url
     *******************************************************************/

    const set_mode_event = opts.set_mode_event;

    if (!set_mode_event) {
        throw "Set mode event can't be undefined in NetAnalytics";
    }

    const user_fund_uid_event =
        opts.user_fund_uid_event || Utils.gen_event('Active.user_fund_uid', self.get_id());
    const portfolio_uid_event =
        opts.portfolio_uid_event || Utils.gen_event('Active.portfolio_uid', self.get_id());
    const market_data_fund_uid_event = opts.market_data_fund_uid_event;
    const market_data_family_uid_event = opts.market_data_family_uid_event;
    const currency_visible_event = Utils.gen_event('BenchmarkCurrency.visible', self.get_id());
    const clear_horizon_event = Utils.gen_event('Horizon.clear', self.get_id()); // axp t105 (!)
    let reset_event; // axp t105 (!)

    if (opts.reset_event) {
        reset_event = Utils.gen_event(opts.reset_event, self.get_id()); // axp t105 (!)
    }

    const register_export_event = Utils.gen_event(
        'DynamicActions.register_action',
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );
    const enable_export_event = Utils.gen_event(
        'DynamicActions.enabled',
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    let user_fund_uid_required = false;
    let portfolio_uid_required = false;
    let market_data_fund_uid_required = false;
    let market_data_family_uid_required = false;

    self.mode = ko.observable(default_mode);
    self.in_revision_mode = ko.observable(false);
    self.revision_allowed = ko.pureComputed(() => {
        return (
            self.in_revision_mode() &&
            [
                'overview',
                'pme',
                'pme:benchmark',
                'pme:progression',
                'peer:benchmark',
                'portfolio_funds',
                'point_in_time',
            ].includes(self.mode())
        );
    });

    self.provider = ko.observable();

    let entity_uid_event;
    let in_market_data = false;

    if (entity_type === 'user_fund') {
        user_fund_uid_required = true;
        entity_uid_event = user_fund_uid_event;
    } else if (entity_type === 'market_data_fund') {
        market_data_fund_uid_required = true;
        entity_uid_event = market_data_fund_uid_event;
        in_market_data = true;
    } else if (entity_type == 'market_data_family') {
        market_data_family_uid_required = true;
        entity_uid_event = market_data_family_uid_event;
        in_market_data = true;
    } else {
        portfolio_uid_required = true;
        entity_uid_event = portfolio_uid_event;
    }

    DataManagerHelper.register_view_in_datamanager_event(
        Utils.gen_event(
            'ActionButton.action.view_in_datamanager',
            self.get_id(),
            'body',
            'action_toolbar',
            'view_in_datamanager',
        ),
    );

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'action_toolbar',
            'upload',
        ),
    );

    DataManagerHelper.register_create_new_entity_action_button(
        Utils.gen_id(self.get_id(), 'body', 'action_toolbar', 'new'),
    );

    const breadcrumbs = opts.breadcrumbs || [
        ...breadcrumb_base,
        {
            datasource: {
                type: 'dynamic',
                key: 'name',
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                query: {
                    target: 'vehicle:meta_data',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                    },
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: market_data_fund_uid_event,
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: portfolio_uid_event,
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                    },
                },
            },
        },
    ];

    const horizon_model_group_event = Utils.gen_event(
        'PopoverButton.state',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'horizon_model',
        'grouping',
        'grouping_body',
        'group',
    );
    const horizon_model_group = Observer.observable(horizon_model_group_event);
    const horizon_model_attribute_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'horizon_model',
        'grouping',
        'grouping_body',
        'attribute',
    );

    const list_uid_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'lists_filter',
    );

    const get_horizon_event = mode =>
        Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'horizon',
        );

    const get_pme_index_event = mode =>
        Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'pme_index',
        );

    const get_render_currency_event = mode =>
        Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'render_currency',
        );

    const get_currency_symbol_event = mode =>
        Observer.map(get_render_currency_event(mode), {
            mapping: 'get',
            mapping_args: {key: 'symbol'},
        });

    const get_time_interval_event = mode =>
        Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'time_interval',
        );

    const metric_filter_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'benchmark_metrics',
    );

    const benchmark_currency_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'benchmark_currency',
    );

    const vehicle_currency_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'vehicle_currency',
    );

    const vintage_year_range_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'vintage_year_range',
    );

    const benchmark_edition_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'benchmark_edition',
    );

    const comp_fund_include_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'net_benchmark',
        'comp_funds',
    );

    /********************************************************************
     * MODES / TABS
     Modes for mode_toggle components (vertical tabs)
     *******************************************************************/
    const enum_popover_confs = clear_event => {
        return {
            id: 'enum_attributes',
            component: AttributeFilters,
            clear_event: clear_event,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                },
            },
            selected_datasource: {
                type: 'dynamic',
                query: {
                    target: 'entity:attribute_values',
                    public_taxonomy: true,
                    only_root_members: true,
                    entity_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                        required: true,
                    },
                    entity_type: entity_type,
                },
            },
        };
    };

    const modes = [
        {
            label: 'Overview',
            state: 'overview',
        },
        {
            label: 'PME',
            state: 'pme',
            menu: [
                {
                    label: 'Benchmark',
                    state: 'pme:benchmark',
                },
                {
                    label: 'Progression',
                    state: 'pme:progression',
                },
            ],
        },
        {
            label: 'Point in Time',
            state: 'point_in_time',
        },
        {
            label: 'Value Change',
            state: 'value_change',
        },
    ];

    const as_of_date_event = Utils.gen_event('PopoverButton.value', self.get_id(), 'as_of_date');

    const render_currency_conf = (horizon_event, as_of_event = as_of_date_event) => {
        const query = {
            target: 'currency:markets',
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            max_date: {
                type: 'observer',
                event_type: as_of_event,
                mapping: 'get_value',
                required: true,
            },
        };

        if (horizon_event) {
            query.min_date = {
                type: 'observer',
                event_type: horizon_event,
                mapping: 'get_value',
                required: true,
            };
        }

        return {
            id: 'render_currency',
            label: 'Currency',
            component: NewPopoverButton,
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Currency',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: Radiolist,
                value_key: 'value',
                label_key: 'label',
                option_disabled_key: 'invalid',
                enable_filter: true,
                filter_value_keys: ['label'],
                datasource: {
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'id',
                        label_keys: ['symbol', 'name'],
                        additional_keys: ['symbol', 'invalid'],
                    },
                    type: 'dynamic',
                    query: query,
                },
                selected_datasource: {
                    key: 'base_currency',
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:currency_id',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                            required: market_data_fund_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                            required: portfolio_uid_required,
                        },
                    },
                },
            },
        };
    };

    /********************************************************************
     * CASHFLOW FILTERS
     * filter fund cashflows by attribute
     *******************************************************************/

    const cf_attr_filters = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            one_required: ['user_fund_uid', 'market_data_fund_uid', 'portfolio_uid'],
            query: {
                target: 'cash_flow_attribute_filter_configs',
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                },
            },
        },
    });

    const beta_testing_options = () => {
        if (auth.user_has_feature('beta_testing')) {
            return {
                revision: self.new_instance(NewPopoverButton, {
                    id: 'revision',
                    clear_event: reset_event,
                    id_callback: events.register_alias('revision_selected'),
                    label: 'Revision',
                    label_track_selection: true,
                    hide_icon: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Show historic data',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        id: 'revision_popover',
                        component: PopoverChecklistCustomValue,
                        custom_value_placeholder: 'Custom Date',
                        custom_value_mapping: 'date_to_epoch',
                        single_selection: true,
                        disable_untoggle: true,
                        selected_idx: 0,
                        empty_text: 'Insufficient cash flows',
                        datasource: {
                            mapping: 'backend_datetimes_to_options',
                            mapping_args: {
                                extra_options: [
                                    {
                                        label: 'Current',
                                        value: null,
                                    },
                                ],
                            },
                            mapping_default: [],
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:revision_dates',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                    required: portfolio_uid_required,
                                },
                            },
                        },
                    },
                }),
            };
        }
        return {};
    };

    cf_attr_filters.data.subscribe(available_filters => {
        if (Array.isArray(available_filters)) {
            Observer.broadcast(events.get('show_cf_filters'), available_filters.length > 0);
        }
    });

    self.meta_data_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            one_required: [
                'user_fund_uid',
                'portfolio_uid',
                'market_data_fund_uid',
                'market_data_family_uid',
            ],
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                },
            },
        },
    });

    function gen_meta_data_datasource() {
        return {
            type: 'dynamic',
            one_required: [
                'user_fund_uid',
                'portfolio_uid',
                'market_data_fund_uid',
                'market_data_family_uid',
            ],
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                },
            },
        };
    }

    /********************************************************************
     * USER FUND/PORTFOLIO FILTERS
     options to filter within the user's fund/portfolio being analyzed
     *******************************************************************/

    events.resolve_and_add('vintage_year', 'PopoverButton.value');
    // enumerable attributes (ex: geo, style, focus)
    events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
    // custom attributes
    events.resolve_and_add('attributes', 'PopoverButton.value');
    events.resolve_and_add('clear_button', 'EventButton');
    // custom cashflow attribute filters
    events.resolve_and_add('custom_cf_attributes', 'AttributeFilters.state');
    events.resolve_and_add('funds_in_portfolio', 'PopoverButton.value');

    const filter_body = [];

    if (entity_type == 'portfolio' || entity_type == 'market_data_family') {
        filter_body.push(
            'filter_label',
            'funds_in_portfolio',
            'enum_attributes',
            'vintage_year',
            'attributes',
            'clear_button',
        );
    }

    filter_body.push('cf_filters');

    const filter_query = {
        enums: {
            type: 'observer',
            event_type: events.get('enum_attributes'),
        },
        vintage_year: {
            type: 'observer',
            event_type: events.get('vintage_year'),
        },
        attributes: {
            type: 'observer',
            event_type: events.get('attributes'),
        },
        cf_attribute_filters: {
            type: 'observer',
            event_type: events.get('custom_cf_attributes'),
        },
        user_fund_uid: {
            type: 'observer',
            event_type: events.get('funds_in_portfolio'),
        },
    };

    /********************************************************************
     * FUND FILTERS
     Filters used both in peer and side by side
     *******************************************************************/

    let fund_filter_confs = fund_filter_id => {
        const fund_filter = fund_filter_id || 'fund_filters';

        // axp t105 (info)
        const clear_event = Utils.gen_event(
            'EventButton',
            self.get_id(),
            fund_filter,
            'clear_button',
        );

        return [
            {
                id: 'fund_custom_attributes',
                component: NewPopoverButton,
                label: 'Attributes',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                visible_callback: function(popover) {
                    return popover.filters().length > 0;
                },
                popover_config: {
                    id: 'attributes_filter',
                    component: AttributeFilters,
                    title: 'Attributes',
                    clear_event: events.get('clear_button'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            entity_uid: {
                                type: 'observer',
                                event_type: entity_uid_event,
                                required: true,
                            },
                            entity_type: entity_type,
                            cashflow_type: 'net',
                        },
                    },
                },
            },
            enum_popover_confs(clear_event),
            {
                id: 'clear_button',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear Filters',
            },
            {
                component: NewPopoverButton,
                id: 'fund_size',
                label: 'Fund Size',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Fund Size',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            },
            {
                id: 'vintage_year',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Vintage Year',
                popover_options: {
                    title: 'Benchmark Vintage Year',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:vintage_years',
                        },
                    },
                    selected_datasource: {
                        key: 'vintage_year',
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                        },
                    },
                },
            },
        ];
    };

    // axp t105 const horizon_conf = inception_last => {... (info)
    const horizon_conf = inception_last => {
        inception_last = inception_last || false;

        return {
            component: NewPopoverButton,
            disabled: self.in_revision_mode,
            clear_event: reset_event, // axp t105 (horizon_conf return clear_event: reset_event) (!)
            id: 'horizon',
            label: 'Horizon',
            label_track_selection: true,
            hide_icon: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select horizon',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                id: 'horizon_popover',
                clear_event: [as_of_date_event, clear_horizon_event], // axp t105 todo insert market id check
                component: PopoverChecklistCustomValue,
                custom_value_placeholder: 'Custom Date',
                custom_value_mapping: 'date_to_epoch',
                single_selection: true,
                disable_untoggle: true,
                empty_text: 'Insufficient cash flows',
                selected_idx: 0,
                datasource: {
                    mapping: 'to_options',
                    mapping_default: [],
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:start_date_options',
                        as_of_date: {
                            type: 'observer',
                            event_type: as_of_date_event,
                            required: true,
                            mapping: 'get_value',
                        },
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                            required: market_data_fund_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                            required: portfolio_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                        inception_last: inception_last,
                    },
                },
            },
        };
    };

    // axp t105 pme_index_conf = horizon_event (const pme_index_conf = horizon_event => {... (info)
    const pme_index_conf = horizon_event => {
        const query = {
            target: 'vehicle:index_options',
            tree_mode: true,
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            max_date: {
                type: 'observer',
                event_type: as_of_date_event,
                mapping: 'get_value',
                required: true,
            },
        };

        if (horizon_event) {
            query.min_date = {
                type: 'observer',
                event_type: horizon_event,
                mapping: 'get_value',
                required: true,
            };
        }

        // axp t105 pme_index_conf = horizon_event pme_index return (start)
        return {
            id: 'pme_index',
            label: 'Index',
            component: NewPopoverButton,
            clear_event: reset_event, // axp t105 (return pme_index clear_event: reset_event) (!)
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Index',
                placement: 'right',
                css_class: 'popover-cpanel',
                listen_to: ['checklists'],
            },
            popover_config: {
                component: TieredRadiolist,
                parent_key: 'parent',
                value_key: 'value',
                label_key: 'label',
                sub_label_key: 'sub_label',
                option_disabled_key: 'invalid',
                enable_filter: true,
                max_tier: 2,
                min_height: '350px',
                filter_value_keys: ['sub_label', 'label'],
                datasource: {
                    type: 'dynamic',
                    query: query,
                },
                selected_datasource: {
                    key: 'market_id',
                    type: 'dynamic',
                    one_required: [
                        'user_fund_uid',
                        'portfolio_uid',
                        'market_data_fund_uid',
                        'market_data_family_uid',
                    ],
                    query: {
                        target: 'vehicle:meta_data',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                        },
                    },
                },
            },
        };
    };

    const protected_revision_body = () =>
        Utils.conditional_element(['revision'], auth.user_has_feature('beta_testing'));

    const protected_revision_query = () =>
        Utils.conditional_element(
            {
                revision: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: events.get('revision_selected'),
                    required: false,
                },
            },
            auth.user_has_feature('beta_testing'),
        );

    /********************************************************************
     * Shared components are initialized beforehand and passed in as the
     second argument to the Control Panel Aside (top level aside).
     They can then be referenced in all components and thus reused in
     multiple modes.
     *******************************************************************/

    let shared_components = {
        chart_provider: self.new_instance(NewPopoverButton, {
            id: 'chart_provider',
            label: 'Data Provider',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Provider',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                let options = popover.data();

                if (options && options.length > 1) {
                    return true;
                }

                return false;
            },
            popover_config: {
                component: Radiolist,
                datasource: {
                    type: 'dynamic',
                    mapping: 'list_to_options',
                    query: {
                        target: 'benchmark:providers',
                    },
                },
            },
        }),
        benchmark: self.new_instance(NewPopoverButton, {
            id: 'benchmark',
            label: 'Benchmark',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Benchmark',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: Radiolist,
                dependencies: [Utils.gen_id('PopoverButton.value', self.get_id(), 'as_of_date')],
                datasource: {
                    type: 'dynamic',
                    query: {
                        provider: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'chart_provider',
                            ),
                            required: true,
                        },
                        target: 'benchmarks',
                    },
                },
                selected_datasource: {
                    type: 'dynamic',
                    query: {
                        as_of_date: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: as_of_date_event,
                            required: true,
                        },
                        provider: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'chart_provider',
                            ),
                            required: true,
                        },
                        target: 'benchmark_uid_for_as_of_date',
                    },
                },
            },
        }),
        data_set_label: self.new_instance(HTMLContent, {
            id: 'data_set_label',
            html: '<h5>Data Set</h5>',
        }),
        filter_label: self.new_instance(HTMLContent, {
            id: 'filter_label',
            html: '<h5>Filter</h5>',
        }),
        general_label: self.new_instance(HTMLContent, {
            id: 'general_label',
            html: '<h5>General</h5>',
        }),
        settings_label: self.new_instance(HTMLContent, {
            id: 'settings_label',
            html: '<h5>Settings</h5>',
        }),
        benchmark_settings_label: self.new_instance(HTMLContent, {
            id: 'benchmark_settings_label',
            html: '<h5>Benchmark Settings</h5>',
        }),
        benchmark_currency: self.new_instance(NewPopoverButton, {
            id: 'benchmark_currency',
            label: 'Currency',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Currency',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function() {
                let provider = shared_components.chart_provider.popover.get_value();
                return provider && provider.value === 'Hamilton Lane';
            },
            popover_config: {
                component: Radiolist,
                value_key: 'value',
                label_key: 'label',
                option_disabled_key: 'invalid',
                enable_filter: true,
                filter_value_keys: ['label'],
                datasource: {
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'id',
                        label_keys: ['symbol', 'name'],
                        additional_keys: ['symbol', 'invalid'],
                    },
                    type: 'dynamic',
                    query: {
                        target: 'currency:markets',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                            required: market_data_fund_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                            required: portfolio_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                        max_date: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: as_of_date_event,
                            required: true,
                        },
                    },
                },
                selected_datasource: {
                    key: 'base_currency',
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:currency_id',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                            required: market_data_fund_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                            required: portfolio_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                    },
                },
            },
        }),
        as_of_date: self.new_instance(NewPopoverButton, {
            clear_event: reset_event, // axp t105 as_of_date clear_event: reset_event (info)
            disabled: self.in_revision_mode,
            id: 'as_of_date',
            label: 'As of',
            label_track_selection: true,
            hide_icon: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select as of date',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                id: 'as_of_date_popover',
                component: PopoverChecklistCustomValue,
                custom_value_placeholder: 'Custom Date',
                custom_value_mapping: 'date_to_epoch',
                single_selection: true,
                disable_untoggle: true,
                selected_idx: 0,
                empty_text: 'Insufficient cash flows',
                datasource: {
                    mapping: 'backend_dates_to_options',
                    mapping_default: [],
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:as_of_dates',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
                        },
                        market_data_fund_uid: {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                            required: market_data_fund_uid_required,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                            required: portfolio_uid_required,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                    },
                },
            },
        }),
        ...beta_testing_options(),
        fund_filters: self.new_instance(Aside, {
            id: 'fund_filters',
            template: 'tpl_aside_body',
            layout: {
                body: ['enum_attributes', 'vintage_year', 'fund_size', 'clear_button'],
            },
            components: fund_filter_confs('fund_filters'),
        }),
        benchmark_fund_filters: self.new_instance(Aside, {
            id: 'benchmark_fund_filters',
            template: 'tpl_aside_body',
            layout: {
                body: ['enum_attributes', 'fund_custom_attributes', 'clear_button'],
            },
            components: fund_filter_confs('benchmark_fund_filters'),
        }),
        post_date_navs: self.new_instance(BooleanButton, {
            id: 'post_date_navs',
            label: 'Roll Forward NAVs',
            template: 'tpl_cpanel_boolean_button',
            default_state: true,
            reset_event: reset_event,
            define: {
                term: 'Roll Forward NAVs',
                placement: 'right',
            },
        }),
        expandable_meta_data: self.new_instance(ExpandableMetaData, {
            id: 'expandable_meta_data',
            toggle_event: events.get('toggle_expand_metadata'),
            datasource: {
                type: 'dynamic',
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                query: {
                    target: 'vehicle:meta_data',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                    },
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: market_data_fund_uid_event,
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: portfolio_uid_event,
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                    },
                },
            },
            metrics: [
                {
                    label: 'Name',
                    value_key: 'name',
                },
                {
                    label: 'Type',
                    value_key: 'entity_type',
                    format: 'entity_type',
                },
                {
                    label: 'Cashflow Type',
                    value_key: 'cashflow_type',
                    format: 'titleize',
                },
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Base Currency',
                    value_key: 'base_currency',
                },
                {
                    label: '# Funds',
                    value_key: 'vehicle_count',
                    format: 'number',
                    visible: function(data) {
                        return data && data.entity_type === 'portfolio';
                    },
                },
                {
                    label: '# Companies',
                    value_key: 'vehicle_count',
                    format: 'number',
                    visible: function(data) {
                        return (
                            data &&
                            data.entity_type === 'user_fund' &&
                            data.cashflow_type === 'gross'
                        );
                    },
                },
                {
                    label: 'Source Investor',
                    value_key: 'investor_name',
                    visible: function(data) {
                        return data && data.entity_type === 'bison_fund';
                    },
                },
                {
                    label: 'Geography',
                    value_key: 'attributes:geography',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Style / Focus',
                    value_key: 'attributes:style',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Sector',
                    value_key: 'attributes:sector',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Shared By',
                    value_key: 'shared_by',
                    format: 'strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Permissions',
                    value_key: 'permissions',
                    format: 'strings_full',
                },
            ],
        }),
        enum_attributes: self.new_instance(AttributeFilters, {
            id: 'enum_attributes',
            id_callback: events.register_alias('enum_attributes'),
            clear_event: events.get('clear_button'),
            option_disabled_key: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    entity_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                        required: true,
                    },
                    entity_type: entity_type,
                    disable_unused: true,
                },
            },
            selected_datasource: {
                type: 'dynamic',
                query: {
                    target: 'entity:attribute_values',
                    public_taxonomy: true,
                    only_root_members: true,
                    entity_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                        required: true,
                    },
                    entity_type: entity_type,
                },
            },
        }),
        vintage_year: self.new_instance(NewPopoverButton, {
            id: 'vintage_year',
            label: 'Vintage Year',
            id_callback: events.register_alias('vintage_year'),
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: events.get('clear_button'),
            popover_options: {
                title: 'Vintage Year',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: Checklist,
                enable_exclude: true,
                datasource: {
                    type: 'dynamic',
                    mapping: 'list_to_options',
                    mapping_default: [],
                    one_required: ['portfolio_uid', 'market_data_family_uid'],
                    query: {
                        target: 'vehicle:vintage_years',
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                        },
                    },
                },
            },
        }),
        attributes: self.new_instance(NewPopoverButton, {
            id: 'attributes',
            id_callback: events.register_alias('attributes'),
            label: 'Attributes',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                return popover.filters().length > 0;
            },
            popover_config: {
                component: AttributeFilters,
                title: 'Enum Attributes',
                clear_event: events.get('clear_button'),
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        entity_uid: {
                            type: 'observer',
                            event_type: entity_uid_event,
                            required: true,
                        },
                        entity_type: entity_type,
                        cashflow_type: 'net',
                    },
                },
            },
        }),
        clear_button: self.new_instance(EventButton, {
            id: 'clear_button',
            id_callback: events.register_alias('clear_button'),
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear Filters',
        }),
        funds_in_portfolio: self.new_instance(NewPopoverButton, {
            id: 'funds_in_portfolio',
            id_callback: events.register_alias('funds_in_portfolio'),
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            label: 'Fund',
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: events.get('clear_button'),
            popover_options: {
                title: 'Fund',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: Checklist,
                enable_exclude: true,
                enable_filter: true,
                datasource: {
                    type: 'dynamic',
                    one_required: ['portfolio_uid', 'market_data_family_uid'],
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'uid',
                        label_key: 'name',
                    },
                    query: {
                        target: 'sub_vehicle_options',
                        entity_type: entity_type,
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                        },
                        sub_entity_types: ['user_fund', 'market_data_fund'],
                    },
                },
            },
        }),
        cf_filters: self.new_instance(Aside, {
            id: 'cf_filters',
            template: 'tpl_aside_body',
            visible: false,
            visible_event: events.get('show_cf_filters'),
            layout: {
                body: ['cashflow_filters_label', 'custom_cf_attributes'],
            },
            components: [
                {
                    id: 'cashflow_filters_label',
                    component: HTMLContent,
                    html: '<h5>Cashflow Filters</h5>',
                },
                AnalyticsHelper.cf_attr_filter_config({
                    id: 'custom_cf_attributes',
                    id_callback: events.register_alias('custom_cf_attributes'),
                    user_fund_uid_event: user_fund_uid_event,
                    portfolio_uid_event: portfolio_uid_event,
                }),
            ],
        }),
    };

    self.base_allocations_columns = [
        {
            label: 'IRR',
            key: 'irr',
            value: 'irr',
            type: 'numeric',
            format: 'irr',
        },
        {
            label: 'TVPI',
            key: 'tvpi',
            value: 'tvpi',
            type: 'numeric',
            format: 'multiple',
        },
        {
            label: 'DPI',
            key: 'dpi',
            value: 'dpi',
            type: 'numeric',
            format: 'multiple',
        },
        {
            label: 'RVPI',
            key: 'rvpi',
            value: 'rvpi',
            type: 'numeric',
            format: 'multiple',
            visible: false,
        },
        {
            label: 'Paid In %',
            type: 'numeric',
            format: 'percent',
            key: 'picc',
            value: 'picc',
            visible: false,
        },
        {
            label: 'Paid In',
            type: 'numeric',
            format: 'money',
            value: 'paid_in',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'paid_in',
            },
            visible: false,
        },
        {
            label: 'Paid In (% of Total)',
            key: 'paid_in_pct',
            value: 'paid_in_pct',
            type: 'numeric',
            visible: false,
            format: 'percent',
        },
        {
            label: 'Distributed',
            type: 'numeric',
            format: 'money',
            value: 'distributed',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'distributed',
            },
            visible: false,
        },
        {
            label: 'Distributed (% of Total)',
            key: 'distributed_pct',
            value: 'distributed_pct',
            type: 'numeric',
            visible: false,
            format: 'percent',
        },
        {
            label: 'NAV',
            type: 'numeric',
            format: 'money',
            value: 'nav',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'nav',
            },
            visible: false,
        },
        {
            label: 'NAV (% of Total)',
            key: 'nav_pct',
            value: 'nav_pct',
            type: 'numeric',
            visible: false,
            format: 'percent',
        },
        {
            label: 'Total Value',
            type: 'numeric',
            format: 'money',
            value: 'total_value',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'total_value',
            },
            visible: false,
        },
        {
            label: 'Total Value (% of Total)',
            key: 'total_value_pct',
            value: 'total_value_pct',
            type: 'numeric',
            visible: false,
            format: 'percent',
        },
        {
            label: 'Commitment',
            type: 'numeric',
            format: 'money',
            value: 'commitment',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'commitment',
            },
            visible: false,
        },
        {
            label: 'Commitment (% of Total)',
            key: 'commitment_pct',
            value: 'commitment_pct',
            type: 'numeric',
            format: 'percent',
            visible: false,
        },
        {
            label: 'Unfunded',
            type: 'numeric',
            format: 'money',
            value: 'unfunded',
            format_args: {
                currency_key: 'render_currency',
                value_key: 'unfunded',
            },
            visible: false,
        },
        {
            label: 'Unfunded (% of Total)',
            key: 'unfunded_pct',
            value: 'unfunded_pct',
            type: 'numeric',
            format: 'percent',
            visible: false,
        },
        {
            label: 'Age',
            key: 'age_years',
            value: 'age_years',
            format: 'years',
            visible: false,
        },
        {
            label: 'Min IRR',
            key: 'min_irr',
            value: 'min_irr',
            format: 'irr',
            visible: false,
        },
        {
            label: 'Max IRR',
            key: 'max_irr',
            value: 'max_irr',
            format: 'irr',
            visible: false,
        },
        {
            label: '# Funds',
            key: 'vehicle_count',
            value: 'vehicle_count',
            visible: false,
        },
        {
            label: '# Funds Above Avg',
            key: 'vehicles_above_avg',
            value: 'vehicles_above_avg',
            visible: false,
        },
    ];
    /********************************************************************
     * CPANEL CONFIGS
     * Configs for each mode. Configured here to enable dynamic
     * setup based on entity type.
     *******************************************************************/

    /********************************************************************
     * CPANEL CONFIG - OVERVIEW
     *******************************************************************/
    const post_date_navs_button = [];
    if (config.enable_roll_forward_ui) {
        post_date_navs_button.push('post_date_navs');
    }

    const overview_body = [
        'as_of_date',
        ...protected_revision_body(),
        'render_currency',
        ...post_date_navs_button,
        'view_toggle',
        ...filter_body,
    ];

    if (auth.user_has_feature('calculation_mapping') && entity_type !== 'market_data_fund') {
        overview_body.push(
            'calculation_mappings_label',
            'nav_calculation_mapping',
            'irr_calculation_mapping',
            'paid_in_calculation_mapping',
            'distributed_calculation_mapping',
            'quarterly_cashflows_bool',
        );
    }

    const user_calculation_mapping_options = () => {
        if (entity_type === 'market_data_fund') {
            return [];
        }

        if (auth.user_has_feature('calculation_mapping')) {
            return [
                {
                    id: 'calculation_mappings_label',
                    component: HTMLContent,
                    html: '<h5>Calculations</h5>',
                },
                {
                    id: 'irr_calculation_mapping',
                    id_callback: events.register_alias('irr_calculation_mapping'),
                    component: NewPopoverButton,
                    label: 'IRR Mapping',
                    clear_event: reset_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'uid',
                                label_key: 'name',
                            },
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'portfolio_uid'],
                            query: {
                                target: 'entity:calculation_mappings',
                                results_per_page: 'all',
                                calculation_types: [Calculation.IRR],
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'nav_calculation_mapping',
                    id_callback: events.register_alias('nav_calculation_mapping'),
                    component: NewPopoverButton,
                    label: 'NAV Mapping',
                    clear_event: reset_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'uid',
                                label_key: 'name',
                            },
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'portfolio_uid'],
                            query: {
                                target: 'entity:calculation_mappings',
                                results_per_page: 'all',
                                calculation_types: [Calculation.NAV],
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'paid_in_calculation_mapping',
                    id_callback: events.register_alias('paid_in_calculation_mapping'),
                    component: NewPopoverButton,
                    label: 'Paid-in Mapping',
                    clear_event: reset_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'uid',
                                label_key: 'name',
                            },
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'portfolio_uid'],
                            query: {
                                target: 'entity:calculation_mappings',
                                results_per_page: 'all',
                                calculation_types: [Calculation.PAID_IN],
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'distributed_calculation_mapping',
                    id_callback: events.register_alias('distributed_calculation_mapping'),
                    component: NewPopoverButton,
                    label: 'Distributed Mapping',
                    clear_event: reset_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'uid',
                                label_key: 'name',
                            },
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'portfolio_uid'],
                            query: {
                                target: 'entity:calculation_mappings',
                                results_per_page: 'all',
                                calculation_types: [Calculation.DISTRIBUTED],
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'quarterly_cashflows_bool',
                    id_callback: events.register_alias('quarterly_cashflows_bool'),
                    component: BooleanButton,
                    label: 'On Quarter Ends',
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                },
            ];
        }
        return [];
    };

    const cpanel_confs = {};

    cpanel_confs.overview = {
        id: 'overview',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: overview_body,
        },
        components: [
            {
                id: 'view_toggle',
                component: RadioButtons,
                template: 'tpl_cpanel_radio_toggle',
                default_state: 'default',
                reset_event: reset_event,
                buttons: [
                    {
                        label: 'View Summary',
                        state: 'default',
                    },
                    {
                        label: 'View Cash Flows',
                        state: 'data',
                    },
                ],
            },
            render_currency_conf(),
            ...user_calculation_mapping_options(),
        ],
    };

    cpanel_confs.net_benchmark = {
        id: 'net_benchmark',
        template: 'tpl_cpanel_body_items',
        visible: true,
        layout: {
            body: [
                'as_of_date',
                'vehicle_currency',
                ...post_date_navs_button,
                'benchmark_settings_label',
                'lists_filter',
                'results_per_page',
                'chart_provider',
                'benchmark_edition',
                'benchmark_currency',
                'benchmark_metrics',
                'benchmark_filters_label',
                'vintage_year_range',
                'comp_funds',
                'benchmark_fund_filters',
            ],
        },
        components: [
            {
                id: 'results_per_page',
                component: NewPopoverButton,
                label: 'Results per page',
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Results per page',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                disabled_callback: popover => popover.empty(),
                popover_config: {
                    id: 'results_per_page_popover',
                    component: Radiolist,
                    strings: {
                        no_selection: 'All',
                        empty: 'All',
                    },
                    datasource: {
                        type: 'static',
                        data: [
                            {label: '25', value: 25},
                            {label: 'All', value: 'all'},
                        ],
                    },
                },
            },
            {
                id: 'benchmark_edition',
                component: NewPopoverButton,
                label: 'Benchmark',
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Benchmark',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'benchmark_fund_filters',
                    'clear_button',
                ),
                popover_config: {
                    component: Radiolist,
                    dependencies: [
                        Utils.gen_id('PopoverButton.value', self.get_id(), 'as_of_date'),
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            provider: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    self.get_id(),
                                    'chart_provider',
                                ),
                                required: true,
                            },
                            target: 'benchmarks',
                        },
                    },
                },
                selected_datasource: {
                    type: 'dynamic',
                    query: {
                        as_of_date: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: as_of_date_event,
                            required: true,
                        },
                        provider: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'chart_provider',
                            ),
                            required: true,
                        },
                        target: 'benchmark_uid_for_as_of_date',
                    },
                },
            },
            {
                id: 'benchmark_filters_label',
                component: HTMLContent,
                html: '<h5>Filters</h5>',
            },
            {
                id: 'benchmark_metrics',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                track_selection_property: 'selected_string',
                label: 'Metric',
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Metrics',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    data: ko.computed(() => {
                        const data = [
                            {
                                label: 'IRR',
                                value: 'irr',
                            },
                            {
                                label: 'DPI',
                                value: 'dpi',
                            },
                            {
                                label: 'TVPI',
                                value: 'tvpi',
                            },
                        ];
                        if (self.provider() == 'Hamilton Lane') {
                            data.push({
                                label: 'RVPI',
                                value: 'rvpi',
                            });
                        }

                        return data;
                    }),
                },
            },
            {
                component: NewPopoverButton,
                id: 'vintage_year_range',
                label: 'Vintage Year Range',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'benchmark_fund_filters',
                    'clear_button',
                ),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Vintage Year',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                },
            },
            {
                id: 'benchmark_currency',
                component: NewPopoverButton,
                label: 'Currency',
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Currency',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                visible_callback: function() {
                    // axp t105 cpanel_confs.net_benchmark.components visible_callback (info)
                    let provider = shared_components.chart_provider.popover.get_value();
                    return provider && provider.value === 'Hamilton Lane';
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    option_disabled_key: 'invalid',
                    enable_filter: true,
                    filter_value_keys: ['label'],
                    datasource: {
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'id',
                            label_keys: ['symbol', 'name'],
                            additional_keys: ['symbol', 'invalid'],
                        },
                        type: 'dynamic',
                        query: {
                            target: 'currency:markets',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                                required: market_data_family_uid_required,
                            },
                            max_date: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: as_of_date_event,
                                required: true,
                            },
                        },
                    },
                    selected_datasource: {
                        key: 'base_currency',
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:currency_id',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                                required: market_data_family_uid_required,
                            },
                        },
                    },
                },
            },
            {
                id: 'lists_filter',
                component: NewPopoverButton,
                label: 'Lists',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Lists',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
                visible: true,
                //visible_event: events.get('side_by_side_show_lists'),
            },
            {
                id: 'vehicle_currency',
                component: NewPopoverButton,
                label: 'Currency',
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Currency',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                visible_callback: function() {
                    let provider = shared_components.chart_provider.popover.get_value();
                    return provider && provider.value === 'Hamilton Lane';
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    option_disabled_key: 'invalid',
                    enable_filter: true,
                    filter_value_keys: ['label'],
                    datasource: {
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'id',
                            label_keys: ['symbol', 'name'],
                            additional_keys: ['symbol', 'invalid'],
                        },
                        type: 'dynamic',
                        query: {
                            target: 'currency:markets',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                                required: market_data_family_uid_required,
                            },
                            max_date: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: as_of_date_event,
                                required: true,
                            },
                        },
                    },
                    selected_datasource: {
                        key: 'base_currency',
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:currency_id',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                        },
                    },
                },
            },
            {
                id: 'comp_funds',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'benchmark_fund_filters',
                    'clear_button',
                ),
                label: 'Fund',
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Funds',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        one_required: ['portfolio_uid', 'market_data_family_uid'],
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'sub_vehicle_options',
                            entity_type: entity_type,
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                            sub_entity_types: ['user_fund', 'market_data_fund'],
                        },
                    },
                },
            },
        ],
    };

    /*******************************************************************
     * CPANEL CONFIG - SIDE BY SIDE
     Includes fund filter configs
     *******************************************************************/

    cpanel_confs.side_by_side = {
        id: 'side_by_side',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'general_label',
                'as_of_date',
                ...post_date_navs_button,
                'has_cashflows',
                'render_currency',
                'table_settings_label',
                'sort_order',
                'results_per_page',
                'peer_filter_label',
                'lists_filter',
                'fund_filters',
                'cf_filters',
            ],
        },
        components: [
            {
                id: 'table_settings_label',
                component: HTMLContent,
                html: '<h5>Table Settings</h5>',
            },
            {
                id: 'peer_filter_label',
                component: HTMLContent,
                html: '<h5>Peer Filters</h5>',
            },
            {
                ...render_currency_conf(),
                visible_event: events.get('side_by_side_show_currency'),
            },
            {
                id: 'has_cashflows',
                component: BooleanButton,
                label: 'Has Cash Flows',
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: reset_event,
            },
            {
                component: NewPopoverButton,
                id: 'sort_order',
                label: 'Order',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                icon_css: 'glyphicon glyphicon-th-list',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Order',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverSortOrder,
                    template: 'tpl_popover_sort_order',

                    columns: [
                        {
                            label: 'Name',
                            key: 'name',
                        },
                        {
                            label: 'Vintage',
                            key: 'vintage_year',
                        },
                        {
                            label: 'Fund Size',
                            key: 'target_size_usd',
                        },
                        {
                            label: 'IRR',
                            key: 'irr',
                        },
                        {
                            label: 'TVPI',
                            key: 'multiple',
                        },
                        {
                            label: 'RVPI',
                            key: 'rvpi',
                        },
                        {
                            label: 'DPI',
                            key: 'dpi',
                        },
                        {
                            label: 'As of Date',
                            key: 'as_of_date',
                        },
                    ],
                },
            },
            {
                id: 'results_per_page',
                component: NewPopoverButton,
                label: 'Results per page',
                label_track_selection: true,
                hide_icon: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Results per page',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                disabled_callback: popover => popover.empty(),
                popover_config: {
                    id: 'results_per_page_popover',
                    component: Radiolist,
                    strings: {
                        no_selection: 'All',
                        empty: 'All',
                    },
                    datasource: {
                        type: 'observer',
                        event_type: events.get('side_by_side_available_results_per_page'),
                    },
                },
            },
            {
                id: 'lists_filter',
                component: NewPopoverButton,
                label: 'Lists',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Lists',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
                visible: false,
                visible_event: events.get('side_by_side_show_lists'),
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PME
     *******************************************************************/

    cpanel_confs.pme = {
        id: 'pme:benchmark',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                ...protected_revision_body(),
                'horizon',
                'render_currency',
                ...post_date_navs_button,
                'pme_index',
                ...filter_body,
            ],
        },
        components: [
            horizon_conf(),
            pme_index_conf(get_horizon_event('pme:benchmark')),
            render_currency_conf(get_horizon_event('pme:benchmark')),
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PEER
     Includes fund filter configs
     *******************************************************************/

    const peer_funds_visible = ko.observable(true);

    cpanel_confs.peer = {
        id: 'peer:benchmark',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                'render_currency',
                ...post_date_navs_button,
                'benchmark_settings_label',
                'chart_provider',
                'benchmark',
                'benchmark_currency',
                'view_toggle',
                'advanced_filters',
                'fund_filters',
                'cf_filters',
            ],
        },
        components: [
            {
                id: 'view_toggle',
                component: RadioButtons,
                template: 'tpl_cpanel_radio_toggle',
                default_state: 'default',
                visible: peer_funds_visible,
                reset_event: reset_event,
                buttons: [
                    {
                        label: 'View Summary',
                        state: 'default',
                    },
                    {
                        label: 'View Funds',
                        state: 'data',
                    },
                ],
            },
            {
                id: 'advanced_filters_popover_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Data Set',
            },
            {
                id: 'use_benchmark_data',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: true,
                reset_event: reset_event,
                label: 'Market Data',
            },
            {
                id: 'portfolios',
                component: NewPopoverButton,
                label: 'Portfolios',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Include Portfolios',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    empty_text: 'You have no portfolios',
                    reset_event: reset_event,
                    datasource: {
                        type: 'dynamic',
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'portfolio_uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'vehicles',
                            results_per_page: 'all',
                            filters: {
                                entity_type: 'portfolio',
                                cashflow_type: 'net',
                            },
                        },
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_filters',
                template: 'tpl_header_with_advanced',
                label: 'filters',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: [
                            'advanced_filters_popover_label',
                            'use_benchmark_data',
                            'portfolios',
                        ],
                    },
                },
            },
            render_currency_conf(),
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - POINT IN TIME // TIME-WEIGHTED RETURN
     *******************************************************************/

    cpanel_confs.point_in_time = {
        id: 'point_in_time',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                ...protected_revision_body(),
                'horizon',
                'render_currency',
                ...filter_body,
            ],
        },
        components: [horizon_conf(true), render_currency_conf(get_horizon_event('point_in_time'))],
    };

    /********************************************************************
     * CPANEL CONFIG - VALUE CHANGE
     *******************************************************************/

    cpanel_confs.value_change = {
        id: 'value_change',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                ...protected_revision_body(),
                'horizon',
                'render_currency',
                'post_date_navs',
                'time_interval',
                'split_by_cfs',
                ...filter_body,
            ],
        },
        components: [
            // axp t105 cpanel_confs.value_change.components horizon_conf render_currency_conf get_horizon_event (info)
            horizon_conf(),
            render_currency_conf(get_horizon_event('value_change')),
            {
                id: 'time_interval',
                component: NewPopoverButton,
                label: 'Time Interval',
                label_track_selection: true,
                ellipsis: true,
                hide_icon: true,
                clear_event: reset_event,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Select Time Interval',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'Annual', value: 'annual'},
                            {label: 'Quarterly', value: 'quarterly'},
                            {label: 'Monthly', value: 'monthly'},
                        ],
                    },
                    selected_idx: 1,
                },
            },
            {
                id: 'split_by_cfs',
                id_callback: events.register_alias('value_change:split_by_cfs'),
                component: BooleanButton,
                label: 'Group by Cashflow Type',
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: reset_event,
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PORTFOLIO FUNDS / ALLOCATIONS
     *******************************************************************/

    cpanel_confs.portfolio_funds = {
        id: 'portfolio_funds',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                ...protected_revision_body(),
                'horizon',
                'render_currency',
                ...post_date_navs_button,
                'group',
                'results_per_page',
                'bubble_control',
                ...filter_body,
            ],
        },
        components: [
            horizon_conf(),
            {
                id: 'group',
                component: NewPopoverButton,
                label: 'Grouping',
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-cpanel multi-icon-list',
                },
                popover_config: {
                    component: TieredChecklist,
                    single_selection: true,
                    max_tier: 2,
                    value_key: 'breakdown_key',
                    label_key: 'label',
                    option_disabled_key: 'disabled',
                    datasource: {
                        type: 'dynamic',
                        mapping: 'build_tiered_checklist_tree',
                        mapping_args: {
                            label_key: 'label',
                            value_key: 'breakdown_key',
                            additional_keys: ['is_custom', 'disabled'],
                        },
                        one_required: ['portfolio_uid', 'market_data_family_uid'],
                        query: {
                            target: 'vehicle:breakdown_options',
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                            disable_unused: true,
                            include_cashflow_options: true,
                        },
                    },
                },
            },
            {
                id: 'results_per_page',
                component: NewPopoverButton,
                label: 'Results per page',
                track_selection_property: 'selected_string',
                css: {
                    'btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
                popover_options: {
                    title: 'Results per page',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                disabled_callback: popover => popover.empty(),
                popover_config: {
                    id: 'results_per_page_popover',
                    component: Radiolist,
                    strings: {
                        no_selection: 'All',
                        empty: 'All',
                    },
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'DataTable.results_per_page',
                            self.get_id(),
                            'body',
                            'portfolio_funds',
                            'table',
                        ),
                    },
                },
            },
            {
                id: 'bubble_control',
                label: 'Bubble Control',
                component: NewPopoverButton,
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Bubble Size Metric',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    id: 'bubble_control_popover',
                    component: Checklist,
                    initial_selected_value: 'paid_in',
                    single_selection: true,
                    data: self.base_allocations_columns,
                },
                visible_callback: () => bubble_control_visible(),
            },
            render_currency_conf(get_horizon_event('portfolio_funds')),
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PORTFOLIO VALUE DRIVERS
     *******************************************************************/

    cpanel_confs.portfolio_value_drivers = {
        id: 'portfolio_value_drivers',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                'horizon',
                'render_currency',
                ...post_date_navs_button,
                'group',
                'results_per_page',
                ...filter_body,
            ],
        },
        components: [
            horizon_conf(),
            render_currency_conf(get_horizon_event('portfolio_value_drivers')),
            {
                id: 'group',
                component: NewPopoverButton,
                label: 'Grouping',
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-cpanel multi-icon-list',
                },
                popover_config: {
                    component: TieredChecklist,
                    single_selection: true,
                    option_disabled_key: 'disabled',
                    value_key: 'breakdown_key',
                    label_key: 'label',
                    title: 'Grouping',
                    datasource: {
                        type: 'dynamic',
                        mapping: 'build_tiered_checklist_tree',
                        mapping_args: {
                            label_key: 'label',
                            value_key: 'breakdown_key',
                            additional_keys: ['is_custom', 'disabled'],
                        },
                        one_required: ['portfolio_uid', 'market_data_family_uid'],
                        query: {
                            target: 'vehicle:breakdown_options',
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                            disable_unused: true,
                            include_cashflow_options: true,
                        },
                    },
                },
            },
            {
                id: 'results_per_page',
                component: NewPopoverButton,
                label: 'Results per page',
                track_selection_property: 'selected_string',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Results per page',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                disabled_callback: popover => popover.empty(),
                popover_config: {
                    id: 'results_per_page_popover',
                    component: Radiolist,
                    strings: {
                        no_selection: 'All',
                        empty: 'All',
                    },
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'DataTable.results_per_page',
                            self.get_id(),
                            'body',
                            'portfolio_value_drivers',
                            'portfolio_components',
                        ),
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - HORIZON MODEL
     *******************************************************************/

    cpanel_confs.horizon_model = {
        id: 'horizon_model',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                'use_known_cashflows',
                'render_currency',
                ...post_date_navs_button,
                'time_interval',
                'scenario',
                'future_commitments',
                'future_commitment_plans',
                'grouping',
                'results_per_page',
                ...filter_body,
            ],
        },
        components: [
            render_currency_conf(),
            {
                id: 'time_interval',
                component: NewPopoverButton,
                label: 'Time Interval',
                label_track_selection: true,
                ellipsis: true,
                hide_icon: true,
                clear_event: reset_event,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Select Time Interval',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'Annual', value: 'annual'},
                            {label: 'Quarterly', value: 'quarterly'},
                        ],
                    },
                    selected_idx: 0,
                },
            },
            {
                id: 'use_known_cashflows',
                component: BooleanButton,
                default_state: false,
                template: 'tpl_cpanel_boolean_button',
                label: 'Include Known Cash Flows',
            },
            {
                id: 'scenario',
                component: NewPopoverButton,
                label: 'Scenario',
                label_track_selection: true,
                ellipsis: true,
                hide_icon: true,
                clear_event: reset_event,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Select Scenario',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        mapping: 'list_to_options',
                        data: [
                            'Market Average',
                            'Growth',
                            'Sharp Growth',
                            'Decline',
                            'Sharp Decline',
                        ],
                    },
                    selected_idx: 0,
                },
            },
            {
                id: 'future_commitments',
                component: NewPopoverButton,
                label: 'Add Commitments',
                clear_event: reset_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-info',
                },
                popover_config: {
                    id: 'future_commitments_form',
                    component: FutureCommitmentsForm,
                    currency_event: get_currency_symbol_event('horizon_model'),
                    as_of_date_event: as_of_date_event,
                },
            },
            {
                id: 'future_commitment_plans',
                component: NewPopoverButton,
                label: 'Commitment Plans',
                css: {
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'commitment_plans_for_portfolio',
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: true,
                            },
                        },
                    },
                },
            },
            {
                id: 'grouping',
                component: NewPopoverButton,
                label: 'Grouping',
                label_track_selection: true,
                ellipsis: true,
                hide_icon: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Select Grouping',
                    css_class: 'popover-cpanel',
                    placement: 'right',
                },
                popover_config: {
                    id: 'grouping_body',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    style: {width: '275px'},
                    layout: {body: ['group', 'attribute']},
                    components: [
                        {
                            id: 'group',
                            component: NewPopoverButton,
                            label: 'Group by',
                            label_track_selection: true,
                            ellipsis: true,
                            hide_icon: true,
                            css: {
                                'btn-block': true,
                                'btn-cpanel-primary': true,
                                'btn-sm': true,
                            },
                            icon_css: 'glyphicon glyphicon-plus',
                            popover_options: {
                                title: 'Select Grouping',
                                css_class: 'popover-cpanel',
                                placement: 'right',
                            },
                            popover_config: {
                                component: TieredChecklist,
                                single_selection: true,
                                max_tier: 2,
                                option_disabled_key: 'disabled',
                                value_key: 'breakdown_key',
                                label_key: 'label',
                                datasource: {
                                    type: 'dynamic',
                                    mapping: 'build_tiered_checklist_tree',
                                    mapping_args: {
                                        label_key: 'label',
                                        value_key: 'breakdown_key',
                                        additional_keys: ['is_custom', 'disabled'],
                                    },
                                    one_required: ['portfolio_uid', 'market_data_family_uid'],
                                    query: {
                                        target: 'vehicle:breakdown_options',
                                        portfolio_uid: {
                                            type: 'observer',
                                            event_type: portfolio_uid_event,
                                        },
                                        market_data_family_uid: {
                                            type: 'observer',
                                            event_type: market_data_family_uid_event,
                                        },
                                        disable_unused: true,
                                        disable_gics_levels: true,
                                        parent_members_only: true,
                                    },
                                },
                            },
                        },
                        {
                            id: 'attribute',
                            component: NewPopoverButton,
                            label: 'Table Attribute',
                            visible_event: horizon_model_group_event,
                            label_track_selection: true,
                            ellipsis: true,
                            hide_icon: true,
                            css: {
                                'btn-block': true,
                                'btn-cpanel-primary': true,
                                'btn-sm': true,
                            },
                            icon_css: 'glyphicon glyphicon-plus',
                            popover_options: {
                                title: 'Select Attribute',
                                css_class: 'popover-cpanel',
                                placement: 'right',
                            },
                            disabled: ko.pureComputed(
                                () => !Utils.is_set(horizon_model_group(), true),
                            ),
                            popover_config: {
                                component: Radiolist,
                                datasource: {
                                    type: 'static',
                                    data: [
                                        {value: 'nav', label: 'NAVs'},
                                        {value: 'net_cashflow', label: 'Net Cash Flows'},
                                        {
                                            value: 'running_net_cashflow',
                                            label: 'Cumulative Net Cash Flows',
                                        },
                                        {value: 'unfunded', label: 'Unfunded'},
                                        {value: 'irr', label: 'IRR'},
                                        {value: 'tvpi', label: 'TVPI'},
                                        {value: 'dpi', label: 'DPI'},
                                        {value: 'rvpi', label: 'RVPI'},
                                        {value: 'dist', label: 'Distributions'},
                                        {value: 'cont', label: 'Contributions'},
                                    ],
                                },
                                strings: {
                                    clear: 'Reset',
                                },
                            },
                        },
                    ],
                },
            },
            {
                id: 'results_per_page',
                component: NewPopoverButton,
                label: 'Results per page',
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Results per page',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                disabled_callback: popover => popover.empty(),
                popover_config: {
                    id: 'results_per_page_popover',
                    component: Radiolist,
                    strings: {
                        no_selection: 'All',
                        empty: 'All',
                    },
                    datasource: {
                        type: 'static',
                        data: [
                            {label: '10', value: 10},
                            {label: 'All', value: 'all'},
                        ],
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PME PROGRESSION
     *******************************************************************/

    cpanel_confs.pme_progression = {
        id: 'pme:progression',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                ...protected_revision_body(),
                'render_currency',
                ...post_date_navs_button,
                'pme_progression_indexes',
                ...filter_body,
            ],
        },
        components: [
            render_currency_conf(),
            {
                id: 'pme_progression_indexes',
                component: NewPopoverButton,
                label: 'Indexes',
                label_track_selection: true,
                clear_event: reset_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Indexes',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    value_key: 'value',
                    label_key: 'label',
                    sub_label_key: 'sub_label',
                    option_disabled_key: 'invalid',
                    enable_filter: true,
                    filter_value_keys: ['parent', 'sub_label', 'label'],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:index_options',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                                required: market_data_family_uid_required,
                            },
                            max_date: {
                                type: 'observer',
                                event_type: as_of_date_event,
                                mapping: 'get_value',
                                required: true,
                            },
                        },
                    },
                    selected_datasource: {
                        key: 'market_id',
                        type: 'dynamic',
                        mapping_default: current_market_id(), //100101, // axp t105 todo verify correct id
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                        },
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - PEER PROGRESSION
     *******************************************************************/

    cpanel_confs.peer_progression = {
        id: 'peer:progression',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'advanced_settings',
                'as_of_date',
                'metric',
                'advanced_filters',
                'fund_filters',
                'cf_filters',
            ],
        },
        components: [
            render_currency_conf(),
            {
                id: 'lists',
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                label: 'Lists',
                icon_css: 'glyphicon glyphicon-plus',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Filter by list',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
            },
            {
                id: 'peer_progression_horizon',
                component: NewPopoverButton,
                label: 'Horizon',
                label_track_selection: true,
                enable_localstorage: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Horizon',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    default_selected_index: 5,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: '1 year', value: 1},
                            {label: '2 years', value: 2},
                            {label: '3 years', value: 3},
                            {label: '5 years', value: 5},
                            {label: '10 years', value: 10},
                            {label: 'Since Inception', value: null},
                        ],
                    },
                },
            },
            {
                id: 'metric',
                component: NewPopoverButton,
                label: 'Metric',
                enable_localstorage: true,
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Metric',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'IRR', value: 'irr'},
                            {label: 'TVPI', value: 'tvpi'},
                            {label: 'DPI', value: 'dpi'},
                            {label: 'RVPI', value: 'rvpi'},
                            {label: 'Cash Flows', value: 'net_cashflows'},
                            {label: 'Scaled Cash Flows', value: 'scaled_net_cashflows'},
                        ],
                    },
                },
            },
            {
                id: 'range_method',
                component: NewPopoverButton,
                label: 'Range Method',
                enable_localstorage: true,
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Range Method',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    default_selected_index: 1,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'Extremities', value: 'extremities'},
                            {label: 'Quartiles', value: 'quartiles'},
                        ],
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_settings',
                template: 'tpl_header_with_advanced',
                label: 'Settings',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: [
                            'render_currency',
                            ...post_date_navs_button,
                            'peer_progression_horizon',
                            'range_method',
                        ],
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_filters',
                template: 'tpl_header_with_advanced',
                label: 'filters',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: ['lists'],
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - Time Weighted Breakdown
     *******************************************************************/

    cpanel_confs.time_weighted_breakdown = {
        id: 'time_weighted_breakdown',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'as_of_date',
                'render_currency',
                ...post_date_navs_button,
                'time_weighted_breakdown_horizons',
                'cf_filters',
            ],
        },
        components: [
            render_currency_conf(),
            {
                id: 'time_weighted_breakdown_horizons',
                component: NewPopoverButton,
                label: 'Horizons',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Horizons',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                label: '1 Year',
                                value: 1,
                            },
                            {
                                label: '2 Years',
                                value: 2,
                            },
                            {
                                label: '3 Years',
                                value: 3,
                            },
                            {
                                label: '4 Years',
                                value: 4,
                            },
                            {
                                label: '5 Years',
                                value: 5,
                            },
                            {
                                label: '10 Years',
                                value: 10,
                            },
                        ],
                    },
                    selected_datasource: {
                        type: 'static',
                        data: [1, 3, 5],
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - Time Weighted Comparison
     *******************************************************************/

    cpanel_confs.time_weighted_comparison = {
        id: 'time_weighted_comparison',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'advanced_settings',
                'as_of_date',
                'time_weighted_comparison_indexes',
                'include_busmi',
                'include_peer_set',
                'advanced_filters',
                'fund_filters',
                'cf_filters',
            ],
        },
        components: [
            render_currency_conf(),
            {
                id: 'include_busmi',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: true,
                reset_event: reset_event,
                label: 'Include BUSMI',
            },
            {
                id: 'include_peer_set',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: true,
                reset_event: reset_event,
                label: 'Include Peer Set',
            },
            {
                id: 'time_weighted_comparison_indexes',
                component: NewPopoverButton,
                clear_event: reset_event,
                label: 'Indexes',
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Select Indexes',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:index_options',
                        },
                    },
                    selected_datasource: {
                        key: 'market_id',
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                            },
                        },
                    },
                },
            },
            {
                id: 'lists',
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                label: 'Lists',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Filter by Lists',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
            },
            {
                id: 'time_weighted_comparison_horizons',
                component: NewPopoverButton,
                label: 'Horizons',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Horizons',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                label: '1 Year',
                                value: 1,
                            },
                            {
                                label: '2 Years',
                                value: 2,
                            },
                            {
                                label: '3 Years',
                                value: 3,
                            },
                            {
                                label: '4 Years',
                                value: 4,
                            },
                            {
                                label: '5 Years',
                                value: 5,
                            },
                            {
                                label: '10 Years',
                                value: 10,
                            },
                        ],
                    },
                    selected_datasource: {
                        type: 'static',
                        data: [1, 3, 5],
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_settings',
                template: 'tpl_header_with_advanced',
                label: 'Settings',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: [
                            'render_currency',
                            ...post_date_navs_button,
                            'time_weighted_comparison_horizons',
                        ],
                    },
                    components: [],
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_filters',
                template: 'tpl_header_with_advanced',
                label: 'Peer Filters',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: ['lists'],
                    },
                },
            },
        ],
    };

    /********************************************************************
     * CPANEL CONFIG - QUARTILE PROGRESSION
     *******************************************************************/

    cpanel_confs.quartile_progression = {
        id: 'quartile_progression',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'advanced_settings',
                'as_of_date',
                'horizon_years',
                'advanced_filters',
                'fund_filters',
                'cf_filters',
            ],
        },
        components: [
            {
                id: 'use_cashflow_data',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: reset_event,
                label: 'Use Cash Flow Data',
            },
            {
                id: 'metrics',
                component: NewPopoverButton,
                label: 'Metrics',
                enable_localstorage: true,
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Metrics',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'IRR', value: 'irr'},
                            {label: 'TVPI', value: 'tvpi'},
                            {label: 'DPI', value: 'dpi'},
                            {label: 'RVPI', value: 'rvpi'},
                        ],
                    },
                    selected_datasource: {
                        type: 'static',
                        data: ['irr', 'tvpi', 'dpi'],
                    },
                },
            },
            {
                id: 'quartile_progression_currency',
                component: NewPopoverButton,
                label: 'Currency',
                label_track_selection: true,
                ellipsis: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Currency',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    ellipsis: true,
                    datasource: {
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'id',
                            label_keys: ['symbol', 'name'],
                            additional_keys: ['symbol'],
                            extra_options: [{value: null, label: 'Unadjusted'}],
                        },
                        type: 'dynamic',
                        query: {
                            target: 'currency:markets',
                        },
                    },
                    selected_datasource: {
                        key: 'base_currency',
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:currency_id',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                                required: market_data_family_uid_required,
                            },
                        },
                    },
                },
            },
            {
                id: 'horizon_years',
                label: 'Horizon',
                component: NewPopoverButton,
                clear_event: reset_event,
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Horizon',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    options: [
                        {label: '1 Year', value: 1},
                        {label: '3 Years', value: 3},
                        {label: '5 Years', value: 5},
                    ],
                },
            },
            {
                id: 'lists',
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'fund_filters',
                    'clear_button',
                ),
                label: 'Lists',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Filter by Lists',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_settings',
                template: 'tpl_header_with_advanced',
                label: 'Settings',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: [
                            'quartile_progression_currency',
                            ...post_date_navs_button,
                            'metrics',
                            'use_cashflow_data',
                        ],
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'advanced_filters',
                template: 'tpl_header_with_advanced',
                label: 'peer filters',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: ['lists'],
                    },
                },
            },
        ],
    };

    /********************************************************************
     * BODY CONFIGS
     Configs for each mode. Configured here to enable dynamic
     setup based on entity type.
     *******************************************************************/

    const body_confs = {};

    /********************************************************************
     * BODY CONFIG - OVERVIEW
     *******************************************************************/

    body_confs.overview = {
        id: 'overview',
        component: AnalyticsNetOverview,
        set_mode_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'overview',
            'view_toggle',
        ),
        register_export_event: !in_market_data && register_export_event,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        start_loading: true,
        entity_type: entity_type,
        user_fund_uid_required: user_fund_uid_required,
        market_data_fund_uid_required: market_data_fund_uid_required,
        portfolio_uid_required: portfolio_uid_required,
        market_data_family_uid_required: market_data_family_uid_required,
        user_fund_uid_event: user_fund_uid_event,
        market_data_fund_uid_event: market_data_fund_uid_event,
        portfolio_uid_event: portfolio_uid_event,
        market_data_family_uid_event: market_data_family_uid_event,
        cashflow_table_datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:cashflows',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                    required: portfolio_uid_required,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                    required: market_data_family_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('overview'),
                    required: true,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
        datasource: {
            type: 'dynamic',
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
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('overview'),
                    required: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                    required: market_data_fund_uid_required,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                    required: portfolio_uid_required,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                    required: market_data_family_uid_required,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                calculation_mapping: {
                    type: 'dynamic',
                    query: {
                        irr: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('irr_calculation_mapping'),
                        },
                        paid_in: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('paid_in_calculation_mapping'),
                        },
                        nav: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('nav_calculation_mapping'),
                        },
                    },
                },
                quarterly_cashflows: {
                    type: 'observer',
                    event_type: events.get('quarterly_cashflows_bool'),
                },
                ...protected_revision_query(),
            },
        },
        metrics_datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:metrics_progression',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                    required: market_data_fund_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('overview'),
                    required: true,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                metrics: ['irr', 'rvpi', 'tvpi', 'dpi'],
                date_multiplier: 1000,
                calculation_mapping: {
                    type: 'dynamic',
                    query: {
                        irr: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('irr_calculation_mapping'),
                        },
                        distributed: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('distributed_calculation_mapping'),
                        },
                        paid_in: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('paid_in_calculation_mapping'),
                        },
                        nav: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: events.get('nav_calculation_mapping'),
                        },
                    },
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - BENCHMARK
     *******************************************************************/

    body_confs.net_benchmark = {
        id: 'net_benchmark',
        component: NetBenchmark,
        register_export_event: !in_market_data && register_export_event,
        entity_type: entity_type,
        metric_filter_event: metric_filter_event,
        auto_get_data: false,
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'net_benchmark',
            'results_per_page',
        ),
        datasource: {
            type: 'dynamic',
            query: {
                target: 'market_data:comp_fund_benchmark',
                filters: {
                    type: 'dynamic',
                    one_required: ['portfolio_uid', 'market_data_family_uid'],
                    query: {
                        as_of_date: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: as_of_date_event,
                            required: true,
                        },
                        benchmark_edition: {
                            type: 'observer',
                            event_type: benchmark_edition_event,
                            required: true,
                        },
                        benchmark_currency: {
                            type: 'observer',
                            event_type: benchmark_currency_event,
                            required: true,
                        },
                        vintage_year_range: {
                            type: 'observer',
                            event_type: vintage_year_range_event,
                        },
                        vehicle_currency: {
                            type: 'observer',
                            event_type: vehicle_currency_event,
                            required: true,
                        },
                        portfolio_uid: {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                        },
                        list_uids: {
                            type: 'observer',
                            default: [],
                            mapping: 'get_values',
                            event_type: list_uid_event,
                        },
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                        },
                        comp_fund_include: {
                            type: 'observer',
                            event_type: comp_fund_include_event,
                        },
                        post_date_navs: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'BooleanButton.state',
                                self.get_id(),
                                'post_date_navs',
                            ),
                        },
                        benchmark_provider: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'chart_provider',
                            ),
                        },
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.get_id(),
                                'benchmark_fund_filters',
                                'enum_attributes',
                            ),
                        },
                        attributes: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.get_id(),
                                'benchmark_fund_filters',
                                'fund_custom_attributes',
                                'attributes_filter',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'benchmark_fund_filters',
                                'fund_size',
                            ),
                        },
                    },
                },
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - PME
     *******************************************************************/

    // axp t105 body_confs.pme = {... (as_of_date_event, horizon_event, query items) (info)
    body_confs.pme = {
        id: 'pme:benchmark',
        component: AnalyticsPME,
        dependencies: [Utils.gen_id(self.get_id(), 'as_of_date')],
        register_export_event: !in_market_data && register_export_event,
        as_of_date_event: as_of_date_event,
        horizon_event: get_horizon_event('pme:benchmark'),
        auto_get_data: false,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:pme',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                start_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_horizon_event('pme:benchmark'),
                    required: true,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                    required: market_data_fund_uid_required,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                    required: portfolio_uid_required,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                    required: market_data_family_uid_required,
                },
                market_id: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_pme_index_event('pme:benchmark'),
                    required: true,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('pme:benchmark'),
                    required: true,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
        multi_pme: {
            active_event: Utils.gen_event(
                'BooleanButton.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'pme:benchmark',
                'multi_pme_active',
            ),
            settings_event: Utils.gen_event(
                'EventButton',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'pme:benchmark',
                'multi_pme_settings',
            ),
            datasource: {
                type: 'dynamic',
                one_required: ['portfolio_uid', 'market_data_family_uid'],
                query: {
                    target: 'sub_vehicle_options',
                    entity_type: entity_type,
                    portfolio_uid: {
                        type: 'observer',
                        event_type: portfolio_uid_event,
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                    },
                    sub_entity_types: ['user_fund', 'market_data_fund'],
                },
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - SIDE BY SIDE
     *******************************************************************/

    body_confs.side_by_side = {
        id: 'side_by_side',
        component: AnalyticsSideBySide,
        register_export_event: !in_market_data && register_export_event,
        as_of_date_event,
        user_fund_uid_event,
        market_data_fund_uid_event,
        show_currency_event: events.get('side_by_side_show_currency'),
        show_lists_event: events.get('side_by_side_show_lists'),
        currency_event: get_currency_symbol_event('side_by_side'),
        available_results_per_page_event: events.get('side_by_side_available_results_per_page'),
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'side_by_side',
            'results_per_page',
        ),
        has_cashflows_event: Utils.gen_event(
            'BooleanButton.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'side_by_side',
            'has_cashflows',
        ),
        sort_order_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'side_by_side',
            'sort_order',
        ),
        post_date_navs_event: Utils.gen_event(
            'BooleanButton.state',
            self.get_id(),
            'post_date_navs',
        ),
        enums_event: Utils.gen_event(
            'AttributeFilters.state',
            self.get_id(),
            'fund_filters',
            'enum_attributes',
        ),
        vintage_year_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'fund_filters',
            'vintage_year',
        ),
        fund_size_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'fund_filters',
            'fund_size',
        ),
        lists_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'side_by_side',
            'lists_filter',
        ),
        cf_filters: {
            type: 'dynamic',
            query: filter_query,
        },
    };

    // axp t105
    body_confs.value_change = {
        id: 'value_change',
        component: ValueChange,
        register_export_event: !in_market_data && register_export_event,
        entity_type: entity_type,
        entity_uid: entity_uid_event,
        as_of_date: Observer.map(as_of_date_event, 'get_value'),
        time_interval: Observer.map(get_time_interval_event('value_change'), 'get_value'),
        currency: get_currency_symbol_event('value_change'),
        horizon_date: Observer.map(get_horizon_event('value_change'), 'get_value'),
        split_by_cfs_event: events.get('value_change:split_by_cfs'),
        filter_query: filter_query,
        post_date_navs_event: Utils.gen_event(
            'BooleanButton.state',
            self.get_id(),
            'post_date_navs',
        ),
        auto_get_data: false,
    };

    /********************************************************************
     * BODY CONFIG - PEER
     *******************************************************************/

    body_confs.peer = {
        id: 'peer:benchmark',
        set_mode_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'peer:benchmark',
            'view_toggle',
        ),
        register_export_event: !in_market_data && register_export_event,
        component: AnalyticsPeer,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        auto_get_data: false,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'peer_benchmark',
                benchmark_edition_uid: {
                    type: 'observer',
                    mapping: 'get',
                    event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'benchmark'),
                    required: true,
                },
                currency_id: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.get_id(),
                        'benchmark_currency',
                    ),
                },
                filters: {
                    type: 'dynamic',
                    query: {
                        as_of_date: {
                            type: 'observer',
                            event_type: as_of_date_event,
                            required: true,
                        },
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.get_id(),
                                'fund_filters',
                                'enum_attributes',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'fund_filters',
                                'vintage_year',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'fund_filters',
                                'fund_size',
                            ),
                        },
                        exclude_fund_uid: {
                            type: 'observer',
                            event_type: entity_uid_event,
                        },
                    },
                },
                use_benchmark_data: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'peer:benchmark',
                        'use_benchmark_data',
                    ),
                    default: true,
                },
                portfolio_uids: {
                    type: 'observer',
                    mapping: 'get_values',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'peer:benchmark',
                        'portfolios',
                    ),
                },
                ...protected_revision_query(),
            },
        },
        compset: {
            comps: [
                {
                    color: '#61C38C',
                    mapping: 'vehicle_to_benchmark_item',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:overview',
                            as_of_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: as_of_date_event,
                                required: true,
                            },
                            render_currency: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: get_render_currency_event('peer:benchmark'),
                                required: true,
                            },
                            post_date_navs: {
                                type: 'observer',
                                event_type: Utils.gen_event(
                                    'BooleanButton.state',
                                    self.get_id(),
                                    'post_date_navs',
                                ),
                                default: true,
                            },
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                                required: market_data_fund_uid_required,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                                required: portfolio_uid_required,
                            },
                            filters: {
                                type: 'dynamic',
                                query: filter_query,
                            },
                        },
                    },
                },
            ],
        },
    };

    /********************************************************************
     * BODY CONFIG - POINT IN TIME // TIME-WEIGHTED RETURN
     *******************************************************************/

    body_confs.point_in_time = {
        id: 'point_in_time',
        component: AnalyticsPointInTime,
        register_export_event: !in_market_data && register_export_event,
        set_mode_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'point_in_time',
            'view_toggle',
        ),
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        auto_get_data: false,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:time_weighted',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                start_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_horizon_event('point_in_time'),
                    required: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: market_data_fund_uid_event,
                    required: market_data_fund_uid_required,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                    required: portfolio_uid_required,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                    required: market_data_family_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('point_in_time'),
                    required: true,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - PORTFOLIO FUNDS / ALLOCATIONS
     *******************************************************************/

    body_confs.portfolio_funds = {
        id: 'portfolio_funds',
        component: AnalyticsPortfolioFunds,
        register_export_event: !in_market_data && register_export_event,
        bubble_metric_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_funds',
            'bubble_control',
        ),
        base_metrics: self.base_allocations_columns,
        breakdown_key_event: Utils.gen_event(
            'PopoverButton.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_funds',
            'group',
        ),
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_funds',
            'results_per_page',
        ),
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        portfolio_uid_event: portfolio_uid_event,
        market_data_family_uid_event: market_data_family_uid_event,
        auto_get_data: false,
        datasource: {
            type: 'dynamic',
            one_required: ['portfolio_uid', 'market_data_family_uid'],
            query: {
                target: 'vehicle:breakdown',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                start_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_horizon_event('portfolio_funds'),
                    required: true,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                },
                market_data_family_uid: {
                    type: 'observer',
                    event_type: market_data_family_uid_event,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('portfolio_funds'),
                    required: true,
                },
                breakdown_key: {
                    mapping: 'get_tiered_breakdown_key',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.state',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'portfolio_funds',
                        'group',
                    ),
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - PORTFOLIO VALUE DRIVERS
     *******************************************************************/

    body_confs.portfolio_value_drivers = {
        id: 'portfolio_value_drivers',
        component: PortfolioValueDrivers,
        set_mode_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_value_drivers',
            'view_toggle',
        ),
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_value_drivers',
            'results_per_page',
        ),
        breakdown_key_event: Utils.gen_event(
            'PopoverButton.state',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'portfolio_value_drivers',
            'group',
        ),
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        portfolio_uid_event: portfolio_uid_event,
        auto_get_data: false,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:portfolio_value_drivers',
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                    required: true,
                },
                start_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_horizon_event('portfolio_value_drivers'),
                    required: true,
                },
                portfolio_uid: {
                    type: 'observer',
                    event_type: portfolio_uid_event,
                    required: true,
                },
                breakdown_key: {
                    mapping: 'get_tiered_breakdown_key',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.state',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'portfolio_value_drivers',
                        'group',
                    ),
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('portfolio_value_drivers'),
                    required: true,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
                ...protected_revision_query(),
            },
        },
    };

    /********************************************************************
     * BODY CONFIG - HORIZON MODEL
     *******************************************************************/

    // axp t105 body_confs.horizon_model = { (info)
    body_confs.horizon_model = {
        id: 'horizon_model',
        component: HorizonModel,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        portfolio_uid_event: portfolio_uid_event,
        reset_event: reset_event, // axp t105 (!)
        time_interval_event: Observer.map(get_time_interval_event('horizon_model'), 'get_value'),
        register_export_event: !in_market_data && register_export_event,
        attribute_event: horizon_model_attribute_event,
        group_event: horizon_model_group_event,
        currency_event: get_currency_symbol_event('horizon_model'),
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'horizon_model',
            'results_per_page',
        ),
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            use_known_cashflows: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.state',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'horizon_model',
                    'use_known_cashflows',
                ),
                default: false,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            future_commitments: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.state',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'horizon_model',
                    'future_commitments',
                ),
                required: true,
                default: [],
            },
            future_commitment_uids: {
                mapping: 'get_values',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'horizon_model',
                    'future_commitment_plans',
                ),
                required: true,
                default: [],
            },
            scenario: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'horizon_model',
                    'scenario',
                ),
                mapping: 'get_value',
                required: true,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: get_render_currency_event('horizon_model'),
                required: true,
            },
        },
        filters: {
            type: 'dynamic',
            query: filter_query,
        },
    };

    body_confs.pme_progression = {
        id: 'pme:progression',
        component: PMEProgression,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        reset_event: reset_event,
        register_export_event: register_export_event,
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            market_ids: {
                type: 'observer',
                mapping: 'get_values',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'pme:progression',
                    'pme_progression_indexes',
                ),
                required: true,
                default: [],
            },
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: get_render_currency_event('pme:progression'),
                required: true,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            filters: {
                type: 'dynamic',
                query: filter_query,
            },
            ...protected_revision_query(),
        },
    };

    body_confs.peer_progression = {
        id: 'peer:progression',
        component: PeerProgression,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        reset_event: reset_event,
        register_export_event: register_export_event,
        currency_event: get_currency_symbol_event('peer:progression'),
        metric_event: Observer.map(
            Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'peer:progression',
                'metric',
            ),
            'get_value',
        ),
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: get_render_currency_event('peer:progression'),
                required: true,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            horizon_years: {
                mapping: 'get_value',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'peer:progression',
                    'peer_progression_horizon',
                ),
                required: true,
            },
            range_method: {
                mapping: 'get_value',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'peer:progression',
                    'range_method',
                ),
                required: true,
            },
            metric: {
                mapping: 'get_value',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'peer:progression',
                    'metric',
                ),
                required: true,
            },
            return_fund_list: true,
            filters: {
                type: 'dynamic',
                query: filter_query,
            },
            peer_filters: {
                type: 'dynamic',
                query: {
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.get_id(),
                            'fund_filters',
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'vintage_year',
                        ),
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'fund_size',
                        ),
                    },
                    exclude_fund_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                    },
                    lists: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'peer:progression',
                            'lists',
                        ),
                    },
                },
            },
            ...protected_revision_query(),
        },
    };

    body_confs.time_weighted_breakdown = {
        id: 'time_weighted_breakdown',
        component: TimeWeightedBreakdown,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        reset_event: reset_event,
        register_export_event: register_export_event,
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: get_render_currency_event('time_weighted_breakdown'),
                required: true,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            horizon_years: {
                mapping: 'get_values',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'time_weighted_breakdown',
                    'time_weighted_breakdown_horizons',
                ),
                required: true,
            },
            filters: {
                type: 'dynamic',
                query: filter_query,
            },
        },
    };

    body_confs.time_weighted_comparison = {
        id: 'time_weighted_comparison',
        component: TimeWeightedComparison,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        reset_event: reset_event,
        register_export_event: register_export_event,
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: get_render_currency_event('time_weighted_comparison'),
                required: true,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            horizon_years: {
                mapping: 'get_values',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'time_weighted_comparison',
                    'time_weighted_comparison_horizons',
                ),
                required: true,
            },
            market_ids: {
                type: 'observer',
                mapping: 'get_values',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'time_weighted_comparison',
                    'time_weighted_comparison_indexes',
                ),
                required: true,
                default: [],
            },
            filters: {
                type: 'dynamic',
                query: filter_query,
            },
            peer_filters: {
                type: 'dynamic',
                query: {
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.get_id(),
                            'fund_filters',
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'vintage_year',
                        ),
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'fund_size',
                        ),
                    },
                    exclude_fund_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                    },
                    lists: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'time_weighted_comparison',
                            'lists',
                        ),
                    },
                },
            },
            include_peer_set: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.state',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'time_weighted_comparison',
                    'include_peer_set',
                ),
                default: true,
            },
            include_busmi: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.state',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'time_weighted_comparison',
                    'include_busmi',
                ),
                default: true,
            },
        },
    };

    body_confs.quartile_progression = {
        id: 'quartile_progression',
        component: QuartileProgression,
        dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
        reset_event: reset_event,
        register_export_event: register_export_event,
        auto_get_data: false,
        base_query: {
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: as_of_date_event,
                required: true,
            },
            horizon_years: {
                type: 'observer',
                mapping: 'get_value',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'quartile_progression',
                    'horizon_years',
                ),
                required: true,
            },
            user_fund_uid: {
                type: 'observer',
                event_type: user_fund_uid_event,
                required: user_fund_uid_required,
            },
            market_data_fund_uid: {
                type: 'observer',
                event_type: market_data_fund_uid_event,
                required: market_data_fund_uid_required,
            },
            portfolio_uid: {
                type: 'observer',
                event_type: portfolio_uid_event,
                required: portfolio_uid_required,
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'quartile_progression',
                    'quartile_progression_currency',
                ),
                required: true,
            },
            metrics: {
                mapping: 'get_values',
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'quartile_progression',
                    'metrics',
                ),
                required: true,
            },
            post_date_navs: {
                type: 'observer',
                event_type: Utils.gen_event('BooleanButton.state', self.get_id(), 'post_date_navs'),
                default: true,
            },
            use_cashflow_data: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.state',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'quartile_progression',
                    'use_cashflow_data',
                ),
                default: false,
            },
            filters: {
                type: 'dynamic',
                query: filter_query,
            },
            peer_filters: {
                type: 'dynamic',
                query: {
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.get_id(),
                            'fund_filters',
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'vintage_year',
                        ),
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'fund_filters',
                            'fund_size',
                        ),
                    },
                    exclude_fund_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                    },
                    lists: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'quartile_progression',
                            'lists',
                        ),
                    },
                },
            },
        },
    };

    /********************************************************************
     Here we assemble the full config for cpanel and body
     based on entity type
     *******************************************************************/

    let cpanel_components = [
        cpanel_confs.overview,
        cpanel_confs.pme,
        cpanel_confs.pme_progression,
        cpanel_confs.point_in_time,
        cpanel_confs.value_change,
    ];

    let body_components = [
        body_confs.overview,
        body_confs.pme,
        body_confs.pme_progression,
        body_confs.point_in_time,
        body_confs.value_change,
    ];

    if (entity_type == 'portfolio' || entity_type == 'market_data_family') {
        modes.push({
            label: 'Allocations',
            state: 'portfolio_funds',
        });
        if (!in_market_data) {
            modes.push({
                label: 'Value Drivers',
                state: 'portfolio_value_drivers',
            });
        }

        let idx = cpanel_confs.pme.layout.body.indexOf('pme_index');
        cpanel_confs.pme.layout.body.splice(idx, 0, 'multi_pme_active', 'multi_pme_settings');

        cpanel_confs.pme.components.push(
            {
                id: 'multi_pme_settings',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
                label: `<div style="padding:0px 10px">
                            <span class="pull-left">
                                Multi Index Settings
                            </span>
                            <i class="pull-right btn-icon icon-th-list"></i>
                        </span>`,
            },
            {
                id: 'multi_pme_active',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: reset_event,
                label: 'Multi Index',
            },
        );

        cpanel_components.push(cpanel_confs.portfolio_funds, cpanel_confs.portfolio_value_drivers);

        body_components.push(body_confs.portfolio_funds, body_confs.portfolio_value_drivers);

        if (hl_deployment) {
            if (!in_market_data) {
                modes.push({
                    label: 'Horizon Model',
                    state: 'horizon_model',
                });
                cpanel_components.push(cpanel_confs.horizon_model);
                body_components.push(body_confs.horizon_model);
            }

            modes.push({
                label: 'Benchmark Analysis',
                state: 'net_benchmark',
            });

            cpanel_components.push(cpanel_confs.net_benchmark);
            body_components.push(body_confs.net_benchmark);
        }
    } else {
        modes.push(
            {
                label: 'Peer Analysis',
                state: 'peer',
                menu: [
                    {
                        label: 'Benchmark',
                        state: 'peer:benchmark',
                    },
                    {
                        label: 'Progression',
                        state: 'peer:progression',
                    },
                ],
            },
            {
                label: 'Side by Side',
                state: 'side_by_side',
            },
        );

        cpanel_components.push(
            cpanel_confs.side_by_side,
            cpanel_confs.peer,
            cpanel_confs.peer_progression,
        );

        body_components.push(body_confs.side_by_side, body_confs.peer, body_confs.peer_progression);
    }

    if (auth.user_has_feature('experimental_feature_access')) {
        modes.push(
            {
                label: 'Time-Weighted Breakdown',
                state: 'time_weighted_breakdown',
            },
            {
                label: 'Time-Weighted Comparison',
                state: 'time_weighted_comparison',
            },
            {
                label: 'Quartile Progression',
                state: 'quartile_progression',
            },
        );

        cpanel_components.push(
            cpanel_confs.peer_progression,
            cpanel_confs.time_weighted_breakdown,
            cpanel_confs.time_weighted_comparison,
            cpanel_confs.quartile_progression,
        );
        body_components.push(
            body_confs.peer_progression,
            body_confs.time_weighted_breakdown,
            body_confs.time_weighted_comparison,
            body_confs.quartile_progression,
        );
    }

    /********************************************************************
     * Control panel aside == json config for Control Panel initialized
     as an aside (very simple container component)
     *******************************************************************/

    self.cpanel = new Aside(
        {
            title: 'My Portfolio',
            title_css: {'performance-calculator': true},
            parent_id: self.get_id(),
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: ['dynamic_wrapper'],
            },
            components: [
                {
                    id: 'mode_toggle',
                    component: NestedRadioButtons,
                    default_state: default_mode,
                    set_state_event: set_mode_event,
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    menues: modes,
                },
                {
                    id: 'dynamic_wrapper',
                    component: DynamicWrapper,
                    active_component: default_mode,
                    template: 'tpl_dynamic_wrapper',
                    set_active_event: set_mode_event,
                    components: cpanel_components,
                },
            ],
        },
        shared_components,
    );

    const breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: breadcrumbs,
    };

    /********************************************************************
     * Body Component. Initalized as a
     DynamicWrapper (container component) with a dynamic element.
     The DynamicWrapper has an active component that can be changed
     by calling toggle() or by an inbound event determined by
     'set_active_event'.
     *******************************************************************/

    self.body = self.new_instance(
        DynamicWrapper,
        {
            id: 'body',
            template: 'tpl_analytics_body',
            active_component: default_mode,
            set_active_event: set_mode_event,
            toggle_auto_get_data: true,
            toggle_auto_get_data_ids: body_components.map(c => c.id),
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                expandable_meta_data: 'expandable_meta_data',
                message_banner: 'message_banner',
            },
            components: [
                {
                    id: 'message_banner',
                    component: MessageBanner,
                    message:
                        'The Historical Data feature is currently in beta. If you have any issues contact support@cobaltlp.com.',
                    active: ko.pureComputed(() => {
                        return self.in_revision_mode() && self.revision_allowed();
                    }),
                    warning: true,
                },
                {
                    id: 'action_toolbar',
                    component: ActionHeader,
                    template: 'tpl_action_toolbar',
                    valid_export_features: ['analytics'],
                    buttons: [
                        DataManagerHelper.buttons.share({
                            check_permissions: true,
                        }),
                        DataManagerHelper.buttons.view_in_datamanager({
                            check_permissions: true,
                        }),
                        {
                            id: 'view_details',
                            label: 'Details',
                            action: 'view_details',
                            css: {'pull-left': true},
                        },
                        ...Utils.conditional_element(
                            [
                                {
                                    id: 'create_visual_report',
                                    component: ActionButtons,
                                    label:
                                        'Create Visual Report <span class="icon-doc-text"></span>',
                                    template: 'tpl_action_buttons_dropdown',
                                    css: {btn: true, 'btn-transparent-success': true},
                                    use_header_data: true,
                                    disabled_callback: () => {
                                        return entity_type === 'market_data_family';
                                    },
                                    buttons: [
                                        ...Utils.conditional_element(
                                            [
                                                {
                                                    label: 'Fund Screening Report',
                                                    component: ActionButton,
                                                    action: 'create_visual_report',
                                                    disabled_callback: data => !data.has_cashflows,
                                                    disabled_if_no_data: true,
                                                },
                                            ],
                                            entity_type === 'user_fund' ||
                                                entity_type === 'market_data_fund',
                                        ),
                                        ...Utils.conditional_element(
                                            [
                                                {
                                                    label: 'Portfolio Review Report',
                                                    component: ActionButton,
                                                    action: 'create_visual_report',
                                                    disabled_callback: data => !data.has_cashflows,
                                                    disabled_if_no_data: true,
                                                },
                                            ],
                                            entity_type === 'portfolio',
                                        ),
                                    ],
                                },
                            ],
                            hl_deployment,
                        ),
                    ],
                    datasource: gen_meta_data_datasource(),
                },
                {
                    component: BreadcrumbHeader,
                    id: 'header',
                    template: 'tpl_breadcrumb_header',
                    layout: {
                        breadcrumb: 'breadcrumb',
                    },
                    components: [breadcrumb],
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                            market_data_fund_uid: {
                                type: 'observer',
                                event_type: market_data_fund_uid_event,
                            },
                            portfolio_uid: {
                                type: 'observer',
                                event_type: portfolio_uid_event,
                            },
                            market_data_family_uid: {
                                type: 'observer',
                                event_type: market_data_family_uid_event,
                            },
                        },
                    },
                },
            ].concat(body_components),
        },
        shared_components,
    );

    /********************************************************************
     * The main 'analytics' vm assumes it's components to have
     'asides' or columns to render horizontally on the page.
     *******************************************************************/

    self.asides = [self.cpanel, self.body];

    Observer.register_for_id(
        Utils.gen_id(self.get_id(), 'chart_provider'),
        'PopoverButton.value',
        value => {
            const provider = Utils.get(value);

            self.provider(provider);

            if (provider === 'Cobalt') {
                Observer.broadcast(currency_visible_event, false);
                peer_funds_visible(true);
            } else {
                Observer.broadcast(currency_visible_event, true);
                Observer.broadcast(
                    Utils.gen_event(
                        'RadioButtons.set_state',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'peer:benchmark',
                        'view_toggle',
                    ),
                    'default',
                );
                peer_funds_visible(false);
            }
        },
    );

    self.when(shared_components, self.cpanel, self.body, self.meta_data_datasource).done(() => {
        self.mode = ko.observable(default_mode);

        const valid_export_modes = [
            'overview',
            'pme:benchmark',
            'point_in_time',
            'portfolio_funds',
            'horizon_model',
            'side_by_side',
            'peer:benchmark',
            'net_benchmark',
        ];

        if (!in_market_data) {
            valid_export_modes.push('horizon_model');
        }

        if (!in_market_data) {
            valid_export_modes.push('porfolio_value_drivers');
        }

        if (!in_market_data) {
            valid_export_modes.push('value_change');
        }

        if (auth.user_has_feature('beta_testing')) {
            Observer.register(events.get('revision_selected'), selection => {
                if (!selection[0] || selection[0].value === null) {
                    self.in_revision_mode(false);
                } else {
                    self.in_revision_mode(true);
                }
            });
        }

        Observer.register(set_mode_event, mode => {
            Observer.broadcast(enable_export_event, {
                enabled: valid_export_modes.indexOf(mode) > -1,
                title: 'Current Page',
            });

            if (mode) {
                Observer.broadcast(clear_horizon_event, true); // axp t105 (!)
            }

            self.mode(mode);
        });

        self._create_visual_report = DataThing.backends.useractionhandler({
            url: 'create_visual_report',
        });

        Observer.register(
            Utils.gen_event(
                'ActionButtons.ActionButton.action.create_visual_report',
                self.get_id(),
                'body',
                'action_toolbar',
                'create_visual_report',
            ),
            () => {
                const data = self.meta_data_datasource.data();
                self.subtype = ko.observable();
                if (data.entity_type === 'portfolio') {
                    self.subtype('hl_portfolio_report');
                } else if (
                    data.entity_type === 'user_fund' ||
                    data.entity_type === 'market_data_fund' ||
                    data.entity_type === 'bison_fund'
                ) {
                    self.subtype('fund_screening');
                }
                self._create_visual_report({
                    data: {
                        name: `${data.name} - ${moment().format('MM/DD/YYYY')}`,
                        report_type: 'visual_report',
                        sub_type: self.subtype(),
                        params: {
                            entity_uid:
                                data.user_fund_uid ||
                                data.portfolio_uid ||
                                data.market_data_fund_uid ||
                                data.market_data_family_uid,
                            entity_type: data.entity_type,
                        },
                    },
                    success: DataThing.api.XHRSuccess(response => {
                        pager.navigate(
                            `#!/visual-reports/${response.sub_type}/edit/${response.uid}`,
                        );
                    }),
                });
            },
        );

        Observer.register(
            Utils.gen_event(
                'ActionButton.action.view_details',
                self.get_id(),
                'body',
                'action_toolbar',
                'view_details',
            ),
            () => {
                Observer.broadcast(events.get('toggle_expand_metadata'), true);
            },
        );

        Observer.register(
            Utils.gen_event('RadioButtons.state', self.get_id(), 'cpanel', 'mode_toggle'),
            mode => {
                if (mode) {
                    VehicleHelper.navigate_to_mode(mode, default_mode);
                }
            },
        );

        self.entity_uid = ko.observable();

        Observer.register(entity_uid_event, entity_uid => {
            if (entity_uid !== self.entity_uid()) {
                Observer.broadcast(events.get('clear_button'));
            }
            self.entity_uid(entity_uid);
        });

        const download_pdf_event = Utils.gen_event('NetAnalytics.download_pdf', self.get_id());

        Observer.broadcast(
            register_export_event,
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: download_pdf_event,
            },
            true,
        );

        const prepare_pdf = DataThing.backends.download({
            url: 'prepare_analytics_pdf',
        });

        Observer.register(download_pdf_event, () => {
            const mode = self.mode();
            const uid = self.entity_uid();

            const body_content_id = Utils.html_id(Utils.gen_id(self.get_id(), 'body', mode));

            if (mode && uid) {
                prepare_pdf({
                    data: {
                        html: $(`#${body_content_id}`).html(),
                        width: $(`#${body_content_id}`).width(),
                        height: $(`#${body_content_id}`).height(),
                        mode: mode,
                        uid: uid,
                        entity_type: entity_type,
                    },
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_pdf_base + key);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        });

        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'body', 'portfolio_funds', 'chart', 'x_axis_scoring'),
            'Dropdown.selected',
            selection => bubble_control_visible(selection),
        );

        _dfd.resolve();
    });

    return self;
};

export default NetAnalytics;
