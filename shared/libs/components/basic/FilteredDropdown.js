/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new NewDropdown(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="btn-group option-dropdown new-world-form" data-bind="css: { 'btn-group-justified': !inline, dropup: dropup }">
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
                    <ul class="dropdown-menu" role="menu" style="width:100%" data-bind="css: menu_css">
                        <li data-bind="event_horizon: true" class="filter">
                            <input type="text" class="form-control ignore-new-world" data-bind="textInput: filter_value, attr: { placeholder: strings.filter_placeholder }">
                            <!-- ko if: has_value_and_can_add -->
                            <button type="button" class="btn btn-xs btn-success" data-bind=" click: call_action" style="position: absolute;top: 9px;right: 10px;padding: 5px 10px;width: auto;">
                                <span class="icon-plus"></span>
                            </button>
                            <!-- /ko -->
                        </li>
                        <li class="clear" data-bind="visible: selected() && allow_clear">
                            <a data-bind="click: clear, text: strings.clear"></a>
                        </li>
                        <!-- ko foreach: filtered_options -->
                        <li data-bind="css: { disabled: $parent._option_disabled($data) }">
                            <a data-bind="click: $parent._select_option, attr: { title: $parent._option_label($data) }">
                                <span class="option-label" data-bind="text: $parent._option_label($data), css: { 'with-sub': $parent._option_sublabel($data) }">
                                </span>
                                </span>
                                <span class="option-sublabel" data-bind="visible: $parent._option_sublabel($data), text: $parent._option_sublabel($data)"></span>

                            </a>
                            </span>
                        </li>
                        <!-- /ko -->
                        <li class="disabled" data-bind="visible: no_matches">
                            <a data-bind="text: strings.no_matches"></a>
                        </li>
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
                    <li data-bind="event_horizon: true" class="filter">
                        <input type="text" class="form-control filtered-dropdown-input" data-bind="textInput: filter_value, attr: { placeholder: strings.filter_placeholder }, css: { active: filter_value }">
                        <!-- ko if: has_value_and_can_add -->
                        <button type="button" class="btn btn-xs btn-success" data-bind=" click: call_action" style="position: absolute;top: 9px;right: 10px;padding: 5px 10px;width: auto;">
                            <span class="icon-plus"></span>
                        </button>
                        <!-- /ko -->
                    </li>
                    <li class="clear" data-bind="visible: selected() && allow_clear">
                        <a data-bind="click: clear, text: strings.clear"></a>
                    </li>
                    <!-- ko foreach: filtered_options -->
                    <li data-bind="css: { disabled: $parent._option_disabled($data) }">
                        <a data-bind="click: $parent._select_option, attr: { title: $parent._option_label($data) }">
                            <span class="option-label" data-bind="html: $parent._option_label($data), css: { 'with-sub': $parent._option_sublabel($data) }">
                            </span>
                            <span class="option-sublabel" data-bind="visible: $parent._option_sublabel($data), html: $parent._option_sublabel($data)"></span>

                        </a>
                        </span>
                    </li>
                    <!-- /ko -->
                    <li class="disabled" data-bind="visible: no_matches">
                        <a data-bind="text: strings.no_matches"></a>
                    </li>
                    <li class="disabled" data-bind="visible: empty">
                        <a data-bind="text: strings.empty"></a>
                    </li>
                </ul>
            </div>
        `,
    );

    self.filter_value = ko.observable('');
    self.filter_value_key = opts.filter_value_key || self.label_key;
    self.limit = opts.limit;
    self.min_filter_length = opts.min_filter_length || 0;
    self.value_key = opts.value_key || 'value';

    self.enable_add = opts.enable_add || false;
    self.add_value_mapping =
        opts.add_value_mapping ||
        function(n) {
            return {
                label: n,
                value: n,
            };
        };

    self.strings.filter_placeholder = opts.strings.filter_placeholder || 'Filter...';

    self.strings.no_matches = opts.strings.no_matches || 'No matches...';

    self._option_filter_value = function(option) {
        if (option) {
            return option[self.filter_value_key];
        }
    };

    self.has_value_and_can_add = ko.pureComputed(() => {
        let value = self.filter_value();
        return self.enable_add && value && value.length > 0;
    });

    self.call_action = function() {
        Observer.broadcast_for_id(self.get_id(), 'FilteredDropdown.add_item', self.filter_value());
        if (self.add_value_mapping) {
            let option = self.add_value_mapping(self.filter_value());

            let options = self.options();
            let exists = options.find(n => {
                return n[self.value_key] == option[self.value_key];
            });

            if (!exists) {
                options.push(option);
                self.options(options);
            }
            self.set_selected_by_value(option[self.value_key]);
        }
        self.filter_value('');
    };

    self.__select_option = self._select_option;

    self._select_option = function(option) {
        self.filter_value('');
        Observer.broadcast_for_id(self.get_id(), 'FilteredDropdown.selected', option);
        return self.__select_option(option);
    };

    self.filtered_options = ko.pureComputed(() => {
        let options = self.options();
        if (options) {
            let filter_value = self.filter_value().toLowerCase();
            if (filter_value.length >= self.min_filter_length) {
                return options.filter(option => {
                    let is_selected = self._option_is_selected(option);
                    let value = self._option_filter_value(option);

                    let filter_values = filter_value.split(' ');

                    let has_values = true;
                    for (let i = 0, l = filter_values.length; i < l; i++) {
                        if (
                            is_selected ||
                            value
                                .toString()
                                .toLowerCase()
                                .includes(filter_values[i])
                        ) {
                            continue;
                        } else {
                            has_values = false;
                        }
                    }

                    return has_values; //is_selected || value.toString().toLowerCase().includes(filter_value);
                });
            }
        }

        return typeof self.limit != 'undefined' && options ? options.to(self.limit) : options;
    });

    self.no_matches = ko.pureComputed(() => {
        let options = self.options();

        if (options) {
            return options.length > 0 && self.filtered_options().length === 0;
        }

        return false;
    });

    _dfd.resolve();

    return self;
}
