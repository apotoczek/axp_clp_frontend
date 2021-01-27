/* Automatically transformed from AMD to ES6. Beware of code smell. */
import VehicleCashflows from 'src/libs/components/datamanager/VehicleCashflows';
import FundCharacteristics from 'src/libs/components/datamanager/FundCharacteristics';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import DataManagerHeader from 'src/libs/components/datamanager/DataManagerHeader';
import DeleteCashflowModal from 'src/libs/components/modals/DeleteCashflowModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Checklist from 'src/libs/components/basic/Checklist';
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import EventButton from 'src/libs/components/basic/EventButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import * as Constants from 'src/libs/Constants';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataThing from 'src/libs/DataThing';
import CustomAttributeModal from 'src/libs/components/modals/CustomAttributeModal';

export default function(opts, components) {
    const self = new BaseComponent(opts, components);

    const _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;

    self.is_remote_entity = opts.is_remote_entity || false;

    self.events = self.new_instance(EventRegistry, {});
    self.events.resolve_and_add('custom_characteristics', 'PopoverButton.value');
    for (const event_id of ['save_characteristics', 'save_cashflows']) {
        self.events.resolve_and_add(event_id, `ActionButton.action.${event_id}`);

        Observer.register(self.events.get(event_id), () => {
            bison.utils.Notify('Success!', 'Your changes have been saved.', 'alert-success');
        });
    }

    self.created_custom_characteristic_event = Utils.gen_event(
        'CustomCharacteristics.create',
        self.get_id(),
    );
    self.new_characteristic_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'cpanel',
        'tools',
        'characteristics',
        'new_characteristic',
    );
    self.select_custom_characteristic_event = Utils.gen_event(
        'CustomCharacteristics.select',
        self.get_id(),
    );
    self.deselect_custom_characteristic_event = Utils.gen_event(
        'CustomCharacteristics.deselect',
        self.get_id(),
    );
    self.vehicle_uid = ko.observable();

    self.update_attribute_value = DataThing.backends.useractionhandler({
        url: 'update_attribute_value',
    });

    Observer.register(self.deselect_custom_characteristic_event, data => {
        self.update_attribute_value({
            data: {
                attribute_uid: data.value,
                entity_type: 'user_fund',
                entity_uid: self.vehicle_uid(),
                selected_member_uid: undefined,
            },
            success: DataThing.api.XHRSuccess(() => {}),
        });
    });

    self.vehicle_uid_event =
        opts.vehicle_uid_event || Utils.gen_event('Active.vehicle_uid', self.get_id());
    self.navigation_event = Utils.gen_event(
        'RadioButtons.state',
        self.get_id(),
        'cpanel',
        'navigation',
    );
    self.toolbar_mode_event = Utils.gen_event('Toolbar.mode', self.get_id());
    Observer.register(self.navigation_event, mode => {
        Observer.broadcast(self.toolbar_mode_event, `${mode}_tools_menu`);
    });

    Observer.register(self.vehicle_uid_event, self.vehicle_uid);

    DataManagerHelper.register_view_in_analytics_events([
        Utils.gen_event(
            'ActionButton.action.view_in_analytics',
            self.get_id(),
            'body',
            'toolbar',
            'characteristics_tools_menu',
            'view_in_analytics',
        ),
        Utils.gen_event(
            'ActionButton.action.view_in_analytics',
            self.get_id(),
            'body',
            'toolbar',
            'cashflows_tools_menu',
            'view_in_analytics',
        ),
    ]);

    DataManagerHelper.register_upload_wizard_events([
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'toolbar',
            'characteristics_tools_menu',
            'upload',
        ),
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'toolbar',
            'cashflows_tools_menu',
            'upload',
        ),
    ]);

    DataManagerHelper.register_create_new_entity_action_buttons([
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'characteristics_tools_menu', 'new'),
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'cashflows_tools_menu', 'new'),
    ]);

    self.cpanel = self.new_instance(Aside, {
        id: 'cpanel',
        title: 'Data Manager',
        title_css: 'data-manager',
        template: 'tpl_analytics_cpanel',
        layout: {
            header: 'navigation',
            body: ['tools'],
        },
        components: [
            {
                id: 'navigation',
                component: RadioButtons,
                template: 'tpl_full_width_radio_buttons',
                default_state: 'characteristics',
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
                buttons: [
                    {
                        label: 'Attributes',
                        state: 'characteristics',
                    },
                    {
                        label: 'Cash Flows',
                        state: 'cashflows',
                        disabled_callback: () => self.is_remote_entity,
                    },
                ],
                reset_event: self.reset_event,
            },
            {
                id: 'tools',
                component: DynamicWrapper,
                active_component: 'characteristics',
                template: 'tpl_dynamic_wrapper',
                set_active_event: self.navigation_event,
                components: [
                    {
                        id: 'cashflows',
                        template: 'tpl_cpanel_body_items',
                        layout: {
                            body: [
                                'results_per_page',
                                'note',
                                'label',
                                'date',
                                'type',
                                'clear_button',
                            ],
                        },
                        components: [
                            {
                                id: 'label',
                                component: HTMLContent,
                                html: '<h5>Filter</h5>',
                            },
                            {
                                id: 'note',
                                component: StringFilter,
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'cashflows',
                                    'clear_button',
                                ),
                                placeholder: 'Note...',
                                cpanel_style: true,
                            },
                            DataManagerHelper.filters.range_popover({
                                id: 'date',
                                label: 'Date',
                                placeholder_suffix: 'Date',
                                mode: 'date',
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'cashflows',
                                    'clear_button',
                                ),
                            }),
                            {
                                id: 'type',
                                component: NewPopoverButton,
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                popover_options: {
                                    placement: 'right',
                                    title: 'Type',
                                    css_class: 'popover-cpanel',
                                },
                                icon_css: 'glyphicon glyphicon-plus',
                                label: 'Type',
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'cashflows',
                                    'clear_button',
                                ),
                                popover_config: {
                                    component: Checklist,
                                    enable_exclude: true,
                                    datasource: Constants.cashflow_cf_type_filter_options,
                                },
                            },
                            {
                                id: 'clear_button',
                                component: EventButton,
                                template: 'tpl_cpanel_button',
                                css: {'btn-default': true, 'btn-sm': true},
                                label: 'Clear Filters',
                            },
                            {
                                id: 'results_per_page',
                                component: NewPopoverButton,
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                popover_options: {
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                    title: 'Results per page',
                                },
                                label: 'Results per page',
                                label_track_selection: true,
                                hide_icon: true,
                                popover_config: {
                                    component: Radiolist,
                                    strings: {
                                        no_selection: 'All',
                                    },
                                    datasource: {
                                        type: 'observer',
                                        event_type: Utils.gen_event(
                                            'DataTable.results_per_page',
                                            self.get_id(),
                                            'body',
                                            'cashflows',
                                            'table',
                                        ),
                                    },
                                },
                            },
                        ],
                    },
                    {
                        id: 'characteristics',
                        template: 'tpl_cpanel_body_items',
                        layout: {
                            body: ['label', 'new_characteristic', 'custom_characteristics'],
                        },
                        components: [
                            {
                                id: 'label',
                                component: HTMLContent,
                                html: '<h5>Custom Attributes</h5>',
                            },
                            {
                                id: 'custom_characteristics',
                                id_callback: self.events.register_alias('custom_characteristics'),
                                component: NewPopoverButton,
                                label: 'Add Existing',
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                icon_css: 'glyphicon glyphicon-plus',
                                popover_options: {
                                    title: 'Select Existing',
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                },
                                popover_config: {
                                    component: Checklist,
                                    selection_event: self.select_custom_characteristic_event,
                                    deselect_event: self.deselect_custom_characteristic_event,
                                    datasource: {
                                        type: 'dynamic',
                                        mapping: 'to_self_encapsulated_options',
                                        mapping_args: {
                                            label_key: 'name',
                                            selected: 'selected_member_key',
                                        },
                                        query: {
                                            target: 'custom_attributes_with_values',
                                            include_members: true,
                                            entity_uid: {
                                                type: 'observer',
                                                event_type: self.vehicle_uid_event,
                                                required: true,
                                            },
                                            entity_type: 'user_fund',
                                        },
                                    },
                                    selected_datasource: {
                                        type: 'dynamic',
                                        mapping: function(subject) {
                                            const selected = [];
                                            for (let i = 0, l = subject.length; i < l; i++) {
                                                if (subject[i].selected_member_uid) {
                                                    selected.push(subject[i].uid);
                                                }
                                            }
                                            return selected;
                                        },
                                        query: {
                                            target: 'custom_attributes_with_values',
                                            include_members: true,
                                            entity_uid: {
                                                type: 'observer',
                                                event_type: self.vehicle_uid_event,
                                                required: true,
                                            },
                                            entity_type: 'user_fund',
                                        },
                                    },
                                },
                            },
                            {
                                label: 'New Attribute',
                                component: EventButton,
                                template: 'tpl_cpanel_button',
                                id: 'new_characteristic',
                                css: {'btn-sm': true, 'btn-success': true},
                            },
                        ],
                    },
                ],
            },
        ],
    });

    self.new_custom_attribute_modal = self.new_instance(CustomAttributeModal, {
        id: 'new_custom_attribute_modal',
        select_custom_characteristic_event: self.select_custom_characteristic_event,
    });

    Observer.register(self.new_characteristic_event, () => {
        self.new_custom_attribute_modal.show();
    });

    self.characteristics_tools_menu = {
        id: 'characteristics_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            DataManagerHelper.buttons.delete_entities({
                origin_url: '#!/data-manager/vehicles',
                check_permissions: true,
            }),
            DataManagerHelper.buttons.share({
                check_permissions: true,
            }),
            DataManagerHelper.buttons.view_in_analytics(),
            {
                id: 'save_characteristics',
                label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                action: 'save_characteristics',
                disabled_label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                id_callback: self.events.register_alias('save_characteristics'),
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    };

    self.cashflows_tools_menu = {
        id: 'cashflows_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            DataManagerHelper.buttons.delete_entities({
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'cashflows', 'table'),
                component: DeleteCashflowModal,
                vehicle_uid_event: self.vehicle_uid_event,
            }),
            DataManagerHelper.buttons.view_in_analytics(),
            {
                id: 'save_cashflows',
                label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                action: 'save_cashflows',
                disabled_label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                id_callback: self.events.register_alias('save_cashflows'),
            },
        ],
        data_table_id: Utils.gen_id(self.get_id(), 'body', 'cashflows', 'table'),
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    };

    self.body = self.new_instance(DynamicWrapper, {
        id: 'body',
        template: 'tpl_analytics_body',
        active_component: 'characteristics',
        set_active_event: self.navigation_event,
        layout: {
            header: 'header',
            toolbar: 'toolbar',
        },
        components: [
            {
                component: DynamicWrapper,
                id: 'toolbar',
                set_active_event: self.toolbar_mode_event,
                active_component: 'characteristics_tools_menu',
                components: [self.characteristics_tools_menu, self.cashflows_tools_menu],
            },
            {
                component: DynamicWrapper,
                id: 'header',
                set_active_event: self.navigation_event,
                active_component: 'characteristics',
                components: [
                    {
                        component: DataManagerHeader,
                        template: 'tpl_breadcrumb_header',
                        id: 'characteristics',
                        layout: {
                            breadcrumb: 'breadcrumb',
                        },
                        components: [
                            {
                                id: 'breadcrumb',
                                component: Breadcrumb,
                                items: [
                                    {
                                        label: 'Data Manager',
                                        link: '#!/data-manager',
                                    },
                                    {
                                        label: 'Vehicles',
                                        link: '#!/data-manager/vehicles',
                                    },
                                    {
                                        label_key: 'name',
                                        datasource: {
                                            type: 'dynamic',
                                            query: {
                                                target: 'vehicle:meta_data',
                                                user_fund_uid: {
                                                    type: 'observer',
                                                    event_type: self.vehicle_uid_event,
                                                    required: true,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: self.vehicle_uid_event,
                                    required: true,
                                },
                            },
                        },
                    },
                    {
                        component: DataManagerHeader,
                        id: 'cashflows',
                        template: 'tpl_breadcrumb_header',
                        data_table_id: Utils.gen_id(self.get_id(), 'body', 'cashflows', 'table'),
                        layout: {
                            breadcrumb: 'breadcrumb',
                        },
                        components: [
                            {
                                id: 'breadcrumb',
                                component: Breadcrumb,
                                items: [
                                    {
                                        label: 'Data Manager',
                                        link: '#!/data-manager',
                                    },
                                    {
                                        label: 'Vehicles',
                                        link: '#!/data-manager/vehicles',
                                    },
                                    {
                                        label_key: 'name',
                                        datasource: {
                                            type: 'dynamic',
                                            query: {
                                                target: 'vehicle:meta_data',
                                                user_fund_uid: {
                                                    type: 'observer',
                                                    event_type: self.vehicle_uid_event,
                                                    required: true,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: self.vehicle_uid_event,
                                    required: true,
                                },
                            },
                        },
                    },
                ],
            },
            {
                id: 'characteristics',
                component: FundCharacteristics,
                vehicle_uid_event: self.vehicle_uid_event,
                hl_deployment: config.hl,
                cashflow_type: 'net',
                save_event: self.events.get('save_characteristics'),
                characteristics_event: self.events.get('custom_characteristics'),
                is_remote_entity: self.is_remote_entity,
            },
            {
                id: 'cashflows',
                component: VehicleCashflows,
                vehicle_uid_event: self.vehicle_uid_event,
                cashflow_type: 'net',
                tools_menu_id: Utils.gen_id(
                    self.get_id(),
                    'body',
                    'toolbar',
                    'cashflows_tools_menu',
                ),
                results_per_page_event: Utils.gen_event(
                    'PopoverButton.value',
                    self.cpanel.get_id(),
                    'tools',
                    'cashflows',
                    'results_per_page',
                ),
                save_event: self.events.get('save_cashflows'),
                table_filter_conf: {
                    type: 'dynamic',
                    query: {
                        note: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.cpanel.get_id(),
                                'tools',
                                'cashflows',
                                'note',
                            ),
                        },
                        date: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'cashflows',
                                'date',
                            ),
                        },
                        type: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'cashflows',
                                'type',
                            ),
                        },
                        company_uid: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'cashflows',
                                'company',
                            ),
                        },
                    },
                },
            },
            {
                id: 'breadcrumb',
                component: Breadcrumb,
                items: [
                    {
                        label: 'Data Manager',
                        link: '#!/data-manager',
                    },
                    {
                        label: 'Vehicles',
                        link: '#!/data-manager/vehicles',
                    },
                    {
                        label: 'Fund',
                    },
                    {
                        label: 'Net',
                    },
                    {
                        datasource: {
                            key: 'name',
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: self.vehicle_uid_event,
                                    required: true,
                                },
                            },
                        },
                    },
                ],
            },
        ],
    });

    self.asides = [self.cpanel, self.body];

    self.when(self.cpanel, self.body).done(() => {
        _dfd.resolve();
    });

    return self;
}
