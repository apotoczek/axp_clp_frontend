import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ActionButton from 'src/libs/components/basic/ActionButton';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import NumberInput from 'src/libs/components/basic/NumberInput';
import DateInput from 'src/libs/components/basic/DateInput';
import TextInput from 'src/libs/components/basic/TextInput';

import Observer from 'src/libs/Observer';
class CompanyAddonForm extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.template = opts.template || 'tpl_data_manager_top_form';

        this.column_css = 'col-xs-3';
        this.vehicle_uid_event = opts.vehicle_uid_event || {};
        this.clear_form_event = opts.clear_form_event;

        this.vehicle_uid = ko.observable();

        this.company = new NewDropdown({
            id: 'company_input',
            label: 'Deal',
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
                        event_type: this.vehicle_uid_event,
                        required: true,
                    },
                    results_per_page: 'all',
                    order_by: [{name: 'name'}],
                },
            },
        });
        this.date = new DateInput({
            id: 'date',
            label: 'Date',
            allow_empty: false,
        });

        this.equity_value = new NumberInput({
            id: 'equity_value',
            label: 'Equity Value',
        });

        this.enterprise_value = new NumberInput({
            id: 'enterprise_value',
            label: 'Enterprise Value',
        });

        this.debt = new NumberInput({
            id: 'debt',
            label: 'Net Debt',
        });

        this.revenue = new NumberInput({
            id: 'revenue',
            label: 'Revenue',
        });

        this.ebitda = new NumberInput({
            id: 'ebitda',
            label: 'EBITDA',
        });

        this.addon_name = new TextInput({
            id: 'addon_name',
            label: 'Add-on Name',
            allow_empty: false,
        });

        this.valid = ko.pureComputed(() => {
            return (
                this.company.has_selected() &&
                this.date.can_submit() &&
                this.addon_name.can_submit()
            );
        });

        this.button = new ActionButton({
            id: 'add_valuation',
            action: 'add_addon_purchase',
            label: 'Add Add-on Purchase',
            css: {
                btn: true,
                'btn-ghost-default': true,
                'btn-sm': true,
                'pull-right': true,
            },
            disabled_callback: function(valid) {
                return !valid;
            },
            data: this.valid,
        });

        this.form_layout = [
            [this.company, this.date, this.equity_value, this.enterprise_value],
            [this.debt, this.revenue, this.ebitda, this.addon_name],
        ];

        if (this.clear_form_event) {
            Observer.register(this.clear_form_event, () => {
                this.clear();
            });
        }

        this.clear = function() {
            for (let component of this.form_layout.flatten()) {
                component.clear();
            }
        };
        this.when(...this.form_layout).done(() => {
            Observer.register(this.vehicle_uid_event, uid => {
                this.vehicle_uid(uid);
            });

            Observer.register_for_id(
                this.button.get_id(),
                'ActionButton.action.add_addon_purchase',
                () => {
                    let valuation = {
                        company_uid: this.company.selected_value(),
                        date: this.date.value(),
                        equity_value: this.equity_value.value(),
                        enterprise_value: this.enterprise_value.value(),
                        debt: this.debt.value(),
                        revenue: this.revenue.value(),
                        ebitda: this.ebitda.value(),
                        addon_name: this.addon_name.value(),
                    };
                    Observer.broadcast_for_id(
                        this.get_id(),
                        'CompanyAddonForm.add_addon_purchase',
                        [valuation, this.vehicle_uid()],
                    );
                },
            );

            dfd.resolve();
        });
    }
}
export default CompanyAddonForm;
