/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import DateInput from 'src/libs/components/basic/DateInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import PercentInput from 'src/libs/components/basic/PercentInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.mode = opts.mode || 'number';

    self._classes = {
        date: DateInput,
        number: NumberInput,
        amount: NumberInput,
        percent: PercentInput,
        percentage: PercentInput,
    };

    self._cls = self._classes[self.mode];

    self.template = opts.template || 'tpl_popover_input_range';

    self.css = opts.css || 'popover-cpanel';

    self.clear_btn_css = opts.clear_btn_css || {
        'btn-block': true,
        'btn-cpanel': true,
        'btn-sm': true,
    };

    self.close_btn_css = opts.close_btn_css || {
        'btn-block': true,
        'btn-default': true,
        'btn-sm': true,
    };

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.min = self.new_instance(self._cls, {id: 'min', ...opts.min});

    self.max = self.new_instance(self._cls, {id: 'max', ...opts.max});

    self.clear = function() {
        self.min.clear();
        self.max.clear();
    };

    self.formatter = self.max.formatter;

    self.range = ko.computed(() => {
        let range = {};

        let min = self.min.value();
        let max = self.max.value();

        if (Utils.is_set(min)) {
            range.min = min;
        }
        if (Utils.is_set(max) && (!Utils.is_set(min) || max >= min)) {
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
            self.min.value(state.min);
            self.max.value(state.max);
        }
    };

    self.get_value = ko.computed(() => {
        return self.range();
    });

    self.modified = ko.computed(() => {
        return Utils.is_set(self.min.value()) || Utils.is_set(self.max.value());
    });

    _dfd.resolve();

    return self;
}
