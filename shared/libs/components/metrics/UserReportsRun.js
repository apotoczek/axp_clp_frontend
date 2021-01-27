/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Aside from 'src/libs/components/basic/Aside';
import Radiolist from 'src/libs/components/basic/Radiolist';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetricsHelper from 'src/libs/MetricsHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.page_events = opts.events;

    let events = self.new_instance(EventRegistry, {});
    events.resolve_and_add('group_by', 'Radiolist.selected');

    self.active_group = ko.observable();
    let group_by_event = Observer.map(events.get('group_by'), p => p.group_by);
    let period_event = Observer.map(events.get('group_by'), p => {
        return p && p.group_by == 'by_period' ? p.period : undefined;
    });

    let chart = Object.assign(MetricsHelper.get_timeseries_config({series_name: 'Reports'}), {
        id: 'default',
        zoom_event: self.page_events.get('chart_selection'),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:reports_run',
            period_event: self.page_events.get('time_period_changed'),
            user_event: self.page_events.get('user_changed'),
            group_by: 'day',
            order_by: [{name: 'period', sort: 'asc'}],
        }),
    });

    let table = Object.assign(MetricsHelper.get_datatable_config({}), {
        id: 'default',
        label: 'Reports run',
        columns: MetricsHelper.get_columns_from_keys([
            'report_name',
            'report_type',
            'report_run_date',
            'client_name',
        ]),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:reports_run',
            period_event: self.page_events.get('time_period_changed'),
            user_event: self.page_events.get('user_changed'),
        }),
    });

    let by_report_type_chart = Object.assign(MetricsHelper.get_barchart_config({}), {
        id: 'by_report_type',
        value_key: 'count',
        label_key: 'type',
        label: null,
        label_format: 'titleize',
        datasource: MetricsHelper.get_datasource({
            target: 'commander:reports_run',
            period_event: self.page_events.get('time_period_changed'),
            group_by: 'report_type',
            user_event: self.page_events.get('user_changed'),
        }),
    });

    let by_report_type_table = Object.assign(MetricsHelper.get_datatable_config({}), {
        id: 'by_report_type',
        label: 'Reports run grouped by type',
        columns: MetricsHelper.get_columns_from_keys(['report_type', 'report_count']),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:reports_run',
            period_event: self.page_events.get('time_period_changed'),
            group_by: 'report_type',
            user_event: self.page_events.get('user_changed'),
        }),
    });

    let by_period_chart = Object.assign(
        MetricsHelper.get_timeseries_config({series_name: 'Reports Run'}),
        {
            id: 'by_period',
            x_formatter: time => MetricsHelper.period_formatter(time, self.active_group.peek()),
            x_units: () =>
                self.active_group.peek() == 'week' ? [['week', [1, 2, 3, 4]]] : undefined,
            zoom_event: self.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                user_event: self.page_events.get('user_changed'),
                period_event: self.page_events.get('time_period_changed'),
                group_by_event: period_event,
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        },
    );

    let by_period_table = Object.assign(
        MetricsHelper.get_period_datatable_config(self.active_group),
        {
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                user_event: self.page_events.get('user_changed'),
                period_event: self.page_events.get('time_period_changed'),
                group_by_event: period_event,
                order_by: [{name: 'period', sort: 'desc'}],
            }),
        },
    );

    let chart_wrapper = {
        id: 'chart_wrapper',
        component: DynamicWrapper,
        set_active_event: group_by_event,
        active_component: 'default',
        layout: {
            body: ['default', 'by_report_type', 'by_period'],
        },
        components: [chart, by_report_type_chart, by_period_chart],
    };

    let table_wrapper = {
        id: 'table_wrapper',
        component: DynamicWrapper,
        set_active_event: group_by_event,
        active_component: 'default',
        layout: {
            body: ['default', 'by_report_type', 'by_period'],
        },
        components: [table, by_report_type_table, by_period_table],
    };

    let group_by = {
        id: 'group_by',
        id_callback: events.register_alias('group_by'),
        component: Radiolist,
        active_template: 'button_group',
        data: [
            {label: 'Ungrouped', value: {group_by: 'default'}},
            {label: 'Group by Report Type', value: {group_by: 'by_report_type'}},
            MetricsHelper.group_by_period_dropdown_config(self.active_group),
        ],
    };

    self.page = {
        id: 'reports_run',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['group_by', 'chart_wrapper', 'table_wrapper'],
        },
        components: [group_by, chart_wrapper, table_wrapper],
    };

    Observer.register(events.get('group_by'), payload => {
        self.active_group(payload.group_by == 'by_period' ? payload.period : null);
    });

    return self;
}
