/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Radiolist from 'src/libs/components/basic/Radiolist';
import MetricsHelper from 'src/libs/MetricsHelper';
import * as Formatters from 'src/libs/Formatters';
import 'src/libs/DateRangePickerBinding';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let dfd = self.new_deferred();

    self.define_default_template(`
        <div data-bind="renderComponent: time_period_selection" style="margin-top:20px;"></div>
        <div data-bind="renderComponent: metric_selection"></div>
    `);

    self.define_template(
        'per_client_page',
        `
        <div data-bind="renderComponent: time_period_selection" style="margin-top:20px;"></div>
        <div style="width:811px; margin:0px auto;"data-bind="foreach:meta_metrics">

            <div style="display:inline-block; width:200px; padding:10px; text-align:center;">
            <h1 data-bind="text:count" class="metric-value"></h1>
            <h4 data-bind="text:name" class="metric-label"></h4>
            </div>

        </div>
    `,
    );

    let events = self.new_instance(EventRegistry, {});
    events.resolve_and_add('time_period_changed', 'Radiolist.selected');
    events.resolve_and_add('metric_changed', 'Radiolist.selected');

    self.user_event = opts.user_event;
    self.client_event = opts.client_event;
    self.time_period_event = opts.time_period_event;
    self.metric_event = opts.metric_event;
    self.chart_selection_event = opts.chart_selection_event;

    self.default_time_period = opts.default_time_period || 'all_time';
    self.default_metric = opts.default_metric;

    let start = ko.observable();
    let end = ko.observable();
    let customDateLabel = ko.pureComputed(() => {
        let startValue = ko.utils.unwrapObservable(start);
        let endValue = ko.utils.unwrapObservable(end);
        if (startValue && endValue) {
            let formattedStart = Formatters.backend_date(startValue);
            let formattedEnd = Formatters.backend_date(endValue);
            return `${formattedStart} - ${formattedEnd}`;
        }
        return 'Custom';
    });

    self.datePicker = {
        start: start,
        end: end,
        label: customDateLabel,
        opens: 'center',
    };

    self.time_period_selection = self.new_instance(Radiolist, {
        id: 'time_period_selection',
        id_callback: events.register_alias('time_period_changed'),
        active_template: 'button_group',
        default_selected_value: self.default_time_period,
        data: [
            {label: 'Past Week', value: 'week'},
            {label: 'Past Month', value: 'month'},
            {label: 'Past Quarter', value: 'quarter'},
            {label: 'Past Year', value: 'year'},
            {label: 'All Time', value: 'all_time'},
            {
                label: customDateLabel,
                value: 'custom',
                dateRangePickerConfig: self.datePicker,
                type: 'dateRangePicker',
            },
        ],
    });

    self.metric_selection = self.new_instance(Radiolist, {
        id: 'metric_selection',
        id_callback: events.register_alias('metric_changed'),
        value_key: 'key',
        active_template: 'metric_selection',
        default_selected_value: self.default_metric,
        datasource: MetricsHelper.get_datasource({
            target: 'commander:metrics_summary',
            period_event: self.time_period_event,
            user_event: self.user_event,
            client_event: self.client_event,
        }),
    });

    self.when(self.time_period_selection, self.metric_selection).done(() => {
        Observer.register(self.chart_selection_event, time_period => {
            start(time_period.start);
            end(time_period.end);
            self.time_period_selection._selected('custom');
        });

        let range = ko.pureComputed(() => ({start: start(), end: end()}));
        range.subscribe(newRange => {
            Observer.broadcast(self.time_period_event, newRange);
        });

        self.meta_metrics = ko.computed(() => {
            let raw = self.metric_selection.options();
            return raw;
        });

        Observer.register(events.get('time_period_changed'), time_period => {
            if (time_period === 'custom') {
                return;
            }

            start(undefined);
            end(undefined);
            Observer.broadcast(self.time_period_event, time_period);
        });

        Observer.register(events.get('metric_changed'), metric => {
            Observer.broadcast(self.metric_event, metric);
        });

        Observer.register(self.metric_event, metric => {
            if (self.metric_selection._selected() != metric) {
                self.metric_selection._selected(metric);
            }
        });

        dfd.resolve();
    });

    return self;
}
