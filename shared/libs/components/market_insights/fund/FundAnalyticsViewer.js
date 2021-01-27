import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NetAnalytics from 'src/libs/components/analytics/NetAnalytics';

class FundAnalyticsViewer extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.dfd = this.new_deferred();

        this.template = opts.template || 'tpl_market_insights_body';

        const events = opts.events;

        this.body = this.new_instance(NetAnalytics, {
            id: 'analytic_body',
            entity_type: 'market_data_fund',
            market_data_fund_uid_event: events.analytics_fund_uid,
            template: 'tpl_asides',
            breadcrumbs: [
                {
                    label: 'Historic Funds',
                    link: '#!/funds',
                },
                {
                    label_key: 'name',
                    contextual_url: {
                        url: 'funds/<uid>',
                    },
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'market_data:fund',
                            uid: {
                                type: 'observer',
                                event_type: events.analytics_fund_uid,
                                required: true,
                            },
                        },
                    },
                },
                {
                    label: 'Analytics',
                },
            ],
            reset_event: events.analytics_fund_uid,
            set_mode_event: events.set_mode_event,
        });

        this.when(this.body).done(() => {
            this.dfd.resolve();
        });
    }
}

export default FundAnalyticsViewer;
