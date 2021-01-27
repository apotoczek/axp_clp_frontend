/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import MetricsPage from 'src/libs/components/metrics/MetricsPage';
import UserUserSessions from 'src/libs/components/metrics/UserUserSessions';
import UserReportsRun from 'src/libs/components/metrics/UserReportsRun';
import UserExports from 'src/libs/components/metrics/UserExports';
import UserMetricsHeader from 'src/libs/components/metrics/UserMetricsHeader';
import UserUpdatedCashFlows from 'src/libs/components/metrics/UserUpdatedCashFlows';

export default function(opts, components) {
    let self = new MetricsPage(opts, components);
    let dfd = self.new_deferred();

    let user_sessions = new UserUserSessions({events: self.events});
    let reports_run = new UserReportsRun({events: self.events});
    let exports_ = new UserExports({events: self.events});
    let updated_cash_flows = new UserUpdatedCashFlows({events: self.events});
    self.header_section = new UserMetricsHeader({events: self.events});

    self.body = self.new_instance(DynamicWrapper, {
        id: 'body_content',
        id_callback: self.events.register_alias('body_content'),
        toggle_auto_get_data: true,
        set_active_event: self.events.get('metric_changed'),
        active_component: self.default_metric,
        layout: {
            body: ['user_sessions', 'reports_run', 'exports', 'updated_cash_flows'],
        },
        components: [user_sessions.page, reports_run.page, exports_.page, updated_cash_flows.page],
    });

    self.when(self.body).done(dfd.resolve);
    return self;
}
