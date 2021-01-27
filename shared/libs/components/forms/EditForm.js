/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import DataThing from 'src/libs/DataThing';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import TextInput from 'src/libs/components/basic/TextInput';
import DateInput from 'src/libs/components/basic/DateInput';
import Dropdown from 'src/libs/components/basic/NewDropdown';
import NumberInput from 'src/libs/components/basic/NumberInput';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_edit_form';

    let dfd = self.new_deferred();

    self.reset_event = opts.reset_event;

    self.send_success_data = opts.send_success_data || false;

    self.init_text_field = function(opts) {
        let input = new TextInput(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            can_submit: input.can_submit,
            update: function(data) {
                input.value(data);
            },
        };
    };

    self.init_date_field = function(opts) {
        let input = new DateInput(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            can_submit: input.can_submit,
            update: function(data) {
                input.value(data);
            },
        };
    };

    self.init_dropdown = function(opts) {
        let input = new Dropdown(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            update: function(data) {
                input.set_selected_by_value(data);
            },
        };
    };

    self.init_number_input = function(opts) {
        let input = new NumberInput(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            can_submit: input.can_submit,
            update: function(data) {
                input.value(data);
            },
        };
    };

    self.init_filtered_dropdown = function(opts) {
        let input = new FilteredDropdown(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            update: function(data) {
                input.set_selected_by_value(data);
            },
        };
    };

    self.init_new_popover_button = function(opts) {
        let input = new NewPopoverButton(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: function() {
                return input.popover.get_data();
            },
            key: opts.key,
            update: function() {},
        };
    };

    self.init_boolean_button = function(opts) {
        let input = new BooleanButton(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.state,
            key: opts.key,
            update: function(data) {
                input.state(data);
            },
        };
    };

    self.init_new_typeahead_input = function(opts) {
        let input = new TypeaheadInput(opts.input_options || {});

        return {
            label: opts.label,
            input: input,
            value: input.value,
            key: opts.key,
            update: function() {
                window.typeahead = input;
            },
        };
    };

    self.init_field = function(opts) {
        switch (opts.input_type) {
            case 'date':
                return self.init_date_field(opts);
            case 'number':
                return self.init_number_input(opts);
            case 'boolean':
                return self.init_boolean_button(opts);
            case 'dropdown':
                return self.init_dropdown(opts);
            case 'filtered_dropdown':
                return self.init_filtered_dropdown(opts);
            case 'new_popover_button':
                return self.init_new_popover_button(opts);
            case 'typeahead':
                return self.init_new_typeahead_input(opts);
            default:
                return self.init_text_field(opts);
        }
    };

    self.fields = ko.observableArray([]);

    self._dfds = [];

    for (let i = 0, l = opts.fields.length; i < l; i++) {
        let field = self.init_field(opts.fields[i]);

        self._dfds.push(...field.input.dfds);

        self.fields.push(field);
    }

    self.num_columns = opts.num_columns || 2;

    self.col_css = `col-xs-${12 / opts.num_columns}`;

    self.groups = ko.pureComputed(() => {
        return self.fields().inGroups(self.num_columns);
    });

    self.uid_key = opts.uid_key || 'uid';
    self.success_event = opts.success_event;
    self.cancel_event = opts.cancel_event;

    self.save_endpoint = DataThing.backends[opts.backend]({
        url: opts.endpoint,
    });

    self.update_fields = function(data) {
        if (data) {
            let fields = self.fields();
            for (let i = 0, l = fields.length; i < l; i++) {
                fields[i].update(data[fields[i].key]);
            }
        }
    };

    self.data.subscribe(self.update_fields);

    self.updates = ko.pureComputed(() => {
        let updates = {};
        let fields = self.fields();

        for (let i = 0, l = fields.length; i < l; i++) {
            updates[fields[i].key] = fields[i].value();
        }

        return updates;
    });

    self.uid = ko.pureComputed(() => {
        let data = self.data();

        if (data && data[self.uid_key]) {
            return data[self.uid_key];
        }
    });

    self.valid = ko.computed(() => {
        let fields = self.fields();
        for (let i = 0; i < fields.length; i++) {
            if (
                (fields[i].input.can_submit && !fields[i].input.can_submit()) ||
                (fields[i].input.valid && !fields[i].input.valid())
            ) {
                return false;
            }
        }
        return true;
    });

    self.save = function() {
        let uid = self.uid();
        if (self.valid() && uid) {
            self.save_endpoint({
                data: {
                    uid: uid,
                    updates: self.updates(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    if (self.success_event) {
                        if (self.send_success_data) {
                            let data = self.data();
                            Observer.broadcast(self.success_event, data);
                        } else {
                            Observer.broadcast(self.success_event);
                        }
                    }
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    };

    self.reset = function() {
        self.update_fields(self.data());
    };

    self.cancel = function() {
        self.reset();
        if (self.cancel_event) {
            Observer.broadcast(self.cancel_event);
        }
    };
    if (self.reset_event) {
        Observer.register(self.reset_event, () => {
            let fields = self.fields();
            for (let i = 0; i < fields.length; i++) {
                fields[i].input.clear();
            }
            self.data({});
        });
    }

    $.when(...self._dfds).done(() => {
        dfd.resolve();
    });

    return self;
}
