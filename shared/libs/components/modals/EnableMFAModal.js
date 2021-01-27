/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import 'src/libs/bindings/render_qr_code';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Enable multi-factor authentication</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko ifnot: verify -->
                            <div style="padding: 0 10px;">
                                <p><em>
                                    Multi-factor authentication adds an extra layer of security to your account.. In addition to your username and password, you'll need to enter a code that you get via an app on your mobile device.
                                </em>
                                </p>
                                <h4 style="margin-top:20px;">1. Download or start app</h4>
                                <p>If you don't already have an app on your mobile device with support for Time-based One-time Password (TOTP), download one of these apps:
                                </p>
                                <ul>
                                    <li>
                                        For Android, iOS, and Blackberry: <a href="https://support.google.com/accounts/answer/1066447?hl=en" target="_blank">Google Authenticator</a>
                                    </li>
                                    <li>
                                        For Android and iOS: <a href="http://guide.duosecurity.com/third-party-accounts" target="_blank">Duo Mobile</a>
                                    </li>
                                    <li>
                                        For Windows Phone: <a href="https://www.microsoft.com/en-US/store/apps/Authenticator/9WZDNCRFJ3RJ" target="_blank">Authenticator</a>
                                    </li>
                                </ul>
                                <h4 style="margin-top:20px;">2. Enter your password and continue</h4>
                                <p>
                                    Enter your password to start setting up multi-factor authentication..
                                </p>
                                <div class="form-group">
                                    <input type="password" class="form-control" data-bind="textInput: password" placeholder="Password">
                                </div>
                            </div>
                            <!-- /ko -->
                            <!-- ko if: verify -->
                            <div class="row row-margins">
                                <div class="col-xs-12 col-md-4">
                                    <div class="text-center" data-bind="render_qr_code: {
                                        value: secret_url,
                                        size: 250,
                                    }"></div>
                                </div>
                                <div class="col-xs-12 col-md-8">
                                    <div style="padding: 15px 30px 0 0">
                                        <h4>1. Scan the barcode</h4>
                                        <p>
                                            Scan the barcode image to the left with the multi-factor authentication app on your mobile device. If you can't use a barcode, <a data-bind="visible: !show_code(), click: reveal_code">click here to see the text code</a><code data-bind="text: secret_code, visible: show_code"></code>.
                                        </p>
                                        <h4>2. Enter the six-digit code from the application</h4>
                                        <p>
                                            After scanning the barcode image, the app will display a six-digit code that you can enter below.
                                        </p>
                                        <div class="form-group">
                                            <input type="text" class="form-control" data-bind="textInput: mfa_token" placeholder="123456">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- /ko -->
                        </div>
                        <div class="modal-footer">
                            <!-- ko if: verify -->
                            <button type="button" class="btn btn-lg btn-cpanel-success" data-bind="click: verify_mfa">
                                Enable multi-factor authentication
                            </button>
                            <!-- /ko -->
                            <!-- ko ifnot: verify -->
                            <button type="button" class="btn btn-lg btn-cpanel-success" data-bind="click: enable_mfa, disable: disable_next">
                                Continue
                            </button>
                            <!-- /ko -->
                            <button type="button" class="btn btn-lg btn-ghost-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self._enable_mfa = DataThing.backends.auth({
        url: 'enable_mfa',
    });

    self._verify_and_activate_mfa = DataThing.backends.auth({
        url: 'verify_and_activate_mfa',
    });

    self.password = ko.observable();
    self.mfa_token = ko.observable();
    self.secret_code = ko.observable();
    self.secret_url = ko.observable();
    self.verify = ko.observable(false);
    self.show_code = ko.observable(false);

    self.reveal_code = function() {
        self.show_code(true);
    };

    self.disable_next = ko.pureComputed(() => {
        let password = self.password();

        return !password || password.length == 0;
    });

    self.disable_verify = ko.pureComputed(() => {
        let mfa_token = self.mfa_token();

        return !mfa_token || mfa_token.length == 0;
    });

    self.enable_mfa = function() {
        let password = self.password();

        if (password && password.length > 0) {
            self._enable_mfa({
                data: {
                    password: password,
                },
                success: DataThing.api.XHRSuccess(data => {
                    if (data) {
                        self.verify(true);
                        self.secret_url(data.url);
                        self.secret_code(data.code);
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

    self.verify_mfa = function() {
        let mfa_token = self.mfa_token();

        if (mfa_token && mfa_token.length > 0) {
            self._verify_and_activate_mfa({
                data: {
                    mfa_token: mfa_token,
                },
                success: DataThing.api.XHRSuccess(success => {
                    if (success) {
                        self.reset();
                        DataThing.status_check();
                    } else {
                        bison.utils.Notify('Heads up!', 'Invalid MFA Token..', 'alert-danger');
                    }
                }),
                error: DataThing.api.XHRError(() => {}),
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
        self.password(undefined);
        self.secret_code(undefined);
        self.secret_url(undefined);
        self.verify(false);
        self.mfa_token(undefined);
        self.show_code(false);
        self.loading(false);

        bison.helpers.close_modal(self.get_id());
    };

    return self;
}
