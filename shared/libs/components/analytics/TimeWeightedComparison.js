/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import ko from 'knockout';
import * as Formatters from 'src/libs/Formatters';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;
    self.base_query = opts.base_query;

    self.template = opts.template || 'tpl_market_insights_body';

    self.formatter = function(value) {
        let formatter = Formatters.gen_formatter(self.format());

        return formatter(value);
    };

    self.datasource = self.new_instance(DataSource, {
        auto_get_data: self._auto_get_data,
        datasource: {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:time_weighted_comparison',
            },
        },
    });

    self.set_auto_get_data = value => {
        self.datasource.set_auto_get_data(value);
    };

    self.chart = {
        id: 'chart',
        template: 'tpl_chart_box',
        dependencies: [self.datasource.get_id()],
        component: GroupedBarChart,
        label: 'Time-Weighted Comparison',
        label_in_chart: true,
        format: 'percent',
        data: self.datasource.data,
    };

    self.table = {
        id: 'table',
        label: 'Peer Set',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        data: ko.computed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.peer_funds;
            }
        }),
        columns: [
            {
                key: 'name',
                label: 'Fund',
            },
            {
                sort_key: 'commitment',
                label: 'Commitment',
                format: 'money',
                format_args: {
                    currency_key: 'render_currency',
                    value_key: 'commitment',
                },
            },
            {
                key: 'vintage_year',
                label: 'Vintage',
            },
            {
                key: 'irr',
                label: 'IRR',
                format: 'irr',
            },
            {
                key: 'tvpi',
                label: 'TVPI',
                format: 'multiple',
            },
            {
                key: 'dpi',
                label: 'DPI',
                format: 'multiple',
            },
            {
                key: 'rvpi',
                label: 'RVPI',
                format: 'multiple',
            },
        ],
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_csv_export: true,
        enable_localstorage: true,
        column_toggle_placement: 'left',
        results_per_page: 15,
        css: {'table-light': true, 'table-sm': true},
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['chart', 'table'],
        },
        components: [self.chart, self.table],
    });

    self.when(self.body).done(() => {
        // Observer.register(self.reset_event, function() {
        //     self.reset();
        // });

        _dfd.resolve();
    });

    return self;
}
