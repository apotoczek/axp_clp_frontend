/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    self._registry = {};

    self.new = function(name, id = self.get_parent_id()) {
        return self.add({
            name: name,
            event: Observer.gen_event_type(),
            id: id,
        });
    };

    self.add = function({name, event, id = self.get_parent_id()}) {
        if (name in self._registry) {
            throw `Event named ${name} already in registry`;
        }

        if (id) {
            self._registry[name] = Utils.gen_event(event, id);
        } else {
            self._registry[name] = event;
        }

        return self.get(name);
    };

    self.get = function(name) {
        return self._registry[name];
    };

    self._resolvers = {};
    self._aliases = {};

    self.new_alias = function() {
        return bison.helpers.uuid();
    };

    self.register_alias = function(alias) {
        if (alias in self._aliases) {
            throw `Alias ${alias} is already defined...`;
        }

        self._aliases[alias] = true;

        if (!(alias in self._resolvers)) {
            self._resolvers[alias] = $.Deferred();
        }

        return function(id) {
            self._resolvers[alias].resolve(id);
        };
    };

    self._resolver = function(fn) {
        fn.__resolver = true;

        return fn;
    };

    self.resolve_event = function(alias, event) {
        if (!(alias in self._resolvers)) {
            self._resolvers[alias] = $.Deferred();
        }

        return self._resolver(callback => {
            self._resolvers[alias].done(id => {
                callback(Utils.gen_event(event, id));
            });
        });
    };

    self.resolve_and_add = function(alias, event, event_alias = alias) {
        return self.add({
            name: event_alias,
            event: self.resolve_event(alias, event),
            id: null,
        });
    };

    self.resolve_id = function(alias) {
        if (!(alias in self._resolvers)) {
            self._resolvers[alias] = $.Deferred();
        }

        return function(callback) {
            self._resolvers[alias].done(id => {
                callback(id);
            });
        };
    };

    return self;
}
