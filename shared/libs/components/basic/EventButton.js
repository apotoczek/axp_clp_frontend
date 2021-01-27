/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_button';

    self.css = opts.css || {'btn-sm': true, 'btn-default': true};

    self.visible = opts.visible === undefined ? true : opts.visible;
    self.loading = opts.loading || false;
    self.disabled = opts.disabled || false;

    if (opts.label) {
        self.label = opts.label;
    } else if (opts.label_key) {
        self.label = ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return data[opts.label_key];
            }
        });
    }

    self.event = function() {
        Observer.broadcast_for_id(self.get_id(), 'EventButton', self.data());
    };

    return self;
}
