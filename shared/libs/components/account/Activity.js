/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * View for displaying activity performed by users belonging to client
 */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_account_content';

    self.action_type_event = opts.action_type_event;

    self.content = self.new_instance(DataTable, {
        id: 'table',
        css: {'table-light': true, 'table-sm': true},
        columns: [
            {
                label: 'Date',
                key: 'created',
                format: 'backend_date',
            },
            {
                label: 'Action Type',
                key: 'action_type',
                format: 'actions',
            },
            {
                label: 'Entity Type',
                key: 'entity_type',
                format: 'entity_type',
            },
            {
                label: 'User',
                key: 'email',
            },
        ],
        label: 'Activity',
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'account:client_activity',
                filters: {
                    type: 'dynamic',
                    query: {
                        action_type: {
                            type: 'observer',
                            mapping: 'get_values',
                            event_type: self.action_type_event,
                            default: [],
                        },
                    },
                },
            },
        },
    });

    self.when(self.content).done(self.dfd.resolve);

    return self;
}
