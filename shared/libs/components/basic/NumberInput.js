/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import TextInput from 'src/libs/components/basic/TextInput';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    opts.rateLimit = 0;

    let self = new TextInput(opts, components);

    let _dfd = self.new_deferred();

    self._event_base = 'NumberInput';

    self.template = opts.template || 'tpl_special_text_input';

    self.format = opts.format;
    self.format_args = opts.format_args;

    if (self.format) {
        self.formatter = Formatters.gen_formatter({
            format: self.format,
            format_args: self.format_args,
        });
    } else {
        self.formatter = Formatters.gen_formatter('number');
    }

    self.error_message = opts.error_message || 'Invalid number';

    self.value_bind = ko.pureComputed({
        read: function() {
            let value = self.value();
            if (Utils.is_set(value, true)) {
                return self.formatter(value);
            }
            return '';
        },
        write: function(value) {
            if (self.allow_empty && !Utils.is_set(value, true)) {
                self.valid(true);
                self.value(self.value_on_empty);
            } else if (!Utils.is_set(value, true)) {
                self.valid(false);
            } else {
                let number = Utils.parse_number(value);
                if (Utils.is_set(number, true)) {
                    self.valid(true);
                    self.value(number);
                } else {
                    self.valid(false);
                }
            }
        },
    });

    _dfd.resolve();

    return self;
}
