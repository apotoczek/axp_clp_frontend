/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import AlphabetResultList from 'src/libs/components/reports/live/AlphabetResultList';
import EventButton from 'src/libs/components/basic/EventButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import Label from 'src/libs/components/basic/Label';
import Radiolist from 'src/libs/components/basic/Radiolist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import TextInput from 'src/libs/components/basic/TextInput';
import PopoverTable from 'src/libs/components/reports/live/PopoverTable';
import ko from 'knockout';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = 'tpl_body_no_layout';

    self.events = self.new_instance(EventRegistry, {});
    self.events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
    self.events.resolve_and_add(
        'advanced_search_field',
        'TextInput.value',
        'advanced_search_string',
    );
    self.events.new('search_mode_toggle');
    self.events.resolve_and_add(
        'advanced_results_table',
        'AlphabetResultList.count',
        'advanced_results_count',
    );
    self.events.resolve_and_add(
        'advanced_results_table',
        'AlphabetResultList.click_row',
        'advanced_results_click_row',
    );
    self.events.resolve_and_add('clear_filters', 'EventButton');
    self.events.resolve_and_add('simple_table', 'PopoverTable.count', 'total_funds');
    self.events.resolve_and_add('entity_type', 'PopoverButton.value');

    self.fund_count = Observer.observable(self.events.get('total_funds'));

    let show_bison_funds = auth.user_has_feature('bison_internal');

    self.simple_table = {
        component: PopoverTable,
        id: 'simple_table',
        id_callback: self.events.register_alias('simple_table'),
        css: {'narrow-table': true},
        datasource: {
            type: 'dynamic',
            title: 'Your Funds',
            //key:'results',
            query: {
                target: 'vehicles',
                results_per_page: 15,
                filters: {
                    type: 'dynamic',
                    query: {
                        exclude_portfolio_only: true,
                        exclude_package_content: true,
                        entity_type: ['user_fund'],
                        cashflow_type: ['net'],
                    },
                },
            },
        },
    };

    self.advanced_search_field = {
        id: 'advanced_search_field',
        id_callback: self.events.register_alias('advanced_search_field'),
        component: TextInput,
        template: 'tpl_text_input',
        search_icon: true,
        placeholder: 'Search your funds',
        clear_event: self.events.get('clear_filters'),
        css: {'big-dark-search-bar': true},
    };

    self.advanced_results_meta = {
        id: 'advanced_results_meta',
        component: HTMLContent,
        template: 'tpl_live_reports_fund_advanced_meta_count',
        css: {'text-center': true},
        datasource: {
            type: 'observer',
            event_type: self.events.get('advanced_results_count'),
        },
    };

    let entity_type_filter = {
        id: 'entity_type',
        id_callback: self.events.register_alias('entity_type'),
        label: 'Include Bison Funds',
        component: NewPopoverButton,
        clear_event: self.events.get('clear_filters'),
        css: {
            'cpanel-btn-sm': true,
            'btn-block': true,
            'btn-cpanel-primary': true,
            'cpanel-dark-page': true,
        },
        icon_css: 'glyphicon glyphicon-plus',
        popover_options: {
            title: 'Entity Type',
            placement: 'right',
            css_class: 'popover-cpanel',
        },
        popover_config: {
            component: Radiolist,
            value_key: 'value',
            label_key: 'label',
            options: [
                {
                    label: 'No',
                    value: 'no',
                    entity_type: ['user_fund'],
                },
                {
                    label: 'Yes',
                    value: 'yes',
                    entity_type: ['user_fund', 'bison_fund'],
                },
            ],
        },
    };

    let advanced_cpanel_components = [
        {
            id: 'label',
            component: Label,
            css: {'padded-cpanel-label': true, 'first-header': true},
            template: 'tpl_cpanel_label',
            label: 'Filters',
        },
        {
            id: 'enum_attributes',
            id_callback: self.events.register_alias('enum_attributes'),
            component: AttributeFilters,
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
                'cpanel-dark-page': true,
            },
            clear_event: self.events.get('clear_filters'),
            set_state_event_type: 'StateHandler.load',
            enable_localstorage: false,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    exclude_enums: ['vertical', 'status'],
                },
            },
        },
        {
            id: 'clear_button',
            id_callback: self.events.register_alias('clear_filters'),
            component: EventButton,
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-cpanel-ghost': true},
            label: 'Clear All',
        },
    ];

    let advanced_cpanel_body = ['label', 'enum_attributes', 'clear_button'];

    if (show_bison_funds) {
        advanced_cpanel_components.push(entity_type_filter);
        advanced_cpanel_body.splice(2, 0, 'entity_type');
    }

    self.advanced_cpanel = {
        id: 'advanced_cpanel',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: advanced_cpanel_body,
        },
        components: advanced_cpanel_components,
    };

    self.advanced_results_table = {
        component: AlphabetResultList,
        id: 'advanced_results_table',
        id_callback: self.events.register_alias('advanced_results_table'),
        datasource: {
            type: 'dynamic',
            title: 'Your Funds',
            query: {
                target: 'vehicles',
                filters: {
                    type: 'dynamic',
                    query: {
                        exclude_portfolio_only: true,
                        exclude_package_content: true,
                        cashflow_type: ['net'],

                        name: {
                            type: 'observer',
                            event_type: self.events.get('advanced_search_string'),
                            required: false,
                        },
                        enums: {
                            type: 'observer',
                            event_type: self.events.get('enum_attributes'),
                        },
                        entity_type: {
                            type: 'observer',
                            event_type: self.events.get('entity_type'),
                            mapping: 'get',
                            mapping_args: {
                                key: 'entity_type',
                            },
                            default: ['user_fund'],
                        },
                    },
                },
                results_per_page: 'all',
                order_by: [
                    {
                        name: 'name',
                        sort: 'asc',
                    },
                ],
            },
        },
    };

    self.advanced_funds = {
        component: Aside,
        id: 'advanced_funds',
        template: 'tpl_dark_magic_advanced_select_comp',
        layout: {
            top: ['advanced_search_field', 'advanced_results_meta'],
            left: 'advanced_cpanel',
            right: 'advanced_results_table',
        },
        components: [
            self.advanced_search_field,
            self.advanced_results_meta,
            self.advanced_cpanel,
            self.advanced_results_table,
        ],
    };

    // END ADVANCED FUNDS VIEW CODE

    self.table_wrapper = {
        id: 'table_wrapper',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        //active_component: 'simple_table',
        set_active_event: self.events.get('search_mode_toggle'),
        components: [self.simple_table, self.advanced_funds],
    };

    self.heading = {
        component: HTMLContent,
        id: 'heading',
        html: '<h1>Select your fund</h1>',
        css: {'text-center': true},
    };
    self.subtitle = {
        component: HTMLContent,
        id: 'subtitle',
        html: '<p class="lead">This is the fund we\'ll be modeling</p>',
        css: {'text-center': true},
    };
    self.no_funds = {
        id: 'no_funds',
        component: HTMLContent,
        visible: ko.computed(() => {
            return !self.fund_count();
        }),
        html: `<div class="text-center" style="margin-top:40px;">
            <h2>It looks like you haven't added any funds</h2>
            <p class="lead">Our customer success team will help you <br/>manage and safely store your investment data.</p>

            <h5>Contact us to get started:</h5>
            <h5>+1.617.982.6096</h5>
            <h5>support@cobaltlp.com</h5>
            </div>
            `,
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['heading', 'subtitle', 'table_wrapper', 'no_funds'],
        },
        components: [
            self.heading,
            self.subtitle,
            //self.toggle_wrapper,
            self.table_wrapper,
            self.no_funds,
        ],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();
        Observer.register(self.events.get('total_funds'), count => {
            Observer.broadcast(
                self.events.get('search_mode_toggle'),
                count <= 15 ? 'simple_table' : 'advanced_funds',
            );
        });

        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'body', 'table_wrapper', 'simple_table'),
            'PopoverTable.select',
            row => {
                row.from_dashboard = opts.from_dashboard;
                Observer.broadcast(opts.select_fund_event, row);
            },
        );

        Observer.register(self.events.get('advanced_results_click_row'), row => {
            row.from_dashboard = opts.from_dashboard;
            Observer.broadcast(opts.select_fund_event, row);
        });
    });
    return self;
}
