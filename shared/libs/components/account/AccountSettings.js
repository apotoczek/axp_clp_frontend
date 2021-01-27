/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import auth from 'auth';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ChangePasswordModal from 'src/libs/components/modals/ChangePasswordModal';
import DisableMFAModal from 'src/libs/components/modals/DisableMFAModal';
import EnableMFAModal from 'src/libs/components/modals/EnableMFAModal';
import AccountColorSettings from 'src/libs/components/AccountColorSettings';

export default function(opts, components) {
    let self = new BaseComponent(Object.assign({}, opts, {get_user: true}), components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div style="margin:0 20px;">
            <div class="row row-margins">
                <div class="col-xs-12">
                    <h3 style="border-bottom:1px solid #ddd;padding:10px;">
                        Account
                    </h3>
                    <div style="padding: 0 10px">
                        <p data-bind="with: user">
                            <strong data-bind="text: email"></strong><br />
                            <span data-bind="text: name"></span><br />
                            <span data-bind="text: client_name"></span>
                        </p>
                        <!-- ko if: login_with_password -->
                        <a class="btn btn-sm btn-cpanel-info" data-bind="click: change_password_modal.show">
                            Change Password
                        </a>
                        <!-- /ko -->
                        <a class="btn btn-sm btn-cpanel-success" data-bind="click: sign_out">
                            Sign Out
                        </a>
                    </div>
                </div>
            </div>
            <!-- ko if: login_with_password -->
            <div class="row row-margins">
                <div class="col-xs-12">
                    <h3 style="border-bottom:1px solid #ddd;padding:10px;">
                        Multi-factor authentication
                    </h3>
                    <div style="padding: 0 10px">
                        <!-- ko ifnot: mfa_enabled -->
                        <p class="text-danger">
                            Multi-factor authentication is not enabled
                        </p>
                        <p>
                            Multi-factor authentication (MFA) provides another layer of security to your account. You need a multi-factor authentication app (usually on your mobile device) to enable it.
                        </p>
                        <a class="btn btn-sm btn-cpanel-success" data-bind="click: enable_mfa_modal.show">
                            Enable multi-factor authentication
                        </a>
                        <!-- /ko -->
                        <!-- ko if: mfa_enabled -->
                        <p class="text-success">
                            Multi-factor authentication is enabled
                        </p>
                        <a class="btn btn-sm btn-danger" data-bind="click: disable_mfa_modal.show">
                            Disable multi-factor authentication
                        </a>
                        <!-- /ko -->
                    </div>
                </div>
            </div>
            <!-- /ko -->
            <!-- ko if: user_has_feature('color_admin') -->
                <!-- ko renderComponent: color_settings --><!-- /ko -->
            <!-- /ko -->
        </div>
    `);

    self.sign_out = auth.sign_out;

    self.change_password_modal = self.new_instance(ChangePasswordModal);
    self.enable_mfa_modal = self.new_instance(EnableMFAModal);
    self.disable_mfa_modal = self.new_instance(DisableMFAModal);
    self.support_email = config.support_email;

    self.sign_out = function() {
        auth.sign_out();
    };

    self.login_with_password = ko.pureComputed(() => {
        let user = self.user();
        if (user) {
            return user.permissions.indexOf('login_with_password') !== -1;
        }

        return false;
    });

    self.mfa_enabled = ko.pureComputed(() => {
        let user = self.user();
        if (user) {
            return user.mfa_enabled;
        }

        return false;
    });

    self.color_settings = self.new_instance(AccountColorSettings, {
        id: 'color_settings',
    });

    self.when(
        self.change_password_modal,
        self.enable_mfa_modal,
        self.disable_mfa_modal,
        self.color_settings,
    ).done(() => {
        _dfd.resolve();
    });

    return self;
}
