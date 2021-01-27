/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

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
                target: 'vehicle:pme_progression',
                date_multiplier: 1000,
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
        component: TimeseriesChart,
        title: 'PME Progression',
        format: 'percent',
        shared_tooltip: true,
        exporting: true,
        series: [
            {
                key: 'vehicle_irrs',
                type: 'line',
            },
            {
                key: 'irrs',
                type: 'line',
            },
        ],
        data: self.datasource.data,
    };

    self.stats_table = {
        id: 'stats_table',
        label: 'Statistics',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        data: ko.computed(() => {
            let data = self.datasource.data();
            let rows = [];

            if (data && data.diff_stats) {
                for (let [index_name, stats] of Object.entries(data.diff_stats)) {
                    let row = {...stats};

                    row.index = index_name;

                    rows.push(row);
                }
            }

            return rows;
        }),
        columns: [
            {
                key: 'index',
                label: 'Index',
            },
            {
                key: 'min',
                label: 'Min Diff',
                format: 'percent_highlight_delta',
            },
            {
                key: 'max',
                label: 'Max Diff',
                format: 'percent_highlight_delta',
            },
            {
                key: 'mean',
                label: 'Avg Diff',
                format: 'percent_highlight_delta',
            },
            {
                key: 'median',
                label: 'Median Diff',
                format: 'percent_highlight_delta',
            },
        ],
        results_per_page: 15,
        css: {'table-light': true, 'table-sm': true},
    };

    self.table = {
        id: 'table',
        label: 'All Dates',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        inline_data: true,
        data: ko.computed(() => {
            let data = self.datasource.data();

            if (data && data.vehicle_irrs && data.irrs && data.diffs) {
                let by_date = {};

                for (let [vehicle_name, metrics] of Object.entries(data.vehicle_irrs)) {
                    for (let [date, value] of metrics) {
                        if (by_date[date] === undefined) {
                            by_date[date] = {
                                date: date,
                            };
                        }

                        by_date[date][vehicle_name] = value;
                    }
                }

                for (let [index_name, metrics] of Object.entries(data.irrs)) {
                    for (let [date, value] of metrics) {
                        if (by_date[date] === undefined) {
                            by_date[date] = {
                                date: date,
                            };
                        }

                        by_date[date][index_name] = value;
                    }

                    let diffs = data.diffs[index_name] || [];

                    for (let [date, value] of diffs) {
                        if (by_date[date] === undefined) {
                            by_date[date] = {
                                date: date,
                            };
                        }

                        by_date[date][`${index_name} Diff`] = value;
                    }
                }

                let rows = Object.values(by_date);

                rows.sort((a, b) => a.date - b.date);

                return rows;
            }

            return [];
        }),
        dynamic_columns: [
            {
                data: ko.computed(() => {
                    let data = self.datasource.data();
                    let columns = [];

                    if (data && data.vehicle_irrs && data.irrs && data.diffs) {
                        let entities = Object.keys(data.vehicle_irrs).concat(
                            Object.keys(data.irrs),
                        );

                        for (let entity_name of entities) {
                            columns.push({
                                label: entity_name,
                                key: entity_name,
                                format: 'percent',
                            });

                            if (data.diffs[entity_name]) {
                                let key = `${entity_name} Diff`;

                                columns.push({
                                    label: key,
                                    key: key,
                                    format: 'percent_highlight_delta',
                                });
                            }
                        }
                    }

                    return columns;
                }),
            },
        ],
        columns: [
            {
                key: 'date',
                label: 'Date',
                format: 'date',
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
            body: ['chart', 'stats_table', 'table'],
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
