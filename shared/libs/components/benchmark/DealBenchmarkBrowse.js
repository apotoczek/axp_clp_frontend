/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BenchmarkVintageTable from 'src/libs/components/BenchmarkVintageTable';
import MultipleBenchmarkChart from 'src/libs/components/charts/MultipleBenchmarkChart';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';
    self.cpanel_id = opts.cpanel_id;
    self.top_level_id = opts.top_level_id;
    self.chart_click_callback = opts.chart_click_callback;

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );

    self.clear_event = Utils.gen_event('EventButton', self.cpanel_id, 'clear_button');

    self.metric_key = ko.observable();
    self.metric_label = ko.observable();
    self.chart_title = ko.observable();
    self.chart_type = ko.observable();

    Observer.register(
        Utils.gen_event(
            'PopoverButton.value',
            self.cpanel_id,
            'deal_level_benchmark:browse',
            'metric',
        ),
        metric => {
            if (metric.length > 0) {
                self.metric_key(metric[0].value);
                self.metric_label(metric[0].label);
                self.chart_title(`Deal Data Benchmark: ${self.metric_label()}`);
            }
        },
    );

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Benchmark',
                link: '#!/benchmark/deal_level_benchmark:browse',
            },
            {
                label: 'Browse',
            },
        ],
    };

    self.header = {
        id: 'header',
        component: BreadcrumbHeader,
        template: 'tpl_breadcrumb_header',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
        buttons: [],
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        valid_export_features: ['view_benchmarks'],
        buttons: [],
    };

    self.deal_benchmark_chart = {
        id: 'deal_benchmark_chart',
        template: 'tpl_chart_box',
        component: MultipleBenchmarkChart,
        exporting: true,
        default_metric: 'total_mom',
        metric_event: Utils.gen_event(
            'PopoverButton.value',
            self.cpanel_id,
            'deal_level_benchmark:browse',
            'metric',
        ),
        chart_click_callback: self.chart_click_callback,
        hide_empty: true,
        label: self.chart_title,
        datasource: {
            type: 'dynamic',
            query: {
                benchmark_edition_uid: {
                    type: 'observer',
                    mapping: 'get',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.cpanel_id,
                        'deal_level_benchmark:browse',
                        'deal_benchmark',
                    ),
                    required: true,
                },
                target: 'market_data:deal_benchmark',
                filters: {
                    type: 'dynamic',
                    query: {
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.top_level_id,
                                'deal_enum_attributes',
                            ),
                        },
                        acquisition_metrics: {
                            type: 'dynamic',
                            query: {
                                acq_valuation_multiple: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_valuation_multiple',
                                    ),
                                },
                                acq_net_debt_ebitda: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_net_debt_ebitda',
                                    ),
                                },
                                acq_ebitda: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_ebitda',
                                    ),
                                },
                                acq_ebitda_margin: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_ebitda_margin',
                                    ),
                                },
                                acq_enterprise_value: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_enterprise_value',
                                    ),
                                },
                                acq_revenue: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'deal_level_benchmark:browse',
                                        'acq_revenue',
                                    ),
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    self.deal_benchmark_table = {
        id: 'deal_benchmark_table',
        component: BenchmarkVintageTable,
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Benchmark Data',
            subtitle: 'CSV',
        },
        vertical: true,
        css: {'table-light': true, 'table-sm': true},
        metric_event: Utils.gen_event(
            'PopoverButton.value',
            self.cpanel_id,
            'deal_level_benchmark:browse',
            'metric',
        ),
        datasource: self.deal_benchmark_chart.datasource,
        hide_empty: true,
        identifier: 'Deal',
    };

    self.body_content = {
        id: 'body_content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['deal_benchmark_chart', 'deal_benchmark_table'],
        },
        components: [self.deal_benchmark_chart, self.deal_benchmark_table],
    };

    self.content_components = [self.header, self.action_toolbar, self.body_content];

    self.content = {
        id: 'content',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'body_content',
        },
        components: self.content_components,
    };

    self.body_components = [self.content];

    self.body = self.new_instance(Aside, {
        id: 'search_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['content'],
        },
        components: self.body_components,
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();
    });

    return self;
}
