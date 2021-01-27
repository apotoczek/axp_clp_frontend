/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import AttributeMemberPicker from 'src/libs/components/datamanager/AttributeMemberPicker';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_attribute_value_form';

    self._set_attribute_value = DataThing.backends.useractionhandler({
        url: 'set_attribute_value',
    });

    self.attribute_uid = opts.attribute_uid;
    self.attribute_identifier = opts.attribute_identifier;

    self.num_values = opts.num_values;

    self.enable_add_member = opts.enable_add_member || false;
    self.auto_save = opts.auto_save;

    self.attribute_value_uid = ko.observable(opts.attribute_value_uid);

    self.entity_type = opts.entity_type;
    self.entity_uid = opts.entity_uid;

    self.input = self.new_instance(AttributeMemberPicker, {
        attribute_uid: self.attribute_uid,
        attribute_identifier: self.attribute_identifier,
        attribute_member_uid: opts.attribute_member_uid,
        value: opts.value,
        num_values: self.num_values,
        enable_add_member: self.enable_add_member,
    });

    self.get_attribute_member_uid = function() {
        return self.input.selected();
    };

    self.valid = ko.pureComputed(() => {
        return self.input.has_selected();
    });

    self.text_value = ko.pureComputed(() => {
        return self.input.selected_text();
    });

    self.full_text_value = ko.pureComputed(() => {
        return self.input.full_selected_text();
    });
    if (self.auto_save) {
        setTimeout(() => {
            self.input.selected.subscribe(() => {
                self.save();
            });

            self.input.value.subscribe(() => {
                self.save();
            });
        }, 500);
    }

    self.remove = function() {
        self._remove(true);
    };

    self._remove = function(broadcast) {
        let attribute_value_uid = self.attribute_value_uid();

        if (attribute_value_uid) {
            self._set_attribute_value({
                data: {
                    attribute_uid: self.attribute_uid,
                    attribute_identifier: self.attribute_identifier,
                    attribute_value_uid: attribute_value_uid,
                    entity_type: self.entity_type,
                    entity_uid: self.entity_uid,
                    delete: true,
                },
                success: DataThing.api.XHRSuccess(() => {}),
            });
        }

        if (broadcast) {
            Observer.broadcast_for_id(self.get_id(), 'AttributeValueForm.remove_value');
        }
    };

    self.save = function(uid) {
        if (self.valid()) {
            const entity_uid = self.entity_uid || uid;
            let data = {
                attribute_uid: self.attribute_uid,
                attribute_identifier: self.attribute_identifier,
                attribute_value_uid: self.attribute_value_uid(),
                entity_type: self.entity_type,
                entity_uid: entity_uid,
                value: self.input.value() || null,
                attribute_member_uid: self.get_attribute_member_uid(),
            };

            self._set_attribute_value({
                data: data,
                success: DataThing.api.XHRSuccess(attribute_value_uid => {
                    self.attribute_value_uid(attribute_value_uid);
                }),
            });
        }
    };

    self.when(self.input).done(() => {
        _dfd.resolve();
    });

    return self;
}
