/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    if (opts.compset) {
        self.compset = new CompSet(opts.compset);
    }

    self.irr_chart = new BenchmarkChart({
        template: 'tpl_chart_box',
        height: 510,
        label: 'IRR',
        format: 'irr',
        legend: opts.legend,
        comps: self.compset.comps,
        label_key: 'name',
        value_key: 'irr',
        data: ko.computed(() => {
            let data = self.data();
            if (data && data.irr) {
                return data['irr'];
            }
            return [];
        }),
    });

    self.tvpi_chart = new BenchmarkChart({
        template: 'tpl_chart_box',
        height: 510,
        label: 'TVPI',
        format: 'multiple',
        comps: self.compset.comps,
        label_key: 'name',
        value_key: 'tvpi',
        legend: opts.legend,
        data: ko.computed(() => {
            let data = self.data();
            if (data && data.multiple) {
                return data['multiple'];
            }
            return [];
        }),
    });

    self.dpi_chart = new BenchmarkChart({
        template: 'tpl_chart_box',
        height: 510,
        label: 'DPI',
        format: 'multiple',
        comps: self.compset.comps,
        label_key: 'name',
        value_key: 'dpi',
        legend: opts.legend,
        data: ko.computed(() => {
            let data = self.data();
            if (data && data.dpi) {
                return data['dpi'];
            }
            return [];
        }),
    });

    self.rvpi_chart = new BenchmarkChart({
        template: 'tpl_chart_box',
        height: 510,
        label: 'RVPI',
        format: 'multiple',
        comps: self.compset.comps,
        label_key: 'name',
        value_key: 'rvpi',
        legend: opts.legend,
        data: ko.computed(() => {
            let data = self.data();
            if (data && data.rvpi) {
                return data['rvpi'];
            }
            return [];
        }),
    });

    self.lookup = {
        irr: 'irr_chart',
        tvpi: 'tvpi_chart',
        dpi: 'dpi_chart',
        rvpi: 'rvpi_chart',
    };

    self.charts = ko.computed(() => {
        if (opts.charts === undefined) {
            return [];
        }
        let c = [];
        opts.charts.map(n => {
            let key = self.lookup[n];
            c.push(self[key]);
        });
        return c;
    });

    return self;
}
