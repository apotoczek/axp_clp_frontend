/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import TextInput from 'src/libs/components/basic/TextInput';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Create New User</h4>
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
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: email --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div style="height: 34px;">
                                <button class="btn btn-success pull-right" data-bind="click: create">Create</button>
                                <button class="btn btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.first_name = new TextInput({
        allow_empty: false,
        placeholder: 'First Name',
    });

    self.last_name = new TextInput({
        allow_empty: false,
        placeholder: 'Last Name',
    });

    self.email = new TextInput({
        allow_empty: false,
        custom_validator: {
            function: bison.helpers.is_valid_email,
            message: 'Invalid Email',
        },
        placeholder: 'Email',
    });

    self._create_user = DataThing.backends.useractionhandler({
        url: 'create_user',
    });

    self.create = function() {
        let data = {
            first_name: self.first_name.value(),
            last_name: self.last_name.value(),
            email: self.email.value(),
        };
        self._create_user({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRSuccess(() => {}),
        });
        self.reset();
    };

    self.cancel = function() {
        self.reset();
    };

    return self;
}
