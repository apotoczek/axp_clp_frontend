/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import Form from 'src/libs/components/forms/Form';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import jstz from 'jstz';

export default function() {
    let self = new Context({
        id: 'password_reset',
    });

    self.dfd = self.new_deferred();

    self._password_reset = DataThing.backends.auth({
        url: 'password_reset',
    });

    self._validate_password = DataThing.backends.auth({
        url: 'validate_password',
    });

    self._validate_mfa_for_token = DataThing.backends.auth({
        url: 'validate_mfa_for_token',
    });

    self.token_uid = ko.observable();

    self.loading = ko.observable(false);

    self.logo_urls = config.logo_urls;
    self.logo_style = config.public_logo_style;
    self.support_email = config.support_email || 'support@cobaltlp.com';
    self.support_phone = config.support_phone;
    self.privacy_policy_url = config.privacy_policy_url;
    self.terms_of_service_url = config.terms_of_service_url;

    self.mfa = ko.observable(false);
    self.mfa_token = ko.observable();
    self.mfa_validation = ko.observable();

    self.form = self.new_instance(Form, {
        fields: [
            {
                key: 'new_password',
                value: ko.observable(),
                label: 'New Password',
                required: true,
                min_length: 10,
                max_length: 1024,
            },
            {
                key: 'new_password_confirm',
                label: 'Confirm Password',
                value: ko.observable(),
                required: true,
                min_length: 10,
                max_length: 1024,
                matches: 'new_password',
                mismatch_msg: 'The passwords do not match..',
            },
            {
                key: 'token_uid',
                value: self.token_uid,
            },
            {
                key: 'mfa_validation',
                value: self.mfa_validation,
            },
            {
                key: 'utc_offset',
                value: new Date().getTimezoneOffset() * -60,
            },
            {
                key: 'timezone',
                value: jstz.determine().name(),
            },
        ],
    });

    self.password_valid = ko.observable();
    self._password_feedback = ko.observable();

    self.password_feedback = ko.pureComputed(() => {
        let feedback = self._password_feedback();

        if (feedback) {
            return feedback;
        }

        if (self.password_valid() && !self.form.validate()) {
            return self.form.fields.new_password_confirm.message();
        }
    });

    self.disable_button = ko.pureComputed(() => {
        return !self.password_valid() || !self.form.validate();
    });

    self.form.fields.new_password.value.subscribe(password => {
        let token_uid = self.token_uid();

        if (token_uid && password && password.length > 0) {
            self._validate_password({
                data: {
                    token_uid: token_uid,
                    password: password,
                },
                success: DataThing.api.XHRSuccess(({valid, reason}) => {
                    self.password_valid(valid);
                    self._password_feedback(reason);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        } else {
            self.password_valid(undefined);
            self._password_feedback(undefined);
        }
    });

    self.validate_mfa = function() {
        let mfa_token = self.mfa_token();

        if (mfa_token && mfa_token.length > 0) {
            self.loading(true);
            self._validate_mfa_for_token({
                data: {
                    token_uid: self.token_uid(),
                    mfa_token: mfa_token,
                },
                success: bison.net.api.XHRSuccess(hash => {
                    self.loading(false);

                    if (hash) {
                        self.mfa_validation(hash);
                        self.mfa(false);
                        self.mfa_token(undefined);
                    } else {
                        self.mfa_token(undefined);
                        bison.utils.Notify('Heads up!', 'Invalid MFA Token..', 'alert-danger');
                    }
                }),
                error: bison.net.api.XHRError(() => {
                    self.loading(false);
                }),
            });
        }
    };

    self.submit = function() {
        if (self.form.validate(true)) {
            self.loading(true);

            self._password_reset({
                data: self.form.data(),
                success: bison.net.api.XHRSuccess(() => {
                    self.form.show_validation(false);
                }),
                error: bison.net.api.XHRError(() => {
                    self.form.show_validation(true);
                    self.loading(false);
                }),
            });
        } else {
            self.form.show_validation(true);
        }
    };

    Observer.register_hash_listener('password-reset', url => {
        if (url.length == 2 && Utils.valid_uid(url[1])) {
            self.token_uid(url[1]);
        } else if (url.length == 3 && Utils.valid_uid(url[1]) && url[2] == 'mfa') {
            self.token_uid(url[1]);
            self.mfa(true);
        } else {
            window.redirect(config.sign_in_url);
        }
    });

    self.when(self.form).done(() => {
        self.dfd.resolve();
    });

    return self;
}
