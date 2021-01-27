import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import TextInput from 'src/libs/components/basic/TextInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import DateInput from 'src/libs/components/basic/DateInput';
import * as Constants from 'src/libs/Constants';
import PercentInput from 'src/libs/components/basic/PercentInput';
import ko from 'knockout';
import AttributePopoverButton from 'src/libs/components/popovers/AttributePopoverButton';

class ProvisionalFundForm extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.define_template(`
        <div class="row">
            <div class"col-md-12 new-world-form fund-characteristics-form">
                <table>
                    <tr>
                        <td style="width: 50%">
                            <h3 style="padding-left:20px">Attributes</h3>
                        </td>
                        <td style="width: 50%">
                            <h3 style="padding-left:20px">Performance Metrics</h3>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 50%; vertical-align:top;">
                            <div class="col-md-12 new-world-form fund-characteristics-form">
                                <!-- ko foreach: $data.attributes_layout -->
                                <div class="row row-margins">
                                    <div data-bind="css: $parent.column_css">
                                        <!-- ko renderComponent: $data --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                                <!-- ko if: $data.button -->
                                <div class="row row-margins">
                                    <div class="col-md-12">
                                        <!-- ko renderComponent: button --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                                <!-- ko foreach: $data.enum_layout -->
                                <div class="row row-margins">
                                    <div data-bind="css: $parent.column_css">
                                        <!-- ko renderComponent: $data --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                                <!-- ko if: $data.button -->
                                <div class="row row-margins">
                                    <div class="col-md-12">
                                        <!-- ko renderComponent: button --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                            </div>
                        </td>
                        <td style="width:50%; vertical-align:top;">
                            <div class="col-md-12 new-world-form fund-characteristics-form">
                                <!-- ko foreach: $data.performance_layout -->
                                <div class="row row-margins">
                                    <div data-bind="css: $parent.column_css">
                                        <!-- ko renderComponent: $data --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                                <!-- ko if: $data.button -->
                                <div class="row row-margins">
                                    <div class="col-md-12">
                                        <!-- ko renderComponent: button --><!-- /ko -->
                                    </div>
                                </div>
                                <!-- /ko -->
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <!-- ko if: $data.submit_text -->
                            <div class="col-md-12">
                                <button
                                    class="btn btn-success pull-right"
                                    data-bind="click: create_or_update_fund, text: submit_text">
                                </button>
                            </div>
                            <!-- /ko -->
                            <!-- ko ifnot: $data.submit_text --><!-- /ko -->
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        `);

        this.is_remote_entity = opts.is_remote_entity || false;

        this.project_uid_event = opts.project_uid_event;
        this.project_uid = Observer.observable(this.project_uid_event);
        this.user_fund_uid_event = opts.user_fund_uid_event || {};
        this.user_fund_uid = Observer.observable(this.user_fund_uid_event);

        this.submit_text = opts.submit_text || 'Generate Provisional Fund';
        this.modal_id = opts.modal_id;

        this.name = this.new_instance(TextInput, {
            id: 'name',
            label: 'Fund Name',
            allow_empty: false,
            initial_value_property: 'name',
            css: {
                'vertical-margins': true,
            },
            enable_data_updates: true,
            rateLimit: 500,
            datasource: this.gen_fund_datasource(),
        });

        this.commitment = this.new_instance(NumberInput, {
            id: 'commitment',
            label: 'Commitment',
            format: 'money',
            initial_value_property: 'commitment',
            css: {
                'vertical-margins': true,
            },
            enable_data_updates: true,
            datasource: this.gen_fund_datasource(),
        });

        this.unfunded = this.new_instance(NumberInput, {
            id: 'unfunded',
            label: 'Unfunded',
            format: 'money',
            initial_value_property: 'unfunded',
            css: {
                'vertical-margins': true,
            },
            enable_data_updates: true,
            datasource: this.gen_fund_datasource(),
        });

        this.vintage_year = this.new_instance(NewDropdown, {
            id: 'vintage_year',
            label: 'Vintage Year',
            datasource: {
                type: 'static',
                mapping: 'list_to_options',
                data: Utils.valid_vintage_years(),
            },
            btn_css: {
                'btn-ghost-default': true,
                'vertical-margins': true,
            },
            strings: {
                no_selection: 'Select Year',
            },
            selected: {
                datasource: this.gen_fund_datasource(),
                mapping: 'get',
                mapping_args: {
                    key: 'vintage_year',
                },
            },
        });

        this.base_currency_id = this.new_instance(NewDropdown, {
            id: 'base_currency_id',
            label: 'Currency',
            initial_value_property: 'symbol',
            datasource: {
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    value_key: 'id',
                    label_keys: ['symbol', 'name'],
                    additional_keys: ['symbol', 'invalid'],
                },
                query: {
                    target: 'currency:markets',
                },
            },
            btn_css: {
                'vertical-margins': true,
                'btn-ghost-default': true,
            },
            selected: {
                datasource: {
                    key: 'base_currency',
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:currency_id',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: this.user_fund_uid_event,
                        },
                    },
                },
            },
        });

        this.tvpi = this.new_instance(NumberInput, {
            id: 'tvpi',
            label: 'TVPI',
            format: 'multiple',
            css: {
                'vertical-margins': true,
            },
            initial_value_property: 'tvpi',
            datasource: this.gen_fund_datasource(),
        });

        this.as_of_date = this.new_instance(DateInput, {
            id: 'as_of_date',
            label: 'As of Date',
            limit_error: true,
            max_value: Constants.max_backend_timestamp,
            min_value: Constants.min_backend_timestamp,
            css: {
                'vertical-margins': true,
            },
            initial_value_property: 'as_of_date',
            datasource: this.gen_fund_datasource(),
        });

        this.irr = this.new_instance(PercentInput, {
            id: 'irr',
            label: 'IRR',
            css: {
                'vertical-margins': true,
            },
            initial_value_property: 'irr',
            datasource: this.gen_fund_datasource(),
        });

        this.rvpi = this.new_instance(NumberInput, {
            id: 'rvpi',
            label: 'RVPI',
            format: 'multiple',
            css: {
                'vertical-margins': true,
            },
            initial_value_property: 'rvpi',
            datasource: this.gen_fund_datasource(),
        });

        this.dpi = this.new_instance(NumberInput, {
            id: 'dpi',
            label: 'DPI',
            format: 'multiple',
            css: {
                'vertical-margins': true,
            },
            initial_value_property: 'dpi',
            datasource: this.gen_fund_datasource(),
        });

        this.performance_layout = opts.performance_layout || [
            this.irr,
            this.tvpi,
            this.rvpi,
            this.dpi,
            this.as_of_date,
        ];

        this.attributes_layout = opts.attributes_layout || [
            this.name,
            this.commitment,
            this.unfunded,
            this.vintage_year,
            this.base_currency_id,
        ];

        this.column_css = 'col-xs-12';

        this.clear = function() {
            this.attributes_layout.map(component => {
                component.clear();
            });
            this.performance_layout.map(component => {
                component.clear();
            });
            this.enum_layout().map(component => {
                component.popover.clear_all();
            });
        };

        this._create_or_update_fund = DataThing.backends.useractionhandler({
            url: 'create_or_update_fund',
        });

        this.extract_form_values = function(layout) {
            const pairs = {};
            layout.map(item => {
                const id = item.id;
                pairs[id] = item.value();
            });
            return pairs;
        };

        this.create_or_update_fund = function() {
            const data = {
                attributes: this.extract_form_values(this.attributes_layout),
                performance_metrics: this.extract_form_values(this.performance_layout),
                project_uid: this.project_uid(),
                user_fund_uid: this.user_fund_uid(),
            };
            this._create_or_update_fund({
                data: data,
                success: DataThing.api.XHRSuccess(entity_uid => {
                    // notification for new fund creation use case
                    if (!data.user_fund_uid) {
                        bison.utils.Notify(
                            'Success!',
                            'You have added a new fund to your diligence report!',
                            'alert-success',
                        );
                    }
                    for (const attribute of this.enum_layout()) {
                        attribute.popover.save_all(entity_uid);
                    }
                    if (!this.modal_id) {
                        this.clear();
                    }
                    DataThing.status_check();
                }),
                error: DataThing.api.XHRError(() => {}),
            });
            if (this.modal_id) {
                // handling modal dismissal of form if rendered within modal
                bison.helpers.close_modal(this.modal_id);
            }
        };

        this.enum_layout = ko.observableArray([]);

        this._attributes_data = DataThing.backends.dataprovider({
            url: 'attribute_filter_configs',
        });

        this._attributes_data_with_entity = DataThing.backends.dataprovider({
            url: 'editable_attributes_for_entity',
        });

        this.when(...this.attributes_layout, ...this.performance_layout).done(() => {
            if (Utils.is_set(this.user_fund_uid_event, true)) {
                Observer.register(this.user_fund_uid_event, uid => {
                    if (uid) {
                        this._attributes_data_with_entity({
                            data: {
                                public_taxonomy: true,
                                entity_type: 'user_fund',
                                entity_uid: uid,
                            },
                            success: DataThing.api.XHRSuccess(attributes => {
                                this.enum_layout([]);
                                for (const attr of attributes.result) {
                                    this.handle_attribute(attr);
                                }
                            }),
                        });
                    }
                });
            } else {
                this._attributes_data({
                    data: {
                        public_taxonomy: true,
                    },
                    success: DataThing.api.XHRSuccess(attributes => {
                        this.enum_layout([]);
                        for (const attr of attributes.result) {
                            this.handle_attribute(attr);
                        }
                    }),
                });
            }

            _dfd.resolve();
        });
    }

    gen_fund_datasource() {
        return {
            disable_cache: true,
            type: 'dynamic',
            query: {
                target: 'vehicle:overview',
                user_fund_uid: {
                    type: 'observer',
                    event_type: this.user_fund_uid_event,
                    required: true,
                },
            },
        };
    }

    handle_attribute(attribute) {
        const form = this.new_instance(AttributePopoverButton, {
            attribute_uid: attribute.uid,
            name: attribute.name,
            entity_type: 'user_fund',
            entity_uid: this.user_fund_uid(),
            btn_css: {
                'vertical-margins': true,
            },
            popover_placement: 'bottom',
            permanent_attribute: true,
            auto_save: false,
        });
        this.when(form).done(() => {
            this.enum_layout.push(form);
        });
    }
}

export default ProvisionalFundForm;
