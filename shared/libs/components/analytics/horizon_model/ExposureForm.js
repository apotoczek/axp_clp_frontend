/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import * as Constants from 'src/libs/Constants';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PercentInput from 'src/libs/components/basic/PercentInput';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="row" data-bind="foreach: columns">
                <div class="col-xs-6" >
                    <table class="table table-bison table-light table-sm">
                        <thead>
                            <tr>
                                <th class="table-field">Style</th>
                                <th class="table-field">Current %</th>
                                <th class="table-field">Target %</th>
                            </tr>
                        </thead>
                        <tbody data-bind="foreach: $data">
                            <tr>
                                <td class="table-field" data-bind="text: label"></td>
                                <td class="table-field" data-bind="text: current"></td>
                                <td class="table-field" style="width: 75px;" data-bind="renderComponent: input"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="row">
                <div class="col-xs-6">
                    <button class="btn btn-xs btn-default" data-bind="click: set_zeroes">
                        Clear
                    </button>
                    <button class="btn btn-xs btn-default" data-bind="click: set_even_exposure">
                        Even distribution
                    </button>
                    <button class="btn btn-xs btn-default" data-bind="click: reset">
                        Set to current
                    </button>
                </div>
                <div class="col-xs-6">
                    <small style="font-size:12px;" data-bind="css: {
                        'text-danger': !valid(),
                        'text-success': valid(),
                    }">
                        <strong>Sum: </strong>
                        <span data-bind="text: total_pct"></span>
                        <span data-bind="if: !valid()">(Invalid)</span>
                    </small>
                </div>
            </div>
        `);

    self.choices = Constants.horizon_model_style_options;

    self.rows = [];

    self.gen_row = function(choice) {
        return {
            value: choice.value,
            label: choice.label,
            current: ko.computed(() => {
                let data = self.data();
                if (data) {
                    return Formatters.percent(data[choice.value] || 0);
                }
            }),
            input: self.new_instance(PercentInput, {
                placeholder: '%',
                css: {
                    'input-xs': true,
                },
            }),
        };
    };

    for (let i = 0, l = self.choices.length; i < l; i++) {
        self.rows.push(self.gen_row(self.choices[i]));
    }

    self.columns = self.rows.inGroups(2);

    self.data.subscribe(data => {
        if (data) {
            for (let i = 0, l = self.rows.length; i < l; i++) {
                self.rows[i].input.value(data[self.rows[i].value] || 0);
            }
        }
    });

    self.total = ko.pureComputed(() => {
        let total = 0;

        for (let i = 0, l = self.rows.length; i < l; i++) {
            total += self.rows[i].input.value() || 0;
        }

        return total;
    });

    self.total_pct = ko.pureComputed(() => {
        return Formatters.percent(self.total());
    });

    self.valid = ko.pureComputed(() => {
        let total = self.total();

        return Math.round(total * 100) == 100;
    });

    self.get_values = function() {
        let values = {};

        for (let i = 0, l = self.rows.length; i < l; i++) {
            values[self.rows[i].value] = self.rows[i].input.value() || 0;
        }

        return values;
    };

    self.set_zeroes = function() {
        for (let i = 0, l = self.rows.length; i < l; i++) {
            self.rows[i].input.value(0);
        }
    };

    self.set_even_exposure = function() {
        let exposure = 1.0 / self.choices.length;

        for (let i = 0, l = self.rows.length; i < l; i++) {
            self.rows[i].input.value(exposure);
        }
    };

    self.reset = function() {
        let data = self.data();

        if (data) {
            for (let i = 0, l = self.rows.length; i < l; i++) {
                self.rows[i].input.value(data[self.rows[i].value] || 0);
            }
        }
    };

    return self;
}
