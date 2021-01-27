import DataTable from 'src/libs/components/basic/DataTable';
import BarChart from 'src/libs/components/charts/BarChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ko from 'knockout';
import Context from 'src/libs/Context';
import Customizations from 'src/libs/Customizations';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Aside from 'src/libs/components/basic/Aside';

class MetricsHelper extends Context {
    static gen_page_config({id, components, template = 'tpl_aside_body', auto_get_data = false}) {
        return {
            id: id,
            component: Aside,
            template: template,
            auto_get_data: auto_get_data,
            layout: {
                body: ['group_by', 'chart_wrapper', 'table_wrapper'],
            },
            components: components,
        };
    }

    static gen_wrapper_config({
        id,
        components = [],
        active_component = 'ungrouped',
        set_active_event,
    }) {
        return {
            id: id,
            component: DynamicWrapper,
            set_active_event: set_active_event,
            active_component: active_component,
            layout: {
                body: components.map(c => c.id),
            },
            components: components,
        };
    }

    static get_datasource({
        target,
        period_event,
        client_event,
        user_event,
        group_by,
        group_by_event,
        order_by,
        order_by_event,
        results_per_page,
    }) {
        let result = {
            type: 'dynamic',
            query: {
                target: target,
                time_period: {
                    type: 'observer',
                    event_type: period_event,
                    required: false,
                },
                client_uid: {
                    type: 'observer',
                    event_type: client_event,
                    required: false,
                },
                user_uid: {
                    type: 'observer',
                    event_type: user_event,
                    required: false,
                },
                results_per_page: results_per_page,
            },
        };

        if (group_by_event) {
            result.query['group_by'] = {
                type: 'observer',
                event_type: group_by_event,
                required: !!group_by_event,
            };
        } else if (group_by) {
            result.query['group_by'] = group_by;
        }

        if (order_by_event) {
            result.query['order_by'] = {
                type: 'observer',
                event_type: order_by_event,
                required: !!order_by_event,
            };
        } else if (order_by) {
            result.query['order_by'] = order_by;
        }

        return result;
    }

    static get_columns_from_keys(keys) {
        let naString = '<span class="text-muted">N/A</span>';
        let naReport = '<span class="text-muted">Report Deleted</span>';

        let key_to_column = {
            user_email: {
                label: 'User',
                disable_sorting: true,
                format: 'contextual_link',
                format_args: {
                    url: 'metrics/user/<user_uid>',
                    label_key: 'user_email',
                },
            },
            email: {
                label: 'User',
                disable_sorting: true,
                format: 'contextual_link',
                format_args: {
                    url: 'metrics/user/<uid>',
                    label_key: 'email',
                },
            },
            client_name: {
                label: 'Client',
                disable_sorting: true,
                format: 'contextual_link',
                format_args: {
                    url: 'metrics/client/<client_uid>',
                    label_key: 'client_name',
                },
            },
            name: {
                label: 'Name',
                key: 'name',
            },
            date: {
                label: 'Date',
                key: 'date',
                format: 'date',
            },
            last_page: {
                label: 'Last Page Visited',
                key: 'last_page',
                disable_sorting: true,
            },
            report_name: {
                label: 'Report Name',
                key: 'name',
                disable_sorting: true,
            },
            report_count: {
                label: 'Num. of Reports',
                key: 'count',
            },
            report_type: {
                label: 'Report Type',
                key: 'type',
                disable_sorting: true,
                formatter: d => (d ? d.titleize() : naReport),
            },
            last_report_run_date: {
                label: 'Date of Last Report',
                key: 'last_report_run_date',
                format: 'date',
            },
            report_run_date: {
                label: 'Report Date',
                key: 'run_date',
                format: 'date',
            },
            date_exported: {
                label: 'Export Date',
                key: 'date_exported',
                format: 'date',
            },
            export_type: {
                label: 'Type of Export',
                key: 'type',
                formatter: d => (d ? d.toUpperCase() : naString),
            },
            export_count: {
                label: 'Num. of Exports',
                key: 'count',
            },
            page_of_origin: {
                label: 'Page of Origin',
                key: 'page_of_origin',
                disable_sorting: true,
            },
            length_of_session: {
                label: 'Length of Session',
                key: 'length_of_session',
                formatter: d => {
                    if (Utils.is_set(d)) {
                        if (d == 0) {
                            return '0 - 30 seconds';
                        }
                        return (d * 1000).duration();
                    }
                    return naString;
                },
            },
            session_count: {
                label: 'Num. of Sessions',
                key: 'count',
            },
            last_signed_in_user: {
                label: 'User of Last Session',
                key: 'last_signed_in_user',
            },
            last_sign_in: {
                label: 'Last sign in',
                key: 'last_sign_in',
                format: 'date',
            },
            last_sign_in_for_user: {
                label: 'Last sign in',
                key: 'last_sign_in',
                format: 'backend_date',
            },
            sign_in_count: {
                label: '# Sign ins',
                key: 'sign_in_count',
            },
            fund_name: {
                label: 'Fund',
                key: 'fund_name',
                disable_sorting: true,
            },
            upload_type: {
                label: 'Type of Upload',
                key: 'type',
                disable_sorting: true,
            },
            fund_type: {
                label: 'Fund Type',
                key: 'fund_type',
                disable_sorting: true,
            },
            as_of_date: {
                label: 'As of Date',
                key: 'as_of_date',
                format: 'date',
                disable_sorting: true,
            },
            upload_date: {
                label: 'Date of Upload',
                key: 'upload_date',
                format: 'date',
            },
            upload_count: {
                label: 'Cash Flows Updated',
                key: 'count',
            },
        };

        return keys.map(key => key_to_column[key]);
    }

