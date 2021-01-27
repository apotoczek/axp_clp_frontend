/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import auth from 'auth';
import config from 'config';
import Cookies from 'js-cookie';

import 'src/libs/HeapAnalytics';

let self = {};
self.dfd = $.Deferred();

self.client = ko.syncedObservable('client');
self.user = ko.syncedObservable('user');
self.user_alerts = ko.observable();

self.user_start_url = function() {
    let user = self.user();
    if (user) {
        return ko.unwrap(user.start_url);
    }
};

self.other_users = ko.computed(() => {
    let client = self.client();
    let user = self.user();
    if (client && client.users && user) {
        return self.client().users.filter(other_user => {
            return other_user.uid !== user.uid;
        });
    }
    return [];
});

$.when(auth.dfd).done(() => {
    if (auth.is_authenticated()) {
        // heap analytics attach cobalt user to heap user
        if (config.enable_heap_tracking && config.heap_analytics_id) {
            let user = auth.user();
            heap.identify(user.uid);
            heap.addUserProperties({
                name: user.name,
                email: user.email,
                client_name: user.client_name,
                client_uid: user.client_uid,
                mfa_enabled: user.mfa_enabled,
                title: user.title,
                uid: user.uid,
            });
        }

        self.dfd.resolve();
    } else {
        Cookies.set('SIGN_IN_REDIRECT', window.location.href.encodeBase64(), {
            path: '/',
            domain: config.cookie_domain,
        });
        window.redirect(config.sign_in_url);
        self.dfd.resolve();
    }
});

export default self;
