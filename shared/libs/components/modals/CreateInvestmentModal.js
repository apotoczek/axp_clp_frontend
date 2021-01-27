/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import DateInput from 'src/libs/components/basic/DateInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Investment</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: fund_name --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: investor_name --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: date --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: vintage_year --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: currency --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: commited --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: cash_in --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: cash_out --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: cash_out_and_remaining --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: net_mult --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: irr --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                        <!-- ko renderComponent: website --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: create_investment, enable: can_create'>Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    /********************************************************************
     * Components
     ********************************************************************/
    self.fund_name = new TypeaheadInput({
        allow_empty: false,
        placeholder: 'Fund',
        endpoint: {
            target: 'commander:funds',
            query_key: 'string_filter',
            display_key: 'name',
            return_key: 'uid',
            order_by: [
                {
                    name: 'name',
                    sort: 'asc',
                },
            ],
        },
    });

    self.investor_name = new TypeaheadInput({
        allow_empty: false,
        placeholder: 'Investor',
        endpoint: {
            target: 'commander:investors',
            query_key: 'string_filter',
            display_key: 'name',
            return_key: 'uid',
            order_by: [
                {
                    name: 'name',
                    sort: 'asc',
                },
            ],
        },
    });

    self.date = new DateInput({
        allow_empty: false,
        id: 'date',
        placeholder: 'As of date',
        format: 'date',
    });

    self.vintage_year = new NumberInput({
        id: 'vintage_year',
        placeholder: 'Vintage Year',
        format: 'number',
    });

    self.currency = new FilteredDropdown({
        id: 'currency',
        limit: 10,
        min_filter_length: 1,
        label: 'Currency',
        btn_style: '',
        enable_add: true,
        strings: {},
        btn_css: {
            //'btn-xs':true,
            'btn-ghost-info': true,
        },
        datasource: {
            type: 'dynamic',
            mapping: 'to_options',
            mapping_args: {
                value_key: 'symbol',
                label_key: 'symbol',
            },
            query: {
                target: 'currency:markets',
            },
        },
    });

    self.commited = new NumberInput({
        id: 'commited',
        placeholder: 'Commited',
        format: 'number',
    });

    self.cash_in = new NumberInput({
        id: 'cash_in',
        placeholder: 'Cash in',
        format: 'number',
    });

    self.cash_out = new NumberInput({
        id: 'cash_out',
        placeholder: 'Cash out',
        format: 'number',
    });

    self.cash_out_and_remaining = new NumberInput({
        id: 'cash_out_and_remaining',
        placeholder: 'Cash out and remaining',
        format: 'number',
    });

    self.net_mult = new NumberInput({
        id: 'net_mult',
        placeholder: 'Net multiple',
        format: 'number',
    });

    self.irr = new NumberInput({
        id: 'irr',
        placeholder: 'Irr',
        format: 'number',
    });

    self.website = new TextInput({
        id: 'website',
        placeholder: 'Website',
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.can_create = ko.pureComputed(() => {
        return (
            self.fund_name.can_submit() && self.investor_name.can_submit() && self.date.can_submit()
        );
    });
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.fund_name.clear();
        self.investor_name.clear();
        bison.helpers.close_modal(self.get_id());
    };

    self._create_investment = DataThing.backends.commander({
        url: 'create_investment',
    });

    self.create_investment = function() {
        let data = {
            fund_uid: self.fund_name.value(),
            investor_uid: self.investor_name.value(),
            as_of_date: self.date.value(),
            vintage_year: self.vintage_year.value(),
            currency_symbol: self.currency.value(),
            commitment_value: self.commited.value(),
            commitment_value_usd: self.commited.value(),
            cash_in_usd: self.cash_in.value(),
            cash_out_value: self.cash_out.value(),
            cash_out_and_remaining_usd: self.cash_out_and_remaining.value(),
            multiple: self.net_mult.value(),
            irr: self.irr.value(),
            src_url: self.website.value(),
        };
        self._create_investment({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                self.reset();
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
