/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BarChart from 'src/libs/components/charts/BarChart';
import DataTable from 'src/libs/components/basic/DataTable';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
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
                    <!-- ko renderComponent: metric_dropdown --><!-- /ko -->
                    <!-- ko renderComponent: chart --><!--/ko -->

                    <!-- ko template: {
                        name: 'tpl_data_table_standalone_pagination',
                        data: table
                    } --><!--/ko -->
                    <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
                        <p class="text-left lead">
                        Value Drivers isolates a component&apos;s impact on the overall portfolio.<br>
                        Negative values indicate that the component is dragging performance down.<br/>
                        Positive values indicate that the component is boosting overall portfolio performance.
                        </p>
                    </div>
                </div>
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
            <!-- /ko -->
        `);

    self.results_per_page_event = opts.results_per_page_event;
    self.breakdown_key_event = opts.breakdown_key_event;

    self.breakdown_key = ko.observable();
    self.breakdown_on = opts.breakdown_on || 'fund';

    self.breakdown_label = ko.pureComputed(() => {
        let key = self.breakdown_key();
        if (key) {
            return `${key.label}`;
        }
        return `${self.breakdown_on.capitalize()}`;
    });

    self.portfolio_uid_event = opts.portfolio_uid_event;

    self.table = self.new_instance(DataTable, {
        id: 'portfolio_components',
        label: self.breakdown_label,
        enable_column_toggle: true,
        enable_clear_order: true,
        enable_csv_export: true,
        enable_localstorage: true,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 15,
        results_per_page_event: self.results_per_page_event,
        template: 'tpl_data_table',
        inline_data: true,
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'IRR',
                format: 'irr',
                key: 'irr',
            },
            {
                label: 'DPI',
                format: 'multiple',
                key: 'dpi',
            },
            {
                label: 'TVPI',
                format: 'multiple',
                key: 'tvpi',
            },
            {
                label: 'RVPI',
                format: 'multiple',
                key: 'rvpi',
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
            },
            {
                label: 'First Close',
                key: 'first_close',
                format: 'backend_date',
            },
            {
                label: 'As of Date',
                key: 'as_of_date',
                format: 'backend_date',
            },
        ],
        data: self.data,
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
    });

    self.metric_dropdown = self.new_instance(NewDropdown, {
        options: [
            {
                label: 'IRR',
                value: 'irr',
                format: 'irr',
            },
            {
                label: 'TVPI',
                value: 'tvpi',
                format: 'multiple',
            },
            {
                label: 'DPI',
                value: 'dpi',
                format: 'multiple',
            },
            {
                label: 'RVPI',
                value: 'rvpi',
                format: 'multiple',
            },
        ],
        default_selected_index: 0,
        min_width: '100px',
        inline: true,
    });

    self.comps = ko.pureComputed(() => {
        let metric_dropdown = self.metric_dropdown.selected();
        let data = self.table.rows();

        let comps = [];

        if (data && metric_dropdown) {
            for (let i = 0, l = data.length; i < l; i++) {
                let comp = {
                    value: data[i][metric_dropdown.value],
                    label: data[i].name,
                };

                comps.push(comp);
            }
        }

        return comps;
    });

    self.chart = self.new_instance(BarChart, {
        template: 'tpl_chart_box',
        exporting: true,
        formatter: function(value) {
            let metric = self.metric_dropdown.selected();
            if (metric && metric.format) {
                let formatter = Formatters.gen_formatter(metric.format);
                return formatter(value);
            }
            return value;
        },
        comps: self.comps,
    });

    if (self.breakdown_key_event) {
        Observer.register(self.breakdown_key_event, event => {
            // Update breakdown label used in datatable header
            if (event && event.length > 0) {
                self.breakdown_key(event[0]);
            } else {
                self.breakdown_key(null);
            }
        });
    }

    return self;
}
