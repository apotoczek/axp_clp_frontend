/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.dfd = self.new_deferred();

    self.type = opts.type;

    self.save_state_event = opts.save_state_event;
    self.load_state_event = opts.load_state_event;
    self.delete_state_event = opts.delete_state_event;

    self.component_events = opts.component_events;
    self.load_events = opts.load_events;
    self.state = ko.observable({});

    self._save_state = DataThing.backends.useractionhandler({
        url: 'save_state',
    });
    self._delete_state = DataThing.backends.useractionhandler({
        url: 'delete_existing_state',
    });

    for (let i = 0, l = self.component_events.length; i < l; i++) {
        Observer.register(self.component_events[i], (data, triggered_event) => {
            let state = self.state();
            state[Utils.component_id_from_event(triggered_event)] = data;
            self.state(state);
        });
    }

    self.load_state = function(state) {
        if (state && state.data) {
            for (let i = 0, l = self.load_events.length; i < l; i++) {
                Observer.broadcast(
                    self.load_events[i],
                    state.data[Utils.component_id_from_event(self.load_events[i])],
                );
            }
        }
    };

    self.save_state = function(name) {
        self._save_state({
            data: {
                state: self.state(),
                name: name,
                state_type: self.type,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    self.delete_state = function(state_id) {
        self._delete_state({
            data: {
                state_id: state_id,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    if (self.save_state_event) {
        Observer.register(self.save_state_event, data => {
            if (data.name) {
                self.save_state(data.name);
            }
        });
    }

    if (self.load_state_event) {
        Observer.register(self.load_state_event, data => {
            if (data) {
                self.load_state(data);
            }
        });
    }

    if (self.delete_state_event) {
        Observer.register(self.delete_state_event, data => {
            if (data && data.state_id) {
                self.delete_state(data.state_id);
            }
        });
    }

    self.dfd.resolve();

    return self;
}
