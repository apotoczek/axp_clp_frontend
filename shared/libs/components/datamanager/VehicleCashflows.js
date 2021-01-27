/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import TextInput from 'src/libs/components/basic/TextInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import DateInput from 'src/libs/components/basic/DateInput';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import CashflowForm from 'src/libs/components/datamanager/CashflowForm';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import * as Constants from 'src/libs/Constants';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import DataSource from 'src/libs/DataSource';
import CashFlowAttributePicker from 'src/libs/components/datamanager/CashFlowAttributePicker';

import 'src/libs/bindings/react';

class VehicleCashflows extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        this.dfd = this.new_deferred();

        this.template = opts.template || 'tpl_data_manager_form_table';
        this.tools_menu_id = opts.tools_menu_id;
        this.results_per_page_event = opts.results_per_page_event;
        this.table_filter_conf = opts.table_filter_conf;

        this.vehicle_uid_event = opts.vehicle_uid_event;
        this.vehicle_uid = ko.observable();

        this.cashflow_type = opts.cashflow_type || 'net';
        this.CashFlowAttributePicker = CashFlowAttributePicker;

        this.form = this.new_instance(CashflowForm, {
            id: 'form',
            vehicle_uid_event: this.vehicle_uid_event,
            cashflow_type: this.cashflow_type,
        });

        this.table_columns = [
            {
                label: 'Date',
                sort_key: 'date',
                width: '10%',
                type: 'component',
                component_callback: 'data',
                format: 'backend_date',
                component: {
                    id: 'date_input',
                    component: DateInput,
                    max_value: Constants.max_backend_timestamp,
                    min_value: Constants.min_backend_timestamp,
                    limit_error: true,
                    css: {'input-xs': true},
                    initial_value_property: 'date',
                    allow_empty: false,
                },
            },
            {
                label: 'Amount',
                width: '10%',
                type: 'component',
                component_callback: 'data',
                format: 'usd',
                component: {
                    id: 'amount_input',
                    component: NumberInput,
                    css: {'input-xs': true},
                    initial_value_property: 'amount',
                    allow_empty: false,
                },
            },
            {
                label: 'Note',
                sort_key: 'note',
                width: this.cashflow_type == 'net' ? '20%' : '15%',
                type: 'component',
                component_callback: 'data',
                component: {
                    id: 'note_input',
                    component: TextInput,
                    length_limit: {
                        limit: 256,
                        warning_text:
                            'The cashflow note will be truncated due to exceeding 256 characters',
                    },
                    css: {'input-xs': true},
                    initial_value_property: 'note',
                },
            },
            {
                label: 'Base Type',
                key: 'base_type',
                format: 'cf_type',
            },
            {
                label: 'Type',
                sort_key: 'classification_uid',
                width: this.cashflow_type == 'net' ? '20%' : '15%',
                type: 'component',
                component_callbacks: [
                    {
                        callback: 'set_selected_by_value',
                        mapping: {
                            mapping: 'get',
                            mapping_args: {key: 'classification_uid'},
                        },
                    },
                    {
                        callback: 'broadcast_data',
                    },
                ],
                component: {
                    id: 'type_input',
                    component: NewDropdown,
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true},
                    menu_css: {'dropdown-menu-right': true},
                    allow_clear: false,
                    allow_empty: true,
                    strings: {
                        no_selection: '',
                    },
                    datasource: {
                        type: 'dynamic',
                        key: 'distinct_cashflow_types',
                        query: {
                            target: 'user:cashflow_classifications',
                        },
                    },
                },
            },
        ];

        if (this.cashflow_type == 'gross') {
            this.deals = this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    key: 'results',
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'uid',
                        label_key: 'company_name',
                    },
                    query: {
                        target: 'deals',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: this.vehicle_uid_event,
                            required: true,
                        },
                        results_per_page: 'all',
                    },
                },
            });

            this.table_columns.push({
                label: 'Deal',
                width: '20%',
                sort_key: 'company_name',
                type: 'component',
                component_callbacks: [
                    {
                        callback: 'set_selected_by_value',
                        mapping: {
                            mapping: 'get',
                            mapping_args: {key: 'deal_uid'},
                        },
                    },
                    {
                        callback: 'broadcast_data',
                    },
                ],
                component: {
                    component: NewDropdown,
                    id: 'deal_input',
                    btn_css: {'btn-xs': true, 'btn-ghost-default': true},
                    menu_css: {'dropdown-menu-right': true},
                    default_selected_index: 0,
                    data: this.deals.data,
                },
            });
        }

        this.dynamic_column_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'editable:cashflow_table_columns',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: this.vehicle_uid_event,
                        required: true,
                    },
                },
            },
        });

        this.table = this.new_instance(DataTable, {
            label: 'Cash Flows',
            id: 'table',
            enable_clear_order: true,
            enable_selection: true,
            enable_csv_export: true,
            css: {
                'table-light': true,
                'table-sm': true,
                'table-bordered': true,
                'table-bison': false,
                'table-condensed': true,
                'table-form': true,
            },
            results_per_page_event: this.results_per_page_event,
            results_per_page: 15,
            overflow: 'visible',
            columns: this.table_columns,
            empty_template: 'tpl_data_table_empty_with_top_form',
            disable_cache: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:editable_cashflows',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: this.vehicle_uid_event,
                        required: true,
                    },
                    filters: this.table_filter_conf,
                },
            },
            dynamic_columns: [
                {
                    placement: {
                        position: 'right',
                    },
                    data: ko.pureComputed(() => {
                        const data = this.dynamic_column_datasource.data();
                        return (data || []).map(thing => ({
                            label: thing.label,
                            component_callback: 'setDataValue',
                            component: {
                                component: CashFlowAttributePicker,
                                id: 'cashflow_attribute_input',
                                members: thing.tree,
                                attribute_uid: thing.value,
                            },
                        }));
                    }),
                },
            ],
        });

        this._update_vehicle_cashflows = DataThing.backends.useractionhandler({
            url: 'update_vehicle_cashflows',
        });

        this._add_cashflows = DataThing.backends.useractionhandler({
            url: 'add_cashflow',
        });

        this.save_changes = function(key, value, cashflow) {
            const changes = {};

            // Multiple key/values???
            if (Object.isArray(key) && Object.isArray(value) && key.length == value.length) {
                for (let i = 0, l = key.length; i < l; i++) {
                    changes[cashflow.uid] = changes[cashflow.uid] || {};
                    changes[cashflow.uid][key[i]] = Utils.is_set(value[i]) ? value : null;
                }
            } else {
                changes[cashflow.uid] = {};
                changes[cashflow.uid][key] = Utils.is_set(value) ? value : null;
            }

            this._update_vehicle_cashflows({
                data: {
                    vehicle_uid: cashflow.fund_uid,
                    changes: changes,
                },
                success: DataThing.api.XHRSuccess(() => {}),
                error: DataThing.api.XHRError(() => {}),
            });
        };

        this.when(this.table, this.form).done(() => {
            Observer.register(this.vehicle_uid_event, uid => {
                this.vehicle_uid(uid);
            });

            Observer.register_for_id(
                Utils.gen_id(this.table.get_id(), 'cashflow_attribute_input'),
                'CashFlowAttributePicker.selected',
                data => {
                    this.save_changes('attributes', data.value, data.data);
                },
            );

            Observer.register_for_id(
                Utils.gen_id(this.table.get_id(), 'note_input'),
                'TextInput.value_with_data',
                data => {
                    this.save_changes('note', data.value, data.data);
                },
            );

            Observer.register_for_id(
                Utils.gen_id(this.table.get_id(), 'date_input'),
                'DateInput.value_with_data',
                data => {
                    this.save_changes('date', data.value, data.data);
                },
            );

            Observer.register_for_id(
                Utils.gen_id(this.table.get_id(), 'amount_input'),
                'NumberInput.value_with_data',
                data => {
                    this.save_changes('amount', data.value, data.data);
                },
            );

            Observer.register_for_id(
                Utils.gen_id(this.table.get_id(), 'type_input'),
                'Dropdown.value_with_data',
                data => {
                    this.save_changes('classification_uid', data.selected.value, data.data);
                },
            );

            if (this.cashflow_type == 'gross') {
                Observer.register_for_id(
                    Utils.gen_id(this.table.get_id(), 'deal_input'),
                    'Dropdown.value_with_data',
                    data => {
                        this.save_changes('deal_uid', data.selected.value, data.data);
                    },
                );
            }

            Observer.register_for_id(this.form.get_id(), 'CashflowForm.add_cashflow', data => {
                data.user_fund_uid = this.vehicle_uid();

                this._add_cashflows({
                    data: data,
                    success: DataThing.api.XHRSuccess(() => {
                        this.form.clear();
                        this.table.refresh_data(true);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            });

            if (this.tools_menu_id) {
                Observer.register_for_id(
                    DataManagerHelper.button_id.delete_entities(this.tools_menu_id),
                    'DeleteCashflowModal.success',
                    () => {
                        this.table.refresh_data(true);
                    },
                );
            }

            Observer.register(DataManagerHelper.events.upload_success_event, () => {
                this.table.refresh_data(true);
            });
        });
        this.dfd.resolve();
    }
}
export default VehicleCashflows;
