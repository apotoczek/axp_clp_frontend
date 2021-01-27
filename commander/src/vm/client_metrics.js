import ClientPage from 'src/libs/components/metrics/client/ClientPage';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetricFilter from 'src/libs/components/metrics/MetricFilter';
import EventButton from 'src/libs/components/basic/EventButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import DataTable from 'src/libs/components/basic/DataTable';

export default () => {
    let self = new Context({id: 'client_metrics'});

    self.dfd = self.new_deferred();
    let events = self.new_instance(EventRegistry, {});
    events.new('page_changed');
    events.new('client_changed');
    events.new('time_period_changed');
    events.new('metric_changed');
    events.resolve_and_add('metrics', 'Metrics.chart_selection', 'chart_selection');
    events.resolve_and_add('search_count', 'DataTable.counts');
    events.resolve_and_add('clear', 'EventButton');
    events.resolve_and_add('string_filter', 'StringFilter.value');
    events.resolve_and_add('show_disabled', 'BooleanButton.state');
    events.resolve_and_add('client_type', 'PopoverButton.value');

    self.default_time_period = 'all_time';
    self.default_metric = 'user_sessions';

    self.current_metric = self.default_metric;

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

    let client = {
        id: 'client',
        component: ClientPage,
        client_changed_event: events.get('client_changed'),
    };

    let search_table = {
        id: 'search_table',
        id_callback: events.register_alias('search_count'),
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        enable_selection: true,
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        enable_csv_export: true,
        results_per_page: 50,
        columns: [
            {
                sort_key: 'name',
                label: 'Name',
                format: 'contextual_link',
                format_args: {
                    url: 'client_metrics/client/<client_uid>',
                    label_key: 'name',
                },
            },
            {
                key: 'uniques_1',
                label: 'Unique Users 1 Day',
                visible: false,
            },
            {
                key: 'uniques_7',
                label: 'Unique Users 7 Days',
                visible: false,
            },
            {
                key: 'uniques_28',
                label: 'Unique Users 28 Days',
            },
            {
                key: 'sessions_1',
                label: 'Unique Sessions 1 Day',
                visible: false,
            },
            {
                key: 'sessions_7',
                label: 'Unique Sessions 7 Days',
                visible: false,
            },
            {
                key: 'sessions_28',
                label: 'User Sessions 28 Days',
            },
            {
                key: 'reports_run_1',
                label: 'Reports Run 1 Day',
                visible: false,
            },
            {
                key: 'reports_run_7',
                label: 'Reports Run 7 Days',
                visible: false,
            },
            {
                key: 'reports_run_28',
                label: 'Reports Run',
            },
            {
                key: 'exports_1',
                label: 'Exports 1 Day',
                visible: false,
            },
            {
                key: 'exports_7',
                label: 'Exports 7 Days',
                visible: false,
            },
            {
                key: 'exports_28',
                label: 'Exports',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:clients',
                results_per_page: 50,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: events.get('string_filter'),
                        },
                        exclude_nameless: true,
                        has_valid_permissions: true,
                        show_disabled: {
                            type: 'observer',
                            event_type: events.get('show_disabled'),
                            default: true,
                        },
                        client_type: {
                            type: 'observer',
                            event_type: events.get('client_type'),
                        },
                    },
                },
            },
        },
    };

    let search_body = {
        component: Aside,
        id: 'search_body',
        template: 'tpl_aside_main_content',
        layout: {
            body: ['search_table'],
        },
        components: [search_table],
    };

    let search_cpanel = {
        component: Aside,
        id: 'search_cpanel',
        template: 'tpl_aside_control_panel',
        layout: {
            body: [
                'string_filter',
                'meta',
                'filter_label',
                'show_disabled',
                'client_type',
                'clear',
            ],
        },
        components: [
            {
                id: 'string_filter',
                id_callback: events.register_alias('string_filter'),
                component: StringFilter,
                clear_event: events.get('clear'),
                placeholder: 'Search...',
            },
            {
                id: 'filter_label',
                html: '<h3>Filters</h3>',
                component: HTMLContent,
            },
            {
                id: 'meta',
                component: MetaInfo,
                label: 'Clients',
                format: 'visible_count',
                css: {
                    'meta-primary': true,
                    'match-btn-sm': true,
                },
                datasource: {
                    type: 'observer',
                    event_type: events.get('search_count'),
                },
            },
            {
                id: 'show_disabled',
                id_callback: events.register_alias('show_disabled'),
                reset_event: events.get('clear'),
                component: BooleanButton,
                default_state: true,
                template: 'tpl_boolean_button',
                enable_localstorage: true,
                btn_css: {
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                    'btn-block': true,
                },
                label: 'Show disabled',
            },
            {
                id: 'client_type',
                id_callback: events.register_alias('client_type'),
                component: NewPopoverButton,
                label: 'Client Type',
                clear_event: events.get('clear'),
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Client Type',
                    css_class: 'popover-default',
                },
                enable_localstorage: true,
                popover_config: {
                    component: Checklist,
                    single_selection: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'commander:client_types',
                        },
                    },
                },
            },
            {
                id: 'clear',
                component: EventButton,
                id_callback: events.register_alias('clear'),
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Restore Defaults',
            },
        ],
    };

    let search_clients = {
        component: Aside,
        id: 'search_clients',
        template: 'tpl_aside_body',
        layout: {
            body: ['search_cpanel', 'search_body'],
        },
        components: [search_body, search_cpanel],
    };

    self.page_swapper = self.new_instance(DynamicWrapper, {
        id: 'page_swapper',
        active_component: 'search_clients',
        set_active_event: events.get('page_changed'),
        layout: {
            body: ['search_clients', 'client'],
        },
        components: [search_clients, client],
    });

    let handle_url = url => {
        if (url && url.length >= 3) {
            let page = url[1];
            let entity_uid = url[2];

            Observer.broadcast(events.get('page_changed'), page);

            // Change the entity so that we load data for the correct client/user
            Observer.broadcast(events.get(`${page}_changed`), entity_uid);
        } else {
            Observer.broadcast(events.get('page_changed'), 'search_clients');

            // Reset entity so that the summary stays correct when we are at the
            // general page
            Observer.broadcast(events.get('client_changed'), undefined);
        }
    };

    self.when(self.page_swapper, self.metric_filter).done(() => {
        Observer.register_hash_listener('client_metrics', handle_url);

        Observer.register(events.get('metric_changed'), new_metric => {
            self.current_metric = new_metric;
        });

        // Broadcast the default values to let subpages in the dynamic wrapper
        // know what data to render
        Observer.broadcast(events.get('time_period_changed'), self.default_time_period, true);
        Observer.broadcast(events.get('metric_changed'), self.default_metric, true);

        self.dfd.resolve();
    });

    return self;
};
