/* Automatically transformed from AMD to ES6. Beware of code smell. */
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
                            <h2>Edit User Fund Shares</h2>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                <!-- ko renderComponent: search_field --><!-- /ko -->
                                </div>
                                <div class="col-md-4">
                                <!-- ko renderComponent: permission_dropdown --><!-- /ko -->
                                </div>
                                <button type="button" class="btn btn-md btn-cpanel-success" data-bind="click: grant_user_fund_access">Grant New
                                </button>
                            </div>
                            <div class="row" style="margin-top: 15px">
                                <!-- ko renderComponent: table --><!-- /ko -->
                                <hr class="transparent hr-small" />
                            </div>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.data.subscribe(() => {
        if (self.data.user_fund_uid) {
            Observer.broadcast('InternalEvent.UserFund.uid', self.data.user_fund_uid);
        }
    });

    /********************************************************************
     * Components
     ********************************************************************/
    self.search_field = self.new_instance(TypeaheadInput, {
        id: 'search_field',
        placeholder: 'Search for user...',
        endpoint: {
            target: 'commander:users_and_clients',
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
        },
        default_selected_index: 0,
        data: [
            {label: 'Read', value: 'read'},
            {label: 'Write', value: 'write'},
            {label: 'Share', value: 'share'},
        ],
    });

    self.table = self.new_instance(DataTable, {
        id: 'table',
        results_per_page: 10,
        title: 'This is table',
        css: {'table-light': true, 'table-sm': true},
        columns: [
            {
                label: 'User Name',
                key: 'user_name',
            },
            {
                label: 'Email',
                key: 'user_email',
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
                target: 'commander:list_user_fund_shares',
                user_fund_uid: {
                    type: 'observer',
                    event_type: 'InternalEvent.UserFund.uid',
                    required: true,
                },
            },
        },
    });
    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self._data_mapper = () => {
        let data = self.data();

        if (data && data.user_fund_uid) {
            Observer.broadcast('InternalEvent.UserFund.uid', data.user_fund_uid);
        }
    };

    Observer.register(
        Utils.gen_event('ActionButton.action.revoke', self.get_id(), self.table.id, 'action'),
        user_fund_share_data => {
            if (user_fund_share_data && user_fund_share_data.uid) {
                let data = self.data();
                self._revoke_user_fund_access({
                    data: {
                        uid: user_fund_share_data.uid,
                        user_fund_uid: data.user_fund_uid,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        },
    );
    self.show = function() {
        self._data_mapper();
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.search_field.clear();
        Observer.broadcast('InternalEvent.UserFund.uid', undefined);
        bison.helpers.close_modal(self.get_id());
    };

    self._grant_user_fund_access = DataThing.backends.commander({
        url: 'grant_user_fund_access',
    });

    self._revoke_user_fund_access = DataThing.backends.commander({
        url: 'revoke_user_fund_access',
    });

    self.grant_user_fund_access = () => {
        let data = self.data();
        let share_to_uid = self.search_field.value();
        let permission = self.permission_dropdown.value();
        let user_fund_uid = data.user_fund_uid;

        let request_data = {
            permission: permission,
            share_to_uid: share_to_uid,
            user_fund_uid: user_fund_uid,
        };

        self._grant_user_fund_access({
            data: request_data,
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    _dfd.resolve();

    return self;
}
