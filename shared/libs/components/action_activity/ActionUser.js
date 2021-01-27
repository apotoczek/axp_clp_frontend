/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.define_template(`
            <!-- ko renderComponent: table_wrapper --><!-- /ko -->
        `);

    self.user_uid_event = opts.user_uid_event;

    self.table = {
        id: 'action_table',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'User',
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
                sort_key: 'user_name',
                key: 'user:name',
                label: 'Name',
            },
            {
                sort_key: 'client_name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client:uid>',
                    label_key: 'client:name',
                },
            },
            {
                sort_key: 'action_type',
                key: 'action:action_type',
                label: 'Action',
                format: 'actions',
            },
            {
                sort_key: 'entity_type',
                key: 'action:entity_type',
                label: 'Entity',
                format: 'entity_type',
            },
            {
                sort_key: 'created',
                key: 'action:created',
                label: 'Date',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:action_activity',
                filters: {
                    type: 'dynamic',
                    query: {
                        user_uid: {
                            type: 'observer',
                            event_type: self.user_uid_event,
                            required: true,
                        },
                    },
                },
            },
        },
    };

    self.table_wrapper = self.new_instance(Aside, {
        id: 'table_wrapper',
        template: 'tpl_aside_main_content',
        layout: {
            body: ['action_table'],
        },
        components: [self.table],
    });

    self.when(self.table_wrapper).done(() => {
        self.dfd.resolve();
    });

    return self;
}
