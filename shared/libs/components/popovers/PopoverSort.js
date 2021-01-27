/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);
    self.reset_event = opts.reset_event;
    self.template = opts.template || 'tpl_popover_checklist';
    self.css = opts.css || 'popover-cpanel';

    self.set_state_on_label_event = opts.set_state_on_label_event;

    if (opts.label_by) {
        opts.segregate_fn = function(options) {
            let grouped = options.groupBy(opts.label_by);

            let segregated_options = [];

            for (let [label, options] of Object.entries(grouped)) {
                segregated_options.push({
                    label: label,
                    value: '__LABEL__',
                });

                segregated_options.push(...options);
            }

            return segregated_options;
        };
    }

    self.sort_order = ko.observable('desc');
    self.sort_asc = function() {
        self.sort_order('asc');
    };
    self.sort_desc = function() {
        self.sort_order('desc');
    };

    if (opts.defaults) {
        self.defaults = ko.observable(opts.defaults);
        self.restore_defaults = function() {
            self.clear();
            self.set_state(self.defaults());
        };
    } else {
        self.restore_defaults = false;
    }

    self.placement = opts.placement;
    self.match_width = opts.match_width;
    self.title = opts.title;

    self.disable_clear_button = opts.disable_clear_button;
    self.disable_untoggle = opts.disable_untoggle;
    self.single_selection = opts.single_selection || false;

    self.waiting = ko.observable(false);
    self.enabled = ko.observable(true);

    self._selected = ko.observable({});

    self.options = ko.computed(() => {
        let data = self.data();
        if (data && Object.isArray(data)) {
            return data;
        }
        return [];
    });

    if (opts.selected_idx !== undefined) {
        self._selected_idx = opts.selected_idx;
    }

    if (opts.selected_datasource) {
        self._selected_datasource = new BaseComponent({
            datasource: opts.selected_datasource,
            disable_data_updates: opts.disable_data_updates,
        });

        self._set_selected = function(data) {
            let selected = {};

            if (Object.isArray(data) && data.length > 0) {
                for (let i = 0, l = data.length; i < l; i++) {
                    selected[Utils.get(data[i], 'value')] = true;
                }
            } else {
                selected[Utils.get(data, 'value')] = true;
            }

            self._selected(selected);
        };

        self._selected_datasource.data.subscribe(self._set_selected);
        self._set_selected(self._selected_datasource.data());
        self.restore_defaults = function() {
            self._set_selected(self._selected_datasource.data());
        };
    }

    self.is_selected = function(option) {
        if (self._selected_idx !== undefined) {
            return self.selected().indexOf(option) > -1;
        }
        return !!self._selected()[option.value];
    };

    self.filtered_options = ko
        .computed(() => {
            let options = self.options();
            return opts.filter_fn ? opts.filter_fn(options) : options;
        })
        .extend({throttle: 300});

    self.segregated_options = ko
        .computed(() => {
            let options = self.filtered_options();
            return opts.segregate_fn ? opts.segregate_fn(options) : options;
        })
        .extend({throttle: 300});

    self.empty_text = opts.empty_text || 'No options';
    self.show_empty_text =
        typeof opts.show_empty_text !== 'undefined' ? opts.show_empty_text : true;
    self.no_selection_text = opts.no_selection_text || 'No selection';

    self.set_state = function(data) {
        let selected = {};
        if (data && data.length > 0) {
            for (let i = 0, l = data.length; i < l; i++) {
                selected[data[i].value] = true;
            }
        }
        if (data && data.length > 0) {
            self.sort_order(data[0].sort || 'desc');
        }
        self._selected(selected);
    };

    self.get_state = function() {
        return self.selected().map(option => {
            return {
                value: ko.unwrap(option.value),
                selected: ko.unwrap(option.selected),
                sort: self.sort_order(),
            };
        });
    };

    self.get_metrics = function() {
        return self.selected().map(options => {
            return ko.unwrap(options.label);
        });
    };

    self.selected = ko.computed(() => {
        let _selected = self._selected();
        let options = self.options();

        if (options && options.length > 0) {
            let selected = options.filter(option => {
                return _selected[option.value];
            });

            if (selected.length === 0 && self._selected_idx !== undefined) {
                let selected_option = options[self._selected_idx];
                if (selected_option) {
                    return [selected_option];
                }
            }

            return selected;
        }

        return [];
    });

    self.get_value = ko.computed(() => {
        if (self.options().length > 0) {
            if (self.selected()[0]) {
                return [{name: self.selected()[0].value, sort: self.sort_order()}];
            }
        }
        return [];
    });

    self.modified = ko.computed(() => {
        return self.selected().length > 0;
    });

    self.clear = function() {
        self._selected({});
    };

    self.is_label = function(option) {
        return option.value === '__LABEL__';
    };

    if (opts.clear_event) {
        if (Array.isArray(opts.clear_event)) {
            Observer.register_many(opts.clear_event, () => {
                self.clear();
            });
        } else {
            Observer.register(opts.clear_event, () => {
                self.clear();
            });
        }
    }

    self.toggle = function(option) {
        if (option.value === '__LABEL__') {
            return;
        }

        let selected = self._selected();
        let was_selected = selected[option.value];

        if (self.single_selection) {
            selected = {};
        }

        if (was_selected && !option.disable_untoggle && !self.disable_untoggle) {
            delete selected[option.value];
        } else {
            selected[option.value] = true;
        }

        self._selected(selected);
    };

    if (self.set_state_on_label_event) {
        Observer.register(self.set_state_on_label_event, label => {
            let options = self.options();
            let selection = [];
            if (Array.isArray(options)) {
                for (let i = 0, j = options.length; i < j; i++) {
                    if (options[i].label == label) {
                        selection.push({
                            label: label,
                            value: options[i].value,
                        });
                    }
                }
            }
            self.set_state(selection);
        });
    }

    self.selected_string = ko.computed(() => {
        let selected = self.selected();
        if (selected.length > 0) {
            return self
                .selected()
                .map(option => {
                    return ko.unwrap(option.label);
                })
                .join(', ');
        }
        return self.no_selection_text;
    });

    _dfd.resolve();

    return self;
}
