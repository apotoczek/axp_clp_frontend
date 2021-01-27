/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import TextInput from 'src/libs/components/basic/TextInput';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    opts.rateLimit = 0;

    let self = new TextInput(opts, components);

    let _dfd = self.new_deferred();

    self.use_local_time = opts.use_local_time || false;

    self._event_base = 'DateInput';

    self._max_value = opts.max_value || undefined;
    self._min_value = opts.min_value || undefined;
    self._limit_error = opts.limit_error || false;
    if (self._min_value > self._max_value) {
        throw 'Min value may not exceed max value.';
    }

    self.template = opts.template || 'tpl_special_text_input';

    if (self.use_local_time) {
        self.formatter = Formatters.gen_formatter('backend_local_date');
    } else {
        self.formatter = Formatters.gen_formatter('backend_date');
    }

    self.default_error_message = opts.error_message || 'Invalid Date';
    self.error_message = ko.observable(self.default_error_message);

    self.value_bind = ko.pureComputed({
        read: function() {
            let value = self.value();
            if (Utils.is_set(value, true)) {
                return self.formatter(value);
            }
            return '';
        },
        write: function(value) {
            self.reset_error_message(); // Reset to default in case we `raise_custom_error`ed

            if (self.allow_empty && !Utils.is_set(value, true)) {
                self.valid(true);
                self.value(self.value_on_empty);
            } else if (!Utils.is_set(value, true)) {
                self.valid(false);
            } else {
                let date = self._maybe_limit_value(
                    Utils.date_to_epoch(value, !self.use_local_time),
                );
                if (!date) {
                    self.raise_custom_error('Out of Range');
                } else if (Utils.is_set(date, true)) {
                    self.valid(true);
                    self.value(date);
                } else {
                    self.valid(false);
                }
            }
        },
    });

    self.reset_error_message = () => {
        self.error_message(self.default_error_message);
    };

    self._maybe_limit_value = value => {
        let max_val = ko.unwrap(self._max_value);
        if (max_val && value > max_val) {
            return self._limit_error ? false : max_val;
        }

        let min_val = ko.unwrap(self._min_value);
        if (min_val && value < min_val) {
            return self._limit_error ? false : min_val;
        }
        return value;
    };

    self.raise_custom_error = msg => {
        self.error_message(msg);
        self.valid(false);
    };

    _dfd.resolve();

    return self;
}
