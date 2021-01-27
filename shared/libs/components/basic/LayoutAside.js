/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();
    self.size = opts.size;
    self.is_first = opts.is_first || false;
    self.title = opts.title;
    self.title_css = opts.title_css;
    self.visible = ko.observable(true);
    self.visible_event = opts.visible_event;

    if (self.visible_event) {
        Observer.register(self.visible_event, visiblity => {
            self.visible(visiblity);
        });
    }

    _dfd.resolve();

    return self;
}
