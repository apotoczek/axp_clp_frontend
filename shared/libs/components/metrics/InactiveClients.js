/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Aside from 'src/libs/components/basic/Aside';
import MetricsHelper from 'src/libs/MetricsHelper';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.page_events = opts.events;

    let table = Object.assign(MetricsHelper.get_datatable_config({}), {
        id: 'table',
        label: 'Inactive clients',
        columns: MetricsHelper.get_columns_from_keys([
            'client_name',
            'last_sign_in',
            'last_signed_in_user',
        ]),
        datasource: MetricsHelper.get_datasource({
            target: 'commander:inactive_clients',
            period_event: self.page_events.get('time_period_changed'),
        }),
    });

    self.page = {
        id: 'inactive_clients',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['table'],
        },
        components: [table],
    };

    return self;
}
