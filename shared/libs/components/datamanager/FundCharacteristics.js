/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import FundCharacteristicsForm from 'src/libs/components/datamanager/FundCharacteristicsForm';
import FundDataStatsWidget from 'src/libs/components/datamanager/FundDataStatsWidget';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_characteristics';

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();
    self.custom_characteristics = ko.observableArray();
    self.is_remote_entity = opts.is_remote_entity;

    self.cashflow_type = opts.cashflow_type || 'net';

    self.form = self.new_instance(FundCharacteristicsForm, {
        id: 'charateristics_form',
        vehicle_uid_event: self.vehicle_uid_event,
        cashflow_type: self.cashflow_type,
        is_remote_entity: self.is_remote_entity,
        hl_deployment: opts.hl_deployment,
    });

    self.update_attribute_value = DataThing.backends.useractionhandler({
        url: 'update_attribute_value',
    });

    self.custom_attributes_form = ko.observableArray([]);

    self.update_attribute_value_callback = function(uid) {
        return function(value) {
            let selected_member_uid = value ? value.uid : null;

            self.update_attribute_value({
                data: {
                    attribute_uid: uid,
                    entity_type: 'user_fund',
                    entity_uid: self.vehicle_uid(),
                    selected_member_uid: selected_member_uid,
                },
                success: DataThing.api.XHRSuccess(() => {}),
            });
        };
    };

    self.update_characteristics_form = function(characteristics) {
        let dropdowns = [];
        if (characteristics && characteristics.length) {
            for (let item of characteristics) {
                let uid = item.data.uid;
                let label = item.label;
                let members = item.data.members;
                let selected_member_uid = item.data.selected_member_uid;

                let _dropdown = new NewDropdown({
                    label: label,
                    data: members,
                    label_key: 'name',
                    value_key: 'uid',
                    btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'vertical-margins': true,
                    },
                });

                if (selected_member_uid) {
                    _dropdown.set_selected_by_value(selected_member_uid);
                }

                Observer.register_for_id(
                    _dropdown.get_id(),
                    'Dropdown.value',
                    self.update_attribute_value_callback(uid),
                );

                dropdowns.push(_dropdown);
            }
        }

        self.custom_attributes_form(dropdowns);
    };

    self.metadata = self.new_instance(FundDataStatsWidget, {
        entity_type: 'user_fund',
        cashflow_type: self.cashflow_type,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:data_stats',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    });

    self.strings = {
        form_title: 'Fund Attributes',
        metadata_title: 'Fund Summary',
    };

    $.when($.when(...self.form.dfds), $.when(...self.metadata.dfds)).done(() => {
        if (opts.characteristics_event) {
            Observer.register(opts.characteristics_event, self.update_characteristics_form);
        }

        Observer.register(self.vehicle_uid_event, self.vehicle_uid);

        _dfd.resolve();
    });

    return self;
}
