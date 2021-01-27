/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts) {
    let self = new BaseComponent(opts);

    let _dfd = self.new_deferred();

    self.keys = [];
    self.fields = {};

    self.show_validation = ko.observable(false);

    self.gen_invalid_fn = function(field, return_msg) {
        return function() {
            let value = field.value() || '';

            if (field.required && value.length === 0) {
                return return_msg ? `${field.label} is required.` : true;
            }

            if (field.is_valid_email && !bison.helpers.is_valid_email(value)) {
                return return_msg ? `${field.label} is not a valid email.` : true;
            }

            if (field.min_length && value.length < field.min_length) {
                return return_msg
                    ? `${field.label} is too short (has to be at least ${field.min_length} characters).`
                    : true;
            }

            if (field.max_length && value.length > field.max_length) {
                return return_msg
                    ? `${field.label} is too long (has to be shorter than ${field.max_length} characters).`
                    : true;
            }

            if (field.matches) {
                let other_field = self.fields[field.matches];
                if (other_field.value() !== value) {
                    if (return_msg) {
                        if (field.mismatch_msg) {
                            return field.mismatch_msg;
                        }
                        return `${field.label} does not match ${other_field.label}`;
                    }
                    return true;
                }
            }

            return false;
        };
    };

    opts.fields.forEach(field => {
        self.keys.push(field.key);

        if (typeof field.value === 'function') {
            self.fields[field.key] = {
                invalid: ko.computed(self.gen_invalid_fn(field, false)),
                message: ko.computed(self.gen_invalid_fn(field, true)),
                value: field.value,
                disabled: field.disabled,
                label: field.label,
                placeholder: field.placeholder || field.label,
                nonempty: ko.computed(() => {
                    return ko.unwrap(field.value) && ko.unwrap(field.value).length > 0;
                }),
            };
        } else {
            self.fields[field.key] = {
                invalid: function() {
                    return false;
                },
                message: function() {
                    return false;
                },
                value: function() {
                    return field.value;
                },
            };
        }
    });

    self.data = function() {
        let data = {};
        for (let i = 0, l = self.keys.length; i < l; i++) {
            let key = self.keys[i];
            let field = self.fields[key];
            data[key] = field.value();
        }

        return data;
    };

    self.invalid = function(key) {
        if (self.show_validation()) {
            return self.fields[key].invalid();
        }
        return false;
    };

    self.message = function(key) {
        if (self.show_validation()) {
            return self.fields[key].message();
        }
    };

    self.validate = function(notify) {
        notify = notify || false;
        for (let i = 0, l = self.keys.length; i < l; i++) {
            let field = self.fields[self.keys[i]];
            if (field.invalid()) {
                if (notify) {
                    bison.utils.Notify('Heads up!', field.message());
                }
                return false;
            }
        }
        return true;
    };

    _dfd.resolve();

    return self;
}
