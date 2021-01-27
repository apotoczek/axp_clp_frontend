/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DateInput from 'src/libs/components/basic/DateInput';
import TextInput from 'src/libs/components/basic/TextInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    opts = opts || {};

    self.template = opts.template || 'tpl_data_manager_top_form';

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.company = new NewDropdown({
        id: 'company_input',
        label: 'Company',
        btn_css: {'btn-ghost-default': true},
        label_key: 'company_name',
        value_key: 'company_uid',
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

    self.valuation_type = new NewDropdown({
        id: 'valuation_type_input',
        label: 'Valuation Type',
        btn_css: {'btn-ghost-default': true},
        default_selected_index: 0,
        datasource: {
            type: 'dynamic',
            mapping: data => data.filter(obj => obj.value !== 'Based On Metrics'),
            query: {
                target: 'static_enums',
                enum_type: 'company_valuation_type',
            },
        },
    });

    self.date = new DateInput({
        id: 'date',
        label: 'Date',
        allow_empty: false,
    });

    self.equity_value = new NumberInput({
        id: 'equity_value',
        label: 'Equity Value',
    });

    self.enterprise_value = new NumberInput({
        id: 'enterprise_value',
        label: 'Enterprise Value',
    });

    self.debt = new NumberInput({
        id: 'debt',
        label: 'Net Debt',
    });

    self.revenue = new NumberInput({
        id: 'revenue',
        label: 'Revenue',
    });

    self.ebitda = new NumberInput({
        id: 'ebitda',
        label: 'EBITDA',
    });

    self.addon_name = new TextInput({
        id: 'addon_name',
        label: 'Add-on Name',
        clear_event: Utils.gen_event(self.get_id(), self.valuation_type.get_id(), 'state'),
    });

    self.valid = ko.computed(() => {
        return (
            self.company.has_selected() &&
            self.valuation_type.has_selected() &&
            self.date.valid() &&
            Utils.is_set(self.date.value(), true)
        );
    });

    self.button = new ActionButton({
        id: 'add_valuation',
        action: 'add_valuation',
        label: 'Add Valuation',
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

    self.form_layout = ko.computed(() => {
        let layout = [
            [self.company, self.date, self.equity_value, self.enterprise_value],
            [self.valuation_type, self.debt, self.revenue, self.ebitda],
        ];
        if (self.valuation_type.selected_value() === 'Add-on Purchase') {
            layout.push([self.addon_name]);
        }
        return layout;
    });

    self.column_css = 'col-xs-3';

    self.clear = function() {
        self.form_layout()
            .flatten()
            .forEach(component => {
                component.clear();
            });
    };

    self.when(
        self.company,
        self.valuation_type,
        self.date,
        self.equity_value,
        self.enterprise_value,
        self.debt,
        self.revenue,
        self.ebitda,
        self.addon_name,
    ).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });

        Observer.register_for_id(self.button.get_id(), 'ActionButton.action.add_valuation', () => {
            let valuation_type = self.valuation_type.selected_value();
            let valuation = {
                company_uid: self.company.selected_value(),
                valuation_type: valuation_type,
                date: self.date.value(),
                equity_value: self.equity_value.value(),
                enterprise_value: self.enterprise_value.value(),
                debt: self.debt.value(),
                revenue: self.revenue.value(),
                ebitda: self.ebitda.value(),
                addon_name:
                    valuation_type === 'Add-on Purchase' ? self.addon_name.value() : undefined,
            };

            Observer.broadcast_for_id(self.get_id(), 'CompanyValuationForm.add_valuation', [
                valuation,
                self.vehicle_uid(),
            ]);
        });

        self.dfd.resolve();
    });

    return self;
}
