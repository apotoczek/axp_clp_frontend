import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NumberInput from 'src/libs/components/basic/NumberInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import * as Formatters from 'src/libs/Formatters';
import auth from 'auth';

class FutureCommitmentsForm extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        this.define_template(`
            <div class="new-world-form clearfix" data-bind="style: { width: model_fund_permission() ? '650px' : '500px' }">
                <table class="table table-condensed">
                    <tbody>
                        <td data-bind="renderComponent: form.amount">
                        </td>
                        <td data-bind="renderComponent: form.vintage_year" style="width: 100px;">
                        </td>
                        <td data-bind="renderComponent: form.style" style="width: 150px;">
                        </td>
                        <!-- ko if: model_fund_permission -->
                            <td data-bind="renderComponent: form.model_fund" style="width: 150px;">
                            </td>
                        <!-- /ko -->
                        <td style="width: 50px;">
                            <button class="btn btn-xs btn-success" data-bind="click: add_commitment, enable: enable_add">Add</button>
                        </td>
                    </tbody>
                </table>
                <div class="clearfix" style="padding: 0 5px 5px;" data-bind="visible : has_commitments">
                    <table class="table table-bison table-light table-sm">
                        <thead>
                            <tr>
                                <th class="table-field">Commitment</th>
                                <th class="table-field">Timing</th>
                                <th class="table-field">Style</th>
                                <!-- ko if: model_fund_permission -->
                                    <th class="table-field">Model Fund</th>
                                <!-- /ko -->
                                <th class="table-field" style="width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody data-bind="event_horizon:true, foreach: commitments">
                            <tr>
                                <td class="table-field" data-bind="html: $parent.format_amount(amount)"></td>
                                <td class="table-field">
                                    Q<span data-bind="text: quarter"></span>
                                    <span data-bind="text: vintage_year"></span>
                                </td>
                                <td class="table-field" data-bind="html: $parent.format_style(style)"></td>
                                <!-- ko if: $parent.model_fund_permission -->
                                    <td class="table-field" data-bind="text: model_fund_name"></td>
                                <!-- /ko -->
                                <td class="table-field">
                                    <span class="glyphicon glyphicon-remove text-danger clickable" data-bind="click: $parent.remove_commitment"></span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <button class="btn btn-xs btn-default pull-right" data-dismiss="popover" style="margin-left: 5px;">Close</button>
                    <button class="btn btn-xs btn-ghost-default pull-right" data-bind="click: clear">Clear</button>
                </div>
                <!-- ko ifnot: has_commitments -->
                    <p class="lead text-center">
                        <br />
                        Use this form to add hypothetical<br />
                        commitments to your current allocation...
                    </p>
                <!-- /ko -->
            </div>
        `);

        const _dfd = this.new_deferred();

        this.portfolio_uid_event = opts.portfolio_uid_event;
        this.currency_event = opts.currency_event;
        this.as_of_date_event = opts.as_of_date_event;

        this.styles = Constants.horizon_model_style_options;

        this.render_currency = Observer.observable(this.currency_event);

        this.style_map = Utils.array_to_map(this.styles, 'value');

        this.commitments = ko.observableArray([]);

        this.as_of_date = ko.observable();

        Observer.register(this.as_of_date_event, as_of_date => {
            this.as_of_date(Utils.get(as_of_date));
        });

        this.vintage_options = ko.pureComputed(() => {
            const as_of_date = this.as_of_date();

            const options = [];

            if (as_of_date) {
                const d = Date.create(as_of_date * 1000).setUTC(true);

                const year = d.getUTCFullYear();
                const month = d.getUTCMonth() + 1;
                let quarter = Utils.month_to_quarter(month);

                for (let y = year, max_y = year + 10; y < max_y; y++) {
                    for (let q = quarter; q < 5; q++) {
                        options.push({
                            value: `${y}_${q}`,
                            label: `Q${q} ${y}`,
                            quarter: q,
                            year: y,
                        });
                    }

                    quarter = 1;
                }
            }

            return options;
        });

        this.model_fund_permission = ko.pureComputed(() => {
            return auth.user_has_feature('hl_model_path');
        });

        this.format_amount = Formatters.gen_formatter({
            format: 'money',
            format_args: {
                render_currency: this.render_currency,
            },
        });

        this.format_style = style => {
            return this.style_map[style.replace(/ /g, '-')].label;
        };

        this.has_commitments = ko.pureComputed(() => {
            return this.commitments().length > 0;
        });

        this.formatted_commitments = ko.pureComputed(() => {
            const commitments = this.commitments();
            const formatted = [];

            for (let i = 0, l = commitments.length; i < l; i++) {
                formatted.push({
                    ...commitments[i],
                    name: this.commitment_name(commitments[i]),
                });
            }

            return formatted;
        });

        this.formatted_commitments.subscribe(commitments => {
            Observer.broadcast('state', commitments);
        });

        this.commitment_name = commitment => {
            return oneLine`
                Q${commitment.quarter}
                ${commitment.vintage_year}
                ${this.format_style(commitment.style)}
                (${this.format_amount(commitment.amount)})
            `;
        };

        this.form = {
            amount: this.new_instance(NumberInput, {
                placeholder: 'Commitment',
                template: 'tpl_text_input',
                allow_empty: false,
                css: {
                    'input-xs': true,
                },
            }),
            style: this.new_instance(NewDropdown, {
                id: 'style',
                options: this.styles,
                default_selected_index: 0,
                btn_css: {'btn-ghost-default': true, 'btn-xs': true},
            }),
            vintage_year: this.new_instance(NewDropdown, {
                id: 'vintage',
                data: this.vintage_options,
                default_selected_index: 0,
                btn_css: {'btn-ghost-default': true, 'btn-xs': true},
            }),
            ...(this.model_fund_permission() && {
                model_fund: this.new_instance(FilteredDropdown, {
                    id: 'model_fund',
                    datasource: {
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            label_key: 'entity_name',
                            value_key: 'entity_uid',
                        },
                        query: {
                            target: 'user:vehicles',
                            entity_type: ['user_fund'],
                        },
                    },
                    strings: {
                        no_selection: 'Hamilton Lane Path',
                    },
                    btn_css: {'btn-ghost-default': true, 'btn-xs': true},
                }),
            }),
            clear: () => {
                this.form.amount.clear();
                this.form.style.clear();
                this.form.vintage_year.clear();
                if (this.model_fund_permission()) {
                    this.form.model_fund.clear();
                }
            },
        };

        this.clear = () => {
            this.form.clear();
            this.commitments([]);
        };

        this.remove_commitment = commitment => {
            this.commitments.remove(commitment);
        };

        this.add_commitment = () => {
            if (this.valid()) {
                const selected_vintage = this.form.vintage_year.selected();
                let commitment = {
                    amount: this.form.amount.value(),
                    style: this.form.style.selected_value(),
                    vintage_year: selected_vintage.year,
                    quarter: selected_vintage.quarter,
                };

                if (this.form.model_fund) {
                    commitment.model_fund_name =
                        this.form.model_fund.selected_label() || 'Hamilton Lane Path';
                    commitment.model_fund_uid = this.form.model_fund.selected_value();
                }

                this.commitments.push(commitment);
                this.form.clear();
            }
        };

        this.valid = ko.pureComputed(() => {
            return this.form.amount.valid() && Utils.is_set(this.form.amount.value(), true);
        });

        this.enable_add = ko.pureComputed(() => {
            if (this.form) {
                return this.valid();
            }
        });

        this.get_value = ko.pureComputed(() => {
            return this.formatted_commitments();
        });

        this.modified = ko.pureComputed(() => {
            return this.has_commitments();
        });

        this.state = this.get_value;

        this.set_state = state => {
            this.commitments(state);
        };

        this.when(this.form.amount, this.form.vintage_year, this.form.style).done(() => {
            _dfd.resolve();
        });
    }
}

export default FutureCommitmentsForm;
