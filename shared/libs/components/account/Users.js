/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * View for displaying users that belong to client
 */

import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import CreateUserModal from 'src/libs/components/modals/CreateUserModal';
import ActionButton from 'src/libs/components/basic/ActionButton';
import EventButton from 'src/libs/components/basic/EventButton';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataThing from 'src/libs/DataThing';
import TransferAssetsModal from 'src/libs/components/modals/TransferAssetsModal';
import ConfirmModal from 'src/libs/components/modals/ConfirmModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_account_content';
    self._dfd = self.new_deferred();
    self.filter_active_event = opts.filter_active_event;

    /*********************************************************
     *                     Endpoints                         *
     *********************************************************/

    self._disable_users_request = DataThing.backends.useractionhandler({
        url: 'disable_user',
    });

    self._reset_password_email = DataThing.backends.auth({
        url: 'send_password_reset_email',
    });

    self._enable_users_request = DataThing.backends.useractionhandler({
        url: 'enable_user',
    });

    /*********************************************************
     *                     Events                            *
     *********************************************************/

    self.events = self.new_instance(EventRegistry, {});
    self.events.resolve_and_add('reset_password', 'EventButton', 'reset_password');
    self.events.resolve_and_add('transfer_assets', 'EventButton', 'transfer_assets');
    self.events.resolve_and_add('filter_active', 'BooleanButton.state_with_data');
    self.events.new('confirm_disable_users');
    self.events.new('confirm_enable_users');

    /*********************************************************
     *                     Components                        *
     *********************************************************/

    self.transfer_assets_modal = self.new_instance(TransferAssetsModal, {});

    self.content = self.new_instance(DataTable, {
        id: 'table',
        css: {'table-light': true, 'table-sm': true},
        columns: [
            {
                label: 'Last Name',
                key: 'last_name',
            },
            {
                label: 'First Name',
                key: 'first_name',
            },
            {
                label: 'Email',
                key: 'email',
            },
            {
                label: 'Last login',
                key: 'last_sign_in',
                format: 'backend_datetime',
            },
            {
                label: 'Date Created',
                key: 'created',
                format: 'backend_date',
            },
            {
                label: 'Activated',
                key: 'activated',
                format: 'boolean_highlight',
            },
            {
                label: 'Disabled',
                key: 'disabled',
                format: 'boolean_highlight',
            },
            {
                label: 'Reset Password',
                type: 'component',
                component_callback: 'data',
                component: {
                    id: 'reset_password',
                    id_callback: self.events.register_alias('reset_password'),
                    component: EventButton,
                    template: 'tpl_button',
                    css: {'btn-xs': true, 'btn-info': true, 'btn-block': true},
                    label: 'Reset Password',
                },
            },
            {
                label: 'Transfer Assets',
                type: 'component',
                component_callback: 'data',
                component: {
                    id: 'transfer_assets',
                    id_callback: self.events.register_alias('transfer_assets'),
                    component: EventButton,
                    template: 'tpl_button',
                    css: {'btn-xs': true, 'btn-info': true, 'btn-block': true},
                    label: 'Transfer Assets',
                },
            },
        ],
        label: 'Users',
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        enable_selection: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'account:users_for_client',
                filters: {
                    type: 'dynamic',
                    query: {
                        only_active: {
                            type: 'observer',
                            event_type: self.filter_active_event,
                            default: false,
                        },
                    },
                },
            },
        },
    });

    self.toolbar = self.new_instance(ActionHeader, {
        id: 'toolbar',
        template: 'tpl_action_toolbar',
        buttons: [
            {
                id: 'create_user',
                component: ActionButton,
                label: 'Create New User <span class="icon-plus"></span>',
                action: 'create_user',
                trigger_modal: {
                    id: 'create_user',
                    component: CreateUserModal,
                },
            },
            {
                id: 'enable_users',
                id_callback: self.events.register_alias('enable_users'),
                component: ActionButton,
                label: 'Enable Selected User <span class="glyphicon glyphicon-ok-circle"></span>',
                action: 'enable_users',
                disabled_callback: data => {
                    // Disable button if no user is selected
                    if (data.selected_count) {
                        return !data.selected_count > 0;
                    }
                    return true;
                },
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event('DataTable.counts', self.content.get_id()),
                    default: [],
                },
                trigger_modal: {
                    id: 'confirm',
                    id_callback: self.events.register_alias('confirm_enable_users'),
                    confirm_button_text: 'Enable Users',
                    component: ConfirmModal,
                    confirm_event: self.events.get('confirm_enable_users'),
                },
            },
            {
                id: 'disable_users',
                id_callback: self.events.register_alias('disable_users'),
                component: ActionButton,
                label: 'Disable Selected User <span class="glyphicon glyphicon-ban-circle"></span>',
                action: 'disable_users',
                disabled_callback: data => {
                    // Disable button if no user is selected
                    if (data.selected_count) {
                        return !data.selected_count > 0;
                    }
                    return true;
                },
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event('DataTable.counts', self.content.get_id()),
                    default: [],
                },
                trigger_modal: {
                    id: 'confirm_delete',
                    id_callback: self.events.register_alias('confirm_disable_users'),
                    button_text: 'Disable Users',
                    component: ConfirmDeleteModal,
                    confirm_delete_event: self.events.get('confirm_disable_users'),
                },
            },
        ],
        data_table_id: self.content.get_id(),
    });

    self.when(self.toolbar, self.content, self.transfer_assets_modal).done(() => {
        /*********************************************************
         *                     Event Handlers                    *
         *********************************************************/

        Observer.register(self.events.get('reset_password'), user => {
            if (user.email) {
                self._reset_password_email({
                    data: {
                        email: user.email,
                        disable_redirect: true,
                        ignore_errors: false,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        // Email was successfully sent
                        bison.utils.Notify(
                            'Success!',
                            `A reset password link has been sent to ${user.email}`,
                            'alert-success',
                        );
                    }),
                    error: DataThing.api.XHRError(() => {
                        // Something went wrong when sending the email
                    }),
                });
            }
        });

        Observer.register(self.events.get('transfer_assets'), user => {
            self.transfer_assets_modal.selected(user);
        });

        Observer.register(self.events.get('confirm_disable_users'), () => {
            let user_uids = [];
            // Collect selected users from datatable
            self.content.get_selected().forEach(user => {
                user_uids.push(user.uid);
            });

            self._disable_users_request({
                data: {
                    uids: user_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        Observer.register(self.events.get('confirm_enable_users'), () => {
            let user_uids = [];

            self.content.get_selected().forEach(user => {
                user_uids.push(user.uid);
            });

            self._enable_users_request({
                data: {
                    uids: user_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        self._dfd.resolve();
    });

    return self;
}
