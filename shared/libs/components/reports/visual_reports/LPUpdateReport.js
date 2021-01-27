/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TimeWeightedBreakdown from 'src/libs/components/reports/visual_reports/TimeWeightedBreakdown';
import PeerBenchmark from 'src/libs/components/reports/visual_reports/PeerBenchmark';
import SideBySide from 'src/libs/components/reports/visual_reports/SideBySide';
import PME from 'src/libs/components/reports/visual_reports/PME';
import FundOverviewCallouts from 'src/libs/components/reports/visual_reports/FundOverviewCallouts';
import NumberBox from 'src/libs/components/reports/visual_reports/NumberBox';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import LayoutEngine from 'src/libs/components/reports/visual_reports/LayoutEngine';
import config from 'config';
import bison from 'bison';
import Report from 'src/libs/components/reports/visual_reports/base/Report';
import Editor from 'src/libs/components/reports/visual_reports/base/Editor';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Wizard from 'src/libs/components/reports/visual_reports/base/Wizard';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new Report(opts, components);

    self.sub_type = 'lp_update';
    self.__class__ = 'LPUpdateReport';

    let _dfd = self.new_deferred();

    self.events.new('user_fund_uid');
    self.events.new('preview');
    self.events.new('disable_preview');
    self.events.new('edit');
    self.events.new('download_pdf');

    self.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');

    self.events.new('side_by_side_count');
    self.events.new('peer_benchmark_count');

    self.layout_event = Utils.gen_event('CalculateLayout', self.get_id());

    self.tvpi_momentum_text =
        'TVPI momentum measures the velocity of a fund’s ' +
        'net multiple over the past three years.';
    self.cashflow_overview_text =
        'The overview summarizes the primary performance' + ' metrics for your fund.';
    self.pme_text = "PME compares your fund's performance to a public market index.";
    self.side_by_side_text =
        'Side by side compares your funds performance ' + 'against your close peers.';
    self.peer_benchmark_text =
        "Peer benchmark plots your fund's ranking against " + 'the benchmark data set.';
    self.time_weighted_breakdown_text =
        "Horizon Returns analyzes the fund's TWRR " + 'and IRR over different time periods.';

    /*********************************************************
     *                      Components                        *
     *********************************************************/
    const post_date_navs_button = [];
    if (config.enable_roll_forward_ui) {
        post_date_navs_button.push(
            self.helpers.cpanel.boolean_button({
                id: 'post_date_navs',
                label: 'Roll Forward NAVs',
            }),
        );
    }
    self.benchmark_provider = Observer.observable(
        self.events.resolve_event('benchmark_provider', 'PopoverButton.value'),
    );

    self.editor_cpanel_components = [
        self.helpers.cpanel.label({
            id: 'settings_label',
            label: 'Settings',
        }),
        self.helpers.cpanel.as_of_date({
            id: 'as_of_date',
            user_fund_uid_event: self.events.get('user_fund_uid'),
        }),
        ...post_date_navs_button,
        self.helpers.cpanel.currency_radiolist({
            id: 'render_currency',
            user_fund_uid_event: self.events.get('user_fund_uid'),
        }),
        self.helpers.cpanel.label({
            id: 'pme_label',
            label: 'PME',
        }),
        self.helpers.cpanel.start_date({
            id: 'horizon',
            user_fund_uid_event: self.events.get('user_fund_uid'),
            as_of_date_event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
        }),
        self.helpers.cpanel.index_radiolist({
            id: 'pme_index',
            user_fund_uid_event: self.events.get('user_fund_uid'),
        }),
        self.helpers.cpanel.label({
            id: 'peer_benchmark_label',
            label: 'Peer Benchmark',
        }),
        self.helpers.cpanel.meta_info({
            id: 'peer_benchmark_meta_info',
            label: 'Peer Set Size',
            datasource: {
                type: 'observer',
                event_type: self.events.get('peer_benchmark_count'),
            },
        }),
        self.helpers.cpanel.benchmark_provider({
            id: 'benchmark_provider',
        }),
        self.helpers.cpanel.benchmark({
            id: 'benchmark',
            provider_event: self.events.resolve_event('benchmark_provider', 'PopoverButton.value'),
        }),
        self.helpers.cpanel.currency_radiolist({
            id: 'benchmark_currency',
            visible_callback: () => {
                let provider = self.benchmark_provider();

                if (provider && provider.value == 'Hamilton Lane') {
                    return true;
                }

                return false;
            },
        }),
        self.helpers.cpanel.peer_filters({
            id: 'peer_benchmark_filters',
            label: 'Peer Filters',
        }),
        self.helpers.cpanel.label({
            id: 'side_by_side_label',
            label: 'Side by side',
        }),
        self.helpers.cpanel.meta_info({
            id: 'side_by_side_meta_info',
            label: 'Peer Set Size',
            datasource: {
                type: 'observer',
                event_type: self.events.get('side_by_side_count'),
            },
        }),
        self.helpers.cpanel.order_by({
            id: 'sort_peer_set',
            label: 'Sort Peer Set',
            datasource: [
                {
                    label: 'IRR',
                    value: 'irr',
                },
                {
                    label: 'TVPI',
                    value: 'multiple',
                },
                {
                    label: 'DPI',
                    value: 'dpi',
                },
            ],
        }),
        self.helpers.cpanel.peer_filters({
            id: 'side_by_side_filters',
            label: 'Peer Filters',
            include_lists: true,
        }),
    ];

    self.editor_layout = {
        id: 'layout',
        component: LayoutEngine,
        mode: 'edit',
        header: 'fund_meta_data',
        layout: [
            'cashflow_overview_wrapper',
            'tvpi_momentum_wrapper',
            'pme_wrapper',
            'time_weighted_breakdown_wrapper',
            'peer_wrapper',
            'side_by_side_wrapper',
        ],
        components: [
            {
                id: 'fund_meta_data',
                component: ReportComponentWrapper,
                allow_description: false,
                can_hide: false,
                save_event: self.events.get('save_draft'),
                widget_config: {
                    id: 'fund_meta_data',
                    component: ReportMeta,
                    logo_id: 'report_logo',
                    title_id: 'report_name',
                    description: `
                            Customize your title and logo, hit preview,
                            and then export your full-color report.
                        `,
                    datasources: {
                        params: {
                            type: 'observer',
                            event_types: {
                                logo_src: {
                                    event_type: Utils.gen_event(
                                        'ImageCropper.chosen_image',
                                        self.get_id(),
                                        'editor',
                                        'report_logo',
                                    ),
                                },
                            },
                        },
                    },
                },
            },
            {
                id: 'tvpi_momentum_wrapper',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'TVPI Momentum Score',
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                size: ['quarter'],
                caption: {
                    text_body_provider: self.tvpi_momentum_text,
                },
                meta_data_events: [
                    {
                        name: 'As of date',
                        event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
                    },
                ],
                widget_config: {
                    component: NumberBox,
                    id: 'tvpi_momentum',
                    format: 'irr_neutral',
                    data_key: 'tvpi_momentum',
                    template: 'tpl_report_tvpi_momentum_box',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle',
                            user_fund_uid: {
                                type: 'observer',
                                required: 'true',
                                event_type: self.events.get('user_fund_uid'),
                            },
                            as_of_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'as_of_date',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                        },
                    },
                },
            },
            {
                id: 'cashflow_overview_wrapper',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Cashflow Overview',
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                size: ['quarter', 'half'],
                templates: {
                    quarter: 'tpl_fund_overview_callouts',
                    half: 'tpl_fund_overview_callouts_full',
                },
                caption: {
                    text_body_provider: self.cashflow_overview_text,
                },
                meta_data_events: [
                    {
                        name: 'As of date',
                        event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
                    },
                ],
                widget_config: {
                    component: FundOverviewCallouts,
                    id: 'cashflow_overview',
                    irr_label: 'IRR',
                    css_style: {margin: '0px 0px'},
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle',
                            user_fund_uid: {
                                type: 'observer',
                                required: 'true',
                                event_type: self.events.get('user_fund_uid'),
                            },
                            as_of_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'as_of_date',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                        },
                    },
                },
            },
            {
                id: 'pme_wrapper',
                allow_description: true,
                component: ReportComponentWrapper,
                title: 'PME',
                size: ['quarter', 'half'],
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                caption: {
                    text_body_provider: self.pme_text,
                },
                meta_data_events: [
                    {
                        name: 'As of date',
                        event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
                    },
                ],
                widget_config: {
                    id: 'pme',
                    component: PME,
                    template: 'tpl_visual_report_pme',
                    // "dependencies": [Utils.gen_id(self.get_id(), 'cpanel', 'as_of_date'), Utils.gen_id(self.get_id(), 'cpanel', 'pme_index')],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:pme',
                            as_of_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'as_of_date',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            start_date: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'horizon',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            post_date_navs: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'post_date_navs',
                                    'BooleanButton.state',
                                ),
                                default: true,
                            },
                            user_fund_uid: {
                                type: 'observer',
                                event_type: self.events.get('user_fund_uid'),
                                required: true,
                            },
                            market_id: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'pme_index',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            render_currency: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'render_currency',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                        },
                    },
                },
            },
            {
                id: 'side_by_side_wrapper',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Side by Side',
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                size: ['half'],
                caption: {
                    text_body_provider: self.side_by_side_text,
                },
                meta_data_events: [
                    {
                        name: 'As of date',
                        event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
                    },
                ],
                widget_config: {
                    id: 'side_by_side',
                    component: SideBySide,
                    template: 'tpl_visual_report_side_by_side',
                    meta_event: self.events.get('side_by_side_count'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'market_data:funds',
                            results_per_page: 10,
                            order_by: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'sort_peer_set',
                                    'PopoverButton.value',
                                ),
                            },
                            filters: self.helpers.datasource.peer_filters({
                                user_fund_uid_event: self.events.get('user_fund_uid'),
                                prefix: 'side_by_side_filters',
                                extra_filters: {
                                    as_of_date: {
                                        type: 'observer',
                                        event_type: self.events.resolve_event(
                                            'as_of_date',
                                            'PopoverButton.value',
                                        ),
                                        required: true,
                                    },
                                },
                            }),
                        },
                    },
                    compset: {
                        comps: [
                            {
                                color: '#4D4D4D',
                                mapping: 'vehicle_to_market_data',
                                datasource: {
                                    type: 'dynamic',
                                    query: {
                                        target: 'vehicle',
                                        as_of_date: {
                                            mapping: 'get_value',
                                            type: 'observer',
                                            event_type: self.events.resolve_event(
                                                'as_of_date',
                                                'PopoverButton.value',
                                            ),
                                            required: true,
                                        },
                                        post_date_navs: {
                                            type: 'observer',
                                            event_type: self.events.resolve_event(
                                                'post_date_navs',
                                                'BooleanButton.state',
                                            ),
                                            default: true,
                                        },
                                        user_fund_uid: {
                                            type: 'observer',
                                            event_type: self.events.get('user_fund_uid'),
                                            required: true,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                id: 'peer_wrapper',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Peer Benchmark',
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                size: ['half'],
                caption: {
                    text_body_provider: self.peer_benchmark_text,
                },
                meta_data_events: [
                    {
                        name: 'Benchmark',
                        event: self.events.resolve_event('benchmark', 'PopoverButton.value'),
                    },
                    {
                        name: 'Provider',
                        event: self.events.resolve_event(
                            'benchmark_provider',
                            'PopoverButton.value',
                        ),
                    },
                ],
                widget_config: {
                    id: 'peer',
                    component: PeerBenchmark,
                    height: 300,
                    meta_event: self.events.get('peer_benchmark_count'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'peer_benchmark',
                            benchmark_edition_uid: {
                                type: 'observer',
                                mapping: 'get',
                                event_type: self.events.resolve_event(
                                    'benchmark',
                                    'PopoverButton.value',
                                ),
                                required: true,
                            },
                            currency_id: {
                                mapping: 'get_value',
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'benchmark_currency',
                                    'PopoverButton.value',
                                ),
                            },
                            filters: self.helpers.datasource.peer_filters({
                                user_fund_uid_event: self.events.get('user_fund_uid'),
                                prefix: 'peer_benchmark_filters',
                            }),
                            include_items: false,
                        },
                    },
                    compset: {
                        comps: [
                            {
                                color: '#61C38C',
                                mapping: 'vehicle_to_market_data',
                                datasource: {
                                    type: 'dynamic',
                                    query: {
                                        target: 'vehicle',
                                        as_of_date: {
                                            mapping: 'get_value',
                                            type: 'observer',
                                            event_type: self.events.resolve_event(
                                                'as_of_date',
                                                'PopoverButton.value',
                                            ),
                                            required: true,
                                        },
                                        post_date_navs: {
                                            type: 'observer',
                                            event_type: self.events.resolve_event(
                                                'post_date_navs',
                                                'BooleanButton.state',
                                            ),
                                            default: true,
                                        },
                                        user_fund_uid: {
                                            type: 'observer',
                                            event_type: self.events.get('user_fund_uid'),
                                            required: true,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                id: 'time_weighted_breakdown_wrapper',
                component: ReportComponentWrapper,
                allow_description: true,
                title: 'Time Horizon Returns',
                save_event: self.events.get('save_draft'),
                layout_event: self.layout_event,
                size: ['quarter', 'half'],
                caption: {
                    text_body_provider: self.time_weighted_breakdown_text,
                },
                meta_data_events: [
                    {
                        name: 'As of date',
                        event: self.events.resolve_event('as_of_date', 'PopoverButton.value'),
                    },
                ],
                widget_config: {
                    id: 'time_weighted_breakdown',
                    component: TimeWeightedBreakdown,
                    hide_label: true,
                    base_query: {
                        as_of_date: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'as_of_date',
                                'PopoverButton.value',
                            ),
                            required: true,
                        },
                        user_fund_uid: {
                            type: 'observer',
                            event_type: self.events.get('user_fund_uid'),
                            required: true,
                        },
                        render_currency: {
                            mapping: 'get_value',
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'render_currency',
                                'PopoverButton.value',
                            ),
                            required: true,
                        },
                        post_date_navs: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'post_date_navs',
                                'BooleanButton.state',
                            ),
                            default: true,
                        },
                    },
                },
            },
        ],
    };

    self.viewer_layout = {
        id: 'layout',
        template: 'tpl_report_layout_engine_faux_page',
        mode: 'view',
        component: LayoutEngine,
        header: 'fund_meta_data',
        layout: [
            'cashflow_overview_wrapper',
            'tvpi_momentum_wrapper',
            'pme_wrapper',
            'time_weighted_breakdown_wrapper',
            'peer_wrapper',
            'side_by_side_wrapper',
        ],
        components: [
            {
                id: 'fund_meta_data',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    id: 'fund_meta_data',
                    report: self.report,
                    template: 'tpl_lp_update_report_header',
                    component: ReportMeta,
                    data_map: {
                        logo_src: {
                            key: 'params:logo_src',
                        },
                    },
                },
            },
            {
                id: 'cashflow_overview_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Cashflow Overview',
                allow_description: true,
                layout_event: self.layout_event,
                size: ['quarter', 'half'],
                templates: {
                    half: 'tpl_fund_overview_callouts',
                    full: 'tpl_fund_overview_callouts_full',
                },
                caption: {
                    text_body_provider: self.cashflow_overview_text,
                },
                widget_config: {
                    component: FundOverviewCallouts,
                    id: 'cashflow_overview',
                    irr_label: 'IRR',
                    css_style: {margin: '20px 0'},
                },
            },
            {
                id: 'pme_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'PME',
                size: ['quarter', 'half'],
                allow_description: true,
                layout_event: self.layout_event,
                caption: {
                    text_body_provider: self.pme_text,
                },
                widget_config: {
                    component: PME,
                    id: 'pme',
                    template: 'tpl_visual_report_pme',
                    hide_dropdown: true,
                    css_style: {'remove-hr': true},
                },
            },
            {
                id: 'side_by_side_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Side by Side',
                allow_description: true,
                layout_event: self.layout_event,
                size: ['half'],
                caption: {
                    text_body_provider: self.side_by_side_text,
                },
                widget_config: {
                    component: SideBySide,
                    id: 'side_by_side',
                    template: 'tpl_visual_report_side_by_side',
                    hide_dropdown: true,
                },
            },
            {
                id: 'peer_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Peer Benchmark',
                allow_description: true,
                size: ['half'],
                layout_event: self.layout_event,
                caption: {
                    text_body_provider: self.peer_benchmark_text,
                },
                widget_config: {
                    component: PeerBenchmark,
                    id: 'peer',
                    chart_height: 300,
                },
            },
            {
                id: 'time_weighted_breakdown_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Time Horizon Returns',
                allow_description: true,
                size: ['quarter', 'half'],
                layout_event: self.layout_event,
                caption: {
                    text_body_provider: self.time_weighted_breakdown_text,
                },
                widget_config: {
                    component: TimeWeightedBreakdown,
                    id: 'time_weighted_breakdown',
                    chart_height: 300,
                    hide_label: true,
                },
            },
            {
                id: 'tvpi_momentum_wrapper',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'TVPI Momentum Score',
                allow_description: true,
                layout_event: self.layout_event,
                size: ['quarter'],
                caption: {
                    text_body_provider: self.tvpi_momentum_text,
                },
                widget_config: {
                    component: NumberBox,
                    id: 'tvpi_momentum',
                    format: 'irr_neutral',
                    data_key: 'tvpi_momentum',
                    template: 'tpl_report_tvpi_momentum_box',
                },
            },
        ],
    };

    self.editor = self.new_instance(Editor, {
        id: 'editor',
        report: self.report,
        save_event: self.events.get('save_draft'),
        cpanel: {
            id: 'cpanel',
            components: self.editor_cpanel_components,
        },
        body: {
            layout_engine: self.editor_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
            }),
            toolbar: self.helpers.body.editor_toolbar({
                preview_event: self.events.get('preview'),
                disable_event: self.events.get('disable_preview'),
                start_disabled: true,
            }),
        },
    });

    self.viewer = self.new_instance(Viewer, {
        id: 'viewer',
        report: self.report,
        body: {
            layout_engine: self.viewer_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
                css: {'sub-page-header': true},
            }),
            toolbar: self.helpers.body.viewer_toolbar({
                edit_event: self.events.get('edit'),
                report: self.report,
                disable_export_until_frozen: false,
            }),
        },
    });

    self.wizard = self.new_instance(Wizard, {
        id: 'wizard',
        breadcrumb_label: 'Performance Dashboard',
        callback: function(entity) {
            self.create_report(entity, report => {
                self.report(report);
                self.navigate('edit', report);
            });
        },
    });

    self.when(self.editor, self.viewer, self.wizard).done(() => {
        Observer.broadcast(
            self.events.get('register_export'),
            {
                title: 'Report',
                subtitle: 'PDF',
                event_type: self.events.get('download_pdf'),
            },
            true,
        );

        Observer.register(self.events.get('download_pdf'), () => {
            let report = self.report();
            let download_url = `${config.api_base_url}download/${report.report_type}/pdf/${report.uid}`;
            if (!report.is_frozen || !report.binary_asset_uid) {
                self.publish_report(() => {
                    DataThing.form_post(download_url);
                });
            } else {
                DataThing.form_post(download_url);
            }
        });

        Observer.register(self.events.get('edit'), () => {
            self.navigate('edit', self.report());
        });

        Observer.register(self.events.get('preview'), () => {
            let updates = self.editor.get_full_snapshot();
            self.editor.loading(true);
            self.update_report(updates, report => {
                self.editor.loading(false);
                self.navigate('view', report);
            });
        });

        Observer.register(self.events.get('save_draft'), () => {
            let updates = self.editor.get_static_snapshot();

            self.update_report(updates, () => {
                bison.utils.Notify(
                    'Draft Saved!',
                    '',
                    'alert-success',
                    1500,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 200px; text-align: center; position: absolute; top: 33px; left: 50%; margin-left: 50px;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            });
        });

        self.report.subscribe(self.broadcast_uid);

        self.set_state(self.initial_state);

        self.editor.body_loading.subscribe(loading => {
            Observer.broadcast(self.events.get('disable_preview'), loading);
        });

        _dfd.resolve();
    });

    return self;
}
