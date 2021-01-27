/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();
    let chart_init = self.new_deferred();

    self.currency = ko.observable(opts.currency);
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

    self.extract_dynamic_data = function() {
        return {
            chart: self.chart.data(),
            currency: self.currency(),
        };
    };

    self.restore_dynamic_data = function(snapshot) {
        self.chart.data(snapshot.chart);
        self.currency(snapshot.currency);
    };

    self.chart_config = Object.assign(opts.chart_config, {
        formatter: self.formatter,
    });

    self.init_component(self.chart_config, chart => {
        self.chart = chart;
        self.when(self.chart).done(() => {
            chart_init.resolve();
        });
        self.add_dependency(self.chart);
    });

    self.define_default_template(`
            <!-- ko renderComponent: chart --><!-- /ko -->
        `);

    _dfd.resolve();

    return self;
}
