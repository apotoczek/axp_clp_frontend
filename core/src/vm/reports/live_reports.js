/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ReportArchive from 'src/libs/components/reports/live/ReportArchive';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Aside from 'src/libs/components/basic/Aside';
import Wizard from 'src/libs/components/reports/live/Wizard';
import $ from 'jquery';
import pager from 'pager';
import config from 'config';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataThing from 'src/libs/DataThing';
import FundReportViewer from 'src/libs/components/market_insights/fund/FundReportViewer';
import InvestorModel from 'src/libs/components/market_insights/investor/InvestorModel';

export default function() {
    let self = new Context({
        id: 'fund-modeler',
    });

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    self.dfd = self.new_deferred();

    self.events = self.new_instance(EventRegistry, {});
    self.events.new('report_user_fund_uid');
    self.events.new('report_comp_fund_uid');
    self.events.new('report_comp_investor_uid');
    self.events.new('report_comp_type');
    self.events.new('page_state');
    self.events.new('finish_wizard');
    self.events.new('wizard_step');

    self.report_user_fund_uid = Observer.observable(self.events.get('report_user_fund_uid'));
    self.report_comp_fund_uid = Observer.observable(self.events.get('report_comp_fund_uid'));
    self.report_comp_investor_uid = Observer.observable(
        self.events.get('report_comp_investor_uid'),
    );

    self.investor_modeling_register_export_id = Utils.gen_id(
        self.get_id(),
        'page_wrapper',
        'investor_model_body_content',
        'action_toolbar',
        'export_actions',
    );
    self.investor_model_download_pdf_event = Utils.gen_event(
        'Investor.model_download_pdf',
        self.get_id(),
    );
    self.fund_modeling_register_export_id = Utils.gen_id(
        self.get_id(),
        'page_wrapper',
        'fund_model_body_content',
        'action_toolbar',
        'export_actions',
    );
    self.fund_model_download_pdf_event = Utils.gen_event('Fund.model_download_pdf', self.get_id());

    self.active_step = Observer.observable(self.events.get('wizard_step'));

    self.report_download_uid = null;

    self._record_fund_model = DataThing.backends.useractionhandler({
        url: 'record_fund_modeler_report',
    });

    self._prepare_fund_modeler_pdf = DataThing.backends.useractionhandler({
        url: 'prepare_fund_modeler_pdf',
    });

    Observer.broadcast_for_id(
        self.investor_modeling_register_export_id,
        'DynamicActions.register_action',
        {
            title: 'Current Page',
            subtitle: 'PDF',
            event_type: self.investor_model_download_pdf_event,
        },
        true,
    );

    Observer.broadcast_for_id(
        self.fund_modeling_register_export_id,
        'DynamicActions.register_action',
        {
            title: 'Current Page',
            subtitle: 'PDF',
            event_type: self.fund_model_download_pdf_event,
        },
        true,
    );

    Observer.register(self.investor_model_download_pdf_event, () => {
        self._prepare_fund_modeler_pdf({
            data: {
                uid: self.report_download_uid,
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    });

    Observer.register(self.fund_model_download_pdf_event, () => {
        self._prepare_fund_modeler_pdf({
            data: {
                uid: self.report_download_uid,
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    });

    self.models = {
        fund_model: self.new_instance(FundReportViewer, {
            id: 'fund_model',
            body_only: true,
            events: {
                user_fund_uid: self.events.get('report_user_fund_uid'),
                fund_uid: self.events.get('report_comp_fund_uid'),
            },
        }),
        investor_model: self.new_instance(InvestorModel, {
            id: 'investor_model',
            user_fund_uid_event: self.events.get('report_user_fund_uid'),
            investor_uid_event: self.events.get('report_comp_investor_uid'),
        }),
    };

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            set_active_event: self.events.get('page_state'),
            components: [
                {
                    component: Wizard,
                    id: 'wizard',
                    events: self.events,
                    finish_wizard_event: self.events.get('finish_wizard'),
                    wizard_step_event: self.events.get('wizard_step'),
                },
                {
                    id: 'investor_model_body_content',
                    component: Aside,
                    template: 'tpl_aside_body',
                    css: {'top-padding': true},
                    layout: {
                        body: ['header', 'action_toolbar', 'investor_model'],
                    },
                    components: [
                        {
                            component: BreadcrumbHeader,
                            id: 'header',
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
                                            label: 'Reports',
                                            link: '#!/reports',
                                        },
                                        {
                                            label: 'Visual Reports',
                                        },
                                        {
                                            label: 'LP Report',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            component: ActionHeader,
                            id: 'action_toolbar',
                            template: 'tpl_action_toolbar',
                            css: {'sub-page-header': true},
                            buttons: [],
                        },
                    ],
                },
                {
                    id: 'fund_model_body_content',
                    component: Aside,
                    template: 'tpl_aside_body',
                    css: {'top-padding': true},
                    layout: {
                        body: ['header', 'action_toolbar', 'fund_model'],
                    },
                    components: [
                        {
                            component: BreadcrumbHeader,
                            id: 'header',
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
                                            label: 'Reports',
                                            link: '#!/reports',
                                        },
                                        {
                                            label: 'Visual Reports',
                                        },
                                        {
                                            label: 'Peer Report',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            component: ActionHeader,
                            id: 'action_toolbar',
                            template: 'tpl_action_toolbar',
                            css: {'sub-page-header': true},
                            buttons: [],
                        },
                    ],
                },
                {
                    component: ReportArchive,
                    id: 'archive',
                    template: 'tpl_body_no_layout',
                },
            ],
        },
        self.models,
    );

    self.reset = function() {
        Observer.broadcast(self.events.get('report_user_fund_uid'), undefined);
        Observer.broadcast(self.events.get('report_comp_fund_uid'), undefined);
        Observer.broadcast(self.events.get('report_comp_investor_uid'), undefined);
    };

    self.handle_url = function(url) {
        if (url && url.length === 1) {
            pager.navigate('#!/fund-modeler/wizard/start');
            Observer.broadcast(self.events.get('page_state'), 'wizard');
        } else if (url.length === 3 && url[1] == 'wizard') {
            Observer.broadcast(self.events.get('page_state'), 'wizard');
            let step = url[2];
            if (step == 'start' || (step == 'select_comp' && self.report_user_fund_uid())) {
                Observer.broadcast(self.events.get('wizard_step'), step);
            } else {
                Observer.broadcast(self.events.get('wizard_step'), 'start');
                pager.navigate('#!/fund-modeler/wizard/start');
            }
        } else if (url.length === 4 && url[1] === 'wizard' && url[2] === 'select_comp') {
            Observer.broadcast(self.events.get('page_state'), 'wizard');
            let step = url[2];
            Observer.broadcast(self.events.get('wizard_step'), step);
            Observer.broadcast(self.events.get('report_user_fund_uid'), url[3]);
        } else if (url.length === 5 && url[1] === 'wizard' && url[3] === 'select_fund') {
            Observer.broadcast(self.events.get('page_state'), 'wizard');
            let step = url[3];
            let entity_type = url[2];
            let event_key = `report_comp_${entity_type}_uid`;
            Observer.broadcast(self.events.get('wizard_step'), step);
            Observer.broadcast(self.events.get(event_key), url[4]);
        } else if (url.length === 5 && url[1] == 'view') {
            Observer.broadcast(self.events.get('report_user_fund_uid'), url[3]);

            if (url[2] == 'investor') {
                Observer.broadcast(self.events.get('report_comp_investor_uid'), url[4]);

                setTimeout(() => {
                    Observer.broadcast(
                        self.events.get('page_state'),
                        'investor_model_body_content',
                    );
                }, 200);

                self.models.investor_model.callback_when_done(() => {
                    let html_id = Utils.html_id(self.models.investor_model.get_id());

                    self._record_fund_model({
                        data: {
                            entity_type: 'investor',
                            user_fund_uid: url[3],
                            comp_entity_uid: url[4],
                            html: $(`#${html_id}`).html(),
                            width: $(`#${html_id}`).width(),
                            height: $(`#${html_id}`).height(),
                        },
                        success: DataThing.api.XHRSuccess(res => {
                            self.report_download_uid = res.uid;
                        }),
                    });
                });
            } else if (url[2] == 'fund') {
                Observer.broadcast(self.events.get('report_comp_fund_uid'), url[4]);

                setTimeout(() => {
                    Observer.broadcast(self.events.get('page_state'), 'fund_model_body_content');
                }, 200);

                self.models.fund_model.callback_when_done(() => {
                    let html_id = Utils.html_id(
                        Utils.gen_id(self.models.fund_model.get_id(), 'viewer', 'body', 'layout'),
                    );

                    self._record_fund_model({
                        data: {
                            entity_type: 'fund',
                            user_fund_uid: url[3],
                            comp_entity_uid: url[4],
                            html: $(`#${html_id}`).html(),
                            width: $(`#${html_id}`).width(),
                            height: $(`#${html_id}`).height(),
                        },
                        success: DataThing.api.XHRSuccess(res => {
                            self.report_download_uid = res.uid;
                        }),
                    });
                });
            }
        } else if (url.length === 2 && url[1] == 'archive') {
            Observer.broadcast(self.events.get('page_state'), 'archive');
        } else {
            pager.navigate('#!/fund-modeler/wizard/start');
            self.reset();
        }
    };

    self.when(self.page_wrapper).done(() => {
        Observer.register(self.events.get('finish_wizard'), comp_type => {
            let report_url = `#!/fund-modeler/view/${comp_type}/${self.report_user_fund_uid()}/${
                comp_type == 'fund' ? self.report_comp_fund_uid() : self.report_comp_investor_uid()
            }`;

            pager.navigate(report_url);
        });

        Observer.register_hash_listener('fund-modeler', url => {
            return self.handle_url(url);
        });

        Observer.register(self.events.get('wizard_step'), step => {
            if (step !== 'select_fund') {
                if (step !== 'select_comp') {
                    pager.navigate(`#!/fund-modeler/wizard/${step}`);
                }
            }
        });

        self.dfd.resolve();
    });

    return self;
}
