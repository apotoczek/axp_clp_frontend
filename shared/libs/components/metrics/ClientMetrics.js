import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import MetricsPage from 'src/libs/components/metrics/MetricsPage';
import ClientUserSessions from 'src/libs/components/metrics/ClientUserSessions';
import ClientReportsRun from 'src/libs/components/metrics/ClientReportsRun';
import ClientExports from 'src/libs/components/metrics/ClientExports';
import ClientUpdatedCashFlows from 'src/libs/components/metrics/ClientUpdatedCashFlows';
import ClientMetricsHeader from 'src/libs/components/metrics/ClientMetricsHeader';

class ClientMetrics extends MetricsPage {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        let reports_run = new ClientReportsRun({events: this.events});
        let user_sessions = new ClientUserSessions({events: this.events});
        let exports_ = new ClientExports({events: this.events});
        let updated_cash_flows = new ClientUpdatedCashFlows({events: this.events});

        this.header_section = new ClientMetricsHeader({events: this.events});

        this.body = this.init_body([
            reports_run.page,
            user_sessions.page,
            exports_.page,
            updated_cash_flows.page,
        ]);

        this.when(this.body, this.header_section).done(dfd.resolve);
    }

    init_body(components) {
        return this.new_instance(DynamicWrapper, {
            id: 'body_content',
            id_callback: this.events.register_alias('body_content'),
            toggle_auto_get_data: true,
            set_active_event: this.events.get('metric_changed'),
            active_component: this.default_metric,
            layout: {
                body: ['reports_run', 'user_sessions', 'exports', 'updated_cash_flows'],
            },
            components: components,
        });
    }
}

export default ClientMetrics;
