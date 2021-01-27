/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BenchmarkMarketAnalysis from 'src/libs/components/benchmark/BenchmarkMarketAnalysis';
import Checklist from 'src/libs/components/basic/Checklist';
import Label from 'src/libs/components/basic/Label';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Context from 'src/libs/Context';
import Aside from 'src/libs/components/basic/Aside';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

export default function() {
    let self = new Context({
        id: 'market_analysis',
    });

    self.dfd = self.new_deferred();

    self.cpanel_id = Utils.gen_id(self.get_id(), 'page_wrapper', 'cpanel', 'tools');

    self.clear_filters_event = Utils.gen_event('EventButton', self.get_id(), 'clear_button');

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

                if (options && options.length > 0) {
                    return true;
                }

                return false;
            },
            popover_config: {
                component: Radiolist,
                data: [
                    {
                        value: 'Hamilton Lane',
                        label: 'Hamilton Lane',
                    },
                ],
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
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
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

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Benchmark',
        title_css: 'data-manager',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: ['tools'],
        },
        components: [
            {
                id: 'tools',
                template: 'tpl_cpanel_body_items',
                layout: {
                    body: [
                        'chart_provider',
                        'render_currency',
                        'filters_label',
                        'enum_attributes',
                        'vintage_year',
                        'fund_size',
                        'clear_button',
                    ],
                },
                components: [
                    {
                        id: 'filters_label',
                        component: Label,
                        template: 'tpl_cpanel_label',
                        label: 'Filters',
                    },
                    {
                        id: 'vintage_year',
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        clear_event: self.clear_filters_event,
                        label: 'Vintage Year',
                        popover_options: {
                            title: 'Filter by Vintage Year',
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            component: Checklist,
                            enable_exclude: true,
                            datasource: {
                                type: 'static',
                                data: Utils.valid_vintage_years(),
                                mapping: 'list_to_options',
                            },
                        },
                    },
                ],
            },
        ],
    };

    self.page_wrapper = self.new_instance(
        Aside,
        {
            id: 'page_wrapper',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'market-analysis'],
            },
            components: [
                self.cpanel,
                {
                    component: BenchmarkMarketAnalysis,
                    cpanel_id: self.cpanel_id,
                    top_level_id: self.get_id(),
                    id: 'market-analysis',
                },
            ],
        },
        self.shared_components,
    );

    self.when(self.shared_components, self.page_wrapper).done(() => {
        Observer.register(self.chart_provider_event, payload => {
            if (payload) {
                Observer.broadcast(self.clear_filters_event);
            }
        });

        self.dfd.resolve();
    });

    return self;
}
