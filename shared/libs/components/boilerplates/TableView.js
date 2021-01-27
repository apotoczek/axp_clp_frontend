/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.events = self.new_instance(EventRegistry, {});
    self.parent_events = opts.events;

    self.events.resolve_and_add('table', 'DataTable.count', 'table_results_count');

    self.results_per_page = 50;

    self.table = self.new_instance(DataTable, {
        id: 'table',
        id_callback: self.events.register_alias('table'),
        enable_localstorage: true,
        enable_selection: true,
        enable_column_toggle: true,
        enable_clear_order: true,
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Search Results',
            subtitle: 'CSV',
        },
        css: {'table-light': true, 'table-sm': true},
        results_per_page: self.results_per_page,
        clear_order_event: self.parent_events.cpanel_events.get('clear_table_view_cpanel'),
        columns: [
            {
                label: 'Name',
                key: 'name',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'market_data:funds',
                results_per_page: self.results_per_page,
                filters: {
                    type: 'dynamic',
                    query: {
                        name: {
                            type: 'observer',
                            event_type: self.parent_events.cpanel_events.get('name_string_filter'),
                            default: '',
                        },
                    },
                },
            },
        },
    });

    self.define_default_template(`
            <!-- ko renderComponent: table --><!-- /ko -->
        `);

    self.when(self.table).done(() => {
        Observer.register(self.events.get('table_results_count'), count => {
            Observer.broadcast(self.parent_events.cpanel_events.get('result_count'), count);
        });
        self.dfd.resolve();
    });
    return self;
}
