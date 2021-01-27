/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Change Password</h4>
                        </div>
                        <div class="modal-body">
                            <form>
                                <div class="form-group">
                                    <input type="password" class="form-control" data-bind="textInput: current_password" placeholder="Current Password">
                                </div>
                                <div class="form-group" data-bind="css: { 'has-error': password_invalid(), 'has-feedback': password_valid() }">
                                    <div class="input-group" style="width: 100%;">
                                        <input type="password" class="form-control" placeholder="New Password" data-bind="textInput: new_password">
                                        <!-- ko if: password_invalid -->
                                        <span class="input-group-addon" data-bind="text: password_feedback"></span>
                                        <!-- /ko -->
                                    </div>
                                    <!-- ko if: password_valid -->
                                    <span class="glyphicon glyphicon-ok form-control-feedback"></span>
                                    <!-- /ko -->
                                </div>
                                <div class="form-group" data-bind="css: { 'has-error': confirm_password_feedback(), 'has-feedback': confirm_password_valid() }">
                                    <div class="input-group" style="width: 100%;">
                                        <input type="password" class="form-control" placeholder="Confirm New Password" data-bind="textInput: new_password_confirm">
                                        <!-- ko if: confirm_password_feedback -->
                                        <span class="input-group-addon" data-bind="text: confirm_password_feedback"></span>
                                        <!-- /ko -->
                                    </div>
                                    <!-- ko if: confirm_password_valid -->
                                    <span class="glyphicon glyphicon-ok form-control-feedback"></span>
                                    <!-- /ko -->
                                </div>
                            </form>
                            <p>
                               Your new password has to be  <strong>at least 10 characters long</strong>, but we recommend using a longer password.
                            </p>
                            <p>
                                Try to avoid repetition and common dictionary words, unless they're combined in a sentence.
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-cpanel-success" data-bind="click: change_password, disable: disable_button">
                                Change Password
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    opts = opts || {};

    self.new_password = ko
        .observable('')
        .extend({rateLimit: {timeout: 250, method: 'notifyWhenChangesStop'}});
    self.new_password_confirm = ko
        .observable('')
        .extend({rateLimit: {timeout: 250, method: 'notifyWhenChangesStop'}});
    self.current_password = ko.observable('');

    self._change_password = DataThing.backends.auth({
        url: 'change_password',
    });

    self._validate_password = DataThing.backends.auth({
        url: 'validate_password',
    });

    self.password_feedback = ko.observable();
    self.password_valid = ko.observable();

    self.confirm_password_feedback = ko.pureComputed(() => {
        let new_password = self.new_password();
        let new_password_confirm = self.new_password_confirm();

        if (new_password.length && new_password_confirm.length) {
            if (new_password != new_password_confirm) {
                return 'The passwords do not match';
            }
        }
    });

    self.confirm_password_valid = ko.pureComputed(() => {
        let new_password = self.new_password();
        let new_password_confirm = self.new_password_confirm();

        if (new_password.length && new_password_confirm.length) {
            if (new_password == new_password_confirm) {
                return true;
            }
        }

        return false;
    });

    self.current_password_valid = ko.pureComputed(() => {
        let current_password = self.current_password();
        return current_password && current_password.length > 0;
    });

    self.password_invalid = ko.pureComputed(() => {
        return self.password_valid() === false;
    });

    self.new_password.subscribe(password => {
        if (password && password.length > 0) {
            self._validate_password({
                data: {
                    password: password,
                },
                success: DataThing.api.XHRSuccess(({valid, reason}) => {
                    self.password_valid(valid);
                    self.password_feedback(reason || 'OK');
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        } else {
            self.password_valid(undefined);
            self.password_feedback(undefined);
        }
    });

    self.disable_button = ko.pureComputed(() => {
        return (
            self.loading() ||
            !self.password_valid() ||
            !self.confirm_password_valid() ||
            !self.current_password_valid()
        );
    });

    self.change_password = function() {
        let new_password = self.new_password();
        let new_password_confirm = self.new_password_confirm();
        let current_password = self.current_password();

        if (
            new_password.length > 0 &&
            new_password_confirm.length > 0 &&
            current_password.length > 0
        ) {
            self.loading(true);

            self._change_password({
                data: {
                    current_password: current_password,
                    new_password: new_password,
                    new_password_confirm: new_password_confirm,
                },
                success: DataThing.api.XHRSuccess(() => {
                    bison.utils.Notify(
                        'Success!',
                        'Your password has been changed.',
                        'alert-success',
                    );
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        }
    };

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.new_password('');
        self.new_password_confirm('');
        self.current_password('');
        self.password_valid(undefined);
        self.password_feedback(undefined);
        self.loading(false);

        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
