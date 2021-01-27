/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PopoverChecklist from 'src/libs/components/popovers/PopoverChecklist';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_popover_nested_checklist';
    //self.css = opts.css || 'popover-cpanel';

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.paused = ko.observable(false);
    self.extract_hashmap = bison.helpers.extract_hashmap;
    self.unwrap_map = bison.helpers.unwrap_map;

    self._css = opts.css || {'popover-cpanel': true};

    self.full_object_refinements = opts.full_object_refinements || false;

    self.filter_by_parents = function(arr) {
        let parents = self.l1.get_value().map(parent => {
            return ko.unwrap(parent.value);
        });
        let filtered = arr.filter(item => {
            return parents.indexOf(ko.unwrap(item.parent)) > -1;
        });
        return filtered.sortBy(item => {
            return parents.indexOf(ko.unwrap(item.parent));
        });
    };

    self.label_by_parents = function(arr) {
        let parents = self.l1.get_value();
        let hash_map = self.extract_hashmap(parents, 'value', 'label', true);
        let idx = self.unwrap_map(arr, 'parent').map(value => {
            return `${value}`;
        });

        let arr_copy = arr.slice(0);

        Object.keys(hash_map).map(key => {
            let insertion_point = idx.findIndex(key);

            let label = {
                label: hash_map[key],
                value: '__LABEL__',
            };

            if (insertion_point > -1) {
                arr_copy.insert(label, insertion_point);
                idx.unshift(null);
            }
        });
        return arr_copy;
    };

    self.l1 = new PopoverChecklist(opts.l1);

    opts.l2.filter_fn = self.filter_by_parents;
    opts.l2.segregate_fn = self.label_by_parents;

    self.l2 = new PopoverChecklist(opts.l2);

    self.container_css = ko.computed(() => {
        if (opts.auto_hide_l2) {
            if (self.l2.filtered_options().length == 0) {
                return {'popover-hide-l2': true, 'popover-show-l2': false};
            }
            return {'popover-show-l2': true, 'popover-hide-l2': false};
        }
        return {};
    });

    self.css = ko.computed(() => {
        let css = Utils.ensure_css_object(self._css);

        return {...css, ...self.container_css()};
    });

    if (opts.selected_datasource) {
        self._selected_datasource = new BaseComponent({
            datasource: opts.selected_datasource,
        });

        self._set_selected = function(data) {
            let l1_selected = {};
            let l2_selected = {};
            if (Utils.is_set(data)) {
                if (Object.isArray(data) && data.length > 0) {
                    for (let i = 0, l = data.length; i < l; i++) {
                        if (Object.isObject(data[i]) && data[i].value) {
                            l1_selected[data[i].value] = true;
                            if (data[i].refinements) {
                                for (let j = 0, k = data[i].refinements.length; j < k; j++) {
                                    l2_selected[data[i].refinements[j]] = true;
                                }
                            }
                        } else {
                            l1_selected[data[i]] = true;
                        }
                    }
                } else {
                    if (Object.isObject(data) && data.value) {
                        l1_selected[data.value] = true;
                        if (data.refinements) {
                            for (let j = 0, k = data.refinements.length; j < k; j++) {
                                l2_selected[data.refinements[j]] = true;
                            }
                        }
                    } else {
                        l1_selected[data] = true;
                    }
                }
            }

            self.l1._selected(l1_selected);
            self.l2._selected(l2_selected);
        };

        self._selected_datasource.data.subscribe(self._set_selected);
        self._set_selected(self._selected_datasource.data());
    }

    self.set_state = function(state) {
        if (state) {
            self.l1.set_state(state[opts.l1.key] || []);
            self.l2.set_state(state[opts.l2.key] || []);
        }
    };

    self.get_state = function() {
        let state = {};
        state[opts.l1.key] = self.l1.get_state() || [];
        state[opts.l2.key] = self.l2.get_state() || [];
        return state;
    };

    self.get_metrics = function(level) {
        let key = level == 1 ? 'l1' : 'l2';
        return self[key].get_metrics();
    };

    self.selected = ko.computed(() => {
        return (ko.unwrap(self.l1.selected) || []).concat(ko.unwrap(self.l2.selected()) || []);
    });

    self.get_value = ko.computed(() => {
        if (!self.paused()) {
            let value = [];
            let l1_selected = self.l1.get_value();
            let l2_selected = self.l2.get_value();

            for (let i = 0, l = l1_selected.length; i < l; i++) {
                let l1_item = l1_selected[i];
                let refinements = [];

                if (self.full_object_refinements) {
                    refinements = l2_selected.filter(item => {
                        return ko.unwrap(item.parent) == ko.unwrap(l1_item.value);
                    });
                } else {
                    refinements = self.unwrap_map(
                        l2_selected.filter(item => {
                            return ko.unwrap(item.parent) == ko.unwrap(l1_item.value);
                        }),
                        'value',
                    );
                }

                value.push({value: ko.unwrap(l1_item.value), refinements: refinements});
            }

            return value;
        }
    });

    if (opts.broadcast_root) {
        ko.computed(() => {
            Observer.broadcast_for_id(
                self.get_id(),
                'PopoverNestedChecklist.root',
                self.l1.get_value(),
            );
        });
    }

    self.selected_string = ko.computed(() => {
        if (!self.paused()) {
            let l1_selected = self.l1.get_value();
            let l2_selected = self.l2.get_value();
            if (l1_selected.length > 0) {
                let selections = [];

                for (let i = 0, l = l1_selected.length; i < l; i++) {
                    let l1_item = l1_selected[i];

                    let refinements = self.unwrap_map(
                        l2_selected.filter(item => {
                            return ko.unwrap(item.parent) == ko.unwrap(l1_item.value);
                        }),
                        'label',
                    );

                    if (refinements.length > 0) {
                        selections.push(`${ko.unwrap(l1_item.label)} (${refinements.join(', ')})`);
                    } else {
                        selections.push(ko.unwrap(l1_item.label));
                    }
                }

                return selections.join(', ');
            }
            return 'No selection';
        }
    });

    self.modified = ko.computed(() => {
        return self.l1.modified();
    });

    self.clear = function() {
        self.paused(true);
        self.l2.clear();
        self.l1.clear();
        self.paused(false);
    };

    $.when($.when(...self.l1.dfds), $.when(...self.l2.dfds)).done(() => {
        _dfd.resolve();
    });

    return self;
}