    static get_timeseries_config({series_name, auto_get_data = false}) {
        return {
            component: TimeseriesChart,
            height: 450,
            auto_get_data: auto_get_data,
            series: [
                {
                    type: 'column',
                    color: Customizations.get_color('eighth'),
                    name: series_name,
                },
            ],
            shared_tooltip: true,
            allow_decimals: false,
            animation: true,
        };
    }

    static get_barchart_config({auto_get_data = false}) {
        return {
            component: BarChart,
            allow_decimals: false,
            animation: true,
            auto_get_data: auto_get_data,
            vertical_bars: true,
            height: 450,
            label: null,
        };
    }

    static get_datatable_config({auto_get_data = false}) {
        return {
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            auto_get_data: auto_get_data,
            results_per_page: 20,
        };
    }

    static get_period_datatable_config(active_group) {
        return Object.assign(this.get_datatable_config({}), {
            id: 'by_period',
            label: ko.pureComputed(
                () => `Sessions grouped by ${active_group() ? active_group() : 'interval'}`,
            ),
            columns: [
                {
                    key: 0,
                    label: 'Period',
                    formatter: time => this.period_formatter(time, active_group()),
                    sort_key: 'period',
                },
                {key: 1, label: 'Num. of Sessions', sort_key: 'count'},
            ],
        });
    }

    static period_formatter(timestamp, active_group) {
        let date = new Date(timestamp).getTime() / 1000;

        if (active_group == 'week') {
            let weekStart = Formatters.backend_date_month_day(date);
            let weekEnd = Formatters.backend_date(new Date(timestamp).addDays(6).getTime() / 1000);
            return `${weekStart} - ${weekEnd}`;
        }

        if (active_group == 'month') {
            return Formatters.backend_month(date);
        }

        if (active_group == 'quarter') {
            return Formatters.backend_date_quarterly(date);
        }

        if (active_group == 'year') {
            return Formatters.backend_date_year(date);
        }

        return '<span class="text-muted">N/A</span>';
    }

    static group_by_period_dropdown_config(active_group) {
        return {
            label: ko.pureComputed(() => `Group by ${(active_group() || 'Period').titleize()}`),
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
        };
    }
}

export default MetricsHelper;
