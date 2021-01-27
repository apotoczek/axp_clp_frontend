/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DealBenchmarkBrowse from 'src/libs/components/benchmark/DealBenchmarkBrowse';
import BenchmarkDetails from 'src/libs/components/benchmark/BenchmarkDetails';
import BenchmarkBrowse from 'src/libs/components/benchmark/BenchmarkBrowse';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import Label from 'src/libs/components/basic/Label';
import Radiolist from 'src/libs/components/basic/Radiolist';
import ko from 'knockout';
import pager from 'pager';
import auth from 'auth';
import Context from 'src/libs/Context';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import PopoverChecklist from 'src/libs/components/popovers/PopoverChecklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function() {
    let self = new Context({
        id: 'benchmark',
    });

    self.dfd = self.new_deferred();

    self.provider = ko.observable();

    self.hash_event = Utils.gen_event('HashListener', self.get_id());
    self.cpanel_id = Utils.gen_id(self.get_id(), 'page_wrapper', 'cpanel', 'tools');
    self.state_event = Utils.gen_event(
        'RadioButtons.state',
        self.get_id(),
        'page_wrapper',
        'cpanel',
        'navigation',
    );

    self.clear_metric_event = Utils.gen_event('MetricPopover.clear', self.get_id());

    self.set_fund_vintage_year_event = Utils.gen_event('VintageYear', self.get_id());

    self.clear_filters_event = Utils.gen_event('EventButton', self.get_id(), 'clear_button');

    self.state_specific_events = {
        browse: {
            visible_event: Utils.gen_event('BenchmarkBrowse.hl_data', self.get_id()),
        },
        details: {
            visible_event: Utils.gen_event('BenchmarkDetails.hl_data', self.get_id()),
            set_provider_specific_chart_event: Utils.gen_event(
                'BenchmarkDetails.provider_specific_chart',
                self.get_id(),
            ),
        },
    };

    self.views = [
        {
            label: 'Fund Level Benchmark',
            state: 'fund_level_benchmark',
            menu: [
                {
                    label: 'Browse',
                    state: 'fund_level_benchmark:browse',
                },
                {
                    label: 'Details',
                    state: 'fund_level_benchmark:details',
                },
            ],
        },
    ];

    self.chart_provider_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'chart_provider',
    );

    self.shared_components = {
        chart_provider: self.new_instance(NewPopoverButton, {
            id: 'chart_provider',
            label: 'Data Provider',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Provider',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                let options = popover.data();

                if (options && options.length > 1) {
                    return true;
                }

                return false;
            },
            popover_config: {
                component: Radiolist,
                datasource: {
                    type: 'dynamic',
                    mapping: 'list_to_options',
                    query: {
                        target: 'benchmark:providers',
                    },
                },
            },
        }),
        benchmark: self.new_instance(NewPopoverButton, {
            id: 'benchmark',
            label: 'Benchmark',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Benchmark',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            clear_event: self.chart_provider_event,
            popover_config: {
                component: Radiolist,
                datasource: {
                    type: 'dynamic',
                    query: {
                        provider: {
                            type: 'observer',
                            mapping: 'get_value',
                            event_type: self.chart_provider_event,
                        },
                        target: 'benchmarks',
                    },
                },
            },
        }),
        render_currency: self.new_instance(NewPopoverButton, {
            id: 'render_currency',
            label: 'Currency',
            label_track_selection: true,

            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Currency',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function() {
                return self.provider() === 'Hamilton Lane';
            },
            clear_event: self.chart_provider_event,
            popover_config: {
                component: Radiolist,
                datasource: {
                    mapping: 'to_options',
                    mapping_args: {
                        value_key: 'id',
                        label_keys: ['symbol', 'name'],
                        additional_keys: ['symbol'],
                    },
                    type: 'dynamic',
                    query: {
                        target: 'currency:markets',
                    },
                },
            },
        }),
        deal_enum_attributes: self.new_instance(AttributeFilters, {
            id: 'deal_enum_attributes',
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
            clear_event: self.clear_filters_event,
            set_state_event_type: 'Benchmark.set_states',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    include_enums: ['geography', 'sector', 'style', 'hl_company_status', 'gics'],
                },
            },
        }),
        enum_attributes: self.new_instance(AttributeFilters, {
            id: 'enum_attributes',
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
            clear_event: self.clear_filters_event,
            set_state_event_type: 'Benchmark.set_states',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    include_enums: ['geography', 'style'],
                },
            },
        }),
        fund_size: self.new_instance(NewPopoverButton, {
            id: 'fund_size',
            label: 'Fund Size',
            clear_event: self.clear_filters_event,
            icon_css: 'glyphicon glyphicon-plus',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Fund Size',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            popover_config: {
                component: PopoverRange,
                template: 'tpl_popover_range',
                prefix: 'USD',
                suffix: 'MM',
            },
        }),
        clear_button: self.new_instance(EventButton, {
            id: 'clear_button',
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear Filters',
        }),
    };

    self.browse_cpanel = {
        id: 'fund_level_benchmark:browse',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'settings_label',
                'chart_provider',
                'benchmark',
                'render_currency',
                'metric',
                'filters_label',
                'enum_attributes',
                'fund_size',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'settings_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Benchmark Settings',
            },
            {
                id: 'metric',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Metrics',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                component: NewPopoverButton,
                label: 'Metric',
                label_track_selection: true,
                hide_icon: true,
                clear_event: self.clear_metric_event,
                popover_config: {
                    component: Radiolist,
                    data: ko.computed(() => {
                        let data = [
                            {
                                label: 'IRR',
                                value: 'irr',
                            },
                            {
                                label: 'DPI',
                                value: 'dpi',
                            },
                            {
                                label: 'TVPI',
                                value: 'tvpi',
                            },
                        ];

                        if (self.provider() == 'Hamilton Lane') {
                            data.push({
                                label: 'RVPI',
                                value: 'rvpi',
                            });
                        } else {
                            data.push({
                                label: 'Momentum',
                                value: 'momentum',
                            });
                        }

                        return data;
                    }),
                },
            },
            {
                id: 'filters_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
        ],
    };

    self.details_cpanel = {
        id: 'fund_level_benchmark:details',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'settings_label',
                'chart_provider',
                'benchmark',
                'render_currency',
                'vintage_year',
                'filters_label',
                'enum_attributes',
                'fund_size',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'vintage_year',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Vintage Year',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                label: 'Vintage Year',
                label_track_selection: true,
                hide_icon: true,
                popover_config: {
                    component: PopoverChecklist,
                    template: 'tpl_popover_checklist',
                    disable_untoggle: true,
                    single_selection: true,
                    selected_idx: 0,
                    clear_event: self.clear_metric_event,
                    set_state_on_label_event: self.set_fund_vintage_year_event,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_label_and_index',
                        mapping_args: {
                            key: 'labels',
                            reverse_list: true,
                        },
                        query: {
                            benchmark_edition_uid: {
                                type: 'observer',
                                mapping: 'get',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    self.get_id(),
                                    'benchmark',
                                ),
                                required: true,
                            },
                            currency_id: {
                                type: 'observer',
                                event_type: Utils.gen_event(
                                    'PopoverButton.value',
                                    self.get_id(),
                                    'render_currency',
                                ),
                                mapping: 'get_value',
                                required: true,
                            },
                            target: 'market_data:benchmark',
                            filters: {
                                type: 'dynamic',
                                query: {
                                    enums: {
                                        type: 'observer',
                                        event_type: Utils.gen_event(
                                            'AttributeFilters.state',
                                            self.get_id(),
                                            'enum_attributes',
                                        ),
                                    },
                                    fund_size: {
                                        type: 'observer',
                                        event_type: Utils.gen_event(
                                            'PopoverButton.value',
                                            self.get_id(),
                                            'fund_size',
                                        ),
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                id: 'settings_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Benchmark Settings',
            },
            {
                id: 'filters_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
        ],
    };

    self.cpanel_components = [self.browse_cpanel, self.details_cpanel];

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Benchmark',
        title_css: 'data-manager',
        template: 'tpl_analytics_cpanel',
        layout: {
            header: 'navigation',
            body: ['tools'],
        },
        components: [
            {
                id: 'navigation',
                component: NestedRadioButtons,
                default_state: 'fund_level_benchmark:browse',
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
                menues: self.views,
            },
            {
                id: 'tools',
                component: DynamicWrapper,
                active_component: 'fund_level_benchmark:browse',
                template: 'tpl_dynamic_wrapper',
                set_active_event: self.state_event,
                components: self.cpanel_components,
            },
        ],
    };

    self.body_components = [
        {
            component: BenchmarkBrowse,
            cpanel_id: self.cpanel_id,
            top_level_id: self.get_id(),
            chart_click_callback: function(vintage_year) {
                Observer.broadcast(self.set_fund_vintage_year_event, vintage_year);
                Observer.broadcast(self.state_event, 'fund_level_benchmark:details');
            },
            id: 'fund_level_benchmark:browse',
        },
        {
            component: BenchmarkDetails,
            cpanel_id: self.cpanel_id,
            top_level_id: self.get_id(),
            visible_event: self.state_specific_events.details.visible_event,
            set_provider_specific_chart_event:
                self.state_specific_events.details.set_provider_specific_chart_event,
            id: 'fund_level_benchmark:details',
        },
    ];

    self.body_content = {
        id: 'content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['content_wrapper'],
        },
        components: [
            {
                component: DynamicWrapper,
                id: 'content_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'browse',
                set_active_event: self.hash_event,
                components: self.body_components,
            },
        ],
    };

    if (auth.user_has_feature('hl_deal_benchmark_access')) {
        self.views.push({
            label: 'Deal Level Benchmark',
            state: 'deal_level_benchmark',
            require_feature: 'hl_deal_benchmark_access',
            menu: [
                {
                    label: 'Browse',
                    state: 'deal_level_benchmark:browse',
                },
            ],
        });

        self.mo_chart_provider = self.new_instance(NewPopoverButton, {
            id: 'mo_chart_provider',
            label: 'Data Provider',
            label_track_selection: true,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Select Provider',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                let options = popover.data();

                if (options && options.length > 0) {
                    return true;
                }

                return false;
            },
            popover_config: {
                component: Radiolist,
                datasource: {
                    type: 'dynamic',
                    mapping: 'list_to_options',
                    query: {
                        target: 'benchmark:deal_providers',
                    },
                },
            },
        });

        self.deal_browse_cpanel = {
            id: 'deal_level_benchmark:browse',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'settings_label',
                    'mo_chart_provider',
                    'deal_benchmark',
                    'breakdown_label',
                    'metric',
                    'filters_label',
                    'deal_enum_attributes',
                    'acq_valuation_multiple',
                    'acq_net_debt_ebitda',
                    'acq_ebitda',
                    'acq_ebitda_margin',
                    'acq_enterprise_value',
                    'acq_revenue',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'settings_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Benchmark Settings',
                },
                self.mo_chart_provider,
                {
                    id: 'deal_benchmark',
                    component: NewPopoverButton,
                    label: 'Deal Benchmark',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Benchmark',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    clear_event: self.chart_provider_event,
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                provider: 'hamilton_lane',
                                target: 'deal_benchmarks',
                            },
                        },
                    },
                },
                {
                    id: 'breakdown_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Breakdown Settings',
                },
                {
                    id: 'metric',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Metrics',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    component: NewPopoverButton,
                    label: 'Metric',
                    label_track_selection: true,
                    hide_icon: true,
                    clear_event: self.clear_metric_event,
                    popover_config: {
                        component: Radiolist,
                        data: [
                            {
                                value: 'total_mom',
                                label: 'Gross MOIC',
                            },
                            {
                                value: 'gross_irr',
                                label: 'Gross IRR',
                            },
                            {
                                value: 'acq_valuation_multiple',
                                label: 'Acquisition EV / EBITDA', //before: 'Acq EV / EBITDA multiple'
                            },
                            {
                                value: 'acq_rev_multiple',
                                label: 'Acquisition EV / Revenue',
                            },
                            {
                                value: 'acq_net_debt_ebitda',
                                label: 'Acquisition Net Debt / EBITDA', //before: 'Acq Net Debt / EBITDA multiple'
                            },
                            {
                                value: 'acq_ebitda_margin',
                                label: 'Acquisition EBITDA Margin',
                            },
                            {
                                value: 'exit_valuation_multiple',
                                label: 'Current/Exit EV / EBITDA',
                            },
                            {
                                value: 'exit_revenue_multiple',
                                label: 'Current/Exit EV / Revenue',
                            },
                            {
                                value: 'exit_net_debt_ebitda',
                                label: 'Current/Exit Net Debt / EBITDA',
                            },
                            {
                                value: 'exit_ebitda_margin',
                                label: 'Current/Exit EBITDA Margin',
                            },
                        ],
                    },
                },
                {
                    id: 'filters_label',
                    component: Label,
                    template: 'tpl_cpanel_label',
                    label: 'Filters',
                },
                {
                    id: 'acq_valuation_multiple',
                    component: NewPopoverButton,
                    label: 'Acq. EV / EBITDA',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Acq. EV / EBITDA',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: 'x',
                    },
                },
                {
                    id: 'acq_net_debt_ebitda',
                    component: NewPopoverButton,
                    label: 'Acq. Net Debt / EBITDA',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Acq. Net Debt / EBITDA',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: 'x',
                    },
                },
                {
                    id: 'acq_ebitda',
                    component: NewPopoverButton,
                    label: 'Acq. EBITDA',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Acq. EBITDA',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
                {
                    id: 'acq_ebitda_margin',
                    component: NewPopoverButton,
                    label: 'Acq. EBITDA Margin',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Acq. EBITDA Margin',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        suffix: '%',
                    },
                },
                {
                    id: 'acq_enterprise_value',
                    component: NewPopoverButton,
                    label: 'Acq. Enterprise Value',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Acq. Enterprise Value',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
                {
                    id: 'acq_revenue',
                    component: NewPopoverButton,
                    label: 'Acq. Revenue',
                    clear_event: self.clear_filters_event,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    popover_options: {
                        title: 'Acq. Revenue',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: PopoverRange,
                        template: 'tpl_popover_range',
                        prefix: 'USD',
                        suffix: 'MM',
                    },
                },
            ],
        };

        self.body_components.push({
            component: DealBenchmarkBrowse,
            cpanel_id: self.cpanel_id,
            top_level_id: self.get_id(),
            id: 'deal_level_benchmark:browse',
        });

        self.cpanel_components.push(self.deal_browse_cpanel);
    }

    self.page_wrapper = self.new_instance(
        Aside,
        {
            id: 'page_wrapper',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'content'],
            },
            components: [self.cpanel, self.body_content],
        },
        self.shared_components,
    );

    self.handle_url = function(url) {
        if (url.length === 2 && url[1].includes(':')) {
            if (url[1] === 'fund_level_benchmark:browse') {
                Observer.broadcast_for_id('UserAction', 'record_action', {
                    action_type: 'view_market_data_benchmark',
                });
            }
            Observer.broadcast(self.hash_event, url[1]);
            Observer.broadcast_for_id(
                Utils.gen_id(self.get_id(), 'page_wrapper', 'cpanel', 'navigation'),
                'RadioButtons.set_state',
                url[1],
            );
            return true;
        }

        return false;
    };

    self.when(self.shared_components, self.page_wrapper).done(() => {
        Observer.register_hash_listener('benchmark', url => {
            let match = self.handle_url(url);

            if (!match) {
                pager.navigate('#!/benchmark/fund_level_benchmark:browse');
            }
        });

        Observer.register(self.state_event, state => {
            pager.navigate(`#!/benchmark/${state}`);
        });

        Observer.register(self.chart_provider_event, payload => {
            if (payload) {
                Observer.broadcast(self.state_specific_events.browse.visible_event, payload.value);
                Observer.broadcast(self.state_specific_events.details.visible_event, payload.value);
                Observer.broadcast(self.clear_metric_event);
                self.provider(payload.value);
                if (payload.value == 'Hamilton Lane') {
                    Observer.broadcast(
                        self.state_specific_events.details.set_provider_specific_chart_event,
                        'rvpi_chart',
                    );
                } else {
                    Observer.broadcast(
                        self.state_specific_events.details.set_provider_specific_chart_event,
                        'momentum_chart',
                    );
                }
            }
        });

        self.dfd.resolve();
    });

    return self;
}
