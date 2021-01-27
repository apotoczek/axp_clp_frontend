import FirmViewer from 'src/libs/components/market_insights/firm/FirmViewer';
import FirmSearch from 'src/libs/components/market_insights/firm/FirmSearch';
import pager from 'pager';
import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';

class FirmsVM extends Context {
    constructor() {
        super({
            id: 'firms',
        });

        this.dfd = this.new_deferred();

        const hash_event = Utils.gen_event('HashListener', this.get_id());
        const firm_uid_event = Utils.gen_event('Firm.uid', this.get_id());

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search',
            set_active_event: hash_event,
            components: [
                {
                    component: FirmSearch,
                    id: 'search',
                },
                {
                    component: FirmViewer,
                    firm_uid_event: firm_uid_event,
                    id: 'firm',
                },
            ],
        });

        this.handle_url = function(url) {
            if (url.length === 1) {
                if (url[0] === 'firms') {
                    Observer.broadcast(hash_event, 'search');
                    Observer.broadcast_for_id('UserAction', 'record_action', {
                        action_type: 'view_market_data_firms',
                    });
                    return true;
                }
            } else if (url.length === 2) {
                if (url[0] === 'firms' && Utils.valid_uid(url[1])) {
                    Observer.broadcast(hash_event, 'firm');
                    Observer.broadcast(firm_uid_event, url[1], true);
                    return true;
                }
            }

            return false;
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('firms', url => {
                let match = this.handle_url(url);

                if (!match) {
                    pager.navigate('#!/firms');
                }
            });

            this.dfd.resolve();
        });
    }
}

export default FirmsVM;
