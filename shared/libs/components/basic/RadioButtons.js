/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_radio_buttons';

    self.buttons = opts.buttons;
    self._button_dfds = [];

    self.button_css = opts.button_css || {};
    self.set_state_event = opts.set_state_event;
    self.reset_event = opts.reset_event;

    self.default_state = opts.default_state;

    self.visible = opts.visible == undefined ? true : opts.visible;

    self.inital_value_property = opts.inital_value_property;

    self.css_style = opts.css_style;

    self.css = function(button) {
        let css = Utils.ensure_css_object(self.button_css);

        css.active = self.is_active(button);

        return css;
    };

    self.state = ko.observable(self.default_state);

    self.toggle = function(button) {
        self.state(button.state);
    };

    self.is_disabled = function(button) {
        let data = self.data();

        if (button.disabled_callback && typeof button.disabled_callback === 'function') {
            return button.disabled_callback(data);
        }

        return false;
    };

    self.is_active = function(button) {
        return button.state === self.state();
    };

    self.broadcast = ko.observable(true);

    self.state.subscribe(state => {
        if (self.broadcast()) {
            Observer.broadcast_for_id(self.get_id(), 'RadioButtons.state', state);
        }

        let state_data = self.buttons.find(n => {
            return n.state == state;
        });

        Observer.broadcast_for_id(self.get_id(), 'RadioButtons.state_data', state_data);

        self.broadcast(true);
    });

    self.go_to_root = function() {
        self.state.valueHasMutated();
        return true;
    };

    self.set_state = function(state) {
        self.state(state);
    };

    Observer.register_for_id(self.get_id(), 'RadioButtons.set_state', self.set_state);
    if (self.set_state_event) {
        Observer.register(self.set_state_event, state => {
            self.set_state(state);
        });
    }

    if (self.reset_event) {
        Observer.register_for_id(self.get_id(), self.reset_event, () => {
            self.state(self.default_state);
        });
    }

    _dfd.resolve();

    return self;
}
