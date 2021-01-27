/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_dynamic_actions_dropdown';

    self.actions = ko.observableArray(opts.actions || []);

    self.css = opts.css || {'btn-transparent': true};
    self.icon_css = opts.icon_css;

    self.label = opts.label || 'Actions';

    self.register_action = function(action) {
        action.css = ko.observable({
            disabled: action.enabled === undefined ? false : !action.enabled,
        });
        self.actions.push(action);
    };

    self.enabled_action = function(action) {
        let actions = self.actions();
        if (actions && actions.length) {
            for (let i = 0, l = actions.length; i < l; i++) {
                if (actions[i].title === action.title && actions[i].type === action.type) {
                    actions[i].css({disabled: !action.enabled});
                }
            }
        }
    };

    Observer.register_for_id(self.get_id(), 'DynamicActions.register_action', self.register_action);
    Observer.register_for_id(self.get_id(), 'DynamicActions.enabled', self.enabled_action);

    self.top_level_actions = ko.pureComputed(() => {
        return self.actions().filter(action => {
            return action.type === undefined;
        });
    });

    self.type_actions = ko.pureComputed(() => {
        return self.actions().filter(action => {
            return action.type !== undefined;
        });
    });

    self.types = ko.pureComputed(() => {
        let types = [];
        let type_actions = self.type_actions();
        if (type_actions) {
            let grouped = type_actions.groupBy('type');

            for (let [key, actions] of Object.entries(grouped)) {
                if (key) {
                    types.push({
                        title: key,
                        actions: actions,
                    });
                }
            }
        }
        return types.sortBy('type');
    });

    self.disabled = ko.pureComputed(() => {
        return self.actions().length == 0;
    });

    self.event = function(action) {
        Observer.broadcast(action.event_type, action.data);
    };

    return self;
}
