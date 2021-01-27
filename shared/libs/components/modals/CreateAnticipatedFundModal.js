/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import TextInput from 'src/libs/components/basic/TextInput';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import EnumValuesForm from 'src/libs/components/datamanager/EnumValuesForm';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Create Anticipated Fund</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-sm-6">
                                <div class="form-group">
                                    <!-- ko renderComponent: family --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: currency --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: name --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: ordinal --><!-- /ko -->
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: vintage --><!-- /ko -->
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="form-group">
                                    <!-- ko renderComponent: fund_size --><!-- /ko -->
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
                            <button type="button" class="btn btn-primary" data-bind='click: create_anticipated_fund, enable: can_create'>Create</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.family_event = Utils.gen_event(self.get_id(), 'FamilyEvent');

    /********************************************************************
     * Components
     ********************************************************************/
    self.family = new TypeaheadInput({
        placeholder: 'Family',
        allow_empty: false,
        select_event: self.family_event,
        endpoint: {
            target: 'commander:families',
            query_key: 'string_filter',
            display_key: 'name',
            return_key: 'uid',
            order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
        },
    });

    self.name = new TextInput({
        allow_empty: false,
        placeholder: 'Anticipated Fund Name',
    });

    self.ordinal = new NumberInput({
        placeholder: 'Ordinal',
        allow_empty: false,
        format: 'no_format',
    });

    self.vintage = new NumberInput({
        placeholder: 'Vintage year',
        format: 'no_format',
    });

    self.fund_size = new NumberInput({
        placeholder: 'Fund Size',
        allow_empty: true,
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

    let _geographies = self.new_instance(EnumValuesForm, {
        attribute_identifier: 'geography',
        options_target: 'attribute:editable_data',
    });
    self.geography_popover = self.new_instance(NewPopoverButton, {
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

    let _styles = self.new_instance(EnumValuesForm, {
        attribute_identifier: 'style',
        options_target: 'attribute:editable_data',
    });
    self.style_popover = self.new_instance(NewPopoverButton, {
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

    let _sector = self.new_instance(EnumValuesForm, {
        attribute_identifier: 'sector',
        options_target: 'attribute:editable_data',
    });
    self.sector_popover = self.new_instance(NewPopoverButton, {
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

    self.can_create = ko.pureComputed(() => {
        return (
            self.name.can_submit() &&
            self.family.can_submit() &&
            self.ordinal.can_submit() &&
            self.vintage.can_submit()
        );
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/
    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        self.name.clear();
        self.family.clear();
        self.ordinal.clear();
        self.vintage.clear();
        self.fund_size.clear();
        self.currency.clear();
        self.geography_popover.popover.clear();
        self.style_popover.popover.clear();
        self.sector_popover.popover.clear();
        bison.helpers.close_modal(self.get_id());
    };

    Observer.register(self.family_event, data => {
        DataThing.backends.commander({
            url: 'get_family',
        })({
            data: {
                uid: data,
            },
            success: DataThing.api.XHRSuccess(data => {
                self.vintage.value(data.result.next_vintage);
                self.ordinal.value(data.result.next_ordinal);
                self.name.value(data.result.next_name);
                self.fund_size.value(data.result.next_fund_size);
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(error => {
                DataThing.status_check();
                alert(error);
            }),
        });
    });

    self._create_anticipated_fund = DataThing.backends.commander({
        url: 'update_anticipated_fund',
    });

    self.create_anticipated_fund = function() {
        let data = {
            name: self.name.value(),
            family_uid: self.family.value(),
            ordinal: self.ordinal.value(),
            vintage_year: self.vintage.value(),
            fund_size: self.fund_size.value(),
            currency_symbol: self.currency.value(),
            geography: self.geography_popover.popover.get_data(),
            sector: self.sector_popover.popover.get_data(),
            style: self.style_popover.popover.get_data(),
        };

        self._create_anticipated_fund({
            data: {
                updates: data,
            },
            success: DataThing.api.XHRSuccess(() => {
                self.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {
                self.loading(false);
            }),
        });
    };

    return self;
}
