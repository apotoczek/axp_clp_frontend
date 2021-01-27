/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataTable from 'src/libs/components/basic/DataTable';
import NumberBox from 'src/libs/components/basic/NumberBox';
import EventButton from 'src/libs/components/basic/EventButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import BooleanButton from 'src/libs/components/basic/BooleanButton';

export default function() {
    let self = new Context({
        id: 'status',
    });

    self.dfd = self.new_deferred();

    self.filter = self.new_instance(StringFilter, {
        id: 'filter',
        component: StringFilter,
        placeholder: 'Filter...',
        enable_localstorage: true,
    });

    self.reload = self.new_instance(EventButton, {
        id: 'reload',
        template: 'tpl_cpanel_button',
        css: {'btn-sm': true, 'btn-success': true},
        label: 'Reload',
    });

    self.auto_reload = self.new_instance(BooleanButton, {
        id: 'auto_reload',
        default_state: true,
        template: 'tpl_boolean_button',
        enable_localstorage: true,
        btn_css: {
            'btn-primary': true,
            'btn-sm': true,
            'btn-block': true,
        },
        label: 'Reload Automatically',
    });

    setInterval(() => {
        if (self.auto_reload.state()) {
            self.table.refresh_data(true);
        }
    }, 10000);

    self.last_active_offset = self.new_instance(NewDropdown, {
        label: 'Active',
        btn_css: {
            'btn-sm': true,
            'btn-secondary': true,
        },
        enable_localstorage: true,
        default_selected_index: 0,
        data: [
            {label: 'Within 7 Days', value: null},
            {label: 'Within 1 Day', value: 86400},
            {label: 'Within 1 Hour', value: 3600},
            {label: 'Within 5 Minutes', value: 300},
        ],
    });

    self.table = self.new_instance(DataTable, {
        id: 'user_status',
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Users',
        inline_data: true,
        enable_csv_export: true,
        enable_clear_order: true,
        columns: [
            {
                label: 'Email',
                sort_key: 'email',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<user:uid>',
                    label_key: 'user:email',
                },
            },
            {
                key: 'user:name',
                label: 'Name',
            },
            {
                key: 'user:client_name',
                label: 'Client',
            },
            {
                key: 'user:last_sign_in',
                label: 'Last Sign In',
                format: 'backend_local_datetime',
            },
            {
                key: 'last_active',
                label: 'Last Heartbeat',
                format: 'backend_local_datetime',
            },
            {
                key: 'last_reload',
                label: 'Last Reload',
                format: 'backend_local_datetime',
            },
            {
                key: 'url_hash',
                label: 'Last Page',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:user_status',
                string_filter: {
                    type: 'observer',
                    event_type: Utils.gen_event('StringFilter.value', self.filter.get_id()),
                },
                last_active_offset: {
                    type: 'observer',
                    mapping: 'get_value',
                    event_type: Utils.gen_event('Dropdown.state', self.last_active_offset.get_id()),
                },
            },
        },
    });

    Observer.register(Utils.gen_event('EventButton', self.reload.get_id()), () => {
        self.table.refresh_data(true);
    });

    self.callouts = [
        self.new_instance(NumberBox, {
            label: 'Total',
            data: ko.computed(() => {
                return self.table.rows().length;
            }),
        }),
        self.new_instance(NumberBox, {
            label: 'Analytics',
            data: ko.computed(() => {
                return self.table.rows().filter(user => {
                    return user.url_hash.includes('analytics');
                }).length;
            }),
        }),
        self.new_instance(NumberBox, {
            label: 'Data Manager',
            data: ko.computed(() => {
                return self.table.rows().filter(user => {
                    return user.url_hash.includes('data-manager');
                }).length;
            }),
        }),
        self.new_instance(NumberBox, {
            label: 'Market Insights',
            data: ko.computed(() => {
                return self.table.rows().filter(user => {
                    return (
                        user.url_hash.includes('firms') ||
                        user.url_hash.includes('funds') ||
                        user.url_hash.includes('investors') ||
                        user.url_hash.includes('investments') ||
                        user.url_hash.includes('lists')
                    );
                }).length;
            }),
        }),
    ];

    self.callout_column_css = 'col-xs-12 col-md-3';

    self.when(self.filter, self.reload, self.table).done(() => {
        self.dfd.resolve();
    });

    return self;
}
