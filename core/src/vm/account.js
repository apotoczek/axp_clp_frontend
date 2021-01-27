import HTMLContent from 'src/libs/components/basic/HTMLContent';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import Activity from 'src/libs/components/account/Activity';
import Data from 'src/libs/components/account/Data';
import Users from 'src/libs/components/account/Users';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import AccountSettings from 'src/libs/components/account/AccountSettings';
import ReactWrapper from 'src/libs/components/ReactWrapper';
import ko from 'knockout';
import auth from 'auth';
import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Aside from 'src/libs/components/basic/Aside';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import CalculationMapping from 'src/libs/components/account/CalculationMapping';
import CalculationMappingEditor from 'src/libs/components/account/CalculationMappingEditor';

import Radiolist from 'src/libs/components/basic/Radiolist';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

import ExcelPluginInstructions from 'containers/account/ExcelPluginInstructions';

class AccountVM extends Context {
    constructor() {
        super({
            id: 'account_settings',
        });

        this.dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('filter_active', 'BooleanButton.value', 'filter_active');
        this.events.resolve_and_add('entity_type', 'PopoverButton.value', 'entity_type');
        this.events.resolve_and_add('action_type', 'PopoverButton.value', 'action_type');
        this.events.resolve_and_add('mode_toggle', 'RadioButtons.state');
        this.events.new('set_mode');
        this.events.new('set_menu_state');
        this.events.new('editor_payload_event');

        this.menu_state = ko.observable();
        Observer.register(this.events.get('mode_toggle'), this.menu_state);

        this.enable_enterprise_features = ko.pureComputed(() => {
            const user = auth.user();

            if (user) {
                return auth.user_has_feature('enterprise_account_admin');
            }

            return false;
        });

        this.enable_calculation_mappings = ko.pureComputed(() => {
            const user = auth.user();

            if (user) {
                return auth.user_has_feature('calculation_mapping');
            }

            return false;
        });

        const handlers = [
            [
                'settings',
                () => {
                    Observer.broadcast(this.events.get('set_mode'), 'settings');
                    Observer.broadcast(this.events.get('set_menu_state'), 'settings');
                },
            ],
        ];

        const modes = [
            {
                label: 'Account',
                state: 'settings',
            },
        ];

        const body_components = [
            {
                id: 'settings',
                component: AccountSettings,
            },
            {
                component: BreadcrumbHeader,
                id: 'header',
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
                                label: 'Account',
                            },
                            {
                                label: this.client_name,
                            },
                        ],
                    },
                ],
            },
        ];

        if (this.enable_calculation_mappings()) {
            handlers.push(
                [
                    'calculations',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'calculations');
                        Observer.broadcast(this.events.get('set_menu_state'), 'calculations');
                    },
                ],
                [
                    'calculation_suites',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'calculation_suites');
                        Observer.broadcast(this.events.get('set_menu_state'), 'calculation_suites');
                    },
                ],
                [
                    'calculations:editor',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'calculations:editor');
                        Observer.broadcast(
                            this.events.get('set_menu_state'),
                            'calculations:editor',
                        );
                    },
                ],
                [
                    'calculation_suites:editor',
                    () => {
                        Observer.broadcast(
                            this.events.get('set_mode'),
                            'calculation_suites:editor',
                        );
                        Observer.broadcast(
                            this.events.get('set_menu_state'),
                            'calculation_suites:editor',
                        );
                    },
                ],
            );

            modes.push({
                label: 'Calculation Mappings',
                state: 'calculations',
            });

            body_components.push(
                {
                    id: 'calculations',
                    component: CalculationMapping,
                    set_menu_state: this.events.get('set_menu_state'),
                    mapping_payload_event: this.events.get('editor_payload_event'),
                },
                {
                    id: 'calculations:editor',
                    component: CalculationMappingEditor,
                    mapping_payload_event: this.events.get('editor_payload_event'),
                },
            );
        }

        this.client_name = ko.pureComputed(() => {
            const user = auth.user();

            if (user) {
                return user.client_name;
            }

            return '';
        });

        if (auth.user_has_feature('excel_plugin')) {
            handlers.push([
                'excel-plugin',
                () => {
                    Observer.broadcast(this.events.get('set_mode'), 'excel-plugin');
                    Observer.broadcast(this.events.get('set_menu_state'), 'excel-plugin');
                },
            ]);

            modes.push({
                label: 'Excel Plugin',
                state: 'excel-plugin',
            });

            body_components.push({
                id: 'excel-plugin',
                component: ReactWrapper,
                reactComponent: ExcelPluginInstructions,
            });
        }

        if (this.enable_enterprise_features()) {
            handlers.push(
                [
                    'users',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'users');
                        Observer.broadcast(this.events.get('set_menu_state'), 'users');
                    },
                ],
                [
                    'data',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'data');
                        Observer.broadcast(this.events.get('set_menu_state'), 'data');
                    },
                ],
                [
                    'activity',
                    () => {
                        Observer.broadcast(this.events.get('set_mode'), 'activity');
                        Observer.broadcast(this.events.get('set_menu_state'), 'activity');
                    },
                ],
            );

            const enterprise_modes = [
                {
                    label: 'Users',
                    state: 'users',
                },
                {
                    label: 'Data',
                    state: 'data',
                },
                {
                    label: 'Activity',
                    state: 'activity',
                },
            ];

            const enterprise_components = [
                {
                    id: 'users',
                    component: Users,
                    template: 'tpl_account_content',
                    filter_active_event: this.events.get('filter_active'),
                },
                {
                    id: 'data',
                    component: Data,
                    template: 'tpl_account_content',
                    entity_type_event: this.events.get('entity_type'),
                },
                {
                    id: 'activity',
                    component: Activity,
                    template: 'tpl_account_content',
                    action_type_event: this.events.get('action_type'),
                },
            ];

            modes.push(...enterprise_modes);
            body_components.push(...enterprise_components);
        }

        /********************
         *       Content
         ********************/
        this.body = this.new_instance(DynamicWrapper, {
            id: 'body',
            template: 'tpl_analytics_body',
            active_component: 'settings',
            layout: {
                header: 'header',
            },
            set_active_event: this.events.get('set_mode'),
            components: body_components,
        });

        /********************
         *       Navigation
         ********************/
        this.cpanel = this.new_instance(Aside, {
            title: 'Account Settings',
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: ['filters'],
            },
            components: [
                {
                    id: 'mode_toggle',
                    component: NestedRadioButtons,
                    id_callback: this.events.register_alias('mode_toggle'),
                    set_state_event: this.events.get('set_menu_state'),
                    default_state: 'settings',
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    allow_top_level_navigation: true,
                    menues: modes,
                },
                {
                    id: 'filters',
                    component: DynamicWrapper,
                    active_component: 'account',
                    set_active_event: this.events.get('set_mode'),
                    components: [
                        {
                            id: 'account',
                            template: 'tpl_cpanel_body_items',
                            layout: {
                                body: [],
                            },
                            components: [],
                        },
                        {
                            id: 'team',
                            template: 'tpl_cpanel_body_items',
                            layout: {
                                body: [],
                            },
                            components: [],
                        },
                        {
                            id: 'users',
                            template: 'tpl_cpanel_body_items',
                            layout: {
                                body: ['filters_label', 'filter_active'],
                            },
                            components: [
                                {
                                    id: 'filter_active',
                                    id_callback: this.events.register_alias('filter_active'),
                                    label: 'Show only active',
                                    component: BooleanButton,
                                    template: 'tpl_cpanel_boolean_button',
                                    btn_css: {'cpanel-btn-sm': true},
                                    default_state: false,
                                    enable_localstorage: true,
                                },
                                {
                                    id: 'filters_label',
                                    component: HTMLContent,
                                    html: '<h3>Filters</h3>',
                                },
                            ],
                        },
                        {
                            id: 'data',
                            template: 'tpl_cpanel_body_items',
                            layout: {
                                body: ['filters_label', 'entity_type'],
                            },
                            components: [
                                {
                                    id: 'entity_type',
                                    id_callback: this.events.register_alias('entity_type'),
                                    component: NewPopoverButton,
                                    css: {
                                        'btn-block': true,
                                        'btn-cpanel-primary': true,
                                        'btn-sm': true,
                                    },
                                    popover_options: {
                                        placement: 'right',
                                        title: 'Entity Type',
                                        css_class: 'popover-cpanel',
                                    },
                                    icon_css: 'glyphicon glyphicon-plus',
                                    label: 'Type',
                                    popover_config: {
                                        component: Radiolist,
                                        data: [
                                            {
                                                label: 'Funds',
                                                value: 'fund',
                                            },
                                            {
                                                label: 'Portfolios',
                                                value: 'portfolio',
                                            },
                                            {
                                                label: 'Indexes',
                                                value: 'market',
                                            },
                                        ],
                                    },
                                },
                                {
                                    id: 'filters_label',
                                    component: HTMLContent,
                                    html: '<h3>Filters</h3>',
                                },
                            ],
                        },
                        {
                            id: 'activity',
                            template: 'tpl_cpanel_body_items',
                            layout: {
                                body: ['action_type'],
                            },
                            components: [
                                {
                                    id: 'action_type',
                                    id_callback: this.events.register_alias('action_type'),
                                    component: NewPopoverButton,
                                    css: {
                                        'btn-block': true,
                                        'btn-cpanel-primary': true,
                                        'btn-sm': true,
                                    },
                                    popover_options: {
                                        placement: 'right',
                                        title: 'Action Type',
                                        css_class: 'popover-cpanel',
                                    },
                                    icon_css: 'glyphicon glyphicon-plus',
                                    label: 'Action Types',
                                    popover_config: {
                                        component: Checklist,
                                        data: [
                                            {
                                                value: 'update_entity',
                                                label: 'Update Entity',
                                            },
                                            {
                                                value: 'delete_entity',
                                                label: 'Delete Entity',
                                            },
                                            {
                                                value: 'create_entity',
                                                label: 'Create Entity',
                                            },
                                            {
                                                value: 'upload_cashflow',
                                                label: 'Upload Cashflow',
                                            },
                                            {
                                                value: 'upload_index',
                                                label: 'Upload Index',
                                            },
                                            {
                                                value: 'view_analytics_entity',
                                                label: 'Viewed Analytics Entity',
                                            },
                                            {
                                                value: 'create_visual_report',
                                                label: 'Created Visual Report',
                                            },
                                            {
                                                value: 'generate_data_report',
                                                label: 'Generated Data Report',
                                            },
                                            {
                                                value: 'download_data_report',
                                                label: 'Downloaded Data Report',
                                            },
                                            {
                                                value: 'view_market_data_lists',
                                                label: 'Browsed Lists',
                                            },
                                            {
                                                value: 'view_market_data_firms',
                                                label: 'Browsed Firms',
                                            },
                                            {
                                                value: 'view_market_data_historic_funds',
                                                label: 'Browsed Historic Funds',
                                            },
                                            {
                                                value: 'view_market_data_benchmark',
                                                label: 'Browsed Benchmarks',
                                            },
                                            {
                                                value: 'view_market_data_funds_in_market',
                                                label: 'Browsed Funds in Market',
                                            },
                                            {
                                                value: 'view_market_data_investors',
                                                label: 'Browsed Investors',
                                            },
                                            {
                                                value: 'view_market_data_investments',
                                                label: 'Browsed Investments',
                                            },
                                            {
                                                value: 'view_diligence_families',
                                                label: 'Diligence - Browsed Families',
                                            },
                                            {
                                                value: 'view_diligence_projects',
                                                label: 'Diligence - Browsed Projects',
                                            },
                                            {
                                                value: 'edit_visual_report',
                                                label: 'Edited Visual Report',
                                            },
                                            {
                                                value: 'view_visual_report',
                                                label: 'Viewed Visual Report',
                                            },
                                            {
                                                value: 'view_visual_reports',
                                                label: 'Browsed Visual Reports',
                                            },
                                            {
                                                value: 'view_lp_scoring',
                                                label: 'Browsed LP Scoring',
                                            },
                                            {
                                                value: 'publish_visual_report',
                                                label: 'Publish Visual Report',
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        /********************
         *       Views
         ********************/
        this.asides = [this.cpanel, this.body];

        this.handle_url = url => {
            // Shift out 'data-manager'
            url.shift();

            Utils.match_array(url, ...handlers);
        };

        this.when(this.cpanel, this.body, this.events).done(() => {
            Observer.register(this.events.get('mode_toggle'), mode => {
                window.location.hash = `#!/account/${mode}`;
            });

            Observer.register_hash_listener('account', url => {
                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }
}

export default AccountVM;
