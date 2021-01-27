/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import FundPerformance from 'src/libs/components/market_insights/FundPerformance';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import NumberBox from 'src/libs/components/basic/NumberBox';
import MetricTable from 'src/libs/components/MetricTable';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import FundWizard from 'src/libs/components/market_insights/investor/FundWizard';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import $ from 'jquery';
import pager from 'pager';
import config from 'config';
import auth from 'auth';
import moment from 'moment';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import ActionButton from 'src/libs/components/basic/ActionButton';
import DataSource from 'src/libs/DataSource';
import * as Constants from 'src/libs/Constants';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    let hl_deployment = config.hl;

    self.template = opts.template || 'tpl_market_insights_body';
    self.events = opts.events;
    self.events = {
        ...self.events,
        gross_irr: Utils.gen_event(
            'DataSource.data',
            self.get_id(),
            'viewer_body',
            'fund',
            'fund_body',
            'number_boxes',
            'gross_irr',
        ),
        gross_multiple: Utils.gen_event(
            'DataSource.data',
            self.get_id(),
            'viewer_body',
            'fund',
            'fund_body',
            'number_boxes',
            'gross_multiple',
        ),
    };

    self.results_per_page = 50;
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'viewer_body',
        'fund',
        'action_toolbar',
        'export_actions',
    );

    self.fund_uid = ko.observable();
    self.download_pdf_event = Utils.gen_event('FundViewer.download_pdf', self.get_id());

    Observer.broadcast_for_id(
        self.register_export_id,
        'DynamicActions.register_action',
        {
            title: 'Current Page',
            subtitle: 'PDF',
            event_type: self.download_pdf_event,
        },
        true,
    );

    self._prepare_pdf = DataThing.backends.download({
        url: 'prepare_market_data_pdf',
    });

    self._create_visual_report = DataThing.backends.useractionhandler({
        url: 'create_visual_report',
    });

    self.meta_data_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:meta_data',
                market_data_fund_uid: {
                    type: 'observer',
                    event_type: self.events.fund_uid,
                    required: true,
                },
            },
        },
    });

    self.gen_fund_datasource_config = (mapping, mapping_args) => {
        return {
            type: 'dynamic',
            mapping: mapping,
            mapping_args: mapping_args,
            query: {
                target: 'market_data:fund',
                uid: {
                    type: 'observer',
                    event_type: self.events.fund_uid,
                    required: true,
                },
            },
        };
    };

    Observer.register(
        Utils.gen_event(
            'ActionButtons.ActionButton.action.create_fund_screening_report',
            self.get_id(),
            'viewer_body',
            'fund',
            'action_toolbar',
            'create_visual_report',
        ),
        () => {
            const data = self.meta_data_datasource.data();
            self._create_visual_report({
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
                    pager.navigate(`#!/visual-reports/${response.sub_type}/edit/${response.uid}`);
                }),
            });
        },
    );

    Observer.register(
        Utils.gen_event(
            'ActionButtons.ActionButton.action.create_deal_report',
            self.get_id(),
            'viewer_body',
            'fund',
            'action_toolbar',
            'create_visual_report',
        ),
        () => {
            const data = self.meta_data_datasource.data();
            self._create_visual_report({
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
                    pager.navigate(`#!/visual-reports/${response.sub_type}/edit/${response.uid}`);
                }),
            });
        },
    );

    Observer.register(self.download_pdf_event, () => {
        let fund_uid = self.fund_uid();

        if (fund_uid) {
            let body_content_id = Utils.html_id(
                Utils.gen_id(self.get_id(), 'viewer_body', 'fund', 'fund_body'),
            );

            self._prepare_pdf({
                data: {
                    html: $(`#${body_content_id}`).html(),
                    uid: self.fund_uid(),
                    type: 'historic_fund',
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_pdf_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    });

    self.fund_family_query_filters = {
        type: 'dynamic',
        query: {
            same_family_as_uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.similar_funds_query_filters = {
        type: 'dynamic',
        query: {
            similar_to_uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.fund_family_timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            results_per_page: self.results_per_page,
            filters: self.fund_family_query_filters,
        },
    };

    self.similar_funds_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            results_per_page: 10,
            filters: self.similar_funds_query_filters,
        },
    };

    self.similar_funds_timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            results_per_page: 10,
            filters: self.similar_funds_query_filters,
        },
    };

    self.fund_family_benchmark_datasource = {
        type: 'dynamic',
        query: {
            target: 'benchmark',
            include_items: false,
            filters: self.fund_family_query_filters,
        },
    };

    self.similar_funds_benchmark_datasource = {
        type: 'dynamic',
        query: {
            target: 'benchmark',
            include_items: false,
            filters: self.similar_funds_query_filters,
        },
    };

    self.fund_summary_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund',
            uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.fund_family_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            results_per_page: 15,
            filters: self.fund_family_query_filters,
        },
    };

    self.fund_family_timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            results_per_page: self.results_per_page,
            filters: self.fund_family_query_filters,
        },
    };

    self.fund_breadcrumb = {
        id: 'fund_breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Historic Funds',
                link: '#!/funds',
            },
            {
                label_key: 'name',
                datasource: self.fund_summary_datasource,
            },
        ],
    };

    self.fund_header = {
        component: BreadcrumbHeader,
        id: 'fund_header',
        template: 'tpl_breadcrumb_header',
        css: {'sub-page-header': true},
        layout: {
            breadcrumb: 'fund_breadcrumb',
        },
        valid_export_features: ['download_market_data'],
        components: [self.fund_breadcrumb],
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        valid_export_features: ['download_market_data'],
        buttons: [
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
                datasource: self.gen_fund_datasource_config(),
                trigger_url: {
                    url: 'funds/<uid>/analytics',
                },
                buttons: [
                    {
                        label: 'Net Analytics',
                        component: ActionButton,
                        action: 'view_net_cashflows',
                        trigger_url: {
                            url: 'funds/<uid>/analytics/',
                        },
                        datasource: self.gen_fund_datasource_config(),
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
                        datasource: self.gen_fund_datasource_config(),
                    },
                ],
            },
            {
                id: 'peer_report',
                label: 'Peer Report <span class="glyphicon glyphicon-duplicate"></span>',
                action: 'peer_report',
                datasource: self.fund_summary_datasource,
                disabled_if_no_data: true,
                disabled_callback: function(data) {
                    return (
                        !data.cf_investor_uid ||
                        !data.target_size_value ||
                        !data.target_size_currency
                    );
                },
                hidden_callback: function() {
                    return !auth.user_has_feature('side_by_side_fbr');
                },
                trigger_modal: {
                    id: 'fund_wizard',
                    component: FundWizard,
                    reset_on_select: true,
                },
            },
            ...Utils.conditional_element(
                [
                    {
                        id: 'create_visual_report',
                        component: ActionButtons,
                        label: 'Create Visual Report <span class="icon-doc-text"></span>',
                        template: 'tpl_action_buttons_dropdown',
                        css: {btn: true, 'btn-transparent-success': true},
                        datasource: self.gen_fund_datasource_config(),
                        buttons: [
                            {
                                label: 'Deal Intelligence Report',
                                component: ActionButton,
                                action: 'create_deal_report',
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
        ],
    };

    let row_click_event = Utils.gen_event(
        'DataTable.click_row',
        self.get_id(),
        'viewer_body',
        'fund',
        'action_toolbar',
        'peer_report',
        'fund_wizard',
        'data_table',
    );

    Observer.register(row_click_event, entity => {
        pager.navigate(`#!/funds/${self.fund_uid()}/${entity.entity_uid}`);
    });

    self.fund_tab_views = [
        {
            label: 'Table',
            state: 'table',
            icon: {'icon-list-alt': true},
        },
        {
            label: 'Snapshot',
            state: 'snapshot',
            icon: {'icon-chart-bar': true},
        },
        {
            label: 'Timeseries',
            state: 'timeseries',
            icon: {'icon-chart-line': true},
        },
    ];

    self.similar_fund_tab_views = [
        {
            label: 'Table',
            state: 'table',
            icon: {'icon-list-alt': true},
        },
        {
            label: 'Snapshot',
            state: 'snapshot',
            icon: {'icon-chart-bar': true},
        },
        {
            label: 'Timeseries',
            state: 'timeseries',
            icon: {'icon-chart-line': true},
        },
        {
            label: 'Benchmark',
            state: 'benchmark',
            icon: {'icon-gauge': true},
        },
    ];

    self.fund_body = {
        component: Aside,
        id: 'fund_body',
        template: 'tpl_aside_body',
        layout: {
            body: [
                'separator',
                'metric_table',
                'number_boxes',
                'info_tables',
                'page_break',
                'fund_family_heading',
                'fund_family_tab_nav',
                'fund_family',
                'page_break',
                'similar_funds_heading',
                'similar_funds_tab_nav',
                'similar_funds',
                'page_break',
                'investors_heading',
                'investors',
            ],
        },
        components: [
            {
                id: 'separator',
                component: HTMLContent,
                html: '<div style="padding:15px;"></div>',
            },
            {
                id: 'page_break',
                component: HTMLContent,
                html: '<div class="page-break"></div>',
            },
            {
                component: MetricTable,
                id: 'metric_table',
                inline_data: true,
                css: {'table-light': true, 'metric-table': true},
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
                        label: 'Final Close',
                        value_key: 'final_close',
                        visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        format: 'backend_date',
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
                ],
                datasource: self.fund_summary_datasource,
            },
            {
                id: 'number_boxes',
                component: BaseComponent,
                template: 'tpl_flexible_number_box_row',
                layout: {
                    body: ['irr', 'multiple', 'dpi', 'gross_irr', 'gross_multiple'],
                },
                components: [
                    {
                        id: 'irr',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. IRR',
                        data_key: 'irr',
                        format: 'irr_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'multiple',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. TVPI',
                        data_key: 'multiple',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'dpi',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. DPI',
                        data_key: 'dpi',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'gross_irr',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Gross IRR',
                        data_key: 'gross_irr',
                        format: 'irr_highlight',
                        datasource: self.fund_summary_datasource,
                        visible_event: self.events.gross_irr,
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                        broadcast_data: true,
                    },
                    {
                        id: 'gross_multiple',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Gross Multiple',
                        data_key: 'gross_multiple',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                        visible_event: self.events.gross_multiple,
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                        broadcast_data: true,
                    },
                ],
            },
            {
                id: 'info_tables',
                component: Aside,
                template: 'tpl_aside_vertical_split',
                layout: {
                    left: 'fundraising_table',
                    right: 'other_table',
                },
                components: [
                    {
                        id: 'fundraising_table',
                        component: MetricTable,
                        title: 'Fundraising',
                        columns: 1,
                        inline_data: true,
                        css: {'table-light': true, 'metric-table': true},
                        template: 'tpl_metric_table',
                        metrics: [
                            {
                                label: 'Fundraising Status',
                                value_fn: function(data) {
                                    let target = Utils.extract_data('target_size_usd', data);
                                    let closed = Utils.extract_data('total_sold_usd', data);
                                    if (
                                        Utils.is_set(target) &&
                                        Utils.is_set(closed) &&
                                        target > 0
                                    ) {
                                        return closed / target;
                                    }
                                },
                                format: 'percent',
                            },
                            {
                                label: 'Fund Size',
                                format: 'money',
                                format_args: {
                                    currency_key: 'target_size_currency',
                                    value_key: 'target_size_value',
                                },
                            },
                            {
                                label: 'Amount Closed',
                                format: 'money',
                                format_args: {
                                    currency_key: 'total_sold_currency',
                                    value_key: 'total_sold_value',
                                },
                            },
                            {
                                label: 'Status',
                                value_key: 'status',
                            },
                        ],
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'other_table',
                        component: MetricTable,
                        title: 'Other',
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
                                value_key: 'gross_invested',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                            {
                                label: 'Gross Realized',
                                value_key: 'gross_realized',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                            {
                                label: 'Gross Unrealized',
                                value_key: 'gross_unrealized',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                        ],
                        datasource: self.fund_summary_datasource,
                    },
                ],
            },
            {
                id: 'fund_family_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Fund Family',
            },
            {
                id: 'fund_family_tab_nav',
                component: RadioButtons,
                template: 'tpl_radio_buttons_tabs',
                default_state: 'table',
                button_css: {
                    'btn-block': true,
                    'btn-transparent': true,
                },
                buttons: self.fund_tab_views,
            },
            {
                id: 'fund_family',
                component: FundPerformance,
                default_chart: 'table',
                fund_datasource: self.fund_summary_datasource,
                disable_snapshot_comps: true,
                table_columns: MarketInsightsHelper.fund_table_columns,
                table_datasource: self.fund_family_datasource,
                snapshot_datasource: {
                    ...self.fund_family_datasource,
                    key: 'results',
                },
                timeseries_datasource: self.fund_family_timeseries_datasource,
                select_chart: Utils.gen_event(
                    'RadioButtons.state',
                    self.get_id(),
                    'viewer_body',
                    'fund',
                    'fund_body',
                    'fund_family_tab_nav',
                ),
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Fund Family',
                    subtitle: 'CSV',
                },
            },
            {
                id: 'similar_funds_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Similar Funds',
            },
            {
                id: 'similar_funds_tab_nav',
                component: RadioButtons,
                template: 'tpl_radio_buttons_tabs',
                default_state: 'table',
                button_css: {
                    'btn-block': true,
                    'btn-transparent': true,
                },
                buttons: self.similar_fund_tab_views,
            },
            {
                id: 'similar_funds',
                component: FundPerformance,
                default_chart: 'table',
                fund_datasource: self.fund_summary_datasource,
                table_columns: MarketInsightsHelper.fund_table_columns,
                table_datasource: {
                    ...self.similar_funds_datasource,
                    key: 'results',
                },
                limit_table_to_one_page: true,
                snapshot_datasource: {
                    ...self.similar_funds_datasource,
                    key: 'results',
                },
                benchmark_datasource: self.similar_funds_benchmark_datasource,
                compset_datasource: self.similar_funds_datasource,
                timeseries_datasource: self.similar_funds_timeseries_datasource,
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Similar Funds',
                    subtitle: 'CSV',
                },
                select_chart: Utils.gen_event(
                    'RadioButtons.state',
                    self.get_id(),
                    'viewer_body',
                    'fund',
                    'fund_body',
                    'similar_funds_tab_nav',
                ),
            },
            {
                id: 'investors_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Investors',
            },
            {
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
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Investors',
                    subtitle: 'CSV',
                },
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'market_data:investments',
                        filters: {
                            type: 'dynamic',
                            query: {
                                fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.fund_uid,
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
            },
        ],
    };

    self.fund = {
        id: 'fund',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'fund_header',
            toolbar: 'action_toolbar',
            body: 'fund_body',
        },
        components: [self.fund_header, self.action_toolbar, self.fund_body],
    };

    self.body = self.new_instance(Aside, {
        id: 'viewer_body',
        template: 'tpl_aside_body',
        layout: {
            body: ['fund'],
        },
        components: [self.fund],
    });

    self.when(self.body, self.meta_data_datasource).done(() => {
        Observer.register(self.events.fund_uid, self.fund_uid);

        self.dfd.resolve();
    });

    return self;
}
