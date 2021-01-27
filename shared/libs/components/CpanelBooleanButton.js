/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_radio_buttons';

    self.buttons = opts.buttons;

    self.button_css = opts.button_css || {};

    self.css = function(button) {
        let css = Utils.ensure_css_object(self.button_css);

        css.active = self.is_active(button);

        return css;
    };

    self.state = ko.observable(opts.default_state);

    self.toggle = function(button) {
        self.state(button.state);
    };

    self.is_active = function(button) {
        return button.state == self.state();
    };

    self.state.subscribe(state => {
        Observer.broadcast_for_id(self.get_id(), 'RadioButtons.state', state);
    });

    return self;
}
