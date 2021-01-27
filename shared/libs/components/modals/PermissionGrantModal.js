/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import DateInput from 'src/libs/components/basic/DateInput';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title"><span data-bind="text: mode"></span> Permission</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: permissions --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-3">
                                <!-- ko renderComponent: expiry --><!-- /ko -->
                                </div>
                                <div class="col-sm-3">
                                    <div class="checkbox text-halfmuted">
                                        <label>
                                        <input type="checkbox" data-bind="checked: disabled" />Disabled
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <!-- ko if: show_permissions -->
                                <div class="row">
                                    <!-- ko renderComponent: table --><!-- /ko -->
                                </div>
                            <!-- /ko -->
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: grant_or_update_permission'>Save</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.current_permissions = opts.current_permissions;
    self.show_permissions = !!self.current_permissions;

    /********************************************************************
     * Components
     ********************************************************************/
    self.permissions = self.new_instance(FilteredDropdown, {
        id: 'permission',
        label: 'Permission',
        menu_css: {
            'pre-scrollable': true,
        },
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
        selected: {
            data: self.data,
            mapping: 'get',
            mapping_args: {
                key: 'permission_uid',
            },
        },
    });

    if (self.show_permissions) {
        self.table = self.new_instance(DataTable, {
            id: 'current_permissions',
            css: 'table-light table-sm',
            results_per_page: 10,
            columns: [
                {
                    label: 'Permission',
                    key: 'permission:name',
                },
                {
                    label: 'Type',
                    key: 'is_client_permission',
                    format: 'boolean',
                    format_args: {
                        yes: 'Inherited From Client',
                        no: 'User',
                    },
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
                    label: 'Created',
                    key: 'created',
                    format: 'backend_local_datetime',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:permission_grants',
                    results_per_page: 25,
                    filters: {
                        type: 'dynamic',
                        query: self.current_permissions.filter_query,
                    },
                },
            },
        });
    }

    self.expiry = self.new_instance(DateInput, {
        id: 'expiry',
        placeholder: 'Expiry Date (optional)',
        initial_value_property: 'expiry',
        enable_data_updates: true,
        data: self.data(),
        use_local_time: true,
    });

    self._disabled = ko.observable();
    self.disabled = ko.pureComputed({
        write: function(value) {
            if (value) {
                self._disabled(value);
            } else {
                self._disabled(false);
            }
        },
        read: function() {
            let data = self.data();
            let disabled = self._disabled();

            if (disabled === undefined && data) {
                return data.disabled;
            }

            return disabled;
        },
    });

    self.permission_data = ko.pureComputed(() => {
        let data = self.data(),
            perm_data = {};

        if (data) {
            if (self.mode() == 'Grant') {
                if (data.client_uid) {
                    perm_data['user_uid'] = data.uid;
                } else {
                    perm_data['client_uid'] = data.uid;
                }
            } else {
                perm_data['permission_grant_uid'] = data.uid;
            }

            return {
                ...perm_data,
                expiry: self.expiry.value(),
                permission_uid: self.permissions.selected().value,
                disabled: self.disabled(),
            };
        }
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        if (self.mode() === 'Grant') {
            self.permissions.clear();
        }
        bison.helpers.close_modal(self.get_id());
    };

    self._grant_permission = DataThing.backends.commander({
        url: 'grant_permission',
    });

    self._edit_permission = DataThing.backends.commander({
        url: 'update_permission_grant',
    });

    self.mode = ko.computed(() => {
        let data = self.data();
        if (data) {
            if (data.name) {
                return 'Grant';
            }
            return 'Edit';
        }
    });

    self.grant_or_update_permission = function() {
        let data = self.permission_data();
        if (self.mode() === 'Grant') {
            self._grant_permission({
                data: data,
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        } else if (self.mode() === 'Edit') {
            self._edit_permission({
                data: data,
                success: DataThing.api.XHRSuccess(() => {
                    self.reset();
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        }
    };

    return self;
}
