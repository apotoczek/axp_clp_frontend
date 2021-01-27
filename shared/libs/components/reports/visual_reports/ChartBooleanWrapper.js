/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();
    let true_component_init = self.new_deferred();
    let false_component_init = self.new_deferred();

    self.shared_data = opts.shared_data || false;

    self.boolean_value = ko.observable(opts.boolean_value);
    self.boolean_event = opts.boolean_event;

    self.enable_currency = opts.enable_currency;
    self.currency = ko.observable(opts.currency);

    if (self.boolean_event) {
        Observer.register(self.boolean_event, self.boolean_value);
    }

    if (self.enable_currency) {
        self.currency_event = opts.currency_event;

        if (self.currency_event) {
            Observer.register(self.currency_event, self.currency);
        }

        self.formatter = function(value) {
            let formatter = Formatters.gen_formatter({
                format: 'money',
                format_args: {
                    render_currency: self.currency,
                },
            });

            return formatter(value);
        };
    } else {
        self.formatter = false;
    }

    self.extract_dynamic_data = function() {
        if (self.shared_data) {
            return {
                data: self.data(),
                boolean_value: self.boolean_value(),
                currency: self.currency(),
            };
        }

        return {
            true_component: self.true_component.data(),
            false_component: self.false_component.data(),
            boolean_value: self.boolean_value(),
            currency: self.currency(),
        };
    };

    self.restore_dynamic_data = function(snapshot) {
        if (self.shared_data) {
            self.data(snapshot.data);
        } else {
            self.true_component.data(snapshot.true_component);
            self.false_component.data(snapshot.false_component);
        }

        self.boolean_value(snapshot.boolean_value);
        self.currency(snapshot.currency);
    };

    self.true_config = Object.assign(opts.true_config, {
        formatter: self.formatter,
        data: self.data,
    });

    self.false_config = Object.assign(opts.false_config, {
        formatter: self.formatter,
        data: self.data,
    });

    self.init_component(self.true_config, true_component => {
        self.true_component = true_component;
        self.when(self.true_component).done(() => {
            true_component_init.resolve();
        });
        self.add_dependency(self.true_component);
    });

    self.init_component(self.false_config, false_component => {
        self.false_component = false_component;
        self.when(self.false_component).done(() => {
            false_component_init.resolve();
        });
        self.add_dependency(self.false_component);
    });

    self.define_default_template(`
            <!-- ko if: boolean_value -->
                <!-- ko renderComponent: true_component --><!-- /ko -->
            <!-- /ko -->
            <!-- ko ifnot: boolean_value -->
                <!-- ko renderComponent: false_component --><!-- /ko -->
            <!-- /ko -->
        `);

    _dfd.resolve();

    return self;
}
