/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import LocalStorage from 'src/libs/localstorage';
import * as Mapping from 'src/libs/Mapping';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default class BooleanButton extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.__class__ = 'BooleanButton';

        this.template = opts.template || 'tpl_cpanel_boolean_button';

        this.label = opts.label;
        this.default_state = opts.default_state;
        this.reset_event = opts.reset_event;
        this.set_state_event_type = opts.set_state_event_type;

        this.enable_localstorage = opts.enable_localstorage || false;

        this._initial_value_property = opts.initial_value_property;

        this._initial_default_value_property = opts.initial_default_value_property;

        this._initial_value_mapping = Mapping.gen_mapping({
            mapping: opts.initial_value_mapping,
            mapping_args: opts.initial_value_mapping_args,
        });

        this.external_state_change = opts.external_state_change;

        this.define = opts.define;

        this.enabled_text_class = opts.enabled_text_class || 'text-success';

        this.state = ko.observable(this.default_state);

        this.disabled = ko.observable(false);
        this.disable_event = opts.disable_event;

        if (this.disable_event) {
            Observer.register(this.disable_event, evt => {
                this.disabled(evt);
            });
        }

        this.btn_css = opts.btn_css || {
            'btn-block': true,
            'btn-sm': true,
            'btn-cpanel-primary': true,
        };

        this.css_mode = ko.pureComputed(() => {
            if (this.state() == this.default_state) {
                return opts.btn_css;
            }
            return opts.btn_true_css;
        });

        // Used when the boolean button is used inside a popover
        this.modified = ko.pureComputed(() => {
            return this.state();
        });

        this.label_css = ko.pureComputed(() => {
            let css = {};

            css[this.enabled_text_class] = this.modified();

            return css;
        });

        this.icon_css = ko.pureComputed(() => {
            let state = this.state();

            let css = {
                'glyphicon-check': state,
                'glyphicon-unchecked': !state,
            };

            css[this.enabled_text_class] = state;

            return css;
        });

        this.init();

        this.state.subscribe(state => {
            Observer.broadcast_for_id(this.get_id(), 'BooleanButton.state', state, true);
            Observer.broadcast_for_id(
                this.get_id(),
                'BooleanButton.state_with_data',
                {
                    value: state,
                    data: this.data(),
                },
                true,
            );
        });

        Observer.broadcast_for_id(this.get_id(), 'BooleanButton.state', this.state(), true);

        this.read_only_state = ko.pureComputed(() => {
            return this.state();
        });

        if (this.reset_event) {
            Observer.register(this.reset_event, () => {
                this.state(this.default_state);
            });
        }

        if (this.set_state_event_type) {
            Observer.register(Utils.gen_event(this.set_state_event_type, this.get_id()), state => {
                this.state(state);
            });
        }

        if (this.external_state_change) {
            Observer.register_for_id(this.get_id(), this.external_state_change, payload => {
                if (payload.length > 0) {
                    this.state(true);
                } else {
                    this.state(this.default_state);
                }
            });
        }

        if (this.enable_localstorage) {
            let state_key = Utils.gen_id('BooleanButton.state', this.get_id());
            let state = LocalStorage.get(state_key);
            this.state(state);
            this.state.subscribe(() => {
                LocalStorage.set(state_key, this.state());
            });
        }
    }

    init() {
        let _init = this.data.subscribe(data => {
            if (data && Object.isBoolean(data[this._initial_value_property])) {
                this.state(this._initial_value_mapping(data[this._initial_value_property]));
                _init.dispose();
            }
        });
    }

    _broadcast_value(state) {
        Observer.broadcast_for_id(this.get_id(), 'BooleanButton.value_with_data', {
            value: state,
            data: this.data(),
        });

        Observer.broadcast_for_id(this.get_id(), 'BooleanButton.value', state);
    }

    broadcast() {
        if (this.state()) {
            this._broadcast_value(this.state());
        }
    }

    get_inner_state() {
        return this.state();
    }

    set_inner_state(state) {
        this.state(state);
    }

    clear() {
        this.state(this.default_state);

        this._broadcast_value(this.state());
    }

    toggle() {
        this.state(!this.state());

        this._broadcast_value(this.state());

        return true;
    }

    value_to_text() {
        return this.state() ? 'Yes' : 'No';
    }
}
