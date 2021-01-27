import config from 'config';
import auth from 'auth';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import StringFilter from 'src/libs/components/basic/StringFilter';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import PopoverEntitySearch from 'src/libs/components/popovers/PopoverEntitySearch';
import Checklist from 'src/libs/components/basic/Checklist';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import EventButton from 'src/libs/components/basic/EventButton';
import Label from 'src/libs/components/basic/Label';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import AddToListButton from 'src/libs/components/AddToListButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class InvestorSearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.dfd = this.new_deferred();

        this.template = opts.template || 'tpl_test_body';

        const register_investor_export_id = Utils.gen_id(
            this.get_id(),
            'search_state',
            'content',
            'investors',
            'action_toolbar',
            'export_actions',
        );

        const results_per_page = 50;

        const events = this.new_instance(EventRegistry);

        // Investor Mode Events
        events.resolve_and_add('investor_name_string', 'StringFilter.value');
        events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
        events.resolve_and_add('vintage_year', 'PopoverButton.value');
        events.resolve_and_add('fund_size', 'PopoverButton.value');
        events.resolve_and_add('commitment_size', 'PopoverButton.value');
        events.resolve_and_add('investor_name_popover', 'PopoverButton.value');
        events.resolve_and_add('investor_location', 'PopoverButton.value');
        events.resolve_and_add('fund_location', 'PopoverButton.value');
        events.resolve_and_add('investor_clear_button', 'EventButton');

        events.new('add_to_list');
        events.new('add_contacts_to_list');
        events.resolve_and_add('investor_table', 'DataTable.selected', 'selected_investors');
        events.resolve_and_add('investor_table', 'DataTable.count', 'investor_count');
        events.resolve_and_add('investor_table', 'DataTable.counts', 'selected_investor_count');

        const user_has_investor_contacts = auth.user_has_feature('investor_contact');

        if (user_has_investor_contacts) {
            // Contact Mode Events
            events.resolve_and_add('contact_name_string', 'StringFilter.value');
            events.resolve_and_add('contact_clear_button', 'EventButton');
            events.resolve_and_add('contacts:investor_name_popover', 'PopoverButton.value');
            events.resolve_and_add('contacts:enum_attributes', 'AttributeFilters.state');
            events.resolve_and_add('contacts:fund_size', 'PopoverButton.value');
            events.resolve_and_add('contacts:vintage_year', 'PopoverButton.value');
            events.resolve_and_add('contacts:investor_type', 'PopoverButton.value');
            events.resolve_and_add('contact_table', 'DataTable.count', 'contact_count');
            events.resolve_and_add('contacts:investor_position_location', 'PopoverButton.value');

            events.resolve_and_add('contact_table', 'DataTable.selected', 'selected_contacts');
            events.resolve_and_add('contact_table', 'DataTable.counts', 'selected_contact_count');

            events.resolve_and_add('export_contacts_xls_button', 'EventButton');
        }

        // Shared events
        events.resolve_and_add('mode_toggle', 'RadioButtons.state');

        const default_mode = 'investors';

        const modes = [
            {
                label: 'Investors',
                state: 'investors',
            },
        ];

        const investor_cpanel_components = [
            {
                component: MetaInfo,
                id: 'investor_count',
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: events.get('investor_count'),
                },
            },
            {
                component: Label,
                id: 'search_label',
                template: 'tpl_cpanel_label',
                css: {'first-header': true},
                label: 'Search',
            },
            {
                component: Label,
                id: 'label',
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
            {
                component: EventButton,
                id: 'investor_clear_button',
                id_callback: events.register_alias('investor_clear_button'),
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            },
            {
                component: AttributeFilters,
                id: 'enum_attributes',
                id_callback: events.register_alias('enum_attributes'),
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
                clear_event: events.get('investor_clear_button'),
                enable_localstorage: true,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                        exclude_enums: ['gics'],
                    },
                },
            },
            {
                component: NewPopoverButton,
                id: 'fund_size',
                id_callback: events.register_alias('fund_size'),
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
                clear_event: events.get('investor_clear_button'),
                enable_localstorage: true,
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            },
            {
                component: NewPopoverButton,
                id: 'commitment_size',
                id_callback: events.register_alias('commitment_size'),
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
                clear_event: events.get('investor_clear_button'),
                enable_localstorage: true,
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            },
            {
                component: NewPopoverButton,
                id: 'vintage_year',
                id_callback: events.register_alias('vintage_year'),
                label: 'Vintage Year',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Vintage Year',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: events.get('investor_clear_button'),
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
            },
            {
                component: NewPopoverButton,
                id: 'investor_name_popover',
                id_callback: events.register_alias('investor_name_popover'),
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
                clear_event: events.get('investor_clear_button'),
                label: 'Investor Name',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverEntitySearch,
                    data_target: 'market_data:investors',
                },
            },
            {
                component: NewPopoverButton,
                id: 'investor_location',
                id_callback: events.register_alias('investor_location'),
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
                clear_event: events.get('investor_clear_button'),
                label: 'Investor Location',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverLocationSearch,
                },
            },
            {
                component: NewPopoverButton,
                id: 'fund_location',
                id_callback: events.register_alias('fund_location'),
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
                clear_event: events.get('investor_clear_button'),
                label: 'Fund Location',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverLocationSearch,
                },
            },
            {
                component: StringFilter,
                id: 'investor_name_string',
                id_callback: events.register_alias('investor_name_string'),
                template: 'tpl_string_filter',
                clear_event: events.get('investor_clear_button'),
                enable_localstorage: true,
                placeholder: 'Name...',
                cpanel_style: true,
            },
        ];

        const cpanel_components = [
            {
                id: 'investors',
                template: 'tpl_cpanel_body_items',
                layout: {
                    body: [
                        'investor_name_string',
                        'investor_count',
                        'label',
                        'enum_attributes',
                        'vintage_year',
                        'fund_size',
                        'commitment_size',
                        'investor_name_popover',
                        'investor_location',
                        'fund_location',
                        'investor_clear_button',
                    ],
                },
                components: investor_cpanel_components,
            },
        ];

        if (user_has_investor_contacts) {
            modes.push({
                label: 'Contacts',
                state: 'contacts',
            });

            const contact_cpanel_components = [
                {
                    component: StringFilter,
                    id: 'contact_name_string',
                    id_callback: events.register_alias('contact_name_string'),
                    template: 'tpl_string_filter',
                    clear_event: events.get('contact_clear_button'),
                    enable_localstorage: true,
                    placeholder: 'Name...',
                    cpanel_style: true,
                },
                {
                    component: MetaInfo,
                    id: 'contact_count',
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: events.get('contact_count'),
                    },
                },
                {
                    component: Label,
                    id: 'contact_filters_label',
                    template: 'tpl_cpanel_label',
                    label: 'Filters',
                },
                {
                    component: NewPopoverButton,
                    id: 'contacts:investor_type',
                    id_callback: events.register_alias('contacts:investor_type'),
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Investor Type',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: events.get('contact_clear_button'),
                    label: 'Investor Type',
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            mapping_default: [],
                            mapping_args: {
                                format: 'titleize',
                            },
                            query: {
                                target: 'investor_position_types',
                            },
                        },
                    },
                },
                {
                    component: NewPopoverButton,
                    id: 'contacts:investor_name_popover',
                    id_callback: events.register_alias('contacts:investor_name_popover'),
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
                    clear_event: events.get('contact_clear_button'),
                    label: 'Investor Name',
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverEntitySearch,
                        data_target: 'investors_for_contacts',
                        uid_key: 'investor_uid',
                        name_key: 'investor_name',
                    },
                },

                {
                    component: AttributeFilters,
                    id: 'contacts:enum_attributes',
                    id_callback: events.register_alias('contacts:enum_attributes'),
                    css: {
                        'cpanel-btn-sm': true,
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                    },
                    clear_event: events.get('contact_clear_button'),
                    enable_localstorage: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            public_taxonomy: true,
                            exclude_enums: ['gics'],
                        },
                    },
                },
                {
                    component: NewPopoverButton,
                    id: 'contacts:fund_size',
                    id_callback: events.register_alias('contacts:fund_size'),
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
                    clear_event: events.get('contact_clear_button'),
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
                {
                    component: NewPopoverButton,
                    id: 'contacts:vintage_year',
                    id_callback: events.register_alias('contacts:vintage_year'),
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Vintage Year',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Vintage Year',
                    clear_event: events.get('contact_clear_button'),
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
                },
                {
                    id: 'contacts:investor_position_location',
                    component: NewPopoverButton,
                    id_callback: events.register_alias('contacts:investor_position_location'),
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
                    clear_event: events.get('investor_clear_button'),
                    label: 'Contact Location',
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverLocationSearch,
                    },
                },
                {
                    component: EventButton,
                    id: 'contact_clear_button',
                    id_callback: events.register_alias('contact_clear_button'),
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear All',
                },
            ];

            cpanel_components.push({
                id: 'contacts',
                template: 'tpl_cpanel_body_items',
                layout: {
                    body: [
                        'contact_name_string',
                        'contact_count',
                        'contact_filters_label',
                        'contacts:enum_attributes',
                        'contacts:vintage_year',
                        'contacts:fund_size',
                        'contacts:investor_name_popover',
                        'contacts:investor_type',
                        'contacts:investor_position_location',
                        'contact_clear_button',
                    ],
                },
                components: contact_cpanel_components,
            });
        }

        const cpanel = {
            id: 'cpanel',
            component: Aside,
            title: 'Investors',
            title_css: 'performance-calculator',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: ['dynamic_wrapper'],
            },
            components: [
                {
                    id: 'mode_toggle',
                    id_callback: events.register_alias('mode_toggle'),
                    component: RadioButtons,
                    template: 'tpl_full_width_radio_buttons',
                    default_state: default_mode,
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    buttons: modes,
                    visible: modes.length > 1,
                },
                {
                    id: 'dynamic_wrapper',
                    component: DynamicWrapper,
                    active_component: default_mode,
                    template: 'tpl_dynamic_wrapper',
                    set_active_event: events.get('mode_toggle'),
                    components: cpanel_components,
                },
            ],
        };

        const breadcrumb = {
            id: 'breadcrumbs',
            component: Breadcrumb,
            items: [
                {
                    label: 'Investors',
                },
                {
                    label: 'Search',
                },
            ],
        };

        const investor_table_filters = {
            type: 'dynamic',
            query: {
                name: {
                    type: 'observer',
                    event_type: events.get('investor_name_string'),
                    default: '',
                },
                enums: {
                    type: 'observer',
                    event_type: events.get('enum_attributes'),
                },
                entities: {
                    type: 'observer',
                    event_type: events.get('investor_name_popover'),
                    default: [],
                },
                investor_locations: {
                    type: 'observer',
                    event_type: events.get('investor_location'),
                    default: [],
                },
                fund_locations: {
                    type: 'observer',
                    event_type: events.get('fund_location'),
                    default: [],
                },
                fund_size: {
                    type: 'observer',
                    event_type: events.get('fund_size'),
                    default: [],
                },
                commitment_size: {
                    type: 'observer',
                    event_type: events.get('commitment_size'),
                    default: [],
                },
                vintage_year: {
                    type: 'observer',
                    event_type: events.get('vintage_year'),
                    default: [],
                },
            },
        };

        const header = {
            id: 'header',
            component: BreadcrumbHeader,
            template: 'tpl_breadcrumb_header',
            layout: {
                breadcrumb: 'breadcrumbs',
            },
            components: [breadcrumb],
            valid_export_features: ['download_market_data'],
        };

        const investor_table_datasource = {
            type: 'dynamic',
            query: {
                target: 'market_data:investors',
                filters: investor_table_filters,
                results_per_page: results_per_page,
            },
        };

        const investor_table = {
            id: 'investor_table',
            id_callback: events.register_alias('investor_table'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            register_export: {
                export_event_id: register_investor_export_id,
                title: 'Search Results',
                subtitle: 'CSV',
            },
            enable_selection: true,
            enable_column_toggle: true,
            column_toggle_css: {'fixed-column-toggle': true},
            enable_localstorage: true,
            enable_clear_order: true,
            clear_order_event: events.get('investor_clear_button'),
            columns: MarketInsightsHelper.investor_table_columns,
            datasource: investor_table_datasource,
            results_per_page: results_per_page,
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
                    visible: false,
                },
            ],
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
                    entity_type: 'investor',
                    datasource: {
                        type: 'observer',
                        event_type: events.get('selected_investors'),
                        default: [],
                    },
                },
            ],
        };

        const investors = {
            id: 'investors',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'investor_table',
            },
            components: [header, action_toolbar, investor_table],
        };

        const content = {
            id: 'content',
            component: DynamicWrapper,
            active_component: 'investors',
            set_active_event: events.get('mode_toggle'),
            components: [investors],
        };

        if (user_has_investor_contacts) {
            const contact_table_filters = {
                type: 'dynamic',
                query: {
                    name: {
                        type: 'observer',
                        event_type: events.get('contact_name_string'),
                        default: '',
                    },
                    investor_uid: {
                        type: 'observer',
                        event_type: events.get('contacts:investor_name_popover'),
                        mapping: inv_arr => inv_arr.map(inv => inv.uid),
                        default: [],
                    },
                    enums: {
                        type: 'observer',
                        event_type: events.get('contacts:enum_attributes'),
                    },
                    investor_position_type: {
                        type: 'observer',
                        event_type: events.get('contacts:investor_type'),
                        mapping: inv_pos => inv_pos.map(inv_p => inv_p.value),
                        default: [],
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: events.get('contacts:fund_size'),
                        default: [],
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: events.get('contacts:vintage_year'),
                        default: [],
                    },
                    investor_position_location: {
                        type: 'observer',
                        event_type: events.get('contacts:investor_position_location'),
                        default: [],
                    },
                },
            };

            const contact_table = this.new_instance(DataTable, {
                id: 'contact_table',
                id_callback: events.register_alias('contact_table'),
                css: {'table-light': true, 'table-sm': true},
                enable_selection: true,
                enable_column_toggle: true,
                enable_localstorage: true,
                enable_clear_order: true,
                clear_order_event: events.get('contact_clear_button'),
                columns: MarketInsightsHelper.investor_contact_table_columns,
                column_toggle_css: {'fixed-column-toggle': true},
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'investor_contacts',
                        filters: contact_table_filters,
                    },
                },
                results_per_page: results_per_page,
            });

            const _prepare_contacts_xls = DataThing.backends.useractionhandler({
                url: 'prepare_contacts_xls',
            });

            const export_contacts_xls = () => {
                const data = contact_table.get_query_params();
                _prepare_contacts_xls({
                    data: data,
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_file_base + key);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            };

            const contact_action_toolbar = {
                id: 'contact_action_toolbar',
                component: ActionHeader,
                template: 'tpl_action_toolbar',
                disable_export: true,
                buttons: [
                    {
                        id: 'export_contacts_xls_button',
                        id_callback: events.register_alias('export_contacts_xls_button'),
                        component: EventButton,
                        label: 'Export XLS',
                    },
                    {
                        id: 'list_contact',
                        component: AddToListButton,
                        label: 'Add To List <span class="glyphicon glyphicon-plus"></span>',
                        entity_type: 'investor_position',
                        datasource: {
                            type: 'observer',
                            event_type: events.get('selected_contacts'),
                            default: [],
                        },
                    },
                ],
            };

            Observer.register(events.get('export_contacts_xls_button'), export_contacts_xls);

            const contacts = {
                id: 'contacts',
                component: Aside,
                template: 'tpl_body',
                layout: {
                    header: 'header',
                    toolbar: 'contact_action_toolbar',
                    body: 'contact_table',
                },
                components: [header, contact_action_toolbar, contact_table],
            };

            content.components.push(contacts);
        }

        this.body = this.new_instance(Aside, {
            id: 'search_state',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'content'],
            },
            components: [cpanel, content],
        });

        this.when(this.body).done(() => {
            this.dfd.resolve();
        });
    }
}

export default InvestorSearch;
