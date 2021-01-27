/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import ScoringChart from 'src/libs/components/charts/ScoringChart';
import MetricTimeseries from 'src/libs/components/charts/MetricTimeseries';
import DynamicBenchmark from 'src/libs/components/market_insights/DynamicBenchmark';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = 'tpl_fund_performance';

    self.table_columns = opts.table_columns || false;
    self.limit_table_to_one_page = opts.limit_table_to_one_page || false;
    self.datatable_page_event = opts.datatable_page_event;
    self.datatable_order_event = opts.datatable_order_event;

    self.enable_compset = opts.enable_compset;
    self.set_compset_event = opts.set_compset_event;
    self.clear_compset_event = opts.clear_compset_event;
    self.list_compset_event = opts.list_compset_event;

    self.register_export = opts.register_export;

    self.fund_datasource = opts.fund_datasource;
    self.table_datasource = opts.table_datasource;
    self.snapshot_datasource = opts.snapshot_datasource;
    self.timeseries_datasource = opts.timeseries_datasource;
    self.benchmark_datasource = opts.benchmark_datasource;

    self.disable_snapshot_comps = opts.disable_snapshot_comps;

    self.metric_events = opts.metric_events || {
        snapshot: false,
        timeseries: false,
    };

    self.valid_modes = ['snapshot', 'timeseries', 'benchmark'];
    self.active_compset = ko.observableArray([]);
    self.active_mode = ko.observable();

    self.enable_compset = ko.computed(() => {
        if (self.enable_compset) {
            let mode = self.active_mode();

            return mode === 'benchmark' || mode === 'snapshot';
        }
        return false;
    });

    if (self.set_compset_event) {
        Observer.register(self.set_compset_event, self.active_compset);
    }

    if (self.clear_compset_event) {
        Observer.register(self.clear_compset_event, () => {
            self.active_compset([]);
        });
    }

    self.metrics = [
        {
            value: 'irr',
            label: 'IRR',
            format: 'irr',
        },
        {
            value: 'multiple',
            label: 'TVPI',
            format: 'multiple',
        },
        {
            value: 'dpi',
            label: 'DPI',
            format: 'multiple',
        },
        {
            value: 'rvpi',
            label: 'RVPI',
            format: 'multiple',
        },
        {
            value: 'picc',
            label: 'Paid In %',
            format: 'percent',
        },
        {
            value: 'gross_irr',
            label: 'Gross IRR',
            format: 'irr',
        },
        {
            value: 'gross_multiple',
            label: 'Gross Multiple',
            format: 'multiple',
        },
        {
            value: 'bison_pme_alpha',
            label: 'PME Alpha',
            format: 'percent',
        },
        {
            value: 'twrr_since_inception',
            label: 'TWRR Since Inception',
            format: 'percent',
        },
        {
            value: 'twrr_1_year',
            label: 'TWRR 1 Year',
            format: 'percent',
        },
        {
            value: 'twrr_3_year',
            label: 'TWRR 3 Year',
            format: 'percent',
        },
        {
            value: 'momentum_1_year',
            label: 'Momentum 1 Year',
            format: 'percent',
        },
        {
            value: 'momentum_3_year',
            label: 'Momentum 3 Year',
            format: 'percent',
        },
        {
            value: 'target_size_usd',
            label: 'Target Size',
            format: 'money',
            format_args: {
                render_currency: 'USD',
            },
        },
        {
            value: 'total_sold_usd',
            label: 'Amt Closed',
            format: 'money',
            format_args: {
                render_currency: 'USD',
            },
        },
    ];

    self.compset = new CompSet({
        data: self.active_compset,
        comps: [
            {
                datasource: {
                    type: 'dynamic',
                    mapping: 'market_data_to_vehicle',
                    mapping_args: {
                        list: true,
                    },
                    query: {
                        target: 'list:entities',
                        uid: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: self.list_compset_event,
                            required: true,
                        },
                    },
                },
            },
            {
                color: '#4D4D4D',
                datasource: self.fund_datasource,
            },
        ],
    });

    self.modes = {
        snapshot: self.new_instance(ScoringChart, {
            id: 'snapshot',
            datasource: self.snapshot_datasource,
            comps: self.disable_snapshot_comps ? undefined : self.compset.comps,
            metrics: self.metrics,
            metric_events: self.metric_events.snapshot,
            datatable_page_event: self.datatable_page_event,
            datatable_order_event: self.datatable_order_event,
            margin: '0 20px',
            auto_get_data: false,
        }),
        timeseries: self.new_instance(MetricTimeseries, {
            id: 'timeseries',
            format: 'irr',
            metrics: self.metrics,
            metric_events: self.metric_events.timeseries,
            datasource: self.timeseries_datasource,
            comps: self.compset.comps,
            datatable_page_event: self.datatable_page_event,
            datatable_order_event: self.datatable_order_event,
            margin: '0 20px',
            auto_get_data: false,
        }),
        benchmark: self.new_instance(DynamicBenchmark, {
            id: 'benchmark',
            comps: self.compset.comps,
            datasource: self.benchmark_datasource,
            auto_get_data: false,
        }),
    };

    if (self.table_datasource && self.table_columns) {
        self.modes.table = self.new_instance(DataTable, {
            id: 'table',
            enable_localstorage: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 25,
            column_toggle_placement: 'bottom',
            inline_data: self.limit_table_to_one_page,
            register_export: self.register_export,
            export_type: 'market_data_similar_funds_csv',
            columns: self.table_columns,
            datasource: self.table_datasource,
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
                        relative: 'Name',
                        position: 'right',
                    },
                },
            ],
            auto_get_data: false,
        });
    }

    self.activate_mode = function(mode) {
        for (let [key, component] of Object.entries(self.modes)) {
            if (key !== mode) {
                component._auto_get_data = false;
            }
        }

        if (mode && mode in self.modes) {
            self.active_mode(mode);

            self.modes[mode]._auto_get_data = true;
            self.modes[mode].refresh_data();
        } else {
            self.active_mode(undefined);
        }
    };

    self.active_component = ko.pureComputed(() => {
        let mode = self.active_mode();

        if (mode) {
            return self.modes[mode];
        }
    });

    Observer.register(opts.select_chart, payload => {
        self.activate_mode(Utils.get(payload, 'value'));
    });

    if (opts.default_chart) {
        self.activate_mode(opts.default_chart);
    }

    self.when(...Object.values(self.modes)).done(() => {
        _dfd.resolve();
    });

    return self;
}
