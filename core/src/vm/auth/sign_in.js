/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import Form from 'src/libs/components/forms/Form';
import Context from 'src/libs/Context';
import DataThing from 'src/libs/DataThing';
import Cookies from 'js-cookie';
import jstz from 'jstz';

export default function() {
    let self = new Context({
        id: 'sign_in',
    });

    self.dfd = self.new_deferred();

    self.password_reset_url = config.password_reset_url;

    self.sign_in = DataThing.backends.auth({
        url: 'sign_in',
    });

    self.loading = ko.observable(false);

    self.btn_html = ko.computed(() => {
        if (self.loading()) {
            return '<i class="icon-spinner icon-spin"></i> Signing In..';
        }
        return 'Sign In';
    });

    self.logo_urls = config.logo_urls;
    self.logo_style = config.public_logo_style;
    self.terms_of_service_url = config.terms_of_service_url;
    self.platform_name = config.lang.platform_name;
    self.support_email = config.support_email || 'support@cobaltlp.com';
    self.support_phone = config.support_phone;
    self.deployment = __DEPLOYMENT__;

    self.SIGN_IN_EMAIL = Cookies.get('SIGN_IN_EMAIL')
        ? Cookies.get('SIGN_IN_EMAIL').decodeBase64()
        : false;

    self.mfa = ko.observable(false);

    self.mfa_token = ko.observable();

    self.form = self.new_instance(Form, {
        fields: [
            {
                key: 'email',
                label: 'Email',
                value: ko.observable(self.SIGN_IN_EMAIL || undefined),
                required: true,
                is_valid_email: true,
                disabled: !!self.SIGN_IN_EMAIL,
            },
            {
                key: 'password',
                label: 'Password',
                value: ko.observable(),
                required: true,
                max_length: 2048,
            },
            {
                key: 'keep_logged_in',
                value: ko.observable(false),
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

    self.submit = function() {
        $('input[type=password]').change();
        $('input[type=text]').change();
        if (self.form.validate(true)) {
            self.loading(true);

            let data = self.form.data();

            if (self.mfa()) {
                data.mfa_token = self.mfa_token();
            }

            self.sign_in({
                data: data,
                success: bison.net.api.XHRSuccess(response => {
                    if (response && response.mfa_request) {
                        self.mfa(true);
                    }

                    self.form.show_validation(false);
                }),
                error: bison.net.api.XHRError(() => {
                    self.loading(false);
                    self.mfa(false);
                    self.mfa_token(undefined);
                    self.form.show_validation(true);
                }),
            });
        } else {
            self.form.show_validation(true);
        }
    };

    self.when(self.form).done(() => {
        self.dfd.resolve();
    });

    return self;
}
