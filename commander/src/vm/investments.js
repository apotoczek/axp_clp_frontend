import pager from 'pager';
import config from 'config';
import EditForm from 'src/libs/components/forms/EditForm';
import MetricTable from 'src/libs/components/MetricTable';
import DeleteSingleModal from 'src/libs/components/modals/DeleteSingleModal';
import EventButton from 'src/libs/components/basic/EventButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import MetaInfo from 'src/libs/components/MetaInfo';
import Aside from 'src/libs/components/basic/Aside';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import CreateInvestmentModal from 'src/libs/components/modals/CreateInvestmentModal';
import Header from 'src/libs/components/commander/Header';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import {gen_id} from 'src/libs/Utils';

class Investments extends Context {
    constructor() {
        super({id: 'investments'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_investment: DataThing.backends.commander({
                url: 'delete_investments',
            }),
            update_investment: DataThing.backends.commander({
                url: 'update_investment',
            }),
        };

        this.data_table_id = gen_id(
            this.get_id(),
            'page_wrapper',
            'search_investments',
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
        this.events.resolve_and_add('editInvestment', 'ActionButton.action.edit');
        this.events.resolve_and_add('deleteInvestment', 'ActionButton.action.delete');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('onlyUnpublished', 'BooleanButton.state');
        this.events.resolve_and_add('investorStringFilter', 'StringFilter.value');
        this.events.resolve_and_add('created', 'PopoverButton.value');

        this.events.new('pageState');
        this.events.new('investmentUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');

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
                    label: 'Investor',
                    sort_key: 'investor_name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'investors/<investor_uid>',
                        label_key: 'investor_name',
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
                        id_callback: this.events.register_alias('publisher'),
                        component: ToggleActionButton,
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
                    target: 'commander:investments',
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: this.events.get('stringFilter'),
                            },
                            investor_string_filter: {
                                type: 'observer',
                                event_type: this.events.get('investorStringFilter'),
                            },
                            only_unpublished: {
                                type: 'observer',
                                event_type: this.events.get('onlyUnpublished'),
                                default: false,
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

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Investments',
            enable_select_all: false,
            buttons: [
                {
                    id: 'create',
                    label: 'Create Investment<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateInvestmentModal,
                        id: 'create_investment_modal',
                    },
                },
                {
                    id: 'upload',
                    label: 'Upload Spreadsheet<span class="icon-doc">',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_investments_spreadsheet',
                    confirm_endpoint: 'confirm_upload_investments',
                    cancel_endpoint: 'cancel_upload_investments',
                    success_keys: [
                        {
                            label: 'Fund Uid',
                            sort_key: 'fund_uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'fund_uid',
                            },
                        },
                        {
                            label: 'Investor Uid',
                            sort_key: 'investor_uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'investor_uid',
                            },
                        },
                        {
                            label: 'As of date',
                            sort_key: 'as_of_date',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'as_of_date',
                                format: 'backend_date',
                            },
                        },
                        {
                            label: 'Vintage year',
                            sort_key: 'vintage_year',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'vintage_year',
                            },
                        },
                        {
                            label: 'Currency',
                            sort_key: 'currency_symbol',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'currency_symbol',
                            },
                        },
                        {
                            label: 'Cash in',
                            sort_key: 'cash_in_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'cash_in_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'cash_in_value',
                                },
                            },
                        },
                        {
                            label: 'Cash out',
                            sort_key: 'cash_out_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'cash_out_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'cash_out_value',
                                },
                            },
                        },
                        {
                            label: 'Cash out and remaining',
                            sort_key: 'cash_out_and_remaining_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'cash_out_and_remaining_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'cash_out_and_remaining_value',
                                },
                            },
                        },
                        {
                            label: 'Commitment value',
                            sort_key: 'commitment_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'commitment_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'commitment_value',
                                },
                            },
                        },
                        {
                            label: 'IRR',
                            sort_key: 'irr',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'irr',
                                format: 'percent',
                            },
                        },
                        {
                            label: 'Multiple',
                            sort_key: 'multiple',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'multiple',
                                format: 'multiple',
                            },
                        },
                        {
                            label: 'Source',
                            sort_key: 'src_url',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'src_url',
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
                    label: 'Delete Investments<span class="icon-trash">',
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
                        endpoint: 'delete_investments',
                        to_delete_table_columns: [
                            {
                                label: 'Uid',
                                key: 'uid',
                            },
                            {
                                label: 'Fund',
                                key: 'fund_name',
                            },
                            {
                                label: 'Investor',
                                key: 'investor_name',
                            },
                            {
                                label: 'Date',
                                key: 'as_of_date',
                                format: 'backend_date',
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
                body: [
                    'string_filter',
                    'meta',
                    'search_label',
                    'search_label_investor',
                    'string_filter_investor',
                    'filter_label',
                    'created',
                    'publish',
                    'clear',
                ],
            },
            components: [
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Invesments',
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
                    id_callback: this.events.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Search...',
                    clear_event: this.events.get('clear'),
                    enable_localstorage: true,
                },
                {
                    id: 'search_label',
                    html: '<h3>Search</>',
                    component: HTMLContent,
                },
                {
                    id: 'search_label_investor',
                    html: '<h5>Investor</>',
                    component: HTMLContent,
                },
                {
                    id: 'string_filter_investor',
                    id_callback: this.events.register_alias('investorStringFilter'),
                    component: StringFilter,
                    placeholder: 'Search by investor...',
                    clear_event: this.events.get('clear'),
                    enable_localstorage: true,
                },
                {
                    id: 'filter_label',
                    html: '<h3>Filters</h3>',
                    component: HTMLContent,
                },
                {
                    id: 'created',
                    id_callback: this.events.register_alias('created'),
                    component: NewPopoverButton,
                    label: 'Created',
                    clear_event: this.events.get('clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        css_class: 'popover-default',
                        placement: 'right',
                        title: 'Created',
                    },
                    enable_localstorage: true,
                    popover_config: {
                        component: PopoverInputRange,
                        mode: 'date',
                        min: {
                            placeholder: 'Min Date',
                        },
                        max: {
                            placeholder: 'Max Date',
                        },
                    },
                },
                {
                    id: 'publish',
                    id_callback: this.events.register_alias('onlyUnpublished'),
                    component: BooleanButton,
                    reset_event: this.events.get('clear'),
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Show only unpublished',
                    enable_localstorage: true,
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

        this.search_investments = {
            id: 'search_investments',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.investment_header = {
            id: 'investment_header',
            component: Header,
            buttons: [
                {
                    id: 'edit',
                    id_callback: this.events.register_alias('editInvestment'),
                    label: 'Edit Investment <span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Investment',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-danger': true,
                    },
                    use_header_data: true,
                    disable_if_no_data: true,
                    trigger_modal: {
                        id: 'delete_modal',
                        url: config.commander.investments_url,
                        component: DeleteSingleModal,
                        endpoint: 'delete_investments',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investment',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investmentUid'),
                        required: true,
                    },
                },
            },
        };

        this.investment_info = {
            id: 'investment_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'UID',
                    value_key: 'uid',
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
                    label: 'Investor',
                    value_key: 'investor_name',
                },
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Cash In',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_in_value',
                    },
                },
                {
                    label: 'As of Date',
                    value_key: 'as_of_date',
                    format: 'backend_date',
                },
                {
                    label: 'Cash Out and Remaining',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_out_and_remaining_value',
                    },
                },
                {
                    label: 'Cash Out',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'cash_out_value',
                    },
                },
                {
                    label: 'IRR',
                    value_key: 'irr',
                    format: 'percent',
                },
                {
                    label: 'TVPI',
                    value_key: 'multiple',
                    format: 'multiple',
                },
                {
                    label: 'Currency',
                    value_key: 'currency_symbol',
                    visible: false,
                },
                {
                    label: 'Commitment',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'commitment_value',
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
                    label: 'Source',
                    value_key: 'src_url',
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
                    target: 'commander:investment',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investmentUid'),
                        required: true,
                    },
                },
            },
        };

        this.show_investment = {
            id: 'show_investment',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['investment_header', 'investment_info'],
            },
            components: [this.investment_header, this.investment_info],
        };

        this.investment_form = {
            id: 'investment_form',
            component: EditForm,
            num_columns: 2,
            success_event: this.events.get('editSuccess'),
            cancel_event: this.events.get('editCancel'),
            fields: [
                {
                    label: 'As of date',
                    key: 'as_of_date',
                    input_type: 'date',
                },
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                    input_type: 'number',
                    input_options: {
                        format: 'no_format',
                        placeholder: 'Vintage Year',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'Cash in',
                    key: 'cash_in_value',
                    input_type: 'number',
                    input_options: {
                        placeholder: 'Cash In',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'Cash Out and Remaining',
                    key: 'cash_out_and_remaining_value',
                    input_type: 'number',
                    input_options: {
                        placeholder: 'Cash Out and Remaining',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'Cash Out',
                    key: 'cash_out_value',
                    input_type: 'number',
                    input_options: {
                        placeholder: 'Cash Out',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'IRR',
                    key: 'irr',
                    input_type: 'number',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'IRR',
                        format: {
                            format: 'number',
                            format_args: {
                                decimals: 4,
                            },
                        },
                    },
                },
                {
                    label: 'TVPI',
                    key: 'multiple',
                    input_type: 'number',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'TVPI',
                        format: {
                            format: 'number',
                            format_args: {
                                decimals: 4,
                            },
                        },
                    },
                },
                {
                    label: 'Currency',
                    key: 'currency_symbol',
                    input_type: 'filtered_dropdown',
                    input_options: {
                        limit: 10,
                        min_filter_length: 1,
                        label: 'Currency',
                        btn_style: '',
                        enable_add: true,
                        strings: {},
                        btn_css: {
                            //'btn-xs':true,
                            'btn-ghost-info': true,
                        },
                        datasource: {
                            type: 'dynamic',
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'symbol',
                                label_key: 'symbol',
                            },
                            query: {
                                target: 'currency:markets',
                            },
                        },
                    },
                },
                {
                    label: 'Commitment Value',
                    key: 'commitment_value',
                    input_type: 'number',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Commitment Value',
                    },
                },
                {
                    label: 'Source',
                    key: 'src_url',
                    input_type: 'text',
                    input_options: {
                        allow_empty: true,
                        value_on_empty: null,
                        placeholder: 'Source',
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_investment',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investment',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('investmentUid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_investment = {
            id: 'edit_investment',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['investment_form'],
            },
            components: [this.investment_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_investments',
                set_active_event: this.events.get('pageState'),
                components: [this.search_investments, this.show_investment, this.edit_investment],
            },
            this.shared_components,
        );

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_investments');
                Observer.broadcast(this.events.get('investmentUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_investment');
                Observer.broadcast(this.events.get('investmentUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_investment');
                Observer.broadcast(this.events.get('investmentUid'), url[1]);
            }
        };

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('investments', this.handle_url);

            Observer.register(this.events.get('editInvestment'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('publish'), investment => {
                this.endpoints.update_investment({
                    data: {
                        uid: investment.uid,
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

            Observer.register(this.events.get('unpublish'), investment => {
                this.endpoints.update_investment({
                    data: {
                        uid: investment.uid,
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

            Observer.register(this.events.get('deleteInvestment'), investment => {
                this.endpoints.delete_investment({
                    data: {uid: investment.uid},
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

export default Investments;
