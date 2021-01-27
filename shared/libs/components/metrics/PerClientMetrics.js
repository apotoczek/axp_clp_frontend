import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ClientReportsRun from 'src/libs/components/metrics/ClientReportsRun';
import ClientExports from 'src/libs/components/metrics/ClientExports';
import ClientMetricWidget from 'src/libs/components/metrics/ClientMetricWidget';
import ClientMetricsHeader from 'src/libs/components/metrics/ClientMetricsHeader';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Radiolist from 'src/libs/components/basic/Radiolist';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';

class PerClientMetrics extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_template(`
            <div class="aside aside-content">
                <!-- ko if: $data.time_period_controls -->
                    <div data-bind="renderComponent: time_period_controls"></div>
                <!-- /ko -->
                <div data-bind="renderComponent: body"></div>
            </div>
        `);

        this.default_time_period = opts.default_time_period || 'all_time';

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('body_content', 'DynamicWrapper.active_component');
        this.events.resolve_and_add('time_period_changed', 'Radiolist.selected');
        this.events.add({name: 'user_changed', event: opts.user_changed_event, id: false});
        this.events.add({name: 'client_changed', event: opts.client_changed_event, id: false});
        this.events.add({name: 'metric_changed', event: opts.metric_changed_event, id: false});
        this.events.add({name: 'chart_selection', event: opts.chart_selection_event, id: false});

        this.time_period_controls = this.init_time_period_controls();

        let reports_run = new ClientMetricWidget({
            instance: new ClientReportsRun({events: this.events}),
            widget_id: 'reports_run',
            title: 'Reports Run',
        });

        let exports_ = new ClientMetricWidget({
            instance: new ClientExports({events: this.events}),
            widget_id: 'exports',
            title: 'Data Exported',
        });

        this.header_section = new ClientMetricsHeader({
            events: this.events,
            exclude_users_table: true,
        });

        this.body = this.new_instance(Aside, {
            id: 'body_content',
            template: 'tpl_per_client_metrics_dash',
            layout: {
                body: ['reports_run', 'exports'],
            },
            components: [reports_run.widget, exports_.widget],
        });

        this.when(this.body, this.time_period_controls).done(dfd.resolve);
    }

    init_time_period_controls() {
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

        let datePicker = {
            start: start,
            end: end,
            label: customDateLabel,
            opens: 'center',
        };

        let range = ko.pureComputed(() => ({start: start(), end: end()}));

        range.subscribe(newRange => {
            Observer.broadcast(this.events.get('time_period_changed'), newRange);
        });

        return this.new_instance(Radiolist, {
            id: 'time_period_selection',
            id_callback: this.events.register_alias('time_period_changed'),
            active_template: 'button_group',
            default_selected_value: this.default_time_period,
            data: [
                {label: 'Past Week', value: 'week'},
                {label: 'Past Month', value: 'month'},
                {label: 'Past Quarter', value: 'quarter'},
                {label: 'Past Year', value: 'year'},
                {label: 'All Time', value: 'all_time'},
                {
                    label: customDateLabel,
                    value: 'custom',
                    dateRangePickerConfig: datePicker,
                    type: 'dateRangePicker',
                },
            ],
        });
    }
}

export default PerClientMetrics;
