/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_dynamic_button';

    self.css = opts.css || {'btn-transparent': true};
    self.icon_css = opts.icon_css;

    self.label = opts.label;

    self.click = function(event) {
        Observer.broadcast_for_id(self.get_id(), 'DynamicButton.click', event);
    };

    return self;
}
