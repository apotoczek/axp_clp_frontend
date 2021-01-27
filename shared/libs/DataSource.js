/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Mapping from 'src/libs/Mapping';
import Context from 'src/libs/Context';

export default class DataSource extends Context {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        // Data storage
        if (opts.data === undefined) {
            this.data = ko.observable();
        } else if (ko.isObservable(opts.data) || ko.isComputed(opts.data)) {
            this.data = opts.data;
        } else {
            this.data = ko.observable(opts.data);
        }

        this._disable_data_updates = opts.disable_data_updates;

        this._broadcast_data = opts.broadcast_data || false;

        this._disable_cache = opts.disable_cache || false;

        this._query_key_suffix = opts.query_key_suffix;
        this._auto_get_data = opts.auto_get_data === undefined ? true : opts.auto_get_data;

        this._errors = ko.observableArray([]);
        this._loadings = ko.observableArray([]);

        this.get_data_timeout = opts.get_data_timeout || 200;

        this._error = ko.observable();
        this._errors.push(this._error);

        this._loading = opts.loading || ko.observable();
        this._loadings.push(this._loading);

        this._loading(opts.start_loading || false);

        this.error = ko.pureComputed({
            write: val => {
                this._error(val);
            },
            read: () => {
                let errors = this._errors();
                for (let error of errors) {
                    let unwrapped = ko.unwrap(error);
                    if (unwrapped) {
                        return unwrapped;
                    }
                }
                return undefined;
            },
        });

        this.loading = ko.pureComputed({
            write: val => {
                this._loading(val);
            },
            read: () => {
                let loadings = this._loadings();
                for (let loading of loadings) {
                    if (ko.unwrap(loading)) {
                        return true;
                    }
                }
                return false;
            },
        });

        this.error_template = ko.pureComputed(() => {
            let error = this.error();
            if (error) {
                if (error.error_code) {
                    // if error is an object with 'error_code', render a template using an object
                    return {
                        name: `tpl_perf_calc_error_data_${error.error_code}`,
                        data: error.error_data,
                    };
                }
                return `tpl_perf_calc_error_${error}`;
            }
        });

        this.error.subscribe(error => {
            Observer.broadcast_for_id(this.get_id(), 'BaseComponent.error', error, true);
        });

        this.loading.subscribe(loading => {
            Observer.broadcast_for_id(this.get_id(), 'BaseComponent.loading', loading, true);
        });

        if (opts.dependencies) {
            if (Object.isArray(opts.dependencies)) {
                for (let dependency of opts.dependencies) {
                    this._register_dependency(dependency);
                }
            } else if (Object.isString(opts.dependencies)) {
                this._register_dependency(opts.dependencies);
            }
        }
        if (this._broadcast_data) {
            this.data.subscribe(data => {
                Observer.broadcast_for_id(this.get_id(), 'DataSource.data', data, true);
            });
        }

        this.template = opts.template;

        this._query = {};

        this._required = [];
        this._one_required = {};

        this._current_query_key = undefined;

        this._query_update_callbacks = [];
        this._invalid_query_callbacks = [];

        this._get_data_timeout = undefined;

        this._init_datasource(opts.datasource);

