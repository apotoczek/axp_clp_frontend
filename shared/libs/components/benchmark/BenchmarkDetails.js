/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import RowContainer from 'src/libs/components/basic/RowContainer';
import BenchmarkTable from 'src/libs/components/BenchmarkTable';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import PopoverAddFundSnapshot from 'src/libs/components/popovers/PopoverAddFundSnapshot';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataSource from 'src/libs/DataSource';
import BenchmarkHelper from 'src/libs/helpers/BenchmarkHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';
    self.top_level_id = opts.top_level_id;

    self.clear_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'search_state',
        'cpanel',
        'clear_button',
    );
    self.active_compset = ko.observableArray();
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );
    self.visible_event = opts.visible_event;
    self.cpanel_id = opts.cpanel_id;
    self.set_provider_specific_chart_event = opts.set_provider_specific_chart_event;

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Benchmark',
                link: '#!/benchmark/fund_level_benchmark:browse',
            },
            {
                label: 'Details',
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

    self.datasource = self.new_instance(DataSource, {
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
                target: 'market_data:benchmark',
                filters: {
                    type: 'dynamic',
                    query: {
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
    });

    self.vintage_year_idx = ko.observable();

    Observer.register_for_id(
        Utils.gen_id(self.cpanel_id, 'fund_level_benchmark:details', 'vintage_year'),
        'PopoverButton.value',
        value => {
            self.vintage_year_idx(value && value.length ? value[0].index : 0);
        },
    );

    self.add_compset_popover = {
        label: 'Add Comparison Fund',
        id: 'compset_fund',
        component: NewPopoverButton,
        popover_options: {
            placement: 'bottom',
            title: 'Add Comparison Fund',
        },
        icon_css: 'icon-plus',
        css: {
            'btn-ghost-info': true,
            'btn-block': true,
            'popover-btn-add-comp-fund': true,
        },
        popover_config: {
            match_width: false,
            component: PopoverAddFundSnapshot,
            template: 'tpl_popover_add_fund_snapshot_2col',
            single_selection: true,
            compset: self.active_compset,
        },
    };

    self.irr_chart = {
        id: 'irr_chart',
        component: BenchmarkChart,
        exporting: true,
        template: 'tpl_chart_box',
        simple_data_format: true,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        format: 'irr',
        label: 'IRR',
        value_key: 'irr',
        label_key: 'name',
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();
            if (data && data.metrics && Utils.is_set(idx)) {
                return data.metrics['irr'][idx];
            }
        }),
        comps: self.active_compset,
    };

    self.dpi_chart = {
        id: 'dpi_chart',
        exporting: true,
        component: BenchmarkChart,
        template: 'tpl_chart_box',
        simple_data_format: true,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        format: 'multiple',
        label: 'DPI',
        value_key: 'dpi',
        label_key: 'name',
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.metrics && Utils.is_set(idx)) {
                return data.metrics['dpi'][idx];
            }
        }),
        comps: self.active_compset,
    };

    self.tvpi_chart = {
        id: 'tvpi_chart',
        exporting: true,
        component: BenchmarkChart,
        template: 'tpl_chart_box',
        simple_data_format: true,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        format: 'multiple',
        label: 'TVPI',
        value_key: 'tvpi',
        label_key: 'name',
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.metrics && Utils.is_set(idx)) {
                return data.metrics['tvpi'][idx];
            }
        }),
        comps: self.active_compset,
    };

    self.rvpi_chart = {
        id: 'rvpi_chart',
        exporting: true,
        component: BenchmarkChart,
        template: 'tpl_chart_box',
        simple_data_format: true,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        format: 'multiple',
        label: 'RVPI',
        value_key: 'rvpi',
        label_key: 'name',
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.metrics && data.metrics['rvpi'] && Utils.is_set(idx)) {
                return data.metrics['rvpi'][idx];
            }
        }),
        comps: self.active_compset,
    };

    self.momentum_chart = {
        id: 'momentum_chart',
        exporting: true,
        component: BenchmarkChart,
        template: 'tpl_chart_box',
        simple_data_format: true,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        format: 'percent',
        label: 'Momentum',
        value_key: 'momentum',
        label_key: 'name',
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.metrics && data.metrics['momentum'] && Utils.is_set(idx)) {
                return data.metrics['momentum'][idx];
            }
        }),
        comps: self.active_compset,
    };

    self.dynamic_chart = {
        id: 'dynamic_chart',
        component: DynamicWrapper,
        set_active_event: self.set_provider_specific_chart_event,
        components: [self.momentum_chart, self.rvpi_chart],
    };

    self.details_table = {
        id: 'details_table',
        component: DataTable,
        columns: BenchmarkHelper.fund_table_columns,
        css: {
            'table-light': true,
            'table-sm': true,
        },
        inline_data: true,
        visible_event: self.visible_event,
        visible_event_fn: function(value) {
            return typeof value === 'string' ? value.includes('Cobalt') : false;
        },
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.funds && Utils.is_set(idx)) {
                return data.funds[idx];
            }
        }),
    };

    self.benchmark_details = {
        id: 'details',
        component: BenchmarkTable,
        dependencies: [Utils.gen_id(self.cpanel_id, 'details', 'vintage_year')],
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Benchmark Details',
            subtitle: 'CSV',
        },
        metrics: [
            {
                key: 'irr',
                label: 'IRR',
                format: 'irr',
            },
            {
                key: 'dpi',
                label: 'DPI',
                format: 'multiple',
            },
            {
                key: 'multiple',
                label: 'TVPI',
                format: 'multiple',
            },
            {
                key: 'momentum',
                label: 'Momentum',
                format: 'percent',
            },
            {
                key: 'rvpi',
                label: 'RVPI',
                format: 'multiple',
            },
        ],
        row_defs: [
            {
                label: 'Upper Fence',
                is_fence: true,
                value_fn: function(data, formatter) {
                    return formatter(data.values[4]);
                },
            },
            {
                label: 'Q1',
                value_fn: function(data, formatter) {
                    return formatter(data.values[3]);
                },
            },
            {
                label: 'Q2',
                value_fn: function(data, formatter) {
                    return formatter(data.values[2]);
                },
            },
            {
                label: 'Q3',
                value_fn: function(data, formatter) {
                    return formatter(data.values[1]);
                },
            },
            {
                label: 'Lower Fence',
                is_fence: true,
                value_fn: function(data, formatter) {
                    return formatter(data.values[0]);
                },
            },
        ],
        data: ko.computed(() => {
            let data = self.datasource.data();
            let idx = self.vintage_year_idx();

            if (data && data.metrics && Utils.is_set(idx) && data.fund_count[idx]) {
                let res = {
                    irr: {
                        count: data.fund_count[idx],
                        values: data.metrics.irr[idx],
                    },
                    dpi: {
                        count: data.fund_count[idx],
                        values: data.metrics.dpi[idx],
                    },
                    multiple: {
                        count: data.fund_count[idx],
                        values: data.metrics.tvpi[idx],
                    },
                };

                if (data.metrics.momentum) {
                    res.momentum = {
                        count: data.fund_count[idx],
                        values: data.metrics.momentum[idx],
                    };
                }

                if (data.metrics.rvpi && data.metrics.rvpi[idx]) {
                    res.rvpi = {
                        count: data.fund_count[idx],
                        values: data.metrics.rvpi[idx],
                    };
                }

                return res;
            }
        }),
    };

    self.charts = {
        id: 'charts',
        component: RowContainer,
        layout: {
            row: ['irr_chart', 'tvpi_chart', 'dpi_chart', 'dynamic_chart'],
        },
        components: [self.irr_chart, self.dpi_chart, self.tvpi_chart, self.dynamic_chart],
    };

    self.details_label = {
        id: 'details_label',
        component: BaseComponent,
        template: 'tpl_base_h2',
        visible_event: self.visible_event,
        visible_event_fn: function(value) {
            return typeof value === 'string' ? value.includes('Cobalt') : false;
        },
        heading: 'Funds',
    };

    self.body_content = {
        id: 'body_content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['compset_fund', 'charts', 'details', 'details_label', 'details_table'],
        },
        components: [
            self.add_compset_popover,
            self.charts,
            self.details_label,
            self.benchmark_details,
            self.details_table,
        ],
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

    self.body_components = [self.cpanel, self.content];

    self.body = self.new_instance(Aside, {
        id: 'search_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['content'],
        },
        components: [self.content],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();
    });

    return self;
}
