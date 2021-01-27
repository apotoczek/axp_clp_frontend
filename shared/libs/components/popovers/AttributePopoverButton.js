/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import AttributeValuesForm from 'src/libs/components/datamanager/AttributeValuesForm';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let dfd = self.new_deferred();

    self.template = opts.template || 'tpl_attribute_popover_button';

    self.permanent_attribute = opts.permanent_attribute || false;
    self.enable_add_member = opts.enable_add_member || false;

    self.entity_type = opts.entity_type;
    self.attribute_uid = opts.attribute_uid;
    self.attribute_identifier = opts.attribute_identifier;
    self.attribute_name = opts.name || opts.label;
    self.auto_save = opts.auto_save !== false;
    self._btn_css = opts.btn_css;

    self._disabled_callback = opts.disabled_callback;

    self.read_only = ko.observable(false);

    self.btn_css = ko.pureComputed(() =>
        Object.assign({}, self._btn_css, {
            disabled: self.disabled(),
        }),
    );

    if (opts.entity_uid || !self.auto_save) {
        self.entity_uid = opts.entity_uid;
        self.popover_placement = opts.popover_placement;
        self.popover = self.new_instance(AttributeValuesForm, {
            refresh_event: opts.refresh_event,
            attribute_uid: self.attribute_uid,
            attribute_identifier: self.attribute_identifier,
            name: self.attribute_name,
            entity_type: self.entity_type,
            entity_uid: self.entity_uid,
            popover_placement: self.popover_placement,
            permanent_attribute: self.permanent_attribute,
            enable_add_member: self.enable_add_member,
            auto_save: self.auto_save,
        });
        self.when(self.popover).done(() => {
            dfd.resolve();
        });
    } else {
        self.popover = ko.observable();
        self.entity_uid = ko.observable();

        self.popover_placement = ko.observable('bottom');

        self.entity_uid.subscribe(entity_uid => {
            let instance = self.new_instance(AttributeValuesForm, {
                refresh_event: opts.refresh_event,
                attribute_uid: self.attribute_uid,
                attribute_identifier: self.attribute_identifier,
                name: self.attribute_name,
                entity_type: self.entity_type,
                entity_uid: entity_uid,
                popover_placement: self.popover_placement,
                permanent_attribute: self.permanent_attribute,
                enable_add_member: self.enable_add_member,
            });

            self.when(instance).done(() => {
                self.popover(instance);
            });
        });

        self.btn_css = ko.pureComputed(() => {
            if (self.popover_placement() == 'top') {
                return {
                    dropup: true,
                };
            }
            return {
                dropup: false,
            };
        });

        self._table_placement = function(placement) {
            self.popover_placement(placement == 'bottom' ? 'top' : 'bottom');
        };

        dfd.resolve();
    }

    self.disabled = ko.pureComputed(() => {
        let data = self.data();

        if (self._disabled_callback) {
            return self._disabled_callback(data);
        }

        return false;
    });

    return self;
}
