import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import MetricTable from 'src/libs/components/MetricTable';
import NumberBox from 'src/libs/components/basic/NumberBox';
import ActionButton from 'src/libs/components/basic/ActionButton';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper.js';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import FundPerformance from 'src/libs/components/market_insights/FundPerformance';
import pager from 'pager';
import Observer from 'src/libs/Observer';
import config from 'config';
import moment from 'moment';
import DataThing from 'src/libs/DataThing';
import {conditional_element} from 'src/libs/Utils';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import NetAnalytics from 'src/libs/components/analytics/NetAnalytics';
import GrossAnalytics from 'src/libs/components/analytics/GrossAnalytics';
import * as Utils from 'src/libs/Utils';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataSource from 'src/libs/DataSource';

class FundFamilyView extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();
        this.define_default_template(`
            <!-- ko renderComponent: page_wrapper --><!-- /ko -->
        `);
        this.events = this.new_instance(EventRegistry, {});

        this.events.new('page_state');
        this.events.resolve_and_add('download', 'ActionButton.action.download', 'download');
        this.events.resolve_and_add('set_family_tab_view', 'RadioButtons.state');
        this.events.resolve_and_add('family_data', 'DataSource.data');
        this.events.new('create_visual_report');
        this.events.new('analytics_family_uid');
        this.events.new('set_mode_event');

        this.family_uid_event = opts.family_uid_event;

        let hl_deployment = config.hl;

        const breadcrumb_datasource = {
            type: 'dynamic',
            query: {
                target: 'market_data:family',
                uid: {
                    type: 'observer',
                    event_type: this.events.get('analytics_family_uid'),
                    required: true,
                },
            },
        };

        const family_net_analytics = {
            id: 'family_net_analytics',
            component: NetAnalytics,
            entity_type: 'market_data_family',
            template: 'tpl_asides',
            market_data_family_uid_event: this.family_uid_event,
            set_mode_event: this.events.get('set_mode_event'),
            reset_event: this.events.get('analytics_family_uid'),
            breadcrumbs: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'name',
                    contextual_url: {
                        url: 'families/<uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label: 'Analytics (Net)',
                },
            ],
        };

        const family_gross_analytics = {
            id: 'family_gross_analytics',
            component: GrossAnalytics,
            entity_type: 'market_data_family',
            template: 'tpl_asides',
            market_data_family_uid_event: this.family_uid_event,
            set_mode_event: this.events.get('set_mode_event'),
            default_mode: 'fund_performance',
            disable_audit_trail: true,
            breadcrumbs: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'name',
                    contextual_url: {
                        url: 'families/<uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label: 'Analytics (Gross)',
                },
            ],
        };

        let investments = {
            component: DataTable,
            id: 'investments',
            columns: MarketInsightsHelper.investment_table_columns({
                include_investor: true,
                include_fund: true,
                investor_view: true,
            }),
            css: {
                'table-light': true,
                'table-sm': true,
            },
            empty_template: 'tpl_data_table_investors_empty',
            results_per_page: 15,
            visible_event: this.events.get('family_data'),
            visible_event_fn: MarketInsightsHelper.fund_has_dataset('cobalt'),
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'market_data:investments',
                    filters: {
                        type: 'dynamic',
                        query: {
                            family_uid: {
                                type: 'observer',
                                event_type: this.family_uid_event,
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

        let attachment = {
            component: DataTable,
            empty_template: 'tpl_data_table_empty_no_data',
            id: 'attachment',
            visible_event: this.events.get('family_data'),
            visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
            inline_data: true,
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Date Created',
                    key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Modified',
                    key: 'modified',
                    format: 'backend_date',
                },
                {
                    component_callback: 'data',
                    type: 'component',
                    width: '80px',
                    component: {
                        id: 'download',
                        id_callback: this.events.register_alias('download'),
                        hidden_callback: data => !data || !data.asset_uid,
                        component: ActionButton,
                        action: 'download',
                        label: 'Download',
                        css: {
                            'btn-ghost-default': true,
                            'btn-xs': true,
                        },
                    },
                },
            ],
            datasource: this.gen_family_datasource(data => data.attachment),
            css: {
                'table-light': true,
                'table-sm': true,
            },
        };

        let fund_family_breadcrumb = {
            id: 'fund_family_breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'name',
                    datasource: this.gen_family_datasource(),
                },
            ],
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
                    label: 'Avg. IRR',
                    data_key: 'avg_irr',
                    format: 'irr_highlight',
                    datasource: this.gen_family_datasource(),
                    id_callback: this.events.register_alias('family_data'),
                    broadcast_data: true,
                },
                {
                    id: 'dpi',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Avg. DPI',
                    data_key: 'avg_dpi',
                    format: 'multiple_neutral',
                    datasource: this.gen_family_datasource(),
                },
                {
                    id: 'tvpi',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Avg. TVPI',
                    data_key: 'avg_tvpi',
                    format: 'multiple_highlight',
                    datasource: this.gen_family_datasource(),
                },
                {
                    id: 'gross_irr',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Avg. Gross IRR',
                    data_key: 'avg_gross_irr',
                    format: 'irr_highlight',
                    datasource: this.gen_family_datasource(),
                    visible_event: this.events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                },
                {
                    id: 'gross_multiple',
                    component: NumberBox,
                    template: 'tpl_number_box',
                    label: 'Avg. Gross Multiple',
                    data_key: 'avg_gross_multiple',
                    format: 'multiple_highlight',
                    datasource: this.gen_family_datasource(),
                    visible_event: this.events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                },
            ],
        };

        let fund_family_header = {
            component: BreadcrumbHeader,
            id: 'fund_family_header',
            template: 'tpl_breadcrumb_header',
            css: {'sub-page-header': true},
            layout: {
                breadcrumb: 'fund_family_breadcrumb',
            },
            components: [fund_family_breadcrumb],
        };

        let fund_family_action_toolbar = {
            component: ActionHeader,
            id: 'fund_family_action_toolbar',
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
            buttons: [
                ...conditional_element(
                    [
                        {
                            id: 'create_visual_report',
                            component: ActionButtons,
                            label: 'Create Visual Report <span class="icon-doc-text"></span>',
                            template: 'tpl_action_buttons_dropdown',
                            css: {btn: true, 'btn-transparent-success:': true},
                            datasource: this.gen_family_datasource(),
                            buttons: [
                                {
                                    label: 'Deal Intelligence Report',
                                    component: ActionButton,
                                    action: 'create_deal_intelligence_report',
                                    disabled_callback: data => !data.has_gross_cashflows,
                                },
                            ],
                        },
                    ],
                    hl_deployment,
                ),
                {
                    id: 'view_cashflows',
                    component: ActionButtons,
                    label: 'View Cashflows for Family <span class="icon-chart-bar"></span>',
                    template: 'tpl_action_buttons_dropdown',
                    css: {
                        btn: true,
                        'btn-transparent-success': true,
                    },
                    buttons: [
                        {
                            label: 'Net Analytics',
                            component: ActionButton,
                            action: 'view_net_cashflows',
                            trigger_url: {
                                url: 'families/<uid>/net/analytics',
                            },
                            datasource: this.gen_family_datasource(),
                            disabled_callback: data => !data.has_net_cashflows,
                            disabled_if_no_data: true,
                        },
                        {
                            label: 'Gross Analytics',
                            component: ActionButton,
                            action: 'view_gross_cashflows',
                            trigger_url: {
                                url: 'families/<uid>/gross/analytics',
                            },
                            datasource: this.gen_family_datasource(),
                            disabled_callback: data => !data.has_gross_cashflows,
                            disabled_if_no_data: true,
                        },
                    ],
                },
            ],
        };

        let fund_family_body = {
            id: 'fund_family_body',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'family_name_heading',
                    'metric_table',
                    'number_boxes',
                    'other_table',
                    'attachment_heading',
                    'attachment',
                    'funds_in_family_heading',
                    'funds_in_family_tab_nav',
                    'funds_in_family',
                    'investments_heading',
                    'investments',
                ],
            },
            components: [
                {
                    id: 'family_name_heading',
                    component: BaseComponent,
                    id_callback: this.events.register_alias('family_name_heading'),
                    datasource: this.gen_family_datasource(),
                    template: 'tpl_family_heading',
                },
                this.gen_metric_table_config({id: 'metric_table'}),
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
                            value_key: 'avg_bison_pme_alpha',
                        },
                        {
                            label: 'Total Gross Invested',
                            format: 'money',
                            format_args: {
                                value_key: 'total_gross_invested',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                        {
                            label: 'Total Gross Realized',
                            format: 'money',
                            format_args: {
                                value_key: 'total_gross_realized',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                        {
                            label: 'Total Gross Unrealized',
                            format: 'money',
                            format_args: {
                                value_key: 'total_gross_unrealized',
                                currency_key: 'base_currency_symbol',
                            },
                            visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        },
                    ],
                    datasource: this.gen_family_datasource(),
                },
                {
                    id: 'funds_in_family_heading',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    heading: 'Funds in Family',
                },
                {
                    id: 'funds_in_family_tab_nav',
                    component: RadioButtons,
                    template: 'tpl_radio_buttons_tabs',
                    default_state: 'table',
                    id_callback: this.events.register_alias('set_family_tab_view'),
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
                },
                {
                    id: 'funds_in_family',
                    component: FundPerformance,
                    default_chart: 'table',
                    disable_snapshot_comps: true,
                    table_columns: MarketInsightsHelper.fund_family_table_columns,
                    select_chart: this.events.get('set_family_tab_view'),
                    limit_table_to_one_page: true,
                    table_datasource: this.gen_family_datasource(data => data.funds),
                    timeseries_datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'market_data:fund:timeseries',
                            results_per_page: 10,
                            filters: {
                                type: 'dynamic',
                                query: {
                                    family_uid: {
                                        type: 'observer',
                                        event_type: this.family_uid_event,
                                        required: true,
                                    },
                                },
                            },
                        },
                    },
                    snapshot_datasource: this.gen_family_datasource(data => data.funds),
                    metrics: [
                        {
                            value: 'irr',
                            label: 'IRR',
                            format: 'irr',
                        },
                        {
                            value: 'tvpi',
                            label: 'TVPI',
                            format: 'multiple',
                        },
                        {
                            value: 'dpi',
                            label: 'DPI',
                            format: 'multiple',
                        },
                    ],
                },
                {
                    id: 'investments_heading',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    heading: 'Investments',
                    visible_event: this.events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('cobalt'),
                },
                investments,
                {
                    id: 'attachment_heading',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    heading: 'Attached Document',
                    visible_event: this.events.get('family_data'),
                    visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                },
                attachment,
            ],
        };

        let body = {
            id: 'body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'fund_family_header',
                toolbar: 'fund_family_action_toolbar',
                body: 'fund_family_body',
            },
            components: [fund_family_header, fund_family_action_toolbar, fund_family_body],
        };

        const family_view = {
            id: 'family_view',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['body'],
            },
            components: [body],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'family_view',
            set_active_event: this.events.get('page_state'),
            components: [family_view, family_net_analytics, family_gross_analytics],
        });

        this.meta_data_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:meta_data',
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: this.family_uid_event,
                        required: true,
                    },
                },
            },
        });

        this._download_attachment = DataThing.backends.download({
            url: 'download_attachment',
        });

        this._create_visual_report = DataThing.backends.useractionhandler({
            url: 'create_visual_report',
        });

        Observer.register(this.events.get('download'), data => {
            if (data && data.asset_uid && data.uid) {
                this._download_attachment({
                    data: {
                        uid: data.uid,
                        asset_uid: data.asset_uid,
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
                'page_wrapper',
                'family_view',
                'body',
                'fund_family_action_toolbar',
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
                            entity_uid: data.market_data_family_uid,
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

        this.handle_url = function(url) {
            Utils.match_array(
                url,
                [
                    'families',
                    /.+/,
                    'net',
                    'analytics',
                    (uid, mode) => {
                        Observer.broadcast(this.events.get('page_state'), 'family_net_analytics');
                        Observer.broadcast(this.events.get('analytics_family_uid'), uid, true);
                        Observer.broadcast(
                            this.events.get('set_mode_event'),
                            VehicleHelper.url_to_mode(mode) || 'overview',
                        );
                    },
                ],
                [
                    'families',
                    /.+/,
                    'gross',
                    'analytics',
                    (uid, mode) => {
                        Observer.broadcast(this.events.get('page_state'), 'family_gross_analytics');
                        Observer.broadcast(this.events.get('analytics_family_uid'), uid, true);
                        Observer.broadcast(
                            this.events.get('set_mode_event'),
                            VehicleHelper.url_to_mode(mode) || 'fund_performance',
                        );
                    },
                ],
                [
                    'families',
                    /.+/,
                    uid => {
                        Observer.broadcast(this.events.get('page_state'), 'family_view');
                        Observer.broadcast(this.family_uid_event, uid);
                    },
                ],
            );
        };
        this.when(this.page_wrapper, this.meta_data_datasource).done(() => {
            Observer.register_hash_listener('families', url => {
                this.handle_url(url);
            });
            dfd.resolve();
        });
    }

    gen_family_datasource(mapping, mapping_args) {
        return {
            type: 'dynamic',
            mapping: mapping,
            mapping_args: mapping_args,
            query: {
                target: 'market_data:family',
                uid: {
                    type: 'observer',
                    event_type: this.family_uid_event,
                    required: true,
                },
            },
        };
    }

    aggregate_metric(funds, key, subkey) {
        let agg = {};
        funds.forEach(fund => {
            if (subkey) {
                agg[fund[key][subkey]] = agg[fund[key][subkey]] ? agg[fund[key][subkey]] + 1 : 1;
            } else {
                agg[fund[key]] = agg[fund[key]] ? agg[fund[key]] + 1 : 1;
            }
        });

        let sorted_metrics = [];
        Object.keys(agg).forEach(metric => {
            sorted_metrics.push({value: metric, count: agg[metric]});
        });
        sorted_metrics.sort((a, b) => {
            return b.count - a.count;
        });

        if (sorted_metrics.length <= 1) {
            // if all metrics have the same value, don't format the string
            return sorted_metrics[0].value;
        }
        let formatted_metrics = '';
        sorted_metrics.forEach(metric => {
            formatted_metrics += `${metric.value} (${metric.count})` + ', ';
        });
        formatted_metrics = formatted_metrics.substr(0, formatted_metrics.length - 2); //trim trailing comma
        return formatted_metrics;
    }

    vintage_interval(funds, key) {
        let max = 0;
        let min = Number.MAX_SAFE_INTEGER;
        if (funds.length > 1) {
            funds.forEach(fund => {
                if (fund[key]) {
                    min = fund[key] < min ? fund[key] : min;
                    max = fund[key] > max ? fund[key] : max;
                }
            });
            return `${min} - ${max}`;
        } else if (funds.length == 1) {
            return funds[0][key];
        }
        return undefined;
    }

    gen_metric_table_config({id, metrics}) {
        return {
            component: MetricTable,
            id: id,
            inline_data: true,
            css: {'table-light': true},
            template: 'tpl_metric_table_multi_col',
            columns: 2,
            metrics: metrics || [
                {
                    label: 'Firm',
                    value_key: 'aggregate_firm',
                },
                {
                    label: 'Location',
                    value_key: 'aggregate_location',
                },
                {
                    label: 'First Close',
                    value_key: 'first_close',
                    format: 'backend_date',
                    visible: MarketInsightsHelper.fund_has_dataset('hl'),
                },
                {
                    label: 'Final Close',
                    value_key: 'final_close',
                    format: 'backend_date',
                    visible: MarketInsightsHelper.fund_has_dataset('hl'),
                },
                {
                    label: 'Vintage Year',
                    value_key: 'aggregate_vintage_year',
                },
                {
                    label: 'Geography',
                    value_key: 'aggregate_geography',
                    format: 'strings_full',
                },
                {
                    label: 'Style / Focus',
                    value_key: 'aggregate_style',
                    format: 'strings_full',
                },
                {
                    label: 'Sector',
                    value_key: 'aggregate_sector',
                    format: 'strings_full',
                },
            ],
            datasource: this.gen_family_datasource(data => {
                return {
                    ...data,
                    aggregate_firm: this.aggregate_metric(data.funds, 'firm_name'),
                    aggregate_location: this.aggregate_metric(data.funds, 'location'),
                    aggregate_vintage_year: this.vintage_interval(data.funds, 'vintage_year'),
                    aggregate_geography: this.aggregate_metric(data.funds, 'enums', 'geography'),
                    aggregate_style: this.aggregate_metric(data.funds, 'enums', 'style'),
                    aggregate_sector: this.aggregate_metric(data.funds, 'enums', 'sector'),
                };
            }),
        };
    }
}

export default FundFamilyView;
