import ActionButton from 'src/libs/components/basic/ActionButton';
import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataManagerSearchModal from 'src/libs/components/how_to_modals/DataManagerSearchModal';
import MergeCompaniesModal from 'src/libs/components/modals/MergeCompaniesModal';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import DeleteCompaniesModal from 'src/libs/components/modals/DeleteCompaniesModal';

class CompanySearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.results_per_page = opts.results_per_page || 50;

        this.clear_event = opts.clear_event;

        this.cpanel_id = opts.cpanel_id;

        this.data_table_id = Utils.gen_id(this.get_id(), 'body', 'entities_table');

        this.archived = Observer.observable(
            Utils.gen_event(
                'BooleanButton.state',
                this.cpanel_id,
                'tools',
                'vehicles',
                'view_archive_toggle',
            ),
        ).extend({rateLimit: 250});

        DataManagerHelper.register_upload_wizard_event(
            Utils.gen_event(
                'ActionButton.action.upload',
                this.get_id(),
                'body',
                'action_toolbar',
                'upload',
            ),
        );

        DataManagerHelper.register_upload_wizard_event(
            Utils.gen_event(
                'ActionButton.action.upload',
                this.get_id(),
                'body',
                'entities_table',
                'upload',
            ),
        );

        DataManagerHelper.register_create_new_entity_action_button(
            Utils.gen_id(this.get_id(), 'body', 'action_toolbar', 'new'),
        );

        this.register_export_id = Utils.gen_id(
            this.get_id(),
            'body',
            'action_toolbar',
            'export_actions',
        );

        this.toolbar_buttons = [
            DataManagerHelper.buttons.delete_entities({
                component: DeleteCompaniesModal,
                data_table_id: this.data_table_id,
            }),
            DataManagerHelper.buttons.new_entity({
                data_table_id: this.data_table_id,
                disable_on_selection: true,
            }),
            DataManagerHelper.buttons.upload(),
            {
                id: 'merge_companies',
                label: 'Merge <span class="glyphicon glyphicon-resize-small"></span>',
                action: 'merge_companies',
                trigger_modal: {
                    id: 'merge',
                    component: MergeCompaniesModal,
                },
                disabled_callback: function(data) {
                    return data.length < 2;
                },
                css: {
                    btn: true,
                    'btn-transparent-info': true,
                },
                datasource: {
                    type: 'observer',
                    default: [],
                    event_type: Utils.gen_event('DataTable.selected', this.data_table_id),
                },
            },
        ];

        this.body = this.new_instance(Aside, {
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
                    data_table_id: this.data_table_id,
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event('DataTable.selected', this.data_table_id),
                    },
                    buttons: this.toolbar_buttons,
                },
                {
                    component: BreadcrumbHeader,
                    id: 'header',
                    template: 'tpl_breadcrumb_header',
                    buttons: [
                        {
                            id: 'tips',
                            label:
                                'How to Use <span class="glyphicon glyphicon-info-sign" style="margin-right:5px;"></span>',
                            action: 'show_modal',
                        },
                    ],
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
                                    label: 'Companies',
                                },
                            ],
                        },
                    ],
                },
                {
                    component: DataTable,
                    id: 'entities_table',
                    enable_localstorage: true,
                    enable_selection: true,
                    enable_column_toggle: true,
                    enable_clear_order: true,
                    enable_csv_export: false,
                    empty_template: 'tpl_data_table_empty_data_manager',
                    column_toggle_css: {'fixed-column-toggle': true},
                    css: {'table-light': true, 'table-sm': true},
                    results_per_page: this.results_per_page,
                    clear_order_event: this.clear_event,
                    register_export: {
                        export_event_id: this.register_export_id,
                        title: 'Search Results',
                        subtitle: 'CSV',
                    },
                    components: [
                        {
                            id: 'upload',
                            component: ActionButton,
                            label: 'Upload <span class="icon-upload"></span>',
                            action: 'upload',
                            css: {
                                btn: true,
                                'btn-lg': true,
                                'btn-success': true,
                            },
                        },
                    ],
                    dynamic_columns: [
                        {
                            datasource: {
                                type: 'dynamic',
                                query: {
                                    target: 'company_table_columns',
                                },
                            },
                            placement: {
                                relative: 'Name',
                                position: 'right',
                            },
                        },
                    ],
                    columns: [
                        {
                            label: 'Name',
                            sort_key: 'name',
                            format: 'contextual_link',
                            format_args: {
                                label_key: 'name',
                                url: 'company-analytics/<uid>',
                            },
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'companies',
                            results_per_page: this.results_per_page,
                            filters: {
                                type: 'dynamic',
                                query: {
                                    name: {
                                        type: 'observer',
                                        event_type: Utils.gen_event(
                                            'StringFilter.value',
                                            this.cpanel_id,
                                            'tools',
                                            'companies',
                                            'name',
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

        this.tips_modal = this.new_instance(DataManagerSearchModal, {
            id: 'tips_modal',
        });

        this.when(this.body).done(() => {
            Observer.register_for_id(
                Utils.gen_id(this.get_id(), 'body', 'header', 'tips'),
                'ActionButton.action.show_modal',
                () => {
                    this.tips_modal.show();
                },
            );

            _dfd.resolve();
        });
    }
}

export default CompanySearch;
