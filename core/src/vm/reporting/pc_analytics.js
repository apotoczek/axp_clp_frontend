import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

import * as Utils from 'src/libs/Utils';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';

import DealAnalytics from 'src/libs/components/analytics/DealAnalytics';

import ko from 'knockout';

class ReportingAnalyticsVM extends Context {
    constructor() {
        super({id: 'reporting-analytics'});

        const _ensure_company = DataThing.backends.reporting({
            url: 'actions/ensure-company',
        });

        self.loading = ko.observable(true);

        this.dfd = this.new_deferred();

        this.events = this.init_event_registry();

        const default_mode = 'deal_meta_data';

        this.deal_analytics = this.new_instance(DealAnalytics, {
            id: 'gross_deal',
            entity_type: 'deal',
            set_mode_event: this.events.get('mode_event'),
            default_mode: default_mode,
            disable_audit_trail: true,
            modes: [
                'deal_meta_data',
                'deal_performance',
                'deal_key_stats',
                'deal_operating_metrics',
            ],
            disable_edit: true,
            no_cashflows: true,
            breadcrumbs: [
                {
                    label_key: 'name',
                    inherit_data: true,
                },
            ],
        });

        _ensure_company({
            data: {},
            success: DataThing.api.XHRSuccess(company_uid => {
                Observer.broadcast_for_id(
                    this.deal_analytics.get_id(),
                    'Active.company_uid',
                    company_uid,
                );
                self.loading(false);
            }),
        });

        this.match_url = function(url) {
            return Utils.match_array(url, [
                'reporting-analytics',
                mode => VehicleHelper.url_to_mode(mode),
            ]);
        };

        Observer.register_hash_listener('reporting-analytics', url => {
            let mode = this.match_url(url);

            Observer.broadcast(this.events.get('mode_event'), mode || default_mode);
        });

        this.when(this.deal_analytics).done(() => {
            this.dfd.resolve();
        });
    }

    init_event_registry() {
        const events = this.new_instance(EventRegistry, {});

        events.new('mode_event');

        return events;
    }
}

export default ReportingAnalyticsVM;
