/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Radiolist from 'src/libs/components/basic/Radiolist';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default class PopoverChecklist extends BaseComponent {
    // Legacy, use `Checklist` instead in
    // `shared/libs/components/basic/Checklist.js`
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();
        const init = this.new_deferred();

        this.reset_event = opts.reset_event;
        this.template = opts.template || 'tpl_popover_checklist';
        this.css = opts.css || 'popover-cpanel';
        this.enable_exclude = Utils.default_value(opts.enable_exclude, false);
        this.filter_mode = ko.observable('include'); //exclude
        this.filter_mode_text = ko.pureComputed(() => {
            return this.filter_mode() === 'include' ? 'Exclude' : 'Include';
        });

        this.toggle_mode = () => {
            this.filter_mode(this.filter_mode() === 'include' ? 'exclude' : 'include');
        };

        this.icon = ko.pureComputed(() => {
            return this.filter_mode() === 'include' ? 'glyphicon-ok' : 'glyphicon-minus';
        });

        this.set_state_on_label_event = opts.set_state_on_label_event;

        this.clear_event = opts.clear_event;

        if (opts.label_by) {
            opts.segregate_fn = options => {
                const grouped = options.groupBy(opts.label_by);
                const segregated_options = [];

                for (const [label, options] of Object.entries(grouped)) {
                    segregated_options.push({
                        label: label,
                        value: '__LABEL__',
                    });
                    segregated_options.push(...options);
                }

                return segregated_options;
            };
        }

        if (opts.defaults) {
            this.defaults = ko.observable(opts.defaults);
            this.restore_defaults = () => {
                this.clear();
                this.set_state(this.defaults());
            };
        } else {
            this.restore_defaults = false;
        }

        this.placement = opts.placement;
        this.match_width = opts.match_width;
        this.title = opts.title;

        this.disable_clear_button = opts.disable_clear_button;
        this.disable_untoggle = opts.disable_untoggle;
        this.single_selection = opts.single_selection || false;

        this.waiting = ko.observable(false);
        this.enabled = ko.observable(true);

        this._selected = ko.observable({});

        this.options = ko.pureComputed(() => {
            const data = this.data();
            if (data && Object.isArray(data)) {
                return data;
            }
            return [];
        });

        if (opts.selected_idx !== undefined) {
            this._selected_idx = opts.selected_idx;
        }

        if (opts.selected_datasource) {
            this._selected_datasource = new BaseComponent({
                datasource: opts.selected_datasource,
                disable_data_updates: opts.disable_data_updates,
            });

            this._selected_datasource.data.subscribe(value => this._set_selected(value));
            this._set_selected(this._selected_datasource.data());
            this.restore_defaults = () => {
                this._set_selected(this._selected_datasource.data());
            };
        }

        this.filtered_options = ko
            .pureComputed(() => {
                const options = this.options();
                return opts.filter_fn ? opts.filter_fn(options) : options;
            })
            .extend({throttle: 300});

        this.segregated_options = ko
            .pureComputed(() => {
                const options = this.filtered_options();
                return opts.segregate_fn ? opts.segregate_fn(options) : options;
            })
            .extend({throttle: 300});

        this.empty_text = opts.empty_text || 'No options';
        this.show_empty_text =
            typeof opts.show_empty_text !== 'undefined' ? opts.show_empty_text : true;
        this.no_selection_text = opts.no_selection_text || 'No selection';

        this.selected = ko.pureComputed(() => {
            const _selected = this._selected();
            const options = this.options();

            if (options && options.length > 0) {
                const selected = options.filter(option => {
                    return _selected[option.value];
                });

                if (selected.length === 0 && this._selected_idx !== undefined) {
                    const selected_option = options[this._selected_idx];
                    if (selected_option) {
                        return [selected_option];
                    }
                }
                return selected;
            }
            return [];
        });

        this.get_value = ko.pureComputed(() => {
            if (this.options().length > 0) {
                if (this.filter_mode() === 'exclude') {
                    const selected = this.selected();
                    const options = this.options();
                    return options.filter(opt => {
                        return (
                            selected.filter(sel => {
                                return opt.value == sel.value;
                            }).length == 0
                        );
                    });
                }

                return this.selected();
            }
            return [];
        });

        this.modified = ko.pureComputed(() => {
            return this.selected().length > 0;
        });

        if (this.clear_event) {
            if (Array.isArray(this.clear_event)) {
                Observer.register_many(this.clear_event, () => {
                    this.clear();
                });
            } else {
                Observer.register(this.clear_event, () => {
                    this.clear();
                });
            }
        }

        if (this.set_state_on_label_event) {
            Observer.register(this.set_state_on_label_event, label => {
                const options = this.options();
                const selection = [];
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
                this.set_state(selection);
            });
        }

        this.selected_string = ko.pureComputed(() => {
            const selected = this.selected();
            if (selected.length > 0) {
                return this.selected()
                    .map(option => {
                        return ko.unwrap(option.label);
                    })
                    .join(', ');
            }
            return this.no_selection_text;
        });

        if (this.enable_exclude) {
            this.init_component(
                {
                    id: 'mode_select',
                    component: Radiolist,
                    active_template: 'popover_mode_selection',
                    css: {
                        'btn-xs': true,
                    },
                    data: [
                        {label: 'Include', value: 'include'},
                        {label: 'Exclude', value: 'exclude'},
                    ],
                },
                mode_select => {
                    this.mode_select = mode_select;
                    Observer.register(
                        Utils.gen_event('Radiolist.selected', this.mode_select.get_id()),
                        filter_mode => {
                            this.filter_mode(filter_mode);
                        },
                    );
                    init.resolve();
                },
            );
        } else {
            init.resolve();
        }

        init.done(() => {
            _dfd.resolve();
        });
    }

    _set_selected(data) {
        const selected = {};

        if (Object.isArray(data) && data.length > 0) {
            for (let i = 0, l = data.length; i < l; i++) {
                selected[Utils.get(data[i], 'value')] = true;
            }
        } else {
            selected[Utils.get(data, 'value')] = true;
        }

        this._selected(selected);
    }

    is_selected(option) {
        if (this._selected_idx !== undefined) {
            return this.selected().indexOf(option) > -1;
        }
        return !!this._selected()[option.value];
    }

    set_state(data) {
        const selected = {};
        if (data && data.length > 0) {
            if (this.enable_exclude) {
                if (data[0].mode) {
                    this.filter_mode(data[0].mode);
                    this.mode_select.set_selected(data[0].mode);
                }
            }
            for (let i = 0, l = data.length; i < l; i++) {
                selected[data[i].value] = true;
            }
        }
        this._selected(selected);
    }

    get_state() {
        return this.selected().map(option => {
            return {
                value: ko.unwrap(option.value),
                selected: ko.unwrap(option.selected),
                mode: ko.unwrap(this.filter_mode),
            };
        });
    }

    get_metrics() {
        return this.selected().map(options => {
            return ko.unwrap(options.label);
        });
    }

    clear() {
        this._selected({});
    }

    is_label(option) {
        return option.value === '__LABEL__';
    }

    toggle(option) {
        if (option.value === '__LABEL__') {
            return;
        }

        let selected = this._selected();
        const was_selected = selected[option.value];

        if (this.single_selection) {
            selected = {};
        }

        if (was_selected && !option.disable_untoggle && !this.disable_untoggle) {
            delete selected[option.value];
        } else {
            selected[option.value] = true;
        }

        this._selected(selected);
    }
}
