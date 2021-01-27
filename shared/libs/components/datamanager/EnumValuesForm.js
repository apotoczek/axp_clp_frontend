/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import * as Formatters from 'src/libs/Formatters';
import TieredDropdown from 'src/libs/components/basic/TieredDropdown';
import PercentInput from 'src/libs/components/basic/PercentInput';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="row row-condensed">
                <div data-bind="foreach: dropdowns">
                    <div class='col-xs-8'>
                    <!-- ko renderComponent: dropdown --><!-- /ko -->
                    </div>
                    <div class="col-xs-3" data-bind="visible: !$parent.is_last_dropdown($index())">
                    <!-- ko renderComponent: weight --><!-- /ko -->
                    </div>
                    <div class="col-xs-1 text-center">
                        <span class="glyphicon glyphicon-remove text-danger"
                              data-bind="
                                  click: function() { $parent.delete($index()) },
                                  visible: !$parent.is_last_dropdown($index())"
                              style="margin-top: 8px; margin-left: -18px; cursor: pointer;">
                        </span>
                    </div>
                </div>
            </div>
        `);

    let dfd = self.new_deferred();

    self.label = opts.label || null;
    self.attribute_uid = opts.attribute_uid;
    self.attribute_identifier = opts.attribute_identifier;

    self.btn_css = {
        'btn-ghost-info': true,
        'btn-sm': true,
    };

    self.input_css = {
        'input-sm': true,
    };

    self.popover_placement = opts.popover_placement;

    self.dropdowns = ko.observableArray([]);

    self.num_values = ko.pureComputed(() => {
        return self.values().length;
    });

    self.options_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: opts.options_target,
                attribute_identifier: self.attribute_identifier,
                include_members: true,
                tree_mode: false,
            },
        },
    });

    self.is_last_dropdown = function(idx) {
        return self.dropdowns().length - 1 === idx;
    };

    if (opts.selected_datasource) {
        self.selected_datasource = self.new_instance(DataSource, {
            datasource: opts.selected_datasource,
            disable_cache: !!opts.selected_datasource.disable_cache,
        });
        self.selected_datasource.data.subscribe(data => {
            if (data) {
                self.set_selected_data(data);
            }
        });
    }

    self.set_selected_data = function(data) {
        if (data) {
            self.dropdowns([]);

            for (let value of data) {
                let member_uid = value.attribute_member_uid;
                let _dropdown = self.new_instance(TieredDropdown, {
                    data: self.options,
                    value_key: 'uid',
                    label_key: 'name',
                    btn_css: self.btn_css,
                });
                _dropdown.set_selected_by_value(member_uid);

                let _weight = self.new_instance(PercentInput, {
                    placeholder: '%',
                    css: self.input_css,
                });
                _weight.value(value.value);

                self.dropdowns.push({
                    dropdown: _dropdown,
                    weight: _weight,
                });
            }

            self._push_empty_dropdown();
        }
    };

    self.options = ko.computed(() => {
        let data = self.options_datasource.data();

        if (data && data.members) {
            let members = data.members;
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

    self._push_empty_dropdown = function() {
        let dropdown = self.new_instance(TieredDropdown, {
            data: self.options,
            value_key: 'uid',
            label_key: 'name',
            btn_css: self.btn_css,
        });

        dropdown.selected.subscribe(() => {
            let dropdowns = self.dropdowns();
            if (dropdowns.length > 0 && dropdowns.last().dropdown.has_selected()) {
                self._push_empty_dropdown();
            }
        });

        self.dropdowns.push({
            dropdown: dropdown,
            weight: self.new_instance(PercentInput, {
                placeholder: '%',
                css: self.input_css,
            }),
        });
        return dropdown;
    };

    self.get_data = function() {
        let rv = [];

        for (let dropdown of self.dropdowns()) {
            if (dropdown.dropdown.has_selected()) {
                rv.push({
                    attribute_member_uid: dropdown.dropdown.selected().uid,
                    weight: dropdown.weight.value() || null,
                });
            }
        }

        return rv.unique();
    };

    self.clear = function() {
        self.dropdowns([]);
        self._push_empty_dropdown();
    };

    self.delete = function(index) {
        self.dropdowns.splice(index, 1);
    };

    self.strings_formatter = Formatters.gen_formatter('strings');

    self.selected_summary = ko.pureComputed(() => {
        let dropdowns = self.dropdowns().slice(0, -1);

        return self.strings_formatter(
            dropdowns.map(dropdown => {
                return dropdown.dropdown.selected_text();
            }),
        );
    });

    self._push_empty_dropdown();

    dfd.resolve();

    return self;
}
