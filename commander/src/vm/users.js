import EditForm from 'src/libs/components/forms/EditForm';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import MetricTable from 'src/libs/components/MetricTable';
import ResetMFAModal from 'src/libs/components/modals/ResetMFAModal';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import PermissionGrantModal from 'src/libs/components/modals/PermissionGrantModal';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import MetaInfo from 'src/libs/components/MetaInfo';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import Aside from 'src/libs/components/basic/Aside';
import AdvancedCreateUserModal from 'src/libs/components/modals/AdvancedCreateUserModal';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import Header from 'src/libs/components/commander/Header';
import pager from 'pager';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ViewTokenModal from 'src/libs/components/modals/ViewTokenModal';
import DataSource from 'src/libs/DataSource';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Checklist from 'src/libs/components/basic/Checklist';
import PermissionExpiryModal from 'src/libs/components/modals/PermissionExpiryModal';
import LoginPermissionCheck from 'src/libs/components/commander/login_permission_check';

class UsersVM extends Context {
    constructor() {
        super({
            id: 'users',
        });

        this.dfd = this.new_deferred();
        this.token_modal = this.new_instance(ViewTokenModal, {});

        this.endpoints = {
            generate_token: DataThing.backends.commander({
                url: 'generate_token',
            }),
            disable_token: DataThing.backends.commander({
                url: 'disable_token',
            }),
            set_user_disabled: DataThing.backends.commander({
                url: 'set_user_disabled',
            }),
            grant_permission: DataThing.backends.commander({
                url: 'grant_permission',
            }),
            edit_permission: DataThing.backends.commander({
                url: 'update_permission_grant',
            }),
        };

        this.ids = {
            search_users: {
                table: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'search_users',
                    'search_body',
                    'search_table',
                ),
                clear: Utils.gen_id(
                    this.get_id(),
                    'page_wrapper',
                    'search_users',
                    'search_cpanel',
                    'clear',
                ),
            },
        };

        let events = this.new_instance(EventRegistry, {});
        events.new('page_state');
        events.new('user_uid');

        events.resolve_and_add(
            'search_users_data_table',
            'DataTable.counts',
            'search_users_data_table_counts',
        );
        events.resolve_and_add(
            'search_users_data_table',
            'DataTable.selected',
            'search_users_data_table_selected',
        );

        events.resolve_and_add('search_users_clear', 'EventButton');

        events.new('edit_user_success');
        events.new('edit_user_cancel');

        events.resolve_and_add('edit_user', 'ActionButton.action.edit');
        events.resolve_and_add('toggle_disabled', 'ToggleActionButton.action.disable', 'disable');
        events.resolve_and_add('toggle_disabled', 'ToggleActionButton.action.enable', 'enable');
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
        events.resolve_and_add('generate_token', 'ActionButton.action.generate_token');
        events.resolve_and_add('view_token_link', 'ActionButtons.action.view_link');
        events.resolve_and_add('disable_token', 'ActionButtons.action.disable');

        events.resolve_and_add('string_filter', 'StringFilter.value');
        events.resolve_and_add('activated', 'BooleanButton.state');
        events.resolve_and_add('client_name', 'StringFilter.value');
        events.resolve_and_add('last_sign_in', 'PopoverButton.value');
        events.resolve_and_add('activated_date', 'PopoverButton.value');
        events.resolve_and_add('created', 'PopoverButton.value');
        events.resolve_and_add('has_valid_permissions', 'BooleanButton.state');
        events.resolve_and_add('show_disabled', 'BooleanButton.state');
        events.resolve_and_add('permissions_filter', 'PopoverButton.value');
        events.resolve_and_add('exclude_client_permissions', 'BooleanButton.state');

