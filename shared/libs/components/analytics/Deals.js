import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';

class Companies extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        if (!opts.table_datasource) {
            throw 'Trying to initialize Deal page without table_datasource';
        }

        this.define_template(`
            <!-- ko renderComponent: search_table --><!-- /ko -->
        `);

        const url = opts.url || 'company-analytics/<company_uid>';

        const entity_type = opts.entity_type;
        const entity_uid_event = opts.entity_uid_event;
        const table_datasource = opts.table_datasource;

        const columns = [
            {
                label: 'Name',
                sort_key: 'company_name',
                format: 'contextual_link',
                format_args: {
                    url,
                    label_key: 'company_name',
                },
            },
        ];

        if (entity_type) {
            if (entity_type === 'portfolio') {
                columns.push({
                    label: 'Fund',
                    key: 'fund_name',
                });
            }
        }

        columns.push(
            {
                label: 'Currency',
                key: 'base_currency_symbol',
            },
            {
                label: 'Acquisition Date',
                key: 'acquisition_date',
                format: 'backend_date',
            },
            {
                label: 'Exit Date',
                key: 'exit_date',
                format: 'backend_date',
            },
            {
                label: 'Investment Amount',
                sort_key: 'investment_amount',
                format: 'money',
                format_args: {
                    currency_key: 'base_currency_symbol',
                    value_key: 'investment_amount',
                },
            },
        );

        this.search_table = this.new_instance(DataTable, {
            id: 'search_table',
            label: 'Deals',
            css: {'table-light': true, 'table-sm': true},
            dynamic_columns: {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        entity_uid: {
                            type: 'observer',
                            event_type: entity_uid_event,
                            required: true,
                        },
                        entity_type: entity_type,
                    },
                },
                visible: true,
            },
            columns: columns,
            datasource: table_datasource,
        });

        this.when(this.search_table).done(() => {
            _dfd.resolve();
        });
    }
}

export default Companies;
