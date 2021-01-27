/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_number_box';

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);
    self.data_key = opts.data_key;
    self.subtext = opts.subtext;

    self.label = opts.label;

    self.value = ko.computed(() => {
        let data = self.data();

        if (opts.data_key && data) {
            return self.formatter(data[self.data_key]);
        }
        return self.formatter(data);
    });

    return self;
}
