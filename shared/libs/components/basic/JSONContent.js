/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts) {
    let self = new BaseComponent(opts);

    self.template = opts.template || 'tpl_json_content';

    self.show_all = ko.observable(opts.show_all || false);

    self.toggle_expand = function() {
        self.show_all(!self.show_all());
    };

    self.button_text = ko.pureComputed(() => {
        if (self.show_all()) {
            return 'Collapse...';
        }

        return 'Expand...';
    });

    self.json = ko.pureComputed(() => {
        let data = self.data();
        if (data) {
            let data_to_show = [];
            for (
                let i = 0;
                (i < data.sec_data.length && self.show_all()) ||
                (!self.show_all() && i < data.sec_data.length && i < 10);
                i++
            ) {
                let key = data.sec_data[i].key;
                let value = data.sec_data[i].value;
                if ((key === 'Fund Size' || key === 'Amount Closed') && !isNaN(parseFloat(value))) {
                    value = Formatters.number(parseFloat(data.sec_data[i].value), false, undefined);
                }
                data_to_show.push({
                    key: key,
                    value: value,
                });
            }
            return data_to_show;
        }
        return undefined;
    });
    return self;
}
