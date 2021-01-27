/* Automatically transformed from AMD to ES6. Beware of code smell. */
import EventButton from 'src/libs/components/basic/EventButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import Header from 'src/libs/components/commander/Header';
import DeletePermissionGrantModal from 'src/libs/components/modals/DeletePermissionGrantModal';
import PermissionGrantModal from 'src/libs/components/modals/PermissionGrantModal';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

export default function() {
    let self = new Context({
        id: 'permissions',
    });

    self.dfd = self.new_deferred();

    self.ids = {
        search_permissions: {
            table: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_permissions',
                'search_body',
                'search_table',
            ),
            clear: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_permissions',
                'search_cpanel',
                'clear',
            ),
        },
    };

    self.events = {
        page_state: Utils.gen_event(self.get_id(), 'Permissions.state'),
        permission_uid: Utils.gen_event(self.get_id(), 'Permissions.uid'),
        search_permissions: {
            data_table_counts: Utils.gen_event(
                'DataTable.counts',
                self.ids.search_permissions.table,
            ),
            clear: Utils.gen_event('EventButton', self.ids.search_permissions.clear),
        },
    };

    self.search_table = {
        id: 'search_table',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        enable_selection: true,
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        enable_csv_export: true,
        results_per_page: 50,
        columns: [
            {
                sort_key: 'user:email',
                label: 'User',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<user:uid>',
                    label_key: 'user:email',
                },
            },
            {
                sort_key: 'client:name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client:uid>',
                    label_key: 'client:name',
                },
            },
            {
                label: 'Permission',
                key: 'permission:name',
            },
            {
                label: 'Valid',
                key: 'valid',
                format: 'boolean_highlight',
                format_args: {
                    css: {
                        yes: 'text-green',
                    },
                },
            },
            {
                label: 'Why Invalid',
                key: 'why_invalid',
                format: 'titleize',
            },
            {
                label: 'Expiry',
                key: 'expiry',
                format: 'backend_local_datetime',
            },
            {
                label: 'Disabled',
                key: 'disabled',
                format: 'boolean',
            },
            {
                label: 'Created',
                key: 'created',
                format: 'backend_local_datetime',
            },
            {
                label: 'Actions',
                component_callback: 'data',
                width: '1%',
                always_visible: true,
                component: {
                    id: 'actions',
                    component: ActionButtons,
                    buttons: [
                        {
                            action: 'edit',
                            label: 'Edit',
                            css: {
                                'btn-default': true,
                                'btn-xs': true,
                            },
                            trigger_modal: {
                                component: PermissionGrantModal,
                            },
                        },
                        {
                            action: 'delete',
                            label: 'Delete',
                            css: {
                                'btn-danger': true,
                                'btn-xs': true,
                            },
                            trigger_modal: {
                                component: DeletePermissionGrantModal,
                            },
                        },
                    ],
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:permission_grants',
                results_per_page: 50,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_permissions',
                                'search_cpanel',
                                'string_filter',
                            ),
                        },
                        exclude_invalid: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'BooleanButton.state',
                                self.get_id(),
                                'page_wrapper',
                                'search_permissions',
                                'search_cpanel',
                                'exclude_invalid',
                            ),
                            default: true,
                        },
                        expiry: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_permissions',
                                'search_cpanel',
                                'expiry',
                            ),
                        },
                        created: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_permissions',
                                'search_cpanel',
                                'created',
                            ),
                        },
                        permission_uid: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_permissions',
                                'search_cpanel',
                                'permission',
                            ),
                        },
                    },
                },
            },
        },
    };

    self.search_header = {
        id: 'search_header',
        component: Header,
        buttons: [],
        data_table_id: self.ids.search_permissions.table,
    };

    self.search_body = {
        component: Aside,
        id: 'search_body',
        template: 'tpl_aside_main_content',
        layout: {
            body: ['search_header', 'search_table'],
        },
        components: [self.search_header, self.search_table],
    };

    self.search_cpanel = {
        component: Aside,
        id: 'search_cpanel',
        template: 'tpl_aside_control_panel',
        layout: {
            body: [
                'string_filter',
                'meta',
                'filter_label',
                'exclude_invalid',
                'expiry',
                'created',
                'permission',
                'clear',
            ],
        },
        components: [
            {
                id: 'string_filter',
                component: StringFilter,
                clear_event: self.events.search_permissions.clear,
                placeholder: 'Search...',
            },
            {
                id: 'filter_label',
                html: '<h3>Filters</h3>',
                component: HTMLContent,
            },
            {
                id: 'meta',
                component: MetaInfo,
                label: 'Grants',
                format: 'visible_count',
                css: {
                    'meta-primary': true,
                    'match-btn-sm': true,
                },
                datasource: {
                    type: 'observer',
                    event_type: self.events.search_permissions.data_table_counts,
                },
            },
            {
                id: 'exclude_invalid',
                component: BooleanButton,
                default_state: true,
                template: 'tpl_boolean_button',
                reset_event: self.events.search_permissions.clear,
                btn_css: {
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                enable_localstorage: true,
                label: 'Exclude Invalid',
            },
            {
                id: 'expiry',
                component: NewPopoverButton,
                label: 'Expiry',
                clear_event: self.events.search_permissions.clear,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    css_class: 'popover-default',
                    placement: 'right',
                    title: 'Expiry',
                },
                enable_localstorage: true,
                popover_config: {
                    component: PopoverInputRange,
                    mode: 'date',
                    min: {
                        placeholder: 'Min Date',
                    },
                    max: {
                        placeholder: 'Max Date',
                    },
                },
            },
            {
                id: 'created',
                component: NewPopoverButton,
                label: 'Created',
                clear_event: self.events.search_permissions.clear,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    css_class: 'popover-default',
                    placement: 'right',
                    title: 'Created',
                },
                enable_localstorage: true,
                popover_config: {
                    component: PopoverInputRange,
                    mode: 'date',
                    min: {
                        placeholder: 'Min Date',
                    },
                    max: {
                        placeholder: 'Max Date',
                    },
                },
            },
            {
                id: 'permission',
                component: NewPopoverButton,
                label: 'Permission',
                clear_event: self.events.search_permissions.clear,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    css_class: 'popover-default',
                    placement: 'right',
                    title: 'Permission',
                },
                enable_localstorage: true,
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'dynamic',
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'commander:permissions',
                            results_per_page: 'all',
                        },
                    },
                },
            },
            {
                id: 'clear',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Restore Defaults',
            },
        ],
    };

    self.search_permissions = {
        component: Aside,
        id: 'search_permissions',
        template: 'tpl_aside_body',
        layout: {
            body: ['search_cpanel', 'search_body'],
        },
        components: [self.search_body, self.search_cpanel],
    };

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_permissions',
            set_active_event: self.events.page_state,
            components: [
                self.search_permissions,
                // self.show_client,
                // self.edit_client,
            ],
        },
        self.shared_components,
    );

    self.handle_url = function(url) {
        if (url.length === 1) {
            Observer.broadcast(self.events.page_state, 'search_permissions');
            // Observer.broadcast(self.events.permis, undefined);
        }
        // else if(url.length === 2) {
        //     Observer.broadcast(self.events.page_state, 'show_client');
        //     Observer.broadcast(self.events.client_uid, url[1]);
        // } else if(url.length === 3 && url[2] === 'edit') {
        //     Observer.broadcast(self.events.page_state, 'edit_client');
        //     Observer.broadcast(self.events.client_uid, url[1]);
        // }
    };

    self.when(self.page_wrapper).done(() => {
        Observer.register_hash_listener('permissions', self.handle_url);

        self.dfd.resolve();
    });

    return self;
}
