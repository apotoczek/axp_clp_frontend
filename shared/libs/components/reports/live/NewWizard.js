/* Automatically transformed from AMD to ES6. Beware of code smell. */
import SelectCompEntity from 'src/libs/components/reports/live/SelectCompEntity';
import SelectFund from 'src/libs/components/reports/live/SelectFund';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ko from 'knockout';
import pager from 'pager';
import Aside from 'src/libs/components/basic/Aside';
import DataThing from 'src/libs/DataThing';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

export default function(opts, components) {
    /************************************************************
     *
     *    Currently enabled reports for this wizard:
     *
     *    Peer Report:    #!/wizard/peer-report
     *    LP Insider:     #!/wizard/lp-insider
     *
     ************************************************************/

    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_live_report_wizard_start_body';

    self.select_fund_event = Utils.gen_event('LiveWizard.select_fund', self.get_id());
    self.select_comp_event = Utils.gen_event('LiveWizard.select_comp', self.get_id());

    self.selected_fund_uid = ko.observable();
    self.selected_comp_fund_uid = ko.observable();
    self.selected_investor_uid = ko.observable();
    self.report_type_name = ko.observable();

    self.events = self.new_instance(EventRegistry, {});

    self.events.new('report_user_fund_uid');
    self.events.new('report_comp_fund_uid');
    self.events.new('report_comp_investor_uid');
    self.report_user_fund_uid = Observer.observable(self.events.get('report_user_fund_uid'));
    self.report_comp_fund_uid = Observer.observable(self.events.get('report_comp_fund_uid'));
    self.report_comp_investor_uid = Observer.observable(
        self.events.get('report_comp_investor_uid'),
    );

    self.events.new('data_selection_event');

    self.events.new('active_view');

    let active_view_event = self.events.get('active_view');

    self.comp_type = ko.observable();

    self.report_events = opts.events;

    self.header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        origin_url: '#!/fund-modeler',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        css: {'sub-page-header': true},
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
                        label: ko.pureComputed(() => {
                            let report_type = self.report_type_name();
                            if (report_type === 'peer-report') {
                                return 'Peer Report';
                            } else if (report_type === 'lp-insider') {
                                return 'LP Report';
                            }
                        }),
                    },
                    {
                        label: 'Wizard',
                    },
                ],
            },
        ],
    };

    self.content = {
        id: 'content',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        set_active_event: active_view_event,
        components: [
            {
                id: 'net_fund',
                component: SelectFund,
                select_fund_event: self.select_fund_event,
            },
            {
                id: 'comp_fund',
                component: SelectCompEntity,
                select_fund_event: self.select_fund_event,
                select_comp_event: self.select_comp_event,
                limit_entity_type: 'fund',
                events: self.report_events,
            },
            {
                id: 'investor',
                component: SelectCompEntity,
                select_fund_event: self.select_fund_event,
                select_comp_event: self.select_comp_event,
                limit_entity_type: 'investor',
                events: self.report_events,
            },
        ],
    };

    self.body = self.new_instance(Aside, {
        id: 'wizard_body',
        template: 'tpl_new_wizard_body',
        layout: {
            header: 'header',
            // wizard_step_bar: 'wizard_step_bar',
            body: 'content',
        },
        components: [
            self.header,
            // self.wizard_step_bar,
            self.content,
        ],
    });
    self._record_fund_model = DataThing.backends.useractionhandler({
        url: 'record_fund_modeler_report',
    });

    self.when(self.body).done(() => {
        Observer.register(self.select_fund_event, fund => {
            if (fund && fund.entity_uid) {
                self.selected_fund_uid(fund.entity_uid);

                if (self.report_type_name() == 'peer-report') {
                    Observer.broadcast(active_view_event, 'comp_fund');
                } else if (self.report_type_name() == 'lp-insider') {
                    Observer.broadcast(active_view_event, 'investor');
                }
            }
        });

        Observer.register(self.select_comp_event, payload => {
            if (payload && payload.data && payload.data.uid) {
                self.selected_comp_fund_uid(payload.data.uid);

                let report_url = `#!/fund-modeler/view/${self.comp_type()}/${self.selected_fund_uid()}/${self.selected_comp_fund_uid()}`;

                pager.navigate(report_url);
            }
        });

        Observer.register_hash_listener('wizard', () => {
            let report_type = window.location.href.split('#!/wizard/')[1];

            self.selected_fund_uid(undefined);
            self.selected_comp_fund_uid(undefined);

            switch (report_type) {
                case 'peer-report':
                    self.comp_type('fund');
                    self.report_type_name(report_type);
                    Observer.broadcast(active_view_event, 'net_fund');
                    break;
                case 'lp-insider':
                    self.comp_type('investor');
                    self.report_type_name(report_type);
                    Observer.broadcast(active_view_event, 'net_fund');
                    break;
                default:
                    pager.navigate('');
            }
        });

        self.dfd.resolve();
    });

    return self;
}
