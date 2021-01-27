'use strict';

import '@babel/polyfill';

import 'hooks';
import 'extenders';

import 'src/403.ejs';
import 'src/404.ejs';
import 'src/500.ejs';

import 'src/libs/templates.html';
import 'src/styles/app.scss';

import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import pager from 'pager';
import auth from 'auth';
import DataThing from 'src/libs/DataThing';

import 'custombindings';
import 'utilities';
import 'metrics';

let self = {};

self.loading = ko.observable(true);

self.is_signed_in = auth.is_signed_in;

let template_dfd = $.Deferred();

self.resolve_template_dfd = () => {
    template_dfd.resolve();
};

self.allow_status_check = ko.pureComputed(() => auth.user_has_features(['status_check']));

self.allow_user_data = ko.pureComputed(() =>
    auth.user_has_features(['edit_user_data', 'edit_user_permissions']),
);

self.allow_remote_data_admin = ko.pureComputed(() => auth.user_has_features(['remote_data_admin']));

self.allow_user_stats = ko.pureComputed(() => auth.user_has_features(['view_usage_stats']));

self.allow_edit_funds_and_firms = ko.pureComputed(() =>
    auth.user_has_features(['edit_firms', 'edit_funds']),
);

self.allow_edit_companies = ko.pureComputed(() => auth.user_has_feature('edit_companies'));

self.allow_market_data = ko.pureComputed(() =>
    auth.user_has_features(['edit_firms', 'edit_funds', 'edit_investors', 'edit_investments']),
);

self.allow_activity = ko.pureComputed(() => auth.user_has_features(['edit_activity']));

self.allow_market_data_special = ko.pureComputed(() =>
    auth.user_has_features(['edit_anticipated_funds', 'edit_families']),
);

self.allow_tools = ko.pureComputed(() => auth.user_has_features(['export_fx_data']));

self.allow_data_collection = ko.pureComputed(() =>
    auth.user_has_features(['data_collection_admin']),
);

self.allow_config_admin = ko.pureComputed(() => auth.user_has_features(['config_admin']));

let requireViewModel = loadModule => (callback, page) => {
    loadModule().then(Module => {
        self.loading(true);
        let vm = new Module.default(page);
        $(page.element).hide();

        vm.dfd.then(() => {
            callback(vm);

            $(page.element).fadeIn(0, () => {
                $(page.element).attr('style', '');
            });

            $(window).trigger('resize');
            self.loading(false);
        });
    });
};

let guard_signed_in = condition => (page, route, callback) => {
    if (auth.is_authenticated()) {
        if (typeof condition === 'function') {
            if (condition()) {
                callback();
            } else {
                self.sign_out(() => pager.navigate('#!/unauthorized'));
            }
        } else {
            callback();
        }
    } else {
        pager.navigate('#!/sign-in');
    }
};

