import ActionHeader from 'src/libs/components/basic/ActionHeader';
import NewDiligenceModal from 'src/libs/components/diligence/NewDiligenceModal';
import BatchDiligenceModal from 'src/libs/components/diligence/BatchDiligenceModal';
import RenameDiligenceModal from 'src/libs/components/diligence/RenameDiligenceModal';
import ActionButton from 'src/libs/components/basic/ActionButton';
import DeleteDiligenceModal from 'src/libs/components/diligence/DeleteDiligenceModal';
import DetachDiligenceModal from 'src/libs/components/modals/DetachDiligenceModal';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import Aside from 'src/libs/components/basic/Aside';
import * as Utils from 'src/libs/Utils';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import Observer from 'src/libs/Observer';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import ArchiveProjectModal from 'src/libs/components/diligence/ArchiveProjectModal';
import UnarchiveProjectModal from 'src/libs/components/diligence/UnarchiveProjectModal';
import DiligenceDataTable from 'src/libs/components/market_insights/DiligenceDataTable';
import ShareModal from 'src/libs/components/modals/ShareModal';
import ko from 'knockout';

class DiligenceSearch extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();

        this.template = opts.template || 'tpl_test_body';

        this.events = this.new_instance(EventRegistry, {});

        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('search_count', 'DataTable.counts');
        this.events.resolve_and_add('name', 'StringFilter.value');
        this.events.resolve_and_add('unarchive', 'ActionButton.visible');
        this.events.resolve_and_add('archive', 'ActionButton.visible');
        this.events.resolve_and_add('view_archive_toggle', 'BooleanButton.state');
        this.events.resolve_and_add('add_provisional_fund', 'ActionButton');
        this.events.resolve_and_add('rename_project', 'EventButton');

        this.data_table_id = Utils.gen_id(this.get_id(), 'search_state', 'content', 'table');
        this.register_export_id = Utils.gen_id(
            this.get_id(),
            'page_wrapper',
            'search_state',
            'content',
            'action_toolbar',
            'export_actions',
        );
        this.project_uid_event = opts.project_uid_event;
        this.family_uid_event = opts.family_uid_event;
        if (this.family_uid_event) {
            this.family_uid = Observer.observable(this.family_uid_event);
        }
        Observer.register(this.events.get('view_archive_toggle'), state => {
            Observer.broadcast(this.events.get('unarchive'), !state);
            Observer.broadcast(this.events.get('archive'), state);
        });

        this.archived = Observer.observable(this.events.get('view_archive_toggle')).extend({
            rateLimit: 250,
        });

        this.cpanel_components = [
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
                id_callback: this.events.register_alias('name'),
                template: 'tpl_string_filter',
                cpanel_style: true,
                clear_event: this.events.get('clear'),
                enable_localstorage: true,
                placeholder: 'Name...',
            },
            {
                component: MetaInfo,
                id: 'meta_info',
                label: 'Results',
                format: 'visible_count',
                datasource: {
                    type: 'observer',
                    event_type: this.events.get('search_count'),
                },
            },
            {
                id: 'filter_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filters',
            },
            {
                id: 'view_archive_toggle',
                component: BooleanButton,
                id_callback: this.events.register_alias('view_archive_toggle'),
                template: 'tpl_cpanel_boolean_button',
                default_state: false,
                reset_event: this.events.get('clear'),
                label: 'View Archive',
            },
        ];

        this.cpanel = {
            id: 'cpanel',
            component: Aside,
            template: 'tpl_cpanel',
            layout: {
                body: ['search_label', 'name', 'meta_info', 'filter_label', 'view_archive_toggle'],
            },
            components: this.cpanel_components,
        };

        this.table_columns = [
            {
                label: 'Name',
                key: 'name',
                sort_key: 'name',
                disable_sorting: false,
            },
            {
                label: 'Date Created',
                key: 'created',
                sort_key: 'created',
                format: 'backend_date',
                disable_sorting: false,
            },
        ];

        this.table = {
            id: 'table',
            component: DiligenceDataTable,
            enable_selection: true,
            dropdown_enable_selection: true,
            id_callback: this.events.register_alias('search_count'),
            css: {'table-light': true, 'table-sm': true},
            dropdown_css: {'table-light': true, 'table-drop': true},
            columns: this.table_columns,
            click_row_expand: true,
            enable_fund_creation: true,
            empty_template: ko.pureComputed(() => {
                if (this.archived()) {
                    return 'tpl_data_table_empty_data_manager_archived';
                }
                return 'tpl_data_table_empty_diligence_list';
            }),
            dropdown_empty_template: 'tpl_dropdown_data_table_empty_diligence_list',
            dropdown_data_list: 'funds',
            dropdown_row_key: 'entity_uid',
            layout: {
                new_list_button: 'new_diligence',
                attach_to_project_button: 'attach_to_project',
                add_provisional_fund_button: 'add_provisional_fund',
            },
            dropdown_columns: [
                {
                    label: 'Name',
                    key: 'name',
                    url: '#!/diligence/',
                },
                {
                    label: 'Cash Flow Type',
                    key: 'uf_type',
                    format: 'entity_type',
                },
                {
                    label: 'Has Cash Flows',
                    key: 'has_cashflows',
                    format: 'boolean_highlight',
                },
                {
                    label: 'IRR',
                    key: 'irr',
                    format: 'percent',
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    format: 'multiple',
                },
                {
                    label: 'TVPI',
                    key: 'tvpi',
                    format: 'multiple',
                },
            ],
            components: [
                {
                    id: 'new_diligence',
                    label: 'New Diligence Project <span class="icon-plus"></span>',
                    component: ActionButton,
                    css: {
                        btn: true,
                        'btn-success': true,
                        'btn-lg': true,
                    },
                    trigger_modal: {
                        component: NewDiligenceModal,
                        modal_title: 'Create new diligence project',
                        submit_label: 'Create',
                    },
                },
                {
                    id: 'attach_to_project',
                    label: 'Go to My Data <span class="glyphicon icon-upload"></span>',
                    component: ActionButton,
                    css: {
                        btn: true,
                        'btn-success': true,
                        'btn-lg': true,
                    },
                    trigger_url: {url: 'data-manager'},
                },
                {
                    id: 'add_provisional_fund',
                    id_callback: this.events.register_alias('add_provisional_fund'),
                    component: ActionButton,
                    action: 'add_provisional_fund',
                    project_uid_event: this.project_uid_event,
                },
            ],
            register_export: {
                export_event_id: this.register_export_id,
                title: 'Lists',
                subtitle: 'CSV',
            },
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'diligence_list',
                    results_per_page: 50,
                    show_hidden: {
                        type: 'observer',
                        event_type: this.events.get('view_archive_toggle'),
                        default: false,
                    },
                    filters: {
                        type: 'dynamic',
                        query: {
                            name: {
                                type: 'observer',
                                event_type: this.events.get('name'),
                                default: '',
                            },
                            created: {
                                type: 'observer',
                                event_type: this.events.get('created'),
                            },
                        },
                    },
                },
            },
        };

        this.breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Diligence Reports',
                    link: '#!/diligence',
                },
                {
                    label: 'Search',
                },
            ],
        };

        this.header = {
            id: 'header',
            component: BreadcrumbHeader,
            template: 'tpl_breadcrumb_header',
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [this.breadcrumb],
        };

        this.share_config = {
            id: 'share_projects',
            action: 'share_diligence_project',
            label: 'Share Selected <span class="icon-share"></span>',
            use_header_data: true,
            check_permissions: true,
            trigger_modal: {
                id: 'share_modal',
                component: ShareModal,
                check_permissions: true,
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
                        label: 'Permissions',
                        key: 'permissions',
                        format: 'strings',
                    },
                    {
                        label: 'Permission to share',
                        key: 'share',
                        format: 'boolean_highlight',
                    },
                ],
            },
            datasource: {
                type: 'observer',
                default: [],
                mapping: projects =>
                    projects.map(project => {
                        project.diligence_project_uid = project.uid;
                        return project;
                    }),
                event_type: Utils.gen_event(
                    'DataTable.selected',
                    Utils.gen_id(this.get_id(), 'search_state', 'content', 'table'),
                ),
            },
            css: {
                btn: true,
                'btn-transparent': true,
            },
            disabled_callback: data => {
                if (Object.isArray(data)) {
                    return (
                        data.filter(entity => {
                            return entity.share;
                        }).length < 1
                    );
                }

                return !data || !data.share;
            },
        };

        this.action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                this.share_config,
                DataManagerHelper.buttons.detach_entity({
                    component: DetachDiligenceModal,
                    origin_url: '#!/diligence',
                    disabled_callback: true,
                    from_diligence_search: true,
                    data_table_id: this.data_table_id,
                    trigger_modal: {
                        table_columns: [
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                label: 'Created',
                                key: 'created',
                            },
                        ],
                    },
                }),
                DataManagerHelper.buttons.delete_projects({
                    component: DeleteDiligenceModal,
                    origin_url: '#!/diligence',
                    disabled_callback: true,
                    check_permissions: true,
                    data_table_id: this.data_table_id,
                    table_columns: [
                        {
                            label: 'Name',
                            key: 'name',
                        },
                        {
                            label: 'Created',
                            key: 'created',
                            format: 'backend_date',
                        },
                    ],
                }),
                DataManagerHelper.buttons.archive_entities({
                    id_callback: this.events.register_alias('archive'),
                    component: ArchiveProjectModal,
                    check_permissions: true,
                    data_table_id: this.data_table_id,
                    visible_event: this.events.get('archive'),
                }),
                DataManagerHelper.buttons.unarchive_entities({
                    id_callback: this.events.register_alias('unarchive'),
                    component: UnarchiveProjectModal,
                    data_table_id: this.data_table_id,
                    check_permissions: true,
                    visible_event: this.events.get('unarchive'),
                    default_visibility: 'hidden',
                }),
                DataManagerHelper.buttons.rename_project({
                    id_callback: this.events.register_alias('rename_project'),
                    component: RenameDiligenceModal,
                    check_permissions: true,
                    disabled_callback: true,
                    data_table_id: this.data_table_id,
                }),
                {
                    id: 'new_diligence',
                    label: 'Create New Diligence <span class="icon-plus"></span>',
                    trigger_modal: {
                        modal_title: 'Create new diligence project',
                        submit_label: 'Create',
                        component: NewDiligenceModal,
                    },
                },
                {
                    id: 'batch_diligence',
                    label: 'Bulk Import <span class="icon-upload"></span>',
                    trigger_modal: {
                        modal_title: 'Bulk Import Tool',
                        submit_label: 'Upload',
                        component: BatchDiligenceModal,
                    },
                },
            ],
        };

        this.content_components = [this.header, this.action_toolbar, this.table];

        this.content = {
            id: 'content',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'table',
            },
            components: this.content_components,
        };

        this.body_components = [this.cpanel, this.content];

        this.body = this.new_instance(Aside, {
            id: 'search_state',
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'content'],
            },
            components: this.body_components,
        });

        this.when(this.body).done(() => {
            dfd.resolve();
        });
    }
}
export default DiligenceSearch;
