import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import DataTable from 'src/libs/components/basic/DataTable';
import DataSource from 'src/libs/DataSource';

export default class DispersionAnalysis extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.define_template(`
                <div class="big-message" data-bind="visible: loading">
                    <span class="glyphicon glyphicon-cog animate-spin"></span>
                    <h1>Loading..</h1>
                </div>
                <!-- ko if: !loading() && error() && error_template() -->
                    <!-- ko template: error_template --><!-- /ko -->
                <!-- /ko -->
                <!-- ko if: !loading() && !error() -->
                <div data-bind="attr: { id: html_id() }">
                    <!-- ko renderComponent: grouped_chart --><!-- /ko -->
                    <!-- ko renderComponent: table --><!-- /ko -->
                </div>
                <!-- /ko -->
            `);

        this.grouped_dispersion_analysis = opts.grouped_dispersion_analysis;

        this.datasource = this.new_instance(DataSource, {
            datasource: opts.datasource,
        });

        this.grouped_chart = this.new_instance(GroupedBarChart, {
            id: 'ev_multiples_by_company',
            template: 'tpl_chart_box',
            format: 'percent',
            exporting: true,
            data: ko.pureComputed(() => {
                const data = this.datasource.data();
                if (data) {
                    return data['grouped_chart'];
                }
            }),
        });

        const columns = [
            {
                label: 'Invested Capital',
                format: 'money',
                format_args: {
                    currency_key: 'currency_symbol',
                    value_key: 'paid_in',
                },
            },
            {
                key: 'av_paid_in',
                label: '% of Ag.Invested Capital',
                format: 'percent',
            },
            {
                label: 'Total Value',
                format: 'money',
                format_args: {
                    currency_key: 'currency_symbol',
                    value_key: 'total_value',
                },
            },
            {
                key: 'av_total_value',
                label: '% of Ag. Total Value',
                format: 'percent',
            },
            {
                key: 'tvpi',
                label: 'TVPI',
                format: 'multiple',
            },
        ];

        this.table = this.new_instance(DataTable, {
            id: 'ev_multiples_by_company_table',
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_csv_export: true,
            enable_localstorage: true,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 15,
            disable_sorting: true,
            inline_data: true,
            data: ko.pureComputed(() => {
                const data = this.datasource.data();

                if (data) {
                    return data['table'];
                }
            }),
            columns: [
                {
                    key: 'range_name',
                    label: 'Statistic',
                },
            ],
            dynamic_columns: {
                data: ko.pureComputed(() => {
                    const grouped = !this.grouped_dispersion_analysis();

                    return grouped
                        ? [
                              {
                                  key: 'group_metric',
                                  label: 'Group',
                              },
                              ...columns,
                          ]
                        : [
                              {
                                  key: 'number_deals',
                                  label: 'Number of Deals',
                              },
                              ...columns,
                          ];
                }),
            },
        });
    }
}
