/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

import CompanyValuationForm from 'src/libs/components/datamanager/CompanyValuationForm';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
            <p class="text-left lead">
        To bulk edit your Valuations, download the spreadsheet.<br>
        Once you're done, upload it and Cobalt will update your entities accordingly.<br>
            </p>
        </div>
        <!-- ko renderComponent: form --><!-- /ko -->
        <!-- ko renderComponent: table --><!-- /ko -->
    `);

    self.vehicle_uid_event = opts.vehicle_uid_event;
    self.valuation_type_map = ko.observable({});
    self.update_valuation_type_map = (key, value) => {
        self.valuation_type_map()[key] = value;
        self.valuation_type_map.valueHasMutated();
    };
    self.tools_menu_id = opts.tools_menu_id;
    self.table_filter_conf = opts.table_filter_conf;
    self.results_per_page_event = opts.results_per_page_event;

    self.vehicle_uid = ko.observable();
    self.form = self.new_instance(CompanyValuationForm, {
        id: 'form',
        vehicle_uid_event: self.vehicle_uid_event,
    });

    self.table = self.new_instance(DataTable, {
        label: 'Valuations',
        id: 'table',
        enable_selection: true,
        enable_csv_export: true,
        enable_clear_order: true,
        overflow: 'visible',
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        columns: [
            {
                label: 'Company',
                sort_key: 'company_name',
                format: 'contextual_link',
                format_args: {
                    url: 'company-analytics/<company_uid>',
                    label_key: 'company_name',
                },
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
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                filters: self.table_filter_conf,
            },
        },
    });

    self.table.data.subscribe(data => {
        if (data) {
            for (let row of data.results) {
                self.update_valuation_type_map(row.uid, row.valuation_type);
            }
        }
    });
    self._save_company_valuation_attributes = DataThing.backends.useractionhandler({
        url: 'save_company_valuation_attributes',
    });

    self._save_company_valuation_attribute = DataThing.backends.useractionhandler({
        url: 'save_company_valuation_attribute',
    });

    let save_single_attribute = function(key, value, uid) {
        self._save_company_valuation_attribute({
            data: {
                key: key,
                value: value,
                uid: uid,
            },
            success: function() {},
        });
    };

    self.when(self.table, self.form).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'company_input'),
            'Dropdown.value_with_data',
            value => {
                save_single_attribute('company_uid', value.selected.company_uid, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'valuation_type_input'),
            'Dropdown.value_with_data',
            state => {
                let {uid} = state.data;
                let value = state.selected ? state.selected.value : undefined;
                save_single_attribute('valuation_type', value, uid);
                self.update_valuation_type_map(uid, value);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'date_input'),
            'DateInput.value_with_data',
            value => {
                save_single_attribute('date', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'equity_value_input'),
            'NumberInput.value_with_data',
            value => {
                save_single_attribute('equity_value', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'enterprise_value_input'),
            'NumberInput.value_with_data',
            value => {
                save_single_attribute('enterprise_value', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'debt_input'),
            'NumberInput.value_with_data',
            value => {
                save_single_attribute('debt', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'addon_name_input'),
            'TextInput.value_with_data',
            value => {
                save_single_attribute('addon_name', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'revenue_input'),
            'NumberInput.value_with_data',
            value => {
                save_single_attribute('revenue', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            Utils.gen_id(self.table.get_id(), 'ebitda_input'),
            'NumberInput.value_with_data',
            value => {
                save_single_attribute('ebitda', value.value, value.data.uid);
            },
        );

        Observer.register_for_id(
            self.form.get_id(),
            'CompanyValuationForm.add_valuation',
            payload => {
                self._save_company_valuation_attributes({
                    data: {
                        attributes: payload[0],
                        user_fund_uid: payload[1],
                    },
                    success: function() {
                        self.form.clear();
                        self.table.refresh_data(true);
                    },
                });
            },
        );

        if (self.tools_menu_id) {
            Observer.register_for_id(
                DataManagerHelper.button_id.delete_entities(self.tools_menu_id),
                'DeleteValuationModal.success',
                () => {
                    self.table.refresh_data(true);
                },
            );
        }

        Observer.register(DataManagerHelper.events.upload_success_event, () => {
            self.table.refresh_data(true);
        });

        _dfd.resolve();
    });

    return self;
}
