/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TextInput from 'src/libs/components/basic/TextInput';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_top_form';

    self.market_id_event = opts.market_id_event || {};
    self.market_id = ko.observable();

    self.name = self.new_instance(TextInput, {
        id: 'name',
        label: 'Index Name',
        initial_value_property: 'name',
        disabled_property: '!write',
        enable_data_updates: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'index:data',
                include_prices: false,
                market_id: {
                    type: 'observer',
                    event_type: self.market_id_event,
                    required: true,
                },
            },
        },
    });

    self._save_user_fund_attribute = DataThing.backends.useractionhandler({
        url: 'update_user_market',
    });

    self.register_attribute = function(attribute_key, evt, id) {
        Observer.register_for_id(id, evt, value => {
            self._save_user_fund_attribute({
                data: {
                    market_id: self.market_id(),
                    name: Utils.get(value),
                },
                success: DataThing.api.XHRSuccess(() => {}),
                error: DataThing.api.XHRError(() => {}),
            });
        });
    };

    self.form_layout = [[self.name]];

    self.column_css = 'col-xs-12';

    self.clear = function() {
        self.form_layout.flatten().forEach(component => {
            component.clear();
        });
    };

    self.when(self.name).done(() => {
        Observer.register(self.market_id_event, id => {
            self.market_id(id);
        });

        self.register_attribute('name', 'TextInput.value', self.name.get_id());

        _dfd.resolve();
    });

    return self;
}
