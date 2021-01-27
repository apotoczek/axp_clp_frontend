/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Description:
 *   Button that spawns a popover
 * Keys:
 *   - broadcast_data
 *       Enables broadcasting of self.data in addition to state/value (PopoverButton.state_with_data/value_with_data)
 *   - popover_config
 *       A component config that specifies the popover that the popoverbutton spawns when clicked
 *
 *
 */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import LocalStorage from 'src/libs/localstorage';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';

export default class NewPopoverButton extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.__class__ = 'NewPopoverButton';

        this.template = opts.template || 'tpl_new_popover_button';

        let _dfd = this.new_deferred();

        opts.popover_options = opts.popover_options || {};

        this.enable_localstorage = opts.enable_localstorage;

        this.popover_options = {
            placement: opts.popover_options.placement || 'left',
            css_class: opts.popover_options.css_class,
            title: opts.popover_options.title,
            listen_to: opts.popover_options.listen_to || [],
        };

        this.icon_css = opts.icon_css || false;
        this.hide_icon = opts.hide_icon || false;
        this._disabled = opts.disabled || false;

        this.broadcast_data = opts.broadcast_data || false;

        this.close_event = Utils.gen_event('PopoverButton.close_popover', this.get_id());
        this.opened_event = Utils.gen_event('PopoverButton.opened', this.get_id());
        this.closed_event = Utils.gen_event('PopoverButton.closed', this.get_id());

        this.hide_on_events = opts.hide_on_events || [];
        this.hide_on_events.push(this.close_event);
        this.ellipsis = Utils.default_value(opts.ellipsis, true);

        this.visible_event = opts.visible_event;
        if (this.visible_event) {
            this.visible_event_value = Observer.observable(opts.visible_event);
        }
        this.visible_callback = opts.visible_callback;
        this.disabled_callback = opts.disabled_callback;

        this._css = opts.css || {'btn-default': true};

        if (opts.track_selection_property) {
            this.track_selection_property = opts.track_selection_property;
            this.label_track_selection = true;
        } else {
            this.track_selection_property = 'selected_string';
            this.label_track_selection = opts.label_track_selection;
        }

        this.clear_event = opts.clear_event;

        if (this.clear_event) {
            Observer.register(this.clear_event, () => {
                this.clear();
            });
        }

        this.init_popover(opts).done(() => {
            this.add_dependency(this.popover);

            if (this.label_track_selection) {
                this.label = ko.pureComputed(() => {
                    if (this.popover && this.popover[this.track_selection_property]) {
                        let selected_str = this.popover[this.track_selection_property]();
                        if (opts.label) {
                            return `<strong>${opts.label}: </strong> ${selected_str}`;
                        }
                        return selected_str;
                    }
                    return opts.label || '';
                });
            } else {
                this.label = opts.label || '';
            }

            if (this.enable_localstorage) {
                let state_key = Utils.gen_id('NewPopoverButton.state', this.get_id());
                let state = LocalStorage.get(state_key);
                if (state) {
                    this.set_inner_state(state);
                }
                this.popover.state.subscribe(() => {
                    LocalStorage.set(state_key, this.get_value());
                });
            }

            this.modified = ko.pureComputed(() => {
                if (typeof this.popover.modified === 'function') {
                    return !this.disabled() && this.popover.modified();
                }
                return false;
            });

            this.visible = ko.pureComputed(() => {
                if (typeof this.visible_callback === 'function') {
                    let visible = this.visible_callback(this.popover);
                    if (!visible) {
                        Observer.broadcast(this.close_event);
                    }
                    return visible;
                }

                if (this.visible_event) {
                    return this.visible_event_value();
                }

                return opts.visible === undefined ? true : ko.unwrap(opts.visible);
            });

            this.disabled = ko.pureComputed(() => {
                let _disabled = ko.unwrap(this._disabled);

                if (_disabled) {
                    return true;
                }

                if (typeof this.disabled_callback === 'function') {
                    let disabled = this.disabled_callback(this.popover);
                    if (disabled) {
                        Observer.broadcast(this.close_event);
                    }
                    return disabled;
                }
                return false;
            });

            this.css = ko.pureComputed(() => {
                let css = Utils.ensure_css_object(this._css);

                css.disabled = this.loading() || this.disabled();
                css.modified = this.modified();

                return css;
            });

            if (ko.isObservable(this.popover.state)) {
                this.popover.state.subscribe(state => this.broadcast('state', state));

                this.broadcast('state', this.popover.state());
            }

            if (ko.isObservable(this.popover.get_value)) {
                this.popover.get_value.subscribe(value => this.broadcast('value', value));

                this.broadcast('value', this.popover.get_value());
            }

            if (this.popover.get_keyed_value && ko.isObservable(this.popover.get_keyed_value)) {
                this.popover.get_keyed_value.subscribe(value => this.broadcast('raw_value', value));

                this.broadcast('raw_value', this.popover.get_keyed_value());
            }

            _dfd.resolve();
        });
    }

    init_popover(opts) {
        let init = this.new_deferred();

        if (opts.popover) {
            this.popover = opts.popover;
            this.when(this.popover).done(() => {
                init.resolve();
            });
        } else if (opts.popover_config) {
            this.init_component(opts.popover_config, popover => {
                this.popover = popover;
                this.when(this.popover).done(() => {
                    init.resolve();
                });
            });
        } else {
            throw 'Initializing NewPopoverButton without popover or popover config...';
        }

        return init;
    }

    close_popover() {
        Observer.broadcast(this.close_event);
    }

    clear() {
        if (this.popover && typeof this.popover.clear === 'function') {
            this.popover.clear();
        }
    }

    get_value() {
        if (this.popover && typeof this.popover.get_value === 'function') {
            return this.popover.get_value();
        }
    }

    get_inner_state() {
        if (this.popover && typeof this.popover.get_state === 'function') {
            return this.popover.get_state();
        }
    }

    set_inner_state(state) {
        if (this.popover && typeof this.popover.set_state === 'function') {
            this.popover.set_state(state);
        }
    }

    set_data_and_inner_state(payload) {
        this.data(payload.data);
        this.set_inner_state(payload.state);
    }

    broadcast(key, payload) {
        Observer.broadcast_for_id(this.get_id(), `PopoverButton.${key}`, payload, true);

        if (this.broadcast_data) {
            let with_data = {
                [key]: payload,
                data: this.data(),
            };

            Observer.broadcast_for_id(
                this.get_id(),
                `PopoverButton.${key}_with_data`,
                with_data,
                true,
            );
        }
    }

    restore_defaults() {
        if (this.popover && typeof this.popover.restore_defaults === 'function') {
            this.popover.restore_defaults();
        }
    }
}
