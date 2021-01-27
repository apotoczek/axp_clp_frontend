/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import Checklist from 'src/libs/components/basic/Checklist';
import StringFilter from 'src/libs/components/basic/StringFilter';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import TieredChecklist from 'src/libs/components/basic/TieredChecklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ko from 'knockout';
import bison from 'bison';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Aside from 'src/libs/components/basic/Aside';
import SelectedCount from 'src/libs/components/basic/SelectedCount';
import DataSource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_supporting_vehicles_modal';

    self.clear_event = Utils.gen_event('EventButton', self.get_id(), 'filters', 'clear');
    self.enums_event = Utils.gen_event('Attributes.value', self.get_id());

    self.vehicle_uid_event = opts.vehicle_uid_event;
    self.vehicle_uid = ko.observable();

    self.cashflow_type = opts.cashflow_type || 'net';

    let show_bison_funds =
        auth.user_has_feature('bison_funds_in_portfolios') ||
        auth.user_has_feature('bison_internal');

    if (self.cashflow_type === 'net') {
        self.entity_types = ['user_fund'];

        if (show_bison_funds) {
            self.entity_types.push('bison_fund');
        }
    } else {
        self.entity_types = ['user_fund'];
    }

    self.portfolio_uid = opts.portfolio_uid;

    self.get_enum_popover_config = function(identifier, label) {
        return {
            id: identifier,
            component: NewPopoverButton,
            label: label,
            clear_event: self.clear_event,
            css: {
                'btn-ghost-info': true,
                'btn-sm': true,
                'btn-block': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                title: label,
                placement: 'bottom',
                css_class: 'popover-ghost-info',
                listen_to: ['checklists'],
            },
            popover_config: {
                component: TieredChecklist,
                enable_exclude: true,
                datasource: {
                    type: 'dynamic',
                    key: 'members',
                    mapping: 'build_tiered_checklist_tree',
                    query: {
                        target: 'attribute:data',
                        attribute_identifier: identifier,
                        include_members: true,
                        tree_mode: false,
                    },
                },
                label_key: 'name',
                value_key: 'uid',
            },
        };
    };

    self.filters = self.new_instance(Aside, {
        id: 'filters',
        template: 'tpl_horizontal_cpanel',
        layout: {
            body: ['name', 'geography', 'style', 'sector', 'meta_info', 'vintage_year', 'clear'],
        },
        components: [
            {
                id: 'clear',
                component: EventButton,
                template: 'tpl_button',
                css: {'btn-sm': true, 'btn-info': true, 'btn-block': true},
                label: 'Clear All',
            },
            {
                id: 'meta_info',
                css: {'meta-ghost-info': true, 'match-btn-sm': true},
                component: MetaInfo,
                label: 'Vehicles',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event('DataTable.count', self.get_id(), 'vehicles_table'),
                },
            },
            {
                id: 'name',
                component: StringFilter,
                clear_event: self.clear_event,
                placeholder: 'Name...',
            },
            self.get_enum_popover_config('geography', 'Geography'),
            self.get_enum_popover_config('style', 'Style / Focus'),
            self.get_enum_popover_config('sector', 'Sector'),
            {
                id: 'vintage_year',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label: 'Vintage Year',
                css: {
                    'btn-ghost-info': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Filter by Vintage Year',
                    placement: 'bottom',
                    css_class: 'popover-ghost-info',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        mapping_default: [],
                        query: {
                            target: 'user:vintage_years',
                        },
                    },
                },
            },
        ],
    });

    self.in_portfolio = function(data) {
        let uid = Utils.get_vehicle_uid(data);
        return self._included_vehicles()[uid] || self.uids_in_portfolio.data()[uid];
    };

    self.vehicles_table = self.new_instance(DataTable, {
        id: 'vehicles_table',
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 10,
        clear_order_event: self.clear_event,
        enable_clear_order: true,
        enable_selection: opts.enable_selection === undefined ? true : opts.enable_selection,
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'Cashflow Type',
                key: 'cashflow_type',
                format: 'titleize',
            },
            {
                label: 'Shared By',
                key: 'shared_by',
                format: 'strings',
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
                type: 'numeric',
                first_sort: 'desc',
            },
            {
                label: 'As of Date',
                key: 'last_date',
                first_sort: 'desc',
                format: 'backend_date',
            },
            {
                label: '',
                width: '1%',
                type: 'component',
                component_callback: 'data',
                component: {
                    id: 'actions',
                    component: ActionButtons,
                    template: 'tpl_action_buttons',
                    buttons: [
                        {
                            label: '<span class="glyphicon glyphicon-plus"></span>',
                            disabled_label: '<span class="glyphicon glyphicon-ok"></span>',
                            disabled_callback: self.in_portfolio,
                            action: 'add',
                            css: {'btn-cpanel-success': true, 'btn-xs': true},
                        },
                    ],
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicles',
                results_per_page: 10,
                filters: {
                    type: 'dynamic',
                    query: {
                        name: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.get_id(),
                                'filters',
                                'name',
                            ),
                            default: '',
                        },
                        enums: {
                            type: 'observer',
                            event_type: self.enums_event,
                        },
                        entity_type: self.entity_types,
                        cashflow_type: self.cashflow_type,
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'filters',
                                'vintage_year',
                            ),
                            default: [],
                        },
                        permissions: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'filters',
                                'permissions',
                            ),
                            default: [],
                        },
                        as_of_date: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'filters',
                                'as_of_date',
                            ),
                            default: [],
                        },
                        shared_by: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'filters',
                                'shared_by',
                            ),
                            default: [],
                        },
                        exclude_portfolio_only: true,
                        exclude_package_content: true,
                    },
                },
            },
        },
    });

    self.enums_state = ko.observable({});

    self.enums_state.subscribe(state => {
        let enums = [];

        for (let [key, value] of Object.entries(state)) {
            if (value) {
                enums.push({
                    identifier: key,
                    value: value,
                });
            }
        }

        Observer.broadcast(self.enums_event, enums);
    });

    self.register_enum = function(identifier) {
        Observer.register(
            Utils.gen_event('PopoverButton.state', self.get_id(), 'filters', identifier),
            data => {
                let state = self.enums_state();

                state[identifier] = data;

                self.enums_state(state);
            },
        );
    };

    self.register_enum('geography');
    self.register_enum('style');
    self.register_enum('sector');

    self.review = ko.observable(false);

    self.toggle_review = function() {
        self.review(!self.review());
    };

    self.uids_in_portfolio = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            mapping: 'list_to_map',
            mapping_args: {
                value: true,
            },
            query: {
                target: 'vehicle:uids_in_portfolio',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    });

    self.adding = ko.observable(false);

    self._included_vehicles = ko.observable({});

    self.included_vehicles = ko.computed(() => {
        return Object.values(self._included_vehicles());
    });

    self.num_included_vehicles = ko.computed(() => {
        return self.included_vehicles().length;
    });

    self.included_vehicles_table = self.new_instance(DataTable, {
        id: 'included_vehicles_table',
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 10,
        clear_order_event: self.clear_event,
        enable_clear_order: true,
        enable_selection: true,
        empty_template: 'tpl_data_table_no_supporting_vehicles',
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: 'Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'Shared By',
                key: 'shared_by',
                format: 'strings',
            },
            {
                label: 'Vintage',
                key: 'vintage_year',
                type: 'numeric',
                first_sort: 'desc',
            },
            {
                label: 'As of Date',
                key: 'last_date',
                first_sort: 'desc',
                format: 'backend_date',
            },
        ],
        inline_data: true,
        data: self.included_vehicles,
    });

    self.selected_count = self.new_instance(SelectedCount, {
        id: 'selected_count',
        data_table_id: self.vehicles_table.get_id(),
        visible_without_selection: true,
    });

    self.included_selected_count = self.new_instance(SelectedCount, {
        id: 'selected_count',
        data_table_id: self.included_vehicles_table.get_id(),
        visible_without_selection: true,
    });

    self.remove_selected_vehicles = function() {
        let vehicles = self.included_vehicles_table.get_selected();
        let _included_vehicles = self._included_vehicles();

        if (vehicles && vehicles.length) {
            for (let i = 0, l = vehicles.length; i < l; i++) {
                self._remove_vehicle(vehicles[i], _included_vehicles);
            }

            self._included_vehicles(_included_vehicles);

            self.included_vehicles_table.reset_selected();
        }
    };

    self._remove_vehicle = function(vehicle, _included_vehicles) {
        delete _included_vehicles[Utils.get_vehicle_uid(vehicle)];
    };

    self.remove_vehicle = function(vehicle) {
        if (vehicle) {
            let _included_vehicles = self._included_vehicles();

            self._remove_vehicle(vehicle, _included_vehicles);

            self._included_vehicles(_included_vehicles);
        }
    };

    self._add_vehicle = function(vehicle, _included_vehicles) {
        _included_vehicles[Utils.get_vehicle_uid(vehicle)] = vehicle;
    };

    self.add_vehicle = function(vehicle) {
        if (vehicle) {
            let _included_vehicles = self._included_vehicles();

            self._add_vehicle(vehicle, _included_vehicles);

            self._included_vehicles(_included_vehicles);
        }
    };

    self.add_selected_vehicles = function() {
        let vehicles = self.vehicles_table.get_selected();
        let _included_vehicles = self._included_vehicles();

        if (vehicles && vehicles.length > 0) {
            for (let i = 0, l = vehicles.length; i < l; i++) {
                self._add_vehicle(vehicles[i], _included_vehicles);
            }

            self._included_vehicles(_included_vehicles);

            self.vehicles_table.reset_selected();
        }
    };

    Observer.register_for_id(
        Utils.gen_id(self.get_id(), 'vehicles_table', 'actions'),
        'ActionButtons.action.add',
        payload => {
            if (payload) {
                self.add_vehicle(payload);
            }
        },
    );

    Observer.register_for_id(
        Utils.gen_id(self.get_id(), 'included_vehicles_table', 'actions'),
        'ActionButtons.action.remove',
        payload => {
            if (payload) {
                self.remove_vehicle(payload);
            }
        },
    );

    Observer.register(self.vehicle_uid_event, uid => {
        self.vehicle_uid(uid);
    });

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        Observer.broadcast(self.clear_event);

        self.adding(false);
        self.review(false);

        self._included_vehicles({});
        self.included_vehicles_table.reset_selected();
        self.vehicles_table.reset_selected();
        bison.helpers.close_modal(self.get_id());
    };

    self.has_vehicles = ko.computed(() => {
        return self.num_included_vehicles() > 0;
    });

    self._add_funds_to_portfolio = DataThing.backends.useractionhandler({
        url: 'add_funds_to_portfolio',
    });

    self.confirm_add_vehicles = function() {
        self._add_funds_to_portfolio({
            data: {
                portfolio_uid: self.vehicle_uid(),
                funds: Object.values(self._included_vehicles()),
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                self.reset();
                Observer.broadcast_for_id(self.get_id(), 'PortfolioFundsManagerModal.success');
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    return self;
}
