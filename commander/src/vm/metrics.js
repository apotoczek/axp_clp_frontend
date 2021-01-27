import ClientMetrics from 'src/libs/components/metrics/ClientMetrics';
import UserMetrics from 'src/libs/components/metrics/UserMetrics';
import GeneralMetrics from 'src/libs/components/metrics/GeneralMetrics';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetricFilter from 'src/libs/components/metrics/MetricFilter';

export default () => {
    let self = new Context({id: 'metrics'});

    self.dfd = self.new_deferred();
    let events = self.new_instance(EventRegistry, {});
    events.new('page_changed');
    events.new('user_changed');
    events.new('client_changed');
    events.new('time_period_changed');
    events.new('metric_changed');
    events.resolve_and_add('metrics', 'Metrics.chart_selection', 'chart_selection');

    self.default_time_period = 'all_time';
    self.default_metric = 'user_sessions';

    let current_metric = self.default_metric;

    self.metric_filter = self.new_instance(MetricFilter, {
        id: 'metric_filter',
        id_callback: events.register_alias('metrics'),
        default_time_period: self.default_time_period,
        default_metric: self.default_metric,
        user_event: events.get('user_changed'),
        client_event: events.get('client_changed'),
        time_period_event: events.get('time_period_changed'),
        metric_event: events.get('metric_changed'),
        chart_selection_event: events.get('chart_selection'),
    });

    let general = {
        id: 'general',
        component: GeneralMetrics,
        metric_filter_component: self.metric_filter,
        time_period_changed_event: events.get('time_period_changed'),
        metric_changed_event: events.get('metric_changed'),
        chart_selection_event: events.get('chart_selection'),
    };

    let user = {
        id: 'user',
        component: UserMetrics,
        metric_filter_component: self.metric_filter,
        user_changed_event: events.get('user_changed'),
        time_period_changed_event: events.get('time_period_changed'),
        metric_changed_event: events.get('metric_changed'),
        chart_selection_event: events.get('chart_selection'),
    };

    let client = {
        id: 'client',
        component: ClientMetrics,
        metric_filter_component: self.metric_filter,
        client_changed_event: events.get('client_changed'),
        time_period_changed_event: events.get('time_period_changed'),
        metric_changed_event: events.get('metric_changed'),
        chart_selection_event: events.get('chart_selection'),
    };

    self.page_swapper = self.new_instance(DynamicWrapper, {
        id: 'page_swapper',
        active_component: 'general',
        set_active_event: events.get('page_changed'),
        layout: {
            body: ['general', 'user', 'client'],
        },
        components: [general, user, client],
    });

    let handle_url = url => {
        if (url && url.length >= 3) {
            let page = url[1];
            let entity_uid = url[2];

            Observer.broadcast(events.get('page_changed'), page);
            if (page != 'general' && current_metric == 'inactive_clients') {
                Observer.broadcast(events.get('metric_changed'), 'user_sessions');
            }

            // Change the entity so that we load data for the correct client/user
            Observer.broadcast(events.get(`${page}_changed`), entity_uid);
        } else {
            Observer.broadcast(events.get('page_changed'), 'general');

            // Reset entity so that the summary stays correct when we are at the
            // general page
            Observer.broadcast(events.get('user_changed'), undefined);
            Observer.broadcast(events.get('client_changed'), undefined);
        }
    };

    self.when(self.page_swapper, self.metric_filter).done(() => {
        Observer.register_hash_listener('metrics', handle_url);

        Observer.register(events.get('metric_changed'), new_metric => {
            current_metric = new_metric;
        });

        // Broadcast the default values to let subpages in the dynamic wrapper
        // know what data to render
        Observer.broadcast(events.get('time_period_changed'), self.default_time_period, true);
        Observer.broadcast(events.get('metric_changed'), self.default_metric, true);

        self.dfd.resolve();
    });

    return self;
};
