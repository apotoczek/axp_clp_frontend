import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import FundFamilyView from 'src/libs/components/market_insights/families/FundFamilyView';
import FamilySearch from 'src/libs/components/market_insights/families/FamilySearch';

class FamiliesVM extends Context {
    constructor() {
        super({id: 'families'});
        this.dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry, {});
        events.new('page_state');
        events.new('family_uid');

        const search_family = {
            id: 'search_family',
            component: FamilySearch,
        };

        const fund_family = {
            id: 'fund_family',
            component: FundFamilyView,
            family_uid_event: events.get('family_uid'),
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_family',
            set_active_event: events.get('page_state'),
            components: [search_family, fund_family],
        });

        this.handle_url = function(url) {
            Utils.match_array(
                url,
                [
                    'families',
                    /.+/,
                    uid => {
                        Observer.broadcast(events.get('page_state'), 'fund_family');
                        Observer.broadcast(events.get('family_uid'), uid, true);
                    },
                ],
                [
                    'families',
                    () => {
                        Observer.broadcast(events.get('page_state'), 'search_family');
                        Observer.broadcast(events.get('family_uid'), undefined);
                        Observer.broadcast_for_id('UserAction', 'record_action', {
                            action_type: 'view_diligence_families',
                        });
                    },
                ],
            );
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('families', url => {
                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }
}

export default FamiliesVM;
