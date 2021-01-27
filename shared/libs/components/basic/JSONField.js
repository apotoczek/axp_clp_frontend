/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Mapping from 'src/libs/Mapping';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

class JSONField extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        let _dfd = this.new_deferred();

        if (opts.custom_validator) {
            if (Object.isObject(opts.custom_validator)) {
                this._custom_validator = opts.custom_validator.function;
                this.custom_message = opts.custom_validator.message;
            } else {
                this._custom_validator = opts.custom_validator;
            }
        }

        this.define_template(`
        <div data-bind="css: { 'has-error': !valid(), 'json-field-bordered-label': bordered_label }" class="json-field" style="text-align: center;position:relative">
            <textarea type="text" class="json-field" required data-bind="textInput: value_bind" > </textarea>
            <!-- ko if: $data.label -->
                <label data-bind="text: label, click: focus"></label>
            <!-- /ko -->
            <!-- ko if: !valid() && error_message -->
                <div class="error-message" data-bind="text: error_message, click: focus"></div>
            <!-- /ko -->
        </div>
        `);

        this._unescape_initial_value =
            opts.unescape_initial_value === undefined ? true : opts.unescape_initial_value;

        this.clear_event = opts.clear_event;
        this.value_format = opts.value_format;

        this.template = opts.template || 'tpl_json_field';
        this.clear_event = opts.clear_event;

        this._stifle_broadcast = false;

        this.allow_empty = opts.allow_empty === undefined ? true : opts.allow_empty;
        this.value_on_empty = opts.value_on_empty;

        this.valid = ko.observable(true);

        this._event_base = 'TextArea';

        this._initial_value_property = opts.initial_value_property;

        this._initial_default_value_property = opts.initial_default_value_property;

        this._initial_value_mapping = Mapping.gen_mapping({
            mapping: opts.initial_value_mapping,
            mapping_args: opts.initial_value_mapping_args,
        });

        this._disabled_property = opts.disabled_property;
        this._disabled_callback = opts.disabled_callback;
        this._placeholder = opts.placeholder;
        this._css = opts.css || {};
        this.length_limit = opts.length_limit;

        this.bordered_label = opts.bordered_label || false;

        this.value = ko.observable(opts.value).extend({
            rateLimit: {
                method: 'notifyWhenChangesStop',
                timeout: opts.rateLimit === undefined ? 250 : opts.rateLimit,
            },
        });

        this._error_message =
            opts.error_message || this.allow_empty ? undefined : 'Can not be empty';
        this.error_message = ko.observable(this._error_message);

        if (this.clear_event) {
            Observer.register(this.clear_event, () => {
                this.clear();
            });
        }

        this.can_submit = ko.pureComputed(() => {
            let valid = this.valid();
            let allow_empty = this.allow_empty;

            if (!valid) {
                return false;
            }
            if (!allow_empty && !Utils.is_set(this.value(), true)) {
                return false;
            }

            return true;
        });

        this.value_bind = ko.pureComputed({
            write: value => {
                if (this.allow_empty && !Utils.is_set(value, true)) {
                    this.valid(true);
                    this.value(this.value_on_empty);
                    this.error_message(this._error_message);
                } else if (!Utils.is_set(value, true)) {
                    this.valid(false);
                    this.value(this.value_on_empty);
                    this.error_message(this._error_message);
                } else if (!this.custom_validator(value)) {
                    this.valid(false);
                    this.value(value);
                    if (this.custom_message) {
                        this.error_message(this.custom_message);
                    }
                } else {
                    if (this.length_limit) {
                        if (value.length > this.length_limit.limit) {
                            bison.utils.Notify(
                                'Heads up!',
                                this.length_limit.warning_text,
                                'alert-warning',
                            );
                        }
                    }

                    this.valid(true);
                    this.value(value);
                }
            },

            read: () => this.value(),
        });

        this.css = ko.pureComputed(() => {
            let css = Utils.ensure_css_object(this._css);

            css.nonempty = Utils.is_set(this.value(), true) || !this.valid();

            return css;
        });

        this.text_str = ko.pureComputed(() => {
            if (this.data()) {
                return this.data().config_data;
            }
        });

        this.disabled = ko.pureComputed(() => {
            if (this._disabled_property || this._disabled_callback) {
                let data = this.data();

                if (this._disabled_property) {
                    if (this._disabled_property[0] === '!') {
                        return data && !data[this._disabled_property.slice(1)];
                    }

                    return data && data[this._disabled_property];
                }

                if (this._disabled_callback) {
                    return data && this._disabled_callback(data);
                }
            }
            return false;
        });

        this.placeholder = ko.pureComputed(() => {
            if (this._disabled_placeholder && this.disabled()) {
                return this._disabled_placeholder;
            }

            return this._placeholder;
        });

        this.init(opts.enable_data_updates);

        this.value.subscribe(value => {
            Observer.broadcast_for_id(this.get_id(), this._gen_event_type('state_with_data'), {
                value: value,
                data: this.data(),
            });

            Observer.broadcast_for_id(this.get_id(), this._gen_event_type('state'), value);

            if (!this._stifle_broadcast) {
                Observer.broadcast_for_id(this.get_id(), this._gen_event_type('value'), value);

                Observer.broadcast_for_id(this.get_id(), this._gen_event_type('value_with_data'), {
                    value: value,
                    data: this.data(),
                });
            } else {
                this._stifle_broadcast = false;
            }
        });

        /*******************************************************************
         * Event listeners
         *******************************************************************/

        if (this.clear_event) {
            Observer.register(this.clear_event, this.clear);
        }

        _dfd.resolve();
    }

    focus(context, evt) {
        $(evt.currentTarget)
            .prev('input')
            .focus()
            .select();
    }

    custom_validator = value => {
        if (this._custom_validator) {
            return this._custom_validator(value);
        }
        return true;
    };

    init() {
        let _init = this.data.subscribe(data => {
            if (data && this._initial_value_property) {
                let new_value;

                if (Utils.is_set(data[this._initial_value_property])) {
                    new_value = this._initial_value_mapping(data[this._initial_value_property]);
                }

                if (this._unescape_initial_value && new_value && Utils.is_str(new_value)) {
                    new_value = new_value.unescapeHTML();
                }

                if (new_value !== this.value()) {
                    this._stifle_broadcast = true;
                    this.value(new_value);
                }
            }
        });
    }

    value_to_text() {
        return this.value_bind() || '';
    }

    _gen_event_type(evt) {
        return [this._event_base, evt].join('.');
    }

    clear = () => {
        this.value(undefined);
        this.valid(true);
    };
}
export default JSONField;
