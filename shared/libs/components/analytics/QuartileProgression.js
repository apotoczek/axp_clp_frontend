/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    const QUARTILES = ['q1', 'q2', 'q3'];

    self.format_for_metric = function(metric) {
        if (['tvpi', 'rvpi', 'dpi'].indexOf(metric) > -1) {
            return 'multiple';
        }
        return 'percent';
    };

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;
    self.base_query = opts.base_query;

    self.template = opts.template || 'tpl_market_insights_body';

    self.datasource = self.new_instance(DataSource, {
        auto_get_data: self._auto_get_data,
        datasource: {
            type: 'dynamic',
            query: {
                ...self.base_query,
                target: 'vehicle:quartile_progression',
                inverse_quartiles: true,
            },
        },
    });

    self.set_auto_get_data = value => {
        self.datasource.set_auto_get_data(value);
    };

    self.chart = {
        id: 'chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart_box',
        component: GroupedBarChart,
        label: 'Quartile Progression',
        label_in_chart: true,
        format: 'inverse_quartile',
        y_min: 0.5,
        y_max: 4,
        allowDecimals: false,
        shared_tooltip: true,
        exporting: true,
        data: self.datasource.data,
    };

    self.table = {
        id: 'table',
        label: 'Quartile Progression',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            let rows = [];

            if (data && data.groups && data.metrics && data.metrics.length > 0) {
                for (let group of data.groups) {
                    let row = {
                        quarter: group,
                    };

                    for (let metric of data.metrics) {
                        row[metric.name] = metric.data[group];
                    }

                    rows.push(row);
                }
            }

            return rows;
        }),
        columns: [
            {
                key: 'quarter',
                label: 'Quarter',
            },
        ],
        dynamic_columns: {
            data: ko.pureComputed(() => {
                let data = self.datasource.data();
                let columns = [];

                if (data && data.metrics) {
                    for (let metric of data.metrics) {
                        columns.push({
                            key: metric.name,
                            label: metric.name,
                            format: 'inverse_quartile',
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

    self.stats_table = {
        id: 'stats_table',
        label: 'Benchmark Stats',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        data: ko.computed(() => {
            let data = self.datasource.data();
            let rows = [];

            if (data && data.stats) {
                for (let stats of data.stats) {
                    let row = {
                        date: stats.date,
                        quarter: stats.group,
                        count: stats.count,
                    };

                    for (let [metric, boxplot] of Object.entries(stats.boxplots)) {
                        if (boxplot) {
                            for (let q of QUARTILES) {
                                row[`${metric}_${q}`] = boxplot[q];
                            }
                        }
                    }

                    for (let [metric, value] of Object.entries(stats.values)) {
                        row[metric] = value;
                    }

                    rows.push(row);
                }
            }

            return rows;
        }),
        dynamic_columns: {
            data: ko.pureComputed(() => {
                let data = self.datasource.data();
                let columns = [];

                if (data && data.metrics) {
                    for (let metric of data.metrics) {
                        let format = self.format_for_metric(metric.key);

                        columns.push({
                            key: metric.key,
                            label: metric.name,
                            format: format,
                        });

                        for (let q of QUARTILES) {
                            columns.push({
                                key: `${metric.key}_${q}`,
                                label: `${metric.name} ${q.toUpperCase()}`,
                                format: format,
                            });
                        }
                    }
                }

                return columns;
            }),
        },
        columns: [
            {
                key: 'quarter',
                label: 'Quarter',
            },
            {
                key: 'date',
                label: 'Date',
                format: 'backend_date',
            },
            {
                key: 'count',
                label: 'Count',
                format: 'number',
            },
        ],
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
            body: ['chart', 'table', 'stats_table'],
        },
        components: [self.chart, self.table, self.stats_table],
    });

    self.when(self.body).done(() => {
        // Observer.register(self.reset_event, function() {
        //     self.reset();
        // });

        _dfd.resolve();
    });

    return self;
}
