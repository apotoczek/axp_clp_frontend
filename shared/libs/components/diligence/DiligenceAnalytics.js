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
import TimeWeightedBreakdown from 'src/libs/components/analytics/TimeWeightedBreakdown';
import TimeWeightedComparison from 'src/libs/components/analytics/TimeWeightedComparison';
import HorizonModel from 'src/libs/components/analytics/HorizonModel';
import AnalyticsPeer from 'src/libs/components/analytics/AnalyticsPeer';
import AnalyticsSideBySide from 'src/libs/components/analytics/AnalyticsSideBySide';
import AnalyticsHelper from 'src/libs/components/analytics/AnalyticsHelper';
import DiligenceAnalyticsOverview from 'src/libs/components/diligence/DiligenceAnalyticsOverview';
import Checklist from 'src/libs/components/basic/Checklist';
import FutureCommitmentsForm from 'src/libs/components/analytics/horizon_model/FutureCommitmentsForm';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import Label from 'src/libs/components/basic/Label';
import PopoverSortOrder from 'src/libs/components/popovers/PopoverSortOrder';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import PopoverChecklistCustomValue from 'src/libs/components/popovers/PopoverChecklistCustomValue';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import EventButton from 'src/libs/components/basic/EventButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import AnalyticsPointInTime from 'src/libs/components/analytics/AnalyticsPointInTime';
import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';
import AnalyticsPME from 'src/libs/components/analytics/AnalyticsPME';
import PMEProgression from 'src/libs/components/analytics/PMEProgression';
import PeerProgression from 'src/libs/components/analytics/PeerProgression';

