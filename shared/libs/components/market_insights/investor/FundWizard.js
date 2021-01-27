/* Automatically transformed from AMD to ES6. Beware of code smell. */
import auth from 'auth';
import BaseModal from 'src/libs/components/basic/BaseModal';
import InboxDataTable from 'src/libs/components/InboxDataTable';
import TableToolbarGen from 'src/libs/components/basic/TableToolbarGen';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import lang from 'lang';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-body">
                            <!-- ko renderComponent:fund_search_form -->
                            <!-- /ko -->
                            <!-- ko renderComponent:data_table -->
                            <!-- /ko -->
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.dfd = self.new_deferred();

    self.data_table_selected_event = Utils.gen_event(
        'DataTable.click_row',
        self.get_id(),
        'data_table',
    );

    self.reset_on_select = opts.reset_on_select || false;

    self.callback = opts.callback || false;

    if (self.callback) {
        Observer.register(self.data_table_selected_event, self.callback);
    }

    if (self.reset_on_select) {
        Observer.register(self.data_table_selected_event, () => {
            self.reset();
        });
    }

    self.fund_search_form = self.new_instance(TableToolbarGen, {
        id: 'fund_search_form',
        cashflow_types: ['net'],
    });

    self.entity_types = ['user_fund'];

    if (auth.user_has_feature('bison_internal')) {
        self.entity_types.push('bison_fund');
    }

    self.funds_datasource = {
        type: 'dynamic',
        query: {
            target: 'vehicles',
            results_per_page: self.results_per_page,
            order_by: [{name: 'name'}],
            filters: {
                type: 'dynamic',
                query: {
                    name: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'TextInput.value',
                            self.fund_search_form.get_id(),
                            'name',
                        ),
                        default: '',
                    },
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.fund_search_form.get_id(),
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.fund_search_form.get_id(),
                            'vintage_year',
                        ),
                        default: [],
                    },
                    in_portfolio_uid: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.raw_value',
                            self.fund_search_form.get_id(),
                            'portfolio',
                        ),
                        default: [],
                    },
                    entity_type: self.entity_types,
                    cashflow_type: 'net',
                    exclude_portfolio_only: true,
                },
            },
        },
    };

    self.data_table = self.new_instance(InboxDataTable, {
        id: 'data_table',
        enable_localstorage: true,
        enable_clear_order: true,
        css: {
            'table-light': true,
            'table-sm': true,
            'selectable-row-table': true,
        },
        results_per_page: 20,
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
                    relative: 'Name',
                    position: 'right',
                },
            },
        ],
        columns: [
            {
                label: 'Name',
                key: 'name',
                sort_key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
                definition: lang['Entity Type'].definition,
            },
            {
                label: 'Cash Flow Type',
                key: 'cashflow_type',
                format: 'titleize',
            },
            {
                label: 'Shared By',
                key: 'shared_by',
                format: 'strings',
                visible: false,
            },
            {
                label: 'Permissions',
                key: 'permissions',
                format: 'strings',
                visible: false,
            },

            {
                label: 'Vintage',
                key: 'vintage_year',
                type: 'numeric',
                first_sort: 'desc',
            },
        ],

        datasource: self.funds_datasource,
    });

    self.when(self.data_table, self.fund_search_form).done(() => {
        self.dfd.resolve();
    });

    return self;
}
