/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import LocalStorage from 'src/libs/localstorage';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    opts = opts || {};

    let _dfd = $.Deferred();
    self.dfds.push(_dfd);

    let init = $.Deferred();

    self.clear_event = opts.clear_event;
    self.hide_icon = opts.hide_icon || false;
    self.ellipsis = opts.ellipsis || false;

    self.enable_localstorage = opts.enable_localstorage || false;

    self.icon_css = opts.icon_css || 'glyphicon glyphicon-plus';

    if (opts.popover_config) {
        self.init_component(opts.popover_config, popover => {
            self.popover = popover;
            init.resolve();
        });
    } else {
        self.popover = opts.popover;
        init.resolve();
    }

    init.done(() => {
        self.add_dependency(self.popover);

        self.default_state = ko.observable(true);
        self.enabled = ko.observable(true);
        self.opened = ko.observable(false);
        self.visible = ko.observable(true);

        if (opts.track_selection) {
            self.label = ko.computed(() => {
                let string = opts.label ? `<strong>${opts.label}: </strong> ` : '';
                if (self.popover && self.popover.selected_string) {
                    return string + self.popover.selected_string();
                }
            });
        } else {
            self.label = opts.label || '';
        }

        self.display_values = ko.computed(() => {
            if (self.popover && self.popover.selected_string) {
                return self.popover.selected_string();
            }
        });

        self.inner_value = self.popover.get_value;
        self.get_inner_state = self.popover.get_state;
        self.set_inner_state = self.popover.set_state;
        self.get_metrics = self.popover.get_metrics;

        if (self.enable_localstorage) {
            let state_key = Utils.gen_id('PopoverButton.state', self.get_id());
            let state = LocalStorage.get(state_key);
            self.set_inner_state(state);
            self.inner_value.subscribe(() => {
                LocalStorage.set(state_key, self.get_inner_state());
            });
        }

        self.set_data_and_inner_state = function(data) {
            self.data(data.data);
            self.set_inner_state(data.state);
        };

        self.initial_event = true;

        self.broadcast_value = function(value) {
            if (!self.initial_event || !opts.disable_initial_event) {
                let data = self.data();
                let val;

                if (opts.broadcast_data && data) {
                    val = {
                        data: data,
                        value: value,
                    };
                } else {
                    val = value;
                }

                Observer.broadcast_for_id(self.get_id(), 'PopoverButton.value', val);
            } else {
                self.initial_event = false;
            }
        };

        Observer.register_for_id(self.get_id(), 'new_listener.PopoverButton.value', () => {
            self.broadcast_value(self.inner_value());
        });

        self.inner_value.subscribe(self.broadcast_value);

        if (!opts.disable_initial_event) {
            self.broadcast_value(self.inner_value());
        }

        self.enable = function() {
            self.enabled(true);
        };

        self.disable = function() {
            self.enabled(false);
        };

        self.clear = function() {
            self.popover.clear();
        };

        self.modified = self.popover.modified;

        self.css = ko.computed(() => {
            let css = opts.css || {};

            if (self.popover.modified()) {
                css['modified'] = true;
                css['default'] = false;
            } else {
                css['modified'] = false;
                css['default'] = true;
            }

            if (self.opened()) {
                css['opened'] = true;
            } else {
                css['opened'] = false;
            }

            return css;
        });

        /*******************************************************************
         * Event listeners
         *******************************************************************/

        if (self.clear_event) {
            Observer.register_for_id(self.get_id(), self.clear_event, self.clear);
        }

        $.when(...self.popover.dfds).done(() => {
            _dfd.resolve();
        });
    });

    return self;
}