class DiligenceAnalytics extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.template = opts.template || undefined;

        const _dfd = this.new_deferred();

        const entity_type = opts.entity_type;

        const breadcrumb_base = opts.breadcrumb_base || [
            {
                label: 'Diligence Reports',
                link: '#!/diligence',
            },
        ];

        this.events = this.new_instance(EventRegistry);
        this.events.new('toggle_expand_metadata');
        this.events.new('side_by_side_show_currency');
        this.events.new('side_by_side_show_lists');
        this.events.new('side_by_side_available_results_per_page');
        this.events.new('show_cf_filters');
        this.events.new('create_visual_report');
        this.events.resolve_and_add('view_in_datamanager');

        const filter_body = [];
        const set_mode_event = opts.set_mode_event;
        const default_mode = opts.default_mode;

        if (!set_mode_event) {
            throw "Set mode event can't be undefined in DiligenceAnalytics";
        }

        const user_fund_uid_event =
            opts.user_fund_uid_event || Utils.gen_event('Active.user_fund_uid', this.get_id());
        const currency_visible_event = Utils.gen_event('BenchmarkCurrency.visible', this.get_id());
        const clear_horizon_event = Utils.gen_event('Horizon.clear', this.get_id());
        const project_uid_event = opts.project_uid_event;
        const register_export_event = Utils.gen_event(
            'DynamicActions.register_action',
            this.get_id(),
            'body',
            'action_toolbar',
            'export_actions',
        );
        const enable_export_event = Utils.gen_event(
            'DynamicActions.enabled',
            this.get_id(),
            'body',
            'action_toolbar',
            'export_actions',
        );

        let reset_event;
        if (opts.reset_event) {
            reset_event = Utils.gen_event(opts.reset_event, this.get_id());
        }

        let user_fund_uid_required = false;
        let entity_uid_event;

        if (entity_type === 'user_fund') {
            user_fund_uid_required = true;
            entity_uid_event = user_fund_uid_event;
        }

        DataManagerHelper.register_view_in_datamanager_event(
            Utils.gen_event(
                'ActionButton.action.view_in_datamanager',
                this.get_id(),
                'body',
                'action_toolbar',
                'view_in_datamanager',
            ),
        );

        DataManagerHelper.register_upload_wizard_event(
            Utils.gen_event(
                'ActionButton.action.upload',
                this.get_id(),
                'body',
                'action_toolbar',
                'upload',
            ),
        );

        DataManagerHelper.register_create_new_entity_action_button(
            Utils.gen_id(this.get_id(), 'body', 'action_toolbar', 'new'),
        );

        const horizon_model_mode_event = Utils.gen_event(
            'PopoverButton.value',
            this.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'horizon_model',
            'mode',
        );
        const horizon_model_time_interval_event = Utils.gen_event(
            'PopoverButton.value',
            this.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'horizon_model',
            'time_interval',
        );
        const horizon_model_group_event = Utils.gen_event(
            'PopoverButton.value',
            this.get_id(),
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
            this.get_id(),
            'cpanel',
            'dynamic_wrapper',
            'horizon_model',
            'grouping',
            'grouping_body',
            'attribute',
        );

        const get_horizon_event = mode =>
            Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                mode,
                'horizon',
            );

        const get_pme_index_event = mode =>
            Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                mode,
                'pme_index',
            );
        const get_render_currency_event = mode =>
            Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
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

        const meta_data_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:meta_data',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                        required: user_fund_uid_required,
                    },
                },
            },
        });
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
        ];

        const as_of_date_event = Utils.gen_event(
            'PopoverButton.value',
            this.get_id(),
            'as_of_date',
        );

        const render_currency_conf = (horizon_event, as_of_event = as_of_date_event) => {
            const query = {
                target: 'currency:markets',
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                max_date: {
                    type: 'observer',
                    event_type: as_of_event,
                    mapping: 'get_value',
                },
            };

            if (horizon_event) {
                query.min_date = {
                    type: 'observer',
                    event_type: horizon_event,
                    mapping: 'get_value',
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
                        },
                    },
                },
            };
        };

        const portfolio_filter_confs = () => {
            const clear_event = this.events.get('clear_button');

            return [
                enum_popover_confs(clear_event),
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
                            query: {
                                target: 'vehicle:vintage_years',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'clear_button',
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear Filters',
                },
                {
                    id: 'attributes',
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
                        component: AttributeFilters,
                        title: 'Enum Attributes',
                        clear_event: clear_event,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'filter_configs',
                                entity_uid: {
                                    type: 'observer',
                                    required: true,
                                },
                                entity_type: entity_type,
                            },
                        },
                    },
                },
            ];
        };

        /********************************************************************
         * FUND FILTERS
         Filters used both in peer and side by side
         *******************************************************************/

        const fund_filter_confs = () => {
            const clear_event = this.events.get('clear_button');

            return [
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
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                            },
                        },
                    },
                },
            ];
        };

        const horizon_conf = inception_last => {
            inception_last = inception_last || false;

            return {
                component: NewPopoverButton,
                clear_event: reset_event,
                id: 'horizon',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Select Horizon',
                    css_class: 'popover-cpanel',
                },
                label: 'Horizon',
                label_track_selection: true,
                hide_icon: true,
                popover_config: {
                    id: 'horizon_popover',
                    clear_event: [as_of_date_event, clear_horizon_event],
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
                            inception_last: inception_last,
                        },
                    },
                },
            };
        };

        const pme_index_conf = horizon_event => {
            const query = {
                target: 'vehicle:index_options',
                tree_mode: true,
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                max_date: {
                    type: 'observer',
                    event_type: as_of_date_event,
                    mapping: 'get_value',
                },
            };

            if (horizon_event) {
                query.min_date = {
                    type: 'observer',
                    event_type: horizon_event,
                    mapping: 'get_value',
                };
            }

            return {
                id: 'pme_index',
                label: 'Index',
                component: NewPopoverButton,
                clear_event: reset_event,
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
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
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

        const cf_attr_filters = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                one_required: ['user_fund_uid'],
                query: {
                    target: 'cash_flow_attribute_filter_configs',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                    },
                },
            },
        });

        cf_attr_filters.data.subscribe(available_filters => {
            if (Array.isArray(available_filters)) {
                Observer.broadcast(
                    this.events.get('show_cf_filters'),
                    available_filters.length > 0,
                );
            }
        });

        const cf_filters_conf = () => {
            return {
                id: 'cf_filters',
                component: Aside,
                template: 'tpl_aside_body',
                visible: false,
                visible_event: this.events.get('show_cf_filters'),
                layout: {
                    body: ['cashflow_filters_label', 'cf_attributes'],
                },
                components: [
                    {
                        id: 'cashflow_filters_label',
                        component: HTMLContent,
                        html: '<h5>Cashflow Filters</h5>',
                    },
                    AnalyticsHelper.cf_attr_filter_config({
                        id: 'cf_attributes',
                        user_fund_uid_event: user_fund_uid_event,
                    }),
                ],
            };
        };

        const filter_query = mode => {
            const mode_id = Utils.gen_id(this.get_id(), 'cpanel', 'dynamic_wrapper', mode);
            return {
                cf_attribute_filters: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'AttributeFilters.state',
                        mode_id,
                        'cf_filters',
                        'cf_attributes',
                    ),
                },
            };
        };

        /********************************************************************
         * CPANEL CONFIGS
         * configs for each mode. configured here to enable dynamic
         * setup based on entity type.
         *******************************************************************/

        const cpanel_confs = {};

        /********************************************************************
         * CPANEL CONFIG - OVERVIEW
         *******************************************************************/

        const post_date_navs_button = [];
        if (config.enable_roll_forward_ui) {
            post_date_navs_button.push('post_date_navs');
        }

        cpanel_confs.overview = {
            id: 'overview',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    'render_currency',
                    ...post_date_navs_button,
                    'view_toggle',
                    'cf_filters',
                ],
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
                cf_filters_conf(),
            ],
        };

        /********************************************************************
         * CPANEL CONFIG - POINT IN TIME // TIME-WEIGHTED RETURN
         *******************************************************************/

        cpanel_confs.point_in_time = {
            id: 'point_in_time',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: ['as_of_date', 'horizon', 'render_currency', ...filter_body],
            },
            components: [
                horizon_conf(true),
                render_currency_conf(get_horizon_event('point_in_time')),
            ],
        };

        /********************************************************************
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
                    visible_event: this.events.get('side_by_side_show_currency'),
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
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Order',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-th-list',
                    label: 'Order',
                    clear_event: this.events.get('clear_button'),
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
                    popover_config: {
                        id: 'results_per_page_popover',
                        component: Radiolist,
                        strings: {
                            no_selection: 'All',
                        },
                        datasource: {
                            type: 'observer',
                            event_type: this.events.get('side_by_side_available_results_per_page'),
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
                    clear_event: this.events.get('clear_button'),
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
                    visible_event: this.events.get('side_by_side_show_lists'),
                },
                cf_filters_conf(),
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
                            body: ['advanced_filters_popover_label', 'use_benchmark_data'],
                        },
                    },
                },
                render_currency_conf(),
                cf_filters_conf(),
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
                    'render_currency',
                    ...post_date_navs_button,
                    'mode',
                    'time_interval',
                    'scenario',
                    'future_commitments',
                    'grouping',
                    'filter_label',
                    'enum_attributes',
                    'vintage_year',
                    'attributes',
                    'clear_button',
                ],
            },
            components: [
                render_currency_conf(),
                {
                    id: 'mode',
                    component: NewPopoverButton,
                    label: 'Mode',
                    ellipsis: true,
                    hide_icon: true,
                    label_track_selection: true,
                    clear_event: reset_event,
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        title: 'Select Mode',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'static',
                            data: [
                                {label: 'Cash Flow Runoff', value: 'runoff'},
                                {label: 'Future Commitments', value: 'commitments'},
                            ],
                        },
                        selected_idx: 0,
                    },
                },
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
                                    component: Checklist,
                                    single_selection: true,
                                    datasource: {
                                        type: 'dynamic',
                                        mapping: 'to_options',
                                        mapping_args: {
                                            value_key: 'breakdown_key',
                                        },
                                        query: {
                                            target: 'vehicle:breakdown_options',
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
            ].concat(portfolio_filter_confs()),
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
                                max_date: {
                                    type: 'observer',
                                    event_type: as_of_date_event,
                                    mapping: 'get_value',
                                },
                            },
                        },
                        selected_datasource: {
                            key: 'market_id',
                            type: 'dynamic',
                            mapping_default: 100101,
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
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
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: this.events.get('clear_button'),
                    label: 'Lists',
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
                    id: 'peer_progression_horizon',
                    component: NewPopoverButton,
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    label: 'Horizon',
                    enable_localstorage: true,
                    hide_icon: true,
                    track_selection_property: 'selected_string',
                    popover_options: {
                        placement: 'right',
                        title: 'Horizon',
                        css_class: 'popover-cpanel',
                    },
                    ellipsis: true,
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
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
                        selected_idx: 0,
                    },
                },
                {
                    id: 'metric',
                    component: NewPopoverButton,
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    label: 'Metric',
                    enable_localstorage: true,
                    hide_icon: true,
                    track_selection_property: 'selected_string',
                    ellipsis: true,
                    popover_options: {
                        title: 'Metric',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
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
                        selected_idx: 0,
                    },
                },
                {
                    id: 'range_method',
                    component: NewPopoverButton,
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    label: 'Range Method',
                    enable_localstorage: true,
                    hide_icon: true,
                    track_selection_property: 'selected_string',
                    ellipsis: true,
                    popover_options: {
                        title: 'Range Method',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            type: 'static',
                            data: [
                                {label: 'Extremities', value: 'extremities'},
                                {label: 'Quartiles', value: 'quartiles'},
                            ],
                        },
                        selected_idx: 0,
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
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Horizons',
                        css_class: 'popover-cpanel',
                    },
                    label: 'Horizons',
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
                cf_filters_conf(),
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
                    component: NewPopoverButton,
                    clear_event: reset_event,
                    id: 'time_weighted_comparison_indexes',
                    label: 'Indexes',
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    label_track_selection: true,
                    ellipsis: true,
                    hide_icon: true,
                    popover_options: {
                        placement: 'right',
                        title: 'Select Indexes',
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
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'lists',
                    component: NewPopoverButton,
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    clear_event: this.events.get('clear_button'),
                    label: 'Lists',
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
                },
                {
                    id: 'time_weighted_comparison_horizons',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    label: 'Horizons',
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
                cf_filters_conf(),
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
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    label: 'Metrics',
                    enable_localstorage: true,
                    hide_icon: true,
                    ellipsis: true,
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
                        selected_datasource: ['irr', 'tvpi', 'dpi', 'rvpi'],
                    },
                },
                {
                    id: 'quartile_progression_currency',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    label: 'Currency',
                    track_selection_property: 'selected_string',
                    hide_icon: true,
                    ellipsis: true,
                    popover_options: {
                        title: 'Currency',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
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
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: this.events.get('clear_button'),
                    label: 'Lists',
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
                cf_filters_conf(),
            ],
        };

        /********************************************************************
         * BODY CONFIGS
         configs for each mode. configured here to enable dynamic
         setup based on entity type.
         *******************************************************************/

        const body_confs = {};

        /********************************************************************
         * BODY CONFIG - OVERVIEW
         *******************************************************************/

        body_confs.overview = {
            id: 'overview',
            component: DiligenceAnalyticsOverview,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'overview',
                'view_toggle',
            ),
            register_export_event: register_export_event,
            start_loading: true,
            get_user: true,
            entity_type: entity_type,
            project_uid_event: project_uid_event,
            user_fund_uid_event: user_fund_uid_event,
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
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('overview'),
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('overview'),
                    },
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
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            this.get_id(),
                            'post_date_navs',
                        ),
                        default: true,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('overview'),
                    },
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                        required: user_fund_uid_required,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('overview'),
                    },
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
                    },
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                        required: user_fund_uid_required,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('overview'),
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            this.get_id(),
                            'post_date_navs',
                        ),
                        default: true,
                    },
                    metrics: ['irr', 'rvpi', 'tvpi', 'dpi'],
                    date_multiplier: 1000,
                    filters: {
                        type: 'dynamic',
                        query: filter_query('overview'),
                    },
                },
            },
        };

        /********************************************************************
         * BODY CONFIG - PME
         *******************************************************************/

        body_confs.pme = {
            id: 'pme:benchmark',
            component: AnalyticsPME,
            dependencies: [Utils.gen_id(this.get_id(), 'as_of_date')],
            register_export_event: register_export_event,
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
                            this.get_id(),
                            'post_date_navs',
                        ),
                        default: true,
                    },
                    user_fund_uid: {
                        type: 'observer',
                        event_type: user_fund_uid_event,
                        required: user_fund_uid_required,
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
                },
            },
        };

        body_confs.pme_progression = {
            id: 'pme:progression',
            component: PMEProgression,
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
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
                        this.get_id(),
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
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('pme:progression'),
                    required: true,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query,
                },
            },
        };

        /********************************************************************
         * BODY CONFIG - SIDE BY SIDE
         *******************************************************************/

        body_confs.side_by_side = {
            id: 'side_by_side',
            auto_get_data: false,
            component: AnalyticsSideBySide,
            register_export_event,
            as_of_date_event,
            user_fund_uid_event,
            show_currency_event: this.events.get('side_by_side_show_currency'),
            show_lists_event: this.events.get('side_by_side_show_lists'),
            currency_event: get_currency_symbol_event('side_by_side'),
            available_results_per_page_event: this.events.get(
                'side_by_side_available_results_per_page',
            ),
            results_per_page_event: Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'side_by_side',
                'results_per_page',
            ),
            has_cashflows_event: Utils.gen_event(
                'BooleanButton.state',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'side_by_side',
                'has_cashflows',
            ),
            sort_order_event: Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'side_by_side',
                'sort_order',
            ),
            post_date_navs_event: Utils.gen_event(
                'BooleanButton.state',
                this.get_id(),
                'post_date_navs',
            ),
            enums_event: Utils.gen_event(
                'AttributeFilters.state',
                this.get_id(),
                'fund_filters',
                'enum_attributes',
            ),
            vintage_year_event: Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'fund_filters',
                'vintage_year',
            ),
            fund_size_event: Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'fund_filters',
                'fund_size',
            ),
            lists_event: Utils.gen_event(
                'PopoverButton.value',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'side_by_side',
                'lists_filter',
            ),
            cf_filters: {
                type: 'dynamic',
                query: filter_query('side_by_side'),
            },
        };

        /********************************************************************
         * BODY CONFIG - PEER
         *******************************************************************/

        body_confs.peer = {
            id: 'peer:benchmark',
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'peer:benchmark',
                'view_toggle',
            ),
            register_export_event: register_export_event,
            component: AnalyticsPeer,
            auto_get_data: false,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'peer_benchmark',
                    benchmark_edition_uid: {
                        type: 'observer',
                        mapping: 'get',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'benchmark',
                        ),
                        required: true,
                    },
                    currency_id: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'benchmark_currency',
                        ),
                    },
                    filters: {
                        type: 'dynamic',
                        query: {
                            as_of_date: {
                                type: 'observer',
                                event_type: as_of_date_event,
                            },
                            enums: {
                                type: 'observer',
                                event_type: Utils.gen_event(
                                    'AttributeFilters.state',
                                    this.get_id(),
                                    'fund_filters',
                                    'enum_attributes',
                                ),
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    this.get_id(),
                                    'fund_filters',
                                    'vintage_year',
                                ),
                            },
                            fund_size: {
                                type: 'observer',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    this.get_id(),
                                    'fund_filters',
                                    'fund_size',
                                ),
                            },
                            exclude_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                            },
                        },
                    },
                    use_benchmark_data: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            this.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'peer:benchmark',
                            'use_benchmark_data',
                        ),
                        default: true,
                    },
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
                                },
                                render_currency: {
                                    mapping: 'get_value',
                                    type: 'observer',
                                    event_type: get_render_currency_event('peer:benchmark'),
                                },
                                post_date_navs: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'BooleanButton.state',
                                        this.get_id(),
                                        'post_date_navs',
                                    ),
                                    default: true,
                                },
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                                filters: {
                                    type: 'dynamic',
                                    query: filter_query('peer:benchmark'),
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
            register_export_event: register_export_event,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                this.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'point_in_time',
                'view_toggle',
            ),
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
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
                },
            },
        };

        /********************************************************************
         * BODY CONFIG - HORIZON MODEL
         *******************************************************************/

        body_confs.horizon_model = {
            id: 'horizon_model',
            component: HorizonModel,
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
            reset_event: reset_event,
            mode_event: Observer.map(horizon_model_mode_event, 'get_value'),
            time_interval_event: Observer.map(horizon_model_time_interval_event, 'get_value'),
            register_export_event: register_export_event,
            attribute_event: horizon_model_attribute_event,
            group_event: horizon_model_group_event,
            currency_event: get_currency_symbol_event('horizon_model'),
            auto_get_data: false,
            base_query: {
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                future_commitments: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.state',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'horizon_model',
                        'future_commitments',
                    ),
                    default: [],
                },
                scenario: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'horizon_model',
                        'scenario',
                    ),
                    mapping: 'get_value',
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('horizon_model'),
                },
            },
            filters: {
                type: 'dynamic',
                query: {
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            this.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'horizon_model',
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'horizon_model',
                            'vintage_year',
                        ),
                    },
                    attributes: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.state',
                            this.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'horizon_model',
                            'attributes',
                        ),
                    },
                },
            },
        };

        body_confs.peer_progression = {
            id: 'peer:progression',
            component: PeerProgression,
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
            reset_event: reset_event,
            register_export_event: register_export_event,
            currency_event: get_currency_symbol_event('peer:progression'),
            metric_event: Observer.map(
                Utils.gen_event(
                    'PopoverButton.value',
                    this.get_id(),
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
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('peer:progression'),
                    required: true,
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                horizon_years: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
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
                        this.get_id(),
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
                        this.get_id(),
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
                                this.get_id(),
                                'fund_filters',
                                'enum_attributes',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'vintage_year',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'fund_size',
                            ),
                        },
                        exclude_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                        },
                        lists: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'cpanel',
                                'dynamic_wrapper',
                                'peer:progression',
                                'lists',
                            ),
                        },
                    },
                },
            },
        };

        body_confs.time_weighted_breakdown = {
            id: 'time_weighted_breakdown',
            component: TimeWeightedBreakdown,
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
            reset_event: reset_event,
            register_export_event: register_export_event,
            auto_get_data: false,
            base_query: {
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('time_weighted_breakdown'),
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                horizon_years: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'time_weighted_breakdown',
                        'time_weighted_breakdown_horizons',
                    ),
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query('time_weighted_breakdown'),
                },
            },
        };

        body_confs.time_weighted_comparison = {
            id: 'time_weighted_comparison',
            component: TimeWeightedComparison,
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
            reset_event: reset_event,
            register_export_event: register_export_event,
            auto_get_data: false,
            base_query: {
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: get_render_currency_event('time_weighted_comparison'),
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                horizon_years: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'time_weighted_comparison',
                        'time_weighted_comparison_horizons',
                    ),
                },
                market_ids: {
                    type: 'observer',
                    mapping: 'get_values',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'time_weighted_comparison',
                        'time_weighted_comparison_indexes',
                    ),
                    default: [],
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query('time_weighted_comparison'),
                },
                peer_filters: {
                    type: 'dynamic',
                    query: {
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                this.get_id(),
                                'fund_filters',
                                'enum_attributes',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'vintage_year',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'fund_size',
                            ),
                        },
                        exclude_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                        },
                        lists: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
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
                        this.get_id(),
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
                        this.get_id(),
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
            dependencies: Utils.gen_id(this.get_id(), 'as_of_date'),
            reset_event: reset_event,
            register_export_event: register_export_event,
            auto_get_data: false,
            base_query: {
                as_of_date: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: as_of_date_event,
                },
                horizon_years: {
                    type: 'observer',
                    mapping: 'get_value',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'quartile_progression',
                        'horizon_years',
                    ),
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: user_fund_uid_event,
                    required: user_fund_uid_required,
                },
                render_currency: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'quartile_progression',
                        'quartile_progression_currency',
                    ),
                },
                metrics: {
                    mapping: 'get_values',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'quartile_progression',
                        'metrics',
                    ),
                },
                post_date_navs: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'post_date_navs',
                    ),
                    default: true,
                },
                use_cashflow_data: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'quartile_progression',
                        'use_cashflow_data',
                    ),
                    default: false,
                },
                filters: {
                    type: 'dynamic',
                    query: filter_query('quartile_progression'),
                },
                peer_filters: {
                    type: 'dynamic',
                    query: {
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                this.get_id(),
                                'fund_filters',
                                'enum_attributes',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'vintage_year',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
                                'fund_filters',
                                'fund_size',
                            ),
                        },
                        exclude_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                        },
                        lists: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                this.get_id(),
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

        const cpanel_components = [
            cpanel_confs.overview,
            cpanel_confs.pme,
            cpanel_confs.pme_progression,
            cpanel_confs.point_in_time,
            cpanel_confs.side_by_side,
            cpanel_confs.peer,
            cpanel_confs.peer_progression,
        ];

        const body_components = [
            body_confs.overview,
            body_confs.pme,
            body_confs.pme_progression,
            body_confs.point_in_time,
            body_confs.side_by_side,
            body_confs.peer,
            body_confs.peer_progression,
        ];

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
         * Shared components are initialized beforehand and passed in as the
           second argument to the Control Panel Aside (top level aside).
           They can then be referenced in all components and thus reused in
           multiple modes.
         *******************************************************************/

        const shared_components = {
            chart_provider: this.new_instance(NewPopoverButton, {
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
                    const options = popover.data();

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
            benchmark: this.new_instance(NewPopoverButton, {
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
                    dependencies: [
                        Utils.gen_id('PopoverButton.value', this.get_id(), 'as_of_date'),
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            provider: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    this.get_id(),
                                    'chart_provider',
                                ),
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
                                    this.get_id(),
                                    'chart_provider',
                                ),
                            },
                            target: 'benchmark_uid_for_as_of_date',
                        },
                    },
                },
            }),
            data_set_label: this.new_instance(HTMLContent, {
                id: 'data_set_label',
                html: '<h5>Data Set</h5>',
            }),
            filter_label: this.new_instance(HTMLContent, {
                id: 'filter_label',
                html: '<h5>Filter</h5>',
            }),
            general_label: this.new_instance(HTMLContent, {
                id: 'general_label',
                html: '<h5>General</h5>',
            }),
            settings_label: this.new_instance(HTMLContent, {
                id: 'settings_label',
                html: '<h5>Settings</h5>',
            }),
            benchmark_settings_label: this.new_instance(HTMLContent, {
                id: 'benchmark_settings_label',
                html: '<h5>Benchmark Settings</h5>',
            }),
            benchmark_currency: this.new_instance(NewPopoverButton, {
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
                    const provider = shared_components.chart_provider.popover.get_value();
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
                            max_date: {
                                type: 'observer',
                                mapping: 'get_value',
                                event_type: as_of_date_event,
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
                        },
                    },
                },
            }),
            as_of_date: this.new_instance(NewPopoverButton, {
                clear_event: reset_event,
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
                        },
                    },
                },
            }),
            fund_filters: this.new_instance(Aside, {
                id: 'fund_filters',
                template: 'tpl_aside_body',
                layout: {
                    body: ['enum_attributes', 'vintage_year', 'fund_size', 'clear_button'],
                },
                components: fund_filter_confs(),
            }),
            post_date_navs: this.new_instance(BooleanButton, {
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
            expandable_meta_data: this.new_instance(ExpandableMetaData, {
                id: 'expandable_meta_data',
                toggle_event: this.events.get('toggle_expand_metadata'),
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:meta_data',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                            required: user_fund_uid_required,
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
            enum_attributes: this.new_instance(AttributeFilters, {
                id: 'enum_attributes',
                id_callback: this.events.register_alias('enum_attributes'),
                clear_event: this.events.get('clear_button'),
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                    },
                },
            }),
            vintage_year: this.new_instance(NewPopoverButton, {
                id: 'vintage_year',
                id_callback: this.events.register_alias('vintage_year'),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.events.get('clear_button'),
                label: 'Vintage Year',
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
                        query: {
                            target: 'vehicle:vintage_years',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                        },
                    },
                },
            }),
            attributes: this.new_instance(NewPopoverButton, {
                id: 'attributes',
                id_callback: this.events.register_alias('attributes'),
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
                    clear_event: this.events.get('clear_button'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            entity_type: 'user_fund',
                        },
                    },
                },
            }),
            clear_button: this.new_instance(EventButton, {
                id: 'clear_button',
                id_callback: this.events.register_alias('clear_button'),
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear Filters',
            }),
            funds_in_portfolio: this.new_instance(NewPopoverButton, {
                id: 'funds_in_portfolio',
                id_callback: this.events.register_alias('funds_in_portfolio'),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                label: 'Fund',
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.events.get('clear_button'),
                popover_options: {
                    title: 'Fund',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            label_key: 'name',
                            value_key: 'user_fund_uid',
                        },
                        query: {
                            target: 'vehicles',
                            results_per_page: 'all',
                            filters: {
                                type: 'dynamic',
                                query: {
                                    entity_type: ['user_fund', 'bison_fund'],
                                },
                            },
                            order_by: [
                                {
                                    name: 'name',
                                    sort: 'asc',
                                },
                            ],
                        },
                    },
                },
            }),
            cf_filters: this.new_instance(Aside, {
                id: 'cf_filters',
                template: 'tpl_aside_body',
                visible: false,
                visible_event: this.events.get('show_cf_filters'),
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
                        id_callback: this.events.register_alias('custom_cf_attributes'),
                        user_fund_uid_event: user_fund_uid_event,
                    }),
                ],
            }),
        };

        /********************************************************************
         * Control panel aside == json config for Control Panel initialized
           as an aside (very simple container component)
         *******************************************************************/

        this.cpanel = new Aside(
            {
                title: 'My Portfolio',
                title_css: {'performance-calculator': true},
                parent_id: this.get_id(),
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
            items: [
                ...breadcrumb_base,
                {
                    datasource: {
                        type: 'dynamic',
                        key: 'name',
                        query: {
                            target: 'vehicle:meta_data',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: user_fund_uid_event,
                                required: user_fund_uid_required,
                            },
                        },
                    },
                },
            ],
        };

        /********************************************************************
         * Body Component. Initalized as a
           DynamicWrapper (container component) with a dynamic element.
           The DynamicWrapper has an active component that can be changed
           by calling toggle() or by an inbound event determined by
           'set_active_event'.
         *******************************************************************/

        this.body = this.new_instance(
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
                },
                components: [
                    {
                        id: 'action_toolbar',
                        component: ActionHeader,
                        template: 'tpl_action_toolbar',
                        valid_export_features: ['analytics'],
                        buttons: [
                            DataManagerHelper.buttons.share({
                                check_permissions: true,
                            }),
                            {
                                id: 'view_in_datamanager',
                                id_callback: this.events.register_alias('view_in_datamanager'),
                                label: 'Edit <span class="icon-wrench"></span>',
                                action: 'view_in_datamanager',
                                datasource: {
                                    type: 'dynamic',
                                    query: {
                                        target: 'vehicle:meta_data',
                                        user_fund_uid: {
                                            type: 'observer',
                                            event_type: user_fund_uid_event,
                                            required: user_fund_uid_required,
                                        },
                                    },
                                },
                                trigger_url: {
                                    url:
                                        'data-manager/vehicles/fund/<cashflow_type>/<user_fund_uid>',
                                },
                            },
                            {
                                id: 'create_visual_report',
                                id_callback: this.events.register_alias('create_visual_report'),
                                action: 'create_visual_report',
                                component: ActionButton,
                                label: 'Create Visual Report <span class="icon-doc-text"></span>',
                                datasource: {
                                    type: 'dynamic',
                                    query: {
                                        target: 'vehicle:meta_data',
                                        user_fund_uid: {
                                            type: 'observer',
                                            event_type: user_fund_uid_event,
                                            required: user_fund_uid_required,
                                        },
                                    },
                                },
                            },
                            {
                                id: 'view_details',
                                label: 'Details',
                                action: 'view_details',
                                css: {'pull-left': true},
                            },
                        ],
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
                                },
                            },
                        },
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
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                    required: user_fund_uid_required,
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

        this.asides = [this.cpanel, this.body];

        Observer.register_for_id(
            Utils.gen_id(this.get_id(), 'chart_provider'),
            'PopoverButton.value',
            value => {
                const provider = Utils.get(value);

                if (provider === 'Cobalt') {
                    Observer.broadcast(currency_visible_event, false);
                    peer_funds_visible(true);
                } else {
                    Observer.broadcast(currency_visible_event, true);
                    Observer.broadcast(
                        Utils.gen_event(
                            'RadioButtons.set_state',
                            this.get_id(),
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

        this.when(shared_components, this.cpanel, this.body).done(() => {
            this.mode = ko.observable(default_mode);

            const valid_export_modes = [
                'overview',
                'pme:benchmark',
                'point_in_time',
                'horizon_model',
                'side_by_side',
                'peer:benchmark',
            ];

            Observer.register(set_mode_event, mode => {
                Observer.broadcast(enable_export_event, {
                    enabled: valid_export_modes.indexOf(mode) > -1,
                    title: 'Current Page',
                });

                if (mode) {
                    Observer.broadcast(clear_horizon_event, true);
                }

                this.mode(mode);
            });

            this.entity_uid = ko.observable();

            Observer.register(entity_uid_event, entity_uid => {
                this.entity_uid(entity_uid);
            });

            this._create_visual_report = DataThing.backends.useractionhandler({
                url: 'create_visual_report',
            });

            Observer.register(
                Utils.gen_event(
                    'ActionButton.action.view_details',
                    this.get_id(),
                    'body',
                    'action_toolbar',
                    'view_details',
                ),
                () => {
                    Observer.broadcast(this.events.get('toggle_expand_metadata'), true);
                },
            );

            Observer.register(
                Utils.gen_event(
                    'ActionButton.action.create_visual_report',
                    this.get_id(),
                    'body',
                    'action_toolbar',
                    'create_visual_report',
                ),
                () => {
                    Observer.broadcast(this.events.get('create_visual_report'), true);
                    const data = meta_data_datasource.data();
                    this.subtype = ko.observable();
                    if (data.cashflow_type === 'net') {
                        this.subtype('fund_screening');
                    } else {
                        this.subtype('deal_report');
                    }
                    this._create_visual_report({
                        data: {
                            name: `${data.name} - ${moment().format('MM/DD/YYYY')}`,
                            report_type: 'visual_report',
                            sub_type: this.subtype(),
                            params: {
                                entity_uid: data.user_fund_uid,
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
                Utils.gen_event('RadioButtons.state', this.get_id(), 'cpanel', 'mode_toggle'),
                mode => {
                    if (mode) {
                        VehicleHelper.navigate_to_mode(mode, default_mode);
                    }
                },
            );

            const download_pdf_event = Utils.gen_event('NetAnalytics.download_pdf', this.get_id());

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
                const mode = this.mode();
                const uid = this.entity_uid();

                const body_content_id = Utils.html_id(Utils.gen_id(this.get_id(), 'body', mode));

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

            _dfd.resolve();
        });
    }
}

export default DiligenceAnalytics;
