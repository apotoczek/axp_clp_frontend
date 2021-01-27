import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

import RegExps from 'src/libs/RegExps';

import * as Utils from 'src/libs/Utils';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';

import GrossAnalytics from 'src/libs/components/analytics/GrossAnalytics';
import DealAnalytics from 'src/libs/components/analytics/DealAnalytics';

import ko from 'knockout';

class GPAnalyticsVM extends Context {
    constructor() {
        super({id: 'reporting-analytics'});

        const _ensure_portfolio = DataThing.backends.reporting({
            url: 'actions/ensure-gp-portfolio',
        });

        this.loading = ko.observable(true);

        this.dfd = this.new_deferred();

        this.events = this.init_event_registry();

        this.instances = {};

        const default_modes = {
            gross: 'deals',
            deal: 'deal_meta_data',
        };

        this.instances.gross = this.new_instance(GrossAnalytics, {
            id: 'gross',
            entity_type: 'portfolio',
            set_mode_event: this.events.get('gross_mode_event'),
            default_mode: default_modes.gross,
            modes: ['deals', 'operating_metrics'],
            reset_event: this.events.get('reset'),
            disable_edit: true,
            disable_audit_trail: true,
            deal_url: 'reporting-analytics/company/<uid>',
            breadcrumbs: [
                {
                    label: 'Portals',
                    link: '#!/reporting-activity',
                },
                {
                    label: 'Analytics',
                },
            ],
        });

        this.instances.deal = this.new_instance(DealAnalytics, {
            id: 'gross_deal',
            entity_type: 'deal',
            set_mode_event: this.events.get('deal_mode_event'),
            default_mode: default_modes.deal,
            disable_audit_trail: true,
            modes: [
                'deal_meta_data',
                'deal_performance',
                'deal_key_stats',
                'deal_operating_metrics',
            ],
            reset_event: this.events.get('reset'),
            disable_edit: true,
            no_cashflows: true,
            breadcrumbs: [
                {
                    label: 'Portals',
                    link: '#!/reporting-activity',
                },
                {
                    label: 'Analytics',
                    link: '#!/reporting-analytics',
                },
                {
                    label_key: 'name',
                    inherit_data: true,
                },
            ],
        });

        this.portfolio_uid = ko.observable();
        this.active = ko.observable();

        this.asides = ko.computed(() => {
            let active = this.active();
            if (active && active.asides) {
                return ko.unwrap(active.asides);
            }
        });

        _ensure_portfolio({
            data: {},
            success: DataThing.api.XHRSuccess(portfolio_uid => {
                this.portfolio_uid(portfolio_uid);
                Observer.broadcast_for_id(
                    this.instances.gross.get_id(),
                    'Active.portfolio_uid',
                    portfolio_uid,
                );
            }),
        });

        this.match_url = function(url) {
            return Utils.match_array(
                url,

                [
                    'reporting-analytics',
                    'company',
                    RegExps.uuid,
                    (uid, mode) => ({
                        uid,
                        type: 'deal',
                        mode: VehicleHelper.url_to_mode(mode),
                    }),
                ],
                [
                    'reporting-analytics',
                    mode => ({
                        type: 'gross',
                        mode: VehicleHelper.url_to_mode(mode),
                    }),
                ],
            );
        };

        this.get_uid_event = type => {
            if (type === 'deal') {
                return 'Active.deal_uid';
            }

            return 'Active.portfolio_uid';
        };

        this.when(this.instances).done(() => {
            Observer.register_hash_listener('reporting-analytics', url => {
                let match = this.match_url(url);
                this.loading(true);

                if (match) {
                    const instance = this.instances[match.type];
                    if (match.type === 'deal') {
                        const mode = match.mode || default_modes.deal;

                        Observer.broadcast(this.events.get('deal_mode_event'), mode);

                        Observer.broadcast_for_id(instance.get_id(), 'Active.deal_uid', match.uid);
                    } else {
                        const mode = match.mode || default_modes.gross;
                        const portfolio_uid = this.portfolio_uid();

                        Observer.broadcast(this.events.get('gross_mode_event'), mode);

                        if (portfolio_uid) {
                            Observer.broadcast_for_id(
                                instance.get_id(),
                                'Active.portfolio_uid',
                                portfolio_uid,
                            );
                        }
                    }

                    this.active(instance);
                    this.loading(false);
                }
            });

            this.dfd.resolve();
        });
    }

    init_event_registry() {
        const events = this.new_instance(EventRegistry, {});

        events.new('deal_mode_event');
        events.new('gross_mode_event');
        events.new('reset');

        return events;
    }
}

export default GPAnalyticsVM;
