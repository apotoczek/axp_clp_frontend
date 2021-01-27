/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import DataTable from 'src/libs/components/basic/DataTable';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import EventButton from 'src/libs/components/basic/EventButton';
import StateHandler from 'src/libs/components/basic/StateHandler';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import PopoverSavedSearches from 'src/libs/components/popovers/PopoverSavedSearches';
import PopoverSaveSearches from 'src/libs/components/popovers/PopoverSaveSearches';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import AddToListButton from 'src/libs/components/AddToListButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_market_insights_body';

    self.successful_delete_event = Utils.gen_event(
        'SavedStates.delete_success',
        self.get_id(),
        'search_state',
    );
    self.clear_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'search_state',
        'cpanel',
        'clear_button',
    );
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );

    self.get_state_events = function(load_event) {
        if (load_event) {
            return [
                Utils.gen_event(load_event, self.get_id(), 'search_state', 'cpanel', 'name'),
                Utils.gen_event(load_event, self.get_id(), 'search_state', 'cpanel', 'fund_size'),
                Utils.gen_event(load_event, self.get_id(), 'search_state', 'cpanel', 'location'),
                Utils.gen_event(load_event, self.get_id(), 'search_state', 'cpanel', 'status'),
                Utils.gen_event(
                    load_event,
                    self.get_id(),
                    'search_state',
                    'cpanel',
                    'enum_attributes',
                ),
            ];
        }

        return [
            Utils.gen_event('StringFilter.value', self.get_id(), 'search_state', 'cpanel', 'name'),
            Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'search_state',
                'cpanel',
                'fund_size',
            ),
            Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'search_state',
                'cpanel',
                'location',
            ),
            Utils.gen_event(
                'PopoverButton.value',
                self.get_id(),
                'search_state',
                'cpanel',
                'status',
            ),
            Utils.gen_event(
                'AttributeFilters.state',
                self.get_id(),
                'search_state',
                'cpanel',
                'enum_attributes',
            ),
        ];
    };

    self.cpanel_components = [
        {
            component: MetaInfo,
            id: 'meta_info',
            label: 'Results',
            format: 'number',
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.count',
                    self.get_id(),
                    'search_state',
                    'content',
                    'table',
                ),
            },
        },
        {
            id: 'save_button',
            component: NewPopoverButton,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
                title: 'Save Search',
            },
            icon_css: 'glyphicon glyphicon-save',
            label: 'Save',
            popover_config: {
                id: 'save',
                component: PopoverSaveSearches,
                type: 'firmsearch',
            },
        },
        {
            id: 'load_button',
            component: NewPopoverButton,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
                title: 'Load Search',
            },
            icon_css: 'glyphicon glyphicon-share-alt',
            label: 'Load',
            popover_config: {
                id: 'load',
                component: PopoverSavedSearches,
                type: 'firmsearch',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'states:saved',
                    },
                },
            },
        },
        {
            id: 'save_and_load_label',
            component: Label,
            template: 'tpl_cpanel_label',
            label: 'Save/Load',
        },
        {
            id: 'search_label',
            component: Label,
            template: 'tpl_cpanel_label',
            css: {'first-header': true},
            label: 'Search',
        },
        {
            id: 'name',
            component: StringFilter,
            template: 'tpl_string_filter',
            clear_event: Utils.gen_event(
                'EventButton',
                self.get_id(),
                'search_state',
                'cpanel',
                'clear_button',
            ),
            enable_localstorage: true,
            placeholder: 'Name...',
            set_state_event_type: 'StateHandler.load',
            cpanel_style: true,
        },
        {
            id: 'save_and_load',
            component: StateHandler,
            component_events: self.get_state_events(),
            save_state_event: Utils.gen_event(
                'PopoverSaveSearches.save',
                self.get_id(),
                'search_state',
                'cpanel',
                'save_button',
                'save',
            ),
            load_state_event: Utils.gen_event(
                'PopoverSavedSearches.load',
                self.get_id(),
                'search_state',
                'cpanel',
                'load_button',
                'load',
            ),
            delete_state_event: Utils.gen_event(
                'PopoverSavedSearches.delete',
                self.get_id(),
                'search_state',
                'cpanel',
                'load_button',
                'load',
            ),
            load_events: self.get_state_events('StateHandler.load'),
            successful_delete_event: self.successful_delete_event,
            type: 'firmsearch',
        },
        {
            id: 'filter_label',
            component: Label,
            template: 'tpl_cpanel_label',
            label: 'Filters',
        },
        {
            id: 'clear_button',
            component: EventButton,
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear All',
        },
        {
            id: 'fund_size',
            component: NewPopoverButton,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
                title: 'Fund Size',
            },
            icon_css: 'glyphicon glyphicon-plus',
            enable_localstorage: true,
            label: 'Fund Size',
            clear_event: self.clear_event,
            set_state_event_type: 'StateHandler.load',
            popover_config: {
                component: PopoverRange,
                template: 'tpl_popover_range',
                prefix: 'USD',
                suffix: 'MM',
            },
        },
        {
            id: 'enum_attributes',
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
            enable_localstorage: true,
            clear_event: self.clear_event,
            component: AttributeFilters,
            set_state_event_type: 'StateHandler.load',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    exclude_enums: ['vertical', 'status', 'gics'],
                },
            },
        },
        {
            component: NewPopoverButton,
            id: 'status',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
                title: 'Filter by Status',
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: self.clear_event,
            label: 'Status',
            enable_localstorage: true,
            set_state_event_type: 'StateHandler.load',
            popover_config: {
                component: Checklist,
                enable_exclude: true,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'enums',
                        enum_type: 'status',
                    },
                },
            },
        },
        {
            id: 'location',
            component: NewPopoverButton,
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
            clear_event: self.clear_event,
            label: 'Primary Location',
            set_state_event_type: 'StateHandler.load',
            enable_localstorage: true,
            popover_config: {
                component: PopoverLocationSearch,
                placement: 'right',
            },
        },
    ];

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Firms',
        title_css: 'performance-calculator',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: [
                'search_label',
                'name',
                'meta_info',
                'save_and_load_label',
                'save_button',
                'load_button',
                'filter_label',
                'enum_attributes',
                'status',
                'fund_size',
                'location',
                'clear_button',
            ],
        },
        components: self.cpanel_components,
    };

    // self.cpanel = {
    //     id: 'cpanel',
    //     component: Aside,
    //     template: 'tpl_cpanel',
    //     layout: {
    //         header: 'name',
    //         body: [
    //             'meta_info',
    //             'save_and_load_label',
    //             'save_button',
    //             'load_button',
    //             'filter_label',
    //             'fund_size',
    //             'geography',
    //             'style',
    //             'sector',
    //             'location',
    //             'status',
    //             'clear_button'
    //         ]
    //     },
    //     components: self.cpanel_components
    // }

    self.table_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:firms',
            filters: {
                type: 'dynamic',
                query: {
                    name: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'StringFilter.value',
                            self.get_id(),
                            'search_state',
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
                            'search_state',
                            'cpanel',
                            'enum_attributes',
                        ),
                    },
                    locations: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'search_state',
                            'cpanel',
                            'location',
                        ),
                        default: [],
                    },
                    status: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'search_state',
                            'cpanel',
                            'status',
                        ),
                        default: [],
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'search_state',
                            'cpanel',
                            'fund_size',
                        ),
                        default: [],
                    },
                },
            },
        },
    };

    self.table = {
        id: 'table',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Search Results',
            subtitle: 'CSV',
        },
        enable_selection: true,
        enable_column_toggle: true,
        enable_localstorage: true,
        clear_order_event: self.clear_event,
        columns: MarketInsightsHelper.firm_table_columns,
        datasource: self.table_datasource,
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

    self.button_event = Utils.gen_event('Buttons.list', self.get_id());

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        // components:[
        //     self.breadcrumb,
        // ],
        items: [
            {
                label: 'Firms',
            },
            {
                label: 'Search',
            },
        ],
    };

    self.header = {
        id: 'header',
        component: BreadcrumbHeader,
        template: 'tpl_breadcrumb_header',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
        valid_export_features: ['download_market_data'],
    };

    self.action_toolbar = {
        component: ActionHeader,
        id: 'action_toolbar',
        template: 'tpl_action_toolbar',
        valid_export_features: ['download_market_data'],
        buttons: [
            {
                id: 'list',
                component: AddToListButton,
                label: 'Add To List <span class="glyphicon glyphicon-plus"></span>',
                entity_type: 'firm',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.selected',
                        self.get_id(),
                        'search_state',
                        'content',
                        'table',
                    ),
                    default: [],
                },
            },
        ],
    };

    self.content_components = [self.header, self.action_toolbar, self.table];

    self.content = {
        id: 'content',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'table',
        },
        components: self.content_components,
    };

    self.body_components = [self.cpanel, self.content];

    self.body = self.new_instance(Aside, {
        id: 'search_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['cpanel', 'content'],
        },
        components: self.body_components,
    });

    self._save_to_list = DataThing.backends.useractionhandler({
        url: 'add_entities_to_list',
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();

        let selected = ko.observable();
        Observer.register_for_id(
            self.body.components.content.components.table.get_id(),
            'DataTable.selected',
            selected,
        );

        let get_entities = function() {
            let entities = [];

            for (let i = 0, j = selected().length; i < j; i++) {
                entities.push({
                    uid: selected()[i].uid,
                    entity_type: 'firm',
                });
            }

            return entities;
        };

        Observer.register(self.button_event, list_uid => {
            self._save_to_list({
                data: {
                    uid: list_uid,
                    entities: get_entities(),
                },
                success: DataThing.api.XHRSuccess(() => {}),
                error: DataThing.api.XHRError(() => {}),
            });
        });
    });

    return self;
}
