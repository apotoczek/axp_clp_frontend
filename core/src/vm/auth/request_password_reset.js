/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import config from 'config';
import Form from 'src/libs/components/forms/Form';
import Context from 'src/libs/Context';
import DataThing from 'src/libs/DataThing';
import jstz from 'jstz';

export default function() {
    let self = new Context({
        id: 'request_password_reset',
    });

    self.dfd = self.new_deferred();

    self.send_password_reset_email = DataThing.backends.auth({
        url: 'send_password_reset_email',
    });

    self.loading = ko.observable(false);

    self.logo_urls = config.logo_urls;
    self.logo_style = config.public_logo_style;
    self.platform_name = config.lang.platform_name;

    self.form = self.new_instance(Form, {
        fields: [
            {
                key: 'email',
                label: 'Email',
                value: ko.observable(),
                required: true,
                is_valid_email: true,
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
        if (self.form.validate(true)) {
            self.loading(true);
            self.send_password_reset_email({
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

    self.when(self.form).done(() => {
        self.dfd.resolve();
    });

    return self;
}
