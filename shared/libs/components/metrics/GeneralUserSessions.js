import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Observer from 'src/libs/Observer';
import Radiolist from 'src/libs/components/basic/Radiolist';
import MetricsHelper from 'src/libs/MetricsHelper';

class GeneralUserSessions extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.page_events = opts.events;
        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('group_by', 'Radiolist.selected');

        this.active_group = ko.observable();

        this.group_by_event = Observer.map(this.events.get('group_by'), p => p.group_by);
        this.period_event = Observer.map(this.events.get('group_by'), p =>
            p && p.group_by == 'by_period' ? p.period : undefined,
        );

        let chart = this.gen_chart_config();
        let by_client_chart = this.gen_by_client_chart_config();
        let by_period_chart = this.gen_by_period_chart_config();

        let table = this.gen_table_config();
        let by_client_table = this.gen_by_client_table_config();
        let by_period_table = this.gen_by_period_table_config();

        let chart_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'chart_wrapper',
            set_active_event: this.group_by_event,
            components: [chart, by_client_chart, by_period_chart],
        });

        let table_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'table_wrapper',
            set_active_event: this.group_by_event,
            components: [table, by_client_table, by_period_table],
        });

        let group_by = this.gen_group_by_config();

        this.page = MetricsHelper.gen_page_config({
            id: 'user_sessions',
            auto_get_data: false,
            components: [group_by, chart_wrapper, table_wrapper],
        });

        Observer.register(this.events.get('group_by'), payload => {
            this.active_group(payload.group_by == 'by_period' ? payload.period : null);
        });
    }

    gen_chart_config() {
        return {
            ...MetricsHelper.get_timeseries_config({series_name: 'Sessions'}),
            id: 'ungrouped',
            zoom_event: this.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'day',
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_by_client_chart_config() {
        return {
            ...MetricsHelper.get_barchart_config({}),
            id: 'by_client',
            value_key: 'count',
            label_key: 'client_name',
            data_key: 'results',
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'client',
                results_per_page: 20,
            }),
        };
    }

    gen_by_period_chart_config() {
        return {
            ...MetricsHelper.get_timeseries_config({series_name: 'Sessions'}),
            id: 'by_period',
            x_formatter: time => MetricsHelper.period_formatter(time, this.active_group.peek()),
            x_units: () => {
                if (this.active_group.peek() == 'week') {
                    return [['week', [1, 2, 3, 4]]];
                }
            },
            zoom_event: this.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
                group_by_event: this.period_event,
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({}),
            id: 'ungrouped',
            label: 'Sessions',
            columns: MetricsHelper.get_columns_from_keys([
                'user_email',
                'client_name',
                'date',
                'length_of_session',
                'last_page',
            ]),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
            }),
        };
    }

    gen_by_client_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({}),
            id: 'by_client',
            label: 'Sessions grouped by client',
            columns: MetricsHelper.get_columns_from_keys([
                'client_name',
                'session_count',
                'last_sign_in',
                'length_of_session',
            ]),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'client',
            }),
        };
    }

    gen_by_period_table_config() {
        return {
            ...MetricsHelper.get_period_datatable_config(this.active_group),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:user_sessions',
                period_event: this.page_events.get('time_period_changed'),
                group_by_event: this.period_event,
                order_by: [{name: 'period', sort: 'desc'}],
            }),
        };
    }

    gen_group_by_config() {
        return {
            id: 'group_by',
            id_callback: this.events.register_alias('group_by'),
            component: Radiolist,
            active_template: 'button_group',
            selection_comparator: (l, r) => l && r && l.group_by === r.group_by,
            data: [
                {label: 'Ungrouped', value: {group_by: 'ungrouped'}},
                {label: 'Group by Client', value: {group_by: 'by_client'}},
                MetricsHelper.group_by_period_dropdown_config(this.active_group),
            ],
        };
    }
}

export default GeneralUserSessions;
