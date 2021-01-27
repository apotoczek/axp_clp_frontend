/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import pager from 'pager';
import auth from 'auth';

export default function() {
    let self = this;
    self.dfd = $.Deferred();

    self.email = ko.observable();
    self.password = ko.observable();
    self.mfa_token = ko.observable();
    self.mfa = ko.observable(false);
    self.keep_logged_in = ko.observable(false);

    self.loading = ko.observable(false);

    self._sign_in = bison.net.api.auth.instance({
        url: 'sign_in',
    });

    self.reset = function() {
        self.email(undefined);
        self.password(undefined);
        self.keep_logged_in(false);
        self.mfa(false);
        self.mfa_token(undefined);
        self.loading(false);
    };

    self.sign_in = function() {
        self.loading(true);

        self._sign_in({
            data: {
                email: self.email(),
                password: self.password(),
                mfa_token: self.mfa_token(),
                keep_logged_in: self.keep_logged_in(),
                admin: true,
            },
            success: bison.net.api.XHRSuccess(response => {
                if (response && response.mfa_request) {
                    self.mfa(true);
                    self.loading(false);
                } else {
                    window.location.reload();
                }
            }),
            error: bison.net.api.XHRError(() => {
                self.reset();
            }),
        });
    };

    self.is_signed_in = auth.is_signed_in;

    if (self.is_signed_in()) {
        pager.navigate('#!/dashboard');
    }

    $.when(auth.dfd).done(() => {
        self.dfd.resolve();
    });
}
