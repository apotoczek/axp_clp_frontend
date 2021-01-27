/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ScoringChart from 'src/libs/components/charts/ScoringChart';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
                <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
            <div data-bind="attr: { id: html_id() }">
                <div class="component-box">
                    <!-- ko renderComponent: chart --><!--/ko -->
                    <!-- ko template: {
                        name: 'tpl_data_table_standalone_pagination',
                        data: table
                    } --><!--/ko -->
                </div>
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
            <!-- /ko -->
        `);

    self.results_per_page_event = opts.results_per_page_event;

    self.portfolio_uid_event = opts.portfolio_uid_event;

    self.bubble_metric_event = opts.bubble_metric_event;
    self.base_metrics = opts.base_metrics;

    self.toggle_mode = function(mode) {
        if (mode) {
            self.data_mode(mode === 'data');
        } else {
            self.data_mode(!self.data_mode());
        }
    };

    self.set_error = function(return_value, error) {
        self.error(error);
        return return_value;
    };

    self.breakdown_vehicles = ko.computed(() => {
        let data = self.data();

        if (data && data.items && data.items.length > 0) {
            return self.set_error(data.items);
        }

        return self.set_error([], 'no_group_values');
    });

    if (opts.register_export_event) {
        let export_csv_event = Utils.gen_event('AnalyticsPortfolioFunds.export', self.get_id());

        Observer.broadcast(
            opts.register_export_event,
            {
                title: 'Table',
                subtitle: 'CSV',
                type: 'Allocations',
                event_type: export_csv_event,
            },
            true,
        );

        Observer.register(export_csv_event, () => {
            self.table.export_csv();
        });
    }

    self.render_currency = ko.pureComputed(() => {
        let data = self.data();
        if (data) {
            return data['render_currency'];
        }
    });

    self.table_metrics = [
        {key: 'name', label: 'Name'},
        ...self.base_metrics,
        {
            label: 'Vintage',
            key: 'vintage_year',
            format: 'strings',
            type: 'numeric',
        },
        {
            label: 'First Close',
            key: 'first_close',
            first_sort: 'desc',
            format: 'backend_date',
        },
        {
            label: 'As of Date',
            key: 'last_date',
            first_sort: 'desc',
            format: 'backend_date',
        },
    ];

    self.scoring_metrics = self.base_metrics.map(({value, format, format_args, label}) => ({
        value,
        format,
        format_args,
        label,
    }));

    self.scoring_metrics.splice(4, 0, {
        label: 'Loss Ratio',
        value: 'loss_ratio',
        format: 'percent',
    });

    self.table = self.new_instance(DataTable, {
        id: 'table',
        label: ko.computed(() => {
            let data = self.data();
            if (data && data.label) {
                return data.label;
            }

            return 'Funds';
        }),
        inline_data: true,
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_csv_export: true,
        enable_localstorage: true,
        column_toggle_placement: 'left',
        results_per_page: 15,
        results_per_page_event: self.results_per_page_event,
        css: {'table-light': true, 'table-sm': true},
        data: self.breakdown_vehicles,
        loading: self.loading,
        dynamic_columns: [
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        public_taxonomy: true,
                    },
                },
                placement: {
                    position: 'right',
                    relative: 'Name',
                },
            },
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        entity_uid: {
                            type: 'observer',
                            event_type: self.portfolio_uid_event,
                            required: true,
                        },
                        entity_type: 'portfolio',
                    },
                },
                visible: false,
            },
        ],
        columns: self.table_metrics,
    });

    self.chart = self.new_instance(ScoringChart, {
        id: 'chart',
        data: self.table.rows,
        metrics: self.scoring_metrics,
        bubble_metric_event: self.bubble_metric_event,
        render_currency: self.render_currency,
    });

    _dfd.resolve();

    return self;
}
