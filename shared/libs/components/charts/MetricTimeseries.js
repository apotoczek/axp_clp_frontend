/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.metric_events = opts.metric_events || false;
    self.tvpi_key = opts.tvpi_key || 'multiple';
    self.template = opts.template || 'tpl_metric_timeseries';
    self.datatable_page_event = opts.datatable_page_event;
    self.datatable_order_event = opts.datatable_order_event;

    self.margin = opts.margin || false;

    if (self.datatable_page_event) {
        Observer.register(self.datatable_page_event, page => {
            self.update_query({
                page: page,
            });
        });
    }

    if (self.datatable_order_event) {
        Observer.register(self.datatable_order_event, order => {
            self.update_query({
                order_by: order,
            });
        });
    }

    self.maybe_components = [];

    if (self.metric_events) {
        self.metric = ko.observable();

        Observer.register(self.metric_events.metric, payload => {
            if (Object.isArray(payload)) {
                if (payload.length > 0) {
                    self.metric(payload[0]);
                } else {
                    self.metric(undefined);
                }
            } else {
                self.metric(payload || undefined);
            }
        });
    } else {
        self.metric_dropdown = self.new_instance(NewDropdown, {
            id: 'dropdown',
            default_selected_index: 0,
            options: [
                {
                    value: 'irr',
                    label: 'IRR',
                    format: 'irr',
                },
                {
                    value: self.tvpi_key,
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
            ],
            btn_css: opts.btn_css || {'btn-ghost-info': true, 'btn-sm': true},
            inline: true,
            min_width: '150px',
        });

        self.maybe_components.push(self.metric_dropdown);

        self.metric = ko.pureComputed(() => {
            return self.metric_dropdown.selected();
        });
    }

    self.metric_label = ko.pureComputed(() => {
        let metric = self.metric();

        if (metric && metric.label) {
            return metric.label;
        }

        return '';
    });

    self.chart = self.new_instance(TimeseriesChart, {
        id: 'chart',
        dependencies: [self.get_id()],
        formatter: function(value) {
            let metric = self.metric();

            if (metric && metric.format) {
                let formatter = Formatters.gen_formatter(metric);

                return formatter(value);
            }

            return value;
        },
        data: ko.computed(() => {
            let data = self.data();
            let metric = self.metric();

            if (data && metric && metric.value && data[metric.value]) {
                return data[metric.value];
            }
        }),
        exporting: true,
    });

    self.when(...self.maybe_components, self.chart).done(() => {
        _dfd.resolve();
    });

    return self;
}
