/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseChart(opts, components);
    self.formatter = opts.formatter || Formatters.gen_formatter(opts);
    self.label_formatter = opts.label_formatter || Formatters.gen_formatter(opts.label_format);
    self.data_key = opts.data_key || undefined;
    self.value_key = opts.value_key || 'value';
    self.label_key = opts.label_key || 'label';

    self.vertical_bars = opts.vertical_bars || false;
    self.allow_decimals = opts.allow_decimals === undefined ? true : opts.allow_decimals;

    self.tick_interval = opts.tick_interval || undefined;

    if (opts.truncate_label_length === undefined) {
        self.truncate_label_length = 30;
    } else {
        self.truncate_label_length = opts.truncate_label_length;
    }

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    }

    self.options = Utils.deep_merge(self.options, {
        chart: {
            type: self.vertical_bars ? 'column' : 'bar',
            spacing: opts.spacing || [10, 10, 10, 10],
        },
        xAxis: {
            categories_from_data: true,
            labels: {
                formatter: function() {
                    let label = self.label_formatter(this.value);

                    if (self.truncate_label_length) {
                        return String(label).truncate(self.truncate_label_length, 'middle');
                    }

                    return label;
                },
            },
        },
        yAxis: {
            tickInterval: self.tick_interval,
            allowDecimals: self.allow_decimals,
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size:10px;">${self.label_formatter(
                    this.x,
                )}</span><br>${self.formatter(this.y)}`;
            },
        },
        plotOptions: {
            series: {
                colorByPoint: true,
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let series = {
            categories: [],
            data: [],
        };

        let comps = [];

        if (self.comps) {
            comps.push(...self.comps());
        }

        let data = self.data();

        if (data) {
            if (self.data_key) {
                data = Utils.extract_data(self.data_key, data);
            }

            comps.push(...data);
        }

        for (let comp of comps) {
            if (comp) {
                let value = Utils.extract_data(self.value_key, comp);
                let label = Utils.extract_data(self.label_key, comp);

                if ((Utils.is_set(value) || opts.show_null) && Utils.is_set(label)) {
                    series.categories.push(Utils.unescape_html(label));

                    let data = {
                        y: value || null,
                    };

                    if (comp.color) {
                        data.color = self.get_color(comp.color);
                    }

                    series.data.push(data);
                }
            }
        }

        return [series];
    });

    return self;
}
