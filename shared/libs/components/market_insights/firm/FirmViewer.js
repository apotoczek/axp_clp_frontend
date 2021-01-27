/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import FundPerformance from 'src/libs/components/market_insights/FundPerformance';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import MetricTable from 'src/libs/components/MetricTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import FundDetails from 'src/libs/components/market_insights/FundDetails';
import ActionButton from 'src/libs/components/basic/ActionButton';
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';

    self.firm_uid_event = opts.firm_uid_event;
    self.firm_uid = ko.observable();
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );
    self.cpanel_id = opts.cpanel_id;

    self.download_pdf_event = Utils.gen_event('Firms.download_pdf', self.get_id());

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

    Observer.register(self.download_pdf_event, () => {
        let firm_uid = self.firm_uid();

        if (firm_uid) {
            let body_content_id = Utils.html_id(Utils.gen_id(self.get_id(), 'body', 'content'));

            self._prepare_pdf({
                data: {
                    html: $(`#${body_content_id}`).html(),
                    uid: self.firm_uid(),
                    type: 'firm',
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_pdf_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    });

    self.funds_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            filters: {
                type: 'dynamic',
                query: {
                    firm_uid: {
                        type: 'observer',
                        event_type: self.firm_uid_event,
                        required: true,
                    },
                },
            },
        },
    };

    self.fund_table_columns = [
        {
            label: 'Name',
            sort_key: 'name',
            format: 'entity_link',
            format_args: {
                url: 'funds.uid',
            },
        },
        {
            label: 'Vintage',
            key: 'vintage_year',
            type: 'numeric',
            first_sort: 'desc',
        },
        {
            label: 'Geography',
            key: 'geography',
        },
        {
            label: 'Style',
            key: 'style',
        },
        {
            label: 'First Close',
            key: 'first_close',
            first_sort: 'desc',
            format: 'backend_date',
            visible: false,
        },
        {
            label: 'Amt Closed',
            first_sort: 'desc',
            sort_key: 'total_sold_usd',
            format: 'money',
            format_args: {
                currency_key: 'total_sold_currency',
                value_key: 'total_sold_value',
            },
        },
        {
            label: 'Fund Size',
            first_sort: 'desc',
            sort_key: 'target_size_usd',
            format: 'money',
            format_args: {
                currency_key: 'target_size_currency',
                value_key: 'target_size_value',
            },
        },
        {
            label: 'Paid In %',
            first_sort: 'desc',
            key: 'picc',
            format: 'percent',
            type: 'numeric',
            visible: false,
        },
        {
            label: 'IRR',
            key: 'irr',
            first_sort: 'desc',
            type: 'numeric',
            format: 'irr',
        },
        {
            label: 'TVPI',
            key: 'multiple',
            first_sort: 'desc',
            type: 'numeric',
            format: 'multiple',
        },
        {
            label: 'DPI',
            key: 'dpi',
            first_sort: 'desc',
            type: 'numeric',
            format: 'multiple',
        },
        {
            label: 'RVPI',
            key: 'rvpi',
            first_sort: 'desc',
            type: 'numeric',
            format: 'multiple',
            visible: false,
        },

        {
            label: 'PME Alpha',
            key: 'bison_pme_alpha',
            first_sort: 'desc',
            format: 'percent',
        },
        {
            label: 'As of Date',
            key: 'as_of_date',
            format: 'backend_date',
            first_sort: 'desc',
        },
        {
            component_callback: 'data',
            label: 'Details',
            always_visible: true,
            component: {
                component: ActionButton,
                label: 'Details',
                css: {
                    'btn-ghost-default': true,
                    'btn-xs': true,
                },
                trigger_modal: {
                    id: 'details_modal',
                    close_on_url_change: true,
                    component: FundDetails,
                    columns: MarketInsightsHelper.investment_table_columns({
                        include_investor: true,
                        investor_view: true,
                        include_fund: false,
                    }),
                },
            },
        },
    ];

    self.timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            filters: {
                type: 'dynamic',
                query: {
                    firm_uid: {
                        type: 'observer',
                        event_type: self.firm_uid_event,
                        required: true,
                    },
                },
            },
        },
    };

    self.firm_summary_datasource = {
        type: 'dynamic',
        mapping: 'clean_website',
        query: {
            target: 'market_data:firm',
            uid: {
                type: 'observer',
                event_type: self.firm_uid_event,
                required: true,
            },
        },
    };

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Firms',
                link: '#!/firms',
            },
            {
                datasource: self.firm_summary_datasource,
                label_key: 'name',
            },
        ],
    };

    self.information_table = {
        id: 'table',
        component: MetricTable,
        css: {
            'table-light': true,
            'multi-line-data': true,
            'metric-table': true,
        },
        template: 'tpl_metric_table_multi_col',
        columns: 1,
        metrics: [
            {
                label: 'Geography',
                value_key: 'enums:geography',
                format: 'weighted_strings',
            },
            {
                label: 'Style / Focus',
                value_key: 'enums:style',
                format: 'weighted_strings',
            },
            {
                label: 'Sector',
                value_key: 'enums:sector',
                format: 'weighted_strings',
            },
            {
                label: 'Fund Sizes',
                value_key: 'target_size_usd_display',
            },
            {
                label: 'Location',
                value_key: 'location',
            },
            {
                label: 'Website',
                value_key: 'website',
                format: 'external_link',
                format_args: {
                    truncate_length: 40,
                },
            },
        ],
        datasource: self.firm_summary_datasource,
    };

    self.funds_title = {
        id: 'funds_title',
        component: BaseComponent,
        template: 'tpl_base_h2',
        heading: 'Funds',
    };

    self.tabs = {
        id: 'fund_tabs',
        default_state: 'table',
        component: RadioButtons,
        template: 'tpl_radio_buttons_tabs',
        button_css: {
            'btn-block': true,
            'btn-transparent': true,
        },
        buttons: [
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
        ],
    };

    self.funds = {
        id: 'fund_performance',
        component: FundPerformance,
        default_chart: 'table',
        firm_uid_event: self.firm_uid_event,
        table_columns: MarketInsightsHelper.fund_table_columns,
        snapshot_datasource: {
            ...self.funds_datasource,
            key: 'results',
        },
        timeseries_datasource: self.timeseries_datasource,
        table_datasource: self.funds_datasource,
        select_chart: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'body',
            'content',
            'fund_tabs',
        ),
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Funds',
            subtitle: 'CSV',
        },
    };

    self.overview_text_block = {
        component: BaseComponent,
        id: 'overview_text_block',
        template: 'tpl_aside_body',
        layout: {
            body: ['firm_overview_title', 'firm_overview_content'],
        },
        components: [
            {
                id: 'firm_overview_title',
                component: BaseComponent,
                template: 'tpl_base_h2',
                css: {'overview-title': true},
                heading: 'Firm Overview',
            },
            {
                id: 'firm_overview_content',
                component: BaseComponent,
                template: 'tpl_base_p',
                content_key: 'overview',
                datasource: self.firm_summary_datasource,
            },
        ],
    };

    self.overview_container = {
        component: BaseComponent,
        id: 'overview_container',
        css: {'top-padding': true},
        template: 'tpl_overview_container',
        layout: {
            body: ['overview_text_block', 'table'],
        },
        components: [self.information_table, self.overview_text_block],
    };

    self.body_content = {
        id: 'content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: [
                'overview_container',
                'page_break',
                'funds_title',
                'fund_tabs',
                'fund_performance',
            ],
        },
        components: [
            self.overview_container,
            self.funds_title,
            self.tabs,
            self.funds,
            {
                id: 'page_break',
                component: HTMLContent,
                html: '<div class="page-break"></div>',
            },
        ],
    };

    self.body_layout = {
        header: 'header',
        toolbar: 'action_toolbar',
        body: 'content',
    };

    self.header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        css: {'sub-page-header': true},
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
        buttons: [],
        valid_export_features: ['download_market_data'],
    };

    self.action_toolbar = {
        component: ActionHeader,
        id: 'action_toolbar',
        template: 'tpl_action_toolbar',
        valid_export_features: ['download_market_data'],
        buttons: [],
    };

    self.body_components = [self.header, self.action_toolbar, self.body_content];

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_body',
        layout: self.body_layout,
        components: self.body_components,
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();

        Observer.register(self.firm_uid_event, self.firm_uid);
    });

    return self;
}
