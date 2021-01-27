/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import AttributeValueForm from 'src/libs/components/datamanager/AttributeValueForm';
import Observer from 'src/libs/Observer';
import {format_array} from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let dfd = self.new_deferred();

    self.template = opts.template || 'tpl_attribute_values_form';

    self.attribute_uid = opts.attribute_uid;
    self.attribute_identifier = opts.attribute_identifier;
    self.attribute_name = opts.name;

    self.entity_type = opts.entity_type;
    self.entity_uid = opts.entity_uid;

    self.popover_placement = opts.popover_placement;

    self.permanent_attribute = opts.permanent_attribute || false;
    self.enable_add_member = opts.enable_add_member || false;
    self.auto_save = opts.auto_save;
    self.refresh_event = opts.refresh_event;

    self.values = ko.observableArray([]);

    self.num_values = ko.pureComputed(() => {
        return self.values().length;
    });

    self.text_value = ko.pureComputed(() => {
        let values = self.values();

        let strings = [];

        for (let i = 0, l = values.length; i < l; i++) {
            let text_value;

            if (l == 1) {
                text_value = values[i].full_text_value();
            } else {
                text_value = values[i].text_value();
            }

            if (text_value) {
                strings.push(text_value);
            }
        }

        strings = strings.unique();

        if (strings.length > 0) {
            return format_array(strings, 3, 'other');
        }

        return 'N/A';
    });

    self.full_text_value = ko.pureComputed(() => {
        let values = self.values();

        let strings = [];

        for (let i = 0, l = values.length; i < l; i++) {
            let text_value = values[i].full_text_value();

            if (text_value) {
                strings.push(text_value);
            }
        }

        strings = strings.unique();

        if (strings.length > 0) {
            return format_array(strings, 3, 'other');
        }

        return 'N/A';
    });

    self.can_add = ko.pureComputed(() => {
        return self.values().every(value => {
            return value.text_value();
        });
    });

    self.add_value = function(data) {
        data = data || {};

        let value = self.new_instance(AttributeValueForm, {
            refresh_event: self.refresh_event,
            attribute_uid: self.attribute_uid,
            attribute_identifier: self.attribute_identifier,
            attribute_value_uid: data.uid,
            attribute_member_uid: data.attribute_member_uid,
            value: data.value,
            entity_type: self.entity_type,
            entity_uid: self.entity_uid,
            num_values: self.num_values,
            enable_add_member: self.enable_add_member,
            auto_save: self.auto_save,
        });

        self.values.push(value);

        Observer.register_for_id(value.get_id(), 'AttributeValueForm.remove_value', () => {
            self.values.remove(value);

            let values = self.values.peek();

            if (values.length <= 0) {
                if (self.permanent_attribute) {
                    self.add_value();
                } else {
                    Observer.broadcast_for_id(
                        self.get_id(),
                        'AttributeValuesForm.remove_attribute',
                    );
                }
            } else if (values.length === 1) {
                if (typeof values[0].input.clear_weight === 'function') {
                    values[0].input.clear_weight();
                    values[0].save();
                }
            }
        });
    };

    self.save_all = function(entity_uid) {
        self.values().forEach(value => {
            value.save(entity_uid);
        });
    };

    self.remove_all = function() {
        let values = self.values();

        for (let i = 0, l = values.length; i < l; i++) {
            values[i]._remove(false);
        }

        self.values([]);

        if (self.permanent_attribute) {
            self.add_value();
        } else {
            Observer.broadcast_for_id(self.get_id(), 'AttributeValuesForm.remove_attribute');
        }
    };

    self.clear_all = function() {
        for (const value of self.values()) {
            value.input.dropdowns.clear();
        }
    };

    if (self.entity_uid) {
        self.values_datasource = self.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'entity:editable_attribute_values',
                    entity_type: self.entity_type,
                    entity_uid: self.entity_uid,
                    attribute_uid: self.attribute_uid,
                    attribute_identifier: self.attribute_identifier,
                },
            },
        });
    } else {
        self.values_datasource = undefined;
    }

    self.update_values = function(values) {
        self.values([]);

        if (values && values.length > 0) {
            for (let i = 0, l = values.length; i < l; i++) {
                self.add_value(values[i]);
            }
        } else {
            self.add_value();
        }
    };

    if (self.values_datasource) {
        if (self.refresh_event) {
            Observer.register(self.refresh_event, () => {
                self.values_datasource.refresh_data(true);
            });
        }

        self.values_datasource.data.subscribe(self.update_values);
        self.update_values(self.values_datasource.data());
    } else {
        self.update_values();
    }
    dfd.resolve();

    return self;
}
