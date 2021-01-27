/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BenchmarkVintageTable from 'src/libs/components/BenchmarkVintageTable';
import MultipleBenchmarkChart from 'src/libs/components/charts/MultipleBenchmarkChart';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import * as Utils from 'src/libs/Utils';

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

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Benchmark',
                link: '#!/benchmark/fund_level_benchmark:browse',
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

    self.title_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                benchmark_edition_uid: {
                    type: 'observer',
                    mapping: 'get',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.top_level_id,
                        'benchmark',
                    ),
                    required: true,
                },
                enums: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'AttributeFilters.state',
                        self.top_level_id,
                        'enum_attributes',
                    ),
                },
                currency_id: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.top_level_id,
                        'render_currency',
                    ),
                    mapping: 'get_value',
                    required: true,
                },
                target: 'market_data:benchmark_name',
            },
        },
    });

    self.chart = {
        id: 'chart',
        template: 'tpl_chart_box',
        component: MultipleBenchmarkChart,
        exporting: true,
        metric_event: Utils.gen_event(
            'PopoverButton.value',
            self.cpanel_id,
            'fund_level_benchmark:browse',
            'metric',
        ),
        chart_click_callback: self.chart_click_callback,
        label: self.title_datasource.data,
        datasource: {
            type: 'dynamic',
            query: {
                benchmark_edition_uid: {
                    type: 'observer',
                    mapping: 'get',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.top_level_id,
                        opts.benchmark_edition_id || 'benchmark',
                    ),
                    required: true,
                },
                currency_id: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.top_level_id,
                        'render_currency',
                    ),
                    mapping: 'get_value',
                    required: true,
                },
                target: opts.chart_data_provider_target || 'market_data:benchmark',
                filters: {
                    type: 'dynamic',
                    query: {
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel_id,
                                'fund_level_benchmark:browse',
                                'vintage_year',
                            ),
                        },
                        enums: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'AttributeFilters.state',
                                self.top_level_id,
                                'enum_attributes',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.top_level_id,
                                'fund_size',
                            ),
                        },
                    },
                },
            },
        },
    };

    self.table = {
        id: 'benchmark_table',
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
            'fund_level_benchmark:browse',
            'metric',
        ),
        datasource: self.chart.datasource,
    };

    self.body_content = {
        id: 'body_content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['chart', 'benchmark_table'],
        },
        components: [self.chart, self.table],
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
