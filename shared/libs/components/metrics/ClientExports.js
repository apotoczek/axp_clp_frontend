import Radiolist from 'src/libs/components/basic/Radiolist';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import MetricsHelper from 'src/libs/MetricsHelper';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class ClientExports extends BaseComponent {
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
        let by_type_chart = this.gen_by_type_chart_config();
        let by_user_chart = this.gen_by_user_chart_config();
        let by_period_chart = this.gen_by_period_chart_config();

        let table = this.gen_table_config();
        let by_type_table = this.gen_by_type_table_config();
        let by_user_table = this.gen_by_user_table_config();
        let by_period_table = this.gen_by_period_table_config();

        let chart_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'chart_wrapper',
            set_active_event: this.group_by_event,
            components: [chart, by_type_chart, by_user_chart, by_period_chart],
        });

        let table_wrapper = MetricsHelper.gen_wrapper_config({
            id: 'table_wrapper',
            set_active_event: this.group_by_event,
            components: [table, by_type_table, by_user_table, by_period_table],
        });

        let group_by = this.gen_group_by_config();

        this.configs = {
            chart_wrapper: chart_wrapper,
            table_wrapper: table_wrapper,
            group_by: group_by,
        };

        this.page = MetricsHelper.gen_page_config({
            id: 'exports',
            auto_get_data: true,
            components: [group_by, chart_wrapper, table_wrapper],
        });

        Observer.register(this.events.get('group_by'), payload => {
            this.active_group(payload.group_by == 'by_period' ? payload.period : null);
        });
    }

    gen_chart_config() {
        return {
            ...MetricsHelper.get_timeseries_config({series_name: 'Exports', auto_get_data: true}),
            id: 'ungrouped',
            zoom_event: this.page_events.get('chart_selection'),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'day',
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_by_type_chart_config() {
        return {
            ...MetricsHelper.get_barchart_config({auto_get_data: true}),
            id: 'by_type',
            value_key: 'count',
            label_key: 'export_type',
            data_key: 'results',
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'type',
                results_per_page: 20,
            }),
        };
    }

    gen_by_user_chart_config() {
        return {
            ...MetricsHelper.get_barchart_config({auto_get_data: true}),
            id: 'by_user',
            value_key: 'count',
            label_key: 'user_email',
            data_key: 'results',
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'user',
                results_per_page: 20,
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
                target: 'commander:exports',
                client_event: this.page_events.get('client_changed'),
                period_event: this.page_events.get('time_period_changed'),
                group_by_event: this.period_event,
                order_by: [{name: 'period', sort: 'asc'}],
            }),
        };
    }

    gen_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'ungrouped',
            label: 'Exports',
            columns: MetricsHelper.get_columns_from_keys([
                'user_email',
                'client_name',
                'date_exported',
                'export_type',
                'page_of_origin',
            ]),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
            }),
        };
    }

    gen_by_type_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'by_type',
            label: 'Exports grouped by type',
            columns: MetricsHelper.get_columns_from_keys(['export_type', 'export_count']),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'type',
            }),
        };
    }

    gen_by_user_table_config() {
        return {
            ...MetricsHelper.get_datatable_config({auto_get_data: true}),
            id: 'by_user',
            label: 'Exports grouped by user',
            columns: MetricsHelper.get_columns_from_keys([
                'user_email',
                'export_type',
                'export_count',
            ]),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
                period_event: this.page_events.get('time_period_changed'),
                client_event: this.page_events.get('client_changed'),
                group_by: 'user',
            }),
        };
    }

    gen_by_period_table_config() {
        return {
            ...MetricsHelper.get_period_datatable_config(this.active_group),
            datasource: MetricsHelper.get_datasource({
                target: 'commander:exports',
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
                {label: 'Ungrouped', value: {group_by: 'default'}},
                {label: 'Group by Type', value: {group_by: 'by_type'}},
                {label: 'Group by User', value: {group_by: 'by_user'}},
                MetricsHelper.group_by_period_dropdown_config(this.active_group),
            ],
        };
    }
}

export default ClientExports;
