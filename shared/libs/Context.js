/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import * as Utils from 'src/libs/Utils';

export default class Context {
    constructor(opts = {}, components = {}) {
        this.__context = true;

        this.id = opts.id || bison.helpers.uuid();

        this._parent_ids = opts._parent_ids || [];

        this.dfds = [];

        this.id_callback = opts.id_callback;

        if (opts.parent_id) {
            this._parent_ids.push(opts.parent_id);
        }

        let _dfd = this.new_deferred();

        this.layout = {};

        this._components_initialized = ko.observable(false);

        this._init(opts, components).done(() => {
            this._components_initialized(true);

            if (this.id_callback && typeof this.id_callback === 'function') {
                this.id_callback(this.get_id());
            }

            _dfd.resolve();
        });
    }

    get_parent_id() {
        return Utils.arr_gen_id(this._parent_ids);
    }

    get_id() {
        return Utils.arr_gen_id([...this._parent_ids, this.id]);
    }

    html_id() {
        return Utils.html_id(this.get_id());
    }

    new_deferred() {
        let __dfd = $.Deferred();

        this.dfds.push(__dfd);

        return __dfd;
    }

    _when_object(obj) {
        if (obj) {
            let keys = Object.keys(obj);

            let dfds = [];

            for (let i = 0, l = keys.length; i < l; i++) {
                dfds.push($.when(...obj[keys[i]].dfds));
            }

            return $.when(...dfds);
        }

        return $.Deferred().resolve();
    }

    when(...components) {
        let dfds = [];

        for (let component of components) {
            if (component.__context) {
                dfds.push($.when(...component.dfds));
            } else {
                dfds.push(this._when_object(component));
            }
        }

        return $.when(...dfds);
    }

    load_component(config, callback) {
        let _load_component_dfd = $.Deferred();
        let _inner_callback = mod => {
            callback(mod);
            _load_component_dfd.resolve();
        };

        if (config.component) {
            _inner_callback(config.component);
        } else if (config.template) {
            import('src/libs/components/basic/BaseComponent').then(mod => {
                _inner_callback(mod.default);
            });
        }

        return _load_component_dfd;
    }

    init_component(config, callback, components) {
        let _init_component_dfd = $.Deferred();

        this.load_component(config, mod => {
            let instance = this.new_instance(mod, config, components);
            this.when(instance).done(() => {
                callback(instance);
                _init_component_dfd.resolve();
            });
        });

        return _init_component_dfd;
    }

    new_instance(mod, config, components) {
        config = config || {};
        config._parent_ids = [...this._parent_ids, this.id];
        let comps = Object.assign(this.components, components);

        return new mod(config, comps);
    }

    // Initialize components based on config. Might also get already
    // initialized components as the second argument
    // (Can be used for sharing components from another context)
    _init_component(config) {
        if (config === undefined) {
            throw `Trying to initialize component from undefined in ${this.get_id()}`;
        }

        if (config.id) {
            let dfd = $.Deferred();

            if (config instanceof Context) {
                // It's an already initialized component
                this.components[config.id] = config;
                $.when(...config.dfds).done(dfd.resolve);
            } else if (config.component) {
                let instance = this.new_instance(config.component, config);
                this.components[config.id] = instance;
                $.when(...instance.dfds).done(dfd.resolve);
            } else {
                import('src/libs/components/basic/BaseComponent').then(mod => {
                    let instance = this.new_instance(mod.default, config);
                    this.components[config.id] = instance;
                    $.when(...instance.dfds).done(dfd.resolve);
                });
            }

            return dfd;
        }

        return $.Deferred().resolve();
    }

    _init_components(config, components) {
        this.components = components || {};

        if (config) {
            this.components = {
                ...this.components,
                horizontal_separator: {
                    template: 'tpl_horizontal_separator',
                },
            };

            let dfds = [];

            for (let component of config) {
                dfds.push(this._init_component(component, this.components));
            }

            return $.when(...dfds);
        }

        return $.Deferred().resolve();
    }

    _init_layout(key, config, parent_keys) {
        if (config) {
            parent_keys = parent_keys || [];
            let layout = this.layout;
            // If we have parent keys, we loop over them to get where we want
            // in the query and create parts of the query that are missing
            if (parent_keys) {
                for (let i = 0, l = parent_keys.length; i < l; i++) {
                    if (layout[parent_keys[i]] === undefined) {
                        layout[parent_keys[i]] = {};
                    }

                    layout = layout[parent_keys[i]];
                }
            }

            if (Object.isArray(config)) {
                layout[key] = [];
                for (let i = 0, l = config.length; i < l; i++) {
                    if (this.components[config[i]]) {
                        layout[key].push(this.components[config[i]]);
                    } else {
                        throw `Component '${
                            config[i]
                        }' referenced in layout of id = '${this.get_id()}' is undefined`;
                    }
                }
            } else if (Object.isObject(config)) {
                layout[key] = {};
                for (let sub_key of Object.keys(config)) {
                    layout[key][sub_key] = this._init_layout(sub_key, [...parent_keys, key]);
                }
            } else {
                if (this.components[config]) {
                    layout[key] = this.components[config];
                } else {
                    throw `Component '${config}' referenced in layout of id = '${this.get_id()}' is undefined `;
                }
            }
        }
    }

    _init(config, components) {
        if (config) {
            let dfd = $.Deferred();
            this._init_components(config.components, components).done(() => {
                if (config.layout) {
                    for (let [key, entry] of Object.entries(config.layout)) {
                        this._init_layout(key, entry);
                    }
                }

                dfd.resolve();
            });

            return dfd;
        }

        return $.Deferred().resolve();
    }

    on_enter(path, callback) {
        const _on_hash_change = event => {
            const old_hash = event.oldURL.split('#!/')[1];
            const new_hash = event.newURL.split('#!/')[1];
            if (!old_hash.startsWith(path) && new_hash.startsWith(path)) {
                callback(new_hash);
            }
        };
        window.addEventListener('hashchange', _on_hash_change);

        const hash = window.location.href.split('#!/')[1];
        if (hash.startsWith(path)) {
            callback(hash);
        }
    }

    on_leave(path, callback) {
        const _on_hash_change = event => {
            const old_hash = event.oldURL.split('#!/')[1];
            const new_hash = event.newURL.split('#!/')[1];
            if (old_hash.startsWith(path) && !new_hash.startsWith(path)) {
                callback(new_hash);
            }
        };
        window.addEventListener('hashchange', _on_hash_change);
    }
}
