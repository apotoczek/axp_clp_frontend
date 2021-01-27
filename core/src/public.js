'use strict';

import '@babel/polyfill';

import 'hooks';
import 'extenders';

import 'src/styles/DEPLOYMENT.scss';

import 'src/maintenance.html';
import 'src/libs/templates.html';
import 'src/img/favicon/cobalt/favicon.ico';

import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import pager from 'pager';
import auth from 'auth';

import Activation from 'src/vm/auth/activation';
import RequestPasswordReset from 'src/vm/auth/request_password_reset';
import PasswordReset from 'src/vm/auth/password_reset';
import PublicPage from 'src/vm/public_page';
import SignIn from 'src/vm/auth/sign_in';
import AcceptInvitationVM from 'src/vm/reporting/accept_invitation';
import {ClientType} from 'src/libs/Enums';

import 'custombindings';
import 'metrics';
import 'utilities';

let self = {};

self.loading = ko.observable(true);
self.is_authenticated = auth.is_authenticated;

let template_dfd = $.Deferred();

self.resolve_template_dfd = () => {
    template_dfd.resolve();
};

let platform_name = config.lang.platform_name;

self.sign_out = function() {
    auth.sign_out();
};

let initViewModel = Module => (callback, page) => {
    self.loading(true);
    let viewModel = new Module(page);
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
    });
};

self.pages = [
    {
        id: 'activation',
        title: 'Activate Account',
        sourceOnShow: require('src/pages/auth/activation.html'),
        withOnShow: initViewModel(Activation),
        afterShow: Metrics.pageview,
    },
    {
        id: 'request-password-reset',
        title: 'Request Password Reset',
        sourceOnShow: require('src/pages/auth/request_password_reset.html'),
        withOnShow: initViewModel(RequestPasswordReset),
        afterShow: Metrics.pageview,
    },
    {
        id: 'password-reset',
        title: 'Reset Password',
        sourceOnShow: require('src/pages/auth/password_reset.html'),
        withOnShow: initViewModel(PasswordReset),
        afterShow: Metrics.pageview,
    },
    {
        id: 'reset-thanks',
        title: 'Password Reset Requested',
        sourceOnShow: require('src/pages/auth/reset_thanks.html'),
        withOnShow: initViewModel(PublicPage),
        afterShow: Metrics.pageview,
    },
    {
        id: 'sign-in',
        role: 'start',
        title: `Sign in to ${platform_name}`,
        sourceOnShow: require('src/pages/auth/sign_in.html'),
        withOnShow: initViewModel(SignIn),
        afterShow: Metrics.pageview,
    },
    {
        id: 'reporting-invitation',
        title: 'Invitation to submit data',
        sourceOnShow: require('src/pages/react.html'),
        withOnShow: initViewModel(AcceptInvitationVM),
        afterShow: Metrics.pageview,
    },
    {
        id: 'invalid-token',
        title: 'Invalid Token',
        sourceOnShow: require('src/pages/auth/invalid_token.html'),
        withOnShow: initViewModel(PublicPage),
        afterShow: Metrics.pageview,
    },
    {
        id: 'download-error',
        title: 'Download Error',
        sourceOnShow: require('src/pages/auth/download_error.html'),
        withOnShow: initViewModel(PublicPage),
        afterShow: Metrics.pageview,
    },
    {
        id: '?',
        title: 'Page Not Found',
        sourceOnShow: require('src/pages/notfound.html'),
        withOnShow: initViewModel(PublicPage),
        afterShow: Metrics.pageview,
    },
].map(options => {
    let page = new pager.Page();
    page.valueAccessor = () => options;
    return page;
});

self.get_hash = location => {
    let loc = location || window.location;

    if (loc.hash && loc.hash.length > 0) {
        return loc.hash;
    }

    let items = loc.search.substr(1).split('&');

    for (let index = 0; index < items.length; index++) {
        let tmp = items[index].split('=');
        if (tmp[0] === '_escaped_fragment_') {
            return `#!${decodeURIComponent(tmp[1])}`;
        }
    }

    return '';
};

self._hash = self.get_hash();

if (self._hash === '#!' || self._hash === '#!/') {
    redirect('/');
}

self.initialized = ko.observable(false);

const base_url_for_client = client => {
    if (client.client_type === ClientType.PortfolioCompany) {
        return config.reporting_base_url;
    }
    return config.base_url;
};

$.when(auth.dfd).done(() => {
    if (
        auth.is_authenticated() &&
        ['', '#!', '#!/', '#!/sign-in', '#!/sign-in/'].indexOf(self._hash) > -1
    ) {
        redirect(base_url_for_client(auth.client()));
        return;
    }

    pager.Href.hash = '#!/';

    window.vm = self;

    pager.extendWithPage(self);

    ko.applyBindings(self);

    $.when(template_dfd).done(() => {
        self.initialized(true);
        pager.start();
    });
});
