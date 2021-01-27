/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.show_action_button = opts.show_action_button || false;
    self.show_entity_name = opts.show_entity_name || false;

    self.template = opts.template || 'tpl_event_feed';
    self.feed_width = opts.feed_width || '350px';

    self.dfd = self.new_deferred();

    self.events = ko.computed(() => {
        let data = self.data();

        if (data) {
            return data;
        }
        return [];
    });

    self.is_empty = ko.computed(() => {
        let events = self.events();
        if (events) {
            return events.length == 0;
        }
        return true;
    });

    self.imp_css = function(imp_type) {
        if (imp_type && typeof imp_type.replace == 'function') {
            return imp_type.replace(/ /g, '-').toLowerCase();
        }
        return '';
    };

    self.dfd.resolve();

    return self;
}
