/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="row row-condensed new-world-form" data-bind="foreach: dropdowns">
                <div data-bind="css: $parent.column_css, renderComponent: $data"></div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.max_tier = opts.max_tier || 3;

    self.enable_add = opts.enable_add;

    self.register_add_item = function(dropdown, parent, index) {
        Observer.register_for_id(dropdown.get_id(), 'FilteredDropdown.add_item', name => {
            Observer.broadcast_for_id(self.get_id(), 'TieredDropdown.add_item', {
                name: name,
                parent: parent && parent.selected_value(),
                index: index || 0,
            });
        });
    };

    self.root = self.new_instance(FilteredDropdown, {
        id: 'root',
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return data['root'];
            }
            return [];
        }),
        value_key: opts.value_key,
        label_key: opts.label_key,
        enable_add: self.enable_add,
        btn_css: opts.btn_css,
    });

    self.register_add_item(self.root);

    self._dropdowns = [self.root];

    self.sub_options = function(dropdown) {
        return function() {
            let value = dropdown.selected_value();
            let data = self.data();
            if (data && value) {
                return data[value];
            }
            return [];
        };
    };

    for (let i = 1, l = self.max_tier; i < l; i++) {
        let dropdown = self.new_instance(FilteredDropdown, {
            data: ko.pureComputed(self.sub_options(self._dropdowns[i - 1])),
            value_key: opts.value_key,
            label_key: opts.label_key,
            enable_add: self.enable_add,
            btn_css: opts.btn_css,
        });

        dropdown.parent = self._dropdowns[i - 1];

        self.register_add_item(dropdown, dropdown.parent, i);

        self._dropdowns.push(dropdown);
    }

    self.dropdowns = ko.pureComputed(() => {
        let dropdowns = [self.root];

        for (let i = 1, l = self._dropdowns.length; i < l; i++) {
            if (
                self._dropdowns[i - 1].has_selected() &&
                (self.enable_add || !self._dropdowns[i].empty())
            ) {
                dropdowns.push(self._dropdowns[i]);
            }
        }

        return dropdowns;
    });

    self.column_css = ko.pureComputed(() => {
        let column_width = 12 / self.dropdowns().length;

        return `col-xs-${column_width}`;
    });

    self.selected = ko.pureComputed(() => {
        let dropdowns = self._dropdowns;

        for (let i = dropdowns.length - 1; i >= 0; i--) {
            if (!dropdowns[i].empty() && dropdowns[i].has_selected()) {
                return dropdowns[i].selected();
            }
        }

        return undefined;
    });

    self.has_selected = ko.pureComputed(() => {
        return self.selected() !== undefined;
    });

    self.selected_text = ko.pureComputed(() => {
        let selected = self.selected();

        if (selected) {
            return selected[opts.label_key];
        }
    });

    self.full_selected_text = ko.pureComputed(() => {
        let strings = [];

        for (let i = 0, l = self._dropdowns.length; i < l; i++) {
            if (!self._dropdowns[i].empty() && self._dropdowns[i].has_selected()) {
                strings.push(self._dropdowns[i].selected_label());
            }
        }

        return strings.join(' / ');
    });

    self.clear = function() {
        for (const item of self._dropdowns) {
            item.clear();
        }
    };

    self.find_all_values = function(data, value) {
        if (data && data['parent_map']) {
            let parent_value = data['parent_map'][value];

            if (parent_value) {
                return [...self.find_all_values(data, parent_value), value];
            }

            return [value];
        }
    };

    self._set_selected_by_value = function(data, value) {
        let parents = self.find_all_values(data, value);

        for (let i = 0, l = parents.length; i < l; i++) {
            self._dropdowns[i].set_selected_by_value(parents[i]);
        }
    };

    self.set_selected_by_value = function(value, index) {
        if (Utils.is_set(index) && self._dropdowns[index]) {
            self._dropdowns[index].set_selected_by_value(value);
        } else {
            let data = self.data();

            if (data) {
                self._set_selected_by_value(data, value);
            } else {
                let init = self.data.subscribe(data => {
                    self._set_selected_by_value(data, value);
                    init.dispose();
                });
            }
        }
    };

    _dfd.resolve();

    return self;
}