        this.search_table = {
            id: 'search_table',
            id_callback: events.register_alias('search_users_data_table'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            enable_localstorage: true,
            enable_csv_export: true,
            enable_clear_order: true,
            results_per_page: 50,
            clear_order_event: events.get('search_users_clear'),
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
                    key: 'title',
                    label: 'Title',
                    visible: false,
                },
                {
                    sort_key: 'client_name',
                    label: 'Client',
                    format: 'contextual_link',
                    format_args: {
                        url: 'clients/<client_uid>',
                        label_key: 'client_name',
                    },
                },
                {
                    key: 'last_sign_in',
                    label: 'Last Sign In',
                    format: 'backend_local_datetime',
                },
                {
                    key: 'activated',
                    label: 'Activated',
                    format: 'boolean',
                },
                {
                    key: 'activated_date',
                    label: 'Activated Date',
                    format: 'backend_local_datetime',
                    visible: false,
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
                    key: 'valid_permission_count',
                    label: '# Valid Permissions',
                    visible: false,
                },
                {
                    key: 'sign_in_count',
                    label: '# Sign Ins',
                    visible: false,
                },
                {
                    key: 'created',
                    label: 'Created',
                    format: 'backend_date',
                    visible: false,
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:users',
                    results_per_page: 50,
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: events.get('string_filter'),
                            },
                            activated: {
                                type: 'observer',
                                event_type: events.get('activated'),
                                default: true,
                            },
                            client_name: {
                                type: 'observer',
                                event_type: events.get('client_name'),
                            },
                            last_sign_in: {
                                type: 'observer',
                                event_type: events.get('last_sign_in'),
                            },
                            activated_date: {
                                type: 'observer',
                                event_type: events.get('activated_date'),
                            },
                            created: {
                                type: 'observer',
                                event_type: events.get('created'),
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
                            permissions_filter: {
                                mapping: 'get',
                                type: 'observer',
                                event_type: events.get('permissions_filter'),
                            },
                            exclude_clients: {
                                type: 'observer',
                                event_type: events.get('exclude_client_permissions'),
                                default: false,
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
                    id: 'disable',
                    id_callback: events.register_alias('disable'),
                    label: 'Disable Users<span class="icon-users"></span>',
                    action: 'disable',
                    disabled_callback: users => users.length < 1,
                    use_header_data: true,
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        to_delete_table_columns: [
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                label: 'Email',
                                key: 'email',
                            },
                            {
                                label: 'Client',
                                key: 'client_name',
                            },
                            {
                                label: 'Last sign in',
                                key: 'last_sign_in',
                                format: 'backend_date',
                            },
                        ],
                        component: DeleteMultiple,
                        endpoint: 'set_users_disabled',
                        warning_text:
                            "<span class='text-danger'><strong>Note: </strong>This action will disable all the selected users.</span>",
                        button_text: 'Disable',
                        id: 'disable_multiple_users',
                    },
                    datasource: {
                        type: 'observer',
                        default: [],
                        event_type: events.get('search_users_data_table_selected'),
                    },
                },
                {
                    id: 'create',
                    label: 'Create User<span class="icon-user-add"></span>',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: AdvancedCreateUserModal,
                        id: 'create_user_modal',
                    },
                },
            ],
            data_table_id: this.ids.search_users.table,
        };

        this.search_body = {
            component: Aside,
            id: 'search_body',
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_table, this.search_header],
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
                    'client_name',
                    'activated',
                    'activated_date',
                    'last_sign_in',
                    'created',
                    'has_valid_permissions',
                    'show_disabled',
                    'permissions_filter',
                    'exclude_client_permissions',
                    'clear',
                ],
            },
            components: [
                {
                    id: 'filter_label',
                    html: '<h3>Filters</h3>',
                    component: HTMLContent,
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Users',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: events.get('search_users_data_table_counts'),
                    },
                },
                {
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: events.register_alias('string_filter'),
                    clear_event: events.get('search_users_clear'),
                    placeholder: 'Search...',
                    enable_localstorage: true,
                },
                {
                    id: 'client_name',
                    id_callback: events.register_alias('client_name'),
                    component: StringFilter,
                    clear_event: events.get('search_users_clear'),
                    enable_localstorage: true,
                    placeholder: 'Client Name...',
                },
                {
                    id: 'activated',
                    id_callback: events.register_alias('activated'),
                    reset_event: events.get('search_users_clear'),
                    component: BooleanButton,
                    default_state: true,
                    template: 'tpl_boolean_button',
                    enable_localstorage: true,
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Activated',
                },
                {
                    id: 'activated_date',
                    id_callback: events.register_alias('activation_date'),
                    component: NewPopoverButton,
                    label: 'Activated Date',
                    clear_event: events.get('search_users_clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Activated Date',
                        css_class: 'popover-default',
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
                    id: 'last_sign_in',
                    id_callback: events.register_alias('last_sign_in'),
                    component: NewPopoverButton,
                    label: 'Last Sign In',
                    clear_event: events.get('search_users_clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Last Sign In',
                        css_class: 'popover-default',
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
                    id_callback: events.register_alias('created'),
                    component: NewPopoverButton,
                    label: 'Created',
                    clear_event: events.get('search_users_clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    enable_localstorage: true,
                    popover_options: {
                        placement: 'right',
                        title: 'Created',
                        css_class: 'popover-default',
                    },
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
                    id: 'has_valid_permissions',
                    id_callback: events.register_alias('has_valid_permissions'),
                    reset_event: events.get('search_users_clear'),
                    component: BooleanButton,
                    default_state: true,
                    external_state_change: events.get('permission_filter'),
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
                    reset_event: events.get('search_users_clear'),
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
                    id: 'permissions_filter',
                    id_callback: events.register_alias('permissions_filter'),
                    component: NewPopoverButton,
                    label: 'Permissions',
                    clear_event: events.get('search_users_clear'),
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
                    id: 'exclude_client_permissions',
                    id_callback: events.register_alias('exclude_client_permissions'),
                    reset_event: events.get('search_users_clear'),
                    component: BooleanButton,
                    default_state: false,
                    template: 'tpl_boolean_button',
                    visible_event: events.get('permission_filter'),
                    enable_localstorage: true,
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Exclude Client Permissions',
                },
                {
                    id: 'clear',
                    id_callback: events.register_alias('search_users_clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_users = {
            component: Aside,
            id: 'search_users',
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_body, this.search_cpanel],
        };

        this.user_header = {
            id: 'user_header',
            component: Header,
            buttons: [
                {
                    id: 'edit',
                    id_callback: events.register_alias('edit_user'),
                    label: 'Edit <span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'generate_token',
                    action: 'generate_token',
                    id_callback: events.register_alias('generate_token'),
                    label: 'Generate Token <span class="icon-link"></span>',
                    css: {
                        'btn-sm': true,
                        'btn-info': true,
                        'pull-right': true,
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
                                user_uid: {
                                    type: 'observer',
                                    event_type: events.get('user_uid'),
                                    required: true,
                                },
                                include_inherited: true,
                            },
                        },
                        id: 'grant_permission_modal',
                    },
                    use_header_data: true,
                },
                {
                    id: 'toggle_disabled',
                    component: ToggleActionButton,
                    id_callback: events.register_alias('toggle_disabled'),
                    labels: [
                        'Disable User <span class="icon-link-1"></span>',
                        'Enable User <span class="icon-unlink"></span>',
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
                    id: 'reset_mfa',
                    label: 'Reset MFA <span class="glyphicon glyphicon-erase"></span>',
                    action: 'reset_mfa',
                    disabled_property: '!mfa_enabled',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: ResetMFAModal,
                    },
                    use_header_data: true,
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user',
                    uid: {
                        type: 'observer',
                        event_type: events.get('user_uid'),
                        required: true,
                    },
                },
            },
        };

        this.user_info = {
            id: 'user_info',
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
                    label: 'Email',
                    value_key: 'email',
                },
                {
                    label: 'Client',
                    format: 'contextual_link',
                    format_args: {
                        url: 'clients/<client_uid>',
                        label_key: 'client_name',
                    },
                },
                {
                    label: 'Activated',
                    value_key: 'activated',
                    format: 'boolean',
                },
                {
                    label: 'Activated Date',
                    value_key: 'activated_date',
                    format: 'backend_local_datetime',
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
                    label: 'Is Client Admin',
                    value_key: 'client_admin',
                    format: 'boolean',
                },
                {
                    label: 'Created',
                    value_key: 'created',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Last Password Update',
                    value_key: 'last_password_update',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Last Sign In',
                    value_key: 'last_sign_in',
                    format: 'backend_local_datetime',
                },
                {
                    label: '# Sign Ins',
                    value_key: 'sign_in_count',
                },
                {
                    label: 'Can Sign In',
                    value_key: 'can_sign_in',
                },
                {
                    label: 'Multi-factor authentication Enabled',
                    value_key: 'mfa_enabled',
                    format: 'boolean',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user',
                    uid: {
                        type: 'observer',
                        event_type: events.get('user_uid'),
                        required: true,
                    },
                },
            },
        };

        this.user_tokens = {
            label: 'Tokens',
            id: 'user_tokens',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            empty_template: 'tpl_data_table_empty_with_label',
            enable_column_toggle: true,
            results_per_page: 10,
            columns: [
                {
                    label: 'Token',
                    key: 'uid',
                },
                {
                    label: 'Type',
                    key: 'token_type',
                    format: 'titleize',
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
                    label: '# Remaining Uses',
                    key: 'remaining_uses',
                },
                {
                    label: '# Uses',
                    key: 'times_used',
                },
                {
                    label: 'Last Used',
                    key: 'last_used',
                    format: 'backend_local_datetime',
                },
                {
                    label: 'Disabled',
                    key: 'disabled',
                    format: 'boolean',
                },
                {
                    label: 'Expiry',
                    key: 'expiry',
                    format: 'backend_local_datetime',
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
                    component: {
                        id: 'actions',
                        component: ActionButtons,
                        buttons: [
                            {
                                label: 'View Token',
                                disabled_property: '!valid',
                                css: {
                                    'btn-info': true,
                                    'btn-xs': true,
                                },
                                trigger_modal: {
                                    component: ViewTokenModal,
                                    id: 'view_token_modal',
                                },
                            },
                            {
                                action: 'disable',
                                label: 'Disable',
                                disabled_callback: function(data) {
                                    return !data.valid || data.disabled;
                                },
                                disabled_label: '',
                                css: {
                                    'btn-danger': true,
                                    'btn-xs': true,
                                },
                            },
                        ],
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user_tokens',
                    results_per_page: 10,
                    uid: {
                        type: 'observer',
                        event_type: events.get('user_uid'),
                        required: true,
                    },
                },
            },
        };

        this.tabs = {
            id: 'tabs',
            id_callback: events.register_alias('tab_event'),
            default_state: 'user_permissions',
            component: RadioButtons,
            template: 'tpl_radio_buttons_tabs',
            button_css: {
                'btn-block': true,
                'btn-transparent': true,
            },
            buttons: [
                {
                    label: 'Existing Permissions',
                    state: 'user_permissions',
                    icon: {'icon-list-alt': true},
                },
                {
                    label: 'All Permissions',
                    state: 'all_permissions',
                    icon: {'icon-list-alt': true},
                },
            ],
        };

        this.permission_columns = [
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
                            disabled_callback: row => (row ? !row.grant.is_user_permission : true),
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

        this.user_permissions = {
            id: 'user_permissions',
            component: DataTable,
            enable_column_toggle: true,
            enable_localstorage: true,
            css: {'table-light': true, 'table-sm': true},
            label: 'Permissions',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 40,
            row_key: 'unique_identifier',
            columns: [
                ...this.permission_columns,
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
                            return row.grant.is_client_permission;
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
                            user_uid: {
                                type: 'observer',
                                event_type: events.get('user_uid'),
                                required: true,
                            },
                            display_all: false,
                        },
                    },
                },
            },
        };

        this.all_permissions_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user_or_client_permission_grants',
                    filters: {
                        type: 'dynamic',
                        query: {
                            include_inherited: true,
                            user_uid: {
                                type: 'observer',
                                event_type: events.get('user_uid'),
                                required: true,
                            },
                            display_all: true,
                        },
                    },
                },
            },
        });

        this.login_permission_check = {
            id: 'login_permission_check',
            component: LoginPermissionCheck,
            permissions: this.all_permissions_datasource.data,
            sso_endpoints: false,
        };

        this.all_permissions = {
            id: 'all_permissions',
            component: DataTable,
            enable_column_toggle: true,
            enable_localstorage: true,
            css: {'table-light': true, 'table-sm': true},
            label: 'Permissions',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 40,
            row_key: 'unique_identifier',
            columns: [
                ...this.permission_columns,
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
                            return row.grant.is_client_permission;
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
            data: this.all_permissions_datasource.data,
        };

        this.permissions_wrapper = {
            component: DynamicWrapper,
            id: 'permissions_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'user_permissions',
            set_active_event: events.get('tab_event'),
            components: [this.user_permissions, this.all_permissions],
        };

        this.user_activity = {
            id: 'user_activity',
            label: 'Activity',
            component: DataTable,
            enable_column_toggle: true,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 10,
            empty_template: 'tpl_data_table_empty_with_label',
            columns: [
                {
                    label: 'Action',
                    key: 'action_type',
                    format: 'titleize',
                },
                {
                    label: 'Description',
                    key: 'description',
                },
                {
                    key: 'entity_type',
                    label: 'Entity',
                    format: 'entity_type',
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
                    target: 'commander:user_activity',
                    results_per_page: 10,
                    uid: {
                        type: 'observer',
                        event_type: events.get('user_uid'),
                        required: true,
                    },
                },
            },
        };

        this.show_user = {
            id: 'show_user',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: [
                    'user_header',
                    'user_info',
                    'login_permission_check',
                    'tabs',
                    'permissions_wrapper',
                    'user_tokens',
                    'user_activity',
                ],
            },
            components: [
                this.user_header,
                this.user_info,
                this.login_permission_check,
                this.tabs,
                this.permissions_wrapper,
                this.user_tokens,
                this.user_activity,
            ],
        };

        this.user_form = {
            id: 'user_form',
            component: EditForm,
            num_columns: 3,
            success_event: events.get('edit_user_success'),
            cancel_event: events.get('edit_user_cancel'),
            fields: [
                {
                    label: 'First Name',
                    key: 'first_name',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'First Name',
                    },
                },
                {
                    label: 'Last Name',
                    key: 'last_name',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'Last Name',
                    },
                },
                {
                    label: 'Email',
                    key: 'email',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'Email',
                    },
                },
                {
                    label: 'Client Admin',
                    key: 'client_admin',
                    input_type: 'boolean',
                    input_options: {
                        label: 'Is Client Admin',
                        btn_css: {
                            'btn-block': true,
                            'btn-sm': true,
                            'btn-white': true,
                        },
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_user',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:user',
                    uid: {
                        type: 'observer',
                        event_type: events.get('user_uid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_user = {
            id: 'edit_user',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['user_form'],
            },
            components: [this.user_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_users',
                set_active_event: events.get('page_state'),
                components: [this.search_users, this.show_user, this.edit_user],
            },
            this.shared_components,
        );

        let handle_url = function(url) {
            if (url.length == 1) {
                Observer.broadcast(events.get('page_state'), 'search_users');
                Observer.broadcast(events.get('user_uid'), undefined);
                this.current_user_uid = undefined;
            }
            if (url.length == 2) {
                Observer.broadcast(events.get('page_state'), 'show_user');
                Observer.broadcast(events.get('user_uid'), url[1], true);
                this.current_user_uid = url[1];
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(events.get('page_state'), 'edit_user');
                Observer.broadcast(events.get('user_uid'), url[1], true);
                this.current_user_uid = url[1];
            }
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('users', handle_url.bind(this));

            Observer.register(events.get('edit_user'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register_many(
                [events.get('edit_user_cancel'), events.get('edit_user_success')],
                () => {
                    DataThing.status_check();
                    window.history.back();
                },
            );

            Observer.register(events.get('enable_permission'), payload => {
                this.handle_permissions(payload);
            });

            Observer.register(events.get('enable_all_permission'), payload => {
                this.handle_permissions(payload);
            });

            Observer.register(events.get('disable_token'), token => {
                this.endpoints.disable_token({
                    data: {token_uid: token.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('generate_token'), user => {
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

            Observer.register(events.get('enable'), user => {
                this.endpoints.set_user_disabled({
                    data: {uid: user.uid, disabled: false},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register(events.get('disable'), user => {
                this.endpoints.set_user_disabled({
                    data: {uid: user.uid, disabled: true},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            this.dfd.resolve();
        });
    }

    handle_permissions(row_selected) {
        if (row_selected.grant.created) {
            this.endpoints.edit_permission({
                data: {
                    user_uid: this.current_user_uid,
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
                    user_uid: this.current_user_uid,
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
    }
}

export default UsersVM;
