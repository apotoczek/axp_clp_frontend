/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import LocalStorage from 'src/libs/localstorage';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_string_filter';

    self.cpanel_style = opts.cpanel_style;

    self.clear_event = opts.clear_event;

    self.set_state_event_type = opts.set_state_event_type;
    self.enable_localstorage = opts.enable_localstorage;
    self.placeholder = opts.placeholder;

    self.value = self.data.extend({rateLimit: 100});

    self.broadcast_value = function(value) {
        Observer.broadcast_for_id(self.get_id(), 'StringFilter.value', value);
    };

    Observer.register_for_id(self.get_id(), 'new_listener.StringFilter.value', () => {
        self.broadcast_value(self.value());
    });

    if (self.enable_localstorage) {
        let value_key = Utils.gen_id('StringFilter.value', self.get_id());
        let value = LocalStorage.get(value_key);
        self.value(value);
        self.value.subscribe(() => {
            LocalStorage.set(value_key, self.value());
        });
    }

    self.value.subscribe(self.broadcast_value);

    self.broadcast_value(self.value() || '');

    self.has_value = ko.computed(() => {
        let value = self.value();
        return value && value.length > 0;
    });

    self.clear = function() {
        self.value(undefined);
    };

    if (self.set_state_event_type) {
        Observer.register(Utils.gen_event(self.set_state_event_type, self.get_id()), state => {
            self.value(state);
        });
    }

    /*******************************************************************
     * Event listeners
     *******************************************************************/

    if (self.clear_event) {
        Observer.register(self.clear_event, self.clear);
    }

    return self;
}
