/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    self.css = opts.css || 'popover-cpanel';

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.waiting = ko.observable(false);
    self.enabled = ko.observable(true);
    self.formatter = Formatters.gen_formatter(opts);

    self.prefix = opts.prefix;
    self.suffix = opts.suffix;

    self.min = ko.observable();
    self.max = ko.observable();

    self.clear = function() {
        self.min(undefined);
        self.max(undefined);
    };

    self.range = ko.computed(() => {
        let range = {};

        let min = parseFloat(self.min());
        let max = parseFloat(self.max());

        if (!isNaN(min)) {
            range.min = min;
        }
        if (!isNaN(max) && (isNaN(min) || max >= min)) {
            range.max = max;
        }

        return range;
    });

    self.selected_string = ko.computed(() => {
        let range = self.range();

        if (range) {
            if (range.min && range.max) {
                return `${self.formatter(range.min)} - ${self.formatter(range.max)}`;
            }
            if (range.max) {
                return `< ${self.formatter(range.max)}`;
            }
            if (range.min) {
                return `> ${self.formatter(range.min)}`;
            }
        }

        return 'No selection';
    });

    self.get_state = function() {
        return self.range();
    };

    self.state = ko.pureComputed(() => self.get_state());

    self.set_state = function(state) {
        if (state) {
            self.min(state.min);
            self.max(state.max);
        }
    };

    self.get_metrics = function(minmax) {
        return minmax == 'max' ? self.max() : self.min();
    };

    self.get_value = ko.computed(() => {
        return self.range();
    });

    self.modified = ko.computed(() => {
        return self.min() || self.max();
    });

    _dfd.resolve();

    return self;
}
