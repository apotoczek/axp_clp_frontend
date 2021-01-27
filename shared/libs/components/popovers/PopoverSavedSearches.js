/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, componets) {
    let self = new BaseComponent(opts, componets);

    let _dfd = self.new_deferred();

    self.placement = opts.placement || 'right';
    self.type = opts.type;

    self.css = opts.css || 'popover-cpanel';

    self.loading = ko.observable(false);

    self.template = opts.template || 'tpl_saved_searches';

    self.activate_state = function(state) {
        Observer.broadcast_for_id(self.get_id(), 'PopoverSavedSearches.load', state);
    };

    self.saved_searches = ko.computed(() => {
        let data = self.data();

        if (data && data[self.type]) {
            return data[self.type];
        }
        return [];
    });

    self.delete_state = function(state) {
        Observer.broadcast_for_id(self.get_id(), 'PopoverSavedSearches.delete', state);
    };

    self.is_empty = ko.computed(() => {
        if (self.data() && self.data()[self.type]) {
            return self.data()[self.type].length <= 0;
        }
        return true;
    });

    self.get_value = ko.computed(() => {
        return;
    });

    self.modified = ko.computed(() => {
        return;
    });

    _dfd.resolve();

    return self;
}
