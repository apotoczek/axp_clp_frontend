/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TextInput from 'src/libs/components/basic/TextInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import DateInput from 'src/libs/components/basic/DateInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_top_form';

    self.cashflow_type = opts.cashflow_type || 'net';
    self.vehicle_uid_event = opts.vehicle_uid_event;

    self.date = self.new_instance(DateInput, {
        id: 'date',
        label: 'Date',
        allow_empty: false,
        max_value: Constants.max_backend_timestamp,
        min_value: Constants.min_backend_timestamp,
        limit_error: true,
    });

    self.amount = self.new_instance(NumberInput, {
        id: 'amount',
        label: 'Amount',
        allow_empty: false,
    });

    self.note = self.new_instance(TextInput, {
        id: 'note',
        label: 'Note',
        length_limit: {
            limit: 256,
            warning_text: 'The cashflow note will be truncated due to exceeding 256 characters',
        },
    });

    self.classif_uid = self.new_instance(NewDropdown, {
        id: 'type_input',
        btn_css: {'btn-ghost-default': true},
        label: 'Type',
        datasource: {
            type: 'dynamic',
            key: 'distinct_cashflow_types',
            query: {
                target: 'user:cashflow_classifications',
            },
        },
        default_selected_index: 0,
    });

    self.company = self.new_instance(NewDropdown, {
        id: 'company_input',
        label: 'Deal',
        btn_css: {'btn-ghost-default': true},
        label_key: 'company_name',
        value_key: 'uid',
        default_selected_index: 0,
        datasource: {
            type: 'dynamic',
            key: 'results',
            query: {
                target: 'deals',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                results_per_page: 'all',
                order_by: [{name: 'name'}],
            },
        },
    });

    self.valid = ko.pureComputed(() => {
        let valid =
            self.date.valid() &&
            self.amount.valid() &&
            Utils.is_set(self.date.value(), true) &&
            Utils.is_set(self.amount.value(), true);

        if (self.cashflow_type === 'gross') {
            return valid && self.company.has_selected();
        }

        return valid;
    });

    self.button = self.new_instance(ActionButton, {
        id: 'add_cashflow',
        action: 'add_cashflow',
        label: 'Add Cash Flow',
        css: {
            btn: true,
            'btn-ghost-default': true,
            'btn-sm': true,
            'pull-right': true,
        },
        disabled_callback: function(valid) {
            return !valid;
        },
        data: self.valid,
    });

    self.form_layout = [[self.date, self.amount, self.note], [self.classif_uid]];

    if (self.cashflow_type == 'gross') {
        self.form_layout[1].push(self.company);
    }

    self.column_css = 'col-xs-4';

    self.clear = function() {
        self.form_layout.flatten().forEach(component => {
            component.clear();
        });
    };

    self.when(self.date, self.amount, self.note, self.classif_uid).done(() => {
        Observer.register_for_id(self.button.get_id(), 'ActionButton.action.add_cashflow', () => {
            let data = {
                date: self.date.value(),
                amount: self.amount.value(),
                note: self.note.value(),
                classif_uid: self.classif_uid.selected_value(),
            };

            if (self.cashflow_type == 'gross') {
                data.deal_uid = self.company.selected_value();
            }

            Observer.broadcast_for_id(self.get_id(), 'CashflowForm.add_cashflow', data);
        });

        self.dfd.resolve();
    });

    return self;
}
