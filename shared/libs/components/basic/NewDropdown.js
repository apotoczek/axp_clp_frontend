/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Mapping from 'src/libs/Mapping';

export default function(opts) {
    let self = new BaseComponent(opts);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <!-- ko if: in_pdf -->
                <h2 class="pdf-header" data-bind="text: _selected_text()"></h2>
            <!-- /ko -->
            <div class="btn-group option-dropdown new-world-form" data-bind="css: { 'btn-group-justified': !inline, dropup: dropup }, visible:visible">
                <div class="btn-group">
                    <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" data-bind="css: btn_css, disable: disabled, attr: { title: _selected_text() }, style: btn_style">
                    <div class="pull-left dropdown-label">
                        <strong data-bind="visible: $data.label"><span data-bind="text: label"></span>:</strong>
                        <span data-bind="text: _selected_text, visible: !empty()"></span>
                        <span data-bind="text: strings.empty, visible: empty"></span>
                    </div>
                    <div class="pull-right">
                        <span class="caret"></span>
                    </div>
                    </button>
                    <ul class="dropdown-menu" role="menu" data-bind="css: menu_css">
                        <li class="clear" data-bind="visible: selected() && allow_clear">
                            <a data-bind="click: clear, text: strings.clear"></a>
                        </li>
                        <!-- ko foreach: options -->
                        <li data-bind="css: { disabled: $parent._option_disabled($data) }">
                            <a data-bind="click: $parent._select_option, attr: { title: $parent._option_label($data) }">
                                <span class="option-label" data-bind="text: $parent._option_label($data), css: { 'with-sub': $parent._option_sublabel($data) }">
                                </span>
                                <span class="option-sublabel" data-bind="visible: $parent._option_sublabel($data), text: $parent._option_sublabel($data)"></span>

                            </a>
                            </span>
                        </li>
                        <!-- /ko -->
                        <li class="disabled" data-bind="visible: empty">
                            <a data-bind="text: strings.empty"></a>
                        </li>
                    </ul>
                </div>
            </div>
        `);

    self.define_template(
        'text-inline',
        `
            <!-- ko if: in_pdf -->
                <span class="pdf-inline-header" data-bind="text: _selected_text()"></span>
            <!-- /ko -->
            <div class="dropdown" style="display: inline-block;">
                <button type="button" class="btn-link dropdown-toggle" data-toggle="dropdown" data-bind="css: btn_css, disable: disabled, attr: { title: _selected_text() }, style: btn_style">
                    <span data-bind="html: _selected_text, visible: !empty()"></span>
                    <span data-bind="text: strings.empty, visible: empty"></span>
                    <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" role="menu" data-bind="css: menu_css">
                    <li class="clear" data-bind="visible: selected() && allow_clear">
                        <a data-bind="click: clear, text: strings.clear"></a>
                    </li>
                    <!-- ko foreach: options -->
                    <li data-bind="css: { disabled: $parent._option_disabled($data) }">
                        <a data-bind="click: $parent._select_option, attr: { title: $parent._option_label($data) }">
                            <span class="option-label" data-bind="html: $parent._option_label($data), css: { 'with-sub': $parent._option_sublabel($data) }">
                            </span>
                            <span class="option-sublabel" data-bind="visible: $parent._option_sublabel($data), html: $parent._option_sublabel($data)"></span>

                        </a>
                        </span>
                    </li>
                    <!-- /ko -->
                    <li class="disabled" data-bind="visible: empty">
                        <a data-bind="text: strings.empty"></a>
                    </li>
                </ul>
            </div>
        `,
    );

    opts.strings = opts.strings || {};
    self.strings = {
        no_selection:
            typeof opts.strings.no_selection !== 'undefined'
                ? opts.strings.no_selection
                : 'Select One',
        clear: opts.strings.clear || 'Clear',
        empty: opts.strings.empty || 'No choices..',
    };
    self.refresh_event = opts.refresh_event;
    self._table_placement = ko.observable();

    self.in_pdf = Utils.default_value(opts.in_pdf, true);

    self._btn_css = opts.btn_css || {'btn-ghost-info': true};
    self.inline = opts.inline || false;
    self.menu_css = opts.menu_css || {};
    self.btn_style = opts.btn_style || {};
    self.clear_event = opts.clear_event;

    if (self.clear_event) {
        if (Array.isArray(self.clear_event)) {
            Observer.register_many(self.clear_event, () => {
                self.clear();
            });
        } else {
            Observer.register(self.clear_event, () => {
                self.clear();
            });
        }
    }

    if (opts.min_width) {
        self.btn_style['min-width'] = opts.min_width;
    }

    self.dropup =
        opts.dropup ||
        ko.pureComputed(() => {
            return self._table_placement() === 'bottom';
        });

    self.label = opts.label;

    self._default_selected_index = opts.default_selected_index;

    if (opts.allow_clear !== undefined) {
        self.allow_clear = opts.allow_clear;
    } else {
        self.allow_clear = !Utils.is_set(self._default_selected_index, true);
    }

    self.allow_empty = opts.allow_empty === undefined ? true : opts.allow_empty;
    self.value_on_empty = opts.value_on_empty || null;

    self.label_key = opts.label_key || opts.key || 'label';
    self.value_key = opts.value_key || 'value';
    self.sublabel_key = opts.sublabel_key;
    self.sublabel_parenthesis = opts.sublabel_parenthesis || false;

    self.options = self.data;
    self.broadcast_data = ko.observable();

    self._selected_value = ko.observable();

    if (opts.options) {
        self.options(opts.options);
    }

    self._disabled_property = opts.disabled_property;
    self._disabled_callback = opts.disabled_callback;

    self._option_disabled_property = opts.option_disabled_property;
    self._option_disabled_callback = opts.option_disabled_callback;

    self.btn_css = ko.pureComputed(() =>
        Object.assign({}, self._btn_css, {
            disabled: self.disabled(),
        }),
    );

    self.set_selected_by_value = function(value) {
        if (value !== undefined) {
            if (self._selected_value.peek() !== value) {
                self._selected_value(value);
            }
        }
    };

    self.set_selected_by_label = function(label) {
        if (Utils.is_set(label, true)) {
            self.set_selected_by_value(self._option_value(self._label_index()[label]));
        }
    };

    self._clear = function(stifle_broadcast) {
        self._selected_value(undefined);

        if (!stifle_broadcast) {
            self._broadcast_selected();
        }
    };

    self.clear = function() {
        self._clear(false);
    };

    self.selected_value = function() {
        let selected = self.selected();

        if (selected) {
            return self._option_value(selected);
        }

        if (self.allow_empty) {
            return self.value_on_empty;
        }

        return undefined;
    };

    self.value = function() {
        return self.selected_value();
    };

    self.selected_label = function() {
        let selected = self.selected();

        if (selected) {
            return self._option_label(selected);
        }

        return undefined;
    };

    self._broadcast_selected = function(selected) {
        Observer.broadcast_for_id(self.get_id(), 'Dropdown.selected_with_data', {
            selected: selected,
            data: self.broadcast_data(),
        });

        Observer.broadcast_for_id(self.get_id(), 'Dropdown.selected', selected);

        Observer.broadcast_for_id(self.get_id(), 'Dropdown.value_with_data', {
            selected: selected,
            data: self.broadcast_data(),
        });

        Observer.broadcast_for_id(self.get_id(), 'Dropdown.value', selected);
    };

    self.set_inner_state = function(payload) {
        self.set_selected_by_value(payload.state);
    };

    self._select_option = function(option) {
        self._selected_value(self._option_value(option));

        self._broadcast_selected(option);
    };

    self._option_label = function(option) {
        if (option) {
            return option[self.label_key];
        }
    };

    self._option_sublabel = function(option) {
        if (self.sublabel_key && option) {
            return self.sublabel_parenthesis
                ? `(${option[self.sublabel_key]})`
                : option[self.sublabel_key];
        }
    };

    self._option_disabled = function(option) {
        if (self._option_disabled_property || self._option_disabled_callback) {
            if (self._option_disabled_property) {
                if (self._option_disabled_property[0] === '!') {
                    return option && !option[self._option_disabled_property.slice(1)];
                }

                return option && option[self._option_disabled_property];
            }

            if (self._option_disabled_callback) {
                return option && self._option_disabled_callback(option);
            }
        }
        return false;
    };

    self._option_value = function(option) {
        if (option) {
            return option[self.value_key];
        }
    };

    self._option_is_selected = function(option) {
        let selected = self.selected();

        return selected && self._option_value(selected) === self._option_value(option);
    };

    self.valid = ko.pureComputed(() => {
        let has_selection = self.has_selected();
        if (!self.allow_empty && !has_selection) {
            return false;
        }

        return true;
    });

    self._value_index = ko.pureComputed(() => {
        let _value_index = {};
        let options = self.options();
        if (options) {
            for (let i = 0, l = options.length; i < l; i++) {
                _value_index[self._option_value(options[i])] = options[i];
            }
        }
        return _value_index;
    });

    self._label_index = ko.pureComputed(() => {
        let _label_index = {};
        let options = self.options();
        if (options) {
            for (let i = 0, l = options.length; i < l; i++) {
                _label_index[self._option_value(options[i])] = options[i];
            }
        }
        return _label_index;
    });

    self.selected = ko.pureComputed(() => {
        let value = self._selected_value();
        let value_index = self._value_index();
        if (Utils.is_set(value_index, true) && value !== undefined && value_index[value]) {
            return value_index[value];
        }

        let options = self.options();

        if (
            Utils.is_set(self._default_selected_index) &&
            options &&
            options.length > self._default_selected_index
        ) {
            return options[self._default_selected_index];
        }
    });

    self.empty = ko.pureComputed(() => {
        let options = self.options();
        if (options) {
            return options.length == 0;
        }
        return true;
    });

    self.has_selected = ko.pureComputed(() => {
        return self.selected() !== undefined;
    });

    self._selected_text = ko.computed(() => {
        return self.selected_label() || self.strings.no_selection;
    });

    self.disabled = ko.pureComputed(() => {
        let data = self.broadcast_data();

        if (self._disabled_callback) {
            return self._disabled_callback(data);
        }

        if (self._disabled_property) {
            if (self._disabled_property) {
                if (self._disabled_property[0] === '!') {
                    return data && !data[self._disabled_property.slice(1)];
                }

                return data && data[self._disabled_property];
            }
        }
        return false;
    });

    self.values = ko.pureComputed(() => {
        return self.options().map(self._option_value);
    });

    self._broadcast_state = function() {
        let selected = self.selected();

        Observer.broadcast_for_id(self.get_id(), 'Dropdown.state', selected);

        Observer.broadcast_for_id(self.get_id(), 'Dropdown.state_with_data', {
            value: selected,
            data: self.broadcast_data(),
        });
    };

    self.selected.subscribe(self._broadcast_state);

    Observer.register_for_id(self.get_id(), 'new_listener.Dropdown.state', self._broadcast_state);
    Observer.register_for_id(
        self.get_id(),
        'new_listener.Dropdown.state_with_data',
        self._broadcast_state,
    );

    if (opts.refresh_event) {
        Observer.register(opts.refresh_event, () => {
            self.refresh_data(true);
        });
    }

    if (opts.selected) {
        self._selected_mapping = Mapping.gen_mapping(opts.selected);
        self._selected_datasource = self.new_instance(DataSource, opts.selected);

        self._selected_datasource.data.subscribe(value => {
            self.set_selected_by_value(self._selected_mapping(value));
        });

        self.set_selected_by_value(self._selected_mapping(self._selected_datasource.data()));
    }

    //Used when generating csv of table with dropdowns
    self.value_to_text = function() {
        let text = self._selected_text();
        return text === self.strings.no_selection ? '' : text;
    };

    _dfd.resolve();

    return self;
}
