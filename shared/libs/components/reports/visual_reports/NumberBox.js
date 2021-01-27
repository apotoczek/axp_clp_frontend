/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts) {
    let self = new BaseComponent(opts);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.subtext = opts.subtext;

    self.label = opts.label;

    self.value = ko.computed(() => {
        let data = self.data();

        if (opts.data_key && data) {
            return self.formatter(data[opts.data_key]);
        }
        return self.formatter(data);
    });

    return self;
}
