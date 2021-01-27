/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import DataTable from 'src/libs/components/basic/DataTable';
import RiskReturnChart from 'src/libs/components/charts/RiskReturnChart';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';
    self.cpanel_id = opts.cpanel_id;
    self.top_level_id = opts.top_level_id;
    self.state_event = opts.state_event;

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );
    self.clear_event = Utils.gen_event('EventButton', self.cpanel_id, 'clear_button');

    self.risk_metrics = [
        {
            value: 'loss_ratio',
            label: 'Loss Ratio',
            format: 'percent',
        },
        {
            value: 'loss_ratio_money_weighted',
            label: 'Loss Ratio (Money Weighted)',
            format: 'percent',
        },
        {
            value: 'irr:spread',
            label: 'IRR Spread (Q1 - Q3)',
            format: 'irr',
        },
        {
            value: 'tvpi:spread',
            label: 'TVPI Spread (Q1 - Q3)',
            format: 'multiple',
        },
        {
            value: 'dpi:spread',
            label: 'DPI Spread (Q1 - Q3)',
            format: 'multiple',
        },
        {
            label: 'Momentum Spread (Q1 - Q3)',
            format: 'percent',
            value: 'momentum:spread',
        },
    ];

    self.return_metrics = [
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
    ];

    self.size_metrics = [
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
    ];

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Risk / Return',
                link: '#!/risk-return',
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

    self.render_currency = ko.observable();

    Observer.register(
        Utils.gen_event('PopoverButton.value', self.top_level_id, 'render_currency'),
        currency => {
            self.render_currency(Utils.get(currency, 'symbol'));
        },
    );

    self.label_datasource = self.new_instance(DataSource, {
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

    self.datasource = self.new_instance(DataSource, {
        id: 'datasource',
        datasource: {
            type: 'dynamic',
            query: {
                target: 'smrrt_breakdown',
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
                filters: {
                    type: 'dynamic',
                    query: {
                        vintage_year: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.cpanel_id,
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
                                self.cpanel_id,
                                'fund_size',
                            ),
                        },
                    },
                },
                breakdown_key: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', self.cpanel_id, 'breakdown'),
                    mapping: 'get_value',
                    required: true,
                },
            },
        },
    });

    self.return_metric_event = Observer.map(
        Utils.gen_event('PopoverButton.value', self.cpanel_id, 'return_metric'),
        'get_value',
    );
    self.risk_metric_event = Observer.map(
        Utils.gen_event('PopoverButton.value', self.cpanel_id, 'risk_metric'),
        'get_value',
    );
    self.size_metric_event = Observer.map(
        Utils.gen_event('PopoverButton.value', self.cpanel_id, 'size_metric'),
        'get_value',
    );

    self.chart = {
        id: 'chart',
        dependencies: [self.datasource.get_id()],
        component: RiskReturnChart,
        render_currency: self.render_currency,
        return_metric_event: self.return_metric_event,
        risk_metric_event: self.risk_metric_event,
        size_metric_event: self.size_metric_event,
        risk_metrics: self.risk_metrics,
        return_metrics: self.return_metrics,
        size_metrics: self.size_metrics,
        label: self.label_datasource.data,
        chart_template: 'tpl_chart_box',
        exporting: true,
        data: self.datasource.data,
    };

    self.risk_metric = Observer.observable(self.risk_metric_event);
    self.return_metric = Observer.observable(self.return_metric_event);
    self.size_metric = Observer.observable(self.size_metric_event);

    self.metrics = self.risk_metrics.concat(self.return_metrics).concat(self.size_metrics);

    self.table = {
        id: 'table',
        dependencies: [self.datasource.get_id()],
        component: DataTable,
        columns: [
            {
                key: 'group',
                label: 'Group',
            },
        ],
        css: {
            'table-light': true,
            'table-sm': true,
        },
        disable_sorting: true,
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Risk / Return Breakdown',
            subtitle: 'CSV',
        },
        export_type: 'risk_return_breakdown_table',
        inline_data: true,
        dynamic_columns: {
            data: ko.computed(() => {
                let selected_metrics = [
                    self.risk_metric(),
                    self.return_metric(),
                    self.size_metric(),
                ];

                let metrics = self.metrics.filter(metric => {
                    return selected_metrics.indexOf(metric.value) > -1;
                });

                return metrics.map(metric => {
                    return {
                        key: metric.value.replace(':', '_'),
                        label: metric.label,
                        format: metric.format,
                    };
                });
            }),
        },
        data: ko.computed(() => {
            let data = self.datasource.data();

            if (data) {
                let rows = [];
                let groups = Object.keys(data).reverse();
                for (let i = 0, l = groups.length; i < l; i++) {
                    let row = {
                        group: groups[i],
                    };

                    let group_data = data[groups[i]];

                    for (let j = 0, k = self.metrics.length; j < k; j++) {
                        let key = self.metrics[j].value.replace(':', '_');
                        row[key] = Utils.extract_data(self.metrics[j].value, group_data);
                    }

                    rows.push(row);
                }

                return rows;
            }

            return [];
        }),
    };

    self.body_content = {
        id: 'body_content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['chart', 'table'],
        },
        components: [self.chart, self.table],
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        valid_export_features: ['view_benchmarks'],
        buttons: [],
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

    self.when(self.body, self.datasource).done(() => {
        self.dfd.resolve();
    });

    return self;
}
