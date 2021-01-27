/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_metric_table';

    self.metrics = opts.metrics || [];
    self.metrics_fn = opts.metrics_fn;
    self.caption_text = opts.caption_text || '';

    self.title = opts.title || false;

    self.css = opts.css || {
        'table-dark': true,
        'table-lg': true,
    };

    self.top_css = opts.top_css;

    self.description_key = opts.description_key;

    self.description = ko.computed(() => {
        let data = self.data();
        if (data && self.description_key) {
            return data[self.description_key];
        }
        return undefined;
    });

    self.rows = ko.computed(() => {
        let data = self.data();
        let rows = [];

        if (data) {
            if (self.metrics_fn && typeof self.metrics_fn === 'function') {
                rows = self.metrics_fn(data);
            } else {
                for (let i = 0, l = self.metrics.length; i < l; i++) {
                    let label, value, visible;

                    if (self.metrics[i].label) {
                        label = self.metrics[i].label;
                    } else if (self.metrics[i].label_key) {
                        label = data[self.metrics[i].label_key];
                    }

                    if (self.metrics[i].value) {
                        value = self.metrics[i].value;
                    } else if (self.metrics[i].value_key) {
                        value = Utils.extract_data(self.metrics[i].value_key, data);
                    } else if (self.metrics[i].value_fn) {
                        value = self.metrics[i].value_fn(data);
                    } else {
                        value = data;
                    }

                    let formatter = Formatters.gen_formatter(self.metrics[i]);

                    if (self.metrics[i].visible && typeof self.metrics[i].visible === 'function') {
                        visible = self.metrics[i].visible(data);
                    } else {
                        visible = true;
                    }

                    if (Utils.is_set(label) && visible) {
                        rows.push({
                            label: label,
                            value: formatter(value),
                            definition: self.metrics[i].definition,
                        });
                    }
                }
            }
        }
        return rows;
    });

    self.columns = ko.computed(() => {
        return self.rows().inGroups(opts.columns || 1);
    });

    self.column_css = ko.computed(() => {
        return `col-md-${12 / (opts.columns || 1)}`;
    });

    return self;
}
