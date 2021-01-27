import FundReportViewer from 'src/libs/components/market_insights/fund/FundReportViewer';
import FundAnalyticsViewer from 'src/libs/components/market_insights/fund/FundAnalyticsViewer';
import FundViewer from 'src/libs/components/market_insights/fund/FundViewer';
import FundSearch from 'src/libs/components/market_insights/fund/FundSearch';
import pager from 'pager';
import auth from 'auth';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';

class FundsVM extends Context {
    constructor() {
        super({
            id: 'funds',
        });

        this.dfd = this.new_deferred();

        const events = {
            fund_uid: Utils.gen_event('Funds.uid', this.get_id()),
            analytics_fund_uid: Utils.gen_event('Funds.analytics_uid', this.get_id()),
            set_mode_event: Utils.gen_event('Funds.analytics.mode', this.get_id()),
            user_fund_uid: Utils.gen_event('Funds.user_fund_uid', this.get_id()),
            page_state: Utils.gen_event('Funds.page_state', this.get_id()),
        };

        const components = [
            {
                component: FundSearch,
                id: 'search_state',
            },
            {
                component: FundViewer,
                id: 'entity_state',
                events: events,
            },
            {
                component: FundAnalyticsViewer,
                id: 'entity_analytics_state',
                events: events,
            },
        ];

        if (auth.user_has_feature('side_by_side_fbr')) {
            components.push({
                component: FundReportViewer,
                id: 'entity_report_state',
                events: events,
            });
        }

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_state',
            set_active_event: events.page_state,
            components: components,
        });

        this.handle_url = function(url) {
            Utils.match_array(
                url,
                [
                    'funds',
                    /.+/,
                    'analytics',
                    (uid, mode) => {
                        Observer.broadcast(events.page_state, 'entity_analytics_state');
                        Observer.broadcast(events.analytics_fund_uid, uid, true);
                        Observer.broadcast(
                            events.set_mode_event,
                            VehicleHelper.url_to_mode(mode) || 'overview',
                        );
                    },
                ],
                [
                    'funds',
                    /.+/,
                    /.+/,
                    (uid, user_fund_uid) => {
                        if (auth.user_has_feature('side_by_side_fbr')) {
                            Observer.broadcast(events.page_state, 'entity_report_state');
                            Observer.broadcast(events.fund_uid, uid, true);
                            Observer.broadcast(events.user_fund_uid, user_fund_uid, true);
                        } else {
                            pager.navigate('#/funds');
                        }
                    },
                ],
                [
                    'funds',
                    /.+/,
                    uid => {
                        Observer.broadcast(events.page_state, 'entity_state');
                        Observer.broadcast(events.fund_uid, uid, true);
                        Observer.broadcast(events.analytics_fund_uid, undefined);
                    },
                ],
                [
                    'funds',
                    () => {
                        Observer.broadcast(events.page_state, 'search_state');
                        Observer.broadcast(events.fund_uid, undefined);
                        Observer.broadcast(events.analytics_fund_uid, undefined);

                        Observer.broadcast_for_id('UserAction', 'record_action', {
                            action_type: 'view_market_data_historic_funds',
                        });
                    },
                ],
            );
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('funds', url => {
                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }
}

export default FundsVM;
