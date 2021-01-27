/* Automatically transformed from AMD to ES6. Beware of code smell. */
import GenerateReport from 'src/libs/components/reports/live/GenerateReport';
import SelectCompEntity from 'src/libs/components/reports/live/SelectCompEntity';
import SelectFund from 'src/libs/components/reports/live/SelectFund';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import WizardStepBar from 'src/libs/components/reports/live/WizardStepBar';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ko from 'knockout';
import pager from 'pager';
import Aside from 'src/libs/components/basic/Aside';
import DataThing from 'src/libs/DataThing';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_live_report_wizard_start_body';

    self.select_fund_event = Utils.gen_event('LiveWizard.select_fund', self.get_id());
    self.select_comp_event = Utils.gen_event('LiveWizard.select_comp', self.get_id());
    self.wizard_step_event = opts.wizard_step_event;
    self.generate_report_event = Utils.gen_event('LiveWizard.generate_report', self.get_id());
    self.finish_wizard_event = opts.finish_wizard_event;
    self.selected_fund = ko.observable();
    self.selected_comp = ko.observable();

    self.report_events = opts.events;

    self.header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        origin_url: '#!/fund-modeler',
        title: 'Live Reports',
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
                        label: 'Live Reports',
                        link: '#!/fund-modeler',
                    },
                    {
                        label: 'Wizard',
                    },
                ],
            },
        ],
    };

    self.wizard_step_bar = {
        id: 'wizard_step_bar',
        component: WizardStepBar,
        step_event: self.wizard_step_event,
        starting_step: 'start',
        steps: [
            {
                step: 'start',
                number: 1,
                text: 'Select a fund in your portfolio.',
                css: {'step-one': true},
            },
            {
                step: 'select_comp',
                number: 2,
                text: 'Search for investors and peers active in your space.',
                css: {'step-two': true},
            },
            {
                step: 'finish',
                number: 3,
                text: 'View and download your finished report.',
                css: {'step-three': true},
            },
        ],
    };

    self.content = {
        id: 'content',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        active_component: 'start',
        set_active_event: self.wizard_step_event,
        components: [
            {
                id: 'start',
                component: SelectFund,
                select_fund_event: self.select_fund_event,
            },
            {
                id: 'select_comp',
                component: SelectCompEntity,
                select_fund_event: self.select_fund_event,
                select_comp_event: self.select_comp_event,
                events: self.report_events,
            },
            {
                id: 'select_fund',
                component: SelectFund,
                select_fund_event: self.select_fund_event,
                events: self.report_events,
                from_dashboard: true,
            },
            {
                id: 'finish',
                component: GenerateReport,
                select_fund_event: self.select_fund_event,
                select_comp_event: self.select_comp_event,
                generate_report_event: self.generate_report_event,
            },
        ],
    };

    self.body = self.new_instance(Aside, {
        id: 'wizard_body',
        template: 'tpl_wizard_body',
        layout: {
            header: 'header',
            wizard_step_bar: 'wizard_step_bar',
            body: 'content',
        },
        components: [self.header, self.wizard_step_bar, self.content],
    });

    self._record_fund_model = DataThing.backends.useractionhandler({
        url: 'record_fund_modeler_report',
    });

    self.handle_url = function(url) {
        if (url) {
            if (url.length === 5 && url[3] === 'select_fund') {
                self.drop_in_entity_type = url[2];
                self.drop_in_entity_uid = url[4];
            }
        }
    };

    self.when(self.body).done(() => {
        Observer.register_hash_listener('fund-modeler', url => {
            return self.handle_url(url);
        });

        Observer.register(self.select_fund_event, fund => {
            self.selected_fund(fund);
            if (fund.from_dashboard && self.drop_in_entity_type) {
                let report_url = `#!/fund-modeler/view/${self.drop_in_entity_type}/${fund.user_fund_uid}/${self.drop_in_entity_uid}`;

                pager.navigate(report_url);
            } else {
                pager.navigate(`#!/fund-modeler/wizard/select_comp/${fund.user_fund_uid}`);
            }
        });

        Observer.register(self.select_comp_event, payload => {
            let comp = payload.data;
            let comp_type = payload.type;

            self.selected_comp(comp);

            if (comp_type == 'fund') {
                Observer.broadcast(self.report_events.get('report_comp_fund_uid'), comp.uid);
            } else if (comp_type == 'investor') {
                Observer.broadcast(self.report_events.get('report_comp_investor_uid'), comp.uid);
            }

            Observer.broadcast(self.finish_wizard_event, comp_type);
        });

        Observer.register(self.generate_report_event, () => {
            Observer.broadcast(self.finish_wizard_event, true);
        });

        self.dfd.resolve();
    });

    return self;
}
