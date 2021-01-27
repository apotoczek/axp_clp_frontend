/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NumberBox from 'src/libs/components/basic/NumberBox';
import * as Formatters from 'src/libs/Formatters';
import MetricTable from 'src/libs/components/MetricTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.title_key = opts.title_key || 'name';
    self.subtitle_key = opts.subtitle_key;

    opts.callouts = opts.callouts || [
        {
            label: 'Net IRR',
            value_key: 'irr',
            format: 'irr_highlight',
        },
        {
            label: 'TVPI',
            value_key: 'tvpi',
            format: 'multiple_highlight',
        },
        {
            label: 'DPI',
            value_key: 'dpi',
            format: 'multiple_neutral',
        },
    ];

    opts.characteristics = opts.characteristics || [
        {
            label: 'Geography',
            value_key: 'geography',
        },
        {
            label: 'Style',
            value_key: 'style',
        },
        {
            label: 'As of',
            value_key: 'as_of_date_display',
        },
    ];

    self.title = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data[self.title_key];
        }
    });

    self.subtitle = ko.computed(() => {
        let data = self.data();
        if (data && self.subtitle_key) {
            return data[self.subtitle_key];
        }
        return '';
    });

    self.vintage_year = ko.computed(() => {
        let data = self.data();
        if (data) {
            return data['vintage_year'];
        }
        return '';
    });

    self.callouts = [];

    self.init_callout = function(opts) {
        return new NumberBox({
            template: 'tpl_number_box',
            label: opts.label,
            format: opts.format,
            subtext: opts.subtext,
            data: ko.computed(() => {
                let data = self.data();
                if (data) {
                    return data[opts.value_key];
                }
            }),
        });
    };

    self.metric_table = new MetricTable({data: self.data, metrics: opts.metrics});

    for (let i = 0, l = opts.callouts.length; i < l; i++) {
        self.callouts.push(self.init_callout(opts.callouts[i]));
    }

    self.characteristics = ko.observableArray([]);

    self.init_characteristic = function(opts) {
        let formatter = Formatters.gen_formatter(opts);
        return {
            label: opts.label,
            value: ko.computed(() => {
                let data = self.data();
                if (data) {
                    return formatter(data[opts.value_key]);
                }
            }),
        };
    };

    for (let i = 0, l = opts.characteristics.length; i < l; i++) {
        self.characteristics.push(self.init_characteristic(opts.characteristics[i]));
    }

    return self;
}
