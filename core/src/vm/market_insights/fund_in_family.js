import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import NetAnalytics from 'src/libs/components/analytics/NetAnalytics';
import FundInFamilyView from 'src/libs/components/market_insights/families/FundInFamilyView';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import GrossAnalytics from 'src/libs/components/analytics/GrossAnalytics';

class FundInFamilyVM extends Context {
    constructor() {
        super({id: 'fund_in_family'});

        this.dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});
        this.events.new('page_state');
        this.events.new('fund_uid');
        this.events.new('analytics_fund_uid');
        this.events.new('fund_in_family_view');
        this.events.new('set_mode_event');

        const fund_in_family_view = {
            id: 'fund_in_family_view',
            component: FundInFamilyView,
            fund_uid_event: this.events.get('fund_uid'),
            set_mode_event: this.events.get('set_mode_event'),
        };

        const breadcrumb_datasource = {
            type: 'dynamic',
            query: {
                target: 'market_data:fund',
                uid: {
                    type: 'observer',
                    event_type: this.events.get('analytics_fund_uid'),
                    required: true,
                },
            },
        };

        const fund_in_family_analytics = {
            id: 'fund_in_family_analytics',
            component: NetAnalytics,
            entity_type: 'market_data_fund',
            template: 'tpl_asides',
            market_data_fund_uid_event: this.events.get('analytics_fund_uid'),
            set_mode_event: this.events.get('set_mode_event'),
            reset_event: this.events.get('analytics_fund_uid'),
            breadcrumbs: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'family_name',
                    contextual_url: {
                        url: 'families/<family_uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label_key: 'name',
                    contextual_url: {
                        url: 'fund-in-family/<uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label: 'Analytics (Net)',
                },
            ],
        };

        const fund_in_family_gross_analytics = {
            id: 'fund_in_family_gross_analytics',
            component: GrossAnalytics,
            disable_audit_trail: true,
            entity_type: 'market_data_fund',
            template: 'tpl_asides',
            market_data_fund_uid_event: this.events.get('analytics_fund_uid'),
            set_mode_event: this.events.get('set_mode_event'),
            default_mode: 'fund_performance',
            breadcrumbs: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label_key: 'family_name',
                    contextual_url: {
                        url: 'families/<family_uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label_key: 'name',
                    contextual_url: {
                        url: 'fund-in-family/<uid>',
                    },
                    datasource: breadcrumb_datasource,
                },
                {
                    label: 'Analytics (Gross)',
                },
            ],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'fund_in_family_view',
            set_active_event: this.events.get('page_state'),
            components: [
                fund_in_family_view,
                fund_in_family_analytics,
                fund_in_family_gross_analytics,
            ],
        });

        this.handle_url = function(url) {
            Utils.match_array(
                url,
                [
                    'fund-in-family',
                    /.+/,
                    /.+/,
                    'analytics',
                    (uid, cf_type, mode) => {
                        if (cf_type == 'net') {
                            Observer.broadcast(
                                this.events.get('page_state'),
                                'fund_in_family_analytics',
                            );
                            Observer.broadcast(
                                this.events.get('set_mode_event'),
                                VehicleHelper.url_to_mode(mode) || 'overview',
                            );
                        } else {
                            Observer.broadcast(
                                this.events.get('page_state'),
                                'fund_in_family_gross_analytics',
                            );
                            Observer.broadcast(
                                this.events.get('set_mode_event'),
                                VehicleHelper.url_to_mode(mode) || 'fund_performance',
                            );
                        }
                        Observer.broadcast(this.events.get('analytics_fund_uid'), uid, true);
                    },
                ],
                [
                    'fund-in-family',
                    /.+/,
                    uid => {
                        Observer.broadcast(this.events.get('page_state'), 'fund_in_family_view');
                        Observer.broadcast(this.events.get('fund_uid'), uid);
                    },
                ],
            );
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('fund-in-family', url => {
                this.handle_url(url);
            });
            this.dfd.resolve();
        });
    }
}

export default FundInFamilyVM;
