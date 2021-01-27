import GeneralMetricHeader from 'src/libs/components/metrics/GeneralMetricHeader';
import GeneralUserSessions from 'src/libs/components/metrics/GeneralUserSessions';
import GeneralReportsRun from 'src/libs/components/metrics/GeneralReportsRun';
import GeneralExports from 'src/libs/components/metrics/GeneralExports';
import InactiveClients from 'src/libs/components/metrics/InactiveClients';
import GeneralUpdatedCashFlows from 'src/libs/components/metrics/GeneralUpdatedCashFlows';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import MetricsPage from 'src/libs/components/metrics/MetricsPage';

class GeneralMetrics extends MetricsPage {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        let user_sessions = new GeneralUserSessions({events: this.events});
        let reports_run = new GeneralReportsRun({events: this.events});
        let exports_ = new GeneralExports({events: this.events});
        let updated_cash_flows = new GeneralUpdatedCashFlows({events: this.events});
        let inactive_clients = new InactiveClients({events: this.events});

        this.header_section = new GeneralMetricHeader();
        this.body = this.init_body([
            user_sessions.page,
            reports_run.page,
            exports_.page,
            updated_cash_flows.page,
            inactive_clients.page,
        ]);

        this.when(this.body).done(() => dfd.resolve());
    }

    init_body(components) {
        return this.new_instance(DynamicWrapper, {
            id: 'body_content',
            id_callback: this.events.register_alias('body_content'),
            toggle_auto_get_data: true,
            set_active_event: this.events.get('metric_changed'),
            active_component: this.default_metric,
            layout: {
                body: [
                    'user_sessions',
                    'reports_run',
                    'exports',
                    'updated_cash_flows',
                    'inactive_clients',
                ],
            },
            components: components,
        });
    }
}

export default GeneralMetrics;
