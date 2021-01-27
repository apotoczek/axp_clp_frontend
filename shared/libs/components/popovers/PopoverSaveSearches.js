/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_save_search';
    self.placeholder = opts.placeholder || 'Name your search...';

    self.css = opts.css || 'popover-cpanel';

    self.loading = ko.observable(false);

    self.placement = opts.placement || 'right';

    self.name = ko.observable('');

    self.save = function() {
        Observer.broadcast_for_id(self.get_id(), 'PopoverSaveSearches.save', {
            name: self.name(),
        });
    };

    self.get_value = ko.computed(() => {
        return;
    });

    self.modified = ko.computed(() => {
        return;
    });

    self.dfd.resolve();

    return self;
}
