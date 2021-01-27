/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import CompSet from 'src/libs/components/CompSet';
import BenchmarkTable from 'src/libs/components/BenchmarkTable';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->

            <div data-bind="attr: { id: html_id() }">
                <!-- ko if: data_mode -->
                    <!-- ko renderComponent: fund_table --><!-- /ko -->
                <!-- /ko -->
                <!-- ko ifnot: data_mode -->
                    <div class="row" data-bind="foreach: charts">
                        <div class="col-xs-12 col-md-3">
                            <!-- ko renderComponent: $data --><!-- /ko -->
                        </div>
                    </div>
                    <!-- ko template: {
                        name: 'tpl_benchmark_legend',
                        data: charts[0],
                    }--><!-- /ko -->
                    <div class="component-box" data-bind="renderComponent: benchmark_table"></div>
                <!-- /ko -->
            </div>
            <!-- /ko -->
        `);

    self.data_mode = ko.observable(false);

    if (opts.set_mode_event) {
        Observer.register_for_id(self.get_id(), opts.set_mode_event, mode => {
            self.toggle_mode(mode);
        });
    }

    if (opts.request_data_event) {
        self.request_data_event = opts.request_data_event;
        Observer.register(self.request_data_event, action => {
            let data = {
                comps: self.comps,
                data: self.data(),
            };
            Observer.broadcast_for_id(self.get_id(), 'Report.data_snapshot', {
                id: self.id,
                data: data,
                action: action,
            });
        });
    }

    if (opts.restore_data_event) {
        self.restore_data_event = opts.restore_data_event;
        Observer.register(self.restore_data_event, data => {
            if (data.id == self.id) {
                self.comps = data.comps;
                self.data = data.data;
            }
        });
    }

    self.toggle_mode = function(mode) {
        if (mode) {
            self.data_mode(mode === 'data');
        } else {
            self.data_mode(!self.data_mode());
        }
    };

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event('AnalyticsPeer.export_funds', self.get_id());
        let export_benchmark_csv_event = Utils.gen_event(
            'AnalyticsPeer.export_benchmark',
            self.get_id(),
        );

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Funds',
                subtitle: 'CSV',
                type: 'Peer Benchmark',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Benchmark Details',
                subtitle: 'CSV',
                type: 'Peer Benchmark',
                event_type: export_benchmark_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.fund_table.export_csv();
        });

        Observer.register(export_benchmark_csv_event, () => {
            self.benchmark_table.export_csv();
        });
    }

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = [];
    }

    self.fund_table = new DataTable({
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 15,
        enable_csv_export: true,
        export_type: 'analytics_peer_funds',
        enable_clear_order: true,
        inline_data: true,
        dynamic_columns: [
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        public_taxonomy: true,
                    },
                },
                placement: {
                    relative: 'Vintage',
                    position: 'left',
                },
            },
        ],
        columns: [
            {
                label: 'Name',
                key: 'name',
                format: 'truncate',
            },
            {
                label: 'Data Set',
                key: 'origin',
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
                type: 'numeric',
            },
            {
                label: 'Fund Size',
                type: 'numeric',
                format: 'money',
                format_args: {
                    currency_key: 'currency_sym',
                    value_key: 'target_size',
                },
            },
            {
                label: 'IRR',
                key: 'irr',
                type: 'numeric',
                format: 'irr',
            },
            {
                label: 'TVPI',
                key: 'tvpi',
                type: 'numeric',
                format: 'multiple',
            },
            {
                label: 'RVPI',
                key: 'rvpi',
                type: 'numeric',
                format: 'multiple',
            },
            {
                label: 'DPI',
                key: 'dpi',
                type: 'numeric',
                format: 'multiple',
            },
            {
                label: 'As of Date',
                key: 'as_of_date',
                format: 'backend_date',
            },
        ],
        export_columns: [
            {
                label: 'Currency',
                key: 'currency_sym',
                default_value: 'USD',
                placement: {
                    position: 'right',
                    relative: 'Fund Size',
                },
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.data();
            let rows = [];

            if (data && data.items) {
                for (let i = 0, l = data.items.length; i < l; i++) {
                    let row = {...data.items[i]};
                    if (!row.origin) {
                        row.origin = 'Market Data';
                    }
                    rows.push(row);
                }
            }

            return rows;
        }),
        comps: self.comps,
        loading: self.loading,
        error: self.error,
    });

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
    ];

    self.charts = [
        new BenchmarkChart({
            format: 'irr',
            label: 'IRR',
            label_in_chart: true,
            loading: self.loading,
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data) {
                    return data['irr'];
                }
            }),
            value_key: 'irr',
            label_key: 'name',
            comps: self.comps,
            legend: true,
            exporting: true,
        }),
        new BenchmarkChart({
            format: 'multiple',
            label: 'TVPI',
            label_in_chart: true,
            loading: self.loading,
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data) {
                    return data['tvpi'];
                }
            }),
            value_key: 'tvpi',
            label_key: 'name',
            comps: self.comps,
            legend: true,
            exporting: true,
        }),
        new BenchmarkChart({
            format: 'multiple',
            label: 'DPI',
            label_in_chart: true,
            loading: self.loading,
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data) {
                    return data['dpi'];
                }
            }),
            value_key: 'dpi',
            label_key: 'name',
            comps: self.comps,
            legend: true,
            exporting: true,
        }),
        new BenchmarkChart({
            format: 'multiple',
            label: 'RVPI',
            label_in_chart: true,
            loading: self.loading,
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data) {
                    return data['rvpi'];
                }
            }),
            value_key: 'rvpi',
            label_key: 'name',
            comps: self.comps,
            legend: true,
            exporting: true,
        }),
    ];

    let table_data = ko.pureComputed(() => {
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

    let extra_row_defs = [
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

    self.benchmark_table = new BenchmarkTable({
        data: table_data,
        metrics: self.metrics,
        extra_row_defs: extra_row_defs,
    });

    return self;
}
