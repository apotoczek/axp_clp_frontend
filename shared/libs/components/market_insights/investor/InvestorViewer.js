import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import InvestorModel from 'src/libs/components/market_insights/investor/InvestorModel';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import Aside from 'src/libs/components/basic/Aside';
import InvestorAllocations from 'src/libs/components/charts/InvestorAllocations';
import DataTable from 'src/libs/components/basic/DataTable';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import MetricTable from 'src/libs/components/MetricTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import $ from 'jquery';
import pager from 'pager';
import config from 'config';
import auth from 'auth';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import FundWizard from 'src/libs/components/market_insights/investor/FundWizard';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';

class InvestorViewer extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.dfd = this.new_deferred();

        this.template = opts.template || 'tpl_market_insights_body';

        const investor_uid_event = opts.investor_uid_event;
        const user_fund_uid_event = opts.user_fund_uid_event;

        this.investor_uid = ko.observable();
        this.user_fund_uid = ko.observable();

        const tab_event = Utils.gen_event(
            'RadioButtons.state',
            this.get_id(),
            'body',
            'investor_body',
            'content',
            'tabs',
        );
        const register_export_id = Utils.gen_id(
            this.get_id(),
            'body',
            'investor_body',
            'action_toolbar',
            'export_actions',
        );
        const modeling_register_export_id = Utils.gen_id(
            this.get_id(),
            'body',
            'model_body',
            'model_action_toolbar',
            'export_actions',
        );

        const download_pdf_event = Utils.gen_event('Investors.download_pdf', this.get_id());
        const model_download_pdf_event = Utils.gen_event(
            'Investors.model_download_pdf',
            this.get_id(),
        );

        Observer.broadcast_for_id(
            register_export_id,
            'DynamicActions.register_action',
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: download_pdf_event,
            },
            true,
        );

        this._prepare_pdf = DataThing.backends.download({
            url: 'prepare_market_data_pdf',
        });

        this._prepare_investor_modeling_pdf = DataThing.backends.download({
            url: 'prepare_investor_modeling_pdf',
        });

        Observer.broadcast_for_id(
            modeling_register_export_id,
            'DynamicActions.register_action',
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: model_download_pdf_event,
            },
            true,
        );

        Observer.register(model_download_pdf_event, () => {
            let investor_uid = this.investor_uid();
            let user_fund_uid = this.user_fund_uid();

            if (investor_uid && user_fund_uid) {
                let body_content_id = Utils.html_id(
                    Utils.gen_id(
                        this.get_id(),
                        'body',
                        'model_body',
                        'model_body_content',
                        'investor_model',
                    ),
                );

                this._prepare_investor_modeling_pdf({
                    data: {
                        html: $(`#${body_content_id}`).html(),
                        width: $(`#${body_content_id}`).width(),
                        height: $(`#${body_content_id}`).height(),
                        investor_uid: investor_uid,
                        user_fund_uid: user_fund_uid,
                    },
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_pdf_base + key);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        });

        Observer.register(download_pdf_event, () => {
            let investor_uid = this.investor_uid();

            if (investor_uid) {
                let body_content_id = Utils.html_id(
                    Utils.gen_id(this.get_id(), 'body', 'investor_body', 'content'),
                );

                this._prepare_pdf({
                    data: {
                        html: $(`#${body_content_id}`).html(),
                        uid: investor_uid,
                        type: 'investor',
                    },
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_pdf_base + key);
                    }),
                    error: DataThing.api.XHRError(() => {}),
                });
            }
        });

        const investor_summary_datasource = {
            type: 'dynamic',
            mapping: 'clean_website',
            query: {
                target: 'market_data:investor',
                uid: {
                    type: 'observer',
                    event_type: investor_uid_event,
                    required: true,
                },
            },
        };

        const breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Investors',
                    link: '#!/investors',
                },
                {
                    datasource: investor_summary_datasource,
                    label_key: 'name',
                },
            ],
        };

        const information_table = {
            id: 'information_table',
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
                    label: 'Vintage Years',
                    value_key: 'vintage_year_display',
                },
                {
                    label: 'Commitment Sizes',
                    value_key: 'commitment_usd_display',
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
            datasource: investor_summary_datasource,
        };

        const tabs = {
            id: 'tabs',
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
                    label: 'Allocations',
                    state: 'allocations',
                    icon: {'icon-chart-bar': true},
                },
            ],
        };

        const investments_table = {
            component: DataTable,
            id: 'table',
            css: {'table-light': true, 'table-sm': true},
            columns: MarketInsightsHelper.investment_table_columns({include_investor: false}),
            register_export: {
                export_event_id: register_export_id,
                title: 'Investments',
                subtitle: 'CSV',
            },
            enable_column_toggle: true,
            enable_localstorage: true,
            enable_clear_order: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'market_data:investments',
                    filters: {
                        type: 'dynamic',
                        query: {
                            investor_uid: {
                                type: 'observer',
                                event_type: investor_uid_event,
                                required: true,
                            },
                        },
                    },
                },
            },
            dynamic_columns: [
                {
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'table_columns',
                            public_taxonomy: true,
                        },
                    },
                    placement: {
                        relative: 'Fund',
                        position: 'right',
                    },
                    visible: false,
                },
            ],
        };

        const investment_allocations = {
            component: InvestorAllocations,
            id: 'allocations',
            investor_uid_event: investor_uid_event,
        };

        const investor_components = [investments_table, investment_allocations];

        if (auth.user_has_features(['investor_contact'])) {
            const contact_table = this.new_instance(DataTable, {
                id: 'contact_table',
                css: {'table-light': true, 'table-sm': true},
                enable_selection: false,
                enable_column_toggle: true,
                enable_localstorage: true,
                enable_clear_order: true,
                columns: MarketInsightsHelper.investor_contact_table_columns,
                column_toggle_css: {'fixed-column-toggle': true},
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'investor_contacts',
                        filters: {
                            type: 'dynamic',
                            query: {
                                investor_uid: {
                                    type: 'observer',
                                    event_type: investor_uid_event,
                                    required: true,
                                },
                            },
                        },
                    },
                },
                results_per_page: 10,
            });

            investor_components.push(contact_table);

            tabs.buttons.push({
                label: 'Contacts',
                state: 'contact_table',
                icon: {'icon-list-alt': true},
            });
        }

        const investments_wrapper = {
            component: DynamicWrapper,
            id: 'investments_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'table',
            set_active_event: tab_event,
            components: investor_components,
        };

        const overview = {
            id: 'overview_content',
            component: BaseComponent,
            template: 'tpl_base_p',
            content_key: 'overview',
            datasource: investor_summary_datasource,
        };

        const overview_title = {
            id: 'overview_title',
            component: BaseComponent,
            template: 'tpl_base_h2',
            css: {'overview-title': true},
            heading: 'Investor Overview',
        };

        const investments_title = {
            id: 'investments_title',
            component: BaseComponent,
            template: 'tpl_base_h2',
            heading: 'Investments',
        };

        const overview_text_block = {
            id: 'overview_text_block',
            component: BaseComponent,
            template: 'tpl_aside_body',
            layout: {
                body: ['overview_title', 'overview_content'],
            },
            components: [overview, overview_title],
        };

        const overview_container = {
            id: 'overview_container',
            component: BaseComponent,
            css: {'top-padding': true},
            template: 'tpl_overview_container',
            layout: {
                body: ['overview_text_block', 'information_table'],
            },
            components: [information_table, overview_text_block],
        };

        const body_content = {
            id: 'content',
            component: Aside,
            template: 'tpl_aside_body',
            css: {'top-padding': true},
            layout: {
                body: [
                    'overview_container',
                    'page_break',
                    'investments_title',
                    'tabs',
                    'investments_wrapper',
                ],
            },
            components: [
                overview_container,
                investments_title,
                tabs,
                investments_wrapper,
                {
                    id: 'page_break',
                    component: HTMLContent,
                    html: '<div class="page-break"></div>',
                },
            ],
        };

        const model_body_content = {
            id: 'model_body_content',
            component: Aside,
            template: 'tpl_aside_body',
            css: {'top-padding': true},
            layout: {
                body: ['investor_model'],
            },
            components: [
                {
                    id: 'investor_model',
                    component: InvestorModel,
                    user_fund_uid_event: user_fund_uid_event,
                    investor_uid_event: investor_uid_event,
                },
            ],
        };

        const header = {
            component: BreadcrumbHeader,
            id: 'header',
            template: 'tpl_breadcrumb_header',
            css: {'sub-page-header': true},
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [breadcrumb],
            valid_export_features: ['download_market_data'],
        };

        const model_header = {
            component: BreadcrumbHeader,
            id: 'model_header',
            template: 'tpl_breadcrumb_header',
            css: {'sub-page-header': true},
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [
                {
                    id: 'breadcrumb',
                    component: Breadcrumb,
                    items: [
                        {
                            label: 'Investors',
                            link: '#!/investors',
                        },
                        {
                            datasource: investor_summary_datasource,
                            link_format: 'market_entity_url',
                            label_key: 'name',
                        },
                        {
                            label: 'Investor Modeling',
                        },
                    ],
                },
            ],
            valid_export_features: ['download_market_data'],
        };

        const action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
            buttons: [
                {
                    id: 'model_fund',
                    action: 'model_fund',
                    label: 'Investor Modeling <span class="glyphicon glyphicon-tasks"></span>',
                    hidden_callback: () => {
                        return !auth.user_has_feature('investor_modeling');
                    },
                },
            ],
        };

        const model_action_toolbar = {
            id: 'model_action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
        };

        const fund_wizard_modal = this.new_instance(FundWizard, {});

        const data_table_selected_event = Utils.gen_event(
            'DataTable.click_row',
            fund_wizard_modal.get_id(),
            'data_table',
        );

        Observer.register(
            Utils.gen_event(
                'ActionButton.action.model_fund',
                this.get_id(),
                'body',
                'investor_body',
                'action_toolbar',
                'model_fund',
            ),
            () => {
                fund_wizard_modal.show();
            },
        );

        Observer.register(data_table_selected_event, entity => {
            fund_wizard_modal.reset();
            pager.navigate(`#!/investors/${this.investor_uid()}/${entity.entity_uid}`);
        });

        const investor_body = {
            id: 'investor_body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'content',
            },
            components: [header, action_toolbar, body_content],
        };

        const model_body = {
            id: 'model_body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'model_header',
                toolbar: 'model_action_toolbar',
                body: 'model_body_content',
            },
            components: [model_header, model_action_toolbar, model_body_content],
        };

        this.body = this.new_instance(DynamicWrapper, {
            id: 'body',
            template: 'tpl_dynamic_wrapper',
            active_component: 'investor_body',
            components: [investor_body, model_body],
        });

        this.when(this.body).done(() => {
            this.dfd.resolve();

            Observer.register(user_fund_uid_event, uid => {
                if (uid && auth.user_has_feature('investor_modeling')) {
                    this.body.set_active_component('model_body');
                    this.user_fund_uid(uid);
                } else {
                    this.body.set_active_component('investor_body');
                    this.user_fund_uid(undefined);
                }
            });

            Observer.register(investor_uid_event, this.investor_uid);
        });

        return this;
    }
}

export default InvestorViewer;
