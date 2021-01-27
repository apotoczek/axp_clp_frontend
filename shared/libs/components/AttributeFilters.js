/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TieredChecklist from 'src/libs/components/basic/TieredChecklist';
import $ from 'jquery';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default class AttributeFilters extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.__class__ = 'AttributeFilters';

        let _dfd = this.new_deferred();

        this.define_template(`
            <div data-bind="visible: visible">
                <ul class="list-unstyled" data-bind="foreach: filters">
                    <li style="margin-bottom: 5px;" data-bind="renderComponent: instance">
                    </li>
                </ul>
            </div>
        `);

        this.define_template(
            'in_popover',
            `
            <div class="scrollable-attribute-filters">
                <ul class="list-unstyled" data-bind="foreach: filters">
                    <li style="margin-bottom: 5px;" data-bind="renderComponent: instance">
                    </li>
                </ul>
            </div>
            <button class="btn" data-bind="css: close_btn_css" data-dismiss="popover">Done</button>
            <button class="btn" data-bind="css: clear_btn_css, click: clear, enable: modified">Clear All</button>
        `,
        );

        this.define_template(
            'horizontal',
            `
            <div data-bind="visible: visible">
                <div data-bind="foreach: filters">
                    <div style="display:inline-block; vertical-align: super;" data-bind="renderComponent: instance,
                    style: { width: $parent.width }">
                    </div>
                </div>
            </div>
        `,
        );

        this.define_template(
            'row',
            `
            <div data-bind="visible: visible">
                <div class="row row-margins" data-bind="foreach: filters">
                    <div class="col-xs-12 col-md-4" data-bind="renderComponent: instance">
                    </div>
                </div>
            </div>
        `,
        );

        this.set_state_event_type = opts.set_state_event_type;
        this.placement = opts.placement || 'right';
        this.title = opts.title;
        this.popover_css_class = opts.popover_css_class || 'popover-cpanel';

        this.wait_for_filters = Utils.default_value(opts.wait_for_filters, false);

        this.set_state_on_identifier_event = opts.set_state_on_identifier_event;

        this.enable_localstorage = opts.enable_localstorage;
        this.option_disabled_key = opts.option_disabled_key || false;
        this.clear_event = opts.clear_event;
        this.clear_events = opts.clear_events;
        this.last_activated = ko.observable(undefined);

        this.entity_type = opts.entity_type || 'user_fund';
        this.entity_uid_event = opts.entity_uid_event;

        this.clear_btn_css = opts.clear_btn_css || {
            'btn-block': true,
            'btn-cpanel': true,
            'btn-sm': true,
        };

        this.close_btn_css = opts.close_btn_css || {
            'btn-block': true,
            'btn-default': true,
            'btn-sm': true,
        };

        this.css = opts.css || {
            'btn-sm': true,
            'btn-block': true,
            'btn-cpanel-primary': true,
        };

        this._filters_initialized = this.new_deferred();

        if (!this.wait_for_filters) {
            this._filters_initialized.resolve();
        }

        this.filters = ko.observableArray([]);

        this.data.subscribe(data => {
            this.init_filters(data);
        });

        this.init_filters(this.data());

        this.width = ko.pureComputed(() => {
            let filters = this.filters();

            return `${100 / filters.length}%`;
        });

        this.last_state = undefined;

        this.state = ko.pureComputed(() => {
            let filters = this.filters();
            let state = [];

            for (let i = filters.length - 1; i >= 0; i--) {
                let value = filters[i].instance.get_value();

                if (Utils.is_set(value, true)) {
                    state.push({
                        uid: filters[i].uid,
                        value: value,
                    });
                }
            }

            return state;
        });

        this.state.subscribe(state => {
            if (Object.size(state) === 0 || state.length === 0) {
                state = undefined;
            }

            Observer.broadcast_for_id(this.get_id(), 'AttributeFilters.state', state, true);
        });

        this.get_value = this.state;

        this.modified = ko.pureComputed(() => {
            let filters = this.filters();

            for (let i = filters.length - 1; i >= 0; i--) {
                if (filters[i].instance.popover.modified()) {
                    return true;
                }
            }

            return false;
        });

        if (opts.selected_datasource) {
            this.selected_datasource = this.new_instance(DataSource, {
                datasource: opts.selected_datasource,
            });

            this.selected_datasource.data.subscribe(data => {
                this.set_state(data);
            });
        }

        // Saved State Stuff
        if (this.set_state_event_type) {
            Observer.register(Utils.gen_event(this.set_state_event_type, this.get_id()), data => {
                this.set_state(data);
            });
        }

        if (this.set_state_on_identifier_event) {
            Observer.register(
                Utils.gen_event(this.set_state_on_identifier_event, this.get_id()),
                states => {
                    let data = this.data();
                    let tmp = [];

                    if (data && data.length) {
                        let keys = Object.keys(states);

                        for (let d of data) {
                            for (let key of keys) {
                                if (key === d.identifier) {
                                    tmp.push({
                                        uid: d.uid,
                                        value: {
                                            children: {},
                                            leaves: [states[key]],
                                            root: [states[key]],
                                        },
                                    });
                                }
                            }
                        }
                    }

                    this.set_state(tmp);
                },
            );
        }

        if (this.clear_event) {
            Observer.register(this.clear_event, () => this.clear());
        }

        if (this.clear_events) {
            for (let event of this.clear_events) {
                Observer.register(event, () => this.clear());
            }
        }

        _dfd.resolve();
    }

    close_others(id) {
        let filters = this.filters();

        for (let i = filters.length - 1; i >= 0; i--) {
            if (filters[i].instance.get_id() !== id) {
                filters[i].instance.close_popover();
            }
        }
    }

    build_option_tree(members) {
        let option_tree = {
            root: [],
            parent_map: {},
            names: {},
        };

        if (members) {
            for (let i = 0, l = members.length; i < l; i++) {
                let option = {
                    name: members[i].name,
                    uid: members[i].uid,
                    parent_uid: members[i].parent_uid,
                    disabled: members[i].disabled,
                };

                if (self.option_disabled_key) {
                    option[self.option_disabled_key] = members[i][self.option_disabled_key];
                }

                option_tree.names[members[i].uid] = members[i].name;

                if (option.parent_uid) {
                    option_tree[option.parent_uid] = option_tree[option.parent_uid] || [];
                    option_tree[option.parent_uid].push(option);
                    option_tree.parent_map[option.uid] = option.parent_uid;
                } else {
                    option_tree.root.push(option);
                }
            }
        }

        return option_tree;
    }

    configure_filter(config) {
        let filter = {
            uid: config.uid,
            instance: this.new_instance(NewPopoverButton, {
                id: config.uid,
                css: this.css,
                icon_css: 'glyphicon glyphicon-plus',
                enable_localstorage: false,
                popover_options: {
                    title: config.name,
                    placement: this.placement,
                    css_class: this.popover_css_class,
                    listen_to: ['checklists'],
                },
                label: config.name,
                popover_config: {
                    component: TieredChecklist,
                    enable_exclude: true,
                    data: this.build_option_tree(config.members),
                    label_key: 'name',
                    value_key: 'uid',
                    option_disabled_key: 'disabled',
                },
            }),
        };

        Observer.register_for_id(filter.instance.get_id(), 'PopoverButton.opened', () => {
            Observer.broadcast_for_id(this.get_id(), 'PopoverButton.opened');

            this.close_others(filter.instance.get_id());
        });

        this.when(filter.instance).done(() => {
            this.filters.push(filter);
        });

        return this.when(filter.instance);
    }

    clear() {
        let filters = this.filters();

        for (let i = filters.length - 1; i >= 0; i--) {
            filters[i].instance.clear();
        }
    }

    set_state(states) {
        let filters = this.filters();

        if (Array.isArray(filters) && Array.isArray(states)) {
            this.clear();

            for (let state of states) {
                for (let filter of filters) {
                    if (filter.uid === state.uid) {
                        filter.instance.set_inner_state(state);
                    }
                }
            }
        }
    }

    get_state() {
        return ko.unwrap(this.state);
    }

    get_metrics() {
        // TODO
    }

    init_filters(configs) {
        if (configs) {
            this.filters([]);

            let dfds = [];

            for (let config of configs) {
                dfds.push(this.configure_filter(config));
            }

            $.when(...dfds).done(() => {
                this._filters_initialized.resolve();
            });
        }
    }
}
