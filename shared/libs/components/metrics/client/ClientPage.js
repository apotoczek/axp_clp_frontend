import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataTable from 'src/libs/components/basic/DataTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataSource from 'src/libs/DataSource';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import PerClientMetrics from 'src/libs/components/metrics/PerClientMetrics';

class ClientPage extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.define_default_template(`
            <!-- ko renderComponent: page --><!-- /ko -->
        `);

        this.client_changed_event = opts.client_changed_event;

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('mode_toggle', 'RadioButtons.state');
        this.mode = Observer.observable(this.events.get('mode_toggle'));

        this.default_mode = 'active_body';

        this.metric_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:active_users',
                    client_uid: {
                        type: 'observer',
                        event_type: this.client_changed_event,
                        required: true,
                    },
                },
            },
        });

        let modes = [
            {
                label: 'Active User Sessions',
                state: 'active_body',
            },
            {
                label: 'User Sessions',
                state: 'raw_body',
            },
            {
                label: 'Other Metrics',
                state: 'dashboard_body',
            },
        ];

        let active_template = '<span style="color:green">Yes</span>';
        let inactive_template = '<span style="color:red">No</span>';
        let activity_formatter = data => {
            return data > 0 ? active_template : inactive_template;
        };

        let raw_metric_table = this.gen_metric_table_config({
            id: 'raw_metric_table',
            columns: [
                {
                    key: 'raw_users_84',
                    unique_key: 'is_raw_quarterly',
                    label: 'Quarterly User',
                    formatter: activity_formatter,
                    visible: false,
                },
                {
                    key: 'raw_users_84',
                    label: 'Sessions - Trailing 4 Quarters',
                },
                {
                    key: 'raw_users_28',
                    unique_key: 'is_raw_monthly',
                    label: 'Monthly User',
                    formatter: activity_formatter,
                    visible: false,
                },
                {
                    key: 'raw_users_28',
                    label: 'Sessions - Trailing 4 Months',
                },
                {
                    key: 'raw_users_7',
                    unique_key: 'is_raw_weekly',
                    label: 'Weekly User',
                    formatter: activity_formatter,
                    visible: false,
                },
                {
                    key: 'raw_users_7',
                    label: 'Sessions - Trailing 6 Weeks',
                },
            ],
        });

        let active_metric_table = this.gen_metric_table_config({
            id: 'active_metric_table',
            columns: [
                {
                    key: 'active_users_84',
                    unique_key: 'is_active_quarterly',
                    label: 'Quarterly Active User',
                    formatter: activity_formatter,
                },
                {
                    key: 'active_users_84',
                    label: 'Sessions - Last 4 Quarters',
                    visible: false,
                },
                {
                    key: 'active_users_28',
                    unique_key: 'is_active_monthly',
                    label: 'Monthly Active User',
                    formatter: activity_formatter,
                },
                {
                    key: 'active_users_28',
                    label: 'Sessions - Last 4 Months',
                    visible: false,
                },
                {
                    key: 'active_users_7',
                    unique_key: 'is_active_weekly',
                    label: 'Weekly Active User',
                    formatter: activity_formatter,
                },
                {
                    key: 'active_users_7',
                    label: 'Sessions - Last 6 Weeks',
                    visible: false,
                },
            ],
        });

        this.total_keys = {
            active: [
                'total_active_quarterly_users',
                'total_active_monthly_users',
                'total_active_weekly_users',
            ],
            raw: ['total_raw_quarterly_users', 'total_raw_monthly_users', 'total_raw_weekly_users'],
        };

        let raw_totals_table = this.gen_totals_table_config({
            id: 'raw_totals_table',
            mode: 'raw',
        });

        let active_totals_table = this.gen_totals_table_config({
            id: 'active_totals_table',
            mode: 'active',
        });

        let cpanel = {
            id: 'cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['mode_toggle'],
            },
            components: [
                {
                    id: 'mode_toggle',
                    id_callback: this.events.register_alias('mode_toggle'),
                    component: RadioButtons,
                    template: 'tpl_full_width_radio_buttons',
                    default_state: this.default_mode,
                    css_style: 'cpanel-nav',
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                    },
                    buttons: modes,
                },
            ],
        };

        let raw_body = {
            id: 'raw_body',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['raw_metric_table', 'raw_totals_table'],
            },
            components: [raw_metric_table, raw_totals_table],
        };

        let active_body = {
            id: 'active_body',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['active_metric_table', 'active_totals_table'],
            },
            components: [active_metric_table, active_totals_table],
        };

        let dashboard_body = {
            id: 'dashboard_body',
            component: PerClientMetrics,
            client_changed_event: this.client_changed_event,
        };

        let body = {
            id: 'body',
            component: DynamicWrapper,
            template: 'tpl_dynamic_wrapper',
            active_component: this.default_mode,
            set_active_event: this.events.get('mode_toggle'),
            components: [raw_body, active_body, dashboard_body],
        };

        this.page = this.new_instance(Aside, {
            id: 'page',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'body'],
            },
            components: [cpanel, body],
        });

        this.when(this.page).done(() => {
            dfd.resolve();
        });
    }

    gen_metric_table_config({id, columns}) {
        return {
            id: id,
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_localstorage: true,
            enable_clear_order: true,
            enable_csv_export: true,
            inline_data: true,
            results_per_page: 50,
            columns: [
                {
                    key: 'email',
                    label: 'User',
                },
                ...columns,
            ],
            data: ko.pureComputed(() => {
                return (this.metric_datasource.data() || {}).results;
            }),
        };
    }

    gen_totals_table_columns(mode) {
        let columns = [];
        for (let key of this.total_keys[mode]) {
            columns.push({
                key: key,
                label: key.titleize(),
            });
        }
        return columns;
    }

    gen_totals_table_config({id, mode}) {
        return {
            id: id,
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_localstorage: true,
            enable_clear_order: true,
            enable_csv_export: true,
            columns: this.gen_totals_table_columns(mode),
            inline_data: true,
            data: ko.computed(() => {
                let data = this.metric_datasource.data();
                if (data) {
                    return [data.totals];
                }
            }),
        };
    }
}

export default ClientPage;
