import EditForm from 'src/libs/components/forms/EditForm';
import DeleteClientDataModal from 'src/libs/components/modals/DeleteClientDataModal';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import MetricTable from 'src/libs/components/MetricTable';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import PermissionGrantModal from 'src/libs/components/modals/PermissionGrantModal';
import AdvancedCreateUserModal from 'src/libs/components/modals/AdvancedCreateUserModal';
import EventButton from 'src/libs/components/basic/EventButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import CreateClientModal from 'src/libs/components/modals/CreateClientModal';
import ConfirmModal from 'src/libs/components/modals/ConfirmModal';
import Header from 'src/libs/components/commander/Header';
import ko from 'knockout';
import pager from 'pager';
import auth from 'auth';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ViewTokenModal from 'src/libs/components/modals/ViewTokenModal';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import DataSource from 'src/libs/DataSource';
import AddPortfolioCompanyModal from 'src/libs/components/modals/AddPortfolioCompanyModal';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import PermissionExpiryModal from 'src/libs/components/modals/PermissionExpiryModal';
import PublicKeyModal from 'src/libs/components/modals/PublicKeyModal';
import EditSSOEndpointModal from 'src/libs/components/modals/EditSSOEndpointModal';
import ShowSSOEndpointClientConfigModal from 'src/libs/components/modals/ShowSSOEndpointClientConfigModal';
import DeleteSSOEndpointModal from 'src/libs/components/modals/DeleteSSOEndpointModal';
import LoginPermissionCheck from 'src/libs/components/commander/login_permission_check';

import ClientBulkImport from 'src/react/components/client/ClientBulkImport';
import ReactWrapper from 'src/libs/components/ReactWrapper';

