/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TemplatePreview from 'src/libs/components/reports/TemplatePreview';
import TemplateSelector from 'src/libs/components/reports/TemplateSelector';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import TipsModal from 'src/libs/components/reports/visual_reports/TipsModal';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import DataTable from 'src/libs/components/basic/DataTable';
import ButtonList from 'src/libs/components/reports/visual_reports/ButtonList';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = 'tpl_render_full_body';

    self.events = self.new_instance(EventRegistry, {});

    self.events.new('preview');
    self.events.new('copy_report');
    self.events.new('confirm_delete');
    self.events.new('generate_report');
    self.events.resolve_and_add('');

    self._delete_report = DataThing.backends.useractionhandler({
        url: 'delete_visual_report',
    });

    self._copy_report = DataThing.backends.useractionhandler({
        url: 'copy_visual_report',
    });

    self.templates = [
        {
            id: 'lp_update',
            enabled: true,
            name: 'Performance Dashboard',
            description:
                "A customizable snapshot view of your fund's performance at any point in time",
            preview_img: require('src/img/monitor_performance_dashboard.png'),
            features: [
                'Net Performance Overview',
                'PME',
                'Point in Time',
                'Peer Benchmark',
                'Peer Side by Side',
                'Momentum Analysis',
            ],
        },
        {
            id: 'deal_report',
            enabled: true,
            name: 'Deal Intelligence Report',
            description:
                "Powerful portfolio insights into your fund's performance on a deal-by-deal basis.",
            preview_img: require('src/img/monitor_deal_report.png'),
            features: [
                'Gross Performance Overview',
                'Deal Analysis',
                'Operational Performance',
                'Valuation Bridge',
                'Risk Analysis',
            ],
        },
        // {
        //     id: 'lp_prospect_meeting',
        //     enabled: false,
        //     name: 'LP Prospect Meeting',
        //     description: 'Highlight the metrics that will tell your story as a manager to LPs.',
        //     preview_img: require('src/img/Monitor_LP_update.png'),
        //     features: [
        //         'Risk Return Profile',
        //         'Historical Fund Performance with Portfolio Value Drivers',
        //         'Historical Fund Performance with PME outperformance',
        //         'Peer Benchmark',
        //         'Point in Time'
        //     ]
        // },
        // {
        //     id: 'deal_update',
        //     enabled: false,
        //     name: 'Anual Meeting Prep / Deal Update',
        //     description: 'Provides a market overview for a presentation or highlight a deal for a capital call notice.',
        //     preview_img: require('src/img/Monitor_LP_update.png'),
        //     features: [
        //         'Deal Scoring',
        //         'Deal Attribution Analysis',
        //         'Momentum Analysis',
        //         'Risk Return Analysis'
        //     ]
        // },
        // {
        //     id:'internal_ir',
        //     enabled: false,
        //     name:'Internal IR & MD Fund Planning',
        //     description:'Pull together the data that you need for your internal strategy session.',
        //     preview_img:require('src/img/Monitor_LP_update.png'),
        //     features: [
        //         'Risk Return Analysis',
        //         'Forward Calendar',
        //         'LP Allocations',
        //         'PME Analysis',
        //         'Market Insights Visualizations'
        //     ]
        // },
        // {
        //     id:'competitor_analysis',
        //     enabled: false,
        //     name:'Competitor<br/>Analysis',
        //     description:'Know which firms you are competing with and understand how to differentiate your fund from the rest of the pack.',
        //     preview_img:require('src/img/Monitor_LP_update.png'),
        //     features:[
        //         'Bison Fund analysis of competitors',
        //         'Fund Family returns of peers',
        //         'Peer Benchmarking',
        //         'LP Portfolio Fit',
        //         'LP Portfolio Analysis',
        //         'PME'
        //     ]
        // }
    ];

    if (auth.user_has_feature('portfolio_update_report')) {
        self.templates.push({
            id: 'portfolio_update',
            enabled: true,
            name: 'Portfolio Update',
            description: 'Portfolio Update Report',
            preview_img: require('src/img/Monitor_LP_update.png'),
            features: ['Fund Overview', 'Portfolio Details', 'Company Details'],
        });
    }

    if (auth.user_has_feature('data_admin')) {
        self.templates.push({
            id: 'fbr',
            enabled: true,
            name: 'FBR',
            description: 'Fund Benchmark Report',
            preview_img: require('src/img/Monitor_LP_update.png'),
            features: [
                'Benchmarking',
                'Value Growth',
                'Peer Tracking',
                'Fund Management',
                'Risk Exposure',
                'Fund Overview',
                'Portfolio Details',
                'Company Details',
            ],
        });
    }

    if (auth.user_has_feature('fund_screening_report')) {
        self.templates.push({
            id: 'fund_screening',
            enabled: true,
            name: 'Fund Screening Report',
            description: 'Fund Screening Report',
            preview_img: require('src/img/Monitor_LP_update.png'),
            features: [
                'Fund Overview',
                'Benchmarking',
                'Value Growth',
                'Peer Tracking',
                'Fund Management',
            ],
        });
    }

    self.reports_downloads = {
        component: ButtonList,
        id: 'reports_downloads',
        datasource: {
            type: 'dynamic',
            query: {
                target: 'visual_reports',
                results_per_page: 50,
                filters: {
                    only_published: true,
                },
            },
        },
    };

    self.reports_table = {
        component: DataTable,
        id: 'reports_table',
        enable_localstorage: true,
        enable_clear_order: true,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_no_visual_reports',
        row_key: 'uid',
        results_per_page: 15,
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                format: 'report_draft',
                format_args: {
                    base_url: '#!/visual-reports',
                    label_key: 'name',
                    published_key: 'is_frozen',
                },
            },
            {
                label: 'Type',
                key: 'sub_type',
                format: 'enumeration',
                format_args: {
                    mapping: {
                        fbr: 'FBR',
                        lp_update: 'LP Update',
                    },
                },
            },
            // {
            //     label: 'Created',
            //     key: 'created',
            //     format: 'backend_date',
            // },
            {
                label: 'Modified',
                key: 'modified',
                format: 'backend_date',
            },
            // {
            //     label: 'Finished',
            //     key: 'frozen_date',
            //     format: 'backend_date',
            // },
            {
                label: 'Actions',
                width: '1%',
                component_callback: 'data',
                component: {
                    id: 'actions',
                    component: ActionButtons,
                    template: 'tpl_action_buttons',
                    id_callback: self.events.register_alias('table_actions'),
                    buttons: [
                        // {
                        //     label: 'Copy',
                        //     action: 'copy',
                        //     css: { 'btn-xs': true, 'btn-default': true}
                        // },
                        {
                            label: 'Delete',
                            action: 'delete',
                            css: {'btn-ghost-default': true, 'btn-xs': true},
                        },
                    ],
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'visual_reports',

                filters: {
                    only_unpublished: true,
                },
            },
        },
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['header', 'report_template_selector', 'template_preview', 'reports_container'],
        },
        components: [
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                buttons: [
                    {
                        id: 'tips',
                        label: 'How to Use <span class="glyphicon glyphicon-info-sign"></span>',
                        trigger_modal: {
                            component: TipsModal,
                        },
                    },
                ],
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Visual Reports',
                            },
                            {
                                label: 'Start',
                            },
                        ],
                    },
                ],
            },
            {
                id: 'report_template_selector',
                component: TemplateSelector,
                templates: self.templates,
                preview_event: self.events.get('preview'),
                header_text: 'Select report type to get started:',
            },
            {
                id: 'template_preview',
                component: TemplatePreview,
                templates: self.templates,
                preview_event: self.events.get('preview'),
                generate_report_event: self.events.get('generate_report'),
            },
            {
                id: 'reports_container',
                component: Aside,
                template: 'tpl_reports_start_body_container',
                layout: {
                    reports: 'reports_table',
                    downloads: 'reports_downloads',
                },
                components: [self.reports_table, self.reports_downloads],
            },
        ],
    });

    self.confirm_delete_modal = self.new_instance(ConfirmDeleteModal, {
        id: 'confirm_delete_modal',
        text: 'Are you sure you want to delete this report?',
        confirm_delete_event: self.events.get('confirm_delete'),
    });

    self.when(self.confirm_delete_modal, self.body).done(() => {
        Observer.register(
            self.events.resolve_event('table_actions', 'ActionButtons.action.delete'),
            payload => {
                self.confirm_delete_modal.payload(payload);
                self.confirm_delete_modal.show();
            },
        );

        Observer.register(self.events.get('confirm_delete'), payload => {
            if (payload) {
                self._delete_report({
                    data: {uid: payload.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
            }
        });

        Observer.register(
            self.events.resolve_event('table_actions', 'ActionButtons.action.copy'),
            data => {
                self._copy_report({
                    data: {uid: data.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
            },
        );

        self.dfd.resolve();
    });

    return self;
}
