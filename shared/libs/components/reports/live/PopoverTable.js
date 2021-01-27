/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_popover_table';

    self.css = opts.css;
    self.item_css = opts.item_css;
    self.title = opts.title || '';

    self.click = function(entity) {
        Observer.broadcast_for_id(self.get_id(), 'PopoverTable.select', entity);
    };

    self.count = ko.computed(() => {
        if (self.data() && self.data().count) {
            Observer.broadcast_for_id(self.get_id(), 'PopoverTable.count', self.data().count, true);
        }
    });

    self.results = ko.computed(() => {
        if (self.data()) {
            if (self.data().results) {
                return self.data().results;
            }
            return self.data();
        }
        return [];
    });

    _dfd.resolve();

    return self;
}
