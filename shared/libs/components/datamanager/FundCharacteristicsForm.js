/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import TextInput from 'src/libs/components/basic/TextInput';
import NumberInput from 'src/libs/components/basic/NumberInput';
import DataSource from 'src/libs/DataSource';
import AttributePopoverButton from 'src/libs/components/popovers/AttributePopoverButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import auth from 'auth';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_top_form_stack';

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.cashflow_type = opts.cashflow_type || 'net';

    self.is_remote_entity = opts.is_remote_entity || false;

    self.hl_deployment = opts.hl_deployment || false;

    self.datasource = self.new_instance(DataSource, {
        disable_cache: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:editable_characteristics',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    });

    self.name = self.new_instance(TextInput, {
        id: 'name',
        label: 'Fund Name',
        disabled_callback: () => self.is_remote_entity,
        initial_value_property: 'name',
        css: {
            'vertical-margins': true,
        },
        data: self.datasource.data,
        enable_data_updates: true,
        rateLimit: 500,
    });

    self.commitment = self.new_instance(NumberInput, {
        id: 'commitment',
        label: 'Commitment',
        disabled_callback: () => self.is_remote_entity,
        initial_value_property: 'commitment',
        css: {
            'vertical-margins': true,
        },
        enable_data_updates: true,
        data: self.datasource.data,
    });

    self.unfunded = self.new_instance(NumberInput, {
        id: 'unfunded',
        label: 'Unfunded',
        disabled_callback: () => self.is_remote_entity,
        initial_value_property: 'unfunded',
        css: {
            'vertical-margins': true,
        },
        enable_data_updates: true,
        data: self.datasource.data,
    });

    self.vintage_year = self.new_instance(NewDropdown, {
        id: 'vintage_year',
        label: 'Vintage Year',
        disabled_callback: () => self.is_remote_entity,
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
            no_selection: 'From Cash Flows',
        },
        selected: {
            data: self.datasource.data,
            mapping: 'get',
            mapping_args: {
                key: 'vintage_year',
            },
        },
    });

    self.pme = self.new_instance(NewDropdown, {
        id: 'pme',
        label: 'Default PME Index',
        disabled_callback: () => self.is_remote_entity,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:index_options',
            },
        },
        btn_css: {
            'btn-ghost-default': true,
            'vertical-margins': true,
        },
        selected: {
            data: self.datasource.data,
            mapping: 'get',
            mapping_args: {
                key: 'market_id',
            },
        },
    });
    if (auth.user_has_feature('hl_model_path')) {
        self.model_fund = self.new_instance(FilteredDropdown, {
            id: 'model_fund',
            label: 'Horizon Model Path',
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    label_key: 'name',
                    value_key: 'user_fund_uid',
                },
                query: {
                    target: 'vehicles',
                    results_per_page: 'all',
                    filters: {
                        type: 'dynamic',
                        query: {
                            entity_type: 'user_fund',
                            cashflow_type: 'net',
                            permissions: ['write', 'share', 'read'],
                        },
                    },
                    order_by: [
                        {
                            name: 'name',
                            sort: 'asc',
                        },
                    ],
                },
            },
            strings: {
                no_selection: 'Hamilton Lane Path',
            },
            btn_css: {
                'btn-ghost-default': true,
                'vertical-margins': true,
            },
            selected: {
                data: self.datasource.data,
                mapping: 'get',
                mapping_args: {
                    key: 'model_fund_uid',
                },
            },
        });
    }

    self.currency = self.new_instance(NewDropdown, {
        id: 'currency',
        label: 'Currency',
        option_disabled_property: 'invalid',
        disabled_callback: () => self.is_remote_entity,
        datasource: {
            mapping: 'to_options',
            mapping_args: {
                value_key: 'id',
                label_keys: ['symbol', 'name'],
                additional_keys: ['symbol', 'invalid'],
            },
            type: 'dynamic',
            query: {
                target: 'currency:markets',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
        btn_css: {
            'btn-ghost-default': true,
            'vertical-margins': true,
        },
        selected: {
            data: self.datasource.data,
            mapping: 'get',
            mapping_args: {
                key: 'base_currency_id',
            },
        },
    });

    self.forms = ko.observableArray([]);

    self.entity_attributes = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'entity:editable_attributes',
                entity_type: 'user_fund',
                entity_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                public_taxonomy: true,
                exclude_identifiers: ['status', 'vertical'],
            },
        },
    });

    self.handle_attribute = function(attribute) {
        let form = self.new_instance(AttributePopoverButton, {
            attribute_uid: attribute.uid,
            disabled_callback: () => self.is_remote_entity,
            name: attribute.name,
            entity_type: 'user_fund',
            entity_uid: self.vehicle_uid(),
            btn_css: {
                'vertical-margins': true,
            },
            popover_placement: 'bottom',
            enable_add_member: false,
            permanent_attribute: true,
        });

        self.when(form).done(() => {
            self.forms.push(form);
        });
    };

    self._save_user_fund_attribute = DataThing.backends.useractionhandler({
        url: 'save_user_fund_attribute',
    });

    self.register_attribute = function(attribute_key, evt, id) {
        Observer.register_for_id(id, evt, value => {
            self._save_user_fund_attribute({
                data: {
                    user_fund_uid: self.vehicle_uid(),
                    key: attribute_key,
                    value: Utils.get(value),
                },
                success: DataThing.api.XHRSuccess(() => {}),
                error: DataThing.api.XHRError(() => {}),
            });
        });
    };

    self.form_layout = ko.computed(() => {
        const layout = [
            self.name,
            self.commitment,
            self.unfunded,
            self.vintage_year,
            self.pme,
            self.currency,
        ].concat(self.forms());

        if (self.hl_deployment && auth.user_has_feature('hl_model_path')) {
            layout.push(self.model_fund);
        }
        return layout;

        // .inGroupsOf(3).map(function(group) {
        //     return group.compact();
        // })
    });

    self.column_css = 'col-xs-12';

    self.clear = function() {
        self.form_layout.flatten().forEach(component => {
            component.clear();
        });
    };

    self.when(...self.form_layout(), self.entity_attributes).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
            self.datasource.refresh_data(true);
        });

        Observer.register_many(DataManagerHelper.events.upload_success_event, () => {
            self.datasource.refresh_data(true);
        });

        self.entity_attributes.data.subscribe(attributes => {
            self.forms([]);

            if (attributes) {
                for (let i = 0, l = attributes.length; i < l; i++) {
                    self.handle_attribute(attributes[i]);
                }
            }
        });

        self.register_attribute('name', 'TextInput.value', self.name.get_id());
        self.register_attribute('vintage_year', 'Dropdown.value', self.vintage_year.get_id());
        self.register_attribute('commitment', 'NumberInput.value', self.commitment.get_id());
        self.register_attribute('unfunded', 'NumberInput.value', self.unfunded.get_id());
        self.register_attribute('market_id', 'Dropdown.value', self.pme.get_id());
        self.register_attribute('base_currency_id', 'Dropdown.value', self.currency.get_id());
        if (auth.user_has_feature('hl_model_path')) {
            self.register_attribute('model_fund_uid', 'Dropdown.value', self.model_fund.get_id());
        }

        _dfd.resolve();
    });

    return self;
}
