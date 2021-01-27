import DataTable from 'src/libs/components/basic/DataTable';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import CreateTextDataSpecModal from 'src/libs/components/modals/CreateTextDataSpecModal';
import DataThing from 'src/libs/DataThing';
import {TextDataSpecType} from 'src/libs/Enums';

class TextFieldsSearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

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

        this._delete_text_data_specs = DataThing.backends.text_data({
            url: 'delete_specs',
        });

        this.toolbar_buttons = [
            {
                id: 'new_text_field',
                action: 'new_text_field',
                label:
                    'New Text Field <span class="glyphicon glyphicon-plus" style="margin-right:5px;"></span>',
                trigger_modal: {
                    id: 'text_field_modal',
                    component: CreateTextDataSpecModal,
                },
            },
            DataManagerHelper.buttons.confirm({
                data_table_id: this.data_table_id,
                label: 'Delete Selected <span class="icon-trash-1"></span>',
                text: 'Are you sure you want to delete the selected fields?',
                callback: fields => {
                    this._delete_text_data_specs({
                        data: {
                            spec_uids: fields.map(s => s.uid),
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                    });
                },
            }),
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
                    disable_export: true,
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
                                    label: 'Text Fields',
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
                    column_toggle_css: {'fixed-column-toggle': true},
                    css: {'table-light': true, 'table-sm': true},
                    results_per_page: this.results_per_page,
                    clear_order_event: this.clear_event,
                    columns: [
                        {
                            label: 'Group',
                            key: 'group:label',
                        },
                        {
                            label: 'Label',
                            key: 'label',
                        },
                        {
                            label: 'Type',
                            key: 'text_data_type',
                            formatter: text_data_type => {
                                if (text_data_type === TextDataSpecType.Attribute) {
                                    return 'Dropdown';
                                }

                                return 'Free Text';
                            },
                        },
                    ],
                    inline_data: true,
                    datasource: {
                        type: 'dynamic',
                        key: 'specs',
                        query: {
                            target: 'text_data_specs',
                        },
                    },
                },
            ],
        });

        this.when(this.body).done(() => {
            _dfd.resolve();
        });
    }
}

export default TextFieldsSearch;
