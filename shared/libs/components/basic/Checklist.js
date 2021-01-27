/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';
import DataSource from 'src/libs/DataSource';

export default class Checklist extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_template(`
                <div data-bind="style: styles">
                    <!-- ko if:$data.mode_select -->
                    <!-- ko renderComponent:mode_select --><!-- /ko -->
                    <!-- /ko -->
                    <!-- ko if: event_button -->
                        <button class="btn" data-dismiss="popover" style="margin-bottom: 15px" data-bind="css: event_btn_css, html: event_button_label, click: event_button"></button>
                    <!-- /ko-->
                    <!-- ko if: enable_filter -->
                        <input type="text" class="form-control input-sm" style="margin-bottom: 5px;" data-bind="textInput: filter_value, attr: { placeholder: strings.filter_placeholder }" />
                    <!-- /ko -->
                    <ul data-bind="foreach: filtered_options, css:filter_mode" style="max-height: 400px;" class="list-unstyled force-scrollable-y">
                        <li style="margin-bottom: 5px;">
                            <!-- ko ifnot: $parent.is_label($data) -->
                                <button class="btn clearfix" data-bind="disable: $parent._option_is_disabled($data), css: $parent.option_css($data), click: $parent.toggle" style="padding-left: 10px; padding-right:10px;">

                                    <span class="btn-label text-left pull-left">
                                        <span data-bind="html: $parent._option_label($data)"></span>
                                        <!-- ko if: $parent._option_sub_label($data) -->
                                            <span class="sub-label" data-bind="html: $parent._option_sub_label($data)"></span>
                                        <!-- /ko -->
                                    </span>
                                    <span class="btn-icon glyphicon pull-right" data-bind="visible: $parent.is_selected($data), css:$parent.icon"></span>
                                    <span class="btn-icon glyphicon pull-right" data-bind="visible: !$parent.is_selected($data), css:$data.icon"></span>
                                </button>
                            <!-- /ko -->
                            <!-- ko if: $parent.is_label($data) -->
                                <span data-bind="html: label" style="text-transform:uppercase;font-size: 10px;margin-left:2px;"></span>
                            <!-- /ko -->
                        </li>
                    </ul>
                    <div class="help-block" data-bind="visible: empty, text: strings.empty"></div>
                    <button class="btn" data-bind="css: close_btn_css" data-dismiss="popover">Done</button>
                    <button class="btn" data-bind="css: close_btn_css, click: toggle_select_all, visible: enable_toggle_all, text: toggle_all_text"></button>
                    <button class="btn" data-bind="css: clear_btn_css, click: clear, visible: enable_clear, enable: modified, text: strings.clear"></button>
                </div>
            `);

        let _dfd = this.new_deferred();
        let init = this.new_deferred();

        this.options = this.data;
        this.broadcast_data = ko.observable();
        this.selection_event = opts.selection_event;
        this.deselect_event = opts.deselect_event;
        this.min_width = opts.min_width;
        this.enable_clear = Utils.default_value(opts.enable_clear, true);
        this.enable_toggle_all = Utils.default_value(opts.enable_toggle_all, false);
        this.enable_toggle_all_text = Utils.default_value(
            opts.enable_toggle_all_text,
            'Enable All',
        );
        this.disable_toggle_all_text = Utils.default_value(
            opts.disable_toggle_all_text,
            'Disable All',
        );
        this.initial_selected_value = Utils.default_value(opts.initial_selected_value, undefined);
        this.single_selection = opts.single_selection || false;
        this.select_first_option = opts.select_first_option || false;
        this.enable_exclude = Utils.default_value(opts.enable_exclude, false);
        this.filter_mode = ko.observable('include'); //exclude
        this.filter_mode_text = ko.pureComputed(() => {
            return this.filter_mode() === 'include' ? 'Exclude' : 'Include';
        });

        this.toggle_all_text = ko.pureComputed(() => {
            if (this.options().length > this.selected().length) {
                return this.enable_toggle_all_text;
            }
            return this.disable_toggle_all_text;
        });

        this.icon = ko.pureComputed(() => {
            return this.filter_mode() === 'include' ? 'glyphicon-ok' : 'glyphicon-minus';
        });

        this.toggle_mode = () => {
            this.filter_mode(this.filter_mode() === 'include' ? 'exclude' : 'include');
        };

        this.single_selection = opts.single_selection || false;
        this._enable_filter = opts.enable_filter || false;

        this.clear_btn_css = opts.clear_btn_css || {
            'btn-block': true,
            'btn-cpanel': true,
            'btn-sm': true,
        };

        this.close_btn_css = opts.close_btn_css || {
            'btn-block': true,
            'btn-default': true,
            'btn-sm': true,
        };

        this.event_button = opts.event_button || false;

        if (typeof this.event_button == 'object') {
            this.event_btn_css = this.event_button.css || {
                'btn-block': true,
                'btn-success': true,
                'btn-sm': true,
            };
            this.event_button_label = opts.event_button.label || 'Add';
            this.event_button_event =
                opts.event_button.event || Utils.gen_event('Checklist.event', this.get_id());
            this.event_button = () => {
                Observer.broadcast(this.event_button_event, true);
            };
        }

        this.label_key = opts.label_key || opts.key || 'label';
        this.value_key = opts.value_key || 'value';
        this.sub_label_key = opts.sub_label_key || false;
        this.option_disabled_key = opts.option_disabled_key || false;
        this.option_disable_untoggle_key = opts.option_disable_untoggle_key || false;

        this._option_css = opts.option_css || {
            'btn-popover-checklist-item': true,
            'btn-block': true,
            'btn-sm': true,
        };

        this.styles = ko.pureComputed(() => {
            const min_width = ko.unwrap(this.min_width);
            return {
                'min-width': `${min_width ? min_width : 200}px`,
            };
        });

        this.strings = {
            no_selection: 'Select One',
            clear: 'Clear',
            empty: 'No choices..',
            filter_placeholder: 'Filter...',
            no_matches: 'No matches...',
            ...opts.strings,
        };

        if (opts.options) {
            this.options(opts.options);
        }

        if (Utils.is_set(this.initial_selected_value, true)) {
            this._selected = ko.observable({
                [this.initial_selected_value]: true,
            });
        } else {
            this._selected = ko.observable({});
        }
        this.state = ko.pureComputed(() => this._selected());

        this.filter_value = ko.observable('');
        this.filter_value_keys = opts.filter_value_keys || [this.label_key];

        if (!Object.isArray(this.filter_value_keys)) {
            throw `Invalid filter_value_keys specified in Checklist: ${this.get_id()}`;
        }

        this.filter_count_threshold = opts.filter_count_threshold || 10;

        this.enable_filter = ko.pureComputed(() => {
            let options = this.options() || [];

            return this._enable_filter && options.length >= this.filter_count_threshold;
        });

        this.invert_selection = function(options, selected, values_only) {
            if (options && options.length) {
                let inverted = ko.unwrap(options).filter(opt => {
                    return (
                        ko.unwrap(selected).filter(sel => {
                            return (
                                opt[this.value_key] ==
                                (sel[this.value_key] ? sel[this.value_key] : sel)
                            );
                        }).length == 0
                    );
                });

                if (values_only) {
                    return inverted.map(val => {
                        return val[this.value_key];
                    });
                }
                return inverted;
            }

            return [];
        };

        this.selected = ko.pureComputed(() => {
            let _selected = this._selected();
            let options = this.options() || [];
            if (this.select_first_option && options.length > 0 && !Utils.is_set(_selected, true)) {
                _selected[options[0][this.value_key]] = true;
            }
            let selected_opts = options.filter(option => {
                return this._option_is_selected(option, _selected);
            });
            if (this.filter_mode() == 'exclude') {
                return this.invert_selection(options, selected_opts);
            }

            return selected_opts;
        });

        this._strings_formatter = Formatters.gen_formatter('strings');

        this.selected_string = ko.pureComputed(() => {
            let selected = this.selected();

            if (selected && selected.length > 0) {
                return this._strings_formatter(selected.map(s => this._option_label(s)));
            }

            if (this.empty()) {
                return this.strings.empty;
            }

            return this.strings.no_selection;
        });

        this.selected_values = ko.pureComputed(() => {
            return this.selected().map(option => this._option_value(option));
        });

        this.enabled_options = ko.pureComputed(() => {
            let options = this.options();

            if (options) {
                return options.filter(opt => !this._option_is_disabled(opt));
            }

            return [];
        });

        this.filtered_options = ko.pureComputed(() => {
            let options = this.options();
            let _selected = this._selected();

            if (this.enable_filter() && options) {
                return options.filter(option => {
                    let is_label = this.is_label(option);
                    let is_selected = this._option_is_selected(option, _selected);
                    let value = this._option_filter_value(option);
                    let filter_value = this.filter_value().toLowerCase();

                    return (
                        is_label ||
                        is_selected ||
                        (value &&
                            value
                                .toString()
                                .toLowerCase()
                                .includes(filter_value))
                    );
                });
            }

            return options;
        });

        this.no_matches = ko.pureComputed(() => {
            let options = this.options();

            if (options) {
                return options.length > 0 && this.filtered_options().length === 0;
            }

            return false;
        });

        this.empty = ko.pureComputed(() => {
            let options = this.options();

            if (options) {
                return options.length === 0;
            }

            return true;
        });

        this.modified = ko.pureComputed(() => {
            return this.selected().length > 0;
        });

        this.has_selected = this.modified;

        this.get_value = ko.pureComputed(() =>
            this.single_selection ? this.selected()[0] : this.selected(),
        );
        this.get_keyed_value = ko.pureComputed(() => {
            if (!this.value_key) {
                return this.get_value();
            }

            let selected = this.selected();
            if (this.single_selection) {
                return (selected[0] || {})[this.value_key];
            }

            return selected.map(val => val[this.value_key]);
        });

        if (opts.selected_datasource || opts.selected_data) {
            this._selected_datasource = this.new_instance(DataSource, {
                datasource: opts.selected_datasource,
                data: opts.selected_data,
            });

            // We ensure below that the order in which selected datasource
            // and the content of the checklist (this.data) loads is
            // irrelevant to the behavior.

            this._selected_datasource.data.subscribe(selected => {
                // If datasource was specified to only define default value,
                // and there are already elements selected, we just skip
                // forward
                if (opts.selected_datasource_default_only && Utils.is_set(this.selected(), true)) {
                    return;
                }

                if (Utils.is_set(this.data())) {
                    this.set_selected_from_source(
                        Utils.is_set(selected, true) ? selected : undefined,
                    );
                }
            });

            this.data.subscribe(() => {
                // Prevent reset to default every time the content of the
                // checklist changes
                if (!Utils.is_set(this._selected(), true)) {
                    this.restore_defaults();
                }
            });

            this.restore_defaults = () => {
                // We only restore to default if we have data for both
                // the content of the Checklist and the selection datasource
                if (
                    Utils.is_set(this.data(), true) &&
                    Utils.is_set(this._selected_datasource.data())
                ) {
                    this.set_selected_from_source(this._selected_datasource.data());
                }
            };

            this.restore_defaults();
        }

        if (this.selection_event) {
            Observer.register(this.selection_event, value => {
                this.set_selected(value);
            });
        }

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

    toggle_select_all() {
        const options = this.options();
        if (options.length > this.selected().length) {
            // If there are unselected values, make all values selected
            let newValues = Object.fromEntries(options.map(option => [option.value, true]));
            this._selected(newValues);
        } else {
            // Otherwise, deselect all unselectable values
            let newValues = Object.fromEntries(
                options.map(option => [option.value, !!option.disable_untoggle]),
            );
            this._selected(newValues);
        }
    }

    toggle(option) {
        // We don't allow toggling of an option if that option is disabled
        if (this._option_is_disabled(option)) {
            return;
        }

        let _selected = this._selected();
        let value = this._option_value(option);
        let was_selected = _selected[value];

        if (this._option_cannot_be_untoggled(option) && was_selected) {
            return;
        }

        if (this.deselect_event) {
            if (_selected[value]) {
                let _option = this.options().find(option => {
                    return option.value === value;
                });

                if (_option) {
                    Observer.broadcast(this.deselect_event, _option);
                }
            }
        }

        if (this.single_selection) {
            _selected = {};
        }

        _selected[value] = !was_selected;

        this._selected(_selected);
    }

    set_selected(value, is_selected = true) {
        let options = this._options_for_value(value);
        if (!options) {
            return;
        }

        let _selected = this._selected();

        for (let option of options) {
            // We don't want to select values that are disabled. So skip
            // over to the next loop iteration if the current option is.
            if (this._option_is_disabled(option)) {
                continue;
            }

            _selected[this._option_value(option)] = is_selected;
        }

        this._selected(_selected);
    }

    is_selected(option) {
        return this._option_is_selected(option);
    }

    option_css(option) {
        let css = Utils.ensure_css_object(this._option_css);

        css.checked = this._option_is_selected(option);

        return css;
    }

    _option_filter_value(option) {
        if (option) {
            return this.filter_value_keys.reduce((res, key) => {
                let value = option[key];

                if (res && value) {
                    return [res, value].join('|');
                }

                return value || res;
            }, null);
        }
    }

    _option_is_disabled(option) {
        if (this.option_disabled_key && option) {
            return option[this.option_disabled_key];
        }
    }

    _option_cannot_be_untoggled(option) {
        if (this.option_disable_untoggle_key && option) {
            return option[this.option_disable_untoggle_key];
        }
    }

    _option_label(option) {
        if (option) {
            return option[this.label_key];
        }
    }

    _option_sub_label(option) {
        if (this.sub_label_key && option) {
            return option[this.sub_label_key];
        }
    }

    _option_value(option) {
        if (option) {
            return option[this.value_key];
        }
    }

    _option_is_selected(option, _selected) {
        let selected = _selected || this._selected();

        return selected && selected[this._option_value(option)] === true;
    }

    _options_for_value(value) {
        if (this.options()) {
            return this.options().filter(opt => this._option_value(opt) === value);
        }

        return undefined;
    }

    is_label(option) {
        return option && option._is_label;
    }

    clear_filter() {
        this.filter_value('');
    }

    clear() {
        this.clear_filter();
        this._selected({});
    }

    set_state(state) {
        const new_state = {};
        const value_types = ['number', 'string', 'boolean', 'undefined'];

        if (value_types.includes(typeof state) || state === null) {
            new_state[state] = true;
        } else if (Array.isArray(state)) {
            for (const entry of state) {
                if (value_types.includes(typeof entry) || entry === null) {
                    new_state[entry] = true;
                } else {
                    new_state[this._option_value(entry)] = true;
                }
            }
        } else {
            for (let [key, value] of Object.entries(state)) {
                new_state[key] = value;
            }
        }

        this._selected(new_state);
    }

    get_state() {
        // returns state in a [{value: 'A'}, {value: 'B'}, {value: 2015}] format
        // the {'A': true, 'B': true, 2015:true} format is not stable when passed
        // JSON, or iterating with `for (const [key, val] of Object.entries(..)){...}
        // and shouldn't be used outside the internal this._selected
        const key = this.value_key;

        return this.selected_values().map(value => ({[key]: value}));
    }

    set_selected_from_source(source) {
        this._selected({});

        if (!Utils.is_set(source, true)) {
            return;
        }

        if (Object.isArray(source)) {
            for (let item of source) {
                this.set_selected(Utils.get(item, this.value_key));
            }
        } else if (Object.isObject(source)) {
            this.set_state(source);
        } else {
            this.set_selected(source);
        }
    }
}
