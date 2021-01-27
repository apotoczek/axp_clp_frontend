/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import * as Formatters from 'src/libs/Formatters';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.metrics = opts.metrics || [
        {
            value: 'irr',
            label: 'IRR',
            format: 'percent',
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
            value: 'bison_pme_alpha',
            label: 'PME Alpha',
            format: 'percent',
        },
        {
            value: 'momentum_1_year',
            label: 'Momentum',
            format: 'percent',
        },
    ];

    self.default_selected_index = opts.default_selected_index || 0;
    self.enable_legend = opts.enable_legend || false;
    self.exporting = opts.exporting === undefined ? true : opts.exporting;

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.dropdown = self.new_instance(NewDropdown, {
        default_selected_index: self.default_selected_index,
        btn_css: {'btn-ghost-info': true, 'btn-sm': true},
        options: self.metrics,
    });

    self.chart_data = ko.pureComputed(() => {
        let data = self.data();
        let selected = self.dropdown.selected_value();

        if (data && selected && data[selected]) {
            return data[selected];
        }
    });

    self.formatter = function(value) {
        let metric = self.dropdown.selected();

        if (metric && metric.format) {
            let formatter = Formatters.gen_formatter(metric);

            return formatter(value);
        }

        return value;
    };

    self.label = ko.pureComputed(() => {
        let metric = self.dropdown.selected();

        if (metric && metric.label) {
            return metric.label;
        }
    });

    self.value_key = ko.pureComputed(() => {
        return self.dropdown.selected_value();
    });

    self.chart = self.new_instance(BenchmarkChart, {
        dependencies: [self.get_id()],
        formatter: self.formatter,
        label_in_chart: true,
        label: self.label,
        value_key: self.value_key,
        label_key: 'name',
        comps: self.comps,
        legend: self.enable_legend,
        exporting: self.exporting,
        data: self.chart_data,
    });

    self.define_default_template(`
            <!-- ko renderComponent: dropdown --><!-- /ko -->
            <!-- ko renderComponent: chart --><!-- /ko -->
        `);

    self.when(self.chart, self.dropdown).done(() => {
        _dfd.resolve();
    });

    return self;
}
