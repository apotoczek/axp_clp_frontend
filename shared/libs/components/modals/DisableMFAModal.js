/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Disable multi-factor authentication</h4>
                        </div>
                        <div class="modal-body">
                            <div style="padding: 0 5px">
                                <p><em>
                                    Multi-factor authentication adds an extra layer of security to your account.. In addition to your username and password, you'll need to enter a code that you get via an app on your mobile device.
                                </em>
                                </p>
                                <h4 style="margin-top: 20px;">Are you sure you want to disable multi-factor authentication?</h4>
                                <p>
                                    Enter your password to continue..
                                </p>
                                <div class="form-group">
                                    <input type="password" class="form-control" data-bind="textInput: password" placeholder="Password">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" data-bind="click: disable_mfa, disable: disable_button">
                                Disable multi-factor authentication
                            </button>
                            <button type="button" class="btn btn-ghost-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self._disable_mfa = DataThing.backends.auth({
        url: 'disable_mfa',
    });

    self.password = ko.observable('');

    self.disable_mfa = function() {
        let password = self.password();

        if (password && password.length > 0) {
            self._disable_mfa({
                data: {
                    password: password,
                },
                success: DataThing.api.XHRSuccess(success => {
                    if (success) {
                        self.reset();
                        DataThing.status_check();
                    } else {
                        bison.utils.Notify(
                            'Heads up!',
                            'The password you entered is not correct..',
                            'alert-danger',
                        );
                    }
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    };

    self.disable_button = ko.pureComputed(() => {
        let password = self.password();

        return !password || password.length == 0;
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.password('');
        self.loading(false);

        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
