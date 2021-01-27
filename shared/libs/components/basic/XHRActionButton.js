/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_xhr_action_button';

    self.waiting = ko.observable(false);

    self.last_time = undefined;

    self.data.subscribe(data => {
        if (data) {
            if (data.end_time > self.last_time || self.last_time == undefined) {
                self.waiting(false);
            }
            // Store last end_time to compare with in the future
            if (data.end_time) {
                self.last_time = data.end_time;
            }
        }
    });

    self.endpoint = opts.endpoint;

    self.label = ko.observable(opts.label);

    self.data_key = opts.data_key || {};

    self.running_event = opts.running_event;

    self.cancel_event = opts.cancel_event;

    self.finish_event = opts.finish_event;

    self.sendRequest = function() {
        let data = self.data();
        self.last_time = data['end_time'];
        self.waiting(true);

        self.endpoint({
            data: {
                identifier: data[self.data_key],
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {
                self.waiting(false);
                alert('Could not run test.');
            }),
        });
    };

    if (self.running_event) {
        Observer.register(self.running_event, () => {
            self.waiting(true);
        });
    }

    return self;
}
