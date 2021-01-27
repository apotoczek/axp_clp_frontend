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
import {conditional_element} from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import LocalStorage from 'src/libs/localstorage';
import Customizations from 'src/libs/Customizations';
import {ClientType} from 'src/libs/Enums';
import MainNav from 'src/libs/components/basic/MainNav';
import ReactDOM from 'react-dom';

import 'custombindings';
import 'metrics';
import 'utilities';
import 'googleMapsLoaderUtil';

const self = {};

const template_dfd = $.Deferred();

self.resolve_template_dfd = () => {
    template_dfd.resolve();
};

self.sign_out = auth.sign_out;

self.css = config.body_css || {};

const current = Date.now();
const key_val = LocalStorage.get('LastForceClear');

if (!key_val || key_val < config.last_localstorage_expiry) {
    LocalStorage.clear();
    LocalStorage.set('LastForceClear', current);
}

self.development_mode = __ENV__ === 'development' && __DEV__.debugBar;
self.loading = ko.observable(true);
self.never_loaded = ko.observable(true);
self.user_has_feature = auth.user_has_feature;

self.user_has_exact_feature_set = arr => {
    const features = auth.user().permissions;
    if (features.length == arr.length) {
        for (const feature of features) {
            if (arr.indexOf(feature) == -1) {
                return false;
            }
        }
        return true;
    }
    return false;
};

function unmountReactComponent({page}) {
    if (page.element.children.length) {
        const child = page.element.children[0];
        if (child._bReactComponent) {
            ReactDOM.unmountComponentAtNode(child);
        }
    }
}

self.sign_out = function() {
    auth.sign_out();
};

self._heartbeat = bison.net.api.useractionhandler.instance({
    url: 'heartbeat',
});

