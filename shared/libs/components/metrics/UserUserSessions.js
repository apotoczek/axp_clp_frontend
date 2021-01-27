/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Radiolist from 'src/libs/components/basic/Radiolist';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ko from 'knockout';
import MetricsHelper from 'src/libs/MetricsHelper';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.page_events = opts.events;

    let events = self.new_instance(EventRegistry, {});
    events.resolve_and_add('group_by', 'Radiolist.selected');

    self.active_group = ko.observable();
    let group_by_event = Observer.map(events.get('group_by'), p => p.group_by);
    let period_event = Observer.map(events.get('group_by'), p =>
        p && p.group_by == 'by_period' ? p.period : undefined,
    );

    let chart = Object.assign(MetricsHelper.get_timeseries_config({series_name: 'Sessions'}), {
        id: 'ungrouped',
        zoom_event: self.page_events.get('chart_selection'),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:user_sessions',
            period_event: self.page_events.get('time_period_changed'),
            user_event: self.page_events.get('user_changed'),
            group_by: 'day',
            order_by: [{name: 'period', sort: 'asc'}],
        }),
    });

    let by_period_chart = Object.assign(
        MetricsHelper.get_timeseries_config({series_name: 'Sessions'}),
        {
            id: 'by_period',
            zoom_event: self.page_events.get('chart_selection'),
            x_formatter: time => {
                return MetricsHelper.period_formatter(time, self.active_group.peek());
            },
            x_units: () => {
                if (self.active_group.peek() == 'week') {
                    return [['week', [1, 2, 3, 4]]];
                }
                return undefined;
            },
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                user_event: self.page_events.get('user_changed'),
                period_event: self.page_events.get('time_period_changed'),
                group_by_event: period_event,
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        },
    );

    let chart_wrapper = {
        id: 'chart_wrapper',
        component: DynamicWrapper,
        set_active_event: group_by_event,
        active_component: 'ungrouped',
        layout: {
            body: ['ungrouped', 'by_period'],
        },
        components: [chart, by_period_chart],
    };

    let table = Object.assign(MetricsHelper.get_datatable_config({}), {
        id: 'ungrouped',
        label: 'Sessions',
        columns: MetricsHelper.get_columns_from_keys([
            'date',
            'length_of_session',
            'last_page',
            'client_name',
        ]),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:user_sessions',
            period_event: self.page_events.get('time_period_changed'),
            user_event: self.page_events.get('user_changed'),
        }),
    });

    let by_period_table = Object.assign(MetricsHelper.get_datatable_config({}), {
        id: 'by_period',
        label: ko.pureComputed(
            () =>
                `Sessions grouped by
                ${self.active_group() ? self.active_group() : 'interval'}`,
        ),
        columns: [
            {
                key: 0,
                label: 'Period',
                formatter: time => MetricsHelper.period_formatter(time, self.active_group()),
                sort_key: 'period',
            },
            {key: 1, label: 'Num. of Sessions', sort_key: 'count'},
        ],
        datasource: MetricsHelper.get_datasource({
            target: 'commander:user_sessions',
            user_event: self.page_events.get('user_changed'),
            period_event: self.page_events.get('time_period_changed'),
            group_by_event: period_event,
            order_by: [{name: 'period', sort: 'desc'}],
        }),
    });

    let table_wrapper = {
        id: 'table_wrapper',
        component: DynamicWrapper,
        set_active_event: group_by_event,
        active_component: 'ungrouped',
        layout: {
            body: ['ungrouped', 'by_period'],
        },
        components: [table, by_period_table],
    };

    let group_by = {
        id: 'group_by',
        id_callback: events.register_alias('group_by'),
        component: Radiolist,
        active_template: 'button_group',
        selection_comparator: (l, r) => l && r && l.group_by === r.group_by,
        data: [
            {label: 'Ungrouped', value: {group_by: 'ungrouped'}},
            {
                label: ko.pureComputed(
                    () => `Group by ${self.active_group() || 'Period'.titleize()}`,
                ),
                type: 'dropdown',
                items: [
                    {
                        label: 'Week',
                        value: {group_by: 'by_period', period: 'week'},
                    },
                    {
                        label: 'Month',
                        value: {group_by: 'by_period', period: 'month'},
                    },
                    {
                        label: 'Quarter',
                        value: {group_by: 'by_period', period: 'quarter'},
                    },
                    {
                        label: 'Year',
                        value: {group_by: 'by_period', period: 'year'},
                    },
                ],
            },
        ],
    };

    self.page = {
        id: 'user_sessions',
        template: 'tpl_aside_body',
        auto_get_data: false,
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
