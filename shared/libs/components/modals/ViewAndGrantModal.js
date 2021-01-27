/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import DataTable from 'src/libs/components/basic/DataTable';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import ActionButton from 'src/libs/components/basic/ActionButton';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title" data-bind="html: title"></h2>
                        </div>
                        <div class="modal-body">
                            <div class="row" style="margin-bottom: 15px">
                                <div class="col-md-6">
                                <!-- ko renderComponent: search_field --><!-- /ko -->
                                </div>
                                <div class="col-md-3">
                                <!-- ko renderComponent: permission_dropdown --><!-- /ko -->
                                </div>
                                <div class="col-md-3">
                                <!-- ko renderComponent: grant_new --><!-- /ko -->
                                </div>
                            </div>
                            <!-- ko renderComponent: table --><!-- /ko -->
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.meta_data = opts.meta_data || (() => {});

    self.title = ko.pureComputed(() => {
        let meta_data = self.meta_data();
        if (meta_data) {
            return meta_data.name;
        }
        return 'Remote Client';
    });

    self.partner_uid = opts.partner_uid || (() => {});

    /********************************************************************
     * Components
     ********************************************************************/
    self.search_field = self.new_instance(TypeaheadInput, {
        id: 'search_field',
        placeholder: 'Search for user...',
        endpoint: {
            target: 'commander:users',
            query_key: 'string_filter',
            display_key: 'email',
            return_key: 'uid',
            order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
        },
    });

    self.permission_dropdown = self.new_instance(NewDropdown, {
        label: 'Active',
        btn_css: {
            'btn-md': true,
            //'btn-primary': true,
        },
        default_selected_index: 0,
        data: [
            {label: 'Read', value: 'read'},
            {label: 'Write', value: 'write'},
            {label: 'Share', value: 'share'},
        ],
    });

    self.grant_new = self.new_instance(ActionButton, {
        id: 'grant_new',
        label: 'Grant New',
        action: 'grant',
        css: {
            'btn-md': true,
            'btn-cpanel-success': true,
        },
    });

    self.table = self.new_instance(DataTable, {
        id: 'table',
        row_key: 'name',
        results_per_page: 10,
        title: 'This is table',
        css: {'table-light': true, 'table-sm': true},
        columns: [
            {
                label: 'User Name',
                key: 'name',
            },
            {
                label: 'Email',
                key: 'email',
            },
            {
                label: 'Type of Access',
                key: 'permission',
            },
            {
                label: 'Last Updated',
                key: 'created',
                format: 'backend_date',
            },
            {
                component_callback: 'data',
                component: {
                    id: 'action',
                    component: ActionButton,
                    label: 'Revoke Access',
                    action: 'revoke',
                    css: {
                        'btn-xs': true,
                        'btn-danger': true,
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:list_remote_client_access',
                remote_client_uid: {
                    type: 'observer',
                    event_type: 'InternalEvent.partner_client_uid',
                    required: true,
                },
            },
        },
    });
    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
        self.search_field.clear();
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
    };

    self.grant_remote_client_access = DataThing.backends.commander({
        url: 'grant_remote_client_access',
    });

    self.revoke_remote_client_access = DataThing.backends.commander({
        url: 'revoke_remote_client_access',
    });

    self.when(self.search_field, self.grant_new, self.table, self.permission_dropdown).done(() => {
        Observer.register_hash_listener('remote_client', url => {
            if (url.length == 1) {
                Observer.broadcast('InternalEvent.partner_client_uid', undefined);
            }
            if (url.length == 2) {
                Observer.broadcast('InternalEvent.partner_client_uid', url[1]);
            }
        });
        Observer.register_for_id(self.grant_new.get_id(), 'ActionButton.action.grant', () => {
            let user_uid = self.search_field.value();
            let partner_uid = self.partner_uid();
            let permission = self.permission_dropdown.value();
            if (user_uid && partner_uid) {
                self.grant_remote_client_access({
                    data: {
                        user_uid: user_uid,
                        partner_uid: partner_uid,
                        permission: permission,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        self.table.refresh_data();
                        self.search_field.clear();
                    }),
                    error: DataThing.api.XHRError(() => {
                        DataThing.status_check();
                        self.search_field.clear();
                    }),
                });
            }
        });

        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'table', 'action'),
            'ActionButton.action.revoke',
            revoke => {
                let share_uid = revoke.share_uid;
                let partner_uid = self.partner_uid();
                if (share_uid && partner_uid) {
                    self.revoke_remote_client_access({
                        data: {
                            share_uid: share_uid,
                            partner_uid: partner_uid,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                            self.table.refresh_data();
                        }),
                        error: DataThing.api.XHRError(() => {
                            DataThing.status_check();
                        }),
                    });
                }
            },
        );

        _dfd.resolve();
    });

    return self;
}
