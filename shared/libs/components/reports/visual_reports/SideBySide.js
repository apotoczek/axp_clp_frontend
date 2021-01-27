/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BarChart from 'src/libs/components/charts/BarChart';
import CompSet from 'src/libs/components/CompSet';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_visual_report_side_by_side';
    self.static_comps = ko.observable();
    self.show_dropdown = true;

    if (opts.hide_dropdown === true) {
        self.show_dropdown = false;
    }

    if (opts.set_mode_event) {
        Observer.register_for_id(self.get_id(), opts.set_mode_event, mode => {
            self.toggle_mode(mode);
        });
    }

    self.extract_dynamic_data = function() {
        return {
            data: self.data(),
            comps: self.comps(),
            selected: self.chart_dropdown.selected_value(),
        };
    };

    self.restore_dynamic_data = function(snapshot) {
        self.data(snapshot.data);
        self.comps(snapshot.comps);
        self.chart_dropdown.set_selected_by_value(snapshot.selected);
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

    self.toggle_mode = function(mode) {
        if (mode) {
            self.data_mode(mode === 'data');
        } else {
            self.data_mode(!self.data_mode());
        }
    };

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event('AnalyticsSideBySide.export_funds', self.get_id());

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Funds',
                subtitle: 'CSV',
                type: 'Side by Side',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.fund_table.export_csv();
        });
    }

    if (opts.meta_event) {
        self.data.subscribe(data => {
            Observer.broadcast(opts.meta_event, data.meta.count);
        });
    }

    self.metrics = [
        {
            label: 'TVPI',
            value: 'tvpi',
        },
        {
            label: 'IRR',
            value: 'irr',
        },
        {
            label: 'DPI',
            value: 'dpi',
        },
        {
            label: 'RVPI',
            value: 'rvpi',
        },
    ];

    self.chart_dropdown = self.new_instance(NewDropdown, {
        id: 'chart_dropdown',
        options: self.metrics,
        default_selected_index: 0,
        btn_css: {'btn-ghost-default': true},
        inline: true,
        min_width: '150px',
    });

    self.label = ko.computed(() => {
        return self.chart_dropdown.selected().label;
    });

    self.chart_data = ko.computed(() => {
        return self.data() ? self.data().results : [];
    });

    self.charts = {
        irr: new BarChart({
            height: 300,
            template: 'tpl_chart_box',
            format: 'irr',
            value_key: 'irr',
            label_key: 'name',
            data: self.chart_data,
            comps: self.comps,
            loading: self.loading,
            exporting: false,
        }),
        tvpi: new BarChart({
            height: 300,
            template: 'tpl_chart_box',
            format: 'multiple',
            loading: self.loading,
            value_key: 'multiple',
            label_key: 'name',
            data: self.chart_data,
            comps: self.comps,
            exporting: false,
        }),
        dpi: new BarChart({
            height: 300,
            template: 'tpl_chart_box',
            format: 'multiple',
            loading: self.loading,
            value_key: 'dpi',
            label_key: 'name',
            data: self.chart_data,
            comps: self.comps,
            exporting: false,
        }),
        rvpi: new BarChart({
            height: 300,
            template: 'tpl_chart_box',
            format: 'multiple',
            loading: self.loading,
            value_key: 'rvpi',
            label_key: 'name',
            data: self.chart_data,
            comps: self.comps,
            exporting: false,
        }),
    };

    self.chart = ko.computed(() => {
        let metric = self.chart_dropdown.selected();
        if (metric && metric.value) {
            return self.charts[metric.value];
        }
    });

    return self;
}
