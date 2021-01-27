/* Automatically transformed from AMD to ES6. Beware of code smell. */
import VehicleMetrics from 'src/libs/components/datamanager/VehicleMetrics';
import VehicleCompanyValuations from 'src/libs/components/datamanager/VehicleCompanyValuations';
import VehicleDeals from 'src/libs/components/datamanager/VehicleDeals';
import VehicleCashflows from 'src/libs/components/datamanager/VehicleCashflows';
import FundCharacteristics from 'src/libs/components/datamanager/FundCharacteristics';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DropdownModal from 'src/libs/components/modals/DropdownModal';
import AnalyzeMetricsModal from 'src/libs/components/modals/AnalyzeMetricsModal';
import DeleteValuationModal from 'src/libs/components/modals/DeleteValuationModal';
import DeleteDealModal from 'src/libs/components/modals/DeleteDealModal';
import DeleteCashflowModal from 'src/libs/components/modals/DeleteCashflowModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import PopoverNestedChecklist from 'src/libs/components/popovers/PopoverNestedChecklist';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import StringFilter from 'src/libs/components/basic/StringFilter';
import EventButton from 'src/libs/components/basic/EventButton';
import Checklist from 'src/libs/components/basic/Checklist';
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import * as Constants from 'src/libs/Constants';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataThing from 'src/libs/DataThing';
import CustomAttributeModal from 'src/libs/components/modals/CustomAttributeModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.reset_event = opts.reset_event;

    self.events = self.new_instance(EventRegistry, {});

    self.events.resolve_and_add(
        'download_attribute_spreadsheet',
        'ActionButton.action.download_attribute_spreadsheet',
    );

    self.events.resolve_and_add(
        'download_valuations_template',
        'ActionButton.action.download_valuations_template',
    );
    self.events.resolve_and_add(
        'download_metrics_spreadsheet',
        'ActionButton.action.download_metrics_spreadsheet',
    );
    self.events.resolve_and_add('custom_characteristics', 'PopoverButton.value');
    self.events.resolve_and_add('metric_versions', 'PopoverButton.value');
    self.events.resolve_and_add('metric_identifiers', 'PopoverButton.value');
    self.events.resolve_and_add('company_name', 'StringFilter.value');

    for (let event_id of [
        'save_characteristics',
        'save_cashflows',
        'save_valuations',
        'save_deals',
    ]) {
        self.events.resolve_and_add(event_id, `ActionButton.action.${event_id}`);

        Observer.register(self.events.get(event_id), () => {
            bison.utils.Notify('Success!', 'Your changes have been saved.', 'alert-success');
        });
    }

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

    self._update_metric_sets = DataThing.backends.useractionhandler({
        url: 'update_metric_sets',
    });

    self._update_attribute_value = DataThing.backends.useractionhandler({
        url: 'update_attribute_value',
    });

    Observer.register(self.deselect_custom_characteristic_event, data => {
        self._update_attribute_value({
            data: {
                attribute_uid: data.value,
                entity_type: 'user_fund',
                entity_uid: self.vehicle_uid(),
                selected_member_uid: undefined,
            },
            success: DataThing.api.XHRSuccess(() => {}),
        });
    });

    Observer.register(self.events.get('download_attribute_spreadsheet'), () => {
        let user_fund_uid = self.vehicle_uid();

        DataThing.get({
            params: {
                target: 'prepare_child_attribute_spreadsheet',
                entity_type: 'user_fund',
                entity_uid: user_fund_uid,
            },
            success: key => {
                DataThing.form_post(config.download_file_base + key);
                bison.helpers.close_modal(self.get_id());
            },
            error: () => {},
            force: true,
        });
    });

    self._prepare_valuations_template = DataThing.backends.useractionhandler({
        url: 'prepare_valuations_template',
    });

    Observer.register(self.events.get('download_valuations_template'), () => {
        let user_fund_uid = self.vehicle_uid();

        self._prepare_valuations_template({
            data: {
                entity_type: 'user_fund',
                entity_uid: user_fund_uid,
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    });
    self._prepare_metrics_template = DataThing.backends.useractionhandler({
        url: 'prepare_metrics_template',
    });

    Observer.register(self.events.get('download_metrics_spreadsheet'), () => {
        let user_fund_uid = self.vehicle_uid();

        self._prepare_metrics_template({
            data: {
                user_fund_uid: user_fund_uid,
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
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
        Utils.gen_event(
            'ActionButton.action.view_in_analytics',
            self.get_id(),
            'body',
            'toolbar',
            'deals_tools_menu',
            'view_in_analytics',
        ),
        Utils.gen_event(
            'ActionButton.action.view_in_analytics',
            self.get_id(),
            'body',
            'toolbar',
            'valuations_tools_menu',
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
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'toolbar',
            'deals_tools_menu',
            'upload',
        ),
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'toolbar',
            'valuations_tools_menu',
            'upload',
        ),
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'toolbar',
            'metrics_tools_menu',
            'upload',
        ),
    ]);

    DataManagerHelper.register_create_new_entity_action_buttons([
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'characteristics_tools_menu', 'new'),
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'cashflows_tools_menu', 'new'),
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'deals_tools_menu', 'new'),
        Utils.gen_id(self.get_id(), 'body', 'toolbar', 'valuations_tools_menu', 'new'),
    ]);

    let cpanel_items = {};

    cpanel_items.characteristics = {
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
                    title: 'Select Attributes',
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
                            let selected = [];
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
    };

    cpanel_items.cashflows = {
        id: 'cashflows',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'results_per_page',
                'note',
                'label',
                'date',
                'type',
                'company',
                'custom_attributes',
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
                    css_class: 'popover-cpanel',
                    title: 'Type',
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
                id: 'company',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Company',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Company',
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
                    datasource: {
                        type: 'dynamic',
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'company_uid',
                            label_key: 'company_name',
                        },
                        query: {
                            target: 'deals',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: self.vehicle_uid_event,
                                required: true,
                            },
                            results_per_page: 'all',
                            order_by: [{name: 'company_name'}],
                        },
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
            DataManagerHelper.filters.custom_attributes_popover({
                id: 'custom_attributes',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'cashflows',
                    'clear_button',
                ),
                entity_uid_event: self.vehicle_uid_event,
                entity_type: 'user_fund',
            }),
        ],
    };

    cpanel_items.deals = {
        id: 'deals',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'results_per_page',
                'name',
                'label',
                'enum_attributes',
                'sector',
                'deal_source',
                'deal_role',
                'deal_type',
                'seller_type',
                'custom_attributes',
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
                id: 'name',
                component: StringFilter,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                placeholder: 'Company Name...',
                cpanel_style: true,
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
                        include_enums: ['geography'],
                    },
                },
            },
            {
                id: 'sector',
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                label: 'Sector / Industry',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Sector',
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_config: {
                    component: PopoverNestedChecklist,
                    template: 'tpl_popover_nested_checklist',
                    l1: {
                        key: 'sector',
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'enum_sectors',
                            },
                        },
                    },
                    l2: {
                        key: 'industry',
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'enum_industries',
                            },
                        },
                        empty_text: 'Select a Sector to filter by Industry',
                    },
                },
            },
            {
                id: 'deal_source',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Deal Source',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Deal Source',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_source',
                        },
                    },
                },
            },
            {
                id: 'deal_role',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Deal Role',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Deal Role',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_role',
                        },
                    },
                },
            },
            {
                id: 'deal_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Deal Type',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Deal Type',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_deal_type',
                        },
                    },
                },
            },
            {
                id: 'seller_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Seller Type',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Seller Type',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_seller_type',
                        },
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
                            'deals',
                            'table',
                        ),
                    },
                },
            },
            DataManagerHelper.filters.custom_attributes_popover({
                id: 'custom_attributes',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'deals',
                    'clear_button',
                ),
                entity_uid_event: self.vehicle_uid_event,
                entity_type: 'user_fund',
            }),
        ],
    };

    cpanel_items.valuations = {
        id: 'valuations',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'results_per_page',
                'label',
                'company',
                'valuation_type',
                'date',
                'equity_value',
                'enterprise_value',
                'debt',
                'revenue',
                'ebitda',
                'custom_attributes',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'label',
                component: HTMLContent,
                html: '<h5>Filter</h5>',
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
                    'valuations',
                    'clear_button',
                ),
            }),
            DataManagerHelper.filters.range_popover({
                id: 'equity_value',
                label: 'Equity Value',
                placeholder_suffix: '(Millions)',
                mode: 'number',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
            }),
            DataManagerHelper.filters.range_popover({
                id: 'enterprise_value',
                label: 'Enterprise Value',
                placeholder_suffix: '(Millions)',
                mode: 'number',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
            }),
            DataManagerHelper.filters.range_popover({
                id: 'debt',
                label: 'Debt',
                placeholder_suffix: '(Millions)',
                mode: 'number',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
            }),
            DataManagerHelper.filters.range_popover({
                id: 'revenue',
                label: 'Revenue',
                placeholder_suffix: '(Millions)',
                mode: 'number',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
            }),
            DataManagerHelper.filters.range_popover({
                id: 'ebitda',
                label: 'EBITDA',
                placeholder_suffix: '(Millions)',
                mode: 'number',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
            }),
            {
                id: 'valuation_type',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Valuation Type',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Valuation Type',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'static_enums',
                            enum_type: 'company_valuation_type',
                        },
                    },
                },
            },
            {
                id: 'company',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                    title: 'Company',
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Company',
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
                    datasource: {
                        type: 'dynamic',
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'company_uid',
                            label_key: 'company_name',
                        },
                        query: {
                            target: 'deals',
                            user_fund_uid: {
                                type: 'observer',
                                event_type: self.vehicle_uid_event,
                                required: true,
                            },
                            results_per_page: 'all',
                            order_by: [{name: 'company_name'}],
                        },
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
                            'valuations',
                            'table',
                        ),
                    },
                },
            },
            DataManagerHelper.filters.custom_attributes_popover({
                id: 'custom_attributes',
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'valuations',
                    'clear_button',
                ),
                entity_uid_event: self.vehicle_uid_event,
                entity_type: 'user_fund',
            }),
        ],
    };

    cpanel_items.metrics = {
        id: 'metrics',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: ['name', 'label', 'metric_identifiers', 'metric_versions', 'clear_button'],
        },
        components: [
            {
                id: 'label',
                component: HTMLContent,
                html: '<h5>Filters</h5>',
            },
            {
                id: 'metric_versions',
                id_callback: self.events.register_alias('metric_versions'),
                visible: auth.user_has_feature('metric_versions'),
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'metrics',
                    'clear_button',
                ),
                label: 'Metric Versions',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select metric versions',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        query: {
                            target: 'vehicle:metric_versions',
                            entity_uid: {
                                type: 'observer',
                                event_type: self.vehicle_uid_event,
                                required: true,
                            },
                            entity_type: 'user_fund',
                        },
                    },
                    select_first_option: !auth.user_has_feature('metric_versions'),
                },
            },
            {
                id: 'name',
                component: StringFilter,
                id_callback: self.events.register_alias('company_name'),
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'metrics',
                    'clear_button',
                ),
                placeholder: 'Company Name...',
                cpanel_style: true,
            },
            {
                id: 'metric_identifiers',
                id_callback: self.events.register_alias('metric_identifiers'),
                component: NewPopoverButton,
                clear_event: Utils.gen_event(
                    'EventButton',
                    self.get_id(),
                    'cpanel',
                    'tools',
                    'metrics',
                    'clear_button',
                ),
                label: 'Metrics',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select metric types',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    value_key: 'identifier',
                    label_key: 'label',
                    enable_filter: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:gross:metric_options',
                            entity_uid: {
                                type: 'observer',
                                event_type: self.vehicle_uid_event,
                                required: true,
                            },
                            include_calculated_metrics: {
                                type: 'static',
                                data: false,
                            },
                            entity_type: 'user_fund',
                        },
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
        ],
    };

    let modes = [
        {
            label: 'Attributes',
            state: 'characteristics',
        },
        {
            label: 'Cash Flows',
            state: 'cashflows',
        },
        {
            label: 'Deals',
            state: 'deals',
        },
        {
            label: 'Valuations',
            state: 'valuations',
        },
    ];

    if (auth.user_has_feature('metric_upload')) {
        modes.push({
            label: 'Metrics',
            state: 'metrics',
        });
    }
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
                buttons: modes,
                reset_event: self.reset_event,
            },
            {
                id: 'tools',
                component: DynamicWrapper,
                active_component: 'characteristics',
                template: 'tpl_dynamic_wrapper',
                set_active_event: self.navigation_event,
                components: [
                    cpanel_items.characteristics,
                    cpanel_items.cashflows,
                    cpanel_items.deals,
                    cpanel_items.valuations,
                    cpanel_items.metrics,
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
    self.deals_tools_menu = {
        id: 'deals_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            DataManagerHelper.buttons.delete_entities({
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'deals', 'table'),
                component: DeleteDealModal,
                vehicle_uid_event: self.vehicle_uid_event,
            }),
            DataManagerHelper.buttons.view_in_analytics(),
            {
                id: 'save_deals',
                label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                action: 'save_deals',
                disabled_label:
                    'Save <span style="padding-left:3px" class="glyphicon glyphicon-floppy-disk"></span>',
                id_callback: self.events.register_alias('save_deals'),
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
        data_table_id: Utils.gen_id(self.get_id(), 'body', 'deals', 'table'),
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

    self.valuations_tools_menu = {
        id: 'valuations_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            {
                id: 'download_valuations_template',
                label:
                    'Download Spreadsheet <span style="padding-left:3px" class="glyphicon glyphicon-download-alt"></span> ',
                action: 'download_valuations_template',
                css: {
                    'pull-left': true,
                },
                id_callback: self.events.register_alias('download_valuations_template'),
            },
            {
                id: 'upload',
                label: 'Upload <span class="icon-upload"></span>',
                action: 'upload',
                css: {
                    'pull-left': true,
                },
            },
            DataManagerHelper.buttons.delete_entities({
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'valuations', 'table'),
                component: DeleteValuationModal,
                vehicle_uid_event: self.vehicle_uid_event,
            }),
            DataManagerHelper.buttons.view_in_analytics(),
        ],
        data_table_id: Utils.gen_id(self.get_id(), 'body', 'valuations', 'table'),
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

    self._delete_metric_sets = DataThing.backends.useractionhandler({
        url: 'delete_metric_sets',
    });

    self.metrics_tools_menu = {
        id: 'metrics_tools_menu',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            {
                id: 'download_metrics_spreadsheet',
                label:
                    'Download Spreadsheet <span style="padding-left:3px" class="glyphicon glyphicon-download-alt"></span> ',
                action: 'download_metrics_spreadsheet',
                css: {
                    'pull-left': true,
                },
                id_callback: self.events.register_alias('download_metrics_spreadsheet'),
            },
            {
                id: 'upload',
                label: 'Upload <span class="icon-upload"></span>',
                action: 'upload',
                css: {
                    'pull-left': true,
                },
            },
            {
                id: 'validate_data',
                label:
                    'Validate <span style="padding-left:3px" class="glyphicon glyphicon-ok"></span>',
                action: 'validate',
                css: {
                    'pull-right': true,
                },
                trigger_modal: {
                    component: AnalyzeMetricsModal,
                    entity_type: 'user_fund',
                    entity_uid: self.vehicle_uid,
                },
            },
            {
                id: 'set_currency',
                label:
                    'Set Currency <span style="padding-left:3px" class="glyphicon glyphicon-edit"></span>',
                action: 'set_currency',
                css: {
                    'pull-right': true,
                },
                disabled_callback: function(data) {
                    if (Object.isArray(data)) {
                        return data.length < 1;
                    }
                    return true;
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    event_type: Utils.gen_event(
                        'DataTable.selected',
                        Utils.gen_id(self.get_id(), 'body', 'metrics', 'table'),
                    ),
                },
                trigger_modal: {
                    component: DropdownModal,
                    title: 'Set Currency',
                    enable_filter: false,
                    description: `
                            <div class="row">
                                Set currency for the selected metric and deal.
                            </div>
                            <hr>
                        `,
                    dropdown_datasource: {
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'id',
                            label_keys: ['symbol', 'name'],
                            additional_keys: ['symbol', 'invalid'],
                        },
                        type: 'dynamic',
                        query: {
                            target: 'currency:markets',
                            deal_uid: {
                                type: 'observer',
                                event_type: self.vehicle_uid_event,
                                required: true,
                            },
                        },
                    },
                    confirm_callback: (selected, data) => {
                        let metric_sets = data.map(({uid}) => {
                            return {uid, base_currency_id: selected};
                        });

                        self._update_metric_sets({
                            data: {
                                metric_sets: metric_sets,
                            },
                            success: DataThing.api.XHRSuccess(() => {
                                DataThing.status_check();
                            }),
                        });
                    },
                },
            },
            DataManagerHelper.buttons.confirm({
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'metrics', 'table'),
                label: 'Delete Selected <span class="icon-trash-1"></span>',
                text: 'Are you sure you want to delete the selected metrics?',
                callback: metrics => {
                    self._delete_metric_sets({
                        data: {
                            metric_set_uids: metrics.map(m => m.uid),
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
            }),
        ],
        data_table_id: Utils.gen_id(self.get_id(), 'body', 'metrics', 'table'),
    };

    self.gen_breadcrumb_header = function(id, attach_to_data_table) {
        let datasource = {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        };

        let header = {
            component: BreadcrumbHeader,
            id: id,
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
                            datasource: datasource,
                        },
                    ],
                },
            ],
            datasource: datasource,
        };

        if (attach_to_data_table) {
            header.data_table_id = Utils.gen_id(self.get_id(), 'body', id, 'table');
        }

        return header;
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
                components: [
                    self.characteristics_tools_menu,
                    self.cashflows_tools_menu,
                    self.valuations_tools_menu,
                    self.deals_tools_menu,
                    self.metrics_tools_menu,
                ],
            },
            {
                component: DynamicWrapper,
                id: 'header',
                set_active_event: self.navigation_event,
                active_component: 'characteristics',
                components: [
                    self.gen_breadcrumb_header('characteristics'),
                    self.gen_breadcrumb_header('cashflows', true),
                    self.gen_breadcrumb_header('deals', true),
                    self.gen_breadcrumb_header('valuations', true),
                    self.gen_breadcrumb_header('metrics'),
                ],
            },
            {
                id: 'characteristics',
                component: FundCharacteristics,
                vehicle_uid_event: self.vehicle_uid_event,
                cashflow_type: 'gross',
                characteristics_event: self.events.get('custom_characteristics'),
            },
            {
                id: 'cashflows',
                component: VehicleCashflows,
                vehicle_uid_event: self.vehicle_uid_event,
                cashflow_type: 'gross',
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
                        deal_custom_attributes: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.cpanel.get_id(),
                                'tools',
                                'cashflows',
                                'custom_attributes',
                                'custom_attributes_filter',
                            ),
                        },
                    },
                },
            },
            {
                id: 'deals',
                component: VehicleDeals,
                vehicle_uid_event: self.vehicle_uid_event,
                tools_menu_id: Utils.gen_id(self.get_id(), 'body', 'toolbar', 'deals_tools_menu'),
                results_per_page_event: Utils.gen_event(
                    'PopoverButton.value',
                    self.cpanel.get_id(),
                    'tools',
                    'deals',
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
                                'deals',
                                'name',
                            ),
                        },
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'enum_attributes',
                            ),
                        },
                        sector: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'sector',
                            ),
                        },
                        deal_source: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'deal_source',
                            ),
                        },
                        deal_role: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'deal_role',
                            ),
                        },
                        deal_type: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'deal_type',
                            ),
                        },
                        seller_type: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'seller_type',
                            ),
                        },
                        deal_custom_attributes: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.cpanel.get_id(),
                                'tools',
                                'deals',
                                'custom_attributes',
                                'custom_attributes_filter',
                            ),
                        },
                    },
                },
            },
            {
                id: 'valuations',
                component: VehicleCompanyValuations,
                vehicle_uid_event: self.vehicle_uid_event,
                tools_menu_id: Utils.gen_id(
                    self.get_id(),
                    'body',
                    'toolbar',
                    'valuations_tools_menu',
                ),
                results_per_page_event: Utils.gen_event(
                    'PopoverButton.value',
                    self.cpanel.get_id(),
                    'tools',
                    'valuations',
                    'results_per_page',
                ),
                table_filter_conf: {
                    type: 'dynamic',
                    query: {
                        date: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'date',
                            ),
                        },
                        equity_value: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'equity_value',
                            ),
                        },
                        enterprise_value: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'enterprise_value',
                            ),
                        },
                        debt: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'debt',
                            ),
                        },
                        revenue: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'revenue',
                            ),
                        },
                        ebitda: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'ebitda',
                            ),
                        },
                        valuation_type: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'valuation_type',
                            ),
                        },
                        company_uid: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'company',
                            ),
                        },
                        deal_custom_attributes: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.cpanel.get_id(),
                                'tools',
                                'valuations',
                                'custom_attributes',
                                'custom_attributes_filter',
                            ),
                        },
                    },
                },
            },
            {
                id: 'metrics',
                component: VehicleMetrics,
                vehicle_uid_event: self.vehicle_uid_event,
                metric_versions_event: self.events.get('metric_versions'),
                metric_identifiers_event: self.events.get('metric_identifiers'),
                company_name_event: self.events.get('company_name'),
                tools_menu_id: Utils.gen_id(self.get_id(), 'body', 'toolbar', 'metrics_tools_menu'),
                // results_per_page_event: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'results_per_page'),
                // table_filter_conf: {
                //     type: 'dynamic',
                //     query: {
                //         date: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'date'),
                //         },
                //         equity_value: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'equity_value'),
                //         },
                //         enterprise_value: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'enterprise_value'),
                //         },
                //         debt: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'debt'),
                //         },
                //         revenue: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'revenue'),
                //         },
                //         ebitda: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'ebitda'),
                //         },
                //         valuation_type: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'valuation_type'),
                //         },
                //         deal_uid: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('PopoverButton.value', self.cpanel.get_id(), 'tools', 'valuations', 'deal'),
                //         },
                //         deal_custom_attributes: {
                //             type: 'observer',
                //             event_type: Utils.gen_event('AttributeFilters.state', self.cpanel.get_id(), 'tools', 'valuations', 'custom_attributes', 'custom_attributes_filter'),
                //         }
                //     }
                // }
            },
        ],
    });

    self.asides = [self.cpanel, self.body];

    self.when(self.cpanel, self.body).done(() => {
        _dfd.resolve();
    });

    return self;
}
