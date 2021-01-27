/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButton from 'src/libs/components/basic/ActionButton';
import DataTable from 'src/libs/components/basic/DataTable';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import $ from 'jquery';
import ko from 'knockout';
import config from 'config';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataSource from 'src/libs/DataSource';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import * as Formatters from 'src/libs/Formatters';

export default function(opts = {}, components = {}) {
    const self = new BaseComponent(opts, components);

    const _dfd = self.new_deferred();

    self.results_per_page = opts.results_per_page || 50;

    self.data_table_id = Utils.gen_id(self.get_id(), 'body_wrapper', 'body', 'entities_table');

    self.unarchive_visible_event = Utils.gen_event(
        'ActionButton.visible',
        self.get_id(),
        'unarchive',
    );
    self.archive_visible_event = Utils.gen_event('ActionButton.visible', self.get_id(), 'archive');

    Observer.register(
        Utils.gen_event('BooleanButton.state', self.get_id(), 'cpanel', 'view_archive_toggle'),
        state => {
            Observer.broadcast(self.unarchive_visible_event, !state);
            Observer.broadcast(self.archive_visible_event, state);
        },
    );

    self.archived = Observer.observable(
        Utils.gen_event('BooleanButton.state', self.get_id(), 'cpanel', 'view_archive_toggle'),
    ).extend({rateLimit: 250});

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body_wrapper',
            'body',
            'action_toolbar',
            'upload',
        ),
    );

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body_wrapper',
            'no_investments',
            'upload',
        ),
    );

    DataManagerHelper.register_create_new_entity_action_button(
        Utils.gen_id(self.get_id(), 'body_wrapper', 'body', 'action_toolbar', 'new'),
    );

    const entity_type = opts.entity_type || null;
    const breadcrumbs = opts.breadcrumbs || [
        {
            label: 'My Investments',
            link: '#!/analytics',
        },
        {
            label: 'Search',
        },
    ];

    const entity_type_labels = {
        portfolio: 'Portfolio',
        user_fund: 'Fund',
        bison_fund: 'Bison Fund',
    };

    const default_entity_types = [];

    if (entity_type) {
        default_entity_types.push(entity_type);
    } else {
        default_entity_types.push('user_fund', 'portfolio');
    }

    const show_bison_funds =
        auth.user_has_feature('bison_funds_in_portfolios') ||
        auth.user_has_feature('bison_internal');

    if ((show_bison_funds && !entity_type) || entity_type === 'user_fund') {
        default_entity_types.push('bison_fund');
    }

    const entity_type_options = default_entity_types.map(value => ({
        value,
        label: entity_type_labels[value],
    }));

    // We only show the filter if there's more than one to pick from
    const show_entity_type_filter = entity_type_options.length > 1;

    let clear_event = Utils.gen_event('EventButton', self.get_id(), 'cpanel', 'clear_button');

    let enum_popover_confs = () => {
        return {
            id: 'enum_attributes',
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
            enable_localstorage: true,
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

    self.cpanel = new Aside({
        parent_id: self.get_id(),
        id: 'cpanel',
        title: 'My Investments',
        title_css: 'performance-calculator',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: [
                'search_label',
                'name',
                'meta_info',
                'advanced_filters',
                ...Utils.conditional_element(['entity_type'], show_entity_type_filter),
                'cashflow_type',
                'enum_attributes',
                // 'vintage_year',
                // 'as_of_date',
                'remote_client',
                'view_archive_toggle',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'search_label',
                component: Label,
                css: {'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Search',
            },
            {
                id: 'name',
                component: StringFilter,
                template: 'tpl_string_filter',
                cpanel_style: true,
                clear_event: clear_event,
                enable_localstorage: true,
                placeholder: 'Name...',
            },
            enum_popover_confs(),
            {
                id: 'clear_button',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            },
            {
                id: 'filter_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
            {
                id: 'meta_info',
                component: MetaInfo,
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.count',
                        self.get_id(),
                        'body_wrapper',
                        'body',
                        'entities_table',
                    ),
                },
            },
            // {
            //     id: 'vintage_year',
            //     component: NewPopoverButton,
            //     css: {
            //         'btn-block': true,
            //         'btn-cpanel-primary': true,
            //         'btn-sm': true,
            //     },
            //     icon_css: 'glyphicon glyphicon-plus',
            //     clear_event: clear_event,
            //     label: 'Vintage Year',
            //     popover_options: {
            //         title: 'Vintage Year',
            //         placement: 'right',
            //         css_class: 'popover-cpanel',
            //     },
            //     popover_config: {
            //         component: Checklist,
            //         enable_exclude: true,
            //         datasource: {
            //             type: 'dynamic',
            //             mapping: 'list_to_options',
            //             mapping_default: [],
            //             query: {
            //                 target: 'user:vintage_years',
            //                 filters: {
            //                     entity_type: ['user_fund', 'bison_fund', 'portfolio'],
            //                     exclude_portfolio_only: true,
            //                 },
            //             },
            //         },
            //     },
            // },
            // {
            //     id: 'as_of_date',
            //     component: NewPopoverButton,
            //     css: {
            //         'btn-block': true,
            //         'btn-cpanel-primary': true,
            //         'btn-sm': true,
            //     },
            //     icon_css: 'glyphicon glyphicon-plus',
            //     clear_event: clear_event,
            //     label: 'As of Date',
            //     popover_options: {
            //         title: 'As of Date',
            //         placement: 'right',
            //         css_class: 'popover-cpanel',
            //     },
            //     popover_config: {
            //         component: Checklist,
            //         enable_exclude: true,
            //         datasource: {
            //             type: 'dynamic',
            //             mapping: 'backend_dates_to_options',
            //             mapping_default: [],
            //             query: {
            //                 target: 'user:as_of_dates',
            //                 filters: {
            //                     entity_type: ['user_fund', 'bison_fund', 'portfolio'],
            //                     exclude_portfolio_only: true,
            //                 },
            //             },
            //         },
            //     },
            // },
            {
                id: 'custom_attributes',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Custom Attributes',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                visible_callback: popover => popover && popover.filters().length > 0,
                popover_config: {
                    id: 'enum_custom_attributes',
                    active_template: 'in_popover',
                    enable_localstorage: true,
                    component: AttributeFilters,
                    clear_event: clear_event,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'user:custom_attributes',
                        },
                    },
                },
            },
            {
                id: 'remote_client',
                component: NewPopoverButton,
                label: 'Remote Client',
                css: {
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                visible_callback: popover => {
                    const options = popover.data();
                    if (options) {
                        return auth.user_has_feature('remote_data_admin') && options.length > 0;
                    }
                    return auth.user_has_feature('remote_data_admin');
                },
                popover_options: {
                    title: 'Remote Client',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_filter: true,
                    label_key: 'name',
                    value_key: 'uid',
                    datasource: {
                        key: 'results',
                        type: 'dynamic',
                        query: {
                            target: 'user:list_remote_clients',
                            results_per_page: 'all',
                            filter_empty: true,
                            order_by: [
                                {
                                    name: 'name',
                                    sort: 'asc',
                                },
                            ],
                        },
                    },
                },
            },
            {
                id: 'view_archive_toggle',
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: clear_event,
                label: 'View Archive',
            },
            ...Utils.conditional_element(
                [
                    {
                        id: 'entity_type',
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        clear_event: clear_event,
                        label: 'Type',
                        popover_options: {
                            title: 'Filter by Type',
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            component: Checklist,
                            enable_exclude: true,
                            datasource: {
                                type: 'static',
                                data: entity_type_options,
                            },
                            selected_datasource: {
                                type: 'static',
                                data: ['portfolio', 'user_fund'],
                            },
                        },
                    },
                ],
                show_entity_type_filter,
            ),
            {
                id: 'cashflow_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Cash Flow Type',
                popover_options: {
                    title: 'Cash Flow Type',
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
                                label: 'Net',
                                value: 'net',
                            },
                            {
                                label: 'Gross',
                                value: 'gross',
                            },
                        ],
                    },
                },
            },
            // {
            //     id: 'shared_by',
            //     component: NewPopoverButton,
            //     css: {
            //         'btn-block': true,
            //         'btn-cpanel-primary': true,
            //         'btn-sm': true,
            //     },
            //     icon_css: 'glyphicon glyphicon-plus',
            //     clear_event: clear_event,
            //     label: 'Shared By',
            //     enable_localstorage: true,
            //     popover_options: {
            //         placement: 'right',
            //         title: 'Shared By',
            //         css_class: 'popover-cpanel',
            //     },
            //     popover_config: {
            //         component: Checklist,
            //         enable_exclude: true,
            //         datasource: {
            //             type: 'dynamic',
            //             mapping: 'list_to_options',
            //             mapping_default: [],
            //             query: {
            //                 target: 'user:shared_bys',
            //                 filters: {
            //                     entity_type: ['user_fund', 'bison_fund', 'portfolio'],
            //                     exclude_portfolio_only: true,
            //                 },
            //             },
            //         },
            //     },
            // },
            {
                id: 'base_currency_symbol',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Base Currency',
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Base Currency',
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
                            target: 'user:currency_symbols',
                            filters: {
                                entity_type: ['user_fund', 'bison_fund', 'portfolio'],
                                exclude_portfolio_only: true,
                            },
                        },
                    },
                },
            },
            {
                id: 'permissions',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: clear_event,
                label: 'Permissions',
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Permissions',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                label: 'Read',
                                value: 'read',
                            },
                            {
                                label: 'Read and Write',
                                value: 'write',
                            },
                            {
                                label: 'Read, Write and Share',
                                value: 'share',
                            },
                        ],
                    },
                },
            },
            {
                id: 'irr',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'IRR',
                clear_event: clear_event,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Filter by IRR',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: '%',
                },
            },
            {
                id: 'tvpi',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'TVPI',
                clear_event: clear_event,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Filter by TVPI',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: 'x',
                },
            },
            {
                id: 'dpi',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'DPI',
                clear_event: clear_event,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Filter by DPI',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: 'x',
                },
            },
            {
                id: 'total_value',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Total Value',
                clear_event: clear_event,
                enable_localstorage: true,
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
                id: 'commitment',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Commitment',
                clear_event: clear_event,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Commitment',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            },
            ...Utils.conditional_element(
                [
                    {
                        id: 'in_portfolio',
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        label: 'In Portfolio',
                        enable_localstorage: true,
                        reset_event: clear_event,
                        popover_options: {
                            placement: 'right',
                            title: 'In Portfolio',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            strings: {
                                empty: 'You have no portfolios',
                            },
                            component: Checklist,
                            enable_exclude: true,
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
                                    },
                                },
                            },
                        },
                    },
                ],
                !entity_type || entity_type === 'user_fund',
            ),
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
                            'commitment',
                            'total_value',
                            'irr',
                            'tvpi',
                            'dpi',
                            'permissions',
                            // 'shared_by',
                            'base_currency_symbol',
                            ...Utils.conditional_element(
                                ['in_portfolio'],
                                !entity_type || entity_type === 'user_fund',
                            ),
                            'custom_attributes',
                        ],
                    },
                    components: [
                        {
                            id: 'advanced_filters_popover_label',
                            component: Label,
                            template: 'tpl_cpanel_label',
                            label: 'Advanced',
                        },
                    ],
                },
            },
        ],
    });

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body_wrapper',
        'body',
        'action_toolbar',
        'export_actions',
    );

    self.investments_datasource = {
        type: 'dynamic',
        query: {
            target: 'vehicles',
            results_per_page: self.results_per_page,
            show_hidden: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.state',
                    self.get_id(),
                    'cpanel',
                    'view_archive_toggle',
                ),
                default: false,
            },
            filters: {
                type: 'dynamic',
                query: {
                    name: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'StringFilter.value',
                            self.get_id(),
                            'cpanel',
                            'name',
                        ),
                        default: '',
                    },
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.get_id(),
                            'cpanel',
                            'enum_attributes',
                        ),
                    },
                    entity_type: show_entity_type_filter
                        ? {
                              type: 'observer',
                              event_type: Utils.gen_event(
                                  'PopoverButton.value',
                                  self.get_id(),
                                  'cpanel',
                                  'entity_type',
                              ),
                              default: default_entity_types,
                          }
                        : default_entity_types,
                    cashflow_type: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'cashflow_type',
                        ),
                        default: [],
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'vintage_year',
                        ),
                        default: [],
                    },
                    permissions: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'permissions',
                        ),
                        default: [],
                    },
                    as_of_date: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'as_of_date',
                        ),
                        default: [],
                    },
                    shared_by: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'shared_by',
                        ),
                        default: [],
                    },
                    base_currency_symbol: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'base_currency_symbol',
                        ),
                        default: [],
                    },
                    commitment: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'commitment',
                        ),
                        default: [],
                    },
                    total_value: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'total_value',
                        ),
                        default: [],
                    },
                    irr: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'irr',
                        ),
                        default: [],
                    },
                    tvpi: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'tvpi',
                        ),
                        default: [],
                    },
                    dpi: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'dpi',
                        ),
                        default: [],
                    },
                    in_portfolio_uid: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'in_portfolio',
                        ),
                        default: [],
                    },
                    remote_clients: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'remote_client',
                        ),
                        mapping: 'get_values',
                        mapping_args: {
                            key: 'uid',
                        },
                        default: [],
                    },
                    custom_attributes: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'cpanel',
                            'custom_attributes',
                        ),
                        default: [],
                    },
                    exclude_portfolio_only: true,
                },
            },
        },
    };

    self.body = {
        component: Aside,
        id: 'body',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'entities_table',
        },
        components: [
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                data_table_id: Utils.gen_id(
                    self.get_id(),
                    'body_wrapper',
                    'body',
                    'entities_table',
                ),
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.selected',
                        self.get_id(),
                        'body_wrapper',
                        'body',
                        'entities_table',
                    ),
                },
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: breadcrumbs,
                    },
                ],
            },
            {
                component: ActionHeader,
                id: 'action_toolbar',
                template: 'tpl_action_toolbar',
                valid_export_features: ['analytics'],
                data_table_id: Utils.gen_id(
                    self.get_id(),
                    'body_wrapper',
                    'body',
                    'entities_table',
                ),
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.selected',
                        self.get_id(),
                        'body_wrapper',
                        'body',
                        'entities_table',
                    ),
                },
                buttons: [
                    DataManagerHelper.buttons.archive_entities({
                        data_table_id: self.data_table_id,
                        visible_event: self.archive_visible_event,
                    }),
                    DataManagerHelper.buttons.unarchive_entities({
                        data_table_id: self.data_table_id,
                        visible_event: self.unarchive_visible_event,
                        default_visibility: 'hidden',
                    }),
                    DataManagerHelper.buttons.share({
                        data_table_id: self.data_table_id,
                        check_permissions: true,
                    }),
                    ...Utils.conditional_element(
                        [
                            DataManagerHelper.buttons.new_portfolio_from_selection({
                                data_table_id: self.data_table_id,
                            }),
                        ],
                        !entity_type || entity_type === 'user_fund',
                    ),
                ],
            },
            {
                component: DataTable,
                id: 'entities_table',
                enable_localstorage: true,
                enable_selection: true,
                enable_column_toggle: true,
                enable_clear_order: true,
                empty_template: ko.pureComputed(() => {
                    if (self.archived()) {
                        return 'tpl_data_table_empty_data_manager_archived';
                    }
                    return 'tpl_data_table_default_empty';
                }),
                column_toggle_css: {'fixed-column-toggle': true},
                css: {'table-light': true, 'table-sm': true},
                results_per_page: self.results_per_page,
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Search Results',
                    subtitle: 'CSV',
                },
                clear_order_event: clear_event,
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
                columns: [
                    {
                        label: 'Name',
                        sort_key: 'name',
                        formatter: data => {
                            if (self.archived()) {
                                return data.name;
                            }

                            const args = {
                                base_url: opts.base_url || '#!/analytics',
                            };

                            return Formatters.entity_link(data, false, args);
                        },
                        css: ko.pureComputed(() => {
                            return {
                                'table-field': true,
                                'disabled-link': self.archived(),
                            };
                        }),
                    },
                ].concat(VehicleHelper.search_columns),
                datasource: self.investments_datasource,
            },
        ],
    };

    self.no_investments = {
        component: Aside,
        id: 'no_investments',
        template: 'tpl_no_investments',
        title_text: config.lang.empty_portfolio.title_text,
        image_url: config.lang.empty_portfolio.image_url,
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            upload: 'upload',
        },
        components: [
            {
                id: 'upload',
                component: ActionButton,
                label: 'Upload <span class="icon-upload"></span>',
                action: 'upload',
                css: {
                    btn: true,
                    'btn-lg': true,
                    'btn-success': true,
                },
            },
            {
                component: ActionHeader,
                id: 'action_toolbar',
                template: 'tpl_action_toolbar',
                valid_export_features: ['analytics'],
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.selected',
                        self.get_id(),
                        'body_wrapper',
                        'body',
                        'entities_table',
                    ),
                },
                buttons: [DataManagerHelper.buttons.upload()],
            },
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: breadcrumbs,
                    },
                ],
            },
        ],
    };

    self.body_wrapper = self.new_instance(DynamicWrapper, {
        id: 'body_wrapper',
        template: 'tpl_dynamic_wrapper',
        active_component: 'body',
        components: [self.body, self.no_investments],
    });

    self.asides = [self.cpanel, self.body_wrapper];

    $.when($.when(...self.cpanel.dfds), $.when(...self.body_wrapper.dfds)).done(() => {
        self.investments = new DataSource({datasource: self.investments_datasource});
        self.investment_watcher = ko.computed(() => {
            const data = self.investments.data();
            if (data) {
                const ln_res = data.results.length;
                const ex_res = [];

                for (let i = 0, l = ln_res; i < l; i++) {
                    const res = data.results[i];
                    const entity_type = res.entity_type;
                    const key = entity_type == 'portfolio' ? 'portfolio_uid' : 'user_fund_uid';
                    if (res[key] && res[key].indexOf('0000-0000-0000') > -1) {
                        ex_res.push(res);
                    }
                }

                if (ex_res.length < ln_res || self.archived()) {
                    self.body_wrapper.set_active_component('body');
                } else {
                    self.body_wrapper.set_active_component('no_investments');
                }
            }
        });

        _dfd.resolve();
    });

    return self;
}
