import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import PopoverEntitySearch from 'src/libs/components/popovers/PopoverEntitySearch';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import PopoverSavedSearches from 'src/libs/components/popovers/PopoverSavedSearches';
import PopoverSaveSearches from 'src/libs/components/popovers/PopoverSaveSearches';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import Context from 'src/libs/Context';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import StateHandler from 'src/libs/components/basic/StateHandler';
import * as Utils from 'src/libs/Utils';
import PortfolioBreakdown from 'src/libs/components/market_insights/PortfolioBreakdown';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';

import AddToListButton from 'src/libs/components/AddToListButton';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

class InvestmentsVM extends Context {
    constructor() {
        super({id: 'investments'});

        this.dfd = this.new_deferred();

        const results_per_page = 50;

        const successful_delete_event = Utils.gen_event(
            'SavedStates.delete_success',
            this.get_id(),
        );
        const register_export_id = Utils.gen_id(
            this.get_id(),
            'page_wrapper',
            'search_state',
            'content',
            'action_toolbar',
            'export_actions',
        );

        const get_state_events = load_event => {
            if (load_event) {
                return [
                    Utils.gen_event(load_event, this.get_id(), 'as_of_date'),
                    Utils.gen_event(load_event, this.get_id(), 'investor_location'),
                    Utils.gen_event(load_event, this.get_id(), 'fund_location'),
                    Utils.gen_event(load_event, this.get_id(), 'fund_size'),
                    Utils.gen_event(load_event, this.get_id(), 'commitment_size'),
                    Utils.gen_event(load_event, this.get_id(), 'investor'),
                    Utils.gen_event(load_event, this.get_id(), 'vintage_year'),
                    Utils.gen_event(load_event, this.get_id(), 'enum_attributes'),
                    Utils.gen_event(load_event, this.get_id(), 'name'),
                ];
            }

            return [
                Utils.gen_event('PopoverButton.value', this.get_id(), 'as_of_date'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'investor_location'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_location'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_size'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'commitment_size'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'investor'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'vintage_year'),
                Utils.gen_event('AttributeFilters.state', this.get_id(), 'enum_attributes'),
                Utils.gen_event('StringFilter.value', this.get_id(), 'name'),
            ];
        };

        const clear_event = Utils.gen_event('EventButton', this.get_id(), 'clear_button');

        const shared_components = {
            save_button: this.new_instance(NewPopoverButton, {
                id: 'save_button',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Save Search',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-save',
                label: 'Save',
                popover_config: {
                    id: 'save',
                    component: PopoverSaveSearches,
                    type: 'investmentsearch',
                },
            }),
            load_button: this.new_instance(NewPopoverButton, {
                id: 'load_button',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Load Search',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-share-alt',
                label: 'Load',
                popover_config: {
                    id: 'load',
                    component: PopoverSavedSearches,
                    type: 'investmentsearch',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'states:saved',
                        },
                    },
                },
            }),
            save_and_load_label: this.new_instance(Label, {
                id: 'save_and_load_label',
                template: 'tpl_cpanel_label',
                label: 'Save/Load',
            }),
            save_and_load: this.new_instance(StateHandler, {
                id: 'save_and_load',
                component_events: get_state_events(),
                save_state_event: Utils.gen_event(
                    'PopoverSaveSearches.save',
                    this.get_id(),
                    'save_button',
                    'save',
                ),
                load_state_event: Utils.gen_event(
                    'PopoverSavedSearches.load',
                    this.get_id(),
                    'load_button',
                    'load',
                ),
                delete_state_event: Utils.gen_event(
                    'PopoverSavedSearches.delete',
                    this.get_id(),
                    'load_button',
                    'load',
                ),
                load_events: get_state_events('StateHandler.load'),
                successful_delete_event: successful_delete_event,
                type: 'investmentsearch',
            }),
            vehicles_label: this.new_instance(Label, {
                id: 'vehicles_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            }),
            name: this.new_instance(StringFilter, {
                id: 'name',
                template: 'tpl_string_filter',
                enable_localstorage: true,
                placeholder: 'Name...',
                cpanel_style: true,
                clear_event: clear_event,
                set_state_event_type: 'StateHandler.load',
            }),
            meta_info: this.new_instance(MetaInfo, {
                id: 'meta_info',
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.count',
                        this.get_id(),
                        'page_wrapper',
                        'search_state',
                        'content',
                        'portfolio',
                        'vehicles',
                    ),
                },
            }),
            enum_attributes: this.new_instance(AttributeFilters, {
                id: 'enum_attributes',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
                enable_localstorage: true,
                clear_event: clear_event,
                set_state_event_type: 'StateHandler.load',
                component: AttributeFilters,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                        exclude_enums: ['gics'],
                    },
                },
            }),
            fund_size: this.new_instance(NewPopoverButton, {
                id: 'fund_size',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Fund Size',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Fund Size',
                clear_event: clear_event,
                enable_localstorage: true,
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            }),
            commitment_size: this.new_instance(NewPopoverButton, {
                id: 'commitment_size',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Commitment Size',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Commitment Size',
                clear_event: clear_event,
                enable_localstorage: true,
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            }),
            investor_location: this.new_instance(NewPopoverButton, {
                id: 'investor_location',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Investor Location',
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverLocationSearch,
                },
            }),
            fund_location: this.new_instance(NewPopoverButton, {
                id: 'fund_location',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                set_state_event_type: 'StateHandler.load',
                label: 'Fund Location',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverLocationSearch,
                },
            }),
            search_label: this.new_instance(Label, {
                id: 'search_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Search',
            }),
            visualization_label: this.new_instance(Label, {
                id: 'visualization_label',
                component: Label,
                template: 'tpl_cpanel_label',
                css: {'first-header': true},
                label: 'Visualization',
            }),
            as_of_date: this.new_instance(NewPopoverButton, {
                id: 'as_of_date',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Filter by As of Date',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                set_state_event_type: 'StateHandler.load',
                label: 'As of Date',
                enable_localstorage: true,
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'backend_dates_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:as_of_dates',
                        },
                    },
                },
            }),
            investor: this.new_instance(NewPopoverButton, {
                id: 'investor',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Investor Name',
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverEntitySearch,
                    data_target: 'market_data:investors',
                },
            }),
            vintage_year: this.new_instance(NewPopoverButton, {
                id: 'vintage_year',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Vintage Year',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                set_state_event_type: 'StateHandler.load',
                clear_event: clear_event,
                label: 'Vintage Year',
                enable_localstorage: true,
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
                },
            }),
            clear_button: this.new_instance(EventButton, {
                id: 'clear_button',
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            }),
        };

        const query_params = {
            name: {
                type: 'observer',
                event_type: Utils.gen_event('StringFilter.value', this.get_id(), 'name'),
                default: '',
            },
            enums: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'AttributeFilters.state',
                    this.get_id(),
                    'enum_attributes',
                ),
            },
            vintage_year: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'vintage_year'),
                default: [],
            },
            as_of_date: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'as_of_date'),
                default: [],
            },
            fund_size: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_size'),
                default: [],
            },
            commitment_size: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    this.get_id(),
                    'commitment_size',
                ),
                default: [],
            },
            fund_location: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_location'),
                default: [],
            },
            investor_location: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    this.get_id(),
                    'investor_location',
                ),
                default: [],
            },
            entities: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'investor'),
                default: [],
            },
        };

        const vehicles_datasource = {
            type: 'dynamic',
            query: {
                target: 'market_data:investments',
                results_per_page: results_per_page,
                filters: {
                    type: 'dynamic',
                    query: query_params,
                },
            },
        };

        const breakdown_datasource = {
            type: 'dynamic',
            query: {
                target: 'breakdown:over_time',
                results_per_page: results_per_page,
                val_key: 'count',
                breakdown_key: undefined,
                filters: {
                    type: 'dynamic',
                    query: query_params,
                },
            },
        };

        const performance_breakdown_datasource = {
            type: 'dynamic',
            query: {
                target: 'performance_breakdown:over_time',
                results_per_page: results_per_page,
                breakdown_key: undefined,
                filters: {
                    type: 'dynamic',
                    query: query_params,
                },
            },
        };

        const breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Investments',
                },
                {
                    label: 'Search',
                },
            ],
        };

        const vehicles_body = {
            component: DataTable,
            id: 'vehicles',
            enable_localstorage: true,
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            register_export: {
                export_event_id: register_export_id,
                title: 'Search Results',
                subtitle: 'CSV',
            },
            css: {'table-light': true, 'table-sm': true},
            results_per_page: results_per_page,
            clear_order_event: clear_event,
            columns: MarketInsightsHelper.investment_table_columns({include_investor: true}),
            datasource: vehicles_datasource,
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
                        relative: 'Fund',
                        position: 'right',
                    },
                    visible: false,
                },
            ],
        };

        const portfolio_body = {
            component: Aside,
            id: 'portfolio',
            template: 'tpl_aside_body',
            layout: {
                body: ['investment_portfolio', 'vehicles'],
            },
            components: [
                {
                    id: 'investment_portfolio',
                    component: PortfolioBreakdown,
                    breakdown_datasource: breakdown_datasource,
                    performance_breakdown_datasource: performance_breakdown_datasource,
                    results_as_compset: true,
                    select_chart: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'page_wrapper',
                        'search_state',
                        'cpanel',
                        'portfolio',
                        'chart_type',
                    ),
                },
                vehicles_body,
            ],
        };

        const cpanel_portfolio_tools = {
            id: 'portfolio',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'visualization_label',
                    'chart_type',
                    'search_label',
                    'name',
                    'meta_info',
                    'save_and_load_label',
                    'save_button',
                    'load_button',
                    'vehicles_label',
                    'enum_attributes',
                    'vintage_year',
                    'fund_size',
                    'as_of_date',
                    'commitment_size',
                    'investor',
                    'investor_location',
                    'fund_location',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'chart_type',
                    component: NewPopoverButton,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Breakdown Type',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Breakdown Type',
                    clear_event: clear_event,
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        data: [
                            {
                                label: 'Investments',
                                value: 'investments',
                            },
                            {
                                label: 'Performance',
                                value: 'performance',
                            },
                            {
                                label: 'Commitments',
                                value: 'commitments',
                            },
                        ],
                    },
                },
            ],
        };

        const header = {
            component: BreadcrumbHeader,
            id: 'header',
            template: 'tpl_breadcrumb_header',
            data_table_id: Utils.gen_id(
                this.get_id(),
                'page_wrapper',
                'search_state',
                'body',
                'entities_table',
            ),
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.selected',
                    this.get_id(),
                    'page_wrapper',
                    'search_state',
                    'body',
                    'entities_table',
                ),
            },
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [breadcrumb],
            valid_export_features: ['download_market_data'],
        };

        const action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
            buttons: [
                {
                    id: 'list',
                    component: AddToListButton,
                    label: 'Add To List <span class="glyphicon glyphicon-plus"></span>',
                    entity_type: 'investment',
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'DataTable.selected',
                            this.get_id(),
                            'page_wrapper',
                            'search_state',
                            'content',
                            'portfolio',
                            'vehicles',
                        ),
                        default: [],
                    },
                },
            ],
        };

        const cpanel = {
            component: Aside,
            id: 'cpanel',
            title: 'Investments',
            title_css: 'performance-calculator',
            template: 'tpl_analytics_cpanel',
            layout: {
                body: ['portfolio'],
            },
            components: [cpanel_portfolio_tools],
        };

        const content = {
            component: Aside,
            id: 'content',
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'portfolio',
            },
            components: [header, action_toolbar, portfolio_body],
        };

        const search_state = {
            component: Aside,
            id: 'search_state',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'content'],
            },
            components: [cpanel, content],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_state',
                set_active_event: Utils.gen_event('HashListener', this.get_id()),
                components: [search_state],
            },
            shared_components,
        );

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast_for_id(this.get_id(), 'HashListener', 'search_state');
                Observer.broadcast_for_id('UserAction', 'record_action', {
                    action_type: 'view_market_data_investments',
                });
            }
        };

        this.when(shared_components, this.page_wrapper).done(() => {
            Observer.register_hash_listener('investments', url => {
                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }
}

export default InvestmentsVM;
