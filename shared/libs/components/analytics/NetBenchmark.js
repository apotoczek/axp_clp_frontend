import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MultipleBenchmarkChart from 'src/libs/components/charts/MultipleBenchmarkChart';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default class NetBenchmark extends BaseComponent {
    constructor(opts, components) {
        super(Object.assign({}, opts, {get_user: true}), components);

        this.define_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading overview..</h1>
            </div>

            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->

            <!-- ko if: !loading() && !error() && data() -->
            <div data-bind="attr: { id: html_id() }">
                <!-- ko renderComponent: benchmark_chart --><!-- /ko -->
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>

            <!-- /ko -->
        `);

        this.metric_filter_event = opts.metric_filter_event;
        this.results_per_page_event = opts.results_per_page_event;
        this.metric = ko.observable();

        if (this.metric_filter_event) {
            Observer.register(this.metric_filter_event, metric => {
                this.metric(Utils.get(metric, 'value') || 'irr');
            });
        }

        this.benchmark_chart = this.new_instance(MultipleBenchmarkChart, {
            id: 'benchmark_chart',
            template: 'tpl_chart_box',
            exporting: true,
            // chart_click_callback: self.chart_click_callback,
            label: 'Benchmark Chart',
            default_metric: 'irr',
            metric_event: this.metric_filter_event,
            data: this.data,
        });

        this.table = this.new_instance(DataTable, {
            id: 'table',
            css: {'table-light': true, 'table-sm': true},
            results_per_page_event: this.results_per_page_event,
            label: 'Funds',
            enable_csv_export: true,
            inline_data: true,
            columns: [
                {
                    key: 'name',
                    label: 'Name',
                },
                {
                    key: 'vintage_year',
                    label: 'Vintage Year',
                },
            ],
            dynamic_columns: {
                data: ko.pureComputed(() => {
                    const metric = this.metric();
                    const format = metric == 'irr' ? 'percent' : 'multiple';
                    const label = metric ? metric.toUpperCase() : 'percent';

                    const columns = [
                        {
                            key: metric,
                            label: label,
                            format: format,
                        },
                        {
                            key: `${metric}_quartile`,
                            label: 'Quartile',
                        },
                        {
                            key: `benchmark_quartiles:${metric}:q1`,
                            label: 'Q1',
                            format: format,
                        },
                        {
                            key: `benchmark_quartiles:${metric}:q2`,
                            label: 'Q2',
                            format: format,
                        },
                        {
                            key: `benchmark_quartiles:${metric}:q3`,
                            label: 'Q3',
                            format: format,
                        },
                        {
                            key: 'geography',
                            label: 'Geography',
                        },
                        {
                            key: 'sector',
                            label: 'Sector',
                        },
                        {
                            key: 'style_focus',
                            label: 'Style / Focus',
                        },
                    ];

                    return columns;
                }),
            },
            data: ko.pureComputed(() => {
                const data = this.data();
                if (data) {
                    return data['table_data'];
                }
            }),
        });
    }
}
