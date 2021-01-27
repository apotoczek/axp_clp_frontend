/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TieredDropdown from 'src/libs/components/basic/TieredDropdown';
import PercentInput from 'src/libs/components/basic/PercentInput';
import DataSource from 'src/libs/DataSource';
import * as Formatters from 'src/libs/Formatters';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _____dfd = self.new_deferred();

    self.template = opts.template || 'tpl_attribute_member_form';

    self._add_attribute_member = DataThing.backends.useractionhandler({
        url: 'add_attribute_member',
    });

    self.attribute_uid = opts.attribute_uid;
    self.attribute_identifier = opts.attribute_identifier;
    self.num_values = opts.num_values;

    self.enable_add_member = opts.enable_add_member || false;

    self.datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            key: 'members',
            query: {
                target: 'attribute:editable_data',
                attribute_uid: self.attribute_uid,
                attribute_identifier: self.attribute_identifier,
                include_members: true,
                tree_mode: false,
            },
        },
    });

    self.options = ko.pureComputed(() => {
        let members = self.datasource.data();

        if (members) {
            let options = {
                root: [],
                parent_map: {},
                names: {},
            };

            for (let i = 0, l = members.length; i < l; i++) {
                let member = {
                    name: members[i].name,
                    uid: members[i].uid,
                    parent_uid: members[i].parent_uid,
                };

                options['names'][members[i].uid] = members[i].name;

                if (member.parent_uid) {
                    options[member.parent_uid] = options[member.parent_uid] || [];
                    options[member.parent_uid].push(member);
                    options['parent_map'][member.uid] = member.parent_uid;
                } else {
                    options['root'].push(member);
                }
            }

            return options;
        }
    });

    self.weight = self.new_instance(PercentInput, {
        placeholder: '%',
        css: {
            'input-sm': true,
        },
        value: opts.value,
    });

    self.clear_weight = function() {
        self.weight.clear();
    };

    self.enable_weight = ko.pureComputed(() => {
        return ko.unwrap(self.num_values) > 1;
    });

    self.dropdowns = self.new_instance(TieredDropdown, {
        data: self.options,
        value_key: 'uid',
        label_key: 'name',
        enable_add: self.enable_add_member,
        btn_css: {
            'btn-ghost-default': true,
        },
    });

    self.has_selected = ko.pureComputed(() => {
        return self.dropdowns.has_selected();
    });

    self._percent = Formatters.gen_formatter({
        format: 'percent',
        format_args: {
            force_decimals: false,
        },
    });

    self.gen_selected_text = function(full) {
        return function() {
            let selected_text;

            if (full) {
                selected_text = self.dropdowns.full_selected_text();
            } else {
                selected_text = self.dropdowns.selected_text();
            }

            if (selected_text) {
                let weight = self.weight.value();

                if (weight) {
                    selected_text += ` (${self._percent(weight)})`;
                }

                return selected_text;
            }
        };
    };

    self.selected_text = ko.pureComputed(self.gen_selected_text(false));

    self.full_selected_text = ko.pureComputed(self.gen_selected_text(true));

    self.selected = ko.pureComputed(() => {
        let selected = self.dropdowns.selected();
        if (selected) {
            return selected.uid;
        }
    });

    self.value = self.weight.value;

    self.when(self.dropdowns, self.weight, self.datasource).done(() => {
        self.dropdowns.set_selected_by_value(opts.attribute_member_uid);

        Observer.register_for_id(self.dropdowns.get_id(), 'TieredDropdown.add_item', member => {
            self._add_attribute_member({
                data: {
                    attribute_uid: self.attribute_uid,
                    attribute_identifier: self.attribute_identifier,
                    name: member.name,
                    parent_uid: member.parent,
                },
                success: DataThing.api.XHRSuccess(member_uid => {
                    self.datasource.refresh_data(true);
                    self.dropdowns.set_selected_by_value(member_uid, member.index);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        _____dfd.resolve();
    });

    return self;
}
