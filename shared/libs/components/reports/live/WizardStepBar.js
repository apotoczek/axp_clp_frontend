/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_wizard_step_bar';
    self.step_event = opts.step_event;
    self.active_step = ko.observable(opts.starting_step);

    self.active_step_number = ko.pureComputed(() => {
        let active_step_name = self.active_step();
        let steps = opts.steps;
        for (let i in steps) {
            if (active_step_name == steps[i].step) {
                return steps[i].number;
            }
        }
    });

    self.active_check = function(step) {
        return ko.computed(() => {
            return self.active_step() == step;
        });
    };

    self.steps = opts.steps.map(step => {
        step.active = self.active_check(step.step);
        return step;
    });

    Observer.register(opts.step_event, step => {
        self.active_step(step);
    });

    self.visible = ko.computed(() => {
        return self.active_step() !== 'select_fund';
    });

    self.activate = function(step) {
        if (step.number < self.active_step_number()) {
            Observer.broadcast(self.step_event, step.step);
        }
    };

    self.dfd.resolve();
    return self;
}
