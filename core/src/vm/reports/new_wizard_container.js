/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NewWizard from 'src/libs/components/reports/live/NewWizard';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

export default function() {
    let self = new Context({
        id: 'wizard',
    });

    /*********************************************************
     *                    Variables                          *
     *********************************************************/

    self.dfd = self.new_deferred();

    self.events = self.new_instance(EventRegistry, {});
    self.events.new('report_user_fund_uid');
    self.events.new('report_comp_fund_uid');
    self.events.new('report_comp_investor_uid');
    // self.events.new('page_state');
    // self.active_step = Observer.observable(self.events.get('wizard_step'));

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            // set_active_event: self.events.get('page_state'),
            active_component: 'new_wizard',
            components: [
                {
                    id: 'new_wizard',
                    component: NewWizard,
                    events: self.events,
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

    self.when(self.page_wrapper).done(() => {
        self.dfd.resolve();
    });

    return self;
}
