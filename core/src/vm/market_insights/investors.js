import InvestorViewer from 'src/libs/components/market_insights/investor/InvestorViewer';
import InvestorSearch from 'src/libs/components/market_insights/investor/InvestorSearch';
import pager from 'pager';
import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

class InvestorsVM extends Context {
    constructor() {
        super({
            id: 'investors',
        });

        this.dfd = this.new_deferred();

        const hash_event = Utils.gen_event('HashListener', this.get_id());
        const investor_uid_event = Utils.gen_event('Investor.uid', this.get_id());
        const user_fund_uid_event = Utils.gen_event('UserFund.uid', this.get_id());

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search',
            set_active_event: hash_event,
            components: [
                {
                    component: InvestorSearch,
                    id: 'search',
                },
                {
                    component: InvestorViewer,
                    investor_uid_event: investor_uid_event,
                    user_fund_uid_event: user_fund_uid_event,
                    id: 'investor',
                },
            ],
        });

        this.handle_url = function(url) {
            if (url.length === 1) {
                Observer.broadcast(hash_event, 'search');
                Observer.broadcast_for_id('UserAction', 'record_action', {
                    action_type: 'view_market_data_investors',
                });
                return true;
            } else if (url.length === 2) {
                if (Utils.valid_uid(url[1])) {
                    Observer.broadcast(hash_event, 'investor');
                    Observer.broadcast(investor_uid_event, url[1], true);
                    Observer.broadcast(user_fund_uid_event, undefined);
                    return true;
                }
            } else if (url.length === 3) {
                if (Utils.valid_uid(url[1]) && Utils.valid_uid(url[2])) {
                    Observer.broadcast(hash_event, 'investor');
                    Observer.broadcast(investor_uid_event, url[1], true);
                    Observer.broadcast(user_fund_uid_event, url[2], true);
                    return true;
                }
            }

            return false;
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('investors', url => {
                let match = this.handle_url(url);

                if (!match) {
                    pager.navigate('#!/investors');
                }
            });

            this.dfd.resolve();
        });
    }
}

export default InvestorsVM;
