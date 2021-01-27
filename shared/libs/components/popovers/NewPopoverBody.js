/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.title = opts.title;
    self.title_css = opts.title_css;

    self.style = opts.style || {
        width: '150px',
    };

    self.close_others = function(id) {
        for (let item of self.layout.body) {
            if (item.get_id() !== id) {
                if (typeof item.close_popover === 'function') {
                    item.close_popover();
                } else if (typeof item.close_others === 'function') {
                    item.close_others(id);
                }
            }
        }
    };

    self.when(self).done(() => {
        for (let item of self.layout.body) {
            Observer.register_for_id(item.get_id(), 'PopoverButton.opened', () => {
                self.close_others(item.get_id());
            });
        }
    });

    self.modified = ko.pureComputed(() => {
        let modified = false;

        for (let item of self.layout.body) {
            if (item.modified && item.modified()) {
                modified = true;
            }
        }

        return modified;
    });

    _dfd.resolve();

    return self;
}
