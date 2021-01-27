/* Automatically transformed from AMD to ES6. Beware of code smell. */
import config from 'config';
import API from 'bison/net/API';
import ErrorHandler from 'bison/net/response/ErrorHandler';
import SuccessHandler from 'bison/net/response/SuccessHandler';

let api = new API({});

let net = {
    api: {
        base: api,
        endpoint: api.endpoint,
        auth: api.endpoint({url: `${config.api_base_url}auth/`}),
        commander: api.endpoint({url: `${config.api_base_url}commander/`}),
        dataprovider: api.endpoint({url: `${config.api_base_url}dataprovider/`}),
        useractionhandler: api.endpoint({url: `${config.api_base_url}useractionhandler/`}),
        download: api.endpoint({url: `${config.api_base_url}download/`}),
        reporting: api.endpoint({url: `${config.api_base_url}reporting/`}),
        text_data: api.endpoint({url: `${config.api_base_url}text_data/`}),
        attribute: api.endpoint({url: `${config.api_base_url}attribute/`}),

        XHRError: function(callback) {
            return function(jqXHR, textStatus, errorThrown) {
                let handled = ErrorHandler.handle(jqXHR, textStatus, errorThrown);
                callback(handled);
                return jqXHR;
            };
        },
        XHRSuccess: function(callback) {
            return function(data, textStatus, jqXHR) {
                let handled = SuccessHandler.handle(data, textStatus, jqXHR);
                callback(handled);
                return jqXHR;
            };
        },
        DeferredSuccess: function(callback) {
            return function(data, textStatus, jqXHR) {
                let handled = SuccessHandler.handle(data, textStatus, jqXHR);
                return callback(handled);
            };
        },
    },
};

export default net;
