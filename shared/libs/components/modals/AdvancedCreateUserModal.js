/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create User</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: first_name --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: last_name --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="form-group">
                                    <!-- ko renderComponent: email --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-8">
                                    <div class="form-group">
                                    <!-- ko with: preselected_client -->
                                        <input type="text" class="form-control" data-bind="value: name, disable: true">
                                    <!-- /ko -->
                                    <!-- ko ifnot: preselected_client -->
                                        <!-- ko renderComponent: client --><!-- /ko -->
                                    <!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-4">
                                    <div class="checkbox text-halfmuted">
                                        <label>
                                          <input type="checkbox" data-bind="checked: client_admin"> Is Client Admin
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_user, enable: valid' data-dismiss="modal">Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/
    self.first_name = new TextInput({
        allow_empty: false,
        placeholder: 'First Name',
    });
    self.last_name = new TextInput({
        allow_empty: false,
        placeholder: 'Last Name',
    });
    self.email = new TextInput({
        custom_validator: {
            function: bison.helpers.is_valid_email,
            message: 'Invalid Email',
        },
        allow_empty: false,
        placeholder: 'Email',
    });
    self.client = new TypeaheadInput({
        endpoint: {
            target: 'commander:clients',
            query_key: 'string_filter',
            display_key: 'name',
            return_key: 'client_uid',
            order_by: [
                {
                    name: 'name_startswith',
                    sort: 'asc',
                },
                {
                    name: 'name',
                    sort: 'asc',
                },
            ],
        },
        disabled: false,
        list_length: 5,
        allow_empty: false,
        placeholder: 'Find a Client...',
    });

    self.valid = ko.pureComputed(() => {
        return (
            (self.preselected_client() || self.client.can_submit()) &&
            self.email.can_submit() &&
            self.first_name.can_submit() &&
            self.last_name.can_submit()
        );
    });

    // Observables for preselected client data
    self.preselected_client = ko.pureComputed(() => {
        let data = self.data();
        if (data && data.name) {
            return data;
        }
    });

    self.client_uid = ko.pureComputed(() => {
        if (self.preselected_client()) {
            return self.preselected_client().uid;
        } else if (self.client && self.client.value()) {
            return self.client.value();
        }
    });

    self.client_admin = ko.observable(false);

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.first_name.clear();
        self.last_name.clear();
        self.email.clear();
        self.client.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_user = DataThing.backends.commander({
        url: 'create_user',
    });

    self.create_user = function() {
        let data = {
            first_name: self.first_name.value(),
            last_name: self.last_name.value(),
            email: self.email.value(),
            client_uid: self.client_uid(),
            client_admin: self.client_admin(),
        };
        self._create_user({
            data: data,
            success: DataThing.api.XHRSuccess(data => {
                let user_uid = data.user_uid;
                self.reset();
                pager.navigate(`#!/users/${user_uid}`);
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };
    return self;
}
