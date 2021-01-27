/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import * as Utils from 'src/libs/Utils';
import * as Mapping from 'src/libs/Mapping';

let self = {};

self.register = function(event_type, callback) {
    if (event_type === undefined) {
        throw `Register for undefined event with callback: ${callback}`;
    }

    if (typeof event_type === 'function' && event_type.__resolver) {
        // We have to resolve the event
        event_type(resolved_event_type => {
            self.register(resolved_event_type, callback);
        });
    } else {
        $('body').on(event_type, evt => {
            callback(evt.payload, evt);
        });

        self.broadcast(self.new_listener_event(event_type));
    }
};

self.register_many = function(event_types, callback) {
    for (let i = 0, l = event_types.length; i < l; i++) {
        self.register(event_types[i], callback);
    }
};

self.unregister = function(event_type) {
    if (typeof event_type === 'function' && event_type.__resolver) {
        // We have to resolve the event
        event_type(resolved_event_type => {
            self.unregister(resolved_event_type);
        });
    } else {
        $('body').off(event_type);
    }
};

self.new_listener_event = function(event_type) {
    return `new_listener.${event_type}`;
};

self._new_listener_events = {};

// Broadcast a single payload
self.broadcast = function(event_type, payload, listen_to_new) {
    if (event_type === undefined) {
        throw `Broadcasting undefined event with payload: ${JSON.stringify(payload)}`;
    }

    if (typeof event_type === 'function' && event_type.__resolver) {
        // We have to resolve the event
        event_type(resolved_event_type => {
            self.broadcast(resolved_event_type, payload, listen_to_new);
        });
    } else {
        $('body').trigger({
            type: event_type,
            payload: payload,
        });

        if (listen_to_new) {
            let new_listener_event = self.new_listener_event(event_type);

            /************************************************************
             * This optimization broke events where the same events is
             * broadcasted many times with different body and the
             * listener is supposed to receive them all. We would like to
             * do it at some point though I think!
             ************************************************************/

            // if(new_listener_event in self._new_listener_events) {
            //     self.unregister(new_listener_event);
            // }

            // self._new_listener_events[new_listener_event] = true;

            self.register(new_listener_event, () => {
                self.broadcast(event_type, payload);
            });
        }
    }
};

self.gen_event_type = function() {
    let uid = bison.helpers.uuid();

    return `GeneratedEvent.${uid}`;
};

self.observable = function(event_type, default_value, mapping) {
    const mapping_fn = Mapping.gen_mapping(mapping);
    let observable = ko.observable(default_value);

    self.register(event_type, data => {
        observable(mapping_fn(data));
    });

    return observable;
};

self.map = function(event_type, mapping, callback) {
    let mapping_fn = Mapping.gen_mapping(mapping);
    let new_event_type = self.gen_event_type();

    self.register(event_type, data => {
        let mapped = mapping_fn(data);
        self.broadcast(new_event_type, mapped, true);
        if (typeof callback === 'function') {
            callback(mapped);
        }
    });

    return new_event_type;
};

self.proxy = function({
    event_types,
    timeout = 200,
    auto_trigger = true,
    trigger_events = [],
    proxy_event = self.gen_event_type(),
    proxy_mapping_fn = data => data,
}) {
    let data = {};
    let proxy_timeout;
    let lock = $.Deferred().resolve();

    for (let [key, config] of Object.entries(event_types)) {
        if (!Object.isObject(config)) {
            config = {
                event_type: config,
            };
        }

        data[key] = config.default; // Set to default

        let mapping;

        if (config.mapping) {
            mapping = Mapping.gen_mapping(config);
        }

        self.register(config.event_type, payload => {
            lock.done(() => {
                lock = $.Deferred();

                if (mapping) {
                    payload = mapping(payload);
                }

                if (Utils.is_set(payload, true) || config.default === undefined) {
                    data[key] = payload;
                } else {
                    data[key] = config.default;
                }

                if (auto_trigger) {
                    clearTimeout(proxy_timeout);

                    proxy_timeout = setTimeout(() => {
                        self.broadcast(proxy_event, proxy_mapping_fn(data));
                    }, timeout);
                }

                lock.resolve();
            });
        });

        if (trigger_events && trigger_events.length > 0) {
            self.register_many(trigger_events, () => {
                lock.done(() => {
                    lock = $.Deferred();

                    clearTimeout(proxy_timeout);

                    proxy_timeout = setTimeout(() => {
                        self.broadcast(proxy_event, proxy_mapping_fn(data), true);
                    }, timeout);

                    lock.resolve();
                });
            });
        }
    }

    return {
        event: proxy_event,
        trigger: function() {
            clearTimeout(proxy_timeout);

            proxy_timeout = setTimeout(() => {
                self.broadcast(proxy_event, proxy_mapping_fn(data));
            }, timeout);
        },
    };
};

self.register_for_id = function(id, event_type, callback) {
    self.register([event_type, id].join('.'), callback);
};

self.unregister_for_id = function(id, event_type) {
    self.unregister([event_type, id].join('.'));
};

// Broadcast a single payload
self.broadcast_for_id = function(id, event_type, payload, listen_to_new) {
    self.broadcast([event_type, id].join('.'), payload, listen_to_new);
};

// Broadcast all the keys of the object with the respective
// values as payload
self.broadcast_all = function(events) {
    for (let [event_type, payload] of Object.entries(events || {})) {
        self.broadcast(event_type, payload);
    }
};

// Broadcast the keys prefixed with the id (of a component)
// the payload for each event is provided in object
self.broadcast_keys_for_id = function(id, keys, object) {
    object = object || {};

    for (let i = 0, l = keys.length; i < l; i++) {
        self.broadcast(`${id}.${keys[i]}`, object[keys[i]]);
    }
};

self.relay = function({sender, receiver, transform = x => x, data, callback}) {
    self.register(sender, inbound_payload => {
        if (typeof data === 'undefined') {
            let outbound_payload = transform(inbound_payload);
            self.broadcast(receiver, outbound_payload);
            if (typeof callback === 'function') {
                callback(inbound_payload, outbound_payload);
            }
        } else {
            let outbound_payload = data;
            self.broadcast(receiver, outbound_payload);
            if (typeof callback === 'function') {
                callback(inbound_payload, outbound_payload);
            }
        }
    });
};

self.register_hash_listener = function(url, callback, base) {
    base = base || '';

    let hashchange = function(evt) {
        evt = (evt && evt.originalEvent) || {};

        let prev_url = evt.oldURL;

        let hash = window.location.href.split(`#!/${base}`)[1];
        if (hash) {
            let components = hash.split('/').filter(component => {
                return component.length > 0;
            });
            if (Utils.is_regex(url)) {
                if (url.test(components[0])) {
                    callback(components, prev_url);
                }
            } else if (components[0] === url) {
                callback(components, prev_url);
            }
        }
    };

    $(window).bind(`hashchange.${url}`, hashchange);

    hashchange();
};

export default self;
