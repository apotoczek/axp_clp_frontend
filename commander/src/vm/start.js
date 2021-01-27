/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import auth from 'auth';
import Context from 'src/libs/Context';
import DataTable from 'src/libs/components/basic/DataTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';

export default function() {
    let self = new Context({
        id: 'start',
    });

    self.dfd = self.new_deferred();

    self.recent_users = self.new_instance(DataTable, {
        id: 'recent_users',
        css: {'table-light': true, 'table-sm': true},
        disable_sorting: true,
        empty_template: 'tpl_data_table_empty_with_label',
        inline_data: true,
        label: 'Recent Users',
        columns: [
            {
                label: 'Email',
                sort_key: 'email',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<uid>',
                    label_key: 'email',
                },
            },
            {
                key: 'name',
                label: 'Name',
            },
            {
                sort_key: 'client_name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client_uid>',
                    label_key: 'client_name',
                },
            },
            {
                key: 'created',
                label: 'Created',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:recent_users',
            },
        },
    });

    self.recent_clients = self.new_instance(DataTable, {
        id: 'recent_clients',
        css: {'table-light': true, 'table-sm': true},
        disable_sorting: true,
        inline_data: true,
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Recent Clients',
        columns: [
            {
                sort_key: 'name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client_uid>',
                    label_key: 'name',
                },
            },
            {
                key: 'created',
                label: 'Created',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:recent_clients',
            },
        },
    });

    self.expiring_soon = self.new_instance(DataTable, {
        id: 'expiring_soon',
        css: {'table-light': true, 'table-sm': true},
        disable_sorting: true,
        label: 'Expiring Soon',
        empty_template: 'tpl_data_table_empty_with_label',
        results_per_page: 5,
        columns: [
            {
                sort_key: 'user:email',
                label: 'User',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<user:uid>',
                    label_key: 'user:email',
                },
            },
            {
                sort_key: 'client:name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client:uid>',
                    label_key: 'client:name',
                },
            },
            {
                label: 'Permission',
                key: 'permission:name',
            },
            {
                label: 'Expiry',
                key: 'expiry',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:expiring_soon',
                results_per_page: 5,
            },
        },
    });

    self.user_stats = self.new_instance(TimeseriesChart, {
        id: 'user_stats',
        colors: [
            '#4D4D4D',
            '#6D83A3',
            '#3A66C3',
            '#3AC376',
            '#C36161',
            '#8547D4',
            '#F95532',
            '#C33A3A',
            '#61C38C',
            '#6180C3',
            '#F97559',
        ],
        series: [
            {
                key: 'new_users',
                name: 'New Users',
                type: 'column',
            },
            {
                key: 'new_clients',
                name: 'New Clients',
                type: 'column',
            },
            {
                key: 'activations',
                name: 'Activations',
                type: 'column',
            },
            {
                key: 'sign_ins',
                name: 'Sign Ins',
                type: 'line',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:user_stats',
            },
        },
    });

    $.when(auth.dfd).done(() => {
        self.dfd.resolve();
    });

    return self;
}
