/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import config from 'config';
import DirectiveHandler from 'bison/net/response/DirectiveHandler';
import Notify from 'bison/utils/Notify';

let self = {
    handle: function(jqxhr) {
        switch (jqxhr.status) {
            case 401:
                self.unauthorized(jqxhr); // Unauthorized
                break;

            case 402:
                self.payment_required(jqxhr); // Payment Required
                break;

            case 403:
                self.forbidden(jqxhr); // Forbidden
                break;

            case 404:
                self.not_found(jqxhr); // Not Found
                break;

            case 407:
                self.proxy_authentication_reqired(jqxhr);
                break;

            case 408:
                self.request_timeout(jqxhr); // Request Timeout
                break;

            case 413:
                self.request_entity_too_large(jqxhr); // Request Too Large
                break;

            case 500:
                self.server_error(jqxhr); // Server Error
                break;
            case 400:
            default:
                self.bad_request(jqxhr); // Bad Request / Error
                break;
        }
        return self.passthru(jqxhr);
    },
    handle_directives: function(jqxhr) {
        if (jqxhr.responseText && jqxhr.responseText.length > 0) {
            try {
                let response = JSON.parse(jqxhr.responseText);
                if (typeof response.xhr_response !== 'undefined') {
                    let error = response.error;
                    let directives = error.directives;
                    if (typeof directives !== 'undefined' && directives instanceof Array) {
                        $.when(
                            $.when(...DirectiveHandler.execute_directives(directives, 'track')),
                            $.when(
                                ...DirectiveHandler.execute_directives(directives, 'set_cookies'),
                            ),
                            $.when(...DirectiveHandler.execute_directives(directives, 'notify')),
                        ).done(() => {
                            DirectiveHandler.execute_directives(directives, 'redirect');
                        });
                        return true;
                    }
                    return false;
                }
                return false;
            } catch (err) {
                return false;
            }
        }
    },
    bad_request: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    unauthorized: function(jqxhr) {
        if (!self.handle_directives(jqxhr)) {
            DirectiveHandler.redirect({body: config.sign_in_url});
        }
    },
    proxy_authentication_reqired: function() {},
    payment_required: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    forbidden: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    not_found: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    request_timeout: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    request_entity_too_large: function(jqxhr) {
        if (!self.handle_directives(jqxhr)) {
            Notify('File too large!', 'The file you tried to upload is too large.', 'alert-danger');
        }
    },
    server_error: function(jqxhr) {
        self.handle_directives(jqxhr);
    },
    passthru: function(jqxhr) {
        try {
            let passthru = JSON.parse(jqxhr.responseText).error_passthru;
            if (typeof passthru !== 'undefined') {
                return passthru;
            }
            return false;
        } catch (err) {
            return false;
        }
    },
};

export default self;
