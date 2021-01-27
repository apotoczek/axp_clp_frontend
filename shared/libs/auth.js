/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import config from 'config';
import 'utilities';

let self = {};

self.dfd = $.Deferred();

self.api = bison.net.api;
self.useractionhandler = self.api.useractionhandler.instance;
self.dataprovider = self.api.dataprovider.instance;

self._sign_out = self.api.auth.instance({
    url: 'sign_out',
});

self.sign_out = function(callback) {
    if (callback === undefined) {
        callback = () => {
            redirect(config.core_url);
        };
    }

    self._sign_out({
        data: {},
        success: self.api.XHRSuccess(() => {
            callback();
        }),
        error: self.api.XHRError(() => {
            callback();
        }),
    });
};

self.get_client = self.dataprovider({
    url: 'get_current_client',
});

self.get_user = self.dataprovider({
    url: 'get_current_user',
});

self.check_authenticated = self.api.auth.instance({
    url: 'is_authenticated',
});

self.user = ko.syncedObservable('user');
self.client = ko.syncedObservable('client');

self.is_authenticated = ko.syncedObservable('is_authenticated', false);

self.user_has_feature = function(feature) {
    let user = self.user();

    if (user) {
        if (user.features) {
            return user.features.indexOf(feature) > -1;
        }
    }

    return false;
};

self.required_features = config.required_features || ['bison_internal'];

self.is_signed_in = ko.computed(() => {
    return self.is_authenticated() && self.user_has_features(self.required_features);
});

self.user_has_features = function(required_features) {
    let user = self.user();

    if (!Object.isArray(required_features)) {
        required_features = [required_features];
    }

    if (self.is_authenticated() && user) {
        let features = user.features || [];
        return required_features.subtract(features).length === 0;
    }

    return false;
};

let do_sign_out = bison.net.api.auth.instance({
    url: 'sign_out',
});

self.sign_out = () => {
    do_sign_out({
        data: {},
        success: bison.net.api.XHRSuccess(() => redirect(config.core_url)),
    });
};

if (config.testing) {
    self.dfd.resolve();
} else {
    self.check_authenticated({
        data: {},
        success: bison.net.api.XHRSuccess(result => {
            self.is_authenticated(result.is_authenticated);
            if (result.is_authenticated) {
                let user_dfd = $.Deferred();
                let client_dfd = $.Deferred();

                self.get_user({
                    data: {},
                    success: self.api.XHRSuccess(user => {
                        window.reset_network_alert();
                        self.user(user);
                        user_dfd.resolve();
                    }),
                    error: self.api.XHRError(() => {
                        window.show_network_alert();
                    }),
                });

                self.get_client({
                    data: {},
                    success: self.api.XHRSuccess(client => {
                        window.reset_network_alert();
                        self.client(client);
                        client_dfd.resolve();
                    }),
                    error: self.api.XHRError(() => {
                        window.show_network_alert();
                    }),
                });

                $.when(user_dfd, client_dfd).done(() => {
                    self.dfd.resolve();
                });
            } else {
                self.dfd.resolve();
            }
        }),
        error: self.api.XHRError(() => {}),
    });
}

export default self;
