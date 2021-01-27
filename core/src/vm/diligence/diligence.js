import DiligenceSearch from 'src/libs/components/diligence/DiligenceSearch';
import Context from 'src/libs/Context';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DiligenceAnalytics from 'src/libs/components/diligence/DiligenceAnalytics';
import GrossAnalytics from 'src/libs/components/analytics/GrossAnalytics';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';

class DiligenceVM extends Context {
    constructor() {
        super({id: 'diligence'});

        this.dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('clear', 'EventButton');
        this.events.new('page_state');
        this.events.new('net_fund_uid_event');
        this.events.new('gross_fund_uid_event');
        this.events.new('set_mode_event');
        this.events.new('project_uid_event');

        let breadcrumb_base = [
            {
                label: 'Diligence Reports',
                link: '#!/diligence',
            },
        ];

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search',
            set_active_event: this.events.get('page_state'),
            components: [
                {
                    component: DiligenceSearch,
                    id: 'search',
                },
                {
                    component: DiligenceAnalytics,
                    id: 'diligence_net_analytics',
                    user_fund_uid_event: this.events.get('net_fund_uid_event'),
                    entity_type: 'user_fund',
                    cashflow_type: 'net',
                    template: 'tpl_asides',
                    breadcrumb_base: breadcrumb_base,
                    project_uid_event: this.events.get('project_uid_event'),
                    set_mode_event: this.events.get('set_mode_event'),
                    default_mode: 'overview',
                    reset_event: this.events.get('clear'),
                },
                {
                    component: GrossAnalytics,
                    disable_audit_trail: true,
                    id: 'diligence_gross_analytics',
                    user_fund_uid_event: this.events.get('gross_fund_uid_event'),
                    project_uid_event: this.events.get('project_uid_event'),
                    entity_type: 'user_fund',
                    cashflow_type: 'gross',
                    template: 'tpl_asides',
                    breadcrumb_base: breadcrumb_base,
                    set_mode_event: this.events.get('set_mode_event'),
                    default_mode: 'fund_performance',
                },
            ],
        });

        this.handle_url = function(url) {
            Utils.match_array(
                url,
                [
                    'diligence',
                    /.+/,
                    /.+/,
                    /.+/,
                    'analytics',
                    (project_uid, uid, cf_type, mode) => {
                        if (cf_type === 'net') {
                            Observer.broadcast(
                                this.events.get('page_state'),
                                'diligence_net_analytics',
                            );
                            Observer.broadcast(
                                this.events.get('project_uid_event'),
                                project_uid,
                                true,
                            );
                            Observer.broadcast(this.events.get('net_fund_uid_event'), uid, true);
                            Observer.broadcast(
                                this.events.get('set_mode_event'),
                                VehicleHelper.url_to_mode(mode) || 'overview',
                            );
                        }
                        if (cf_type === 'gross') {
                            Observer.broadcast(
                                this.events.get('page_state'),
                                'diligence_gross_analytics',
                            );
                            Observer.broadcast(
                                this.events.get('set_mode_event'),
                                VehicleHelper.url_to_mode(mode) || 'fund_performance',
                            );
                            Observer.broadcast(this.events.get('gross_fund_uid_event'), uid, true);
                            Observer.broadcast(
                                this.events.get('project_uid_event'),
                                project_uid,
                                true,
                            );
                            Observer.broadcast(this.events.get('net_fund_uid_event'), undefined);
                        }
                    },
                ],
                [
                    'diligence',
                    () => {
                        Observer.broadcast(this.events.get('page_state'), 'search');
                        Observer.broadcast(this.events.get('project_uid_event'), undefined);
                        Observer.broadcast(this.events.get('net_fund_uid_event'), undefined);
                        Observer.broadcast(this.events.get('gross_fund_uid_event'), undefined);
                        Observer.broadcast_for_id('UserAction', 'record_action', {
                            action_type: 'view_diligence_projects',
                        });
                    },
                ],
            );
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('diligence', url => {
                this.handle_url(url);
            });

            this.dfd.resolve();
        });
    }
}

export default DiligenceVM;
