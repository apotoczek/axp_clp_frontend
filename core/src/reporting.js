'use strict';

import '@babel/polyfill';

import 'hooks';
import 'extenders';

import 'src/403.ejs';
import 'src/404.ejs';
import 'src/500.ejs';

import 'src/styles/DEPLOYMENT.scss';

import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import pager from 'pager';
import auth from 'auth';
import globals from 'src/libs/globals';
import config from 'config';
import IdleCallback from 'src/libs/IdleCallback';
import DataThing from 'src/libs/DataThing';
import LocalStorage from 'src/libs/localstorage';
import Customizations from 'src/libs/Customizations';
import ReportingNav from 'src/libs/components/basic/ReportingNav';

import 'custombindings';
import 'metrics';
import 'utilities';
import 'googleMapsLoaderUtil';

let self = {};

let template_dfd = $.Deferred();

self.resolve_template_dfd = () => {
    template_dfd.resolve();
};

self.sign_out = auth.sign_out;

self.css = config.body_css || {};

let current = Date.now();
let key_val = LocalStorage.get('LastForceClear');

if (!key_val || key_val < config.last_localstorage_expiry) {
    LocalStorage.clear();
    LocalStorage.set('LastForceClear', current);
}

self.loading = ko.observable(true);
self.never_loaded = ko.observable(true);
self.user_has_feature = auth.user_has_feature;

self.user_has_exact_feature_set = arr => {
    let features = auth.user().permissions;
    if (features.length == arr.length) {
        for (let feature of features) {
            if (arr.indexOf(feature) == -1) {
                return false;
            }
        }
        return true;
    }
    return false;
};

self.sign_out = function() {
    auth.sign_out();
};

self._heartbeat = bison.net.api.useractionhandler.instance({
    url: 'heartbeat',
});

self.guard_has_one_of = (...features) => (page, route, callback) => {
    let has_one = features.reduce((res, feature) => res || auth.user_has_feature(feature), false);

    if (has_one) {
        callback();
    } else {
        pager.navigate('#!/start');
        setTimeout(() => {
            bison.utils.Notify(
                'Heads up!',
                "You don't have permission to view this page.",
                'alert-info',
            );
        }, 1500);
    }
};

self.guard_has_feature = feature => (page, route, callback) => {
    if (auth.user_has_feature(feature)) {
        callback();
    } else {
        pager.navigate('#!/start');
        setTimeout(() => {
            bison.utils.Notify(
                'Heads up!',
                "You don't have permission to view this page.",
                'alert-info',
            );
        }, 1500);
    }
};

let requireViewModel = loadModule => (callback, page) => {
    loadModule().then(Module => {
        self.loading(true);
        let viewModel = new Module.default(page);
        $(page.element).hide();

        $('#big_loader').show();

        viewModel.dfd.then(() => {
            callback(viewModel);

            $('#big_loader').hide();

            $(page.element).fadeIn(0, () => {
                $(page.element).attr('style', '');
            });

            $(window).trigger('resize');

            self.loading(false);
            self.never_loaded(false);
        });
    });
};

let page_configs = [
    {
        id: 'documents',
        guard: self.guard_has_feature('dashboards_beta'),
        title: 'Dashboards',
        sourceCache: true,
        sourceOnShow: require('src/pages/documents/index.html'),
        withOnShow: requireViewModel(() => import('src/vm/documents')),
        afterShow: ({page}) => {
            if (page.ctx && page.ctx.mount) {
                page.ctx.mount();
            }

            window.Metrics.pageview({page});
        },
        beforeHide: ({page}) => {
            if (page.ctx && page.ctx.unmount) {
                page.ctx.unmount();
            }
        },
    },
    {
        id: 'reporting-dashboard',
        role: 'start',
        title: 'Reporting Dashboard',
        sourceCache: true,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/pc_dashboard')),
        afterShow: window.Metrics.pageview,
    },
    {
        id: 'reporting-analytics',
        title: 'Analytics',
        sourceCache: true,
        sourceOnShow: require('src/pages/reporting/pc_analytics.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/pc_analytics')),
        afterShow: window.Metrics.pageview,
    },
    {
        id: 'account',
        title: 'Account Settings',
        sourceCache: true,
        sourceOnShow: require('src/pages/account.html'),
        withOnShow: requireViewModel(() => import('src/vm/account')),
        afterShow: window.Metrics.pageview,
    },
    {
        id: '?',
        title: 'Page Not Found',
        sourceCache: true,
        sourceOnShow: require('src/pages/notfound.html'),
        withOnShow: requireViewModel(() => import('src/vm/notfound')),
    },
];

self.pages = page_configs.map(options => {
    let page = new pager.Page();
    page.valueAccessor = () => options;
    return page;
});

/**
 * Listens for changes in the location hash and sends a request
 * to the backend that register a page view every time the hash
 * is changed. If the hash is "changed" to the same value as it
 * was before the change (i.e. it isnt changed, just reassigned)
 * another page view will not be registered.
 */
self.register_page_views = () => {
    let register_page_view = DataThing.backends.useractionhandler({
        url: 'register_pageview',
    });

    // Save current hash to skip registering a new pageview on same
    // hash as before
    let currentHash = '';
    let hashchange = () => {
        if (location.hash !== currentHash) {
            currentHash = location.hash;
            register_page_view({data: {raw_page_url: currentHash}});
        }
    };

    // On initial page load we need to manually register a pageview.
    $(document).ready(hashchange);

    // Listen for changes in the hash
    $(window).bind('hashchange.global', hashchange);
};

$.when(globals.dfd, Customizations.dfd).then(() => {
    pager.Href.hash = '#!/';
    window.vm = self;

    self.main_nav = new ReportingNav({
        loading: self.loading,
    });

    pager.extendWithPage(self);

    ko.applyBindings(self);

    $.when(template_dfd).done(() => {
        if (window.location.hash === undefined || window.location.hash.length === 0) {
            pager.start('reporting-dashboard');
        } else {
            pager.start();
        }

        self.start_time = null;

        self.heartbeat = new IdleCallback({
            id: 'heartbeat',
            callback: () => {
                self._heartbeat({
                    data: {
                        hash: window.location.hash,
                        user_agent: window.navigator.userAgent,
                        start_time: self.start_time,
                    },
                    success: bison.net.api.XHRSuccess(response => {
                        if (response.current_time && self.start_time === null) {
                            self.start_time = response.current_time;
                        }
                        window.reset_network_alert();
                    }),
                    error: bison.net.api.XHRError(() => {
                        window.show_network_alert();
                    }),
                });
            },
            idle_timeout: config.heartbeat_idle_timeout,
            interval: config.heartbeat_interval,
        });

        DataThing.setup_status_check();

        self.register_page_views();
    });
});
