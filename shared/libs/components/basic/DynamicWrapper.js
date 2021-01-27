/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default class DynamicWrapper extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let dfd = this.new_deferred();

        this.default_component = opts.active_component;

        this.template = opts.template || 'tpl_dynamic_wrapper';

        this._active_component = this.data;

        this.toggle_auto_get_data = opts.toggle_auto_get_data || false;

        this.set_active_event = opts.set_active_event;

        if (this.toggle_auto_get_data) {
            this.toggle_auto_get_data_ids =
                opts.toggle_auto_get_data_ids || opts.components.map(c => c.id);
        }

        if (this.set_active_event) {
            Observer.register(this.set_active_event, active_id => {
                if (active_id) {
                    this.set_active_component(active_id);
                } else {
                    this.set_active_component(this.default_component);
                }
            });
        }

        $.when(...this.dfds).done(() => {
            this.set_active_component(this.default_component);

            this.active_component = ko.pureComputed(() => {
                let _active_component = this._active_component();
                if (_active_component && this.components[_active_component]) {
                    return this.components[_active_component];
                }
            });
        });

        dfd.resolve();
    }

    set_active_component(active_id) {
        if (this.toggle_auto_get_data) {
            for (let [id, component] of Object.entries(this.components)) {
                if (this.toggle_auto_get_data_ids.indexOf(id) > -1) {
                    if (id !== active_id) {
                        component.set_auto_get_data(false);
                    } else {
                        Observer.broadcast_for_id(
                            this.get_id(),
                            'DynamicWrapper.active_component',
                            {
                                active: component,
                                body_components: this.layout.body,
                            },
                        );
                        component.set_auto_get_data(true);
                    }
                }
            }
        }

        this._active_component(active_id);
    }
}
