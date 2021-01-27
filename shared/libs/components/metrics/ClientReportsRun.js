import Radiolist from 'src/libs/components/basic/Radiolist';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetricsHelper from 'src/libs/MetricsHelper';

class ClientReportsRun extends BaseComponent {
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

        this.auto_get_data = true;

        let chart = this.gen_chart_config();
        let by_report_type_chart = this.gen_by_report_type_chart_config();
        let by_user_chart = this.gen_by_user_chart_config();
        let by_period_chart = this.gen_by_period_chart_config();

        let table = this.gen_table_config();
        let by_report_type_table = this.gen_by_report_type_table_config();
        let by_user_table = this.gen_by_user_table_config();
        let by_period_table = this.gen_by_period_table_config();

        let chart_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'chart_wrapper',
            set_active_event: this.group_by_event,
            components: [chart, by_report_type_chart, by_user_chart, by_period_chart],
        });

        let table_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'table_wrapper',
            set_active_event: this.group_by_event,
            components: [table, by_report_type_table, by_user_table, by_period_table],
        });

        let group_by = this.gen_group_by_config();

        this.configs = {
            chart_wrapper: chart_wrapper,
            table_wrapper: table_wrapper,
            group_by: group_by,
        };

        this.page = MetricsHelper.gen_page_config({
            id: 'reports_run',
            auto_get_data: true,
            components: [group_by, chart_wrapper, table_wrapper],
        });

        Observer.register(this.events.get('group_by'), payload => {
            this.active_group(payload.group_by == 'by_period' ? payload.period : null);
        });
    }

    gen_chart_config() {
        return {
            ...MetricsHelper.get_timeseries_config({
                series_name: 'Reports Run',
                auto_get_data: true,
            }),
            id: 'ungrouped',
            zoom_event: this.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'day',
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'ungrouped',
            label: 'Reports run',
            columns: MetricsHelper.get_columns_from_keys([
                'report_name',
                'report_type',
                'report_run_date',
            ]),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_report_type_chart_config() {
        return {
            ...MetricsHelper.get_barchart_config({auto_get_data: true}),
            id: 'by_report_type',
            value_key: 'count',
            label_key: 'type',
            label_format: 'titleize',
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'report_type',
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_report_type_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'by_report_type',
            label: 'Reports run grouped by type',
            columns: MetricsHelper.get_columns_from_keys(['report_type', 'report_count']),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'report_type',
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_user_chart_config() {
        return {
            ...MetricsHelper.get_barchart_config({auto_get_data: true}),
            id: 'by_user',
            value_key: 'count',
            label_key: 'user_email',
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'user',
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_user_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'by_user',
            label: 'Reports run grouped by type',
            columns: MetricsHelper.get_columns_from_keys(['user_email', 'report_count']),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                period_event: this.page_events.get('time_period_changed'),
                group_by: 'user',
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_period_chart_config() {
        return {
            ...MetricsHelper.get_timeseries_config({
                series_name: 'Reports Run',
                auto_get_data: true,
            }),
            id: 'by_period',
            x_formatter: time => MetricsHelper.period_formatter(time, this.active_group.peek()),
            x_units: () =>
                this.active_group.peek() == 'week' ? [['week', [1, 2, 3, 4]]] : undefined,
            zoom_event: this.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                client_event: this.page_events.get('client_changed'),
                period_event: this.page_events.get('time_period_changed'),
                group_by_event: this.period_event,
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_by_period_table_config() {
        return {
            ...MetricsHelper.get_period_datatable_config(this.active_group),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:reports_run',
                client_event: this.page_events.get('client_changed'),
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
            data: [
                {label: 'Ungrouped', value: {group_by: 'ungrouped'}},
                {label: 'Group by Report Type', value: {group_by: 'by_report_type'}},
                {label: 'Group by User', value: {group_by: 'by_user'}},
                MetricsHelper.group_by_period_dropdown_config(this.active_group),
            ],
        };
    }
}

export default ClientReportsRun;
