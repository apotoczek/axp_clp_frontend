/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DynamicBenchmarkChart from 'src/libs/components/charts/DynamicBenchmarkChart';
import BenchmarkTable from 'src/libs/components/BenchmarkTable';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.charts = [
        self.new_instance(DynamicBenchmarkChart, {
            default_selected_index: 0,
            dependencies: [self.get_id()],
            comps: self.comps,
            data: self.data,
        }),
        self.new_instance(DynamicBenchmarkChart, {
            default_selected_index: 1,
            dependencies: [self.get_id()],
            comps: self.comps,
            data: self.data,
        }),
        self.new_instance(DynamicBenchmarkChart, {
            default_selected_index: 2,
            dependencies: [self.get_id()],
            comps: self.comps,
            data: self.data,
        }),
    ];

    self.table = self.new_instance(BenchmarkTable, {
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.get_id()],
        metrics: [
            {
                label: 'Net IRR',
                key: 'irr',
                type: 'numeric',
                format: 'irr',
            },
            {
                label: 'TVPI',
                key: 'multiple',
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
                label: 'RVPI',
                key: 'rvpi',
                type: 'numeric',
                format: 'multiple',
            },
            {
                label: 'PME Alpha',
                key: 'bison_pme_alpha',
                type: 'numeric',
                format: 'percent',
            },
            {
                label: 'Momentum',
                key: 'momentum_1_year',
                type: 'numeric',
                format: 'percent',
            },
        ],
        data: self.data,
    });

    self.define_default_template(`
            <div class="row" data-bind="foreach: charts">
                <div class="col-md-4" data-bind="renderComponent: $data"></div>
            </div>
            <div style="padding: 0 20px;" data-bind="renderComponent: table"></div>
        `);

    self.when(...self.charts, self.table).done(() => {
        _dfd.resolve();
    });

    return self;
}
