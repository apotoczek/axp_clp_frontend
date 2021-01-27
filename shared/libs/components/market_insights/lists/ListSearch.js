/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DeleteListsModal from 'src/libs/components/market_insights/lists/DeleteListsModal';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import NewListModal from 'src/libs/components/market_insights/lists/NewListModal';
import ActionButton from 'src/libs/components/basic/ActionButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ListsModal from 'src/libs/components/how_to_modals/ListsModal';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import ShareModal from 'src/libs/components/modals/ShareModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_test_body';

    self.clear_event = Utils.gen_event(
        'EventButton',
        self.get_id(),
        'search_state',
        'cpanel',
        'clear_button',
    );
    self.new_list_event = Utils.gen_event('List.new', self.get_id());
    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'page_wrapper',
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );

    self.cpanel_components = [
        {
            id: 'search_label',
            component: Label,
            css: {'first-header': true},
            template: 'tpl_cpanel_label',
            label: 'Search',
        },
        {
            id: 'name',
            component: StringFilter,
            template: 'tpl_string_filter',
            cpanel_style: true,
            clear_event: Utils.gen_event('EventButton', self.get_id(), 'cpanel', 'clear_button'),
            enable_localstorage: true,
            placeholder: 'Name...',
        },
        {
            component: MetaInfo,
            id: 'meta_info',
            label: 'Results',
            format: 'number',
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.count',
                    self.get_id(),
                    'search_state',
                    'content',
                    'table',
                ),
            },
        },
    ];

    self.cpanel = {
        id: 'cpanel',
        component: Aside,
        template: 'tpl_cpanel',
        layout: {
            body: ['search_label', 'name', 'meta_info'],
        },
        components: self.cpanel_components,
    };

    self.table_columns = [
        {
            label: 'Name',
            sort_key: 'name',
            format: 'entity_link',
            format_args: {
                url: 'lists.uid',
                label_key: 'name',
            },
        },
        {
            label: 'Shared By',
            key: 'share_info:shared_by',
        },
        {
            label: 'Read',
            key: 'share_info:read',
            format: 'boolean_highlight',
        },
        {
            label: 'Write',
            key: 'share_info:write',
            format: 'boolean_highlight',
        },
        {
            label: 'Share',
            key: 'share_info:share',
            format: 'boolean_highlight',
        },
    ];

    self.breadcrumb = self.new_instance(Breadcrumb, {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Build Peer Set',
                link: '#!/lists',
            },
            {
                label: 'Search',
            },
        ],
    });

    self.table_filters = {
        type: 'dynamic',
        query: {
            name: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'StringFilter.value',
                    self.get_id(),
                    'search_state',
                    'cpanel',
                    'name',
                ),
                default: '',
            },
        },
    };

    self.table_datasource = {
        type: 'dynamic',
        query: {
            target: 'user:lists',
            results_per_page: 50,
            filters: self.table_filters,
        },
    };

    self.table = {
        id: 'table',
        component: DataTable,
        enable_selection: true,
        css: {'table-light': true, 'table-sm': true},
        columns: self.table_columns,
        empty_template: 'tpl_data_table_empty_lists',
        datasource: self.table_datasource,
        layout: {
            new_list_button: 'new_list',
        },
        components: [
            {
                id: 'new_list',
                label: 'New List <span class="glyphicon glyphicon-plus"></span>',
                component: ActionButton,
                css: {
                    btn: true,
                    'btn-success': true,
                    'btn-lg': true,
                },
                trigger_modal: {
                    component: NewListModal,
                },
            },
        ],
        results_per_page: 50,
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Lists',
            subtitle: 'CSV',
        },
    };

    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Lists',
                link: '#!/lists',
            },
            {
                label: 'Search',
            },
        ],
    };

    self.header = {
        id: 'header',
        component: BreadcrumbHeader,
        template: 'tpl_breadcrumb_header',
        buttons: [
            {
                id: 'tips',
                label: 'How to Use <span class="glyphicon glyphicon-info-sign"></span>',
                action: 'show_modal',
            },
        ],
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
    };

    let share_config = {
        id: 'share_lists',
        action: 'share_lists',
        label: 'Share Selected <span class="icon-share"></span>',
        use_header_data: true,
        trigger_modal: {
            id: 'share_modal',
            component: ShareModal,
            shares_table_datasource: {
                type: 'dynamic',
                one_required: ['list_uid'],
                query: {
                    target: 'list:shares',
                },
            },
            shared_table_columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Description',
                    key: 'description',
                    format: 'trucate',
                    format_args: {
                        max_length: 40,
                    },
                },
            ],
        },
        datasource: {
            type: 'observer',
            default: [],
            mapping: lists =>
                lists.map(list => {
                    list.list_uid = list.uid;
                    return list;
                }),
            event_type: Utils.gen_event(
                'DataTable.selected',
                Utils.gen_id(self.get_id(), 'search_state', 'content', 'table'),
            ),
        },
        css: {
            btn: true,
            'btn-transparent': true,
        },
        disabled_callback: data => data.length < 1,
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [
            DataManagerHelper.buttons.delete_entities({
                component: DeleteListsModal,
                origin_url: '#!/lists',
                data_table_id: Utils.gen_id(self.get_id(), 'search_state', 'content', 'table'),
                table_columns: [
                    {
                        label: 'Name',
                        key: 'name',
                    },
                    {
                        label: 'Permission to delete',
                        key: 'is_owner',
                        format: 'boolean_highlight',
                    },
                ],
            }),
            {
                id: 'new_list',
                label: 'New List <span class="glyphicon glyphicon-plus"></span>',
                trigger_modal: {
                    component: NewListModal,
                },
            },
            share_config,
        ],
    };

    self.content_components = [self.header, self.action_toolbar, self.table];

    self.content = {
        id: 'content',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'table',
        },
        components: self.content_components,
    };

    self.body_components = [self.cpanel, self.content];

    self.body = self.new_instance(Aside, {
        id: 'search_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['cpanel', 'content'],
        },
        components: self.body_components,
    });

    self.tips_modal = self.new_instance(ListsModal, {
        id: 'tips_modal',
    });

    self.when(self.body, self.tips_modal).done(() => {
        Observer.register_for_id(
            Utils.gen_id(self.get_id(), 'search_state', 'content', 'header', 'tips'),
            'ActionButton.action.show_modal',
            () => {
                self.tips_modal.show();
            },
        );

        self.dfd.resolve();
    });

    return self;
}
