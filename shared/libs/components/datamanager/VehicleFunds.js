/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import PortfolioFundsManagerModal from 'src/libs/components/modals/PortfolioFundsManagerModal';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
            <p class="text-left lead">
           To bulk edit your Funds, download the spreadsheet.<br>
           Once you're done, upload it and Cobalt will update your entities accordingly.<br>
            </p>
        </div>
        <!-- ko renderComponent: portfolio_table --><!-- /ko -->
    `);

    self.show_modal_event = opts.show_modal_event;
    self.table_filter_conf = opts.table_filter_conf;
    self.results_per_page_event = opts.results_per_page_event;

    self.cashflow_type = opts.cashflow_type || 'net';

    self.vehicle_uid_event = opts.vehicle_uid_event || {};

    self.portfolio_table = self.new_instance(DataTable, {
        component: DataTable,
        label: 'Funds in Portfolio',
        id: 'table',
        enable_selection: true,
        enable_csv_export: false,
        enable_clear_order: true,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 15,
        results_per_page_event: self.results_per_page_event,
        empty_template: 'tpl_data_table_empty_no_data',
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                format: 'contextual_link_with_exclude',
                format_args: {
                    url: 'data-manager/vehicles/fund/<uf_type>/<uid>',
                    label_key: 'name',
                    exclude: fund => !fund.write,
                },
            },
            {
                label: 'Type',
                sort_key: 'is_bison_fund',
                formatter: f => (f.is_bison_fund ? 'Bison Fund' : 'Fund'),
            },
            {
                label: 'Commitment',
                sort_key: 'commitment',
                type: 'numeric',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency_symbol',
                    value_key: 'commitment',
                },
            },
            {
                label: 'Unfunded',
                sort_key: 'unfunded',
                type: 'numeric',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency_symbol',
                    value_key: 'unfunded',
                },
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
            },
            {
                label: 'Currency',
                key: 'base_currency_symbol',
                sort_key: 'base_currency_id',
            },
            {
                label: 'Default PME Index',
                key: 'market_name',
                sort_key: 'market_id',
            },
        ],
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
                    relative: 'Type',
                },
            },
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        entity_uid: {
                            type: 'observer',
                            event_type: self.vehicle_uid_event,
                            required: true,
                        },
                        entity_type: 'portfolio',
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:funds_with_characteristics',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                filters: self.table_filter_conf,
            },
        },
    });

    self.add_vehicles_modal = self.new_instance(PortfolioFundsManagerModal, {
        vehicle_uid_event: self.vehicle_uid_event,
        cashflow_type: self.cashflow_type,
    });

    self.when(self.portfolio_table, self.add_vehicles_modal).done(() => {
        Observer.register(self.show_modal_event, () => {
            self.add_vehicles_modal.show();
        });

        _dfd.resolve();
    });

    return self;
}
