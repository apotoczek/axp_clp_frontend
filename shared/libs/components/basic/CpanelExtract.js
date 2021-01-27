/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Observer from 'src/libs/Observer';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    /*
        Component for storing and setting state of entire cpanel.
        Cpanel should be defined with key extract_keys which is a list of
        objects specifying the id and the type of the components that should
        be extractable. Can also handle nested components.
        E.g {id: 'as_of_date', type: 'popover_button'}
        */
    let self = new Aside(opts, components);

    self.extract_keys = opts.extract_keys || [];
    // Specify load_event if wanting to update data through event
    self.load_event = opts.load_event;

    self._extract_component_data = function(component, component_type) {
        // Add case if used components does not exist yet
        switch (component_type) {
            case 'popover_button':
            case 'boolean_button':
                return component.get_inner_state();
            case 'enum_attributes':
                return component.get_state();
            default:
                return undefined;
        }
    };

    self._update_component_data = function(component, value, component_type) {
        // Add case if used components does not exist yet
        switch (component_type) {
            case 'popover_button':
            case 'boolean_button':
                component.set_inner_state(value);
                return;
            case 'enum_attributes':
                component.set_state(value);
                return;
            default:
                return;
        }
    };

    self.extract_data = function() {
        // Initialize the extraction of data
        let data = {};

        for (let key of self.extract_keys) {
            data[key.id] = self._extract_recursive(key, self.components[key.id]);
        }

        return data;
    };

    self._extract_recursive = function(config, component) {
        if (config.component) {
            let data = {};

            data[config.component.id] = self._extract_recursive(
                config.component,
                component[config.component_key],
            );

            return data;
        } else if (config.components) {
            let data = {};

            for (let sub_config of config.components) {
                data[sub_config.id] = self._extract_recursive(
                    sub_config,
                    component.components[sub_config.id],
                );
            }

            return data;
        }
        return self._extract_component_data(component, config.type);
    };

    self.update_data = function(updates) {
        // Initialize the update
        for (let key of self.extract_keys) {
            if (key.id in updates) {
                self._update_recursive(key, updates[key.id], self.components[key.id]);
            }
        }
    };

    self._update_recursive = function(config, update, component) {
        if (config.component) {
            self._update_recursive(
                config.component,
                update ? update[config.component.id] : undefined,
                component[config.component_key],
            );
        } else if (config.components) {
            for (let sub_config of config.components) {
                self._update_recursive(
                    sub_config,
                    update ? update[sub_config.id] : undefined,
                    component.components[sub_config.id],
                );
            }
        } else {
            self._update_component_data(component, update, config.type);
        }
    };

    self.restore_defaults = function() {
        for (let key of self.extract_keys) {
            self._restore_defaults_recursive(key, self.components[key.id]);
        }
    };

    self._restore_defaults_recursive = function(config, component) {
        if (config.component) {
            self._restore_defaults_recursive(config.component, component[config.component_key]);
        } else if (config.components) {
            for (let sub_config of config.components) {
                self._restore_defaults_recursive(sub_config, component.components[sub_config.id]);
            }
        } else {
            switch (config.type) {
                case 'popover_button':
                    // We want to clear as backup if restore_defaults
                    // does not set a value
                    component.clear();
                    if (typeof component.restore_defaults === 'function') {
                        component.restore_defaults();
                    }
                    return;
                case 'boolean_button':
                    component.state(component.default_state || true);
                    return;
                case 'enum_attributes':
                    component.clear();
                    return;
                default:
                    return;
            }
        }
    };

    if (self.load_event) {
        Observer.register(self.load_event, data => {
            self.update_data(data);
        });
    }

    return self;
}
