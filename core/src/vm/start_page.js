/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import auth from 'auth';

export default function() {
    let self = this;
    self.dfd = $.Deferred();

    self.support_email = config.support_email;
    self.support_phone = config.support_phone;
    self.platform_name = config.lang.platform_name;

    // Sections are from config
    self.sections = ko.pureComputed(() => {
        return config.lang.start_page.filter(section =>
            auth.user_has_features(section.required_features || []),
        );
    });

    // Default column style
    self.column_style = 'col-xs-12 col-md-4';

    // Override first column if we have less than 3
    if (self.sections().length == 1) {
        self.sections()[0].column_style = `col-md-offset-4 ${self.column_style}`;
    } else if (self.sections().length == 2) {
        self.sections()[0].column_style = `col-md-offset-2 ${self.column_style}`;
    }

    self.dfd.resolve();
}
