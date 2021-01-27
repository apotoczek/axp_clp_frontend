/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TableToolbarGen from 'src/libs/components/basic/TableToolbarGen';
import ActionButton from 'src/libs/components/basic/ActionButton';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import InboxDataTable from 'src/libs/components/InboxDataTable';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import lang from 'lang';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();
    self.template = 'tpl_render_full_body';
    self.data_table_selected_event = Utils.gen_event(
        'DataTable.click_row',
        self.get_id(),
        'body',
        'data_table',
    );

    self.cashflow_type = opts.cashflow_type || undefined;

    self.callback = opts.callback;

    Observer.register(self.data_table_selected_event, self.callback);

    self.entity_types = opts.entity_types || ['user_fund'];

    let breadcrumb_label = opts.breadcrumb_label;

    const list_bison_funds =
        (opts.internal_list_bison_funds && auth.user_has_feature('bison_internal')) ||
        (opts.list_bison_funds && auth.user_has_feature('run_reports_derivative_funds'));
    if (list_bison_funds) {
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
                    cashflow_type: self.cashflow_type,
                    name: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'TextInput.value',
                            self.get_id(),
                            'body',
                            'fund_search_form',
                            'name',
                        ),
                        default: '',
                    },
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.get_id(),
                            'body',
                            'fund_search_form',
                            'enum_attributes',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.get_id(),
                            'body',
                            'fund_search_form',
                            'vintage_year',
                        ),
                        default: [],
                    },
                    in_portfolio_uid: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.raw_value',
                            self.get_id(),
                            'body',
                            'fund_search_form',
                            'portfolio',
                        ),
                        default: [],
                    },
                    entity_type: self.entity_types,
                    exclude_portfolio_only: true,
                },
            },
        },
    };

    self.data_table = {
        component: InboxDataTable,
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
    };

    let breadcrumb_items = [
        {
            label: 'Reports',
            link: '#!/reports',
        },
        {
            label: 'Visual Reports',
        },
    ];

    if (breadcrumb_label) {
        breadcrumb_items.push({
            label: breadcrumb_label,
        });
    }

    breadcrumb_items.push({
        label: 'Select Vehicle',
    });

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: breadcrumb_items,
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_lp_update_wizard_body',
        layout: {
            header: 'header',
            nav: 'back_to_template_selection',
            title: 'choose_fund_heading',
            filters: 'fund_search_form',
            table: 'data_table',
        },
        components: [
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                layout: {
                    breadcrumb: 'breadcrumb',
                    //tools_menu: 'tools_menu'
                },
                components: [self.breadcrumb],
            },
            {
                id: 'back_to_template_selection',
                component: ActionButton,
                css: 'btn-info btn-xs',
                template: 'tpl_action_button',
                label: 'Back to template selection',
                action: 'back',
            },
            {
                id: 'choose_fund_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Choose a vehicle for your report',
            },
            {
                id: 'fund_search_form',
                component: TableToolbarGen,
                cashflow_types: self.cashflow_type,
            },
            self.data_table,
        ],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();
    });

    return self;
}