class ClientsVM extends Context {
    constructor() {
        super({
            id: 'clients',
        });

        this.dfd = this.new_deferred();

        this.token_modal = this.new_instance(ViewTokenModal, {});
        this.active_client_uid = ko.observable();
        this.show_reset_data = ko.observable();
        this.endpoints = {
            generate_token: DataThing.backends.commander({
                url: 'generate_token',
            }),
            set_client_disabled: DataThing.backends.commander({
                url: 'set_client_disabled',
            }),
            reset_client_data: DataThing.backends.commander({
                url: 'reset_client_assets',
            }),
            delete_reporting_relationship: DataThing.backends.commander({
                url: 'delete_reporting_relationship',
            }),
            clear_reporting_relationship_data: DataThing.backends.commander({
                url: 'clear_reporting_relationship_data',
            }),
            backfill_sender_metrics_from_recipient: DataThing.backends.commander({
                url: 'backfill_sender_metrics_from_recipient',
            }),
            grant_permission: DataThing.backends.commander({
                url: 'grant_permission',
            }),
            edit_permission: DataThing.backends.commander({
                url: 'update_permission_grant',
            }),
        };

        this.client_types = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                mapping: options => {
                    const client_types = {};
                    for (const {value, label} of options) {
                        client_types[value] = label;
                    }
                    return client_types;
                },
                query: {
                    target: 'commander:client_types',
                },
            },
        });

        const client_type_formatter = value => {
            const client_types = this.client_types.data();

            return client_types[value] || 'N/A';
        };

        this.ids = {
            search_clients: {
                table: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'search_clients',
                    'search_body',
                    'search_table',
                ),
                clear: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'search_clients',
                    'search_cpanel',
                    'clear',
                ),
            },
            show_client: {
                user_table: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'show_client',
                    'client_users',
                ),
                relationships_table: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'show_client',
                    'client_reporting_relationships',
                ),
            },
        };

        const events = this.new_instance(EventRegistry, {});
        events.new('page_state');
        events.new('client_uid');
        events.new('edit_sso_modal_save');

        events.resolve_and_add(
            'search_clients_data_table',
            'DataTable.counts',
            'search_clients_data_table_counts',
        );
        events.resolve_and_add(
            'search_clients_data_table',
            'DataTable.selected',
            'search_clients_data_table_selected',
        );
        events.resolve_and_add('search_clients_clear', 'EventButton');

        events.resolve_and_add('toggle_disabled', 'ToggleActionButton.action.disable', 'disable');
        events.resolve_and_add('toggle_disabled', 'ToggleActionButton.action.enable', 'enable');
        events.resolve_and_add('edit_client', 'ActionButton.action.edit');
        events.resolve_and_add('bulk_import_client', 'ActionButton.action.bulk_import_client');
        events.resolve_and_add('prompt_reset', 'Dropdown.value');

        events.new('clear_reset_dropdown', 'Dropdown.clear');
        events.new('confirm_reset_modal', 'Client.reset');
        events.new('confirm_delete_relationship', 'Client.confirm_delete_relationship');
        events.new('confirm_clear_relationship_data', 'Client.confirm_clear_relationship_data');
        events.new('confirm_backfill_sender_data', 'Client.confirm_backfill_sender_data');

        events.resolve_and_add(
            'relationship_actions',
            'ActionButtons.action.clear_relationship_data',
            'clear_relationship_data',
        );
        events.resolve_and_add(
            'relationship_actions',
            'ActionButtons.action.delete_relationship',
            'delete_relationship',
        );
        events.resolve_and_add(
            'relationship_actions',
            'ActionButtons.action.backfill_sender_data',
            'backfill_sender_data',
        );

        events.resolve_and_add(
            'enable_permission',
            'ToggleActionButton.action.enable_permission',
            'enable_permission',
        );
        events.resolve_and_add(
            'enable_all_permission',
            'ToggleActionButton.action.enable_permission',
            'enable_all_permission',
        );
        events.resolve_and_add('tab_event', 'RadioButtons.state');

        events.resolve_and_add('users_table', 'ActionButtons.action.archive', 'archive_users');
        events.resolve_and_add('users_table', 'ActionButtons.action.edit', 'edit_users');
        events.resolve_and_add(
            'users_table',
            'ActionButtons.action.generate_token',
            'generate_user_token',
        );

        events.new('edit_client_success');
        events.new('edit_client_cancel');

        events.resolve_and_add('string_filter', 'StringFilter.value');
        events.resolve_and_add('exclude_nameless', 'BooleanButton.state');
        events.resolve_and_add('has_valid_permissions', 'BooleanButton.state');
        events.resolve_and_add('show_disabled', 'BooleanButton.state');
        events.resolve_and_add('client_type', 'PopoverButton.value');
        events.resolve_and_add('permissions_filter', 'PopoverButton.value');

        this.client_data = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:client',
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        });

        this.search_table = {
            id: 'search_table',
            is_callback: events.register_alias('search_clients_data_table'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_column_toggle: true,
            enable_localstorage: true,
            enable_clear_order: true,
            enable_csv_export: true,
            results_per_page: 50,
            row_key: 'client_uid',
            columns: [
                {
                    sort_key: 'name',
                    label: 'Name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'clients/<client_uid>',
                        label_key: 'name',
                    },
                },
                {
                    key: 'client_type',
                    label: 'Type',
                    format: client_type_formatter,
                },
                {
                    key: 'disabled',
                    label: 'Disabled',
                    format: 'boolean',
                },
                {
                    key: 'disabled_date',
                    label: 'Disabled Date',
                    format: 'backend_local_datetime',
                    visible: false,
                },
                {
                    label: '# Users',
                    key: 'user_count',
                },
                {
                    key: 'valid_permission_count',
                    label: '# Valid Permissions',
                },
                {
                    key: 'valid_client_permission_count',
                    label: '# Valid Client Permissions',
                },
                {
                    key: 'valid_user_permission_count',
                    label: '# Valid User Permissions',
                },
                {
                    key: 'earliest_expiry',
                    label: 'Earliest Expiry',
                    format: 'backend_date',
                },
                {
                    key: 'latest_expiry',
                    label: 'Latest Expiry',
                    format: 'backend_date',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_local_datetime',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:clients',
                    results_per_page: 50,
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: events.get('string_filter'),
                            },
                            exclude_nameless: {
                                type: 'observer',
                                event_type: events.get('exclude_nameless'),
                                default: true,
                            },
                            has_valid_permissions: {
                                type: 'observer',
                                event_type: events.get('has_valid_permissions'),
                                default: true,
                            },
                            show_disabled: {
                                type: 'observer',
                                event_type: events.get('show_disabled'),
                                default: true,
                            },
                            client_type: {
                                type: 'observer',
                                event_type: events.get('client_type'),
                            },
                            permissions_filter: {
                                mapping: 'get',

                                type: 'observer',
                                event_type: events.get('permissions_filter'),
                            },
                        },
                    },
                },
            },
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            buttons: [
                {
                    id: 'create_client',
                    label: 'Create Client<span class="icon-plus"></span>',
                    action: 'create_client',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateClientModal,
                        id: 'create_client_modal',
                    },
                },
            ],
            data_table_id: this.ids.search_clients.table,
        };

        this.search_body = {
            component: Aside,
            id: 'search_body',
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_header, this.search_table],
        };

        this.search_cpanel = {
            component: Aside,
            id: 'search_cpanel',
            template: 'tpl_aside_control_panel',
            layout: {
                body: [
                    'string_filter',
                    'meta',
                    'filter_label',
                    'exclude_nameless',
                    'has_valid_permissions',
                    'show_disabled',
                    'client_type',
                    'permissions_filter',
                    'clear',
                ],
            },
            components: [
                {
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: events.register_alias('string_filter'),
                    clear_event: events.get('search_clients_clear'),
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
                    label: 'Clients',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: events.get('search_clients_data_table_counts'),
                    },
                },
                {
                    id: 'exclude_nameless',
                    id_callback: events.register_alias('exclude_nameless'),
                    component: BooleanButton,
                    default_state: true,
                    reset_event: events.get('search_clients_clear'),
                    template: 'tpl_boolean_button',
                    enable_localstorage: true,
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Exclude Nameless',
                },
                {
                    id: 'has_valid_permissions',
                    id_callback: events.register_alias('has_valid_permissions'),
                    reset_event: events.get('search_clients_clear'),
                    component: BooleanButton,
                    default_state: true,
                    external_state_change: events.get('permissions_filter'),
                    template: 'tpl_boolean_button',
                    enable_localstorage: true,
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Has Valid Permissions',
                },
                {
                    id: 'show_disabled',
                    id_callback: events.register_alias('show_disabled'),
                    reset_event: events.get('search_clients_clear'),
                    component: BooleanButton,
                    default_state: true,
                    template: 'tpl_boolean_button',
                    enable_localstorage: true,
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Show disabled',
                },
                {
                    id: 'client_type',
                    id_callback: events.register_alias('client_type'),
                    component: NewPopoverButton,
                    label: 'Client Type',
                    clear_event: events.get('search_clients_clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Client Type',
                        css_class: 'popover-default',
                    },
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'commander:client_types',
                            },
                        },
                    },
                },
                {
                    id: 'permissions_filter',
                    id_callback: events.register_alias('permissions_filter'),
                    component: NewPopoverButton,
                    label: 'Permissions',
                    clear_event: events.get('search_clients_clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Permissions Filter',
                        css_class: 'popover-default',
                    },
                    enable_localstorage: true,
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            key: 'results',
                            type: 'dynamic',
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
                    id_callback: events.register_alias('search_clients_clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_clients = {
            component: Aside,
            id: 'search_clients',
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_body, this.search_cpanel],
        };

        this.client_info = {
            id: 'client_info',
            component: MetricTable,
            css: {
                'table-light': true,
            },
            columns: 2,
            metrics: [
                {
                    label: 'Name',
                    value_key: 'name',
                },
                {
                    label: 'Client Type',
                    value_key: 'client_type',
                    format: client_type_formatter,
                },
                {
                    label: 'Last Sign In',
                    value_key: 'last_sign_in_date',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Last User to Sign In',
                    value_key: 'last_sign_in_email',
                },
                {
                    label: '# Users',
                    value_key: 'num_users',
                },
                {
                    value_key: 'disabled',
                    label: 'Disabled',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            no: 'text-green',
                            yes: 'text-danger',
                        },
                    },
                },
                {
                    value_key: 'disabled_date',
                    label: 'Disabled Date',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Created',
                    value_key: 'created',
                    format: 'backend_local_datetime',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:client',
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        this.sso_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:sso_endpoints',
                    results_per_page: 10,
                    filters: {
                        type: 'dynamic',
                        query: {
                            client_uid: {
                                type: 'observer',
                                event_type: events.get('client_uid'),
                                required: true,
                            },
                        },
                    },
                },
            },
        });

        this.sso = {
            id: 'sso',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Single Sign On (SSO)',
            columns: [
                {
                    label: 'Vanity Link',
                    key: 'vanity_link',
                },
                {
                    label: 'User Domain',
                    key: 'user_domain',
                },
                {
                    label: 'SAML',
                    key: 'supports_saml',
                    format: 'boolean',
                },
                {
                    label: 'OAuth',
                    key: 'supports_oauth2',
                    format: 'boolean',
                },
                {
                    label: 'Auto-Redirect',
                    component_callback: 'data',
                    component: {
                        template:
                            '' +
                            '<span data-bind="visible: data().auto_redirect_vanity_link">' +
                            'Vanity Link' +
                            '<span data-bind="visible: data().auto_redirect_user_domain || data().auto_redirect_ip">, </span>' +
                            '</span>' +
                            '<span data-bind="visible: data().auto_redirect_user_domain">' +
                            'User Domain' +
                            '<span data-bind="visible: data().auto_redirect_ip">, </span>' +
                            '</span>' +
                            '<span data-bind="visible: data().auto_redirect_ip">IP</span>',
                    },
                },
                {
                    label: 'Create Missing Users',
                    key: 'create_missing_users',
                    format: 'boolean',
                },
                {
                    label: 'SAML IdP URL',
                    key: 'idp_url',
                },
                {
                    label: 'OAuth Issuer',
                    key: 'oauth_issuer',
                },
                {
                    label: 'Actions',
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'view_idp_public_key_button',
                        component: ActionButtons,
                        template: 'tpl_action_buttons',
                        buttons: [
                            {
                                label: 'Show Keys',
                                css: {'btn-info': true, 'btn-xs': true},
                                action: 'view_idp_public_key',
                                trigger_modal: {
                                    component: PublicKeyModal,
                                    id: 'view_idp_public_key',
                                },
                            },
                            {
                                label: 'Show Client Config',
                                css: {'btn-info': true, 'btn-xs': true},
                                action: 'view_client_config',
                                trigger_modal: {
                                    component: ShowSSOEndpointClientConfigModal,
                                    id: 'view_client_config',
                                },
                            },
                            {
                                label: 'Edit',
                                css: {'btn-default': true, 'btn-xs': true},
                                action: 'edit_sso_endpoint',
                                trigger_modal: {
                                    component: EditSSOEndpointModal,
                                    id: 'edit_sso_endpoint',
                                    client_uid: this.active_client_uid,
                                    save_event: events.get('edit_sso_modal_save'),
                                },
                            },
                            {
                                label: 'Delete',
                                css: {'btn-danger': true, 'btn-xs': true},
                                action: 'delete_sso_endpoint',
                                trigger_modal: {
                                    component: DeleteSSOEndpointModal,
                                    id: 'delete_sso_endpoint',
                                    save_event: events.get('edit_sso_modal_save'),
                                },
                            },
                        ],
                    },
                },
            ],
            empty_template: '<div>No SSO Endpoints<br/><br/><div>',
            data: this.sso_datasource.data,
        };

        this.tabs = {
            id: 'tabs',
            id_callback: events.register_alias('tab_event'),
            default_state: 'client_permissions',
            component: RadioButtons,
            template: 'tpl_radio_buttons_tabs',
            button_css: {
                'btn-block': true,
                'btn-transparent': true,
            },
            buttons: [
                {
                    label: 'Existing Permissions',
                    state: 'client_permissions',
                    icon: {'icon-list-alt': true},
                },
                {
                    label: 'All Permissions',
                    state: 'all_permissions',
                    icon: {'icon-list-alt': true},
                },
            ],
        };

        this.permissions_columns = [
            {
                label: 'Permission',
                key: 'permission_name',
            },
            {
                label: 'Type',
                key: 'grant:is_client_permission',
                format: 'boolean',
                format_args: {
                    yes: 'Inherited',
                    no: 'User',
                },
            },
            {
                label: 'Why Invalid',
                key: 'grant:why_invalid',
                format: 'titleize',
            },
            {
                label: 'Expiry',
                key: 'grant:expiry',
                format: 'backend_local_datetime',
            },
            {
                label: 'Edit Expiry',
                width: '1%',
                component_callback: 'data',
                component: {
                    id: 'edit_expiry_action',
                    component: ActionButtons,
                    template: 'tpl_action_buttons',
                    buttons: [
                        {
                            label: 'Edit Expiry',
                            action: 'edit_grant_expiry',
                            trigger_modal: {
                                component: PermissionExpiryModal,
                                id: 'edit_grant_expiry',
                            },
                            css: {
                                'btn-xs': true,
                                'pull-right': true,
                                'btn-block': true,
                                'btn-cpanel-success': true,
                            },
                        },
                    ],
                },
            },
            {
                label: 'Created',
                key: 'grant:created',
                format: 'backend_local_datetime',
            },
        ];

        this.client_permissions_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user_or_client_permission_grants',
                    filters: {
                        type: 'dynamic',
                        query: {
                            include_inherited: true,
                            client_uid: {
                                type: 'observer',
                                event_type: events.get('client_uid'),
                                required: true,
                            },
                            display_all: false,
                        },
                    },
                },
            },
        });

        this.login_permission_check = {
            id: 'login_permission_check',
            component: LoginPermissionCheck,
            permissions: this.client_permissions_datasource.data,
            sso_endpoints: this.sso_datasource.data,
        };

        this.client_permissions = {
            id: 'client_permissions',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Permissions',
            results_per_page: 40,
            enable_column_toggle: true,
            empty_template: 'tpl_data_table_empty_with_label',
            row_key: 'permission_uid',
            columns: [
                ...this.permissions_columns,
                {
                    label: 'Enable/Disable',
                    component_callback: 'data',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    component: {
                        id: 'toggle_permission',
                        id_callback: events.register_alias('enable_permission'),
                        component: ToggleActionButton,
                        disabled_callback: row => {
                            return row.grant.is_user_permission;
                        },
                        labels: [
                            'Grant Permission <span class="icon-link-1"></span>',
                            'Withdraw Permission <span class="icon-unlink"></span>',
                        ],
                        actions: ['enable_permission', 'enable_permission'],
                        state_css: ['btn-cpanel-success', 'btn-warning'],
                        key: 'grant:enabled',
                        css: {
                            'btn-xs': true,
                            'pull-right': true,
                            'btn-block': true,
                        },
                    },
                },
            ],
            data: this.client_permissions_datasource.data,
        };

        this.all_permissions = {
            id: 'all_permissions',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Permissions',
            results_per_page: 40,
            enable_column_toggle: true,
            empty_template: 'tpl_data_table_empty_with_label',
            row_key: 'permission_uid',
            columns: [
                ...this.permissions_columns,
                {
                    label: 'Enable/Disable',
                    component_callback: 'data',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    component: {
                        id: 'toggle_permission',
                        id_callback: events.register_alias('enable_all_permission'),
                        component: ToggleActionButton,
                        disabled_callback: row => {
                            return row.grant.is_user_permission;
                        },
                        labels: [
                            'Grant Permission <span class="icon-link-1"></span>',
                            'Withdraw Permission <span class="icon-unlink"></span>',
                        ],
                        actions: ['enable_permission', 'enable_permission'],
                        state_css: ['btn-cpanel-success', 'btn-warning'],
                        key: 'grant:enabled',
                        css: {
                            'btn-xs': true,
                            'pull-right': true,
                            'btn-block': true,
                        },
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user_or_client_permission_grants',
                    filters: {
                        type: 'dynamic',
                        query: {
                            include_inherited: true,
                            client_uid: {
                                type: 'observer',
                                event_type: events.get('client_uid'),
                                required: true,
                            },
                            display_all: true,
                        },
                    },
                },
            },
        };

        this.permissions_wrapper = {
            component: DynamicWrapper,
            id: 'permissions_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'client_permissions',
            set_active_event: events.get('tab_event'),
            components: [this.client_permissions, this.all_permissions],
        };

        this.client_users = {
            id: 'client_users',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Users',
            enable_column_toggle: true,
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 25,
            columns: [
                {
                    label: 'Email',
                    sort_key: 'email',
                    format: 'contextual_link',
                    format_args: {
                        url: 'users/<uid>',
                        label_key: 'email',
                    },
                },
                {
                    key: 'name',
                    label: 'Name',
                },
                {
                    key: 'last_sign_in',
                    label: 'Last Sign In',
                    format: 'backend_local_datetime',
                },
                {
                    key: 'sign_in_count',
                    label: '# Sign Ins',
                },
                {
                    key: 'activated',
                    label: 'Activated',
                    format: 'boolean',
                },
                {
                    key: 'disabled',
                    label: 'Disabled',
                    format: 'boolean',
                },
                {
                    key: 'disabled_date',
                    label: 'Disabled date',
                    format: 'backend_date',
                },
                {
                    key: 'created',
                    label: 'Created',
                    format: 'backend_date',
                },
                {
                    label: 'Actions',
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'actions',
                        component: ActionButtons,
                        id_callback: events.register_alias('users_table'),
                        template: 'tpl_action_buttons',
                        buttons: [
                            {
                                label: 'Generate Token',
                                css: {'btn-info': true, 'btn-xs': true},
                                action: 'generate_token',
                            },
                            {
                                label: 'Edit',
                                css: {'btn-default': true, 'btn-xs': true},
                                action: 'edit',
                            },
                            // {
                            //     label: 'Archive',
                            //     css: { 'btn-danger': true, 'btn-xs': true },
                            //     action: 'archive',
                            // }
                        ],
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:users',
                    results_per_page: 25,
                    filters: {
                        type: 'dynamic',
                        query: {
                            client_uid: {
                                type: 'observer',
                                event_type: events.get('client_uid'),
                                required: true,
                            },
                        },
                    },
                },
            },
        };

        this.client_activity = {
            id: 'client_activity',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Activity',
            enable_column_toggle: true,
            results_per_page: 5,
            empty_template: 'tpl_data_table_empty_with_label',
            columns: [
                {
                    label: 'Email',
                    sort_key: 'email',
                    format: 'contextual_link',
                    format_args: {
                        url: 'users/<user_uid>',
                        label_key: 'email',
                    },
                },
                {
                    label: 'Action',
                    key: 'action_type',
                    format: 'titleize',
                },
                {
                    key: 'entity_type',
                    label: 'Entity',
                    format: 'entity_type',
                },
                {
                    label: 'Description',
                    key: 'description',
                },
                {
                    label: 'Date',
                    key: 'created',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'IP Address',
                    key: 'ip_address',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:client_activity',
                    results_per_page: 5,
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        this.client_cashflows = {
            id: 'client_cashflows',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Cash Flows',
            enable_column_toggle: false,
            inline_data: true,
            results_per_page: 5,
            empty_template: 'tpl_data_table_empty_with_label',
            columns: [
                {
                    label: 'Date',
                    key: 'date_str',
                    sort_key: 'date',
                },
                {
                    label: 'Count',
                    key: 'count',
                    format: 'number',
                },
                {
                    label: 'This month',
                    key: 'diff',
                    format: 'number',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:cashflow_stats_for_client',
                    results_per_page: 5,
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        this.client_reporting_relationships = {
            id: 'client_reporting_relationships',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Reporting Relationships',
            enable_column_toggle: false,
            inline_data: true,
            results_per_page: 5,
            empty_template: 'tpl_data_table_empty_with_label',
            columns: [
                {
                    sort_key: 'client_name',
                    label: 'Portfolio Company',
                    format: 'contextual_link',
                    format_args: {
                        url: 'clients/<client_uid>',
                        label_key: 'client_name',
                    },
                },
                {
                    label: 'Primary Contact',
                    key: 'contact_name',
                },
                {
                    label: 'Email',
                    key: 'contact_email',
                },
                {
                    label: 'Last reported',
                    key: 'last_reported',
                    format: 'backend_date',
                },
                {
                    label: 'Actions',
                    width: '1%',
                    component_callback: 'data',
                    component: {
                        id: 'actions',
                        id_callback: events.register_alias('relationship_actions'),
                        component: ActionButtons,
                        template: 'tpl_action_buttons',
                        buttons: [
                            {
                                label: 'Delete Relationship',
                                css: {'btn-danger': true, 'btn-xs': true},
                                action: 'delete_relationship',
                            },
                            {
                                label: 'Clear Data',
                                css: {'btn-warning': true, 'btn-xs': true},
                                action: 'clear_relationship_data',
                            },
                            {
                                label: 'Backfill PC Portal',
                                css: {'btn-info': true, 'btn-xs': true},
                                action: 'backfill_sender_data',
                            },
                        ],
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:reporting_relationships',
                    results_per_page: 5,
                    client_uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        const client_header_buttons = [
            {
                id: 'bulk_import',
                label: 'Bulk Import',
                id_callback: events.register_alias('bulk_import_client'),
                action: 'bulk_import_client',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-default': true,
                    'pull-right': true,
                },
            },
            {
                id: 'edit',
                label: 'Edit <span class="icon-wrench"></span>',
                id_callback: events.register_alias('edit_client'),
                action: 'edit',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-default': true,
                    'pull-right': true,
                },
            },
            {
                id: 'reset_asset_data',
                id_callback: events.register_alias('prompt_reset'),
                label: 'Reset Asset Data',
                component: NewDropdown,
                clear_event: events.get('clear_reset_dropdown'),
                allow_empty: false,
                inline: true,
                visible: this.show_reset_data,
                datasource: {
                    type: 'dynamic',
                    key: 'results',
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'client_uid',
                        label_key: 'name',
                    },
                    query: {
                        target: 'commander:clients',
                        order_by: [{name: 'name'}],
                        exclude_nameless: true,
                        data_reset_sources_only: true,
                    },
                },
            },
            {
                id: 'create_user',
                label: 'Create User <span class="icon-user-add"></span>',
                action: 'create_user',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-cpanel-success': true,
                    'pull-right': true,
                },
                trigger_modal: {
                    component: AdvancedCreateUserModal,
                    id: 'create_user_modal',
                },
                use_header_data: true,
            },
            {
                id: 'grant_permission',
                label: 'Grant Permission <span class="icon-lock-open"></span>',
                action: 'grant_permission',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-cpanel-success': true,
                    'pull-right': true,
                },
                trigger_modal: {
                    component: PermissionGrantModal,
                    current_permissions: {
                        filter_query: {
                            client_uid: {
                                type: 'observer',
                                event_type: events.get('client_uid'),
                                required: true,
                            },
                        },
                    },
                    id: 'grant_permission_modal',
                },
                use_header_data: true,
            },
            {
                id: 'create_sso_endpoint',
                label: 'Create SSO Endpoint <span class="icon-exchange"></span>',
                action: 'create_sso_endpoint',
                css: {
                    btn: true,
                    'btn-sm': true,
                    'btn-cpanel-success': true,
                    'pull-right': true,
                },
                trigger_modal: {
                    component: EditSSOEndpointModal,
                    id: 'create_sso_endpoint_modal',
                    create_new: true,
                    client_uid: this.active_client_uid,
                    save_event: events.get('edit_sso_modal_save'),
                },
            },
            {
                id: 'toggle_disabled',
                id_callback: events.register_alias('toggle_disabled'),
                component: ToggleActionButton,
                labels: [
                    'Disable Client <span class="icon-link-1"></span>',
                    'Enable Client <span class="icon-unlink"></span>',
                ],
                actions: ['disable', 'enable'],
                state_css: ['btn-danger', 'btn-cpanel-success'],
                key: 'disabled',
                css: {
                    'btn-sm': true,
                    'pull-right': true,
                },
                use_header_data: true,
            },
            {
                id: 'delete_client_data',
                action: 'delete_client_data',
                label: 'Delete Client Data',
                css: {
                    'btn-danger': true,
                    'btn-sm': true,
                },
                trigger_modal: {
                    component: DeleteClientDataModal,
                    id: 'delete_client_data_model',
                },
                use_header_data: true,
            },
        ];

        this.client_header = {
            id: 'client_header',
            component: Header,
            buttons: client_header_buttons,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:client',
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        const show_client_body = [
            'client_header',
            'client_info',
            'login_permission_check',
            'tabs',
            'permissions_wrapper',
            'sso',
            'client_users',
            'client_activity',
            'client_cashflows',
        ];

        const show_client_components = [
            this.client_header,
            this.client_info,
            this.login_permission_check,
            this.tabs,
            this.permissions_wrapper,
            this.sso,
            this.client_users,
            this.client_activity,
            this.client_cashflows,
        ];

        const add_portfolio_company_btn = {
            id: 'add_portfolio_company',
            label: 'Add Portfolio Company <span class="icon-plus"></span>',
            action: 'add_portfolio_company',
            css: {
                btn: true,
                'btn-sm': true,
                'btn-cpanel-info': true,
                'pull-right': true,
            },
            trigger_modal: {
                component: AddPortfolioCompanyModal,
                id: 'add_portfolio_company_modal',
            },
            hidden_callback: data => {
                const client_types = this.client_types.data();

                if (data && client_types) {
                    return client_types[data.client_type] == 'Portfolio Company';
                }

                return true;
            },
            use_header_data: true,
        };

        if (auth.user_has_features(['edit_reporting_relationships'])) {
            show_client_body.push('client_reporting_relationships');
            show_client_components.push(this.client_reporting_relationships);
            client_header_buttons.push(add_portfolio_company_btn);
        }

        this.show_client = {
            id: 'show_client',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: show_client_body,
            },
            components: show_client_components,
        };

        this.client_form = {
            id: 'client_form',
            component: EditForm,
            num_columns: 1,
            success_event: events.get('edit_client_success'),
            cancel_event: events.get('edit_client_cancel'),
            fields: [
                {
                    label: 'Name',
                    key: 'name',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'Name',
                    },
                },
                {
                    label: 'Client Type',
                    key: 'client_type',
                    input_type: 'filtered_dropdown',
                    input_options: {
                        label: 'Client Type',
                        btn_style: '',
                        btn_css: {
                            'btn-ghost-info': true,
                        },
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'commander:client_types',
                            },
                        },
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_client',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:client',
                    uid: {
                        type: 'observer',
                        event_type: events.get('client_uid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_client = {
            id: 'edit_client',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['client_form'],
            },
            components: [this.client_form],
        };

        this.bulk_import = {
            id: 'bulk_import',
            component: ReactWrapper,
            reactComponent: ClientBulkImport,
            props: ko.pureComputed(() => {
                const data = this.client_data.data();
                return {
                    clientData: data,
                };
            }),
            dependencies: [this.client_data.get_id()],
        };

        this.bulk_import_client = {
            id: 'bulk_import_client',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['bulk_import'],
            },
            components: [this.bulk_import],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_clients',
                set_active_event: events.get('page_state'),
                components: [
                    this.search_clients,
                    this.show_client,
                    this.edit_client,
                    this.bulk_import_client,
                ],
            },
            this.shared_components,
        );

        this.confirm_reset_data_modal = this.new_instance(ConfirmModal, {
            id: 'confirm_reset_data_modal',
            text:
                'GIANT ENORMOUS WARNING: All of the asset data (Funds, Portfolios, Companies, and everything else not related to Users) will be deleted and replaced. Are you SURE you want to do this?',
            confirm_event: events.get('confirm_reset_modal'),
            payload_from_data: true,
        });

        this.confirm_delete_relationship_modal = this.new_instance(ConfirmModal, {
            id: 'confirm_delete_relationship_modal',
            text:
                'This will delete the reporting relationship and all related data. Are you SURE you want to do this?',
            confirm_event: events.get('confirm_delete_relationship'),
            payload_from_data: true,
        });

        this.confirm_clear_relationship_data_modal = this.new_instance(ConfirmModal, {
            id: 'confirm_clear_relationship_data_modal',
            text:
                'This will clear all submissions, data requests and analytics data for the relationship. It will also clear uploaded spreadsheets and notifications for the portfolio company. Are you SURE you want to do this?',
            confirm_event: events.get('confirm_clear_relationship_data'),
            payload_from_data: true,
        });

        this.confirm_backfill_sender_data_modal = this.new_instance(ConfirmModal, {
            id: 'confirm_backfill_sender_data_modal',
            text:
                'This will copy ALL metric data from the GP company to the portfolio company portal. Are you SURE you want to do this?',
            confirm_event: events.get('confirm_backfill_sender_data'),
            payload_from_data: true,
        });

        this.handle_url = url => {
            if (url.length === 1) {
                Observer.broadcast(events.get('page_state'), 'search_clients');
                Observer.broadcast(events.get('client_uid'), undefined);
                this.current_client_uid = undefined;
            } else if (url.length === 2) {
                Observer.broadcast(events.get('page_state'), 'show_client');
                Observer.broadcast(events.get('client_uid'), url[1], true);
                this.active_client_uid(url[1]);
                this.current_client_uid = url[1];
            } else if (url.length === 3 && url[2] === 'edit') {
                Observer.broadcast(events.get('page_state'), 'edit_client');
                Observer.broadcast(events.get('client_uid'), url[1], true);
                this.current_client_uid = url[1];
            } else if (url.length === 3 && url[2] === 'bulk-import') {
                Observer.broadcast(events.get('page_state'), 'bulk_import_client');
                Observer.broadcast(events.get('client_uid'), url[1], true);
                this.current_client_uid = url[1];
            }
        };

        this.handle_permissions = row_selected => {
            if (row_selected.grant.created) {
                this.endpoints.edit_permission({
                    data: {
                        client_uid: this.current_client_uid,
                        disabled: row_selected.grant.enabled,
                        permission_uid: row_selected.permission_uid,
                        permission_grant_uid: row_selected.grant.uid,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            } else {
                this.endpoints.grant_permission({
                    data: {
                        client_uid: this.current_client_uid,
                        disabled: !row_selected.grant.enabled,
                        permission_uid: row_selected.permission_uid,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            }
        };

        this.when(this.page_wrapper, this.client_data).done(() => {
            Observer.register_hash_listener('clients', this.handle_url);

            Observer.register_many(
                [events.get('edit_client_cancel'), events.get('edit_client_success')],
                () => {
                    DataThing.status_check();
                    window.history.back();
                },
            );

            Observer.register(events.get('edit_client'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(events.get('bulk_import_client'), () => {
                pager.navigate(`${window.location.hash}/bulk-import`);
            });

            Observer.register(events.get('edit_users'), data => {
                pager.navigate(['#!/users', data.uid, 'edit'].join('/'));
            });

            Observer.register(events.get('archive_users'), () => {
                alert('Archive is not implemented yet!');
            });

            Observer.register(events.get('generate_user_token'), user => {
                this.endpoints.generate_token({
                    data: {user_uid: user.uid},
                    success: DataThing.api.XHRSuccess(token => {
                        this.token_modal.data(token);
                        this.token_modal.show();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('clear_relationship_data'), relationship => {
                this.confirm_clear_relationship_data_modal.data(relationship);
                this.confirm_clear_relationship_data_modal.show();
            });

            Observer.register(events.get('confirm_clear_relationship_data'), relationship => {
                this.endpoints.clear_reporting_relationship_data({
                    data: {relationship_uid: relationship.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            Observer.register(events.get('backfill_sender_data'), relationship => {
                this.confirm_backfill_sender_data_modal.data(relationship);
                this.confirm_backfill_sender_data_modal.show();
            });

            Observer.register(events.get('confirm_backfill_sender_data'), relationship => {
                this.endpoints.backfill_sender_metrics_from_recipient({
                    data: {relationship_uid: relationship.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            Observer.register(events.get('delete_relationship'), relationship => {
                this.confirm_delete_relationship_modal.data(relationship);
                this.confirm_delete_relationship_modal.show();
            });

            Observer.register(events.get('confirm_delete_relationship'), relationship => {
                this.endpoints.delete_reporting_relationship({
                    data: {relationship_uid: relationship.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            Observer.register(events.get('enable'), client => {
                this.endpoints.set_client_disabled({
                    data: {uid: client.uid, disabled: false},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('disable'), client => {
                this.endpoints.set_client_disabled({
                    data: {uid: client.uid, disabled: true},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('enable_permission'), payload => {
                this.handle_permissions(payload);
            });

            Observer.register(events.get('enable_all_permission'), payload => {
                this.handle_permissions(payload);
            });

            Observer.register(events.get('prompt_reset'), uid => {
                if (uid) {
                    this.confirm_reset_data_modal.data(uid);
                    this.confirm_reset_data_modal.show();
                } else {
                    this.confirm_reset_data_modal.data(undefined);
                }
            });

            Observer.register(events.get('confirm_reset_modal'), selection => {
                let selected_source_uid = selection.value;
                let active_client_uid = this.active_client_uid();

                this.endpoints.reset_client_data({
                    data: {
                        source_client_uid: selected_source_uid,
                        target_client_uid: active_client_uid,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        Observer.broadcast(events.get('clear_reset_dropdown'));
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('edit_sso_modal_save'), () => {
                this.sso_datasource.refresh_data(true);
            });

            this.client_data.data.subscribe(data => {
                if (data) {
                    this.show_reset_data(data.data_reset_target);
                }
            });

            this.dfd.resolve();
        });
    }
}

export default ClientsVM;
