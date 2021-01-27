/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
            <p class="text-left lead">
        To bulk edit your Deals, download the spreadsheet.<br>
        Once you're done, upload it and Cobalt will update your entities accordingly.<br>
            </p>
        </div>
        <!-- ko renderComponent: table --><!-- /ko -->
    `);

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.tools_menu_id = opts.tools_menu_id;
    self.results_per_page_event = opts.results_per_page_event;
    self.table_filter_conf = opts.table_filter_conf;

    self.table = self.new_instance(DataTable, {
        component: DataTable,
        label: 'Deals',
        id: 'table',
        enable_selection: true,
        enable_csv_export: true,
        enable_clear_order: true,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 15,
        results_per_page_event: self.results_per_page_event,
        empty_template: 'tpl_data_table_empty_with_top_form',
        columns: [
            {
                label: 'Company Name',
                sort_key: 'company_name',
                format: 'contextual_link',
                format_args: {
                    url: 'company-analytics/<company_uid>',
                    label_key: 'company_name',
                },
            },
            {
                label: 'Acq. Date',
                key: 'acquisition_date',
                format: 'backend_date',
            },
            {
                label: 'Exit Date',
                key: 'exit_date',
                format: 'backend_date',
            },
            {
                label: 'Deal Team Leader',
                key: 'deal_team_leader',
            },
            {
                label: 'Deal Team Second',
                key: 'deal_team_second',
            },
            {
                label: 'Deal Source',
                key: 'deal_source',
            },
            {
                label: 'Deal Role',
                key: 'deal_role',
            },
            {
                label: 'Deal Type',
                key: 'deal_type',
            },
            {
                label: 'Seller Type',
                key: 'seller_type',
            },
            {
                label: 'Deal Currency',
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
                        include_enums: ['geography'],
                    },
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
                        entity_type: 'user_fund',
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'deals',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                filters: self.table_filter_conf,
            },
        },
    });

    self.when(self.table).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });

        _dfd.resolve();
    });

    return self;
}
