import $ from 'jquery';
import Cookies from 'js-cookie';
import IdleCallback from 'src/libs/IdleCallback';
import Observer from 'src/libs/Observer';
import auth from 'auth';
import bison from 'bison';
import config from 'config';
import endpoint_spec from 'src/libs/endpoints/index';
import * as Utils from 'src/libs/Utils';

class Cache {
    constructor() {
        this._storage = new Map();
    }
    set = (key, value) => this._storage.set(key, value);
    get = key => this._storage.get(key);
    remove = key => this._storage.delete(key);
    flush = () => this._storage.clear();
}

class DataThing {
    constructor(endpoint_spec) {
        this.errors = [];
        this.endpoint_spec = endpoint_spec;

        window.onerror = (msg, url, line, col, error) => {
            this.errors.push({
                message: msg,
                url: url,
                line: line,
                col: col ? col : 'not_supported',
                trace: error ? error.stack : 'not supported',
            });
        };

        this.api = bison.net.api;
        this.backends = {
            auth: this.api.auth.instance,
            commander: this.api.commander.instance,
            useractionhandler: this.api.useractionhandler.instance,
            dataprovider: this.api.dataprovider.instance,
            download: this.api.download.instance,
            reporting: this.api.reporting.instance,
            text_data: this.api.text_data.instance,
            attribute: this.api.attribute.instance,
        };

        this._status_check = this.backends.dataprovider({
            url: 'status_check',
        });

        this._cache = new Cache();

        this._canceled = {};
        this._endpoint_cache = {};
        this._endpoint_name_cache = {};

        // Object for storing deferreds that indicate the status of a particular
        // request, used to make sure we don't request the same thing more
        // than once at the same time
        this.request_status = {};

        this._expiry_callbacks = [];
        this._additional_keys_callbacks = [];
    }

    request_ready(key) {
        if (this.request_status[key]) {
            return this.request_status[key];
        }
        this.request_status[key] = $.Deferred();

        return $.Deferred().resolve();
    }

    request_reject(key, data) {
        if (this.request_status[key]) {
            this.request_status[key].reject(data);
        }
    }

    request_resolve(key) {
        if (this.request_status[key]) {
            this.request_status[key].resolve();
        }
    }

    request_clear(key) {
        delete this.request_status[key];
    }

    /**
     * Build endpoint object including run-function and spec from endpoint name
     * @param {string} endpoint_name - Endpoint path name
     */
    build_endpoint(endpoint_name) {
        if (this._endpoint_cache[endpoint_name] === undefined) {
            const {spec} = this.endpoint_spec.find(({path}) => path == endpoint_name) || {};

            this._endpoint_cache[endpoint_name] = {
                run: this.backends[spec.backend]({
                    url: endpoint_name,
                }),
                spec: spec,
                name: endpoint_name,
            };
        }

        return this._endpoint_cache[endpoint_name];
    }

    /**
     * Get endpoint name from query and cache the result
     * @param {object} query - Object containing info in query call behavior
     * @param {string} request_key - hash representing a unique query
     */
    get_endpoint_name(query, request_key) {
        if (this._endpoint_name_cache[request_key] === undefined) {
            for (let {path, spec} of this.endpoint_spec) {
                let match = true;

                if (spec.query.params) {
                    match =
                        match &&
                        Object.keys(spec.query.params).reduce((res, key) => {
                            return res && spec.query.params[key].indexOf(query.params[key]) > -1;
                        }, true);
                }

                if (spec.query.key) {
                    match = match && spec.query.key.indexOf(query.key) > -1;
                }

                if (match) {
                    this._endpoint_name_cache[request_key] = path;
                    return this._endpoint_name_cache[request_key];
                }
            }

            this._endpoint_name_cache[request_key] = false;
        }

        return this._endpoint_name_cache[request_key];
    }

    has_backend_export_support({params, key}) {
        let query = {key, params};

        let endpoint_name = this.get_endpoint_name(query, Utils.hashed(query.params));

        const {spec} = this.endpoint_spec.find(({path}) => path == endpoint_name) || {};
        if (endpoint_name && spec) {
            return spec.backend_export;
        }

        return false;
    }

    /**
     * Public method for making external calls through DataThing
     * @param {object} args - query arguments {params, success, ...}
     * @param {function} success_callback - falls back to args.success then noop
     * @param {function} error_callback - falls back to args.success then noop
     * @param {boolean} force - When true, force a call to bypass the cache
     */
    get(args, success_callback, error_callback, force) {
        let params = Utils.deep_copy_object(args.params || {});
        let query = {key: args.key, params: params};

        const noop = () => {};
        success_callback = success_callback || args.success || noop;
        error_callback = error_callback || args.error || noop;
        force = force || args.force || false;

        return this._run_query(query, success_callback, error_callback, force);
    }

    /**
     * Extract data by key from the query object.
     * @param {object} query - contains info in query call behavior
     * */
    extract_data(query, result) {
        return Utils.extract_data(query.key, result);
    }

