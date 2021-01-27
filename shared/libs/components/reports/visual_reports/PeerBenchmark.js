/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import CompSet from 'src/libs/components/CompSet';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import BenchmarkTable from 'src/libs/components/BenchmarkTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_report_peer';

    self.data_mode = ko.observable(false);

    self._metrics = opts.metrics || ['irr', 'tvpi', 'dpi'];
    self.show_table = opts.show_table || false;
    self.comp_in_table = opts.comp_in_table || false;

    self.chart_height = opts.chart_height;

    self.extract_dynamic_data = function() {
        return {
            comps: ko.unwrap(self.comps),
            data: self.data(),
        };
    };

    self.restore_dynamic_data = function(input) {
        self.comps(input.comps);
        self.data(input.data);
    };

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.metrics = [
        {
            key: 'irr',
            label: 'IRR',
            format: 'irr',
        },
        {
            key: 'tvpi',
            label: 'TVPI',
            format: 'multiple',
        },
        {
            key: 'dpi',
            label: 'DPI',
            format: 'multiple',
        },
        {
            key: 'rvpi',
            label: 'RVPI',
            format: 'multiple',
        },
    ].filter(metric => self._metrics.indexOf(metric.key) > -1);

    self.charts = [];

    self.get_chart_instance = function(config) {
        return self.new_instance(BenchmarkChart, {
            format: config.format,
            label: config.label,
            label_in_chart: true,
            loading: self.loading,
            data: ko.computed(() => {
                let data = self.data();

                if (data) {
                    return data[config.key];
                }
            }),
            height: self.chart_height,
            value_key: config.key,
            label_key: 'name',
            comps: self.comps,
            legend: true,
            exporting: false,
        });
    };

    for (let metric of self.metrics) {
        self.charts.push(self.get_chart_instance(metric));
    }

    self.column_css = `col-xs-12 col-md-${12 / self.charts.length}`;

    if (self.show_table) {
        let table_data = self.data;
        let extra_row_defs;

        if (self.comp_in_table) {
            table_data = ko.pureComputed(() => {
                let data = self.data();
                let comps = self.comps();

                if (data && comps && comps.length > 0) {
                    data = Utils.deep_copy_object(data);

                    for (let metric of self.metrics) {
                        data[metric.key].comp = comps[0][metric.key];
                    }
                }

                return data;
            });

            extra_row_defs = [
                {
                    label: ko.pureComputed(() => {
                        let comps = self.comps();

                        if (comps && comps.length > 0) {
                            return comps[0].name;
                        }

                        return 'Entity';
                    }),
                    value_fn: (data, formatter) => formatter(data && data.comp),
                },
            ];
        }

        self.benchmark_table = new BenchmarkTable({
            data: table_data,
            metrics: self.metrics,
            extra_row_defs: extra_row_defs,
        });
    }

    if (opts.meta_event) {
        self.data.subscribe(data => {
            if (data) {
                Observer.broadcast(
                    opts.meta_event,
                    Math.max(data.irr.count, data.tvpi.count, data.dpi.count),
                );
            } else {
                Observer.broadcast(opts.meta_event, 0);
            }
        });
    }

    return self;
}
