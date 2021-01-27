/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import PortfolioValueDrivers from 'src/libs/components/analytics/PortfolioValueDrivers';
import DispersionAnalysis from 'src/libs/components/analytics/DispersionAnalysis';
import GrossOperatingMetrics from 'src/libs/components/analytics/GrossOperatingMetrics';
import Deals from 'src/libs/components/analytics/Deals';
import GrossValuationBridge from 'src/libs/components/analytics/GrossValuationBridge';
import ValueChange from 'src/libs/components/analytics/ValueChange';
import GrossDealScoring from 'src/libs/components/analytics/GrossDealScoring';
import RiskAnalysis from 'src/libs/components/analytics/RiskAnalysis';
import AnalyticsPME from 'src/libs/components/analytics/AnalyticsPME';
import AnalyticsHelper from 'src/libs/components/analytics/AnalyticsHelper';
import GrossFundPerformance from 'src/libs/components/analytics/GrossFundPerformance';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import Label from 'src/libs/components/basic/Label';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import PopoverNestedChecklist from 'src/libs/components/popovers/PopoverNestedChecklist';
import PopoverSortOrder from 'src/libs/components/popovers/PopoverSortOrder';
import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';
import TieredChecklist from 'src/libs/components/basic/TieredChecklist';
import PopoverChecklistCustomValue from 'src/libs/components/popovers/PopoverChecklistCustomValue';
import Radiolist from 'src/libs/components/basic/Radiolist';
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import pager from 'pager';
import auth from 'auth';
import moment from 'moment';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ExpandableMetaData from 'src/libs/components/basic/ExpandableMetaData';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import * as Constants from 'src/libs/Constants';
import Checklist from 'src/libs/components/basic/Checklist';
import MessageBanner from 'src/libs/components/basic/MessageBanner';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import ActionButton from 'src/libs/components/basic/ActionButton';
import DataSource from 'src/libs/DataSource';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    let set_mode_event = opts.set_mode_event;

    if (!set_mode_event) {
        throw "Set mode event can't be undefined in NetAnalytics";
    }
    let hl_deployment = config.hl;
    let entity_type = opts.entity_type;
    let user_fund_uid_event =
        opts.user_fund_uid_event || Utils.gen_event('Active.user_fund_uid', self.get_id());
    let market_data_fund_uid_event = opts.market_data_fund_uid_event;
    let portfolio_uid_event = Utils.gen_event('Active.portfolio_uid', self.get_id());
    let market_data_family_uid_event = opts.market_data_family_uid_event;

    let default_mode = opts.default_mode;
    let reset_event;

    let breadcrumb_base = opts.breadcrumb_base || [
        {
            label: 'My Investments',
            link: '#!/analytics',
        },
    ];

    self.disable_audit_trail = opts.disable_audit_trail ?? false;

    self.in_revision_mode = ko.observable(false);
    self.revision_allowed = ko.pureComputed(() => {
        return (
            self.in_revision_mode() &&
            ['fund_performance', 'pme', 'risk_analysis', 'deal_scoring'].includes(self.mode())
        );
    });

    const bubble_control_visible = ko.observable(false);
    const grouped_dispersion_analysis = ko.observable(false);

    const events = self.new_instance(EventRegistry);

    events.new('toggle_expand_metadata');
    events.new('create_visual_report');
    events.resolve_and_add('irr_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('distributed_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('paid_in_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('nav_calculation_mapping', 'PopoverButton.value');
    events.resolve_and_add('quarterly_cashflows_bool', 'BooleanButton.state');
    events.resolve_and_add('revision_selected', 'PopoverButton.value');
    events.resolve_and_add('group_selected', 'PopoverButton.state');
    events.resolve_and_add('value_change:split_by_cfs', 'BooleanButton.value');
    events.resolve_and_add('group_by_company', 'BooleanButton.value');

    events.resolve_and_add('view_details', 'ActionButton.action.view_details');

    if (opts.reset_event) {
        reset_event = Utils.gen_event(opts.reset_event, self.get_id());
    }

    let register_export_event = Utils.gen_event(
        'DynamicActions.register_action',
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );
    let enable_export_event = Utils.gen_event(
        'DynamicActions.enabled',
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    let user_fund_uid_required = false;
    let market_data_fund_uid_required = false;
    let portfolio_uid_required = false;
    let market_data_family_uid_required = false;
    let entity_uid_event;
    let in_market_data = false;
    if (entity_type === 'user_fund') {
        user_fund_uid_required = true;
        entity_uid_event = user_fund_uid_event;
    } else if (entity_type === 'market_data_fund') {
        market_data_fund_uid_required = true;
        entity_uid_event = market_data_fund_uid_event;
        in_market_data = true;
    } else if (entity_type === 'market_data_family') {
        market_data_family_uid_required = true;
        entity_uid_event = market_data_family_uid_event;
        in_market_data = true;
    } else {
        portfolio_uid_required = true;
        entity_uid_event = portfolio_uid_event;
    }

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
                    cashflow_type: 'gross',
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
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                        required: market_data_family_uid_required,
                    },
                },
            },
        },
    ];

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

    let get_pme_index_event = mode => {
        return Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'pme_index',
        );
    };

    let metrics_breakdown_event = Utils.gen_event(
        'PopoverButton.state',
        self.get_id(),
        'cpanel',
        'dynamic_wrapper',
        'operating_metrics',
        'group',
    );

    let metrics_breakdown = Observer.observable(metrics_breakdown_event);

    let modes;

    const valid_modes = [
        {
            label: 'Fund Performance',
            state: 'fund_performance',
        },
        {
            label: 'PME Benchmark',
            state: 'pme',
        },
        {
            label: 'Total Value Curve',
            state: 'risk_analysis',
        },
        {
            label: 'Deal Scoring',
            state: 'deal_scoring',
        },
        {
            label: 'Dispersion Analysis',
            state: 'dispersion_analysis',
        },
        {
            label: 'Valuation Bridge',
            state: 'valuation_bridge',
        },
        {
            label: 'Value Change',
            state: 'value_change',
        },
        {
            label: 'Deals',
            state: 'deals',
        },
        {
            label: 'Operating Metrics',
            state: 'operating_metrics',
        },
        {
            label: 'Value Drivers',
            state: 'portfolio_value_drivers',
        },
    ];

    const mode_index = Utils.object_from_array(valid_modes, m => [m.state, m]);

    if (opts.modes) {
        modes = opts.modes.map(id => mode_index[id]);
    } else {
        const defaults = [
            'fund_performance',
            'pme',
            'risk_analysis',
            'deal_scoring',
            'dispersion_analysis',
            'valuation_bridge',
            'value_change',
        ];

        if (auth.user_has_feature('metric_analytics')) {
            defaults.push('operating_metrics');
            if (!in_market_data) {
                defaults.push('deals');
            }
        }

        if (entity_type === 'portfolio') {
            defaults.push('portfolio_value_drivers');
        }

        modes = defaults.map(id => mode_index[id]);
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

    let get_horizon_event = mode => {
        return Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'horizon',
        );
    };

    let get_render_currency_event = mode => {
        return Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'render_currency',
        );
    };

    let as_of_date_event = Utils.gen_event('PopoverButton.value', self.get_id(), 'as_of_date');

    let get_time_interval_event = mode =>
        Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'time_interval',
        );

    let get_currency_symbol_event = mode =>
        Observer.map(get_render_currency_event(mode), {
            mapping: 'get',
            mapping_args: {key: 'symbol'},
        });

    let render_currency_conf = (horizon_event, as_of_event = as_of_date_event) => {
        let query = {
            target: 'currency:markets',
            cashflow_type: 'gross',
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
            market_data_family_uid: {
                type: 'observer',
                event_type: market_data_family_uid_event,
                required: market_data_family_uid_required,
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

        if (as_of_event) {
            query.max_date = {
                type: 'observer',
                event_type: as_of_event,
                mapping: 'get_value',
                required: true,
            };
        }

        return {
            id: 'render_currency',
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
                        market_data_family_uid: {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                            required: market_data_family_uid_required,
                        },
                    },
                },
            },
        };
    };

    let horizon_conf = function(inception_last) {
        inception_last = inception_last || false;

        return {
            id: 'horizon',
            component: NewPopoverButton,
            disabled: self.in_revision_mode,
            clear_event: reset_event,
            label: 'Horizon',
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
                id: 'horizon_popover',
                clear_event: as_of_date_event,
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
                        cashflow_type: 'gross',
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
                        inception_last: inception_last,
                    },
                },
            },
        };
    };

    let pme_index_conf = function(horizon_event) {
        let query = {
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
                    one_required: [
                        'user_fund_uid',
                        'portfolio_uid',
                        'market_data_fund_uid',
                        'market_data_family_uid',
                    ],
                    query: {
                        target: 'vehicle:meta_data',
                        cashflow_type: 'gross',
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

    const user_calculation_mapping_options = () => {
        if (auth.user_has_feature('calculation_mapping') && !in_market_data) {
            return {
                calculation_mappings_label: self.new_instance(Label, {
                    id: 'advanced_filters_popover_label',
                    template: 'tpl_cpanel_label',
                    label: 'Calculations',
                }),
                irr_calculation_mapping: self.new_instance(NewPopoverButton, {
                    id: 'irr_calculation_mapping',
                    id_callback: events.register_alias('irr_calculation_mapping'),

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
                                calculation_types: {
                                    type: 'static',
                                    data: [1],
                                },
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
                }),
                distributed_calculation_mapping: self.new_instance(NewPopoverButton, {
                    id: 'distributed_calculation_mapping',
                    id_callback: events.register_alias('distributed_calculation_mapping'),
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
                                calculation_types: {
                                    type: 'static',
                                    data: [3],
                                },
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
                }),
                nav_calculation_mapping: self.new_instance(NewPopoverButton, {
                    id: 'nav_calculation_mapping',
                    id_callback: events.register_alias('nav_calculation_mapping'),
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
                                calculation_types: {
                                    type: 'static',
                                    data: [5],
                                },
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
                }),
                paid_in_calculation_mapping: self.new_instance(NewPopoverButton, {
                    id: 'paid_in_calculation_mapping',
                    id_callback: events.register_alias('paid_in_calculation_mapping'),

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
                                calculation_types: {
                                    type: 'static',
                                    data: [2],
                                },
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
                }),
                quarterly_cashflows_bool: self.new_instance(BooleanButton, {
                    id: 'quarterly_cashflows_bool',
                    id_callback: events.register_alias('quarterly_cashflows_bool'),
                    label: 'On Quarter Ends',
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                }),
            };
        }
        return [];
    };

    const post_date_navs_button = [];
    let roll_forward_bool = true;
    if (config.enable_roll_forward_ui) {
        post_date_navs_button.push('post_date_navs');
        roll_forward_bool = false;
    }

    let shared_components = {
        filter_label: new HTMLContent({
            id: 'filter_label',
            html: '<h5>Filter</h5>',
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
                    cashflow_type: 'gross',
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
                    label: '# Deals',
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
        as_of_date: self.new_instance(NewPopoverButton, {
            id: 'as_of_date',
            disabled: self.in_revision_mode,
            label: 'As of',
            popover_options: {
                title: 'Select As of Date',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            label_track_selection: true,
            popover_config: {
                component: PopoverChecklistCustomValue,
                custom_value_placeholder: 'Custom Date',
                custom_value_mapping: 'date_to_epoch',
                single_selection: true,
                selected_idx: 0,
                disable_untoggle: true,
                empty_text: 'Insufficient cash flows',
                datasource: {
                    mapping: 'backend_dates_to_options',
                    mapping_default: [],
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:as_of_dates',
                        cashflow_type: 'gross',
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
        post_date_navs: self.new_instance(BooleanButton, {
            id: 'post_date_navs',
            label: 'Roll Forward NAVs',
            template: 'tpl_cpanel_boolean_button',
            default_state: roll_forward_bool,
            reset_event: reset_event,
            define: {
                term: 'Roll Forward NAVs',
                placement: 'right',
            },
        }),
        group_by_company: self.new_instance(BooleanButton, {
            id: 'group_by_company',
            id_callback: events.register_alias('group_by_company'),
            label: 'Group by Company',
            template: 'tpl_cpanel_boolean_button',
            default_state: false,
            reset_event: reset_event,
        }),
        ...user_calculation_mapping_options(),
    };

    let filter_confs = function(mode) {
        let clear_event = Utils.gen_event(
            'EventButton',
            self.get_id(),
            'cpanel',
            'dynamic_wrapper',
            mode,
            'clear_button',
        );

        let advanced_filters_popover_body = [
            'advanced_filters_popover_label',
            'transaction_status',
            'age_years',
            'irr',
            'tvpi',
            'total_value',
            'residual_value',
            'distributed',
            'paid_in',
        ];

        if (auth.user_has_feature('calculation_mapping') && !in_market_data) {
            advanced_filters_popover_body.push(
                'calculation_mappings_label',
                'nav_calculation_mapping',
                'irr_calculation_mapping',
                'paid_in_calculation_mapping',
                'distributed_calculation_mapping',
                'quarterly_cashflows_bool',
            );
        }

        // these modes aren't yet stable with cashflow attribute filters
        const cf_filter_exclude_modes = [
            'portfolio_value_drivers',
            'valuation_bridge',
            'deals',
            'operating_metrics',
        ];

        if (cf_filter_exclude_modes.indexOf(mode) === -1) {
            advanced_filters_popover_body.push('cf_attributes');
        }

        const components = [
            {
                id: 'deal',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Deal',
                popover_options: {
                    title: 'Deal',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    enable_filter: true,
                    sub_label_key: 'fund_name',
                    filter_value_keys: ['fund_name', 'label'],
                    datasource: {
                        key: 'results',
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            label_key: 'company_name',
                            value_key: 'uid',
                            additional_keys: ['fund_name'],
                        },
                        query: {
                            target: 'deals',
                            results_per_page: 'all',
                            cashflow_type: 'gross',
                            entity_uid: {
                                type: 'observer',
                                event_type: entity_uid_event,
                                required: true,
                            },
                            entity_type: entity_type,
                            order_by: [
                                {
                                    name: 'company_name',
                                    sort: 'asc',
                                },
                            ],
                        },
                    },
                },
            },
            {
                id: 'user_fund',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                label: 'Fund',
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
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
            },
            {
                id: 'manager',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Manager',
                popover_options: {
                    title: 'Manager',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        query: {
                            target: 'vehicle:managers',
                            cashflow_type: 'gross',
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
                id: 'deal_team_leader',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Deal Team Leader',
                popover_options: {
                    title: 'Deal Team Leader',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        query: {
                            target: 'vehicle:managers',
                            cashflow_type: 'gross',
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
                            exclude_deal_team_seconds: true,
                        },
                    },
                },
            },
            {
                id: 'time_frame',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                id_callback: events.register_alias(`${mode}_time_frame`),
                clear_event: clear_event,
                label_track_selection: true,
                label: 'Period',
                popover_options: {
                    title: 'Select Period',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    options: Constants.time_frame_display_options,
                },
            },
            {
                id: 'new_sector',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Sector / Industry',
                clear_event: clear_event,
                popover_options: {
                    title: 'Sector / Industry',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                visible: !in_market_data,
                popover_config: {
                    component: PopoverNestedChecklist,
                    template: 'tpl_popover_nested_checklist',
                    l1: {
                        key: 'sector',
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'classifications',
                                type: 'sector',
                            },
                        },
                    },
                    l2: {
                        key: 'industry',
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'classifications',
                                type: 'industry',
                            },
                        },
                        empty_text: 'Select a Sector to select Industry',
                    },
                },
            },
            {
                id: 'enum_attributes',
                component: AttributeFilters,
                clear_event: clear_event,
                option_disabled_key: true,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        cashflow_type: 'gross',
                        public_taxonomy: true,
                        entity_uid: {
                            type: 'observer',
                            event_type: entity_uid_event,
                            required: true,
                        },
                        entity_type: entity_type,
                        include_enums: in_market_data
                            ? ['geography', 'sector', 'gics']
                            : ['geography', 'gics'],
                        disable_unused: true,
                    },
                },
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
            },
            AnalyticsHelper.cf_attr_filter_config({
                id: 'cf_attributes',
                user_fund_uid_event: user_fund_uid_event,
                portfolio_uid_event: portfolio_uid_event,
                clear_event: clear_event,
            }),
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
                label: 'Deal Year',
                popover_options: {
                    title: 'Deal Year',
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
                            target: 'vehicle:deal_years',
                            cashflow_type: 'gross',
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
                id: 'deal_source',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Deal Source',
                popover_options: {
                    placement: 'right',
                    title: 'Deal Source',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    option_disabled_key: 'disabled',
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_source',
                            disable_unused: true,
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
                id: 'deal_role',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Deal Role',
                popover_options: {
                    placement: 'right',
                    title: 'Deal Role',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    option_disabled_key: 'disabled',
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_role',
                            disable_unused: true,
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
                id: 'deal_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Deal Type',
                popover_options: {
                    placement: 'right',
                    title: 'Deal Type',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    option_disabled_key: 'disabled',
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_type',
                            disable_unused: true,
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
                id: 'seller_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Seller Type',
                popover_options: {
                    placement: 'right',
                    title: 'Seller Type',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    option_disabled_key: 'disabled',
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_seller_type',
                            disable_unused: true,
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
                id: 'transaction_status',
                component: NewPopoverButton,
                label: 'Transaction Status',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Transaction Status',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'static',
                        data: [
                            {label: 'Unrealized', value: 'Unrealized'},
                            {label: 'Partially Realized', value: 'Partially Realized'},
                            {label: 'Realized', value: 'Realized'},
                        ],
                    },
                },
            },
            {
                id: 'paid_in',
                component: NewPopoverButton,
                label: 'Invested',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Invested',
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
                id: 'distributed',
                component: NewPopoverButton,
                label: 'Realized Value',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Realized Value',
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
                id: 'residual_value',
                component: NewPopoverButton,
                label: 'Unrealized Value',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Unrealized Value',
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
                id: 'total_value',
                component: NewPopoverButton,
                label: 'Total Value',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Total Value',
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
                id: 'tvpi',
                component: NewPopoverButton,
                label: 'TVPI',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'TVPI',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: 'x',
                },
            },
            {
                id: 'irr',
                component: NewPopoverButton,
                label: 'IRR',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'IRR',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: '%',
                },
            },
            {
                id: 'age_years',
                component: NewPopoverButton,
                label: 'Holding Period',
                clear_event: clear_event,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Holding Period',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: 'Years',
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
                id: 'advanced_filters_popover_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Advanced Filters',
            },
            DataManagerHelper.filters.custom_attributes_popover({
                id: 'custom_attributes',
                clear_event: clear_event,
                entity_uid_event: entity_uid_event,
                entity_type: entity_type,
                cashflow_type: 'gross',
            }),
            {
                component: NewPopoverButton,
                id: 'advanced_filters',
                template: 'tpl_header_with_advanced',
                label: 'filters',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel-advanced',
                },
                visible: !in_market_data,
                popover_config: {
                    id: 'advanced_filters_popover',
                    component: NewPopoverBody,
                    template: 'tpl_popover_new_body',
                    layout: {
                        body: advanced_filters_popover_body,
                    },
                },
            },
            {
                id: 'metric_version',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                id_callback: events.register_alias(`${mode}_metric_version_event`),
                visible: auth.user_has_feature('metric_versions'),
                clear_event: clear_event,
                label_track_selection: true,
                label: 'Metric Version',
                popover_options: {
                    title: 'Select Metric Version',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'vehicle:metric_versions',
                            entity_uid: {
                                type: 'observer',
                                event_type: entity_uid_event,
                                required: true,
                            },
                            entity_type: entity_type,
                            required: true,
                        },
                    },
                },
            },
        ];

        return components;
    };

    let filter_body = ['advanced_filters'];

    if (entity_type == 'portfolio' || entity_type == 'market_data_family') {
        filter_body.push('user_fund');
    }

    filter_body.push(
        'deal',
        'deal_team_leader',
        'manager',
        'enum_attributes',
        'new_sector',
        'vintage_year',
        'deal_source',
        'deal_role',
        'deal_type',
        'seller_type',
        'custom_attributes',
        'clear_button',
    );

    let filter_query = mode => {
        let mode_id = Utils.gen_id(self.get_id(), 'cpanel', 'dynamic_wrapper', mode);
        return {
            deal_uid: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'deal'),
                mapping: 'get_values',
            },
            user_fund_uid: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'user_fund'),
                mapping: 'get_values',
            },
            manager: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'manager'),
            },
            deal_team_leader: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'deal_team_leader'),
            },
            new_sector: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'new_sector'),
            },
            enums: {
                type: 'observer',
                event_type: Utils.gen_event('AttributeFilters.state', mode_id, 'enum_attributes'),
            },
            cf_attribute_filters: {
                type: 'observer',
                event_type: Utils.gen_event('AttributeFilters.state', mode_id, 'cf_attributes'),
            },
            custom_attributes: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'AttributeFilters.state',
                    mode_id,
                    'custom_attributes',
                    'custom_attributes_filter',
                ),
            },
            vintage_year: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'vintage_year'),
            },
            transaction_status: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'transaction_status'),
            },
            paid_in: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'paid_in'),
            },
            distributed: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'distributed'),
            },
            residual_value: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'residual_value'),
            },
            total_value: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'total_value'),
            },
            tvpi: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'tvpi'),
            },
            irr: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'irr'),
            },
            age_years: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'age_years'),
            },
            deal_source: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'deal_source'),
            },
            deal_role: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'deal_role'),
            },
            deal_type: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'deal_type'),
            },
            seller_type: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'seller_type'),
            },
            value_change: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', mode_id, 'value_change'),
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

    const fund_performance_body = [
        'as_of_date',
        ...protected_revision_body(),
        'render_currency',
        ...post_date_navs_button,
        'group_by_company',
        'view_toggle',
        'results_per_page',
        ...filter_body,
    ];

    self.deal_scoring_columns = [
        {
            label: 'IRR',
            key: 'irr',
        },
        {
            label: 'TVPI',
            key: 'tvpi',
        },
        {
            label: 'DPI',
            key: 'dpi',
        },
        {
            label: 'RVPI',
            key: 'rvpi',
        },
        {
            label: 'Loss Ratio',
            key: 'loss_ratio',
        },
        {
            label: 'Total Loss Ratio',
            key: 'total_loss_ratio',
        },
        {
            label: 'Invested',
            key: 'paid_in',
        },
        {
            label: '% Invested',
            key: 'paid_in_pct',
        },
        {
            label: 'Realized Value',
            key: 'distributed',
        },
        {
            label: '% Realized Value',
            key: 'distributed_pct',
        },
        {
            label: 'Unrealized Value',
            key: 'nav',
        },
        {
            label: '% Unrealized Value',
            key: 'nav_pct',
        },
        {
            label: 'Total Value',
            key: 'total_value',
        },
        {
            label: '% Total Value',
            key: 'total_value_pct',
        },
        {
            label: 'Holding Period',
            key: 'age_years',
        },
        {
            label: 'Min IRR',
            key: 'min_irr',
        },
        {
            label: 'Max IRR',
            key: 'max_irr',
        },
        {
            label: '# Deals',
            key: 'vehicle_count',
        },
        {
            label: '# Deals Above Avg',
            key: 'vehicles_above_avg',
        },
    ];

    const cpanel_confs = [
        {
            id: 'deals',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: filter_body,
            },
            components: filter_confs('deals'),
        },
        {
            id: 'fund_performance',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: fund_performance_body,
            },
            components: [
                {
                    id: 'results_per_page',
                    component: NewPopoverButton,
                    label: 'Deals per page',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Deals per page',
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
                                'fund_performance',
                                'deals_table',
                            ),
                        },
                    },
                },
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
                ...filter_confs('fund_performance'),
            ],
        },
        {
            id: 'pme',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    ...protected_revision_body(),
                    'horizon',
                    'render_currency',
                    ...post_date_navs_button,
                    'pme_index',
                    'multi_pme_active',
                    'multi_pme_settings',
                    ...filter_body,
                ],
            },
            components: [
                horizon_conf(),
                pme_index_conf(get_horizon_event('pme')),
                render_currency_conf(get_horizon_event('pme')),
                {
                    id: 'multi_pme_active',
                    component: BooleanButton,
                    template: 'tpl_cpanel_boolean_button',
                    default_state: false,
                    reset_event: reset_event,
                    label: 'Multi Index',
                },
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
                ...filter_confs('pme'),
            ],
        },
        {
            id: 'risk_analysis',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    ...protected_revision_body(),
                    'horizon',
                    'render_currency',
                    'group',
                    ...filter_body,
                ],
            },
            components: [
                render_currency_conf(get_horizon_event('risk_analysis')),
                horizon_conf(),
                {
                    id: 'group',
                    component: NewPopoverButton,
                    label: 'Grouping',
                    label_track_selection: true,
                    ellipsis: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: TieredChecklist,
                        single_selection: true,
                        max_tire: 2,
                        placement: 'right',
                        option_disabled_key: 'disabled',
                        label_key: 'label',
                        value_key: 'breakdown_key',
                        datasource: {
                            type: 'dynamic',
                            mapping: 'build_tiered_checklist_tree',
                            mapping_args: {
                                value_key: 'breakdown_key',
                                label_key: 'label',
                                additional_keys: ['is_custom', 'disabled'],
                            },
                            query: {
                                target: 'vehicle:breakdown_options',
                                cashflow_type: 'gross',
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
                                include_enums: in_market_data
                                    ? ['geography', 'sector', 'gics']
                                    : ['geography', 'gics'],
                                include_morningstar: false,
                                disable_unused: true,
                                include_cashflow_options: true,
                                include_company: true,
                            },
                        },
                    },
                },
                ...filter_confs('risk_analysis'),
            ],
        },
        {
            id: 'deal_scoring',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    ...protected_revision_body(),
                    'horizon',
                    'render_currency',
                    ...post_date_navs_button,
                    'group',
                    'sort_order',
                    'results_per_page',
                    'bubble_control',
                    ...filter_body,
                ],
            },
            components: [
                render_currency_conf(get_horizon_event('deal_scoring')),
                horizon_conf(),
                {
                    component: NewPopoverButton,
                    id: 'sort_order',
                    label: 'Order',
                    icon_css: 'glyphicon glyphicon-th-list',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Order',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverSortOrder,
                        template: 'tpl_popover_sort_order',
                        columns: self.deal_scoring_columns,
                    },
                },
                {
                    id: 'group',
                    component: NewPopoverButton,
                    label: 'Grouping',
                    label_track_selection: true,
                    ellipsis: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                        listen_to: ['checklists'],
                    },
                    popover_config: {
                        component: TieredChecklist,
                        value_key: 'breakdown_key',
                        max_tier: 2,
                        label_key: 'label',
                        single_selection: true,
                        option_disabled_key: 'disabled',
                        datasource: {
                            type: 'dynamic',
                            mapping: 'build_tiered_checklist_tree',
                            mapping_args: {
                                label_key: 'label',
                                value_key: 'breakdown_key',
                                additional_keys: ['is_custom', 'disabled'],
                            },
                            query: {
                                target: 'vehicle:breakdown_options',
                                cashflow_type: 'gross',
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
                                include_enums: in_market_data
                                    ? ['geography', 'sector', 'gics']
                                    : ['geography', 'gics'],
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
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'DataTable.results_per_page',
                                self.get_id(),
                                'body',
                                'deal_scoring',
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
                        data: self.deal_scoring_columns.map(row => ({
                            ...row,
                            ['value']: row.key,
                        })),
                    },
                    visible_callback: () => bubble_control_visible(),
                },
                ...filter_confs('deal_scoring'),
            ],
        },
        {
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
                    css: {'btn-sm': true, 'btn-cpanel-primary': true, 'btn-block': true},
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
                ...filter_confs('value_change'),
            ],
        },
        {
            id: 'valuation_bridge',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: ['as_of_date', 'render_currency', 'view_toggle', ...filter_body],
            },
            components: [
                render_currency_conf(),
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
                            label: 'View Details',
                            state: 'data',
                        },
                    ],
                },
                ...filter_confs('valuation_bridge'),
            ],
        },
        {
            id: 'operating_metrics',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'render_currency',
                    'date_range',
                    'group',
                    'group_aggregate_fn',
                    'time_frame',
                    'metric_version',
                    'time_zero',
                    'results_per_page',
                    ...filter_body,
                ],
            },
            components: [
                render_currency_conf(null, null),
                {
                    id: 'date_range',
                    component: NewPopoverButton,
                    label: 'Date Range',
                    label_track_selection: true,
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        title: 'Date Range',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverInputRange,
                        placement: 'right',
                        title: 'Range',
                        mode: 'date',
                        min: {
                            placeholder: 'Start',
                            in_cpanel: true,
                        },
                        max: {
                            placeholder: 'End',
                            in_cpanel: true,
                        },
                    },
                },
                {
                    id: 'group',
                    component: NewPopoverButton,
                    label: 'Grouping',
                    label_track_selection: true,
                    ellipsis: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
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
                            query: {
                                target: 'vehicle:breakdown_options',
                                cashflow_type: 'gross',
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
                                include_enums: ['geography', 'gics'],
                                exclude_keys: [
                                    // These keys don't work without cashflows
                                    'transaction_status',
                                    'vintage_year',
                                ],
                                disable_unused: true,
                            },
                        },
                    },
                },
                {
                    id: 'group_aggregate_fn',
                    component: NewPopoverButton,
                    label_track_selection: true,
                    visible_callback: function() {
                        return Utils.is_set(metrics_breakdown(), true);
                    },
                    label: 'Grouping Fn',
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        title: 'Grouping Function',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        strings: {
                            clear: 'Reset',
                        },
                        component: Radiolist,
                        default_selected_index: 0,
                        data: [
                            {value: 'avg', label: 'Average'},
                            {value: 'median', label: 'Median'},
                            {value: 'sum', label: 'Sum'},
                        ],
                    },
                },
                {
                    id: 'time_zero',
                    component: BooleanButton,
                    template: 'tpl_cpanel_boolean_button',
                    default_state: false,
                    reset_event: reset_event,
                    label: 'Time Zero',
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
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'DataTable.results_per_page',
                                self.get_id(),
                                'body',
                                'operating_metrics',
                                'controls',
                                'statistics',
                            ),
                        },
                    },
                },
                ...filter_confs('operating_metrics'),
            ],
        },
        {
            id: 'portfolio_value_drivers',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    'horizon',
                    'render_currency',
                    'post_date_navs',
                    'group',
                    'results_per_page',
                    ...filter_body,
                ],
            },
            components: [
                render_currency_conf(get_horizon_event('portfolio_value_drivers')),
                horizon_conf(),
                {
                    id: 'group',
                    component: NewPopoverButton,
                    label: 'Grouping',
                    hide_icon: true,
                    label_track_selection: true,
                    ellipsis: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: TieredChecklist,
                        single_selection: true,
                        max_tier: 2,
                        option_disabled_key: 'disabled',
                        label_key: 'label',
                        value_key: 'breakdown_key',
                        datasource: {
                            type: 'dynamic',
                            mapping: 'build_tiered_checklist_tree',
                            mapping_args: {
                                label_key: 'label',
                                value_key: 'breakdown_key',
                                additional_keys: ['is_custom', 'disabled'],
                            },
                            query: {
                                target: 'vehicle:breakdown_options',
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                    required: true,
                                },
                                market_data_family_uid: {
                                    type: 'observer',
                                    event_type: market_data_family_uid_event,
                                    required: market_data_family_uid_required,
                                },
                                include_enums: in_market_data
                                    ? ['geography', 'sector', 'gics']
                                    : ['geography', 'gics'],
                                disable_unused: true,
                            },
                        },
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
                    hide_icon: true,
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
                ...filter_confs('portfolio_value_drivers'),
            ],
        },
        {
            id: 'dispersion_analysis',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'as_of_date',
                    ...protected_revision_body(),
                    'horizon',
                    'render_currency',
                    'group',
                    'group_metric',
                    ...filter_body,
                ],
            },
            components: [
                render_currency_conf(get_horizon_event('dispersion_analysis')),
                horizon_conf(),
                {
                    id: 'group',
                    component: NewPopoverButton,
                    label: 'Grouping',
                    label_track_selection: true,
                    ellipsis: true,
                    id_callback: events.register_alias('group_selected'),
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: TieredChecklist,
                        max_tier: 2,
                        value_key: 'breakdown_key',
                        label_key: 'label',
                        single_selection: true,
                        option_disabled_key: 'disabled',
                        css: {
                            'popover-cpanel': true,
                            'multi-icon-list': true,
                        },
                        datasource: {
                            type: 'dynamic',
                            mapping: 'build_tiered_checklist_tree',
                            mapping_args: {
                                label_key: 'label',
                                value_key: 'breakdown_key',
                                additional_keys: ['is_custom', 'disabled'],
                            },
                            query: {
                                target: 'vehicle:breakdown_options',
                                cashflow_type: 'gross',
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
                                include_enums: in_market_data
                                    ? ['geography', 'sector', 'gics']
                                    : ['geography', 'gics'],
                                disable_unused: true,
                            },
                        },
                    },
                },
                {
                    id: 'group_metric',
                    component: NewPopoverButton,
                    label: 'Grouping Metric',
                    visible_callback: () => !grouped_dispersion_analysis(),
                    label_track_selection: true,
                    ellipsis: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Radiolist,
                        data: [
                            {
                                value: 'av_paid_in',
                                label: '% of Av. Invested',
                            },
                            {
                                value: 'av_total_val',
                                label: '% of AV. Total Value',
                            },
                        ],
                    },
                },
                ...filter_confs('dispersion_analysis'),
            ],
        },
    ];

    const mode_ids = modes.map(m => m.state);

    self.cpanel = new Aside(
        {
            title: 'Deal Calculator',
            title_css: 'deal-calculator',
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
                    component: RadioButtons,
                    template: 'tpl_full_width_radio_buttons',
                    default_state: default_mode,
                    set_state_event: set_mode_event,
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    buttons: modes,
                },
                {
                    id: 'dynamic_wrapper',
                    component: DynamicWrapper,
                    active_component: default_mode,
                    template: 'tpl_dynamic_wrapper',
                    set_active_event: set_mode_event,
                    components: cpanel_confs.filter(m => mode_ids.indexOf(m.id) > -1),
                },
            ],
        },
        shared_components,
    );

    let multi_pme_query = {
        target: 'sub_vehicle_options',
        entity_type: entity_type,
        entity_uid: {
            type: 'observer',
            event_type: entity_uid_event,
            required: true,
        },
        sub_entity_types:
            entity_type == 'user_fund' || entity_type == 'market_data_fund'
                ? 'deal'
                : ['user_fund', 'market_data_fund'],
    };

    let body_confs = [
        {
            id: 'fund_performance',
            component: GrossFundPerformance,
            enable_sector_attribute: in_market_data,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'fund_performance',
                'view_toggle',
            ),
            register_export_event: !in_market_data && register_export_event,
            dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
            start_loading: true,
            entity_uid_event: entity_uid_event,
            entity_type: entity_type,
            portfolio_uid_required: portfolio_uid_required,
            user_fund_uid_required: user_fund_uid_required,
            market_data_fund_uid_required: market_data_fund_uid_required,
            market_data_family_uid_required: market_data_family_uid_required,
            user_fund_uid_event: user_fund_uid_event,
            portfolio_uid_event: portfolio_uid_event,
            market_data_fund_uid_event: market_data_fund_uid_event,
            market_data_family_uid_event: market_data_family_uid_event,
            results_per_page_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'fund_performance',
                'results_per_page',
            ),
            cashflow_table_datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:gross:cashflows',
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('fund_performance'),
                        required: true,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('fund_performance'),
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
                            distributed: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: events.get('distributed_calculation_mapping'),
                            },
                            nav: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: events.get('nav_calculation_mapping'),
                            },
                        },
                    },
                    ...protected_revision_query(),
                },
            },
            deals_datasource: {
                type: 'dynamic',
                key: 'items',
                query: {
                    target: 'vehicle:breakdown',
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
                        default: roll_forward_bool,
                    },
                    group_by_company: {
                        type: 'observer',
                        event_type: events.get('group_by_company'),
                        default: false,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('fund_performance'),
                        required: true,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('fund_performance'),
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
                        },
                    },
                    quarterly_cashflows: {
                        type: 'observer',
                        event_type: events.get('quarterly_cashflows_bool'),
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
                        required: true,
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            self.get_id(),
                            'post_date_navs',
                        ),
                        default: roll_forward_bool,
                    },
                    cashflow_type: 'gross',
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
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('fund_performance'),
                        required: true,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('fund_performance'),
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
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('fund_performance'),
                        required: true,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('fund_performance'),
                    },
                    metrics: ['irr', 'rvpi', 'tvpi', 'dpi'],
                    date_multiplier: 1000,
                    ...protected_revision_query(),
                },
            },
        },
        {
            id: 'pme',
            component: AnalyticsPME,
            dependencies: [Utils.gen_id(self.get_id(), 'as_of_date')],
            register_export_event: !in_market_data && register_export_event,
            as_of_date_event: as_of_date_event,
            horizon_event: get_horizon_event('pme'),
            vehicle_is_gross_fund: entity_type === 'user_fund',
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
                        event_type: get_horizon_event('pme'),
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_pme_index_event('pme'),
                        required: true,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('pme'),
                        required: true,
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            self.get_id(),
                            'post_date_navs',
                        ),
                        default: roll_forward_bool,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('pme'),
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
                    'pme',
                    'multi_pme_active',
                ),
                settings_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'dynamic_wrapper',
                    'pme',
                    'multi_pme_settings',
                ),
                datasource: {
                    type: 'dynamic',
                    query: multi_pme_query,
                },
            },
        },
        {
            id: 'risk_analysis',
            component: RiskAnalysis,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'risk_analysis',
                'view_toggle',
            ),
            results_per_page_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'risk_analysis',
                'results_per_page',
            ),
            register_export_event: !in_market_data && register_export_event,
            dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
            entity_uid_event: entity_uid_event,
            entity_type: entity_type,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:gross:fund_risk_curve',
                    start_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_horizon_event('risk_analysis'),
                        required: true,
                    },
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('risk_analysis'),
                    },
                    breakdown_key: {
                        mapping: 'get_tiered_breakdown_key',
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.state',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'risk_analysis',
                            'group',
                        ),
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('risk_analysis'),
                    },
                    ...protected_revision_query(),
                },
            },
        },
        {
            id: 'deal_scoring',
            component: GrossDealScoring,
            url: opts.deal_url,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'deal_scoring',
                'view_toggle',
            ),
            set_order_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'deal_scoring',
                'sort_order',
            ),
            bubble_metric_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'deal_scoring',
                'bubble_control',
            ),
            base_metrics: self.deal_scoring_columns.map(({key, ...rest}) => ({
                ...rest,
                ['value']: key,
            })),
            results_per_page_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'deal_scoring',
                'results_per_page',
            ),
            register_export_event: !in_market_data && register_export_event,
            dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
            entity_uid_event: entity_uid_event,
            entity_type: entity_type,
            auto_get_data: false,
            datasource: {
                type: 'dynamic',
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
                        event_type: get_horizon_event('deal_scoring'),
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('deal_scoring'),
                    },
                    breakdown_key: {
                        mapping: 'get_tiered_breakdown_key',
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.state',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'deal_scoring',
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
                        default: roll_forward_bool,
                    },
                    grouping_level: undefined,
                    filters: {
                        type: 'dynamic',
                        query: filter_query('deal_scoring'),
                    },
                    include_overview: true,
                    ...protected_revision_query(),
                },
            },
            timeseries_datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:company_metrics_progression',
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                    },
                    start_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_horizon_event('deal_scoring'),
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('deal_scoring'),
                    },
                    breakdown_key: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'deal_scoring',
                            'group',
                        ),
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('deal_scoring'),
                    },
                    date_multiplier: 1000,
                },
            },
        },
        {
            id: 'dispersion_analysis',
            component: DispersionAnalysis,
            grouped_dispersion_analysis: grouped_dispersion_analysis,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:gross_dispersion_analysis',
                    start_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_horizon_event('dispersion_analysis'),
                        required: true,
                    },
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: as_of_date_event,
                        required: true,
                    },
                    cashflow_type: 'gross',
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
                        event_type: get_render_currency_event('dispersion_analysis'),
                    },
                    breakdown_key: {
                        mapping: 'get_tiered_breakdown_key',
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.state',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'dispersion_analysis',
                            'group',
                        ),
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('dispersion_analysis'),
                    },
                    grouped_metric: {
                        type: 'observer',
                        mapping: 'get_value',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dynamic_wrapper',
                            'dispersion_analysis',
                            'group_metric',
                        ),
                    },
                    ...protected_revision_query(),
                },
            },
        },
        {
            id: 'deals',
            component: Deals,
            url: opts.deal_url,
            entity_uid_event: entity_uid_event,
            entity_type: entity_type,
            table_datasource: {
                type: 'dynamic',
                query: {
                    target: 'deals',
                    results_per_page: 50,
                    entity_uid: {
                        type: 'observer',
                        event_type: entity_uid_event,
                        required: true,
                    },
                    entity_type: entity_type,
                    filters: {
                        type: 'dynamic',
                        query: filter_query('deals'),
                    },
                },
            },
        },
        {
            id: 'value_change',
            component: ValueChange,
            entity_type: entity_type,
            entity_uid: entity_uid_event,
            as_of_date: Observer.map(as_of_date_event, 'get_value'),
            time_interval: Observer.map(get_time_interval_event('value_change'), 'get_value'),
            register_export_event: !in_market_data && register_export_event,
            currency: get_currency_symbol_event('value_change'),
            horizon_date: Observer.map(get_horizon_event('value_change'), 'get_value'),
            filter_query: filter_query('value_change'),
            post_date_navs_event: Utils.gen_event(
                'BooleanButton.state',
                self.get_id(),
                'post_date_navs',
            ),
            split_by_cfs_event: events.get('value_change:split_by_cfs'),
        },
        {
            id: 'valuation_bridge',
            component: GrossValuationBridge,
            set_mode_event: Utils.gen_event(
                'RadioButtons.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'valuation_bridge',
                'view_toggle',
            ),
            register_export_event: register_export_event,
            dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
            auto_get_data: false,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:gross:valuation_bridge',
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
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                        required: market_data_family_uid_required,
                    },
                    render_currency: {
                        mapping: 'get',
                        mapping_args: {
                            key: 'symbol',
                        },
                        type: 'observer',
                        event_type: get_render_currency_event('valuation_bridge'),
                    },
                    cashflow_type: 'gross',
                    filters: {
                        type: 'dynamic',
                        query: filter_query('valuation_bridge'),
                    },
                },
            },
        },
    ];

    if (auth.user_has_feature('metric_analytics')) {
        body_confs.push({
            id: 'operating_metrics',
            component: GrossOperatingMetrics,
            disable_audit_trail: self.disable_audit_trail,
            breakdown_event: metrics_breakdown_event,
            metric_version_event: events.resolve_event(
                'operating_metrics_metric_version_event',
                'PopoverButton.value',
            ),
            time_zero_event: Utils.gen_event(
                'BooleanButton.state',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'operating_metrics',
                'time_zero',
            ),
            display_mode_event: events.resolve_event(
                'operating_metrics_time_frame',
                'PopoverButton.value',
            ),
            register_export_event: register_export_event,
            enable_export_event: enable_export_event,
            results_per_page_event: Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'cpanel',
                'dynamic_wrapper',
                'operating_metrics',
                'results_per_page',
            ),
            base_query: {
                entity_uid: {
                    type: 'observer',
                    event_type: entity_uid_event,
                    required: true,
                },
                entity_type: entity_type,
                filters: {
                    type: 'dynamic',
                    query: filter_query('operating_metrics'),
                },
                time_frame: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: events.resolve_event(
                        'operating_metrics_time_frame',
                        'PopoverButton.value',
                    ),
                },
                metric_version: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: events.resolve_event(
                        'operating_metrics_metric_version_event',
                        'PopoverButton.value',
                    ),
                    required: true,
                },
            },
            analysis_query: {
                date_range: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'operating_metrics',
                        'date_range',
                    ),
                },
                breakdown_key: {
                    mapping: 'get_tiered_breakdown_key',
                    type: 'observer',
                    event_type: metrics_breakdown_event,
                },
                breakdown_fn: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'operating_metrics',
                        'group_aggregate_fn',
                    ),
                },
                time_zero: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        self.get_id(),
                        'cpanel',
                        'dynamic_wrapper',
                        'operating_metrics',
                        'time_zero',
                    ),
                },
                render_currency: {
                    mapping: 'get',
                    mapping_args: {
                        key: 'symbol',
                    },
                    required: true,
                    type: 'observer',
                    event_type: get_render_currency_event('operating_metrics'),
                },
            },
        });
    }

    if (entity_type === 'portfolio') {
        body_confs.push({
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
            inline_data: true,
            dependencies: Utils.gen_id(self.get_id(), 'as_of_date'),
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
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: portfolio_uid_event,
                        required: true,
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: market_data_family_uid_event,
                        required: market_data_family_uid_required,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: get_render_currency_event('portfolio_value_drivers'),
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
                        default: roll_forward_bool,
                    },
                    filters: {
                        type: 'dynamic',
                        query: filter_query('portfolio_value_drivers'),
                    },
                },
            },
        });
    }

    let breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: breadcrumbs,
    };

    const toolbar_buttons = [
        {
            id: 'view_details',
            id_callback: events.register_alias('view_details'),
            label: 'Details',
            action: 'view_details',
            css: {'pull-left': true},
        },
    ];

    if (!opts.disable_edit) {
        toolbar_buttons.unshift(
            DataManagerHelper.buttons.share({
                check_permissions: true,
            }),
            DataManagerHelper.buttons.view_in_datamanager({
                check_permissions: true,
            }),
        );
    }

    self.body = self.new_instance(
        DynamicWrapper,
        {
            id: 'body',
            template: 'tpl_analytics_body',
            active_component: default_mode,
            set_active_event: set_mode_event,
            toggle_auto_get_data: true,
            toggle_auto_get_data_ids: body_confs.map(c => c.id),
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
                        ...toolbar_buttons,
                        ...Utils.conditional_element(
                            [
                                {
                                    id: 'create_visual_report',
                                    component: ActionButtons,
                                    label:
                                        'Create Visual Report <span class="icon-doc-text"></span>',
                                    template: 'tpl_action_buttons_dropdown',
                                    css: {btn: true, 'btn-transparent-success:': true},
                                    datasource: gen_meta_data_datasource(),
                                    buttons: [
                                        {
                                            label: 'Deal Intelligence Report',
                                            component: ActionButton,
                                            action: 'create_visual_report',
                                            disabled_callback: data => !data.has_cashflows,
                                            disabled_if_no_data: true,
                                        },
                                    ],
                                },
                            ],
                            hl_deployment,
                        ),
                    ],
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
                            cashflow_type: 'gross',
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
                            cashflow_type: 'gross',
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
                ...body_confs.filter(c => mode_ids.indexOf(c.id) > -1),
            ],
        },
        shared_components,
    );

    self.asides = [self.cpanel, self.body];

    self.when(shared_components, self.cpanel, self.body, self.meta_data_datasource).done(() => {
        self.mode = ko.observable(default_mode);

        let valid_export_modes = [
            'fund_performance',
            'pme',
            'risk_analysis',
            'deal_scoring',
            'valuation_bridge',
            'value_change',
            'portfolio_value_drivers',
            'operating_metrics',
            'dispersion_analysis',
        ];

        if (auth.user_has_feature('beta_testing')) {
            Observer.register(events.get('revision_selected'), selection => {
                if (!selection[0] || selection[0].value === null) {
                    self.in_revision_mode(false);
                } else {
                    self.in_revision_mode(true);
                }
            });
        }

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
                self._create_visual_report({
                    data: {
                        name: `${data.name} - ${moment().format('MM/DD/YYYY')}`,
                        report_type: 'visual_report',
                        sub_type: 'deal_report',
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

        Observer.relay({
            sender: set_mode_event,
            receiver: enable_export_event,
            transform: mode => ({
                enabled: valid_export_modes.indexOf(mode) > -1,
                title: 'Current Page',
            }),
            callback: (inbound, _) => {
                self.mode(inbound);
            },
        });

        Observer.relay({
            sender: events.get('view_details'),
            receiver: events.get('toggle_expand_metadata'),
            data: true,
        });

        Observer.register(
            Utils.gen_event('RadioButtons.state', self.get_id(), 'cpanel', 'mode_toggle'),
            mode => {
                if (mode) {
                    VehicleHelper.navigate_to_mode(mode, default_mode);
                }
            },
        );

        self.entity_uid = ko.observable();

        Observer.register(entity_uid_event, self.entity_uid);

        let download_pdf_event = Utils.gen_event('GrossAnalytics.download_pdf', self.get_id());

        Observer.broadcast(
            register_export_event,
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: download_pdf_event,
            },
            true,
        );

        let prepare_pdf = DataThing.backends.download({
            url: 'prepare_analytics_pdf',
        });

        Observer.register(download_pdf_event, () => {
            let mode = self.mode();
            let uid = self.entity_uid();

            let body_content_id = Utils.html_id(Utils.gen_id(self.get_id(), 'body', mode));

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
            Utils.gen_id(self.get_id(), 'body', 'deal_scoring', 'chart', 'x_axis_scoring'),
            'Dropdown.selected',
            selection => bubble_control_visible(selection),
        );

        Observer.register(events.get('group_selected'), selection => {
            if (selection && Object.keys(selection).length > 0) {
                grouped_dispersion_analysis(false);
            } else {
                grouped_dispersion_analysis(true);
            }
        });

        _dfd.resolve();
    });

    return self;
}
