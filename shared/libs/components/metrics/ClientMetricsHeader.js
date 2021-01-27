/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import DataTable from 'src/libs/components/basic/DataTable';
import TextBox from 'src/libs/components/basic/TextBox';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';
import MetricsHelper from 'src/libs/MetricsHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let dfd = self.new_deferred();
    self.events = opts.events;
    self.exclude_users_table = opts.exclude_users_table;

    let client_data_source = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:client',
                uid: {
                    type: 'observer',
                    event_type: self.events.get('client_changed'),
                    required: true,
                },
            },
        },
    });

    let client_link_button = ko.computed(() => {
        if (client_data_source.data()) {
            let data = client_data_source.data();
            return `
                <a
                    class="btn btn-default pull-right"
                    href="/#!/clients/${data.uid}"
                >
                    Manage Client
                </a>
            `;
        }
    });

    let client_link = {
        id: 'client_link',
        component: HTMLContent,
        html: client_link_button,
    };

    let client_info = {
        id: 'client_info',
        component: TextBox,
        data: ko.computed(() => {
            if (client_data_source.data()) {
                return client_data_source.data().name;
            }
            return '';
        }),
    };

    let client_users = {
        id: 'client_users',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        label: 'Users',
        empty_template: 'tpl_data_table_empty_with_label',
        results_per_page: 10,
        columns: MetricsHelper.get_columns_from_keys([
            'email',
            'name',
            'last_sign_in_for_user',
            'sign_in_count',
        ]),
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:users',
                results_per_page: 10,
                filters: {
                    type: 'dynamic',
                    query: {
                        client_uid: {
                            type: 'observer',
                            event_type: self.events.get('client_changed'),
                            required: true,
                        },
                    },
                },
            },
        },
    };

    let breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Metrics',
                link: '/#!/metrics',
            },
            {
                label_key: 'name',
                data: client_data_source.data,
            },
        ],
    };

    self.body_layout = ['breadcrumb', 'client_info', 'client_link'];
    if (!self.exclude_users_table) {
        self.body_layout.push('client_users');
    }

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: self.body_layout,
        },
        components: [breadcrumb, client_info, client_link, client_users],
    });

    self.when(self.body).done(dfd.resolve);

    return self;
}
