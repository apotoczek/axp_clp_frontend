/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Mapping from 'src/libs/Mapping';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    if (opts.custom_validator) {
        if (Object.isObject(opts.custom_validator)) {
            self._custom_validator = opts.custom_validator.function;
            self.custom_message = opts.custom_validator.message;
        } else {
            self._custom_validator = opts.custom_validator;
        }
    }

    self._unescape_initial_value =
        opts.unescape_initial_value === undefined ? true : opts.unescape_initial_value;

    self.clear_event = opts.clear_event;
    self.value_format = opts.value_format;

    self.template = opts.template || 'tpl_text_input';
    self.clear_event = opts.clear_event;
    self.typeahead_options = opts.typeahead_options;
    self.typeahead =
        typeof opts.typeahead == 'undefined'
            ? opts.typeahead_options
                ? ko.observable(true)
                : ko.observable(false)
            : opts.typeahead;
    self._stifle_broadcast = false;

    self.search_icon = typeof opts.search_icon !== 'undefined' ? opts.search_icon : false;
    self.allow_empty = opts.allow_empty === undefined ? true : opts.allow_empty;
    self.value_on_empty = opts.value_on_empty;

    self.valid = ko.observable(true);

    self._event_base = 'TextInput';

    self._initial_value_property = opts.initial_value_property;

    self._initial_default_value_property = opts.initial_default_value_property;

    self.label = opts.label;

    self._initial_value_mapping = Mapping.gen_mapping({
        mapping: opts.initial_value_mapping,
        mapping_args: opts.initial_value_mapping_args,
    });

    self._disabled_property = opts.disabled_property;
    self._disabled_callback = opts.disabled_callback;
    self._disabled_label = opts.disabled_label;
    self._placeholder = opts.placeholder;
    self._css = opts.css || {};
    self.length_limit = opts.length_limit;

    self.bordered_label = opts.bordered_label || false;
    self.in_cpanel = opts.in_cpanel || false;

    self.value = ko.observable(opts.value).extend({
        rateLimit: {
            method: 'notifyWhenChangesStop',
            timeout: opts.rateLimit === undefined ? 250 : opts.rateLimit,
        },
    });

    self._error_message = opts.error_message || self.allow_empty ? undefined : 'Can not be empty';
    self.error_message = ko.observable(self._error_message);

    self.focus = function(context, evt) {
        $(evt.currentTarget)
            .prev('input')
            .focus()
            .select();
    };

    self.clear = function() {
        self.value(undefined);
        self.valid(true);
    };

    if (self.clear_event) {
        Observer.register(self.clear_event, () => {
            self.clear();
        });
    }

    self.can_submit = ko.pureComputed(() => {
        let valid = self.valid();
        let allow_empty = self.allow_empty;

        if (!valid) {
            return false;
        }
        if (!allow_empty) {
            if (!Utils.is_set(self.value()) || self.value().length < 1) {
                return false;
            }
        }
        return true;
    });

    self.custom_validator = function(value) {
        if (self._custom_validator) {
            return self._custom_validator(value);
        }
        return true;
    };

    self.value_bind = ko.pureComputed({
        write: function(value) {
            if (self.allow_empty && !Utils.is_set(value, true)) {
                self.valid(true);
                self.value(self.value_on_empty);
                self.error_message(self._error_message);
            } else if (!Utils.is_set(value, true)) {
                self.valid(false);
                self.value(self.value_on_empty);
                self.error_message(self._error_message);
            } else if (!self.custom_validator(value)) {
                self.valid(false);
                self.value(value);
                if (self.custom_message) {
                    self.error_message(self.custom_message);
                }
            } else {
                if (self.length_limit) {
                    if (value.length > self.length_limit.limit) {
                        bison.utils.Notify(
                            'Heads up!',
                            self.length_limit.warning_text,
                            'alert-warning',
                        );
                    }
                }

                self.valid(true);
                self.value(value);
            }
        },
        read: function() {
            return self.value();
        },
    });

    self.css = ko.pureComputed(() => {
        let css = Utils.ensure_css_object(self._css);

        css.nonempty = Utils.is_set(self.value(), true) || !self.valid();

        return css;
    });

    self.disabled = ko.pureComputed(() => {
        if (self._disabled_property || self._disabled_callback) {
            let data = self.data();

            if (self._disabled_property) {
                if (self._disabled_property[0] === '!') {
                    return data && !data[self._disabled_property.slice(1)];
                }

                return data && data[self._disabled_property];
            }

            if (self._disabled_callback) {
                return data && self._disabled_callback(data);
            }
        }
        return false;
    });

    self.placeholder = ko.pureComputed(() => {
        if (self._disabled_placeholder && self.disabled()) {
            return self._disabled_placeholder;
        }

        return self._placeholder;
    });

    self.init = function(enable_data_updates) {
        let _init = self.data.subscribe(data => {
            if (data && self._initial_value_property) {
                let new_value;

                if (Utils.is_set(data[self._initial_value_property])) {
                    new_value = self._initial_value_mapping(data[self._initial_value_property]);
                }

                if (self._unescape_initial_value && new_value && Utils.is_str(new_value)) {
                    new_value = new_value.unescapeHTML();
                }

                if (new_value !== self.value()) {
                    self._stifle_broadcast = true;
                    self.value(new_value);
                }

                if (!enable_data_updates) {
                    _init.dispose();
                }
            }
        });
    };

    self.init(opts.enable_data_updates);

    self._gen_event_type = function(evt) {
        return [self._event_base, evt].join('.');
    };

    self.value.subscribe(value => {
        Observer.broadcast_for_id(self.get_id(), self._gen_event_type('state_with_data'), {
            value: value,
            data: self.data(),
        });

        Observer.broadcast_for_id(self.get_id(), self._gen_event_type('state'), value);

        if (!self._stifle_broadcast) {
            Observer.broadcast_for_id(self.get_id(), self._gen_event_type('value'), value);

            Observer.broadcast_for_id(self.get_id(), self._gen_event_type('value_with_data'), {
                value: value,
                data: self.data(),
            });
        } else {
            self._stifle_broadcast = false;
        }
    });

    self.value_to_text = function() {
        return self.value_bind() || '';
    };

    /*******************************************************************
     * Event listeners
     *******************************************************************/

    if (self.clear_event) {
        Observer.register(self.clear_event, self.clear);
    }

    _dfd.resolve();

    return self;
}