self.pages = [
    {
        id: 'sign-in',
        title: 'Commander - Sign In',
        sourceCache: true,
        sourceOnShow: require('src/pages/sign_in.html'),
        withOnShow: requireViewModel(() => import('src/vm/sign_in')),
    },
    {
        id: 'unauthorized',
        title: 'Commander - Unauthorized',
        sourceCache: true,
        sourceOnShow: require('src/pages/unauthorized.html'),
    },
    {
        id: 'dashboard',
        role: 'start',
        title: 'Commander - Dashboard',
        guard: guard_signed_in(),
        sourceCache: true,
        sourceOnShow: require('src/pages/start.html'),
        withOnShow: requireViewModel(() => import('src/vm/start')),
    },
    {
        id: 'users',
        title: 'Commander - Users',
        guard: guard_signed_in(self.allow_user_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/users.html'),
        withOnShow: requireViewModel(() => import('src/vm/users')),
    },
    {
        id: 'clients',
        title: 'Commander - Clients',
        guard: guard_signed_in(self.allow_user_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/clients.html'),
        withOnShow: requireViewModel(() => import('src/vm/clients')),
    },
    {
        id: 'permission-control',
        title: 'Commander - Permissions',
        guard: guard_signed_in(self.allow_user_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/permission_grants.html'),
        withOnShow: requireViewModel(() => import('src/vm/permission_grants')),
    },
    {
        id: 'api-keys',
        title: 'Commander - API Keys',
        guard: guard_signed_in(self.allow_user_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/api_keys')),
    },
    {
        id: 'metrics',
        title: 'Commander - Metrics',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/metrics.html'),
        withOnShow: requireViewModel(() => import('src/vm/metrics')),
    },
    {
        id: 'client_metrics',
        title: 'Commander - Client Metrics',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/metrics.html'),
        withOnShow: requireViewModel(() => import('src/vm/client_metrics')),
    },
    {
        id: 'user-activity',
        title: 'Commander - Status',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/user_activity.html'),
        withOnShow: requireViewModel(() => import('src/vm/user_activity')),
    },
    {
        id: 'action-activity',
        title: 'Commander - Status',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/action_activity.html'),
        withOnShow: requireViewModel(() => import('src/vm/action_activity')),
    },
    {
        id: 'cashflow-stats',
        title: 'Commander - Cashflow Stats',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/cashflow_stats.html'),
        withOnShow: requireViewModel(() => import('src/vm/cashflow_stats')),
    },
    {
        id: 'sign-ins',
        title: 'Commander - Sign Ins',
        guard: guard_signed_in(self.allow_user_stats),
        sourceCache: true,
        sourceOnShow: require('src/pages/sign_ins.html'),
        withOnShow: requireViewModel(() => import('src/vm/sign_ins')),
    },
    {
        id: 'firms',
        title: 'Commander - Firms',
        guard: guard_signed_in(self.allow_edit_funds_and_firms),
        sourceCache: true,
        sourceOnShow: require('src/pages/firms.html'),
        withOnShow: requireViewModel(() => import('src/vm/firms')),
    },
    {
        id: 'funds',
        title: 'Commander - Funds',
        guard: guard_signed_in(self.allow_edit_funds_and_firms),
        sourceCache: true,
        sourceOnShow: require('src/pages/funds.html'),
        withOnShow: requireViewModel(() => import('src/vm/funds')),
    },
    {
        id: 'companies',
        title: 'Commander - Companies',
        guard: guard_signed_in(self.allow_edit_companies),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/companies')),
    },
    {
        id: 'company',
        title: 'Commander - Company',
        guard: guard_signed_in(self.allow_edit_companies),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/company')),
    },
    {
        id: 'deals',
        title: 'Commander - Deals',
        guard: guard_signed_in(self.allow_edit_companies),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/deals')),
    },
    {
        id: 'deal',
        title: 'Commander - Deal',
        guard: guard_signed_in(self.allow_edit_companies),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/deal')),
    },
    {
        id: 'investors',
        title: 'Commander - Investors',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/investors.html'),
        withOnShow: requireViewModel(() => import('src/vm/investors')),
    },
    {
        id: 'investments',
        title: 'Commander - Investments',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/investments.html'),
        withOnShow: requireViewModel(() => import('src/vm/investments')),
    },
    {
        id: 'investor_contacts',
        title: 'Commander - Investor Conctacts',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/investor_contacts.html'),
        withOnShow: requireViewModel(() => import('src/vm/investor_contacts')),
    },
    {
        id: 'families',
        title: 'Commander - Families',
        guard: guard_signed_in(self.allow_market_data_special),
        sourceCache: true,
        sourceOnShow: require('src/pages/families.html'),
        withOnShow: requireViewModel(() => import('src/vm/families')),
    },
    {
        id: 'market_data_metrics',
        title: 'Commander - Metrics',
        guard: guard_signed_in(self.allow_market_data_special),
        sourceCache: true,
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: requireViewModel(() => import('src/vm/market_data_metrics')),
    },
    {
        id: 'anticipated-funds',
        title: 'Commander - Anticipated Funds',
        guard: guard_signed_in(self.allow_market_data_special),
        sourceCache: true,
        sourceOnShow: require('src/pages/anticipated_funds.html'),
        withOnShow: requireViewModel(() => import('src/vm/anticipated_funds')),
    },
    {
        id: 'sec-filing',
        title: 'Commander - SEC Filing',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/sec_filing.html'),
        withOnShow: requireViewModel(() => import('src/vm/sec_filing')),
    },
    {
        id: 'name-match',
        title: 'Commander - Name Match',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/name_match.html'),
        withOnShow: requireViewModel(() => import('src/vm/name_match')),
    },
    {
        id: 'status-checker',
        title: 'Commander - Status Checker',
        guard: guard_signed_in(self.allow_status_check),
        sourceCache: true,
        sourceOnShow: require('src/pages/status_checker.html'),
        withOnShow: requireViewModel(() => import('src/vm/status_checker')),
    },
    {
        id: 'fx-export',
        title: 'Commander - FX Export',
        guard: guard_signed_in(self.allow_market_data),
        sourceCache: true,
        sourceOnShow: require('src/pages/fx_export.html'),
        withOnShow: requireViewModel(() => import('src/vm/fx_export')),
    },
    {
        id: 'activity',
        title: 'Commander - Activity',
        guard: guard_signed_in(self.allow_activity),
        sourceCache: true,
        sourceOnShow: require('src/pages/activity.html'),
        withOnShow: requireViewModel(() => import('src/vm/activity')),
    },
    {
        id: 'remote_client',
        title: 'Commander - Remote Client',
        guard: guard_signed_in(),
        sourceCache: true,
        sourceOnShow: require('src/pages/remote_client.html'),
        withOnShow: requireViewModel(() => import('src/vm/remote_client')),
    },
    {
        id: 'data-collection',
        title: 'Commander - Data Collection',
        guard: guard_signed_in(self.allow_data_collection),
        sourceCache: true,
        sourceOnShow: require('src/pages/data_collection.html'),
        withOnShow: requireViewModel(() => import('src/vm/data_collection')),
    },
    {
        id: 'config',
        title: 'Commander - Developer / Configs',
        guard: guard_signed_in(self.config_admin),
        sourceCache: true,
        sourceOnShow: require('src/pages/config.html'),
        withOnShow: requireViewModel(() => import('src/vm/config')),
    },
    {
        id: 'command',
        title: 'Commander - Developer / Commands',
        guard: guard_signed_in(self.config_admin),
        sourceCache: true,
        sourceOnShow: require('src/pages/command.html'),
        withOnShow: requireViewModel(() => import('src/vm/command')),
    },
    {
        id: '?',
        title: 'Page Not Found',
        sourceCache: true,
        sourceOnShow: require('src/pages/notfound.html'),
        withOnShow: requireViewModel(() => import('src/vm/notfound')),
        afterShow: Metrics.pageview,
    },
].map(options => {
    let page = new pager.Page();
    page.valueAccessor = () => options;
    return page;
});

self.sign_out = callback => {
    let success_callback;
    if (typeof callback === 'function') {
        success_callback = callback;
    } else {
        success_callback = bison.net.api.XHRSuccess(() => {
            window.location.reload();
        });
    }

    auth.sign_out(() => {
        success_callback();
    });
};

self.email = ko.pureComputed(() => auth.user() && auth.user().email);

self.my_account = ko.pureComputed(() => {
    let user = auth.user();

    if (user) {
        return `#!/users/${user.uid}`;
    }

    return '#!/users/';
});

$.when(auth.dfd).done(() => {
    pager.Href.hash = '#!/';

    window.vm = self;

    pager.extendWithPage(self);

    ko.applyBindings(self);

    $.when(template_dfd).done(() => {
        if (auth.is_signed_in()) {
            let hash = window.location.hash;
            if ((hash && hash.indexOf('sign-in') > -1) || !hash || hash.length == 0) {
                pager.start('dashboard');
            } else {
                pager.start();
            }

            DataThing.setup_status_check();
        } else {
            pager.start('sign-in');
        }
    });
});
