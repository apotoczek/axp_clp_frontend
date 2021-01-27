/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BarChart from 'src/libs/components/charts/BarChart';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_multi_bar_chart';

    let _dfd = self.new_deferred();

    self.chart_configs = opts.charts;

    self.charts = ko.observableArray([]);

    self.columns = opts.columns || 2;

    self.chart_height = opts.chart_height;
    self.truncate_label_length = opts.truncate_label_length;
    self.axis_font_size = opts.axis_font_size;

    self.exporting = opts.exporting;

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.get_chart_instance = function(config) {
        return self.new_instance(BarChart, {
            dependencies: [self.get_id()],
            height: self.chart_height,
            template: 'tpl_chart',
            format: config.format,
            label_in_chart: true,
            label: config.label,
            value_key: config.value_key,
            label_key: config.label_key,
            axis_font_size: self.axis_font_size,
            exporting: self.exporting,
            truncate_label_length: self.truncate_label_length,
            data: ko.computed(() => {
                let data = self.data();

                if (data) {
                    if (config.order_by) {
                        let order_by = config.order_by.clone().reverse();

                        for (let item of order_by) {
                            data = data.mergeSort(
                                Utils.gen_sort_comp_fn(item.name, item.sort === 'desc'),
                            );
                        }
                    }

                    return data;
                }
            }),
            comps: self.comps,
        });
    };

    for (let chart of self.chart_configs) {
        self.charts.push(self.get_chart_instance(chart));
    }

    self.rows = ko.pureComputed(() => {
        return self.charts().inGroups(self.columns);
    });

    self.column_css = `col-md-${12 / self.columns}`;

    _dfd.resolve();

    return self;
}
