import ko from 'knockout';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ScoringChart from 'src/libs/components/charts/ScoringChart';
import BenchmarkChart from 'src/libs/components/charts/BenchmarkChart';
import BenchmarkTable from 'src/libs/components/BenchmarkTable';
import CompSet from 'src/libs/components/CompSet';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetricTable from 'src/libs/components/MetricTable';
import NumberBox from 'src/libs/components/basic/NumberBox';
import DataTable from 'src/libs/components/basic/DataTable';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper.js';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import config from 'config';
import $ from 'jquery';
import moment from 'moment';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import * as Constants from 'src/libs/Constants';

class FundInFamilyView extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_default_template(`
            <!-- ko renderComponent: page --><!-- /ko -->
        `);

        this.fund_uid_event =
            opts.fund_uid_event || Utils.gen_event('Active.fund_uid', this.get_id());
        this.fund_uid = Observer.observable(this.fund_uid_event);

        let hl_deployment = config.hl;
        let events = this.new_instance(EventRegistry);
        events.resolve_and_add('register_export', 'DynamicActions.register_action');
        events.resolve_and_add('register_export', 'DynamicActions.enabled', 'enable_export');
        events.resolve_and_add('family_data', 'DataSource.data');
        events.new('download_pdf_event');
        events.new('create_visual_report');

        this.compset = new CompSet({
            comps: [
                {
                    color: '#4D4D4D',
                    datasource: this.gen_fund_datasource_config(),
                },
            ],
        });

        let investors = {
            component: DataTable,
            id: 'investors',
            columns: MarketInsightsHelper.investment_table_columns({
                include_investor: true,
                include_fund: false,
                investor_view: true,
            }),
            css: {
                'table-light': true,
                'table-sm': true,
            },
            empty_template: 'tpl_data_table_investors_empty',
            results_per_page: 15,
            visible_event: events.get('family_data'),
            visible_event_fn: MarketInsightsHelper.fund_has_dataset('cobalt'),
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'market_data:investments',
                    filters: {
                        type: 'dynamic',
                        query: {
                            fund_uid: {
                                type: 'observer',
                                event_type: this.fund_uid_event,
                                required: true,
                            },
                        },
                    },
                    results_per_page: 15,
                    fund_fallback: false,
                    order_by: [
                        {name: 'as_of_date', sort: 'desc'},
                        {name: 'name', sort: 'asc'},
                    ],
                },
            },
        };

        let number_boxes = {
            id: 'number_boxes',
            component: BaseComponent,
            template: 'tpl_flexible_number_box_row',
            layout: {
                body: ['irr', 'dpi', 'tvpi', 'gross_irr', 'gross_multiple'],
            },
            components: [
                {
                    id: 'irr',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'IRR',
                    data_key: 'irr',
                    format: 'irr_highlight',
                    datasource: this.gen_fund_datasource_config(),
                    id_callback: events.register_alias('family_data'),
                    broadcast_data: true,
                },
                {
                    id: 'dpi',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'DPI',
                    data_key: 'dpi',
                    format: 'multiple_highlight',
                    datasource: this.gen_fund_datasource_config(),
                },
                {
                    id: 'tvpi',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'TVPI',
                    data_key: 'multiple',
                    format: 'multiple_highlight',
                    datasource: this.gen_fund_datasource_config(),
                },
                {
                    id: 'gross_irr',
                    id_callback: events.register_alias('gross_irr'),
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Gross IRR',
                    data_key: 'gross_irr',
                    format: 'irr_highlight',
                    datasource: this.gen_fund_datasource_config(),
                    visible_event: events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                },
                {
                    id: 'gross_multiple',
                    id_callback: events.register_alias('gross_multiple'),
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Gross Multiple',
                    data_key: 'gross_multiple',
                    format: 'multiple_highlight',
                    datasource: this.gen_fund_datasource_config(),
                    visible_event: events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                },
            ],
        };

        let metric_table = {
            component: MetricTable,
            id: 'metric_table',
            inline_data: true,
            css: {'table-light': true},
            template: 'tpl_metric_table_multi_col',
            columns: 2,
            metrics: [
                {
                    label: 'Firm',
                    format: 'entity_link',
                    format_args: {
                        url: 'firms.firm_uid',
                        name_key: 'firm_name',
                    },
                },
                {
                    label: 'Location',
                    value_key: 'location',
                },
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Geography',
                    value_key: 'enums:geography',
                    format: 'strings_full',
                },
                {
                    label: 'Style / Focus',
                    value_key: 'enums:style',
                    format: 'strings_full',
                },
                {
                    label: 'Sector',
                    value_key: 'enums:sector',
                    format: 'strings_full',
                },
                {
                    label: 'As of date',
                    value_key: 'as_of_date',
                    format: 'backend_date',
                },
                {
                    label: 'Fund Size',
                    value_key: 'target_size_value',
                    format: 'money',
                    format_args: {
                        currency_key: 'target_size_currency',
                    },
                },
            ],
            datasource: this.gen_fund_datasource_config(),
        };

        let quartile_charts_template = `
            <div class="row" data-bind="foreach: opts.charts">
                <div class="col-md-3" data-bind="renderComponent: $data"></div>
            </div>
        `;

        let benchmark_table = this.new_instance(BenchmarkTable, {
            id: 'benchmark_table',
            css: {'table-light': true, 'table-sm': false},
            dependencies: [this.get_id()],
            metrics: [
                {
                    label: 'Net IRR',
                    key: 'irr',
                    type: 'numeric',
                    format: 'irr',
                },
                {
                    label: 'TVPI',
                    key: 'multiple',
                    type: 'numeric',
                    format: 'multiple',
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    type: 'numeric',
                    format: 'multiple',
                },
                {
                    label: 'PME Alpha',
                    key: 'bison_pme_alpha',
                    type: 'numeric',
                    format: 'percent',
                },
            ],
            datasource: this.gen_fund_peerset_datasource_config({}),
        });

        let chart_metrics = [
            {
                value_key: 'irr',
                label: 'IRR',
                format: 'percent',
            },
            {
                value_key: 'multiple',
                label: 'TVPI',
                format: 'multiple',
            },
            {
                value_key: 'dpi',
                label: 'DPI',
                format: 'multiple',
            },
            {
                value_key: 'bison_pme_alpha',
                label: 'PME Alpha',
                format: 'percent',
            },
        ];

        let charts = chart_metrics.map(metric => {
            return this.new_instance(BenchmarkChart, {
                default_selected_index: 0,
                dependencies: [this.get_id()],
                label_in_chart: true,
                label: metric.label,
                label_key: 'name',
                format: metric.format,
                value_key: metric.value_key,
                legend: false,
                datasource: this.gen_fund_peerset_datasource_config({
                    mapping: 'get',
                    mapping_args: {
                        key: metric.value_key,
                    },
                }),
                comps: this.compset.comps,
            });
        });

        let quartile_charts = this.new_instance(BaseComponent, {
            id: 'quartile_charts',
            template: quartile_charts_template,
            charts: charts,
        });

        let benchmark_body = {
            component: Aside,
            id: 'benchmark_body',
            template: 'tpl_fund_in_family_container',
            layout: {
                top_row: ['quartile_charts', 'benchmark_table'],
                bottom_row: [
                    'irr_chart',
                    'dpi_chart',
                    'tvpi_chart',
                    'bison_pme_alpha_chart',
                    'gross_irr_chart',
                    'gross_multiple_chart',
                ],
            },
            components: [
                quartile_charts,
                benchmark_table,
                ...[
                    {
                        id: 'irr_chart',
                        key: 'irr',
                        format: 'irr',
                        label: 'IRR',
                    },
                    {
                        id: 'dpi_chart',
                        key: 'dpi',
                        format: 'multiple',
                        label: 'DPI',
                    },
                    {
                        id: 'tvpi_chart',
                        key: 'tvpi',
                        format: 'multiple',
                        label: 'TVPI',
                    },
                    {
                        id: 'bison_pme_alpha_chart',
                        key: 'bison_pme_alpha',
                        format: 'percent',
                        label: 'PME Alpha',
                    },
                    {
                        id: 'gross_irr_chart',
                        key: 'gross_irr',
                        format: 'irr',
                        label: 'Gross IRR',
                        visible_event: events.get('family_data'),
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                    },
                    {
                        id: 'gross_multiple_chart',
                        key: 'gross_multiple',
                        format: 'multiple',
                        label: 'Gross Multiple',
                        visible_event: events.get('family_data'),
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                    },
                ].map(conf => this.gen_scoring_chart_config(conf)),
            ],
        };

        let content = {
            id: 'content',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'fund_heading',
                    'metric_table',
                    'number_boxes',
                    'other_table',
                    'performance_heading',
                    'benchmark_body',
                    'page_break',
                    'investors_heading',
                    'investors',
                ],
            },
            components: [
                {
                    id: 'fund_heading',
                    component: BaseComponent,
                    datasource: this.gen_fund_datasource_config(),
                    template: 'tpl_family_heading',
                },
                metric_table,
                number_boxes,
                {
                    id: 'other_table',
                    component: MetricTable,
                    columns: 1,
                    inline_data: true,
                    css: {'table-light': true},
                    template: 'tpl_metric_table',
                    metrics: [
                        {
                            label: 'PME Alpha',
                            format: 'percent',
                            value_key: 'bison_pme_alpha',
                        },
                        {
                            label: 'Gross Invested',
                            format: 'money',
                            format_args: {
                                value_key: 'gross_invested',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                        {
                            label: 'Gross Realized',
                            format: 'money',
                            format_args: {
                                value_key: 'gross_realized',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                        {
                            label: 'Gross Unrealized',
                            format: 'money',
                            format_args: {
                                value_key: 'gross_unrealized',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                    ],
                    datasource: this.gen_fund_datasource_config(),
                },
                {
                    id: 'separator',
                    component: HTMLContent,
                    html: '<div style="padding:15px;"></div>',
                },
                {
                    id: 'performance_heading',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    heading: 'Performance',
                },
                benchmark_body,
                {
                    id: 'page_break',
                    component: HTMLContent,
                    html: '<div class="page-break"></div>',
                },
                {
                    id: 'investors_heading',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    heading: 'Investors',
                    visible_event: events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('cobalt'),
                },
                investors,
            ],
        };

        let breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'family_name',
                    link_key: 'family_uid',
                    link_format: family_uid => `#!/families/${family_uid}`,
                    datasource: this.gen_fund_datasource_config(),
                },
                {
                    label_key: 'name',
                    datasource: this.gen_fund_datasource_config(),
                },
            ],
        };

        let header = {
            component: BreadcrumbHeader,
            id: 'header',
            template: 'tpl_breadcrumb_header',
            css: {'sub-page-header': true},
            layout: {
                breadcrumb: 'breadcrumb',
            },
            // valid_export_features: ['download_market_data'],
            components: [breadcrumb],
        };

        let toolbar = {
            component: ActionHeader,
            id: 'toolbar',
            template: 'tpl_action_toolbar',
            export_id_callback: events.register_alias('register_export'),
            buttons: [
                ...Utils.conditional_element(
                    [
                        {
                            id: 'create_visual_report',
                            component: ActionButtons,
                            label: 'Create Visual Report <span class="icon-doc-text"></span>',
                            template: 'tpl_action_buttons_dropdown',
                            css: {btn: true, 'btn-transparent-success:': true},
                            datasource: this.gen_fund_datasource_config(),
                            buttons: [
                                {
                                    label: 'Deal Intelligence Report',
                                    component: ActionButton,
                                    action: 'create_deal_intelligence_report',
                                    disabled_callback: data => !data.has_gross_cashflows,
                                },
                                {
                                    label: 'Fund Screening Report',
                                    component: ActionButton,
                                    action: 'create_fund_screening_report',
                                    disabled_callback: data => {
                                        if (data.dataset === Constants.datasets.cobalt) {
                                            return (
                                                !data.cf_investor_uid ||
                                                !data.target_size_value ||
                                                !data.target_size_currency
                                            );
                                        }

                                        return !data.has_net_cashflows;
                                    },
                                },
                            ],
                        },
                    ],
                    hl_deployment,
                ),
                {
                    id: 'view_cashflows',
                    component: ActionButtons,
                    label: 'View Cashflows for Fund <span class="icon-chart-bar"></span>',
                    template: 'tpl_action_buttons_dropdown',
                    css: {
                        btn: true,
                        'btn-transparent-success': true,
                    },
                    action: 'view_cashflows',
                    datasource: this.gen_fund_datasource_config(),
                    trigger_url: {
                        url: 'fund-in-family/<uid>/analytics',
                    },
                    buttons: [
                        {
                            label: 'Net Analytics',
                            component: ActionButton,
                            action: 'view_net_cashflows',
                            trigger_url: {
                                url: 'fund-in-family/<uid>/net/analytics/',
                            },
                            datasource: this.gen_fund_datasource_config(),
                            disabled_callback: data => {
                                if (data.dataset === Constants.datasets.cobalt) {
                                    return (
                                        !data.cf_investor_uid ||
                                        !data.target_size_value ||
                                        !data.target_size_currency
                                    );
                                }

                                return !data.has_net_cashflows;
                            },
                        },
                        {
                            label: 'Gross Analytics',
                            component: ActionButton,
                            action: 'view_gross_cashflows',
                            trigger_url: {
                                url: 'fund-in-family/<uid>/gross/analytics',
                            },
                            disabled_callback: data => !data.has_gross_cashflows,
                            datasource: this.gen_fund_datasource_config(),
                        },
                    ],
                },
            ],
        };

        let body = {
            id: 'body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'toolbar',
                body: 'content',
            },
            components: [header, toolbar, content],
        };

        this.page = this.new_instance(Aside, {
            id: 'page',
            template: 'tpl_aside_body',
            layout: {
                body: ['body'],
            },
            components: [body],
        });

        this.meta_data_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                one_required: ['market_data_fund_uid'],
                query: {
                    target: 'vehicle:meta_data',
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: this.fund_uid_event,
                    },
                },
            },
        });

        Observer.broadcast(
            events.get('register_export'),
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: events.get('download_pdf_event'),
            },
            true,
        );

        let prepare_pdf = DataThing.backends.download({
            url: 'prepare_market_data_pdf',
        });

        this._create_visual_report = DataThing.backends.useractionhandler({
            url: 'create_visual_report',
        });

        Observer.register(events.get('download_pdf_event'), () => {
            let uid = ko.unwrap(this.fund_uid);

            let body_content_id = Utils.html_id(
                this.page.components.body.components.content.get_id(),
            );

            if (uid) {
                prepare_pdf({
                    data: {
                        html: $(`#${body_content_id}`).html(),
                        width: $(`#${body_content_id}`).width(),
                        height: $(`#${body_content_id}`).height(),
                        uid: uid,
                        type: 'fund_in_family',
                    },
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_pdf_base + key);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        });

        Observer.register(
            Utils.gen_event(
                'ActionButtons.ActionButton.action.create_deal_intelligence_report',
                this.get_id(),
                'page',
                'body',
                'toolbar',
                'create_visual_report',
            ),
            () => {
                const data = this.meta_data_datasource.data();
                this._create_visual_report({
                    data: {
                        name: `${data.name} - ${moment().format('MM/DD/YYYY')}`,
                        report_type: 'visual_report',
                        sub_type: 'deal_report',
                        params: {
                            entity_uid: data.market_data_fund_uid,
                            entity_type: data.entity_type,
                        },
                    },
                    success: DataThing.api.XHRSuccess(response => {
                        pager.navigate(
                            `#!/visual-reports/${response.sub_type}/edit/${response.uid}`,
                        );
                    }),
                });
            },
        );

        Observer.register(
            Utils.gen_event(
                'ActionButtons.ActionButton.action.create_fund_screening_report',
                this.get_id(),
                'page',
                'body',
                'toolbar',
                'create_visual_report',
            ),
            () => {
                const data = this.meta_data_datasource.data();
                this._create_visual_report({
                    data: {
                        name: `${data.name} - ${moment().format('MM/DD/YYYY')}`,
                        report_type: 'visual_report',
                        sub_type: 'fund_screening',
                        params: {
                            entity_uid: data.market_data_fund_uid,
                            entity_type: data.entity_type,
                        },
                    },
                    success: DataThing.api.XHRSuccess(response => {
                        pager.navigate(
                            `#!/visual-reports/${response.sub_type}/edit/${response.uid}`,
                        );
                    }),
                });
            },
        );

        this.when(this.page, this.meta_data_datasource).done(() => {
            dfd.resolve();
        });
    }

    gen_fund_datasource_config(mapping, mapping_args) {
        return {
            type: 'dynamic',
            mapping: mapping,
            mapping_args: mapping_args,
            query: {
                target: 'market_data:fund',
                uid: {
                    type: 'observer',
                    event_type: this.fund_uid_event,
                    required: true,
                },
            },
        };
    }

    gen_fund_peerset_datasource_config({
        mapping,
        mapping_args,
        include_items = false,
        target = 'benchmark',
    }) {
        return {
            type: 'dynamic',
            mapping: mapping,
            mapping_args: mapping_args,
            query: {
                target: target,
                filters: {
                    type: 'dynamic',
                    query: {
                        similar_to_uid: {
                            type: 'observer',
                            event_type: this.fund_uid_event,
                        },
                    },
                },
                include_items: include_items,
            },
        };
    }

    gen_scoring_chart_config({id, key, format, label, ...rest}) {
        return this.new_instance(ScoringChart, {
            ...rest,
            id: id,
            disable_controls: true,
            y_axis_default: {
                value: key,
                label: label,
                format: format,
            },
            chart_sub_label: '',
            chart_label_prefix: '',
            margin: '0 20px',
            auto_get_data: true,
            datasource: {
                type: 'dynamic',
                mapping: data => {
                    return data.results.sort((a, b) => b[key] - a[key]);
                },
                query: {
                    target: 'market_data:funds',
                    results_per_page: 10,
                    filters: {
                        type: 'dynamic',
                        query: {
                            similar_to_uid: {
                                type: 'observer',
                                event_type: this.fund_uid_event,
                            },
                        },
                    },
                    order_by: [
                        {
                            name: key,
                            sort: 'desc',
                        },
                    ],
                },
            },
            comps: this.compset.comps,
        });
    }
}

export default FundInFamilyView;