self.guard_has_one_of = (...features) => (page, route, callback) => {
    const has_one = features.reduce((res, feature) => res || auth.user_has_feature(feature), false);

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

const requireViewModel = loadModule => (callback, page) => {
    loadModule().then(Module => {
        self.loading(true);
        const viewModel = new Module.default(page);
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

const page_configs = [
    ...conditional_element(
        [
            {
                id: 'playground',
                title: 'React Playground',
                sourceCache: false,
                sourceOnShow: require('src/pages/react.html'),
                withOnShow: requireViewModel(() => import('src/vm/playground')),
                afterShow: window.Metrics.pageview,
                beforeHide: unmountReactComponent,
            },
        ],
        self.development_mode,
    ),
    {
        id: 'company-analytics',
        title: 'Analytics - Companies',
        guard: self.guard_has_feature('analytics'),
        sourceCache: true,
        sourceOnShow: require('src/pages/analytics/analytics.html'),
        withOnShow: requireViewModel(() => import('src/vm/analytics/company-analytics')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'fund-analytics',
        title: 'Analytics - Funds',
        guard: self.guard_has_feature('analytics'),
        sourceCache: true,
        sourceOnShow: require('src/pages/analytics/analytics.html'),
        withOnShow: requireViewModel(() => import('src/vm/analytics/fund-analytics')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'portfolio-analytics',
        title: 'Analytics - Portfolios',
        guard: self.guard_has_feature('analytics'),
        sourceCache: true,
        sourceOnShow: require('src/pages/analytics/analytics.html'),
        withOnShow: requireViewModel(() => import('src/vm/analytics/portfolio-analytics')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'documents',
        title: 'Reports',
        guard: self.guard_has_feature('dashboards_beta'),
        sourceCache: false,
        sourceOnShow: require('src/pages/documents/index.html'),
        withOnShow: requireViewModel(() => import('src/vm/documents')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'funds',
        guard: self.guard_has_feature('view_market_data'),
        title: 'Funds',
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/funds.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/funds')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'diligence',
        guard: self.guard_has_feature('diligence'),
        title: 'Diligence',
        sourceCache: true,
        sourceOnShow: require('src/pages/diligence/diligence.html'),
        withOnShow: requireViewModel(() => import('src/vm/diligence/diligence')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'funds-in-market',
        guard: self.guard_has_feature('view_market_data'),
        title: 'Funds in Market',
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/funds_in_market.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/funds_in_market')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'firms',
        guard: self.guard_has_feature('view_market_data'),
        title: 'Firms',
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/firms.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/firms')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'families',
        guard: self.guard_has_feature('view_market_data'),
        title: 'Families',
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/families.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/families')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'fund-in-family',
        guard: self.guard_has_feature('view_market_data'),
        title: 'Fund in Family',
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/fund_in_family.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/fund_in_family')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'provisional-fund',
        guard: self.guard_has_feature('diligence'),
        title: 'Provisional Fund',
        sourceCache: true,
        sourceOnShow: require('src/pages/diligence/provisional_fund.html'),
        withOnShow: requireViewModel(() => import('src/vm/diligence/provisional_fund')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'investors',
        title: 'Investors',
        guard: self.guard_has_feature('view_market_data'),
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/investors.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/investors')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'investments',
        title: 'Investments',
        guard: self.guard_has_feature('view_market_data'),
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/investments.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/investments')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'data-manager',
        title: 'Data Manager',
        guard: self.guard_has_feature('data_manager'),
        sourceCache: true,
        sourceOnShow: require('src/pages/data_manager.html'),
        withOnShow: requireViewModel(() => import('src/vm/datamanager')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'benchmark',
        title: 'Benchmark',
        guard: self.guard_has_feature('view_benchmarks'),
        sourceCache: true,
        sourceOnShow: require('src/pages/benchmark/benchmark.html'),
        withOnShow: requireViewModel(() => import('src/vm/benchmark/benchmark')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'market-analysis',
        title: 'Market Analysis',
        guard: self.guard_has_feature('market_analysis_access'),
        sourceCache: true,
        sourceOnShow: require('src/pages/benchmark/benchmark.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_analysis')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-relationships',
        title: 'My Portals',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_relationships')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-activity',
        title: 'Activity',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_activity')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-analytics',
        title: 'Analytics',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/gp_analytics.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_analytics')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-templates',
        title: 'Data Templates',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_templates')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-mandates',
        title: 'Recurring Data Requests',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_mandates')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reporting-emails',
        title: 'Email Center',
        guard: self.guard_has_feature('data_collection'),
        sourceCache: false,
        sourceOnShow: require('src/pages/reporting/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/reporting/gp_emails')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'risk-return',
        title: 'Risk / Return',
        guard: self.guard_has_feature('view_benchmarks'),
        sourceCache: true,
        sourceOnShow: require('src/pages/benchmark/benchmark.html'),
        withOnShow: requireViewModel(() => import('src/vm/risk_return')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'lists',
        title: 'Build Peer Set',
        guard: self.guard_has_feature('active_subscription'),
        sourceCache: true,
        sourceOnShow: require('src/pages/market_insights/lists.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_insights/lists')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'report-menu',
        title: 'Report Menu',
        guard: self.guard_has_one_of('visual_reports', 'data_reports'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/report_menu.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/report_menu')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'visual-reports',
        title: 'Visual Reports',
        guard: self.guard_has_feature('visual_reports'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/visual_reports.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/visual_reports')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'reports',
        title: 'Reports',
        guard: self.guard_has_one_of('visual_reports', 'data_reports'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/reports.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/reports')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'fund-modeler',
        title: 'Fund Modeler',
        guard: self.guard_has_feature('fund_modeler'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/live_reports.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/live_reports')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'wizard',
        title: 'Wizard',
        guard: self.guard_has_feature('fund_modeler'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/live_reports.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/new_wizard_container')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'data-reports',
        title: 'Data Reports',
        guard: self.guard_has_feature('data_reports'),
        sourceCache: true,
        sourceOnShow: require('src/pages/reports/data_reports.html'),
        withOnShow: requireViewModel(() => import('src/vm/reports/data_reports')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: 'start',
        title: `Cobalt ${__DEPLOYMENT__ == 'hl' ? '' : 'Dashboard'}`,
        role: 'start',
        sourceCache: true,
        sourceOnShow: require(`src/pages/${
            __DEPLOYMENT__ == 'hl' ? 'start_page' : 'dashboard'
        }.html`),
        withOnShow: requireViewModel(() =>
            import(`src/vm/${__DEPLOYMENT__ == 'hl' ? 'start_page' : 'dashboard'}`),
        ),
        beforeHide: unmountReactComponent,
    },
    {
        id: 'account',
        title: 'Account Settings',
        sourceCache: true,
        sourceOnShow: require('src/pages/account.html'),
        withOnShow: requireViewModel(() => import('src/vm/account')),
        afterShow: window.Metrics.pageview,
        beforeHide: unmountReactComponent,
    },
    {
        id: '?',
        title: 'Page Not Found',
        sourceCache: true,
        sourceOnShow: require('src/pages/notfound.html'),
        withOnShow: requireViewModel(() => import('src/vm/notfound')),
        beforeHide: unmountReactComponent,
    },
];

self.pages = page_configs.map(options => {
    const page = new pager.Page();
    page.valueAccessor = () => options;
    return page;
});

function maybeRedirect(hash) {
    const url = hash.split('/');

    if (url.length > 1) {
        const [_bang, base, ...rest] = url;

        if (base === 'dashboards') {
            if (rest.length) {
                redirect(`#!/documents/${rest.join('/')}`);
            } else {
                redirect('#!/documents/browse');
            }
        }
    }
}

/**
 * Listens for changes in the location hash and sends a request
 * to the backend that register a page view every time the hash
 * is changed. If the hash is "changed" to the same value as it
 * was before the change (i.e. it isnt changed, just reassigned)
 * another page view will not be registered.
 */
self.register_hash_listeners = () => {
    const register_page_view = DataThing.backends.useractionhandler({
        url: 'register_pageview',
    });

    // Save current hash to skip registering a new pageview on same
    // hash as before
    let currentHash = '';
    const hashchange = () => {
        if (location.hash !== currentHash) {
            currentHash = location.hash;
            register_page_view({data: {raw_page_url: currentHash}});
        }

        maybeRedirect(location.hash);
    };

    // On initial page load we need to manually register a pageview.
    $(document).ready(hashchange);

    // Listen for changes in the hash
    $(window).bind('hashchange.global', hashchange);
};

$.when(globals.dfd, Customizations.dfd).then(() => {
    // Route non-reporting users out of /app and to /reporting
    if (globals.client().client_type === ClientType.PortfolioCompany) {
        location.assign('/reporting');

        // Should be OK to return here, as the location.assign
        // will be loading a separate app.
        return;
    }

    pager.Href.hash = '#!/';
    window.vm = self;
    self.main_nav = new MainNav({
        loading: self.loading,
        development_mode: self.development_mode,
    });

    pager.extendWithPage(self);

    ko.applyBindings(self);

    $.when(template_dfd).done(() => {
        if (window.location.hash === undefined || window.location.hash.length === 0) {
            pager.start('start');
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

        self.register_hash_listeners();
    });
});
