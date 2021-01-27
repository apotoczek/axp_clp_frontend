/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import * as Utils from 'src/libs/Utils';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Checklist from 'src/libs/components/basic/Checklist';

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
    self.max_tier = opts.max_tier || 4;
    self.value_key = opts.value_key;
    self.single_selection = opts.single_selection;

    self.parent_key = opts.parent_key || 'parent_uid';

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

    self.init_checklist = function(data_fn, id) {
        return self.new_instance(Checklist, {
            id: id,
            data: ko.pureComputed(data_fn),
            value_key: opts.value_key,
            label_key: opts.label_key,
            sub_label_key: opts.sub_label_key,
            option_disabled_key: opts.option_disabled_key,
            enable_exclude: opts.enable_exclude,
            enable_filter: opts.enable_filter,
            filter_count_threshold: opts.filter_count_threshold,
            filter_value_keys: opts.filter_value_keys,
            option_css: opts.option_css,
            single_selection: self.single_selection,
            clear_btn_css: {
                hidden: true,
            },
            close_btn_css: {
                hidden: true,
            },
        });
    };

    self.root = self.init_checklist(() => {
        let data = self.data();
        if (data) {
            return data.root;
        }
        return [];
    }, 'root');

    self._checklists = [self.root];

    self.selected_string = function() {
        let data = self.data();
        let selected = self.selected();
        if (selected) {
            let path = [...selected.root];
            if (data && Utils.is_set(selected.leaves, true)) {
                if (path[0] !== selected.leaves[0]) {
                    path.push(selected.leaves[0]);
                }
            }

            let labels = path.map(string => data.names[string]);
            return labels.join(' / ');
        }
        return self.root.selected_string();
    };

    self.sub_options = function(checklist) {
        return function() {
            let data = self.data();
            let options = checklist.selected();

            if (data && options) {
                return options.reduce((res, option) => {
                    let value = checklist._option_value(option);
                    let label = checklist._option_label(option);
                    if (data[value] && data[value].length > 0) {
                        return [
                            ...res,
                            {
                                label: label,
                                _is_label: true,
                            },
                            ...data[value],
                        ];
                    }
                    return res;
                }, []);
            }

            return [];
        };
    };

    self.init_child = function(parent) {
        let child_opts = self.sub_options(parent);
        let checklist = self.init_checklist(child_opts);

        checklist.parent = parent;

        return checklist;
    };

    for (let i = 1, l = self.max_tier; i < l; i++) {
        self._checklists.push(self.init_child(self._checklists[i - 1]));
    }

    self.checklists = ko
        .pureComputed(() => {
            let checklists = [self.root];

            if (self.root.filter_mode() == 'include') {
                for (let i = 1, l = self._checklists.length; i < l; i++) {
                    if (!self._checklists[i].empty()) {
                        checklists.push(self._checklists[i]);
                    }
                }
            }

            return checklists;
        })
        .extend({rateLimit: 100});

    self.clear = function() {
        for (let i = 0, l = self._checklists.length; i < l; i++) {
            self._checklists[i].clear();
        }
    };

    self.get_leaves = function(value, all_children) {
        let leaves;
        let children = all_children[value];

        if (children) {
            leaves = [];

            for (let value of Object.values(children)) {
                leaves.push(...self.get_leaves(value, all_children));
            }

            return leaves;
        }

        return [value];
    };

    self.selected = ko.pureComputed(() => {
        if (!self.root.has_selected()) {
            return undefined;
        }

        let selected = {
            root: self.root.selected_values(),
            children: {},
            leaves: [],
        };

        let checklists = self._checklists;

        for (let i = checklists.length - 1; i >= 1; i--) {
            if (!checklists[i].empty() && checklists[i].has_selected()) {
                let sel = checklists[i].selected();
                for (let j = 0, k = sel.length; j < k; j++) {
                    if (selected.children[sel[j][self.parent_key]] === undefined) {
                        selected.children[sel[j][self.parent_key]] = [];
                    }

                    selected.children[sel[j][self.parent_key]].push(
                        checklists[i]._option_value(sel[j]),
                    );
                }
            }
        }

        for (let uid of selected.root) {
            let leaves = self.get_leaves(uid, selected.children);
            if (leaves && leaves.length) {
                selected.leaves.push(...leaves);
            }
        }

        return selected;
    });

    self.modified = ko.pureComputed(() => {
        return self.selected();
    });

    self.has_selected = self.modified;

    self.set_state = function(state) {
        // Jenky McJenkins?
        if (state) {
            let leaves = state.value.leaves;
            let root_values = state.value.root;

            // Set the roots (values in the the base checklist)
            for (let i = 0, l = root_values.length; i < l; i++) {
                self.root.set_selected(root_values[i]);
            }

            // for (let t=1; t <= 4; t++) {
            for (let i = 0, l = self._checklists.length; i < l; i++) {
                for (let j = 0, k = leaves.length; j < k; j++) {
                    self._checklists[i].set_selected(leaves[j]);
                }
            }
            // }
        }
    };

    _dfd.resolve();

    self.get_value = self.selected;

    self.state = self.selected;

    return self;
}
