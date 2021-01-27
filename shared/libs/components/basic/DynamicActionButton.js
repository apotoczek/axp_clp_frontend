/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import ActionButton from 'src/libs/components/basic/ActionButton';

export default function(opts, components) {
    let self = new ActionButton(opts, components);

    self._action_callback = opts.action_callback;
    self._label_callback = opts.label_callback;

    self._action = opts.action;

    self.action = ko.pureComputed(() => {
        let data = self.data();
        if (data && self._action_callback) {
            return self._action_callback(data);
        }

        return ko.unwrap(self._action);
    });

    self.label = ko.pureComputed(() => {
        if (self._label_callback) {
            let data = self.data();
            if (data) {
                return self._label_callback(data);
            }
        }

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
                Observer.register_for_id(
                    self.get_id(),
                    `ActionButton.action.${ko.unwrap(self.action)}`,
                    () => modal.show(),
                );
            },
        );
    };

    let subscription = self.data.subscribe(data => {
        if (data && opts.trigger_modal) {
            self._init_modal(opts.trigger_modal);
            subscription.dispose();
        }
    });

    self.broadcast_event = () => {
        let data = self.data();

        if (data) {
            let action = ko.unwrap(self.action);

            if (self.custom_payload) {
                self.custom_payload.data = data;
            }

            let payload = self.custom_payload || data;

            Observer.broadcast_for_id(self.get_id(), `ActionButton.action.${action}`, payload);

            if (typeof self._parent_broadcast_data === 'function') {
                self._parent_broadcast_data(self);
            }

            if (opts.trigger_url) {
                let url = Utils.contextual_url(data, opts.trigger_url);

                window.location.href = url;
            }

            return self.bubble === undefined ? true : self.bubble;
        }

        return true;
    };

    return self;
}