    success_handler(
        endpoint,
        request_id,
        request_key,
        query,
        callback,
        error_callback,
        polling_interval = 500,
    ) {
        return data => {
            if (!this._canceled[request_id]) {
                if (data.status && data.status === 'pending') {
                    if (data.polling_interval) {
                        polling_interval = data.polling_interval * 1000;
                    } else if (polling_interval < 10000) {
                        polling_interval += 500;
                    }

                    setTimeout(() => {
                        return endpoint.run({
                            data: query.params,
                            success: this.api.XHRSuccess(
                                this.success_handler(
                                    endpoint,
                                    request_id,
                                    request_key,
                                    query,
                                    callback,
                                    error_callback,
                                    polling_interval,
                                ),
                            ),
                            error: this.api.XHRError(
                                this.error_handler(request_id, request_key, error_callback),
                            ),
                        });
                    }, polling_interval);
                } else if (data.result) {
                    // We got the result, lets cache it in the browser
                    this.cache_set(request_key, data.result);

                    // Track the returned cache key
                    this.add_query_key(request_key, data);

                    // Resolve request
                    this.request_resolve(request_key);

                    // Callback to the component
                    callback(this.extract_data(query, data.result), request_key);
                } else if (data.error) {
                    let error_handler = this.error_handler(request_id, request_key, error_callback);
                    error_handler(data);
                } else {
                    // Resolve request
                    this.request_resolve(request_key);

                    // Track the returned cache key
                    this.add_query_key(request_key, data);

                    // Callback to the component
                    callback(null, request_key);
                }
            } else {
                this.request_resolve(request_key);
            }
        };
    }

    error_handler = (request_id, request_key, error_callback) => {
        return data => {
            if (!this._canceled[request_id]) {
                this.cache_delete(request_key);
                this.request_reject(request_key, data);

                if (data) {
                    // Track the returned cache key
                    this.add_query_key(request_key, data);
                } else {
                    this.request_clear(request_key);
                }

                error_callback(data.error, request_key);
            }
        };
    };

    _run_query(query, callback, error_callback, force) {
        let request_key = Utils.hashed(query.params); // Unique key for query
        let request_id = bison.helpers.uuid(); // Unique uuid for the query

        this.request_ready(request_key)
            .done(() => {
                if (!this._canceled[request_id]) {
                    let cached = this.cache_get(request_key);

                    if (cached && !force) {
                        callback(this.extract_data(query, cached), request_key);
                        this.request_resolve(request_key);
                        return $.Deferred().resolve();
                    }

                    let endpoint_name = this.get_endpoint_name(query, request_key);
                    if (endpoint_name) {
                        let endpoint = this.build_endpoint(endpoint_name);

                        return endpoint.run({
                            data: query.params,
                            success: this.api.XHRSuccess(
                                this.success_handler(
                                    endpoint,
                                    request_id,
                                    request_key,
                                    query,
                                    callback,
                                    error_callback,
                                ),
                            ),
                            error: this.api.XHRError(
                                this.error_handler(request_id, request_key, error_callback),
                            ),
                        });
                    }
                    throw `Unable to find endpoint for query: ${JSON.stringify(query)}`;
                } else {
                    this.request_resolve(request_key);
                }
            })
            .fail(data => {
                error_callback(data.error, request_key);
            });

        return {
            cancel: () => {
                this._canceled[request_id] = true;
            },
        };
    }

    cache_get(key) {
        let keys = this.query_keys();

        // If it's not in keys, it's not getting tracked and might be out of date
        if (keys[key]) {
            return this._cache.get(key);
        }

        return null;
    }

    cache_flush() {
        this._cache.flush();
    }

    cache_delete(key) {
        this._cache.remove(key);
    }

    cache_set(key, data) {
        this._cache.set(key, data);
    }

    query_keys() {
        return this._cache.get('query_keys') || {};
    }

    remove_query_key(key) {
        let keys = this.query_keys();

        delete keys[key];

        this._cache.set('query_keys', keys);
    }

    add_query_key(key, data) {
        let keys = this.query_keys();

        keys[key] = {
            query_key: data.query_key,
            timestamp: data.timestamp,
            data_hash: data.data_hash,
        };

        this._cache.set('query_keys', keys);
    }

    expire_query_keys(keys) {
        for (const key of keys) {
            this.request_clear(key);
            this.cache_delete(key);
            this.remove_query_key(key);
            Observer.broadcast(key);
        }
        for (const callback of this._expiry_callbacks) {
            callback(keys);
        }
    }

    setup_status_check() {
        this.idle_callback = new IdleCallback({
            id: 'status_check',
            callback: () => {
                if (auth.is_authenticated()) {
                    const keys = Object.assign(
                        {...this.query_keys()}, // clone keys to avoid mutating the ref
                        ...this._additional_keys_callbacks.map(a => a()),
                    );

                    this._status_check({
                        data: {
                            keys: keys,
                        },
                        success: this.api.XHRSuccess(expired => {
                            this.expire_query_keys(expired);
                        }),
                    });
                }
            },
            idle_timeout: config.status_check_idle_timeout,
            interval: config.status_check_interval,
        });
    }

    /**
     * Add a function to call after a status check has been completed
     * @param {function} callback - a method taking one argument (an array of
     * the expired keys)
     * */
    add_expiry_callback(callback) {
        if (typeof callback !== 'function') {
            throw `Error: Trying to register non-function expiry callback ${callback}`;
        }
        this._expiry_callbacks.push(callback);
    }

    /**
     * Add a callback for additional keys to request status of before sending
     * the status_check request
     * @param {function} callback - a function returning addidional keys to
     * status check
     * */
    add_additional_keys_callback(callback) {
        if (typeof callback !== 'function') {
            throw `Error: Trying to register non-function key callback ${callback}`;
        }
        this._additional_keys_callbacks.push(callback);
    }

    status_check() {
        if (this.idle_callback) {
            this.idle_callback.callback();
        }
    }

    form_post = (action, body = '') => {
        $(oneLine`
            <form action="${action}" target="_blank" method="post">
                ${body}
                <input
                    type="hidden"
                    name="${config.csrf.header_name}"
                    value="${Cookies.get(config.csrf.cookie_name)}"
                />
            </form>
        `)
            .appendTo('body')
            .submit()
            .remove();
    };
}

export default new DataThing(endpoint_spec);
