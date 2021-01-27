/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import LocalStorage from 'src/libs/localstorage';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.visible = ko.observable(true);
    self.visible_event = opts.visible_event;
    self.enable_localstorage = opts.enable_localstorage || false;

    self.broadcast = function() {
        Observer.broadcast(self.visible_event, self.visible(), true);
    };

    self.toggle_visible = function() {
        self.visible(!self.visible());
        self.broadcast();
    };

    if (self.enable_localstorage) {
        self.key = Utils.gen_id('ExpandableVisualizations.visible', self.get_id());

        let visible = LocalStorage.get(self.key);

        if (Utils.is_set(visible)) {
            self.visible(visible);
        }

        self.visible.subscribe(visible => {
            LocalStorage.set(self.key, visible);
        });
    }

    self.broadcast();

    self.label = ko.computed(() => {
        return self.visible() ? 'Hide charts' : 'Show charts';
    });

    return self;
}
