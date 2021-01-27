/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <div style="min-width: 200px;">
                <!-- ko if: enable_filter -->
                    <input type="text" class="form-control input-sm" style="margin-bottom: 5px;" data-bind="textInput: filter_value, attr: { placeholder: strings.filter_placeholder }" />
                <!-- /ko -->
                <ul data-bind="foreach: filtered_options" style="max-height: 400px;" class="list-unstyled force-scrollable-y">
                    <li style="margin-bottom: 5px;">
                        <!-- ko ifnot: $parent.is_label($data) -->
                            <button class="btn clearfix" data-bind="disable: $parent._option_is_disabled($data), css: $parent.option_css($data), click: $parent.toggle" style="padding-left: 10px; padding-right:10px;">

                                <span class="btn-label text-left pull-left">
                                    <span data-bind="html: $parent._option_label($data)"></span>
                                    <!-- ko if: $parent._option_sub_label($data) -->
                                        <span class="sub-label" data-bind="html: $parent._option_sub_label($data)"></span>
                                    <!-- /ko -->
                                </span>
                                <span class="btn-icon glyphicon glyphicon-ok pull-right" data-bind="visible: $parent.is_selected($data)"></span>
                            </button>
                        <!-- /ko -->
                        <!-- ko if: $parent.is_label($data) -->
                            <span data-bind="html: label" style="text-transform:uppercase;font-size: 10px;margin-left:2px;"></span>
                        <!-- /ko -->
                    </li>
                </ul>
                <button class="btn" data-bind="css: close_btn_css, text: strings.close" data-dismiss="popover">Done</button>
                <button class="btn" data-bind="css: clear_btn_css, click: clear, enable: modified, text: strings.clear">Clear</button>
            </div>
        `);

    self.define_template(
        'button_group',
        `
            <div class="row">
                <div class="btn-group" role="group" aria-label="..." data-bind="foreach: data">
                    <!-- ko if: $data.type == 'dropdown' -->
                        <div class="btn-group" role="group">
                            <button
                                type="button"
                                class="btn btn-ghost dropdown-toggle"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                                data-bind="css: { checked: $parent.is_selected($data.items) }">
                                <span data-bind="text: label"></span>
                                <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu" data-bind="foreach: items">
                                <li data-bind="click: $parents[1].toggle"><a data-bind="text: label"></a></li>
                            </ul>
                        </div>
                    <!-- /ko -->
                    <!-- ko if: $data.type == 'dateRangePicker' -->
                    <button
                        type="button"
                        class="btn btn-ghost"
                        data-bind="text: label, click: $parent.toggle, css: { checked: $parent.is_selected($data) }, dateRangePicker: $data.dateRangePickerConfig">
                    </button>
                    <!-- /ko -->
                    <!-- ko if: (!$data.type || $data.type == 'normal') -->
                    <button
                        type="button"
                        class="btn btn-ghost"
                        data-bind="text: label, click: $parent.toggle, css: { checked: $parent.is_selected($data),  }, ">
                    </button>
                    <!-- /ko -->
                </div>
            </div>
        `,
    );

    self.define_template(
        'popover_mode_selection',
        `
            <div class="row">
                <div style="padding-right:17px; padding-bottom:10px;"  class="btn-group btn-block popover-mode-select" role="group" aria-label="..." data-bind="foreach: data">
                    <!-- ko if: (!$data.type || $data.type == 'normal') -->
                    <button
                        type="button"
                        class="col-xs-6 btn btn-cpanel-primary btn-xs"
                        data-bind="text: label, click: $parent.toggle, css: { checked: $parent.is_selected($data),  }, ">
                    </button>
                    <!-- /ko -->
                </div>
            </div>
        `,
    );

    self.define_template(
        'metric_selection',
        `
            <div class="row">
                <div class="group btn-group" role="group" aria-label="..." data-bind="foreach: data">
                    <button type="button" class="btn btn-ghost-info" data-bind="click: $parent.toggle, css: { checked: $parent.is_selected($data) }">
                        <span data-bind="text:count" class="metric-value"></span><br />
                        <span data-bind="text:name" class="metric-label"></span>
                    </button>
                </div>
            </div>
        `,
    );

    let _dfd = self.new_deferred();

    self.options = self.data;

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

    self._enable_filter = opts.enable_filter || false;

    self.label_key = opts.label_key || opts.key || 'label';
    self.value_key = opts.value_key || 'value';
    self.sub_label_key = opts.sub_label_key || false;
    self.option_disabled_key = opts.option_disabled_key || false;
    opts.strings = opts.strings || {};

    self._option_css = opts.option_css || {
        'btn-popover-checklist-item': true,
        'btn-block': true,
        'btn-sm': true,
    };

    self.strings = {
        no_selection: opts.strings.no_selection || 'Select One',
        clear: opts.strings.clear || 'Clear',
        empty: opts.strings.empty || 'No choices..',
        filter_placeholder: opts.strings.filter_placeholder || 'Filter...',
        no_matches: opts.strings.no_matches || 'No matches...',
        close: opts.strings.close || 'Done',
    };

    if (opts.options) {
        self.options(opts.options);
    }

    self._selection_comparator = opts.selection_comparator || ((l, r) => l === r);
    self._selected = ko.observable(undefined);
    self.state = ko.pureComputed(() => self._selected());
    self._selected.subscribe(val => {
        Observer.broadcast_for_id(self.get_id(), 'Radiolist.selected', val);
    });

    self.default_selected_index = Utils.default_value(opts.default_selected_index, 0);
    self.default_selected_value = opts.default_selected_value;

    self.filter_value = ko.observable('');
    self.filter_value_keys = opts.filter_value_keys || [self.label_key];

    if (!Object.isArray(self.filter_value_keys)) {
        throw 'Invalid filter_value_keys specified in Radiolist';
    }

    self.filter_count_threshold = opts.filter_count_threshold || 10;

    self.enable_filter = ko.pureComputed(() => {
        let options = self.options() || [];

        return self._enable_filter && options.length >= self.filter_count_threshold;
    });

    self.toggle = function(option) {
        let value = self._option_value(option);

        self._selected(value);
    };

    self.set_selected = function(value) {
        self._selected(value);
    };

    self.is_selected = function(option) {
        if (Object.isArray(option)) {
            for (let item of option) {
                if (self._option_is_selected(item)) {
                    return true;
                }
            }
            return false;
        }
        return self._option_is_selected(option);
    };

    self.option_css = function(option) {
        let css = Utils.ensure_css_object(self._option_css);

        css.checked = self._option_is_selected(option);

        return css;
    };

    self._option_filter_value = function(option) {
        if (option) {
            return self.filter_value_keys.reduce((res, key) => {
                let value = option[key];

                if (res && value) {
                    return [res, value].join('|');
                }

                return value || res;
            }, null);
        }
    };

    self._option_is_disabled = function(option) {
        if (self.option_disabled_key && option) {
            return option[self.option_disabled_key];
        }
    };

    self._option_label = function(option) {
        if (option) {
            return option[self.label_key];
        }
    };

    self._option_sub_label = function(option) {
        if (self.sub_label_key && option) {
            return option[self.sub_label_key];
        }
    };

    self._option_value = function(option) {
        if (option) {
            return option[self.value_key];
        }
    };

    self._is_valid_selection = function(selected) {
        if (selected !== undefined) {
            let valid_values = self.enabled_options().map(option => self._option_value(option));

            return valid_values.includes(selected);
        }

        return false;
    };

    self._option_is_selected = function(option, _selected) {
        let selected = _selected || self._selected();

        if (!self._is_valid_selection(selected) && Utils.is_set(self.default_selected_index)) {
            return self.enabled_options().indexOf(option) === self.default_selected_index;
        }

        return self._selection_comparator(self._option_value(option), selected);
    };

    self.is_label = function(option) {
        return option && option._is_label;
    };

    self.clear_filter = function() {
        self.filter_value('');
    };

    self.clear = function() {
        self.clear_filter();
        self._selected(self.default_selected_value);
    };

    self.selected = ko.pureComputed(() => {
        let _selected = self._selected();
        let options = self.options() || [];

        return options.find(option => {
            return self._option_is_selected(option, _selected);
        });
    });

    self.selected_label = ko.pureComputed(() => {
        let selected = self.selected();

        if (selected) {
            return self._option_label(selected);
        }

        if (self.empty()) {
            return self.strings.empty;
        }

        return self.strings.no_selection;
    });

    self.selected_string = ko.pureComputed(() => {
        return self.selected_label();
    });

    self.selected_value = ko.pureComputed(() => {
        let selected = self.selected();

        if (selected) {
            return self._option_value(selected);
        }
    });

    self.enabled_options = ko.pureComputed(() => {
        let options = self.options();

        if (options) {
            return options.filter(option => !self._option_is_disabled(option));
        }

        return [];
    });

    self.filtered_options = ko.pureComputed(() => {
        let options = self.options();
        let _selected = self._selected();

        if (self.enable_filter() && options) {
            return options.filter(option => {
                let is_label = self.is_label(option);
                let is_selected = self._option_is_selected(option, _selected);
                let value = self._option_filter_value(option);
                let filter_value = self.filter_value().toLowerCase();

                return (
                    is_label ||
                    is_selected ||
                    value
                        .toString()
                        .toLowerCase()
                        .includes(filter_value)
                );
            });
        }

        return options || [];
    });

    self.no_matches = ko.pureComputed(() => {
        let options = self.options();

        if (options) {
            return options.length > 0 && self.filtered_options().length === 0;
        }

        return false;
    });

    self.empty = ko.pureComputed(() => {
        let options = self.options();

        if (options) {
            return options.length === 0;
        }

        return true;
    });

    self.modified = ko.pureComputed(() => {
        return self.selected() !== undefined;
    });

    self.has_selected = self.modified;

    self.get_value = self.selected;

    self.set_state = function(state) {
        self._selected(state);
    };

    self.get_state = function() {
        return self._selected();
    };

    if (opts.selected_datasource) {
        self._selected_datasource = new BaseComponent({
            datasource: opts.selected_datasource,
        });

        let data_init = self.data.subscribe(() => {
            self.set_selected(self._selected_datasource.data() || undefined);
            data_init.dispose();
        });

        self._selected_datasource.data.subscribe(selected => {
            if (self.set_selected(Utils.is_set(selected) ? selected : undefined)) {
                data_init.dispose();
            }
        });

        self.restore_defaults = function() {
            self.set_selected(self._selected_datasource.data() || undefined);
        };

        self.restore_defaults();
    } else if (self.default_selected_value) {
        self.set_selected(self.default_selected_value);
    }

    _dfd.resolve();

    return self;
}
