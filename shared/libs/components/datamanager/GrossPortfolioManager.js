/* Automatically transformed from AMD to ES6. Beware of code smell. */
import VehicleFunds from 'src/libs/components/datamanager/VehicleFunds';
import PortfolioCharacteristics from 'src/libs/components/datamanager/PortfolioCharacteristics';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DeleteFundInPortfolioModal from 'src/libs/components/modals/DeleteFundInPortfolioModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import StringFilter from 'src/libs/components/basic/StringFilter';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import EventButton from 'src/libs/components/basic/EventButton';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import config from 'config';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataThing from 'src/libs/DataThing';

import Radiolist from 'src/libs/components/basic/Radiolist';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;

    self.events = self.new_instance(EventRegistry, {});

    for (let event_id of ['save_characteristics', 'save_funds']) {
        self.events.resolve_and_add(event_id, `ActionButton.action.${event_id}`);

        Observer.register(self.events.get(event_id), () => {
            bison.utils.Notify('Success!', 'Your changes have been saved.', 'alert-success');
        });
    }

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
            'funds_tools_menu',
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
            'funds_tools_menu',
            'upload',
        ),
    ]);

    DataManagerHelper.register_create_new_entity_action_buttons([
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'characteristics_tools_menu', 'new'),
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'funds_tools_menu', 'new'),
    ]);

    self.vehicle_uid = Observer.observable(self.vehicle_uid_event);
    self.events.resolve_and_add(
        'download_attribute_spreadsheet',
        'ActionButton.action.download_attribute_spreadsheet',
    );

    Observer.register(self.events.get('download_attribute_spreadsheet'), () => {
        let portfolio_uid = self.vehicle_uid();

        DataThing.get({
            params: {
                target: 'prepare_child_attribute_spreadsheet',
                entity_type: 'portfolio',
                entity_uid: portfolio_uid,
            },
            success: key => {
                DataThing.form_post(config.download_file_base + key);
                bison.helpers.close_modal(self.get_id());
            },
            error: () => {},
            force: true,
        });
    });

    self.cpanel = self.new_instance(Aside, {
        id: 'cpanel',
        title: 'Data Manager',
        template: 'tpl_analytics_cpanel',
        title_css: 'data-manager',
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
                        label: 'Funds',
                        state: 'funds',
                    },
                ],
                reset_event: self.reset_event,
            },
            {
                id: 'tools',
                component: DynamicWrapper,
                active_component: 'characteristics',
                set_active_event: self.navigation_event,
                components: [
                    {
                        id: 'funds',
                        template: 'tpl_cpanel_body_items',
                        layout: {
                            body: [
                                'add_funds',
                                'results_per_page',
                                'name',
                                'label',
                                'commitment',
                                'unfunded',
                                'vintage_year',
                                'enum_attributes',
                                'clear_button',
                            ],
                        },
                        components: [
                            {
                                id: 'add_funds',
                                component: EventButton,
                                template: 'tpl_cpanel_button',
                                css: {
                                    'btn-sm': true,
                                    'btn-cpanel-success': true,
                                },
                                label: 'Add Funds',
                            },
                            {
                                id: 'label',
                                component: HTMLContent,
                                html: '<h5>Filter</h5>',
                            },
                            {
                                id: 'name',
                                component: StringFilter,
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'funds',
                                    'clear_button',
                                ),
                                placeholder: 'Name...',
                                cpanel_style: true,
                            },
                            DataManagerHelper.filters.range_popover({
                                id: 'commitment',
                                label: 'Commitment',
                                placeholder_suffix: '(Millions)',
                                mode: 'number',
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'funds',
                                    'clear_button',
                                ),
                            }),
                            DataManagerHelper.filters.range_popover({
                                id: 'unfunded',
                                label: 'Unfunded',
                                placeholder_suffix: '(Millions)',
                                mode: 'number',
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'funds',
                                    'clear_button',
                                ),
                            }),
                            {
                                id: 'vintage_year',
                                component: NewPopoverButton,
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                popover_options: {
                                    placement: 'right',
                                    title: 'Benchmark Vintage Year',
                                    css_class: 'popover-cpanel',
                                },
                                icon_css: 'glyphicon glyphicon-plus',
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'funds',
                                    'clear_button',
                                ),
                                label: 'Vintage Year',
                                popover_config: {
                                    component: Checklist,
                                    enable_exclude: true,
                                    datasource: {
                                        type: 'static',
                                        mapping: 'list_to_options',
                                        data: Utils.valid_vintage_years(),
                                    },
                                },
                            },
                            {
                                id: 'enum_attributes',
                                component: AttributeFilters,
                                css: {
                                    'cpanel-btn-sm': true,
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                },
                                clear_event: Utils.gen_event(
                                    'EventButton',
                                    self.get_id(),
                                    'cpanel',
                                    'tools',
                                    'funds',
                                    'clear_button',
                                ),
                                datasource: {
                                    type: 'dynamic',
                                    query: {
                                        target: 'filter_configs',
                                        public_taxonomy: true,
                                    },
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
                                    title: 'Results per page',
                                    css_class: 'popover-cpanel',
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
                                            'funds',
                                            'table',
                                        ),
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        ],
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
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    };
    self.funds_tools_menu = {
        id: 'funds_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            DataManagerHelper.buttons.delete_entities({
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'funds', 'table'),
                component: DeleteFundInPortfolioModal,
                label: 'Remove Selected <span class="icon-trash-1"></span>',
                vehicle_uid_event: self.vehicle_uid_event,
            }),
            DataManagerHelper.buttons.view_in_analytics(),
            {
                id: 'save_funds',
                label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                action: 'save_funds',
                disabled_label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                id_callback: self.events.register_alias('save_funds'),
            },
            {
                id: 'download_attribute_spreadsheet',
                label:
                    'Download Spreadsheet <span style="padding-left:3px" class="glyphicon glyphicon-download-alt"></span>',
                action: 'download_attribute_spreadsheet',
                css: {
                    'pull-left': true,
                },
                id_callback: self.events.register_alias('download_attribute_spreadsheet'),
                use_header_data: true,
                disabled_callback: data => {
                    return !data || data.vehicle_count === 0;
                },
            },
            {
                id: 'upload',
                label: 'Upload <span class="icon-upload"></span>',
                action: 'upload',
                css: {
                    'pull-left': true,
                },
            },
        ],
        data_table_id: Utils.gen_id(self.get_id(), 'body', 'funds', 'table'),
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                portfolio_uid: {
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
        set_active_event: Utils.gen_event('RadioButtons.state', self.cpanel.get_id(), 'navigation'),
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
                components: [self.characteristics_tools_menu, self.funds_tools_menu],
            },
            {
                component: DynamicWrapper,
                id: 'header',
                set_active_event: self.navigation_event,
                active_component: 'characteristics',
                components: [
                    {
                        component: BreadcrumbHeader,
                        id: 'characteristics',
                        template: 'tpl_breadcrumb_header',
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
                                                portfolio_uid: {
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
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: self.vehicle_uid_event,
                                    required: true,
                                },
                            },
                        },
                    },
                    {
                        component: BreadcrumbHeader,
                        id: 'funds',
                        template: 'tpl_breadcrumb_header',
                        data_table_id: Utils.gen_id(self.get_id(), 'body', 'funds', 'table'),
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
                                                portfolio_uid: {
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
                                portfolio_uid: {
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
                component: PortfolioCharacteristics,
                vehicle_uid_event: self.vehicle_uid_event,
                cashflow_type: 'gross',
            },
            {
                id: 'funds',
                component: VehicleFunds,
                vehicle_uid_event: self.vehicle_uid_event,
                tools_menu_id: Utils.gen_id(self.get_id(), 'body', 'toolbar', 'funds_tools_menu'),
                show_modal_event: Utils.gen_event(
                    'EventButton',
                    self.cpanel.get_id(),
                    'tools',
                    'funds',
                    'add_funds',
                ),
                cashflow_type: 'gross',
                results_per_page_event: Utils.gen_event(
                    'PopoverButton.value',
                    self.cpanel.get_id(),
                    'tools',
                    'funds',
                    'results_per_page',
                ),
                table_filter_conf: {
                    type: 'dynamic',
                    query: {
                        name: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.cpanel.get_id(),
                                'tools',
                                'funds',
                                'name',
                            ),
                        },
                        commitment: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'funds',
                                'commitment',
                            ),
                        },
                        unfunded: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'funds',
                                'unfunded',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'funds',
                                'vintage_year',
                            ),
                        },
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.cpanel.get_id(),
                                'tools',
                                'funds',
                                'enum_attributes',
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
                    },
                    {
                        label: 'Vehicles',
                        link: '#!/data-manager/vehicles',
                    },
                    {
                        label: 'Portfolio',
                    },
                    {
                        label: 'Gross',
                    },
                    {
                        datasource: {
                            key: 'name',
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:meta_data',
                                portfolio_uid: {
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
