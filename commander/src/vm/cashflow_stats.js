/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import StringFilter from 'src/libs/components/basic/StringFilter';
import EventButton from 'src/libs/components/basic/EventButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import * as Formatters from 'src/libs/Formatters';

export default function() {
    let self = new Context({
        id: 'cashflow_stats',
    });

    self.dfd = self.new_deferred();

    self.restore_defaults = self.new_instance(EventButton, {
        id: 'clear',
        template: 'tpl_cpanel_button',
        css: {'btn-sm': true, 'btn-default': true},
        label: 'Clear',
    });

    self.filter = self.new_instance(StringFilter, {
        id: 'filter',
        clear_event: Utils.gen_event('EventButton', self.restore_defaults.get_id()),
        component: StringFilter,
        placeholder: 'Filter...',
        enable_localstorage: true,
    });

    self.overview_table = self.new_instance(DataTable, {
        id: 'overview_table',
        css: {'table-light': true, 'table-sm': true},
        label: 'Cashflows Over Time',
        results_per_page: 10,
        inline_data: true,
        columns: [
            {
                label: 'Month',
                key: 'date',
                format: 'backend_month',
                width: '50%',
            },
            {
                key: 'cashflow_count',
                label: 'Cashflow Count',
                format: 'number',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:cashflow_stats_overview',
            },
        },
    });

    self.overview_chart = self.new_instance(TimeseriesChart, {
        id: 'cashflows_overview',
        min: 0,
        colors: [
            '#4D4D4D',
            '#6D83A3',
            '#3A66C3',
            '#3AC376',
            '#C36161',
            '#8547D4',
            '#F95532',
            '#C33A3A',
            '#61C38C',
            '#6180C3',
            '#F97559',
        ],
        series: [
            {
                key: 'cashflow_counts',
                name: '# Cashflows',
                type: 'line',
            },
        ],
        format: 'number',
        x_formatter: Formatters.backend_date,
        data: ko.pureComputed(() => {
            let data = self.overview_table.data();
            if (data) {
                let series = data
                    .map(d => {
                        return [d.date, d.cashflow_count];
                    })
                    .sortBy(a => {
                        return a[0];
                    });

                return {cashflow_counts: series};
            }
        }),
    });

    self.overview_chart.add_dependency(self.overview_table);

    self.client_table = self.new_instance(DataTable, {
        id: 'client_cashflows',
        css: {'table-light': true, 'table-sm': true},
        label: 'Client Cashflows',
        results_per_page: 10,
        columns: [
            {
                label: 'Client',
                sort_key: 'client_name',
                format: 'contextual_link',
                width: '50%',
                format_args: {
                    url: 'clients/<client:uid>',
                    label_key: 'client:name',
                },
            },
            {
                key: 'cashflow_count',
                label: 'Cashflow Count',
                format: 'number',
            },
            {
                key: 'last_quarter_count',
                label: 'Cashflows Last Quarter',
                format: 'number',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:client_cashflows',
                results_per_page: 10,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: Utils.gen_event('StringFilter.value', self.filter.get_id()),
                        },
                    },
                },
            },
        },
    });

    self.client_meta = self.new_instance(MetaInfo, {
        id: 'meta',
        label: 'Clients',
        format: 'visible_count',
        css: {
            'meta-primary': true,
            'match-btn-sm': true,
        },
        datasource: {
            type: 'observer',
            event_type: Utils.gen_event('DataTable.counts', self.client_table.get_id()),
        },
    });

    self.when(
        self.overview_chart,
        self.overview_table,
        self.client_table,
        // self.client_chart
    ).done(() => {
        self.dfd.resolve();
    });

    return self;
}
