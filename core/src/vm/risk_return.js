/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BenchmarkRiskReturn from 'src/libs/components/benchmark/BenchmarkRiskReturn';
import Label from 'src/libs/components/basic/Label';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Checklist from 'src/libs/components/basic/Checklist';
import ko from 'knockout';
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
        id: 'risk_return',
    });

    self.dfd = self.new_deferred();

    self.provider = ko.observable();

    self.cpanel_id = Utils.gen_id(self.get_id(), 'page_wrapper', 'cpanel', 'risk-return');

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
        clear_button: self.new_instance(EventButton, {
            id: 'clear_button',
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear Filters',
        }),
    };

    self.risk_return_cpanel = {
        id: 'risk-return',
        template: 'tpl_cpanel_body_items',
        layout: {
            body: [
                'settings_label',
                'chart_provider',
                'benchmark',
                'render_currency',
                'chart_settings_label',
                'breakdown',
                'risk_metric',
                'return_metric',
                'size_metric',
                'filters_label',
                'enum_attributes',
                'vintage_year',
                'fund_size',
                'clear_button',
            ],
        },
        components: [
            {
                id: 'fund_size',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: self.clear_filters_event,
                label: 'Fund Size',
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
                popover_options: {
                    title: 'Filter by Vintage Year',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                clear_event: self.clear_filters_event,
                label: 'Vintage Year',
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'static',
                        data: Utils.valid_vintage_years(0),
                        mapping: 'list_to_options',
                    },
                },
            },
            {
                id: 'breakdown',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Grouping',
                    css_class: 'popover-cpanel',
                },
                label: 'Grouping',
                hide_icon: true,
                label_track_selection: true,
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                label: 'Geography',
                                value: 'geography',
                            },
                            {
                                label: 'Style',
                                value: 'style',
                            },
                            {
                                label: 'Vintage Year',
                                value: 'vintage_year',
                            },
                            {
                                label: 'Geography / Style',
                                value: ['geography', 'style'],
                            },
                            {
                                label: 'Style / Focus',
                                value: 'style_focus',
                            },
                        ],
                    },
                },
            },
            {
                id: 'risk_metric',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Risk',
                    css_class: 'popover-cpanel',
                },
                label: 'Risk',
                hide_icon: true,
                label_track_selection: true,
                popover_config: {
                    component: Radiolist,
                    data: ko.computed(() => {
                        let data = [
                            {
                                value: 'loss_ratio',
                                label: 'Loss Ratio',
                                format: 'percent',
                            },
                            {
                                value: 'loss_ratio_money_weighted',
                                label: 'Loss Ratio (Weighted)',
                                format: 'percent',
                            },
                            {
                                value: 'irr:spread',
                                label: 'IRR Spread',
                                format: 'irr',
                            },
                            {
                                value: 'tvpi:spread',
                                label: 'TVPI Spread',
                                format: 'multiple',
                            },
                            {
                                value: 'dpi:spread',
                                label: 'DPI Spread',
                                format: 'multiple',
                            },
                        ];

                        if (self.provider() == 'Cobalt') {
                            data.push({
                                label: 'Momentum Spread',
                                format: 'percent',
                                value: 'momentum:spread',
                            });
                        }

                        return data;
                    }),
                },
            },
            {
                id: 'return_metric',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Return',
                    css_class: 'popover-cpanel',
                },
                label: 'Return',
                hide_icon: true,
                label_track_selection: true,
                popover_config: {
                    component: Radiolist,
                    data: ko.computed(() => {
                        let data = [
                            {
                                value: 'irr:top',
                                label: 'IRR Q1',
                                format: 'irr',
                            },
                            {
                                value: 'irr:median',
                                label: 'IRR Median',
                                format: 'irr',
                            },
                            {
                                value: 'irr:bottom',
                                label: 'IRR Q3',
                                format: 'irr',
                            },
                            {
                                value: 'tvpi:top',
                                label: 'TVPI Q1',
                                format: 'multiple',
                            },
                            {
                                value: 'tvpi:median',
                                label: 'TVPI Median',
                                format: 'multiple',
                            },
                            {
                                value: 'tvpi:bottom',
                                label: 'TVPI Q3',
                                format: 'multiple',
                            },
                            {
                                value: 'dpi:top',
                                label: 'DPI Q1',
                                format: 'multiple',
                            },
                            {
                                value: 'dpi:median',
                                label: 'DPI Median',
                                format: 'multiple',
                            },
                            {
                                value: 'dpi:bottom',
                                label: 'DPI Q3',
                                format: 'multiple',
                            },
                        ];

                        if (self.provider() == 'Cobalt') {
                            data.push(
                                {
                                    value: 'momentum:top',
                                    label: 'Momentum Q1',
                                    format: 'multiple',
                                },
                                {
                                    value: 'momentum:median',
                                    label: 'Momentum Median',
                                    format: 'multiple',
                                },
                                {
                                    value: 'momentum:bottom',
                                    label: 'Momentum Q3',
                                    format: 'multiple',
                                },
                            );
                        }

                        return data;
                    }),
                },
            },
            {
                id: 'size_metric',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Size',
                    css_class: 'popover-cpanel',
                },
                label: 'Size',
                hide_icon: true,
                label_track_selection: true,
                popover_config: {
                    component: Radiolist,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                format: 'money',
                                value: 'total_sold',
                                label: 'Committed Capital',
                            },
                            {
                                format: 'number',
                                value: 'count',
                                label: 'Number of Funds',
                            },
                        ],
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
                id: 'chart_settings_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Chart Settings',
            },
            {
                id: 'filters_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
        ],
    };

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Benchmark',
        title_css: 'data-manager',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: ['risk-return'],
        },
        components: [self.risk_return_cpanel],
    };

    self.page_wrapper = self.new_instance(
        Aside,
        {
            id: 'page_wrapper',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'risk-return'],
            },
            components: [
                self.cpanel,
                {
                    component: BenchmarkRiskReturn,
                    cpanel_id: self.cpanel_id,
                    top_level_id: self.get_id(),
                    id: 'risk-return',
                },
            ],
        },
        self.shared_components,
    );

    self.when(self.shared_components, self.page_wrapper).done(() => {
        Observer.register(self.chart_provider_event, payload => {
            if (payload) {
                Observer.broadcast(self.clear_filters_event);

                self.provider(payload.value);
            }
        });

        self.dfd.resolve();
    });

    return self;
}
