/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TextInput from 'src/libs/components/basic/TextInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_top_form';

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.is_remote_entity = opts.is_remote_entity;

    self.datasource = self.new_instance(DataSource, {
        disable_cache: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:editable_characteristics',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    });

    self.vehicle_name = self.new_instance(TextInput, {
        id: 'vehicle_name',
        label: 'Portfolio Name',
        disabled_callback: () => self.is_remote_entity,
        initial_value_property: 'name',
        css: {
            'vertical-margins': true,
        },
        enable_data_updates: true,
        data: self.datasource.data,
        rateLimit: 500,
    });

    self.currency = self.new_instance(NewDropdown, {
        id: 'currency',
        label: 'Currency',
        disabled_callback: () => self.is_remote_entity,
        option_disabled_property: 'invalid',
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
                portfolio_uid: {
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

    self._save_portfolio_attribute = DataThing.backends.useractionhandler({
        url: 'save_portfolio_attribute',
    });

    self.form_layout = [[self.vehicle_name, self.currency, self.pme]];

    self.column_css = 'col-xs-12';

    self.clear = function() {
        self.form_layout.flatten().forEach(component => {
            component.clear();
        });
    };

    self.when(self.vehicle_name, self.currency, self.pme).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
            self.datasource.refresh_data(true);
        });

        Observer.register_many(DataManagerHelper.events.upload_success_event, () => {
            self.datasource.refresh_data(true);
        });

        self.save = function(key, value) {
            self._save_portfolio_attribute({
                data: {
                    portfolio_uid: self.vehicle_uid(),
                    key: key,
                    value: Utils.get(value),
                },
                success: DataThing.api.XHRSuccess(() => {}),
                error: DataThing.api.XHRError(() => {}),
            });
        };

        Observer.register_for_id(self.currency.get_id(), 'Dropdown.value', value => {
            self.save('base_currency_id', value);
        });

        Observer.register_for_id(self.vehicle_name.get_id(), 'TextInput.value', value => {
            self.save('name', value);
        });

        Observer.register_for_id(self.pme.get_id(), 'Dropdown.value', value => {
            self.save('market_id', value);
        });

        _dfd.resolve();
    });

    return self;
}
