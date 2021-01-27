/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.formatter = Formatters.gen_formatter(opts);

    self.asterisk_key = opts.asterisk_key;
    self.value_key = opts.value_key;

    self.define_default_template(`
            <!-- ko with: mapped -->
                <span data-bind="define: $data.define, html: $data.value"></span>
            <!-- /ko -->
        `);

    self.mapped = ko.pureComputed(() => {
        let data = self.data();

        let value = undefined;
        let mapped = {};

        if (self.value_key) {
            value = Utils.extract_data(self.value_key, data);
        } else {
            value = data;
        }

        mapped.value = self.formatter(value);

        if (self.asterisk_key && Utils.is_set(value)) {
            let add_asterisk = Utils.extract_data(self.asterisk_key, data);

            if (add_asterisk) {
                mapped.define = {
                    placement: 'bottom',
                    width: '200px',
                    css_class: 'popover-define-small',
                    term: self.asterisk_key,
                    underlined: false,
                };

                mapped.value = `${mapped.value} *`;
            }
        }

        return mapped;
    });

    return self;
}
