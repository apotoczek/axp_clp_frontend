/* global ga*/
/* eslint no-console: "off" */

import ko from 'knockout';

import bison from 'bison';
import config from 'config';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

if (config.google_analytics_id) {
    /* eslint-disable no-restricted-syntax */
    (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        (i[r] =
            i[r] ||
            function() {
                (i[r].q = i[r].q || []).push(arguments);
            }),
            (i[r].l = 1 * new Date());
        (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    /* eslint-enable no-restricted-syntax */

    const ga_dimensions = {
        DEVELOPMENT: 'dimension1',
    };

    ga('create', config.google_analytics_id, 'auto');
    ga('set', 'transport', 'beacon');

    if (config.dev) {
        ga('set', ga_dimensions.DEVELOPMENT, true);
    }
} else {
    window.ga = undefined;
}

let self = {};

self.api = bison.net.api;

self.user = ko.syncedObservable('user');
self.client = ko.syncedObservable('client');

window.Metrics = {
    pageview: function() {
        if (ga) {
            ga('send', 'pageview');
        }
    },
    sub_pageview: function() {
        if (ga) {
            ga('send', 'pageview');
        }
    },
};

self._user_action = DataThing.backends.useractionhandler({
    url: 'record_user_action',
});

self.user_action = {
    log: function(data) {
        self._user_action({
            data: data,
            success: DataThing.api.XHRSuccess(() => {}),
            error: DataThing.api.XHRError(() => {}),
        });
    },
};

Observer.register_for_id('UserAction', 'record_action', self.user_action.log);
