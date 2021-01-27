import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import TextInput from 'src/libs/components/basic/TextInput';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import DateInput from 'src/libs/components/basic/DateInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import EnumValuesForm from 'src/libs/components/datamanager/EnumValuesForm';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import PercentInput from 'src/libs/components/basic/PercentInput';
import auth from 'auth';

const GP_TEMPLATE = `
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Create Fund</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group">
                        <!-- ko renderComponent: name --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <!-- ko renderComponent: firm --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                            <!-- ko renderComponent: family --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-3">
                        <div class="form-group">
                        <!-- ko renderComponent: target_size_value --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                        <!-- ko renderComponent: first_close --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                        <!-- ko renderComponent: vintage_year --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                        <!-- ko renderComponent: total_sold --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: currency_symbol --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: status --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: geography_popover --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: style_popover --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: sector_popover --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <hr class="transparent hr-small" />
                <button type="button" class="btn btn-primary" data-bind='click: create_fund, enable: can_create' data-dismiss="modal">Create</button>
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
`;

const HL_TEMPLATE = `
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Create Fund</h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="form-group">
                        <!-- ko renderComponent: name --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <!-- ko renderComponent: firm --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                            <!-- ko renderComponent: family --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: vintage_year --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: target_size_value --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                            <!-- ko renderComponent: gross_invested --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: gross_realized --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: gross_unrealized --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <!-- ko if: has_static_performance_permission -->
                <div class="row">
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: gross_irr --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: gross_multiple --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: dpi --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: rvpi --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: tvpi --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: irr --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <!-- /ko -->
                <div class="row">
                    <div class="col-sm-2">
                        <div class="form-group">
                        <!-- ko renderComponent: first_close --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-2">
                        <div class="form-group">
                        <!-- ko renderComponent: final_close --><!-- /ko -->
                        </div>
                    </div>

                    <div class="col-sm-2">
                        <div class="form-group">
                        <!-- ko renderComponent: total_sold --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: as_of_date --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-3">
                        <div class="form-group">
                            <!-- ko renderComponent: picc --><!-- /ko -->
                        </div>
                    </div>

                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: currency_symbol --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group">
                        <!-- ko renderComponent: status --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: geography_popover --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: style_popover --><!-- /ko -->
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <div class="form-group">
                        <!-- ko renderComponent: sector_popover --><!-- /ko -->
                        </div>
                    </div>
                </div>
                <hr class="transparent hr-small" />
                <button type="button" class="btn btn-primary" data-bind='click: create_fund, enable: can_create' data-dismiss="modal">Create</button>
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
`;
class CreateFundModal extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_template('default', GP_TEMPLATE);
        this.define_template('hl', HL_TEMPLATE);

        if (__DEPLOYMENT__ === 'hl') {
            this.set_active_template('hl');
        }

        this.success_event = opts.success_event;

        this.data_mapper = opts.data_mapper;

        /********************************************************************
         * Components
         ********************************************************************/
        this.name = this.new_instance(TextInput, {
            allow_empty: false,
            placeholder: 'Fund Name',
        });

        this.firm = this.new_instance(TypeaheadInput, {
            placeholder: 'Firm',
            allow_empty: false,
            endpoint: {
                target: 'commander:firms',
                query_key: 'string_filter',
                display_key: 'name',
                return_key: 'uid',
                order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
            },
        });

        this.family = this.new_instance(TypeaheadInput, {
            placeholder: 'Family (leave blank to compute)',
            endpoint: {
                target: 'commander:families',
                query_key: 'string_filter',
                display_key: 'name',
                return_key: 'uid',
                order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
            },
        });

        this.dpi = this.new_instance(NumberInput, {
            id: 'dpi',
            placeholder: 'DPI',
        });

        this.tvpi = this.new_instance(NumberInput, {
            id: 'tvpi',
            placeholder: 'TVPI',
        });

        this.irr = this.new_instance(PercentInput, {
            id: 'irr',
            placeholder: 'IRR',
        });

        this.rvpi = this.new_instance(NumberInput, {
            id: 'rvpi',
            placeholder: 'RVPI',
        });

        this.picc = this.new_instance(PercentInput, {
            id: 'picc',
            placeholder: 'Paid in %',
        });

        this.gross_irr = this.new_instance(PercentInput, {
            id: 'gross_irr',
            placeholder: 'Gross IRR',
        });

        this.gross_multiple = this.new_instance(NumberInput, {
            id: 'gross_multiple',
            placeholder: 'Gross Multiple',
        });

        this.gross_invested = this.new_instance(NumberInput, {
            id: 'gross_invested',
            placeholder: 'Gross Investment',
        });

        this.gross_realized = this.new_instance(NumberInput, {
            id: 'gross_realized',
            placeholder: 'Gross Realized',
        });

        this.gross_unrealized = this.new_instance(NumberInput, {
            id: 'gross_unrealized',
            placeholder: 'Gross Unrealized',
        });

        this.as_of_date = this.new_instance(DateInput, {
            id: 'as_of_date',
            placeholder: 'As of Date',
        });

        this.target_size_value = this.new_instance(NumberInput, {
            id: 'target_size_value',
            placeholder: 'Target Size Value',
        });

        this.total_sold = this.new_instance(NumberInput, {
            id: 'total_sold',
            placeholder: 'Total Sold',
        });

        this.currency_symbol = this.new_instance(FilteredDropdown, {
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

        this.vintage_year = this.new_instance(NumberInput, {
            id: 'vintage_year',
            placeholder: 'Vintage Year',
            format: 'year',
        });

        this.status = this.new_instance(NewDropdown, {
            id: 'status',
            allow_empty: false,
            label: 'Status',
            value_key: 'uid',
            label_key: 'name',
            datasource: {
                type: 'dynamic',
                key: 'results',
                query: {
                    target: 'commander:fund_statuses',
                },
            },
        });

        this.city = this.new_instance(TextInput, {
            id: 'city',
            placeholder: 'City',
        });

        this.first_close = this.new_instance(DateInput, {
            id: 'first_close',
            placeholder: 'First Close',
        });

        this.final_close = this.new_instance(DateInput, {
            id: 'final_close',
            placeholder: 'Final Close',
        });

        this.call_data_mapper = function() {
            if (this.data_mapper) {
                let data = this.data_mapper(this.data());
                if (data.name) {
                    this.firm.result(data);
                }
                if (data.fund_name) {
                    this.name.value(data.fund_name);
                }
                if (data.target_size_value) {
                    this.target_size_value.value(data.target_size_value);
                }
                if (data.first_close) {
                    this.first_close.value(data.first_close);
                }
                if (data.final_close) {
                    this.final_close.value(data.final_close);
                }
            }
        };

        let _geographies = this.new_instance(EnumValuesForm, {
            attribute_identifier: 'geography',
            options_target: 'attribute:editable_data',
        });
        this.geography_popover = this.new_instance(NewPopoverButton, {
            label: 'Geography',
            track_selection_property: 'selected_summary',
            ellipsis: true,
            icon_css: 'caret',
            css: {
                'btn-block': true,
                'btn-ghost-info': true,
            },
            popover_options: {
                placement: 'bottom',
                title: 'Geography',
                css_class: 'popover-enums',
            },
            popover: _geographies,
        });

        let _styles = this.new_instance(EnumValuesForm, {
            attribute_identifier: 'style',
            options_target: 'attribute:editable_data',
        });
        this.style_popover = this.new_instance(NewPopoverButton, {
            label: 'Style / Focus',
            track_selection_property: 'selected_summary',
            ellipsis: true,
            icon_css: 'caret',
            css: {
                'btn-block': true,
                'btn-ghost-info': true,
            },
            popover_options: {
                placement: 'bottom',
                title: 'Style / Focus',
                css_class: 'popover-enums',
            },
            popover: _styles,
        });

        let _sector = this.new_instance(EnumValuesForm, {
            attribute_identifier: 'sector',
            options_target: 'attribute:editable_data',
        });
        this.sector_popover = this.new_instance(NewPopoverButton, {
            label: 'Sector',
            icon_css: 'caret',
            ellipsis: true,
            track_selection_property: 'selected_summary',
            css: {
                'btn-block': true,
                'btn-ghost-info': true,
            },
            popover_options: {
                placement: 'bottom',
                title: 'Sector',
                css_class: 'popover-enums',
            },
            popover: _sector,
        });

        this.can_create = ko.pureComputed(() => {
            return (
                this.name.can_submit() &&
                this.firm.can_submit() &&
                this.picc.can_submit() &&
                this.irr.can_submit() &&
                this.dpi.can_submit() &&
                this.tvpi.can_submit() &&
                this.rvpi.can_submit() &&
                this.gross_invested.can_submit() &&
                this.gross_realized.can_submit() &&
                this.gross_unrealized.can_submit() &&
                this.gross_irr.can_submit() &&
                this.gross_multiple.can_submit() &&
                this.as_of_date.can_submit() &&
                this.target_size_value.can_submit() &&
                this.first_close.can_submit() &&
                this.final_close.can_submit() &&
                this.vintage_year.can_submit() &&
                this.status.valid() &&
                this.total_sold.can_submit()
            );
        });

        this.has_static_performance_permission = ko.pureComputed(() => {
            return auth.user_has_feature('static_fund_performance');
        });
        /********************************************************************
         * Modal functionality
         *******************************************************************/
        this.show = function() {
            this.status.set_selected_by_value('First close');
            this.call_data_mapper();
            bison.helpers.modal(this.template, this, this.get_id());
        };

        this.reset = function() {
            this.name.clear();
            this.irr.clear();
            this.picc.clear();
            this.dpi.clear();
            this.tvpi.clear();
            this.rvpi.clear();
            this.gross_invested.clear();
            this.gross_realized.clear();
            this.gross_unrealized.clear();
            this.gross_irr.clear();
            this.gross_multiple.clear();
            this.as_of_date.clear();
            this.target_size_value.clear();
            this.currency_symbol.clear();
            this.first_close.clear();
            this.final_close.clear();
            this.total_sold.clear();
            this.firm.clear();
            this.status.clear();
            this.family.clear();
            this.city.clear();
            this.vintage_year.clear();
            this.sector_popover.popover.clear();
            this.geography_popover.popover.clear();
            this.style_popover.popover.clear();
            bison.helpers.close_modal(this.get_id());
        };

        this._create_fund = DataThing.backends.commander({
            url: 'create_fund',
        });

        this.create_fund = function() {
            let data = {
                name: this.name.value(),
                target_size_value: this.target_size_value.value(),
                currency_symbol: this.currency_symbol.value(),
                first_close: this.first_close.value(),
                final_close: this.final_close.value(),
                gross_invested: this.gross_invested.value(),
                gross_realized: this.gross_realized.value(),
                gross_unrealized: this.gross_unrealized.value(),
                total_sold_value: this.total_sold.value(),
                firm_uid: this.firm.value(),
                family_uid: this.family.value(),
                status_uid: this.status.selected() ? this.status.selected().uid : undefined,
                city: this.city.value(),
                vintage_year: this.vintage_year.value(),
                enums: {
                    geography: this.geography_popover.popover.get_data(),
                    style: this.style_popover.popover.get_data(),
                    sector: this.sector_popover.popover.get_data(),
                },
                static_perf: {
                    irr: this.irr.value(),
                    picc: this.picc.value(),
                    dpi: this.dpi.value(),
                    tvpi: this.tvpi.value(),
                    rvpi: this.rvpi.value(),
                    as_of_date: this.as_of_date.value(),
                    gross_irr: this.gross_irr.value(),
                    gross_multiple: this.gross_multiple.value(),
                },
            };
            this._create_fund({
                data: data,
                success: DataThing.api.XHRSuccess(response => {
                    data.uid = response.fund_uid;

                    if (this.success_event) {
                        Observer.broadcast(this.success_event, data);
                    }
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {
                    this.loading(false);
                }),
            });
        };

        this.when().done(() => {
            dfd.resolve();
        });
    }
}

export default CreateFundModal;
