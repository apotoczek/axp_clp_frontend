import pager from 'pager';
import config from 'config';
import EditForm from 'src/libs/components/forms/EditForm';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MetricTable from 'src/libs/components/MetricTable';
import DeleteSingleModal from 'src/libs/components/modals/DeleteSingleModal';
import CreateFundModal from 'src/libs/components/modals/CreateFundModal';
import EventButton from 'src/libs/components/basic/EventButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import MetaInfo from 'src/libs/components/MetaInfo';
import Aside from 'src/libs/components/basic/Aside';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import CreateFirmModal from 'src/libs/components/modals/CreateFirmModal';
import Header from 'src/libs/components/commander/Header';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import {gen_id} from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EditFormConfig from 'src/libs/components/forms/EditFormConfig';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class Firms extends Context {
    constructor() {
        super({id: 'firms'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_firm: DataThing.backends.commander({
                url: 'delete_firms',
            }),
            update_firm: DataThing.backends.commander({
                url: 'update_firm',
            }),
        };

        this.data_table_id = gen_id(
            this.get_id(),
            'page_wrapper',
            'search_firms',
            'search_body',
            'search_table',
        );

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('dataTable', 'DataTable.counts', 'dataTableCounts');
        this.events.resolve_and_add('dataTable', 'DataTable.selected', 'dataTableSelected');
        this.events.resolve_and_add('publisher', 'ToggleActionButton.action.publish', 'publish');
        this.events.resolve_and_add(
            'publisher',
            'ToggleActionButton.action.unpublish',
            'unpublish',
        );
        this.events.resolve_and_add('editFirm', 'ActionButton.action.edit');
        this.events.resolve_and_add('deleteFirm', 'ActionButton.action.delete');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('onlyUnpublished', 'BooleanButton.state');

        this.events.new('pageState');
        this.events.new('firmUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');

        this.edit_config = EditFormConfig({});

        this.search_table = {
            id: 'search_table',
            component: DataTable,
            id_callback: this.events.register_alias('dataTable'),
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_localstorage: true,
            enable_csv_export: true,
            columns: [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'firms/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Uid',
                    key: 'uid',
                    visible: false,
                },
                {
                    label: 'Location',
                    key: 'location',
                },
                {
                    label: 'Website',
                    sort_key: 'website',
                    format: 'external_link',
                    format_args: {
                        url_key: 'website',
                        label_key: 'normalized_website',
                        max_length: 40,
                    },
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
                {
                    label: 'Recent Event',
                    key: 'recent_event_count',
                    visible: false,
                },
                {
                    label: 'Will Publish',
                    key: 'publishable',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                    disable_sorting: true,
                },
                {
                    label: 'Action',
                    component_callback: 'data',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    component: {
                        id: 'action',
                        component: ToggleActionButton,
                        id_callback: this.events.register_alias('publisher'),
                        labels: [
                            'Publish <span class="icon-link-1"></span>',
                            'Unpublish <span class="icon-unlink"></span>',
                        ],
                        actions: ['publish', 'unpublish'],
                        state_css: ['btn-cpanel-success', 'btn-warning'],
                        key: 'publish',
                        css: {
                            'btn-xs': true,
                            'pull-right': true,
                            'btn-block': true,
                        },
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:firms',
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: this.events.get('stringFilter'),
                            },
                            only_unpublished: {
                                type: 'observer',
                                event_type: this.events.get('onlyUnpublished'),
                                required: true,
                            },
                        },
                    },
                },
            },
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Firms',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Firm<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateFirmModal,
                        id: 'create_firm_modal',
                    },
                },
                {
                    id: 'upload',
                    label: 'Upload Spreadsheet<span class="icon-doc">',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_firms_spreadsheet',
                    confirm_endpoint: 'confirm_upload_firms',
                    cancel_endpoint: 'cancel_upload_firms',
                    allow_include_names: true,
                    success_keys: [
                        {
                            label: 'Uid',
                            sort_key: 'uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'uid',
                            },
                        },
                        {
                            label: 'Name',
                            sort_key: 'name',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'name',
                            },
                        },
                        {
                            label: 'Location',
                            sort_key: 'location',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'location',
                            },
                        },
                        {
                            label: 'Website',
                            sort_key: 'website',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'website',
                            },
                        },
                        {
                            label: 'Overview',
                            sort_key: 'overview',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'overview',
                            },
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
                    action: 'upload',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                    },
                },
                {
                    id: 'delete_multiple',
                    action: 'delete_selected',
                    label: 'Delete Firms<span class="icon-trash">',
                    disable_if_no_data: true,
                    disabled_callback: data => {
                        if (data && data.length > 0) {
                            return false;
                        }
                        return true;
                    },
                    trigger_modal: {
                        id: 'delete_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_firms',
                        to_delete_table_columns: [
                            {
                                label: 'UID',
                                key: 'uid',
                            },
                            {
                                name: 'Name',
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

        this.search_body = {
            id: 'search_body',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_table, this.search_header],
        };

        this.search_cpanel = {
            id: 'search_cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['string_filter', 'meta', 'filter_label', 'publish', 'clear'],
            },
            components: [
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Firms',
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
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: this.events.register_alias('stringFilter'),
                    placeholder: 'Search...',
                    clear_event: this.events.get('clear'),
                    enable_localstorage: true,
                },
                {
                    id: 'filter_label',
                    html: '<h3>Filters</h3>',
                    component: HTMLContent,
                },
                {
                    id: 'publish',
                    reset_event: this.events.get('clear'),
                    component: BooleanButton,
                    id_callback: this.events.register_alias('onlyUnpublished'),
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Show only unpublished',
                    enable_localstorage: true,
                },
                {
                    id: 'clear',
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                    id_callback: this.events.register_alias('clear'),
                },
            ],
        };

        this.search_firms = {
            id: 'search_firms',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.firm_header = {
            id: 'firm_header',
            component: Header,
            buttons: [
                {
                    id: 'create',
                    label: 'Create New Fund<span class="icon-plus">',
                    action: 'create',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateFundModal,
                        id: 'create_fund_modal',
                        data_mapper: data => data,
                    },
                    use_header_data: true,
                },
                {
                    id: 'edit',
                    label: 'Edit Firm<span class="icon-wrench"></span>',
                    action: 'edit',
                    id_callback: this.events.register_alias('editFirm'),
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Firm',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-danger': true,
                    },
                    use_header_data: true,
                    disable_if_no_data: true,
                    trigger_modal: {
                        id: 'delete_modal',
                        url: config.commander.firms_url,
                        component: DeleteSingleModal,
                        endpoint: 'delete_firms',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:firm',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('firmUid'),
                        required: true,
                    },
                },
            },
        };

        this.firm_info = {
            id: 'firm_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 1,
            metrics: [
                {
                    label: 'Location',
                    value_key: 'location',
                },
                {
                    label: 'Recent Event',
                    value_key: 'recent_event_count',
                },
                {
                    label: 'Website',
                    value_key: 'website',
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
                    label: 'Will Publish',
                    key: 'publishable',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:firm',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('firmUid'),
                        required: true,
                    },
                },
            },
        };

        this.overview_text_block = {
            component: BaseComponent,
            id: 'overview_text_block',
            template: 'tpl_aside_body',
            layout: {
                body: ['firm_overview_title', 'firm_overview_content'],
            },
            components: [
                {
                    id: 'firm_overview_title',
                    component: BaseComponent,
                    template: 'tpl_base_h2',
                    css: {'overview-title': false},
                    heading: 'Firm Overview',
                },
                {
                    id: 'firm_overview_content',
                    component: BaseComponent,
                    template: 'tpl_base_p',
                    content_key: 'overview',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'commander:firm',
                            uid: {
                                type: 'observer',
                                event_type: this.events.get('firmUid'),
                                required: true,
                            },
                        },
                    },
                },
            ],
        };

        this.info_container = {
            component: BaseComponent,
            id: 'info_container',
            template: 'tpl_info_container',
            layout: {
                body: ['overview_text_block', 'firm_info'],
            },
            components: [this.firm_info, this.overview_text_block],
        };

        this.firm_funds = {
            id: 'firm_funds',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Funds',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 10,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:funds',
                    filters: {
                        type: 'dynamic',
                        query: {
                            firm_uid: {
                                type: 'observer',
                                event_type: this.events.get('firmUid'),
                                required: true,
                            },
                        },
                    },
                },
            },
            columns: [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'funds/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                },
                {
                    label: 'Target Size',
                    key: 'target_size_value',
                    value: 'target_size_value',
                    type: 'numeric',
                    format: 'usd',
                },
                {
                    label: 'First Close',
                    key: 'first_close',
                    format: 'backend_date',
                },
                {
                    label: 'Status',
                    key: 'status_text',
                },
            ],
        };

        this.show_firm = {
            id: 'show_firm',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['firm_header', 'info_container', 'firm_funds'],
            },
            components: [this.firm_header, this.info_container, this.firm_funds],
        };

        this.firm_form = {
            id: 'firm_form',
            component: EditForm,
            num_columns: 2,
            success_event: this.events.get('editSuccess'),
            cancel_event: this.events.get('editCancel'),
            fields: this.edit_config.firm_fields,
            backend: 'commander',
            endpoint: 'update_firm',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:firm',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('firmUid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_firm = {
            id: 'edit_firm',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['firm_form'],
            },
            components: [this.firm_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_firms',
                set_active_event: this.events.get('pageState'),
                components: [this.search_firms, this.show_firm, this.edit_firm],
            },
            this.shared_components,
        );

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_firms');
                Observer.broadcast(this.events.get('firmUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_firm');
                Observer.broadcast(this.events.get('firmUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_firm');
                Observer.broadcast(this.events.get('firmUid'), url[1]);
            }
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('firms', this.handle_url);

            Observer.register(this.events.get('editFirm'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('publish'), firm => {
                this.endpoints.update_firm({
                    data: {
                        uid: firm.uid,
                        updates: {
                            publish: true,
                        },
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        DataThing.status_check();
                        alert(error);
                    }),
                });
            });

            Observer.register(this.events.get('unpublish'), firm => {
                this.endpoints.update_firm({
                    data: {
                        uid: firm.uid,
                        updates: {
                            publish: false,
                        },
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        DataThing.status_check();
                        alert(error);
                    }),
                });
            });

            Observer.register(this.events.get('deleteFirm'), firm => {
                this.endpoints.delete_firm({
                    data: {uid: firm.uid},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                        window.history.back();
                    }),
                    error: DataThing.api.XHRError(error => {
                        alert(error);
                    }),
                });
            });

            Observer.register_many(
                [this.events.get('editCancel'), this.events.get('editSuccess')],
                () => {
                    DataThing.status_check();
                    window.history.back();
                },
            );

            this.dfd.resolve();
        });
    }
}

export default Firms;
