import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default class LoginPermissionCheck extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div>
                <!-- ko if: show_permission_message -->
                    <div class="text-danger">
                        Warning: users without either the "Login with Password" or the "Login with SSO" permission won't be able to log in
                    </div>
                <!-- /ko -->
                <!-- ko if: show_permission_recommendation -->
                    <div class="text-danger">
                        Note: It's recommended to disable password login for SSO users, aside from admins and special cases
                    </div>
                <!-- /ko -->
                <!-- ko if: show_sso_missing_config_message -->
                    <div class="text-danger">
                        Warning: the "Login with SSO" permission requires an SSO endpoint to be configured
                    </div>
                <!-- /ko -->
                <!-- ko if: show_sso_missing_permission_message -->
                    <div class="text-danger">
                        Warning: SSO endpoint is configured, but there is no permission granted to use it
                    </div>
                <!-- /ko -->
            </div>
        `);

        this.permissions = () =>
            this.opts.permissions && this.opts.permissions() && this.opts.permissions().results;
        this.sso_endpoints = () =>
            this.opts.sso_endpoints &&
            this.opts.sso_endpoints() &&
            this.opts.sso_endpoints().results;

        this.show_permission_message = ko.pureComputed(() => {
            return (
                this.permissions() &&
                !this._has_permission('login_with_sso') &&
                !this._has_permission('login_with_password')
            );
        });
        this.show_permission_recommendation = ko.pureComputed(() => {
            return (
                this.permissions() &&
                this._has_permission('login_with_sso') &&
                this._has_permission('login_with_password')
            );
        });
        this.show_sso_missing_config_message = ko.pureComputed(() => {
            return (
                this.sso_endpoints() &&
                this.permissions() &&
                this._has_permission('login_with_sso') &&
                !this.sso_endpoints().length
            );
        });
        this.show_sso_missing_permission_message = ko.pureComputed(() => {
            return (
                this.sso_endpoints() &&
                this.permissions() &&
                this.sso_endpoints().length &&
                !this._has_permission('login_with_sso')
            );
        });

        this._has_permission = function(id) {
            for (let i = 0; i < this.permissions().length; i++) {
                let p = this.permissions()[i];
                if (p.permission_identifier === id && p.grant && p.grant.enabled) {
                    return true;
                }
            }
            return false;
        };

        _dfd.resolve();
    }
}
