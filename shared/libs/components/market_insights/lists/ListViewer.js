/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import DeleteListEntitiesModal from 'src/libs/components/market_insights/lists/DeleteListEntitiesModal';
import EditListModal from 'src/libs/components/market_insights/lists/EditListModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';

    self.list_uid_event = opts.list_uid_event;
    self.list_uid = ko.observable();
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Lists',
                link: '#!/lists',
            },
            {
                datasource: {
                    key: 'name',
                    type: 'dynamic',
                    query: {
                        target: 'list',
                        uid: {
                            type: 'observer',
                            event_type: self.list_uid_event,
                            required: true,
                        },
                    },
                },
            },
        ],
    };

    self.header = {
        id: 'header',
        component: BreadcrumbHeader,
        template: 'tpl_breadcrumb_header',
        css: {'no-cpanel': true},
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        valid_export_features: ['active_subscription'],
        buttons: [
            {
                label: 'Edit list',
                trigger_modal: {
                    component: EditListModal,
                    list_uid: self.list_uid,
                },
            },
            DataManagerHelper.buttons.delete_entities({
                label: 'Remove Selected',
                component: DeleteListEntitiesModal,
                list_uid_event: self.list_uid_event,
                origin_url: {
                    type: 'observer',
                    event_type: self.list_uid_event,
                    prefix: '#!/lists',
                },
                data_table_id: Utils.gen_id(self.get_id(), 'body', 'content', 'list_entities'),
                table_columns: [
                    {
                        label: 'Name',
                        key: 'name',
                    },
                ],
            }),
        ],
    };

    self.list_entities = {
        id: 'list_entities',
        component: DataTable,
        enable_selection: true,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_list',
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                format: 'list_entity_link',
            },
            {
                key: 'entity_type',
                label: 'Type',
                format: 'entity_type',
            },
        ],
        register_export: {
            export_event_id: self.register_export_id,
            title: 'List',
            subtitle: 'CSV',
        },
        inline_data: true,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'list:entities',
                uid: {
                    type: 'observer',
                    event_type: self.list_uid_event,
                    required: true,
                },
            },
        },
    };

    self.body_content = {
        id: 'content',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['list_entities'],
        },
        components: [self.list_entities],
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'content',
        },
        components: [self.header, self.action_toolbar, self.body_content],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();

        Observer.register(self.list_uid_event, uid => {
            self.list_uid(uid);
        });
    });

    return self;
}
