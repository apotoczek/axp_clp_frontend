import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ProvisionalFundView from 'src/libs/components/diligence/ProvisionalFundView';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Observer from 'src/libs/Observer';

class ProvisionalFundVM extends Context {
    constructor() {
        super({id: 'provisional-fund'});
        this.dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});
        this.events.new('provisional_fund');
        this.events.new('page_state');
        this.events.new('project_uid');

        let form = {
            id: 'provisional_fund',
            component: ProvisionalFundView,
            project_uid_event: this.events.get('project_uid'),
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'provisional_fund',
            set_active_event: this.events.get('page_state'),
            components: [form],
        });

        this.handle_url = function(url) {
            Utils.match_array(url, [
                'provisional-fund',
                /.+/,
                uid => {
                    Observer.broadcast(this.events.get('page_state'), 'provisional_fund');
                    Observer.broadcast(this.events.get('project_uid'), uid, true);
                },
            ]);
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('provisional-fund', url => {
                this.handle_url(url);
            });
            this.dfd.resolve();
        });
    }
}

export default ProvisionalFundVM;
