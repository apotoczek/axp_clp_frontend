/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import TextBox from 'src/libs/components/basic/TextBox';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let dfd = self.new_deferred();
    self.events = opts.events;

    let user_data_source = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:user',
                uid: {
                    type: 'observer',
                    event_type: self.events.get('user_changed'),
                    required: true,
                },
            },
        },
    });

    let user_link = {
        id: 'user_link',
        component: HTMLContent,
        html: ko.computed(() => {
            if (user_data_source.data()) {
                let data = user_data_source.data();
                return `
                    <a
                        class="btn btn-default pull-right"
                        href="/#!/users/${data.uid}"
                    >
                        Manage User
                    </a>
                `;
            }
        }),
    };

    let client_link = {
        id: 'client_link',
        component: HTMLContent,
        html: ko.computed(() => {
            if (user_data_source.data()) {
                let data = user_data_source.data();
                return `
                    <a
                        class="btn btn-default pull-right"
                        href="/#!/clients/${data.client_uid}"
                        style="margin-left:10px;"
                    >
                        Manage Client
                    </a>
                `;
            }
        }),
    };

    let user_email = {
        id: 'user_email',
        component: HTMLContent,
        html: ko.computed(() => {
            if (user_data_source.data()) {
                return `<p>${user_data_source.data().email}</p>`;
            }
            return '';
        }),
    };

    let user_info = {
        id: 'user_info',
        component: TextBox,
        data: ko.computed(() => {
            if (user_data_source.data()) {
                return user_data_source.data().name;
            }
            return '';
        }),
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
                label_key: 'client_name',
                link_key: 'client_uid',
                link_format: client_uid => `/#!/metrics/client/${client_uid}`,
                data: user_data_source.data,
            },
            {
                label_key: 'email',
                data: user_data_source.data,
            },
        ],
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['breadcrumb', 'user_info', 'client_link', 'user_link', 'user_email'],
        },
        components: [breadcrumb, user_info, client_link, user_link, user_email],
    });

    self.when(self.body).done(dfd.resolve);

    return self;
}
