import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataTable from 'src/libs/components/basic/DataTable';
import CompanyAddonForm from 'src/libs/components/datamanager/CompanyAddonForm';

import EventRegistry from 'src/libs/components/basic/EventRegistry';

import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

const DEFAULT_TEMPLATE = `
    <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
        <p class="text-left lead">
            To bulk edit your add-on purchases, download the spreadsheet.<br>
            Once you're done, upload it and Cobalt will update your entities accordingly.<br>
        </p>
    </div>
    <!-- ko with: body -->
        <!-- ko renderComponent: $data --><!-- /ko -->
    <!-- /ko -->
`;
class CompanyAddonPurchases extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_template(DEFAULT_TEMPLATE);
        this.vehicle_uid_event = opts.vehicle_uid_event || {};
        this.tools_menu_id = opts.tools_menu_id;

        let events = this.new_instance(EventRegistry, {});

        events.resolve_and_add('addon_form', 'CompanyAddonForm.add_addon_purchase');
        events.new('table_refresh');
        events.new('clear_form');

        let form = {
            component: CompanyAddonForm,
            id: 'addon_form',
            id_callback: events.register_alias('addon_form'),
            clear_form_event: events.get('clear_form'),
            vehicle_uid_event: this.vehicle_uid_event,
        };

        let table = {
            component: DataTable,
            label: 'Add-on Purchases',
            id: 'table',
            enable_selection: true,
            enable_csv_export: true,
            enable_clear_order: true,
            overflow: 'visible',
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 15,
            empty_template: 'tpl_data_table_empty_with_top_form',
            columns: [
                {
                    label: 'Company',
                    key: 'company_name',
                },
                {
                    label: 'Add-on Name',
                    key: 'addon_name',
                },
                {
                    label: 'Date',
                    key: 'date',
                    format: 'backend_date',
                },
                {
                    label: 'Equity Value',
                    sort_key: 'equity_value',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency',
                        value_key: 'equity_value',
                    },
                    type: 'numeric',
                },
                {
                    label: 'Enterprise Value',
                    sort_key: 'enterprise_value',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency',
                        value_key: 'enterprise_value',
                    },
                    type: 'numeric',
                },
                {
                    label: 'Net Debt',
                    sort_key: 'debt',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency',
                        value_key: 'debt',
                    },
                    type: 'numeric',
                },
                {
                    label: 'Revenue',
                    sort_key: 'revenue',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency',
                        value_key: 'revenue',
                    },
                    type: 'numeric',
                },
                {
                    label: 'EBITDA',
                    sort_key: 'ebitda',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency',
                        value_key: 'ebitda',
                    },
                    type: 'numeric',
                },
                {
                    label: 'EV/EBITDA',
                    key: 'ev_multiple',
                    format: 'multiple',
                    type: 'numeric',
                },
                {
                    label: 'Net Debt/EBITDA',
                    key: 'debt_multiple',
                    format: 'multiple',
                    type: 'numeric',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_valuations',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: this.vehicle_uid_event,
                        required: true,
                    },
                    filters: {
                        valuation_type: 'Add-on Purchase',
                    },
                },
            },
        };

        this.body = this.new_instance(Aside, {
            components: [form, table],
            id: 'body',
            template: 'tpl_aside_body',
            layout: {
                body: ['addon_form', 'table'],
            },
        });

        this.add_addon = DataThing.backends.useractionhandler({
            url: 'add_addon_purchase',
        });

        this.when(this.body).done(() => {
            Observer.register(events.get('addon_form'), payload => {
                this.add_addon({
                    data: {
                        attributes: payload[0],
                        user_fund_uid: payload[1],
                    },
                    success: () => {
                        DataThing.status_check();
                        Observer.broadcast(events.get('clear_form'));
                    },
                });
            });

            Observer.register_for_id(
                DataManagerHelper.button_id.delete_entities(this.tools_menu_id),
                'DeleteValuationModal.success',
                () => {
                    Observer.broadcast(events.get('table_refresh'));
                },
            );

            dfd.resolve();
        });
    }
}
export default CompanyAddonPurchases;
