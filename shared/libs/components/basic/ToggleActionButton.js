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
    self._state_callback = opts.state_callback;
    self._disabled_label = opts.disabled_label;
    self._labels = opts.labels;
    self.state_css = opts.state_css;
    self.actions = opts.actions;
    self._css = opts.css;
    self.key = opts.key;

    self.bubble = opts.bubble;

    self.state = ko.computed(() => {
        if (self._state_callback && self.data()) {
            return self._state_callback(self.data());
        }

        return !!Utils.extract_data(self.key, self.data());
    });

    self.state_idx = ko.computed(() => {
        return self.state() ? 1 : 0;
    });

    self.disabled = ko.computed(() => {
        if (self._disabled_property || self._disabled_callback) {
            let data = self.data();

            if (self._disabled_property) {
                if (self._disabled_property[0] === '!') {
                    return data && !data[self._disabled_property.slice(1)];
                }

                return data && data[self._disabled_property];
            }

            if (self._disabled_callback) {
                return data && self._disabled_callback(data);
            }
        }
        return false;
    });

    self.css = ko.computed(() => {
        let css = {...Utils.ensure_css_object(self._css)};

        if (self.state_css) {
            for (let i = 0, l = self.state_css.length; i < l; i++) {
                css[self.state_css[i]] = i == self.state_idx();
            }
        }

        return css;
    });

    self.label = ko.computed(() => {
        return self._labels[self.state_idx()];
    });

    self.broadcast_event =
        opts.broadcast_event ||
        function() {
            let action = self.actions[self.state_idx()];

            Observer.broadcast_for_id(
                self.get_id(),
                `ToggleActionButton.action.${action}`,
                self.data(),
            );
            Observer.broadcast_for_id(self.get_id(), 'ToggleActionButton.state', action);

            let _data = self.data();

            _data[self.key] = !_data[self.key];

            self.data(_data);

            return self.bubble === undefined ? true : self.bubble;
        };

    return self;
}
