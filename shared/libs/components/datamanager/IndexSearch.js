/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.results_per_page = opts.results_per_page || 50;

    self.cpanel_id = opts.cpanel_id;
    self.clear_event = opts.clear_event;

    self.data_table_id = Utils.gen_id(self.get_id(), 'body', 'entities_table');

    DataManagerHelper.register_upload_wizard_event(
        Utils.gen_event(
            'ActionButton.action.upload',
            self.get_id(),
            'body',
            'action_toolbar',
            'upload',
        ),
    );

    DataManagerHelper.register_create_new_entity_action_button(
        Utils.gen_id(self.get_id(), 'body', 'action_toolbar', 'new'),
    );

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'body',
        'action_toolbar',
        'export_actions',
    );

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'entities_table',
        },
        components: [
            {
                id: 'action_toolbar',
                component: ActionHeader,
                template: 'tpl_action_toolbar',
                valid_export_features: ['analytics'],
                buttons: [
                    DataManagerHelper.buttons.delete_entities({
                        data_table_id: self.data_table_id,
                        check_permissions: true,
                    }),
                    DataManagerHelper.buttons.share({
                        data_table_id: self.data_table_id,
                        check_permissions: true,
                    }),
                    DataManagerHelper.buttons.upload(),
                ],
            },
            {
                component: BreadcrumbHeader,
                id: 'header',
                template: 'tpl_breadcrumb_header',
                origin_url: '#!/data-manager/indexes',
                title: 'Indexes',
                layout: {
                    breadcrumb: 'breadcrumb',
                },
                components: [
                    {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Data Manager',
                                link: '#!/data-manager',
                            },
                            {
                                label: 'Indexes',
                            },
                        ],
                    },
                ],
            },
            {
                component: DataTable,
                id: 'entities_table',
                enable_selection: true,
                enable_column_toggle: true,
                enable_clear_order: true,
                enable_csv_export: false,
                row_key: 'id',
                column_toggle_css: {'fixed-column-toggle': true},
                css: {'table-light': true, 'table-sm': true},
                results_per_page: self.results_per_page,
                clear_order_event: self.clear_event,
                register_export: {
                    export_event_id: self.register_export_id,
                    title: 'Search Results',
                    subtitle: 'CSV',
                },
                columns: [
                    {
                        label: 'Name',
                        sort_key: 'name',
                        format: 'entity_link',
                        format_args: {
                            base_url: '#!/data-manager/indexes',
                        },
                    },
                    {
                        label: 'First Date',
                        key: 'first_date',
                        format: 'backend_date',
                    },
                    {
                        label: 'Last Date',
                        key: 'last_date',
                        format: 'backend_date',
                    },
                    {
                        label: 'Shared by',
                        key: 'shared_by',
                        format: 'strings',
                    },
                    {
                        label: 'Permissons',
                        key: 'permissions',
                        format: 'strings',
                    },
                    {
                        label: 'Created',
                        key: 'created',
                        format: 'backend_date',
                    },
                ],
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'user:indexes',
                        exclude_open_indexes: true,
                        filters: {
                            type: 'dynamic',
                            query: {
                                name: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'StringFilter.value',
                                        self.cpanel_id,
                                        'tools',
                                        'indexes',
                                        'name',
                                    ),
                                    default: '',
                                },
                                permissions: {
                                    type: 'observer',
                                    event_type: Utils.gen_event(
                                        'PopoverButton.value',
                                        self.cpanel_id,
                                        'tools',
                                        'indexes',
                                        'permissions',
                                    ),
                                    default: '',
                                },
                            },
                        },
                    },
                },
            },
        ],
    });

    self.when(self.body).done(() => {
        _dfd.resolve();
    });

    return self;
}
