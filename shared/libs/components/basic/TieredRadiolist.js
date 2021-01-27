/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Radiolist from 'src/libs/components/basic/Radiolist';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div class="clearfix" data-bind="foreach: checklists, style: { 'min-height': min_height }">
                <div class="pull-left" data-bind="renderComponent: $data, style: { 'margin-left': $index() > 0 ? '10px' : 0 }"></div>
            </div>
            <div style="width: 200px">
                <button class="btn" data-bind="css: close_btn_css" data-dismiss="popover">Done</button>
                <button class="btn" data-bind="css: clear_btn_css, click: clear, enable: modified">Clear</button>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.min_height = opts.min_height;
    self.max_tier = opts.max_tier || 3;

    self.parent_key = opts.parent_key || 'parent_uid';
    self.default_selected_index = opts.default_selected_index || 0;

    self.sub_configs = opts.sub_configs || [];

    self.clear_btn_css = opts.clear_btn_css || {
        'btn-block': true,
        'btn-cpanel': true,
        'btn-sm': true,
    };

    self.close_btn_css = opts.close_btn_css || {
        'btn-block': true,
        'btn-default': true,
        'btn-sm': true,
    };

    self._pause_internal_state = false;

    self.init_checklist = function(data_fn, id, sub_config = {}) {
        let config = {
            id: id,
            data: ko.pureComputed(data_fn),
            value_key: opts.value_key,
            label_key: opts.label_key,
            sub_label_key: opts.sub_label_key,
            option_disabled_key: opts.option_disabled_key,
            enable_filter: opts.enable_filter,
            filter_count_threshold: opts.filter_count_threshold,
            filter_value_keys: opts.filter_value_keys,
            option_css: opts.option_css,
            default_selected_index: opts.default_selected_index || 0,
            clear_btn_css: {
                hidden: true,
            },
            close_btn_css: {
                hidden: true,
            },
        };

        for (let [key, value] of Object.entries(sub_config)) {
            config[key] = value;
        }

        return self.new_instance(Radiolist, config);
    };

    self.root = self.init_checklist(() => {
        let data = self.data();
        if (data) {
            return data.root;
        }
        return [];
    }, 'root');

    self._checklists = [self.root];

    self.sub_options = function(parent) {
        return function() {
            let data = self.data();
            let value = parent.selected_value();

            if (data && value) {
                return data[value] || [];
            }

            return [];
        };
    };

    self.init_child = function(parent, sub_config = {}) {
        let checklist = self.init_checklist(self.sub_options(parent), undefined, sub_config);

        checklist.parent = parent;

        parent.selected.subscribe(() => {
            if (!self._pause_internal_state) {
                checklist.clear();
            }
        });

        return checklist;
    };

    self.get_sub_config = function(tier) {
        if (self.sub_configs.length < tier) {
            return {};
        }

        return self.sub_configs[tier];
    };

    for (let i = 1, l = self.max_tier; i < l; i++) {
        self._checklists.push(self.init_child(self._checklists[i - 1], self.get_sub_config(i)));
    }

    self.checklists = ko
        .pureComputed(() => {
            let checklists = [self.root];

            for (let i = 1, l = self._checklists.length; i < l; i++) {
                if (!self._checklists[i].empty()) {
                    checklists.push(self._checklists[i]);
                }
            }

            return checklists;
        })
        .extend({rateLimit: 50});

    self.clear = function() {
        for (let i = 0, l = self._checklists.length; i < l; i++) {
            self._checklists[i].clear();
        }
    };

    self.selected = ko.pureComputed(() => {
        if (!self.root.has_selected()) {
            return undefined;
        }

        let checklists = self.checklists();

        return checklists[checklists.length - 1].selected();
    });

    self.modified = ko.pureComputed(() => {
        return self.selected();
    });

    self.has_selected = self.modified;

    self.selected_string = ko.pureComputed(() => {
        let checklists = self.checklists();

        return checklists[checklists.length - 1].selected_label();
    });

    self.find_value_path = function(value, data, parents = []) {
        if (data) {
            let keys = Object.keys(data);

            for (let i = 0, l = keys.length; i < l; i++) {
                let options = data[keys[i]];

                for (let j = 0, k = options.length; j < k; j++) {
                    if (self.root._option_value(options[j]) == value) {
                        if (keys[i] == 'root') {
                            return parents;
                        }
                        return self.find_value_path(keys[i], data, [...parents, keys[i]]);
                    }
                }
            }
        }
    };

    self._set_selected = function(selected, data) {
        let value_path = self.find_value_path(selected, data);

        if (value_path) {
            value_path.push(selected);

            self._pause_internal_state = true;

            for (let i = 0, l = value_path.length; i < l; i++) {
                self._checklists[i].set_selected(value_path[i]);
            }

            setTimeout(() => {
                self._pause_internal_state = false;
            }, 100);

            return true;
        }

        return false;
    };

    self.set_state = function(state) {
        if (state) {
            self._set_selected(state, self.data());
        }
    };

    if (opts.selected_datasource) {
        self._selected_datasource = new BaseComponent({
            datasource: opts.selected_datasource,
        });

        let data_init = self.data.subscribe(data => {
            self._set_selected(self._selected_datasource.data(), data);
            data_init.dispose();
        });

        self._selected_datasource.data.subscribe(selected => {
            if (self._set_selected(selected, self.data())) {
                data_init.dispose();
            }
        });
    }

    _dfd.resolve();

    self.get_value = self.selected;
    self.state = self.selected;

    return self;
}
