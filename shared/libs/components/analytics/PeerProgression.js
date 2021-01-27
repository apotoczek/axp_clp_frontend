/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;
    self.base_query = opts.base_query;
    self.metric_event = opts.metric_event;
    self.currency_event = opts.currency_event;

    self.template = opts.template || 'tpl_market_insights_body';

    self.format = ko.observable('percent');
    self.currency = ko.observable();

    self.show_cashflow_stats = ko.observable(false);

    Observer.register(self.currency_event, self.currency);

    Observer.register(self.metric_event, metric => {
        switch (metric) {
            case 'tvpi':
            case 'dpi':
            case 'rvpi':
                self.format('multiple');
                self.show_cashflow_stats(false);
                break;
            case 'irr':
                self.format('percent');
                self.show_cashflow_stats(false);
                break;
            case 'net_cashflows':
            case 'scaled_net_cashflows':
                self.format({
                    format: 'money',
                    format_args: {
                        render_currency: self.currency,
                    },
                });
                self.show_cashflow_stats(true);
                break;
        }
    });

    self.formatter = function(value) {
        let formatter = Formatters.gen_formatter(self.format());

        return formatter(value);
    };

    if (self.base_query) {
        self._datasource = {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:peer_progression',
                date_multiplier: 1000,
                min_values: 3,
            },
        };
    } else {
        self._datasource = undefined;
    }

    self.datasource = self.new_instance(DataSource, {
        auto_get_data: self._auto_get_data,
        datasource: self._datasource,
    });

    self.set_auto_get_data = value => {
        self.datasource.set_auto_get_data(value);
    };

    self.chart = {
        id: 'chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        title: 'Peer Progression',
        formatter: self.formatter,
        shared_tooltip: true,
        exporting: true,
        series: [
            {
                key: 'ranges',
                name: 'Peer Range',
                type: 'arearange',
            },
            {
                key: 'median',
                name: 'Peer Median',
                type: 'line',
            },
            {
                key: 'vehicle',
                type: 'line',
            },
        ],
        data: self.datasource.data,
    };

    self.table = {
        id: 'table',
        label: 'Peer Set',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        comp_color: '#61C38C',
        data: ko.computed(() => {
            let data = self.datasource.data();
            if (data && data.funds) {
                return data.funds.filter(fund => {
                    return !fund.is_target;
                });
            }

            return [];
        }),
        comps: ko.computed(() => {
            let data = self.datasource.data();
            if (data && data.funds) {
                return data.funds.filter(fund => {
                    return fund.is_target;
                });
            }

            return [];
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
        dynamic_columns: {
            data: ko.computed(() => {
                let show_cashflow_stats = self.show_cashflow_stats();

                let columns = [];

                if (show_cashflow_stats) {
                    columns.push({
                        key: 'first_date',
                        label: 'First Cashflow',
                        format: 'backend_date',
                    });
                    columns.push({
                        key: 'max_outflow',
                        label: 'Max Outflow',
                        format: 'backend_date',
                    });
                    let thresholds = ['25', '50', '75', '100'];
                    for (let i = 0, l = thresholds.length; i < l; i++) {
                        columns.push({
                            key: `stats:dists_${thresholds[i]}`,
                            label: `${thresholds[i]}% Distributed`,
                            format: 'backend_date',
                        });
                        columns.push({
                            key: `stats:conts_${thresholds[i]}`,
                            label: `${thresholds[i]}% Invested`,
                            format: 'backend_date',
                        });
                    }
                }

                return columns;
            }),
        },
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_csv_export: true,
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

    self.add_dependency(self.datasource);

    self.when(self.datasource, self.body).done(() => {
        // Observer.register(self.reset_event, function() {
        //     self.reset();
        // });

        _dfd.resolve();
    });

    return self;
}
