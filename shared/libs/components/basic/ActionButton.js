/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_action_button';

    self._disabled_property = opts.disabled_property;
    self._disabled_callback = opts.disabled_callback;
    self._disabled_label = opts.disabled_label;
    self._hidden_property = opts.hidden_property;
    self._hidden_callback = opts.hidden_callback;

    self._label = opts.label;
    self.dropdown_label = opts.dropdown_label;
    self.action = opts.action;
    self.css = opts.css;
    self.bubble = opts.bubble;
    self.custom_payload = opts.custom_payload;
    self.default_visibility = opts.default_visibility;

    self._parent_broadcast_data = opts.broadcast_event;

    self._disabled_if_no_data = opts.disabled_if_no_data || false;
    self.visible_event = opts.visible_event ? Observer.observable(opts.visible_event) : undefined;

    self.disabled = ko.computed(() => {
        if (self._disabled_property || self._disabled_callback || self._disabled_if_no_data) {
            let data = self.data();

            if (self._disabled_if_no_data && !Utils.is_set(data)) {
                return true;
            }

            if (self._disabled_property) {
                if (self._disabled_property[0] === '!') {
                    return data && !data[self._disabled_property.slice(1)];
                }

                return Utils.is_set(data) && data[self._disabled_property];
            }

            if (self._disabled_callback) {
                return Utils.is_set(data) && self._disabled_callback(data);
            }
        }
        return false;
    });

    self.hidden = ko.computed(() => {
        if (self.visible_event) {
            if (self.visible_event() == undefined) {
                return self.default_visibility == 'hidden';
            }
            return self.visible_event();
        }
        if (self._hidden_property || self._hidden_callback) {
            let data = self.data();

            if (self._hidden_property) {
                if (self._hidden_property[0] === '!') {
                    return data && !data[self._hidden_property.slice(1)];
                }

                return Utils.is_set(data) && data[self._hidden_property];
            }

            if (self._hidden_callback) {
                return self._hidden_callback(data);
            }
        }
        return false;
    });

    self.visible = ko.computed(() => {
        return !self.hidden();
    });

    self.label = ko.computed(() => {
        if (self._disabled_label && self.disabled()) {
            return ko.unwrap(self._disabled_label);
        }

        return ko.unwrap(self._label);
    });

    self._init_modal = function(modal_config) {
        self.init_component(
            {
                data: self.data,
                ...modal_config,
            },
            modal => {
                Observer.register_for_id(self.get_id(), `ActionButton.action.${self.action}`, () =>
                    modal.show(),
                );
            },
        );
    };

    if (opts.trigger_url) {
        Observer.register_for_id(self.get_id(), `ActionButton.action.${self.action}`, () => {
            let data = self.data() || {};
            let url = Utils.contextual_url(data, opts.trigger_url);
            window.location.href = url;
        });
    }

    if (opts.trigger_modal) {
        self._init_modal(opts.trigger_modal);
    }

    self.broadcast_event = function() {
        if (self.custom_payload) {
            self.custom_payload.data = self.data();
        }

        let payload = self.custom_payload || self.data();
        Observer.broadcast_for_id(self.get_id(), `ActionButton.action.${self.action}`, payload);

        if (typeof self._parent_broadcast_data === 'function') {
            self._parent_broadcast_data(self);
        }

        return self.bubble === undefined ? true : self.bubble;
    };

    return self;
}
