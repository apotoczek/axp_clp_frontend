/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div class="btn-group btn-block" data-bind="foreach: menu, attr: {id: html_id()}">
            <!-- ko if: $data.template -->
                <!-- ko template: {
                    data: $data,
                    name: $data.template
                }--><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !$data.template -->
                <!-- ko if: !$parent.is_disabled($data) -->
                    <label
                        class="btn toggle-control"
                        data-bind="
                            css: $parent.css($data),
                            attr: {
                                'aria-controls': $data.state,
                                href:'#'+$data.state
                            },
                            click: $parent.on_item_click
                        "
                        style="float:none;"
                    >
                        <input type="radio" name="options" autocomplete="off" > <span data-bind="html: label"></span>
                        <!-- ko if: $parent.is_expandible($data) -->
                            <div class="pull-right">
                                <!-- ko if: $parent.is_active_parent($data) -->
                                    <i class="icon-up-dir"></i>
                                <!-- /ko -->
                                <!-- ko if: !$parent.is_active_parent($data) -->
                                    <i class="icon-down-dir"></i>
                                <!-- /ko -->
                            </div>
                        <!-- /ko -->
                    </label>
                    <div
                        class="collapse"
                        data-bind="
                            css: {in: $parent.is_active_parent($data)},
                            foreach: $data.menu
                        "
                    >
                        <label class="btn sub-menu" data-bind="css: $parents[1].css($data)">
                            <input
                                type="radio"
                                name="options"
                                autocomplete="off"
                                data-bind="
                                    attr: {value: state, id: state},
                                    checked: $parents[1].state
                                ">
                                <span data-bind="html: label"></span>
                        </label>
                    </div>
                <!-- /ko -->
            <!-- /ko -->
        </div>
    `);

    self.template = opts.template || 'tpl_nested_radio_buttons';

    self.menues = opts.menues || [];

    self.menu = ko.pureComputed(() => {
        let menues = [];

        for (const menu of self.menues) {
            if (menu.require_feature) {
                if (auth.user_has_feature(menu.require_feature)) {
                    menues.push(menu);
                }
            } else if (typeof menu.visible === 'function') {
                if (menu.visible()) {
                    menues.push(menu);
                }
            } else {
                menues.push(menu);
            }
        }

        return menues;
    });

    self.button_css = opts.button_css || {};

    self.reset_event = opts.reset_event;
    self.set_state_event = opts.set_state_event;

    self.default_state = opts.default_state;

    self.visible = opts.visible == undefined ? true : opts.visible;

    self.inital_value_property = opts.inital_value_property;

    self.css = function(button) {
        let css = Utils.ensure_css_object(self.button_css);

        css.active = self.is_active(button) || self.is_active_parent(button);

        return css;
    };

    self.is_expandible = button => {
        let root_item = self.find_active_root_menu_item(button);
        return root_item && Utils.is_set(root_item.menu, true);
    };

    self.find_active_root_menu_item = (button = {}) => {
        let button_state = button.state || self.state();
        let split_state = button_state && button_state.split(':');
        let root_menu_state = split_state.length > 0 && split_state[0];
        return root_menu_state && self.menu().find(item => item.state === root_menu_state);
    };

    self.expanded = ko.pureComputed(() => {
        let root_menu_item = self.find_active_root_menu_item();
        return root_menu_item && root_menu_item.menu && root_menu_item.menu.length > 0;
    });

    self.offset = ko.pureComputed(() => {
        if (!self.expanded()) {
            return `header-offset-${self.menu().length}`;
        }

        let menu_item = self.find_active_root_menu_item();
        return `header-offset-${self.menu().length + (menu_item.menu || []).length}`;
    });

    self.state = ko.observable(self.default_state);

    self.states = ko.computed(() => {
        let s = [];
        for (let i = 0, l = self.menues.lenth; i < l; i++) {
            s = s.concat(self.menues[i].menu);
        }
        return s;
    });

    self.is_active_parent = function(button) {
        return self.state() && self.state().split(':')[0] == button.state;
    };

    self.active_parent = ko.computed(() => {
        return self.state() && self.state().split(':')[0];
    });

    self.toggle = function(button) {
        self.state(button.state);
    };

    self.on_item_click = function(item) {
        // If this menu item has nested children, we go into the first one
        // by triggering a click on it.
        if ((item.menu || []).length > 0) {
            self.state(item.menu[0].state);
            return;
        }

        self.state(item.state);
    };

    self.is_disabled = function(button) {
        let data = self.data();
        if (data && typeof button.disabled_callback === 'function') {
            return button.disabled_callback(data);
        }

        return false;
    };

    self.is_active = function(button) {
        return button.state === self.state();
    };

    self.broadcast = ko.observable(true);

    self.state.subscribe(state => {
        if (self.broadcast()) {
            Observer.broadcast_for_id(self.get_id(), 'RadioButtons.state', state);
        }

        let state_data;

        if (self.broadcast()) {
            state_data = self.states().find(n => {
                return n.state == state;
            });
        }

        Observer.broadcast_for_id(self.get_id(), 'RadioButtons.state_data', state_data);

        self.broadcast(true);
    });

    self.go_to_root = function() {
        self.state.valueHasMutated();
        return true;
    };

    self.set_state = function(state) {
        self.state(state);
    };

    Observer.register_for_id(self.get_id(), 'RadioButtons.set_state', self.set_state);
    if (self.set_state_event) {
        Observer.register(self.set_state_event, state => {
            self.set_state(state);
        });
    }

    if (self.reset_event) {
        Observer.register_for_id(self.get_id(), self.reset_event, () => {
            self.state(self.default_state);
        });
    }

    _dfd.resolve();

    return self;
}
