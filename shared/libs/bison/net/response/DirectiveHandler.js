/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import config from 'config';
import Notify from 'bison/utils/Notify';
import Confirm from 'bison/utils/Confirm';
import Cookies from 'js-cookie';

let self = {
    execute_directives: function(directives, name) {
        let deferreds = [];

        if (directives && name) {
            directives = directives.filter(directive => {
                return directive.name == name;
            });

            for (let i = 0, l = directives.length; i < l; i++) {
                let directive = directives[i];
                deferreds.push(self[directive.name](directive));
            }
        }

        return deferreds;
    },
    reload: function(directive) {
        if (
            typeof directive.body === 'object' &&
            directive.body !== null &&
            typeof directive.body.delay !== 'undefined'
        ) {
            setTimeout(() => {
                window.location.reload(true);
            }, directive.body.delay);
        } else {
            window.location.reload(true);
        }

        return $.Deferred().resolve();
    },
    redirect: function(directive) {
        if (
            typeof directive.body === 'object' &&
            typeof directive.body.url !== 'undefined' &&
            typeof directive.body.delay !== 'undefined'
        ) {
            setTimeout(() => {
                window.location.href = directive.body.url;
            }, directive.body.delay);
        } else {
            window.location.href = directive.body;
        }

        return $.Deferred().resolve();
    },
    notify: function(directive) {
        if (typeof directive.body !== 'undefined') {
            let dfd = $.Deferred();
            let notify = directive.body;

            Notify(
                notify.message,
                notify.description,
                typeof notify.type !== 'undefined' ? notify.type : '',
                notify.delay,
                () => {
                    dfd.resolve();
                },
            );

            return dfd;
        }

        return $.Deferred().resolve();
    },
    confirm: function(directive) {
        if (typeof directive.body !== 'undefined') {
            let dfd = $.Deferred();
            let confirm = directive.body;

            let callback;

            if (confirm.confirm_callback) {
                callback = function(confirmed) {
                    if (confirmed) {
                        $('body').trigger({
                            type: 'net.api.request',
                            payload: confirm.confirm_callback,
                        });
                    }
                    dfd.resolve();
                };
            } else if (confirm.confirm_directive && confirm.confirm_directive.name) {
                callback = function(confirmed) {
                    if (confirmed) {
                        self[confirm.confirm_directive.name](confirm.confirm_directive).done(() => {
                            dfd.resolve();
                        });
                    } else {
                        dfd.resolve();
                    }
                };
            } else {
                callback = function() {
                    dfd.resolve();
                };
            }

            let confirm_fn = function() {
                Confirm(
                    confirm.message,
                    callback,
                    confirm.description,
                    typeof confirm.type !== 'undefined' ? confirm.type : '',
                    confirm.confirm_text || 'Confirm',
                    confirm.cancel_text || false,
                    confirm.top || false,
                    confirm.auto_confirm || false,
                );
            };

            if (confirm.initial_delay) {
                setTimeout(confirm_fn, confirm.initial_delay);
                dfd.resolve();
            } else {
                confirm_fn();
            }

            return dfd;
        }

        return $.Deferred().resolve();
    },
    set_cookies: function(directive) {
        if (typeof directive.body !== 'undefined') {
            for (let i = 0, l = directive.body.length; i < l; i++) {
                let cookie = directive.body[i];
                let expires = undefined;
                if (cookie.expires !== undefined) {
                    expires = Date.create(cookie.expires);
                }
                Cookies.set(cookie.key, cookie.value, {
                    expires: expires,
                    path: '/',
                    domain: config.cookie_domain,
                });
            }
        }

        return $.Deferred().resolve();
    },
};
export default self;
