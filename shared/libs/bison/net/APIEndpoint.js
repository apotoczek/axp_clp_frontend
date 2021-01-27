/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import config from 'config';
import ErrorHandler from 'bison/net/response/ErrorHandler';
import Cookies from 'js-cookie';

export default function(conf) {
    let self = this;

    self.instances = {};
    self.endpoint = typeof conf.url === 'undefined' ? '' : conf.url;

    self.factory = function(instance_conf) {
        return function(args) {
            let data = args.data || {};
            let method = instance_conf.method || 'POST';

            if (window.navigator.appName === 'Microsoft Internet Explorer') {
                data.cookies = {};
                for (let i = 0, l = config.cookies.length; i < l; i++) {
                    let cookie_key = config.cookies[i];
                    data.cookies[cookie_key] = Cookies.get(cookie_key);
                }
            }

            let settings = {
                url: (instance_conf.endpoint || self.endpoint) + instance_conf.url,
                success: args.success,
                error:
                    args.error ||
                    function(jqXHR, textStatus, errorThrown) {
                        ErrorHandler.handle(jqXHR, textStatus, errorThrown);
                        return jqXHR;
                    },
                type: method,
                dataType: 'json',
                data: JSON.stringify(data),
                contentType: 'src/json; charset=utf-8',
                xhrFields: {
                    withCredentials: true,
                },
            };

            let token = Cookies.get(config.csrf.cookie_name);

            if (token) {
                settings.beforeSend = function(xhr) {
                    xhr.setRequestHeader(config.csrf.header_name, token);
                };
            }

            return $.ajax(settings);
        };
    };

    // Return, or create and return an instance of a request function initialized
    // with the instance_conf settings
    self.instance = function(instance_conf) {
        let key = JSON.stringify(instance_conf);

        if (!self.instances[key]) {
            self.instances[key] = self.factory(instance_conf);
        }

        return self.instances[key];
    };
}
