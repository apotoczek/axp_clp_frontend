/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import DataThing from 'src/libs/DataThing';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4>Are you sure?</h4>
                                <p>
                                    Are your sure you want to reset the multi-factor authentication for <span data-bind="text: email"></span>?
                                </p>
                                <p>
                                    Make sure you have verified the identify of the user before doing this.
                                </p>
                                <p>
                                    <strong>A common social engineering attack would be for an attacker to ask for multi-factor authentication to be disabled, so please be careful...</strong>
                                </p>
                                <hr class="transparent">
                                <h5>Enter your password to continue..</h5>
                                <input type="password" class="form-control" data-bind="textInput: password" placeholder="Password">
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-sm btn-danger pull-right" data-bind="click: submit">Reset multi-factor authentication</button>
                                <button class="btn btn-sm btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                            </div>
                        </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.password = ko.observable();

    self._reset_mfa_for_user = DataThing.backends.commander({
        url: 'reset_mfa_for_user',
    });

    self.email = ko.pureComputed(() => {
        let user = self.data();

        if (user) {
            return user.email;
        }
    });

    self.submit = function() {
        let user = self.data();

        if (user) {
            self._reset_mfa_for_user({
                data: {
                    user_uid: user.uid,
                    password: self.password(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.password(undefined);
        self.loading(false);
    };

    self.cancel = function() {
        self.reset();
    };

    _dfd.resolve();

    return self;
}
