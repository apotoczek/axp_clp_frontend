/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_popover_text_input';

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.close_on_submit = opts.close_on_submit || false;

    self.submit_event =
        opts.submit_event || Utils.gen_event('PopoverTextInput.value', self.get_id());

    self.value = ko.observable('');

    self.empty_value = ko.pureComputed(() => {
        return !self.value().length;
    });

    self.placeholder = opts.placeholder;

    self.get_value = ko.pureComputed(() => {
        return self.value();
    });

    self.value_empty = ko.pureComputed(() => {
        return !self.value().length;
    });

    self.submit = function() {
        Observer.broadcast(self.submit_event, self.get_value());

        self.clear();

        if (self.close_on_submit && typeof self.close == 'function') {
            self.close();
        }
    };

    self.set_state = function() {};

    self.get_state = function() {};

    self.get_metrics = function() {};

    self.modified = function() {
        return false;
    };

    self.clear = function() {
        self.value('');
    };

    self.selected_string = function() {};

    _dfd.resolve();

    return self;
}
