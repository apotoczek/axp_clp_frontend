import pager from 'pager';
import config from 'config';
import EditForm from 'src/libs/components/forms/EditForm';
import MetricTable from 'src/libs/components/MetricTable';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DeleteSingleModal from 'src/libs/components/modals/DeleteSingleModal';
import EventButton from 'src/libs/components/basic/EventButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import CreateInvestorModal from 'src/libs/components/modals/CreateInvestorModal';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import {gen_id} from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class Investors extends Context {
    constructor() {
        super({id: 'investors'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_investor: DataThing.backends.commander({
                url: 'delete_investors',
            }),
            update_investor: DataThing.backends.commander({
                url: 'update_investor',
            }),
        };

        this.data_table_id = gen_id(
            this.get_id(),
            'page_wrapper',
            'search_investors',
            'search_content_wrapper',
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
        this.events.resolve_and_add('editInvestor', 'ActionButton.action.edit');
        this.events.resolve_and_add('deleteInvestor', 'ActionButton.action.delete');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('onlyUnpublished', 'BooleanButton.state');

        this.events.new('pageState');
        this.events.new('investorUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Investors',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Investor<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateInvestorModal,
                        id: 'create_investor_modal',
                    },
                },
                {
                    id: 'upload',
                    label: 'Upload Spreadsheet<span class="icon-doc">',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_investors_spreadsheet',
                    confirm_endpoint: 'confirm_upload_investors',
                    cancel_endpoint: 'cancel_upload_investors',
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
                            label: 'City',
                            sort_key: 'city',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'city',
                            },
                        },
                        {
                            label: 'Country',
                            sort_key: 'country',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'country',
                            },
                        },
                        {
                            label: 'Type',
                            sort_key: 'investor_type',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'investor_type',
                            },
                        },
                        {
                            label: 'Street',
                            sort_key: 'street_1',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'street_1',
                            },
                        },
                        {
                            label: 'Zip Code',
                            sort_key: 'zip_code',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'zip_code',
                            },
                        },
                        {
                            label: 'Consultant',
                            sort_key: 'consultant',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'consultant',
                            },
                        },
                        {
                            label: 'State',
                            sort_key: 'state',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'state',
                            },
                        },
                        {
                            label: 'Phone',
                            sort_key: 'phone',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'phone',
                            },
                        },
                        {
                            label: 'PE AUM',
                            sort_key: 'pe_assets_under_mgmt',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'pe_assets_under_mgmt',
                                format: 'money',
                            },
                        },
                        {
                            label: 'AUM',
                            sort_key: 'assets_under_mgmt',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'assets_under_mgmt',
                                format: 'money',
                            },
                        },
                        {
                            label: 'TWRR',
                            sort_key: 'twrr',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'twrr',
                                format: 'percent',
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
                    label: 'Delete Investors<span class="icon-trash">',
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
                        endpoint: 'delete_investors',
                        to_delete_table_columns: [
                            {
                                label: 'Uid',
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

        this.search_table = {
            id: 'search_table',
            id_callback: this.events.register_alias('dataTable'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_localstore: true,
            enable_csv_export: true,
            columns: [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'investors/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'UID',
                    key: 'uid',
                },
                {
                    label: 'City',
                    key: 'city',
                    placeholder: 'No city',
                },
                {
                    label: 'Country',
                    key: 'country',
                },
                {
                    label: 'Type',
                    key: 'investor_type',
                },
                {
                    label: 'Consultant',
                    key: 'consultant',
                },
                {
                    label: 'Phone',
                    key: 'phone',
                },
                {
                    label: 'PE AUM',
                    key: 'pe_assets_under_mgmt',
                    format: 'money',
                },
                {
                    label: 'AUM',
                    key: 'assets_under_mgmt',
                    format: 'money',
                },
                {
                    label: 'TWRR',
                    key: 'twrr',
                    format: 'percent',
                },
                {
                    label: 'Will Publish',
                    key: 'publishable',
                    format: 'boolean_highlight',
                    disable_sorting: true,
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Action',
                    component_callback: 'data',
                    always_visible: true,
                    disable_sorting: true,
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
                    target: 'commander:investors',
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
                                default: false,
                            },
                        },
                    },
                },
            },
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
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: this.events.register_alias('stringFilter'),
                    placeholder: 'Search...',
                    enable_localstorage: true,
                    clear_event: this.events.get('clear'),
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Investors',
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
                    id_callback: this.events.register_alias('clear'),
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_content_wrapper = {
            id: 'search_content_wrapper',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'search_table'],
            },
            components: [this.search_header, this.search_table],
        };

        this.search_investors = {
            id: 'search_investors',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_content_wrapper'],
            },
            components: [this.search_cpanel, this.search_content_wrapper],
        };

        this.investor_header = {
            id: 'investor_header',
            component: Header,
            buttons: [
                {
                    id: 'edit',
                    id_callback: this.events.register_alias('editInvestor'),
                    label: 'Edit Investor<span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Investor',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-danger': true,
                    },
                    use_header_data: true,
                    disable_if_no_data: true,
                    trigger_modal: {
                        id: 'delete_modal',
                        url: config.commander.investors_url,
                        component: DeleteSingleModal,
                        endpoint: 'delete_investors',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investor',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investorUid'),
                        required: true,
                    },
                },
            },
        };

        this.overview_text_block = {
            id: 'overview_text_block',
            component: BaseComponent,
            template: 'tpl_aside_body',
            layout: {
                body: ['investor_overview_title', 'investor_overview_content'],
            },
            components: [
                {
                    id: 'investor_overview_title',
                    components: 'basic/BaseComponent',
                    template: 'tpl_base_h2',
                    css: {'overview-title': false},
                    heading: 'Investor Overview',
                },
                {
                    id: 'investor_overview_content',
                    component: BaseComponent,
                    template: 'tpl_base_p',
                    content_key: 'overview',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'commander:investor',
                            uid: {
                                type: 'observer',
                                event_type: this.events.get('investorUid'),
                                required: true,
                            },
                        },
                    },
                },
            ],
        };

        this.investor_info = {
            id: 'investor_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'Name',
                    value_key: 'name',
                },
                {
                    label: 'City',
                    value_key: 'city',
                },
                {
                    label: 'Zip Code',
                    value_key: 'zip_code',
                },
                {
                    label: 'State',
                    value_key: 'state',
                },
                {
                    label: 'Country',
                    value_key: 'country',
                },
                {
                    label: 'Phone',
                    value_key: 'phone',
                },
                {
                    label: 'Street',
                    value_key: 'street_1',
                },
                {
                    label: 'Type',
                    value_key: 'investor_type',
                },
                {
                    label: 'Consultant',
                    value_key: 'consultant',
                },
                {
                    label: 'AUM',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'assets_under_mgmt',
                    },
                },
                {
                    label: 'PE AUM',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'pe_assets_under_mgmt',
                    },
                },
                {
                    label: 'PE AUM Allocation',
                    value_key: 'pe_asset_allocation',
                    format: 'percent',
                },
                {
                    label: 'TWRR',
                    value_key: 'twrr',
                    format: 'percent',
                },
                {
                    label: 'Website',
                    value_key: 'website',
                    format: 'external_link',
                    format_args: {
                        max_length: 30,
                    },
                },
                {
                    label: 'Created',
                    value_key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Modified',
                    value_key: 'modifed',
                    format: 'backend_date',
                },
                {
                    label: 'Will Publish',
                    value_key: 'publishable',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                    disable_sorting: true,
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investor',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investorUid'),
                        required: true,
                    },
                },
            },
        };

        this.info_container = {
            component: BaseComponent,
            id: 'info_container',
            template: 'tpl_info_container',
            layout: {
                body: ['overview_text_block', 'investor_info'],
            },
            components: [this.overview_text_block, this.investor_info],
        };

        this.investor_investments = {
            id: 'investor_investments',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Investments',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 25,
            enable_localstorage: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investments',
                    filters: {
                        type: 'dynamic',
                        query: {
                            investor_uid: {
                                type: 'observer',
                                event_type: this.events.get('investorUid'),
                                required: true,
                            },
                        },
                    },
                },
            },
            columns: [
                {
                    label: 'UID',
                    sort_key: 'uid',
                    format: 'contextual_link',
                    format_args: {
                        url: 'investments/<uid>',
                        label_key: 'uid',
                    },
                },
                {
                    label: 'Fund',
                    sort_key: 'fund_name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'funds/<fund_uid>',
                        label_key: 'fund_name',
                    },
                },
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                },
                {
                    label: 'Cash In',
                    sort_key: 'cash_in_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_in_value',
                    },
                },
                {
                    label: 'As of Date',
                    key: 'as_of_date',
                    format: 'backend_date',
                },
                {
                    label: 'Cash Out and Rem',
                    type: 'numeric',
                    sort_key: 'cash_out_and_remaining_value',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_out_and_remaining_value',
                    },
                },
                {
                    label: 'Cash Out',
                    sort_key: 'cash_out_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_out_value',
                    },
                },
                {
                    label: 'IRR',
                    key: 'irr',
                    format: 'percent',
                },
                {
                    label: 'TVPI',
                    key: 'multiple',
                    format: 'multiple',
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    format: 'multiple',
                    visible: false,
                },
                {
                    label: 'RVPI',
                    key: 'rvpi',
                    format: 'multiple',
                    visible: false,
                },
                {
                    label: 'Currency',
                    key: 'currency_symbol',
                    visible: false,
                },
                {
                    label: 'Commitment',
                    sort_key: 'commitment_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'commitment_value',
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
                {
                    label: 'Source',
                    key: 'src_url',
                    visible: false,
                },
            ],
        };

        this.show_investor = {
            id: 'show_investor',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['investor_header', 'info_container', 'investor_investments'],
            },
            components: [this.investor_header, this.info_container, this.investor_investments],
        };

        this.investor_form = {
            id: 'investor_form',
            component: EditForm,
            num_columns: 2,
            success_event: this.events.get('editSuccess'),
            cancel_event: this.events.get('cancelSuccess'),
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
                    label: 'AUM',
                    key: 'assets_under_mgmt',
                    input_type: 'number',
                    input_options: {
                        placeholder: 'Assets under mgmt',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'PE AUM',
                    key: 'pe_assets_under_mgmt',
                    input_type: 'number',
                    input_options: {
                        placeholder: 'PE Assets under mgmt',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'TWRR',
                    key: 'twrr',
                    input_type: 'number',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Time weighted rate of return',
                        format: {
                            format: 'number',
                            format_args: {
                                decimals: 5,
                            },
                        },
                    },
                },
                {
                    label: 'Type',
                    key: 'investor_type',
                    input_type: 'dropdown',
                    input_options: {
                        allow_empty: true,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'static_enums',
                                enum_type: 'investor_type',
                            },
                        },
                    },
                },
                {
                    label: 'City',
                    key: 'city',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'City',
                    },
                },
                {
                    label: 'State',
                    key: 'state',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'State',
                    },
                },
                {
                    label: 'Country',
                    key: 'country',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Country',
                    },
                },
                {
                    label: 'Phone',
                    key: 'phone',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Phone number',
                    },
                },
                {
                    label: 'Street',
                    key: 'street_1',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Street address',
                    },
                },
                {
                    label: 'Consultant',
                    key: 'consultant',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Consultant',
                    },
                },
                {
                    label: 'Zip Code',
                    key: 'zip_code',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Zip code',
                    },
                },
                {
                    label: 'Website',
                    key: 'website',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Website',
                    },
                },
                {
                    label: 'Overview',
                    key: 'overview',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Overview',
                        template: 'tpl_text_box_input',
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_investor',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investor',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investorUid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_investor = {
            id: 'edit_investor',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['investor_form'],
            },
            components: [this.investor_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_investors',
                set_active_event: this.events.get('pageState'),
                components: [this.search_investors, this.show_investor, this.edit_investor],
            },
            this.shared_components,
        );

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_investors');
                Observer.broadcast(this.events.get('investorUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_investor');
                Observer.broadcast(this.events.get('investorUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_investor');
                Observer.broadcast(this.events.get('investorUid'), url[1]);
            }
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('investors', this.handle_url);

            Observer.register(this.events.get('editInvestor'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('publish'), investor => {
                this.endpoints.update_investor({
                    data: {
                        uid: investor.uid,
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

            Observer.register(this.events.get('unpublish'), investor => {
                this.endpoints.update_investor({
                    data: {
                        uid: investor.uid,
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

            Observer.register(this.events.get('deleteInvestor'), investor => {
                this.endpoints.delete_investor({
                    data: {uid: investor.uid},
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

export default Investors;
