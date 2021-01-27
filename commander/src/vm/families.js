import {stripIndent} from 'common-tags';

import pager from 'pager';
import auth from 'auth';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import ActionButton from 'src/libs/components/basic/ActionButton';
import EditForm from 'src/libs/components/forms/EditForm';
import MetricTable from 'src/libs/components/MetricTable';
import EventButton from 'src/libs/components/basic/EventButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import CreateFamilyModal from 'src/libs/components/modals/CreateFamilyModal';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

import config from 'src/config';

import DataSource from 'src/libs/DataSource';

class Families extends Context {
    constructor() {
        super({id: 'families'});

        this.dfd = this.new_deferred();

        this.data_table_id = Utils.gen_id(
            this.get_id(),
            'page_wrapper',
            'search_families',
            'search_body',
            'search_table',
        );
        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('dataTable', 'DataTable.counts', 'dataTableCounts');
        this.events.resolve_and_add('dataTable', 'DataTable.selected', 'dataTableSelected');
        this.events.resolve_and_add('editFamily', 'ActionButton.action.edit');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('hasAttachment', 'PopoverButton.value');
        this.events.resolve_and_add(
            'upload_attachment',
            'FileUploadButton.action.upload_attachment',
        );
        this.events.resolve_and_add('delete_attachment', 'ActionButton.action.delete_attachment');
        this.events.resolve_and_add(
            'downloadFamilyMetrics',
            'ActionButton.action.download_family_metrics',
        );
        this.events.resolve_and_add('family_metrics_table', 'DataTable.selected');
        this.events.new('confirm_delete_attachment');
        this.events.new('confirm_delete_family');
        this.events.new('pageState');
        this.events.new('familyUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');
        this.family_uid = Observer.observable(this.events.get('familyUid'));

        this.endpoints = {
            delete_attachment: DataThing.backends.commander({url: 'delete_attachment'}),
            delete_families: DataThing.backends.commander({url: 'delete_families'}),
        };

        this.metric_columns = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                mapping: data => {
                    const res = [];
                    for (const metric of data.metrics) {
                        res.push({
                            key: metric.uid,
                            label: metric.name,
                        });
                    }
                    return res;
                },
                query: {
                    target: 'metrics_for_market_data',
                    scope: 'market_data_metric',
                },
            },
        });

        this.attachment_buttons = () => {
            if (!auth.user_has_feature('attachment_admin')) {
                return [];
            }
            return [
                {
                    id: 'upload_attachment',
                    id_callback: this.events.register_alias('upload_attachment'),
                    label: 'Upload Attachment <span class="icon-plus"></span>',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_attachment',
                    confirm_endpoint: 'confirm_upload_attachment',
                    cancel_endpoint: 'cancel_upload_attachment',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                    success_keys: [
                        {
                            label: 'Name',
                            key: 'name',
                        },
                        {
                            label: 'Family',
                            key: 'family_name',
                        },
                    ],
                    data: {
                        uid: this.family_uid,
                    },
                },
                {
                    id: 'delete_attachment',
                    component: ActionButton,
                    id_callback: this.events.register_alias('delete_attachment'),
                    label: 'Delete Attachment <span class="icon-trash"></span',
                    action: 'delete_attachment',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                        'btn-danger': true,
                    },
                    disabled_callback: data => !(data && Utils.is_set(data.results, true)),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'commander:attachment',
                            uid: {
                                type: 'observer',
                                event_type: this.events.get('familyUid'),
                                required: true,
                            },
                        },
                    },
                    trigger_modal: {
                        id: 'confirm_delete_attachment',
                        id_callback: this.events.register_alias('confirm_delete_attachment'),
                        component: ConfirmDeleteModal,
                        confirm_delete_event: this.events.get('confirm_delete_attachment'),
                        button_text: 'Delete Attachment',
                        text: 'Delete PDF Attachment?',
                    },
                },
                {
                    id: 'delete_family',
                    component: ActionButton,
                    id_callback: this.events.register_alias('delete_family'),
                    label: 'Delete Family <span class="icon-trash"></span',
                    action: 'delete_family',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                        'btn-danger': true,
                    },
                    trigger_modal: {
                        id: 'confirm_delete_family',
                        id_callback: this.events.register_alias('confirm_delete_family'),
                        component: ConfirmDeleteModal,
                        confirm_delete_event: this.events.get('confirm_delete_family'),
                        button_text: 'Delete Family',
                        text: 'Delete Family?',
                    },
                },
            ];
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Families',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Family<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateFamilyModal,
                        id: 'create_family_modal',
                    },
                },
                {
                    id: 'delete_families',
                    action: 'delete_selected',
                    label: 'Delete Families<span class="icon-trash">',
                    disable_if_no_data: true,
                    disabled_callback: data => {
                        if (data && data.length > 0) {
                            return false;
                        }
                        return true;
                    },
                    trigger_modal: {
                        id: 'delete_families_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_families',
                        to_delete_table_columns: [
                            {
                                label: 'UID',
                                key: 'uid',
                            },
                            {
                                label: 'Name',
                                key: 'name',
                            },
                        ],
                        datasource: {
                            type: 'observer',
                            default: [],
                            event_type: this.events.get('dataTableSelected'),
                        },
                    },
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                    },
                },
            ],
            data_table_id: this.data_table_id,
        };

        // Should only link to firm if user has edit_firm permission
        this.showFirm = () => {
            if (auth.user_has_features(['edit_firms'])) {
                return {
                    label: 'Firm',
                    sort_key: 'firm_name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'firms/<firm_uid>',
                        label_key: 'firm_name',
                    },
                };
            }

            return {
                label: 'Firm',
                key: 'firm_name',
            };
        };

        this.search_table = {
            id: 'search_table',
            id_callback: this.events.register_alias('dataTable'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            enable_localstorage: true,
            enable_clear_order: true,
            enable_csv_export: true,
            columns: [
                {
                    label: 'Family',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'families/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    type: 'component',
                    width: '30px',
                    component_callback: 'parent',
                    label: '',
                    component: {
                        id: 'attachment_icon',
                        component: BaseComponent,
                        template: stripIndent`
                        <!-- ko if: row.document_uid -->
                            <span class="glyphicon glyphicon-file"></span>
                        <!-- /ko -->
                        `,
                    },
                },
                this.showFirm(),
                {
                    label: 'Fund Template',
                    key: 'fund_template',
                },
                {
                    label: 'Defunct',
                    key: 'defunct',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_date',
                    visible: false,
                },
                {
                    label: 'Modified',
                    key: 'modified',
                    format: 'backend_date',
                    visible: false,
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:families',
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: this.events.get('stringFilter'),
                            },
                            has_attachment: {
                                type: 'observer',
                                event_type: this.events.get('hasAttachment'),
                                mapping: 'get_value',
                            },
                        },
                    },
                },
            },
        };

        this.search_body = {
            id: 'search_body',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_header, this.search_table],
        };

        this.search_cpanel = {
            id: 'search_cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['string_filter', 'attachment', 'meta', 'clear'],
            },
            components: [
                {
                    id: 'string_filter',
                    id_callback: this.events.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Family Name...',
                    enable_localstorage: true,
                    clear_event: this.events.get('clear'),
                },
                {
                    id: 'attachment',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('hasAttachment'),
                    css: {
                        'btn-sm': true,
                        'btn-primary': true,
                        'btn-block': true,
                    },
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Attachment',
                    popover_options: {
                        title: 'Attachment',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        datasource: {
                            type: 'static',
                            data: [
                                {
                                    label: 'Yes',
                                    value: true,
                                },
                                {
                                    label: 'No',
                                    value: false,
                                },
                            ],
                        },
                        selected_datasource: {
                            type: 'static',
                            data: [],
                        },
                    },
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Families',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: this.events.get('dataTableCounts'),
                    },
                },
                {
                    id: 'clear',
                    id_callback: this.events.register_alias('clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_families = {
            id: 'search_families',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.family_header = {
            id: 'family_header',
            component: Header,
            buttons: [
                {
                    id: 'uploadMetrics',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_metric_sets_spreadsheet',
                    confirm_endpoint: 'confirm_upload_metric_sets',
                    cancel_endpoint: 'cancel_upload_metric_sets',
                    label: 'Upload Family metrics <span class="icon-upload"></span>',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                    success_keys: [
                        {
                            label: 'Fund Name',
                            key: 'fund_name',
                        },
                        {
                            label: 'Company Name',
                            key: 'company_name',
                        },
                        {
                            label: 'Date',
                            key: 'date',
                            format: 'backend_date',
                        },
                        {
                            label: 'Warnings',
                            key: 'warnings',
                            format: 'strings_full',
                            css: {
                                'text-warning': true,
                            },
                        },
                    ],
                    data: {
                        family_uid: this.family_uid,
                    },
                },
                {
                    id: 'downloadFamilyMetrics',
                    id_callback: this.events.register_alias('downloadFamilyMetrics'),
                    label: 'Download Family metrics <span class="icon-download"></span>',
                    action: 'download_family_metrics',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                ...this.attachment_buttons(),
                {
                    id: 'edit',
                    id_callback: this.events.register_alias('editFamily'),
                    label: 'Edit Family <span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:family',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                },
            },
        };

        this.family_info = {
            id: 'family_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'UID',
                    value_key: 'uid',
                },
                {
                    label: 'name',
                    value_key: 'name',
                },
                {
                    label: 'Firm name',
                    value_key: 'firm_name',
                },
                {
                    label: 'Defunct',
                    value_key: 'defunct',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Created',
                    value_key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Modified',
                    value_key: 'modified',
                    format: 'backend_date',
                },
                {
                    label: 'Ordinal style',
                    value_key: 'ordinal_style',
                },
                {
                    label: 'Fund Template',
                    value_key: 'fund_template',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:family',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund = () => {
            if (auth.user_has_features(['edit_funds'])) {
                return {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'funds/<uid>',
                        label_key: 'name',
                    },
                };
            }

            return {
                label: 'Name',
                key: 'name',
            };
        };

        this.family_metrics_header = {
            id: 'family_metrics_header',
            component: Header,
            buttons: [
                {
                    id: 'delete_multiple',
                    label: 'Delete Metrics<span class="icon-trash">',
                    disabled_callback: data => {
                        if (data && data.length > 0) {
                            return false;
                        }
                        return true;
                    },
                    trigger_modal: {
                        id: 'delete_market_data_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_market_data_metrics',
                        to_delete_table_columns: [
                            {
                                label: 'UID',
                                key: 'uid',
                            },
                            {
                                label: 'Fund',
                                key: 'fund_name',
                            },
                            {
                                label: 'Value',
                                key: 'value',
                            },
                        ],
                        datasource: {
                            type: 'observer',
                            default: [],
                            event_type: this.events.get('family_metrics_table'),
                        },
                    },
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                    },
                },
            ],
        };

        this.family_metrics_table = {
            id: 'family_metrics_table',
            id_callback: this.events.register_alias('family_metrics_table'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Metrics',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 25,
            enable_column_toggle: true,
            enable_selection: true,
            enable_clear_order: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:family:metrics',
                    family_uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                    results_per_page: 25,
                },
            },
            columns: [
                {
                    label: 'UID',
                    key: 'uid',
                    disable_sorting: true,
                },
                {
                    label: 'Fund',
                    key: 'fund_name',
                },
                {
                    label: 'Company',
                    key: 'company_name',
                },
                {
                    label: 'Metric',
                    key: 'metric_name',
                    disable_sorting: true,
                },
                {
                    label: 'Value',
                    key: 'value',
                    disable_sorting: true,
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Modified',
                    key: 'modified',
                    format: 'backend_date',
                },
            ],
        };

        this.family_funds = {
            id: 'family_funds',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Funds',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 25,
            inline_data: true,
            datasource: {
                type: 'dynamic',
                key: 'funds',
                query: {
                    target: 'commander:family',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                },
            },
            columns: [
                this.fund(),
                {
                    label: 'Vintage year',
                    key: 'vintage_year',
                },
                {
                    label: 'Created',
                    key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Modified',
                    key: 'modified',
                    format: 'backend_date',
                },
            ],
        };

        this.attachment = {
            id: 'attachment',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Attached Document',
            empty_template: 'tpl_data_table_empty_with_label',
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Date Uploaded',
                    key: 'created',
                    format: 'backend_local_datetime',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:attachment',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                },
            },
        };

        this.show_family = {
            id: 'show_family',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: [
                    'family_header',
                    'family_info',
                    'family_funds',
                    'attachment',
                    'family_metrics_header',
                    'family_metrics_table',
                ],
            },
            components: [
                this.family_header,
                this.family_info,
                this.family_funds,
                this.attachment,
                this.family_metrics_header,
                this.family_metrics_table,
            ],
        };

        this.family_form = {
            id: 'family_form',
            component: EditForm,
            num_columns: 2,
            success_event: this.events.get('editSuccess'),
            cancel_event: this.events.get('editCancel'),
            fields: [
                {
                    label: 'Name',
                    key: 'name',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'Name',
                        allow_empty: false,
                    },
                },
                {
                    label:
                        'Template info (E.g: Name Subname <ord>, Name <ord>, Name <ord> Subname)',
                    key: 'fund_template',
                    input_type: 'text',
                    input_options: {
                        placeholder: 'E.g: Name Subname <ord>, Name <ord>, Name <ord> Subname',
                        allow_empty: false,
                    },
                },
                {
                    label: 'Ordinal style',
                    key: 'ordinal_style',
                    input_type: 'dropdown',
                    input_options: {
                        datasource: {
                            type: 'static',
                            data: [
                                {
                                    label: 'Integer year',
                                    value: 'int_year',
                                },
                                {
                                    label: 'Roman',
                                    value: 'roman',
                                },
                                {
                                    label: 'Integer',
                                    value: 'int',
                                },
                                {
                                    label: 'Numeric word',
                                    value: 'num_words',
                                },
                                {
                                    label: 'Alpha',
                                    value: 'alpha',
                                },
                                {
                                    label: 'Inherit',
                                    value: 'inherit',
                                },
                            ],
                        },
                    },
                },
                {
                    key: 'defunct',
                    input_type: 'boolean',
                    input_options: {
                        template: 'tpl_boolean_button',
                        label: 'Defunct',
                        btn_css: {
                            'btn-primary': true,
                            'btn-md': true,
                            'btn-block': true,
                        },
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_family',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:family',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('familyUid'),
                        required: true,
                    },
                },
            },
        };
        this.edit_family = {
            id: 'edit_family',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['family_form'],
            },
            components: [this.family_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_families',
                set_active_event: this.events.get('pageState'),
                components: [this.search_families, this.show_family, this.edit_family],
            },
            this.shared_components,
        );

        this.handle_url = url => {
            if (url.length === 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_families');
                Observer.broadcast(this.events.get('familyUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_family');
                Observer.broadcast(this.events.get('familyUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_family');
                Observer.broadcast(this.events.get('familyUid'), url[1]);
            }
        };

        this.when(this.page_wrapper, this.metric_columns).done(() => {
            Observer.register_hash_listener('families', this.handle_url);
            this.dfd.resolve();

            Observer.register(this.events.get('editFamily'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('confirm_delete_attachment'), () => {
                this.endpoints.delete_attachment({
                    data: {uid: this.family_uid()},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError({}),
                });
            });

            Observer.register(this.events.get('confirm_delete_family'), () => {
                this.endpoints.delete_families({
                    data: {uid: this.family_uid()},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        pager.navigate('#!/families');
                    }),
                });
            });

            Observer.register(this.events.get('downloadFamilyMetrics'), () => {
                if (!this.metric_columns.loading()) {
                    DataThing.get({
                        params: {
                            target: 'csv_download_key',
                            query: {
                                target: 'market_data_metrics',
                            },
                            columns: [
                                {key: 'fund_name', label: 'Fund Name'},
                                {key: 'company_name', label: 'Company Name'},
                                {key: 'date', label: 'Date', format: 'backend_date'},
                                ...this.metric_columns.data(),
                            ],
                            family_uid: this.family_uid(),
                        },
                        success: key => {
                            DataThing.form_post(config.download_csv_base + key);
                        },
                        force: true,
                    });
                }
            });

            Observer.register_many(
                [this.events.get('editCancel'), this.events.get('editSuccess')],
                () => {
                    DataThing.status_check();
                    window.history.back();
                },
            );
        });
    }
}

export default Families;