        _dfd.resolve();
    }

    set_auto_get_data(value) {
        this._auto_get_data = value;
        if (value) {
            this.refresh_data();
        }
    }

    set_error(return_value, error) {
        this.error(error);

        return return_value;
    }

    add_dependency(obj) {
        if (typeof obj.loading === 'function') {
            this._loadings.push(obj.loading);
        }
        if (typeof obj.error === 'function') {
            this._errors.push(obj.error);
        }
        if (typeof obj.dfds !== undefined) {
            this.dfds.push(...obj.dfds);
        }
    }

    _register_dependency(dependency_id) {
        let _error = ko.observable(undefined);
        let _loading = ko.observable(false);

        Observer.register_for_id(dependency_id, 'BaseComponent.error', error => {
            _error(error);
        });

        Observer.register_for_id(dependency_id, 'BaseComponent.loading', loading => {
            _loading(loading);
        });

        this._errors.push(_error);
        this._loadings.push(_loading);
    }

    _register_query_key(query_key) {
        if (!this._disable_data_updates) {
            if (this._current_query_key) {
                Observer.unregister(this._current_query_key);
            }

            this._current_query_key = [query_key, '.', this.get_id(), this._query_key_suffix]
                .compact()
                .join('');

            Observer.register(this._current_query_key, () => {
                if (this._auto_get_data) {
                    clearTimeout(this._get_data_timeout);
                    this._get_data_timeout = setTimeout(() => {
                        this._get_data(undefined, this._disable_cache);
                    }, this.get_data_timeout);
                }
            });
        }
    }

    stop() {
        this.set_auto_get_data(false);
    }

    resume() {
        this.set_auto_get_data(true);
    }

    clear_data() {
        if (this._current_query_key) {
            Observer.unregister(this._current_query_key);
        }

        this.data(undefined);
    }

    update_query(query, parent_keys) {
        parent_keys = parent_keys || [];

        for (let [key, value] of Object.entries(query)) {
            if (Object.isObject(value)) {
                this.update_query(value, [...parent_keys, key]);
            } else {
                let changed = this._set_query_param(key, value, parent_keys);
                if (changed && this._auto_get_data) {
                    clearTimeout(this._get_data_timeout);
                    this._get_data_timeout = setTimeout(() => {
                        this._get_data(undefined, this._disable_cache);
                    }, this.get_data_timeout);
                }
            }
        }
    }

    get_query_params() {
        return {...this._query.params};
    }

    has_backend_export_support() {
        return DataThing.has_backend_export_support(this._query);
    }

    // Get the data based on self._query from DataThing.
    // Only used when datasource has type = 'dynamic'
    _get_data(callback, force) {
        if (this._query.params) {
            this.loading(true);

            if (this._current_request) {
                this._current_request.cancel();
            }

            if (this._query_is_valid()) {
                this._current_request = DataThing.get(
                    this._query,
                    (data, query_key) => {
                        this._register_query_key(query_key);

                        if (this._mapping) {
                            data = this._mapping(data);
                        }
                        this.data(data);
                        this.error(undefined);

                        this.loading(false);

                        if (typeof callback === 'function') {
                            callback(data, undefined);
                        }
                    },
                    (error, query_key) => {
                        this._register_query_key(query_key);
                        this.error(error);
                        this.data(undefined);

                        this.loading(false);

                        if (typeof callback === 'function') {
                            callback(undefined, error);
                        }
                    },
                    force,
                );
            } else {
                this.data(undefined);
                this.error(undefined);

                for (let callback of this._invalid_query_callbacks) {
                    callback();
                }

                this.loading(false);
            }
        }
    }

    refresh_data(force) {
        this._get_data(undefined, force);
    }

    register_query_update_callback(callback) {
        if (typeof callback === 'function') {
            this._query_update_callbacks.push(callback);
        }
    }

    register_invalid_query_callback(callback) {
        if (typeof callback === 'function') {
            this._invalid_query_callbacks.push(callback);
        }
    }

    // Check if a param is set in _query.params. The key is a string of
    // several keys separated by ':', to check for keys deeper down in
    // the query than the first level.
    // E.g: 'filters:as_of_date' would return true for
    // _query.params = { filters: { as_of_date: 1251220 } }
    _param_is_set(key) {
        let keys = key.split(':');

        let params = this._query.params;

        for (let key of keys) {
            if (params !== undefined) {
                params = params[key];
            } else {
                return false;
            }
        }

        return params !== undefined;
    }

    // Check if the query is valid based on:
    // self._required: holds single required keys from config
    // self._one_required: holds arrays of keys where one must be present
    // for the key to be valid
    _query_is_valid() {
        let valid = this._required.reduce((res, key) => {
            return res && this._param_is_set(key);
        }, true);

        for (let [parent_key, one_required] of Object.entries(this._one_required)) {
            valid =
                valid &&
                one_required.reduce((res, required_key) => {
                    let key = parent_key ? `${parent_key}:${required_key}` : required_key;
                    return res || this._param_is_set(key);
                }, false);
        }

        return valid;
    }

    // Add a required key on the appropriate level
    _add_required_key(key, parent_keys) {
        this._required.push([...parent_keys, key].join(':'));
    }

    // Add one_required keys on the appropriate level
    _add_one_required(keys, parent_keys) {
        this._one_required[parent_keys.join(':')] = keys;
    }

    // Set a parameter in the query and return whether it actually
    // changed anything in the query
    _set_query_param(key, new_value, parent_keys) {
        let params = this._query.params; // Base query

        if (params) {
            // If we have parent keys, we loop over them to get where we want
            // in the query and create parts of the query that are missing
            if (parent_keys) {
                for (let parent_key of parent_keys) {
                    if (params[parent_key] === undefined) {
                        params[parent_key] = {};
                    }

                    params = params[parent_key];
                }
            }

            let old_value = params[key]; // Save old value

            params[key] = Object.clone(new_value); // Update value

            let changed = !Object.isEqual(new_value, old_value); // Return if value changed

            if (changed) {
                for (let callback of this._query_update_callbacks) {
                    callback(key, new_value, old_value);
                }
            }

            return changed;
        }
    }

    gen_event_filter(config) {
        let payload_keys = config.payload_key.split('.');
        let component_keys = config.component_key.split('.');

        let comp_fn = Utils.gen_comp_fn(config.comparator);

        return (it, event_type, payload) => {
            return comp_fn(
                Utils.recursive_get(payload, payload_keys),
                Utils.recursive_get(it, component_keys),
            );
        };
    }

    // Initialize the query. Calls itself recursively if there are
    // 'dynamic' entries deeper down in the query.
    _init_query(config, parent_keys) {
        parent_keys = parent_keys || [];

        if (config.one_required) {
            this._add_one_required(config.one_required, parent_keys);
        }

        if (!config.query) {
            throw `Trying to initialize datasource without query (${this.get_id()})`;
        }

        for (let [key, subconfig] of Object.entries(config.query)) {
            if (!Object.isObject(subconfig) || subconfig.type === undefined) {
                // Straight up value
                this._set_query_param(key, subconfig, parent_keys);
            } else if (subconfig.type === 'static') {
                // Type indicates it's a straight up value
                this._set_query_param(key, subconfig.data, parent_keys);
            } else if (subconfig.type === 'placeholder') {
                this._set_query_param(key, subconfig.default, parent_keys);

                if (subconfig.required) {
                    this._add_required_key(key, parent_keys);
                }
            } else if (subconfig.type === 'observer') {
                // Observer, register for event
                this._set_query_param(key, subconfig.default, parent_keys);

                if (subconfig.required) {
                    this._add_required_key(key, parent_keys);
                }

                let mapping;

                if (subconfig.mapping || subconfig.mapping_default) {
                    mapping = Mapping.gen_mapping(subconfig);
                }

                if (subconfig.event_type) {
                    let callback = payload => {
                        if (subconfig.event_filter) {
                            let filter = this.gen_event_filter(subconfig.event_filter);
                            if (!filter(this, subconfig.event_type, payload)) {
                                return;
                            }
                        }

                        let changed = false;

                        if (mapping) {
                            payload = mapping(payload);
                        }

                        if (Utils.is_set(payload, true) || subconfig.default === undefined) {
                            changed = this._set_query_param(key, payload, parent_keys);
                        } else {
                            changed = this._set_query_param(key, subconfig.default, parent_keys);
                        }

                        if (changed && this._auto_get_data) {
                            clearTimeout(this._get_data_timeout);
                            this._get_data_timeout = setTimeout(() => {
                                this._get_data(undefined, this._disable_cache);
                            }, this.get_data_timeout);
                        }
                    };

                    if (Object.isArray(subconfig.event_type)) {
                        Observer.register_many(subconfig.event_type, callback);
                    } else {
                        Observer.register(subconfig.event_type, callback);
                    }
                }
            } else if (subconfig.type === 'dynamic') {
                // Subquery, init recursively
                this._init_query(subconfig, [...parent_keys, key]);
            } else {
                // Invalid
                throw 'Invalid query';
            }
        }
    }

    // Initialize datasource, initalized query if datasource type
    // is 'dynamic'
    _init_datasource(config) {
        if (!Object.isObject(config)) {
            // Straight up value
            if (config !== undefined) {
                this.data(config);
            }
        } else if (config.type === 'static') {
            // Type indicates it's a straight up value
            let mapping;

            if (config.mapping || config.mapping_default) {
                mapping = Mapping.gen_mapping(config);
            }

            if (mapping) {
                this.data(mapping(config.data));
            } else {
                this.data(config.data);
            }
        } else if (config.type === 'observer') {
            // Observer, register for event
            if (config.event_type) {
                this.data(config.default); // Set to default

                let mapping;

                if (config.mapping || config.mapping_default) {
                    mapping = Mapping.gen_mapping(config);
                }

                let callback = payload => {
                    if (config.event_filter) {
                        let filter = this.gen_event_filter(config.event_filter);
                        if (!filter(this, config.event_type, payload)) {
                            return;
                        }
                    }

                    if (mapping) {
                        payload = mapping(payload);
                    }

                    if (Utils.is_set(payload, true) || config.default === undefined) {
                        this.data(payload);
                    } else {
                        this.data(config.default); // Set back to default if payload is null or undefined
                    }
                };

                if (Object.isArray(config.event_type)) {
                    Observer.register_many(config.event_type, callback);
                } else {
                    Observer.register(config.event_type, callback);
                }
            } else if (config.event_types) {
                this._data_lock = $.Deferred().resolve();

                for (let [key, sub_config] of Object.entries(config.event_types)) {
                    let data = this.data() || {};

                    data[key] = sub_config.default; // Set to default

                    this.data(data);

                    let mapping;

                    if (sub_config.mapping || sub_config.mapping_default) {
                        mapping = Mapping.gen_mapping(sub_config);
                    }

                    Observer.register(sub_config.event_type, payload => {
                        this._data_lock.done(() => {
                            this._data_lock = $.Deferred();

                            let data = this.data() || {};

                            if (mapping) {
                                payload = mapping(payload);
                            }

                            if (Utils.is_set(payload, true) || sub_config.default === undefined) {
                                data[key] = payload;
                            } else {
                                data[key] = sub_config.default; // Set back to default if payload is null or undefined
                            }

                            this.data(data);

                            this._data_lock.resolve();
                        });
                    });
                }
            }
        } else if (config.type === 'dynamic') {
            // Dynamic, set up query
            // Reset _query and helper objects
            this._query.key = config.key;
            this._query.params = {};
            this._required = [];
            this._one_required = {};
            this.get_data_timeout = config.get_data_timeout || this.get_data_timeout;

            if (config.mapping || config.mapping_default) {
                this._mapping = Mapping.gen_mapping(config);
            }

            this._init_query(config); // Initialize query

            if (this._auto_get_data) {
                this._get_data(); // Get initial data if query is already valid
            }
        } else {
            // Invalid
            throw 'Invalid datasource';
        }
    }
}
