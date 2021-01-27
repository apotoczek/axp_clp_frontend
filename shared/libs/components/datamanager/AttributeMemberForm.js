/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TextInput from 'src/libs/components/basic/TextInput';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.refresh_event = opts.refresh_event;

    self.attribute_uid_event = opts.attribute_uid_event;

    self.template = opts.template || 'tpl_data_manager_top_form';

    self.name = self.new_instance(TextInput, {
        id: 'name',
        label: 'Name',
    });

    self.parent = self.new_instance(FilteredDropdown, {
        id: 'parent',
        label: 'Parent Value',
        btn_css: {
            btn: true,
            'btn-ghost-default': true,
        },
        value_key: 'uid',
        label_key: 'name',
        refresh_event: self.refresh_event,
        datasource: {
            type: 'dynamic',
            key: 'members',
            query: {
                target: 'attribute:data',
                attribute_uid: {
                    type: 'observer',
                    event_type: self.attribute_uid_event,
                    required: true,
                },
                tree_mode: false,
                include_members: true,
            },
        },
        enable_add: false,
    });

    self.button = self.new_instance(ActionButton, {
        id: 'add_value',
        label: 'Add Value',
        action: 'add_value',
        css: {
            btn: true,
            'btn-ghost-default': true,
            'btn-sm': true,
            'pull-right': true,
        },
    });

    self.form_layout = [[self.name, self.parent]];

    self.column_css = 'col-xs-6';

    self.clear = function() {
        self.form_layout.flatten().forEach(component => {
            component.clear();
        });
    };

    self.when(self.name, self.button).done(() => {
        Observer.register_for_id(self.button.get_id(), 'ActionButton.action.add_value', () => {
            Observer.broadcast_for_id(self.get_id(), 'AttributeMemberForm.add_member', {
                name: self.name.value(),
                parent_uid: self.parent.selected_value(),
            });
        });

        self.dfd.resolve();
    });

    return self;
}
