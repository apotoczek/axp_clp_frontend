import auth from 'auth';
import pager from 'pager';
import config from 'config';
import EditForm from 'src/libs/components/forms/EditForm';
import MetricTable from 'src/libs/components/MetricTable';
import DeleteSingleModal from 'src/libs/components/modals/DeleteSingleModal';
import EventButton from 'src/libs/components/basic/EventButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import CreateFundModal from 'src/libs/components/modals/CreateFundModal';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import {gen_id} from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EditFormConfig from 'src/libs/components/forms/EditFormConfig';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class Funds extends Context {
    constructor() {
        super({id: 'funds'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            delete_fund: DataThing.backends.commander({url: 'delete_funds'}),
            update_fund: DataThing.backends.commander({url: 'update_fund'}),
        };

        this.data_table_id = gen_id(
            this.get_id(),
            'page_wrapper',
            'search_funds',
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
        this.events.resolve_and_add('createFund', 'ActionButton.action.create');
        this.events.resolve_and_add('editFund', 'ActionButton.action.edit');
        this.events.resolve_and_add('deleteFund', 'ActionButton.action.delete');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('onlyUnpublished', 'BooleanButton.state');
        this.events.resolve_and_add('realizer', 'ToggleActionButton.action.realize', 'realize');
        this.events.resolve_and_add('realizer', 'ToggleActionButton.action.unrealize', 'unrealize');
        this.events.resolve_and_add('busmi', 'BooleanButton.state');
        this.events.resolve_and_add('created', 'PopoverButton.value');
        this.events.resolve_and_add('vintageYear', 'PopoverButton.value');
        this.events.resolve_and_add('enumAttributes', 'AttributeFilters.state');
        this.events.resolve_and_add('download_cashflows', 'EventButton');
        this.events.resolve_and_add('fund_cashflows_table', 'DataTable.selected');

        this.events.new('pageState');
        this.events.new('fundUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');

        this.edit_config = EditFormConfig({event_fund_uid: this.events.get('fundUid')});

        this.handle_url = url => {
            if (url.length === 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_funds');
                Observer.broadcast(this.events.get('fundUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_fund');
                Observer.broadcast(this.events.get('fundUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_fund');
                Observer.broadcast(this.events.get('fundUid'), url[1]);
            }
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Funds',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Fund<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateFundModal,
                        id: 'create_fund_modal',
                    },
                },
                {
                    id: 'upload_funds',
                    label: 'Upload Funds<span class="icon-doc">',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_funds_spreadsheet',
                    confirm_endpoint: 'confirm_upload_funds',
                    cancel_endpoint: 'cancel_upload_funds',
                    allow_include_names: true,
                    success_keys: [
                        {
                            label: 'Name',
                            sort_key: 'name',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'name',
                            },
                        },
                        {
                            label: 'Ordinal',
                            sort_key: 'ordinal_value',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'ordinal_value',
                            },
                        },
                        {
                            label: 'Uid',
                            sort_key: 'uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'uid',
                            },
                        },
                        {
                            label: 'Firm uid',
                            sort_key: 'firm_uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'firm_uid',
                            },
                        },
                        {
                            label: 'Firm Name',
                            sort_key: 'firm_name',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'firm_name',
                            },
                        },
                        {
                            label: 'Family uid',
                            sort_key: 'family_uid',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'family_uid',
                            },
                        },
                        {
                            label: 'Vintage Year',
                            sort_key: 'vintage_year',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'vintage_year',
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
                            label: 'DPI',
                            sort_key: 'dpi',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'dpi',
                                format: 'multiple',
                            },
                        },
                        {
                            label: 'TVPI',
                            sort_key: 'tvpi',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'tvpi',
                                format: 'multiple',
                            },
                        },
                        {
                            label: 'RVPI',
                            sort_key: 'rvpi',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'rvpi',
                                format: 'multiple',
                            },
                        },
                        {
                            label: 'Paid in %',
                            sort_key: 'picc',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'picc',
                                format: 'percent',
                            },
                        },
                        {
                            label: 'As of Date',
                            sort_key: 'as_of_date',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'as_of_date',
                                format: 'backend_date',
                            },
                        },
                        {
                            label: 'Geography',
                            sort_key: 'geography',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'geography',
                                format: 'strings',
                            },
                        },
                        {
                            label: 'Style / Focus',
                            sort_key: 'style',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'style',
                                format: 'strings',
                            },
                        },
                        {
                            label: 'Sector',
                            sort_key: 'sector',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'sector',
                                format: 'strings',
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
                            label: 'Target Size',
                            sort_key: 'target_size_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'target_size_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'target_size_value',
                                },
                            },
                        },
                        {
                            label: 'Total Sold',
                            sort_key: 'total_sold_value',
                            format: 'highlight_if_update',
                            format_args: {
                                key: 'total_sold_value',
                                format: 'money',
                                format_args: {
                                    currency_key: 'currency_symbol',
                                    value_key: 'total_sold_value',
                                },
                            },
                        },
                        {
                            label: 'Gross Invested',
                            sort_key: 'gross_invested',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'gross_invested',
                                format: 'money',
                            },
                        },
                        {
                            label: 'Gross Realized',
                            sort_key: 'gross_realized',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'gross_realized',
                                format: 'money',
                            },
                        },
                        {
                            label: 'Gross Unrealized',
                            sort_key: 'gross_unrealized',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'gross_unrealized',
                                format: 'money',
                            },
                        },
                        {
                            label: 'First Close',
                            sort_key: 'first_close',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'first_close',
                                format: 'backend_date',
                            },
                        },
                        {
                            label: 'Final Close',
                            sort_key: 'final_close',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'final_close',
                                format: 'backend_date',
                            },
                        },
                        {
                            label: 'Status',
                            sort_key: 'status',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'status',
                            },
                        },
                        {
                            label: 'Gross IRR',
                            sort_key: 'gross_irr',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'gross_irr',
                                format: 'percent',
                            },
                        },
                        {
                            label: 'Gross Multiple',
                            sort_key: 'gross_multiple',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'gross_multiple',
                                format: 'multiple',
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
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                    },
                },
                {
                    id: 'download_cashflows',
                    id_callback: this.events.register_alias('download_cashflows'),
                    component: EventButton,
                    label: 'Download Cashflows<span class="icon-download">',
                },
                {
                    id: 'delete_multiple',
                    action: 'delete_selected',
                    label: 'Delete Funds<span class="icon-trash">',
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
                        endpoint: 'delete_funds',
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

        this.firm_column = () => {
            if (auth.user_has_features('edit_funds')) {
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
                visible: true,
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
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'funds/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Uid',
                    key: 'uid',
                    visible: true,
                },
                this.firm_column(),
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                },
                {
                    label: 'Geography',
                    key: 'geography',
                    format: 'strings',
                    visible: true,
                    disable_sorting: true,
                },
                {
                    label: 'Style / Focus',
                    key: 'style',
                    format: 'strings',
                    visible: true,
                    disable_sorting: true,
                },
                {
                    label: 'Sector',
                    key: 'sector',
                    format: 'strings',
                    visible: true,
                    disable_sorting: true,
                },
                ...this.static_performance({}),
                {
                    label: 'Currency',
                    key: 'currency_symbol',
                },
                {
                    label: 'Target Size',
                    sort_key: 'target_size_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'target_size_value',
                    },
                },
                {
                    label: 'Total Sold',
                    sort_key: 'total_sold_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'total_sold_value',
                    },
                },
                {
                    label: 'Gross Invested',
                    sort_key: 'gross_invested',
                    format: 'highlight_if_update',
                    format_args: {
                        value_key: 'gross_invested',
                        format: 'money',
                    },
                },
                {
                    label: 'Gross Realized',
                    sort_key: 'gross_realized',
                    format: 'highlight_if_update',
                    format_args: {
                        value_key: 'gross_realized',
                        format: 'money',
                    },
                },
                {
                    label: 'Gross Unrealized',
                    sort_key: 'gross_unrealized',
                    format: 'highlight_if_update',
                    format_args: {
                        value_key: 'gross_unrealized',
                        format: 'money',
                    },
                },
                {
                    label: 'First Close',
                    key: 'first_close',
                    format: 'backend_date',
                },
                {
                    label: 'Final Close',
                    key: 'final_close',
                    format: 'backend_date',
                },
                {
                    label: 'Status',
                    key: 'status_text',
                },
                {
                    label: 'Will Publish',
                    key: 'publishable',
                    format: 'boolean_highlight',
                    visible: true,
                    disable_sorting: true,
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Included in BUSMI',
                    key: 'busmi',
                    format: 'boolean_highlight',
                    visible: false,
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Last Edited',
                    key: 'last_manual_edit',
                    format: 'backend_date',
                    visible: true,
                },
                {
                    label: 'Action',
                    component_callback: 'data',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    visible: true,
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
                {
                    label: 'Fully realize',
                    component_callback: 'data',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    visible: true,
                    component: {
                        id: 'realize',
                        id_callback: this.events.register_alias('realizer'),
                        component: ToggleActionButton,
                        labels: [
                            'Realize <span class="icon-link-1"></span>',
                            'Unrealize <span class="icon-unlink"></span>',
                        ],
                        actions: ['realize', 'unrealize'],
                        state_css: ['btn-cpanel-success', 'btn-warning'],
                        key: 'fully_realized',
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
                    target: 'commander:funds',
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
                            busmi: {
                                type: 'observer',
                                event_type: this.events.get('busmi'),
                                default: false,
                            },
                            created: {
                                type: 'observer',
                                event_type: this.events.get('created'),
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: this.events.get('vintageYear'),
                            },
                            enums: {
                                type: 'observer',
                                event_type: this.events.get('enumAttributes'),
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
                body: [
                    'string_filter',
                    'meta',
                    'filter_label',
                    'publish',
                    'busmi',
                    'created',
                    'vintage_year',
                    'enum_attributes',
                    'clear',
                ],
            },
            components: [
                {
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: this.events.register_alias('stringFilter'),
                    placeholder: 'Fund Name...',
                    enable_localstorage: true,
                    clear_event: this.events.get('clear'),
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Funds',
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
                    id_callback: this.events.register_alias('onlyUnpublished'),
                    reset_event: this.events.get('clear'),
                    enable_localstorage: true,
                    component: BooleanButton,
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Show only unpublished',
                },
                {
                    id: 'busmi',
                    id_callback: this.events.register_alias('busmi'),
                    reset_event: this.events.get('clear'),
                    enable_localstorage: true,
                    component: BooleanButton,
                    default_state: false,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Included in BUSMI',
                },
                {
                    id: 'created',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('created'),
                    label: 'Date Created',
                    clear_event: this.events.get('clear'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    enable_localstorage: true,
                    popover_options: {
                        placement: 'right',
                        title: 'Date Created',
                        css_class: 'popover-default',
                    },
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
                    id: 'vintage_year',
                    clear_event: this.events.get('clear'),
                    id_callback: this.events.register_alias('vintageYear'),
                    enable_localstorage: true,
                    component: NewPopoverButton,
                    label: 'Vintage year',
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    popover_options: {
                        placement: 'right',
                        title: 'Vintage year',
                        css_class: 'popover-default',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            mapping_default: [],
                            query: {
                                target: 'commander:vintage_years',
                                results_per_page: 'all',
                            },
                        },
                    },
                },
                {
                    id: 'enum_attributes',
                    component: AttributeFilters,
                    id_callback: this.events.register_alias('enumAttributes'),
                    css: {
                        'btn-sm': true,
                        'btn-cpanel-primary': true,
                        'btn-block': true,
                    },
                    clear_event: this.events.get('clear'),
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            public_taxonomy: true,
                            include_enums: ['geography', 'style', 'sector'],
                        },
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

        this.search_funds = {
            id: 'search_funds',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.fund_header = {
            id: 'fund_header',
            component: Header,
            buttons: [
                {
                    id: 'edit',
                    id_callback: this.events.register_alias('editFund'),
                    label: 'Edit Fund<span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Fund',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-danger': true,
                    },
                    use_header_data: true,
                    disable_if_no_data: true,
                    trigger_modal: {
                        id: 'delete_modal',
                        url: config.commander.funds_url,
                        component: DeleteSingleModal,
                        endpoint: 'delete_funds',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('fundUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund_info = {
            id: 'fund_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'Name',
                    value_key: 'name',
                },
                this.firm_metric(),
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Family',
                    value_key: 'family_name',
                },
                {
                    label: 'Geography',
                    value_key: 'geography',
                    format: 'weighted_strings',
                },
                {
                    label: 'Style / Focus',
                    value_key: 'style',
                    format: 'weighted_strings',
                },
                {
                    label: 'Sector',
                    value_key: 'sector',
                    format: 'weighted_strings',
                },
                {
                    label: 'Currency',
                    value_key: 'currency_symbol',
                },
                {
                    label: 'Target Size',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'target_size_value',
                    },
                },
                {
                    label: 'Total Sold',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'total_sold_value',
                    },
                },
                {
                    label: 'Gross Invested',
                    format: 'money',
                    format_args: {
                        value_key: 'gross_invested',
                    },
                },
                {
                    label: 'Gross Realized',
                    format: 'money',
                    format_args: {
                        value_key: 'gross_realized',
                    },
                },
                {
                    label: 'Gross Unrealized',
                    format: 'money',
                    format_args: {
                        value_key: 'gross_unrealized',
                    },
                },
                {
                    label: 'First Close',
                    value_key: 'first_close',
                    format: 'backend_date',
                },
                {
                    label: 'Final Close',
                    value_key: 'final_close',
                    format: 'backend_date',
                },
                {
                    label: 'Status',
                    value_key: 'status_text',
                },
                {
                    label: 'Will be published',
                    value_key: 'publishable',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Included in BUSMI',
                    value_key: 'busmi',
                    format: 'boolean_highlight',
                    format_args: {
                        css: {
                            yes: 'text-green',
                        },
                    },
                },
                {
                    label: 'Ordinal',
                    value_key: 'ordinal_value',
                },
                {
                    label: 'Ordinal Style',
                    value_key: 'ordinal_style',
                },
                ...this.static_performance({key: 'value_key'}),
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('fundUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund_investments = {
            id: 'fund_investments',
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
                            fund_uid: {
                                type: 'observer',
                                event_type: this.events.get('fundUid'),
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
                    label: 'As of Date',
                    key: 'as_of_date',
                    format: 'backend_date',
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

        this.fund_cashflows_header = {
            id: 'fund_cashflows_header',
            component: Header,
            buttons: [
                {
                    id: 'delete_multiple',
                    label: 'Delete Cashflows<span class="icon-trash">',
                    disabled_callback: data => {
                        if (data && data.length > 0) {
                            return false;
                        }
                        return true;
                    },
                    trigger_modal: {
                        id: 'delete_market_data_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_market_data_cashflows',
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
                                label: 'Company',
                                key: 'company_name',
                            },
                        ],
                        datasource: {
                            type: 'observer',
                            default: [],
                            event_type: this.events.get('fund_cashflows_table'),
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

        this.fund_cashflows = {
            id: 'fund_cashflows',
            id_callback: this.events.register_alias('fund_cashflows_table'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Fund Cashflows',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 20,
            enable_localstorage: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_csv_export: true,
            enable_selection: true,
            columns: [
                {label: 'Uid', key: 'uid'},
                {label: 'Fund', key: 'fund_name'},
                {
                    label: 'Company',
                    format: 'contextual_link',
                    format_args: {
                        url: 'company/<company_uid>',
                        label_key: 'company_name',
                    },
                },
                {label: 'Date', key: 'date', format: 'backend_date'},
                {label: 'Amount', key: 'amount', format: 'money'},
                {label: 'Type', key: 'type'},
                {label: 'Note', key: 'note'},
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:market_data_cashflows',
                    fund_uid: {
                        type: 'observer',
                        event_type: this.events.get('fundUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund_sec_filings = {
            id: 'fund_sec_filings',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            label: 'Sec Filings attached',
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 5,
            enable_localstorage: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            columns: [
                {
                    label: 'Fund name',
                    key: 'fund_name',
                },
                {
                    label: 'Uid',
                    format: 'contextual_link',
                    format_args: {
                        url: 'sec-filing/<uid>',
                        label_key: 'uid',
                    },
                },
                {
                    label: 'Date',
                    key: 'date',
                    format: 'backend_date',
                },
                {
                    label: 'Source',
                    sort_key: 'url',
                    format: 'external_link',
                    format_args: {
                        url_key: 'url',
                        label_key: 'url',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:sec_filings',
                    filters: {
                        type: 'dynamic',
                        query: {
                            fund_uid: {
                                type: 'observer',
                                event_type: this.events.get('fundUid'),
                                required: true,
                            },
                        },
                    },
                },
            },
        };

        this.show_fund = {
            id: 'show_fund',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: [
                    'fund_header',
                    'fund_info',
                    ...(auth.user_has_feature('edit_investments') ? ['fund_investments'] : []),
                    'fund_cashflows_header',
                    'fund_cashflows',
                    'fund_sec_filings',
                ],
            },
            components: [
                this.fund_header,
                this.fund_info,
                ...(auth.user_has_feature('edit_investments') ? [this.fund_investments] : []),
                this.fund_cashflows_header,
                this.fund_cashflows,
                this.fund_sec_filings,
            ],
        };

        this.fund_form = {
            id: 'fund_form',
            component: EditForm,
            num_columns: 2,
            success_event: this.events.get('editSuccess'),
            cancel_event: this.events.get('editCancel'),
            fields: this.edit_config.fund_fields,
            backend: 'commander',
            endpoint: 'update_fund',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('fundUid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_fund = {
            id: 'edit_fund',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['fund_form'],
            },
            components: [this.fund_form],
        };

        this.page_wrapper = this.new_instance(
            DynamicWrapper,
            {
                id: 'page_wrapper',
                template: 'tpl_dynamic_wrapper',
                active_component: 'search_funds',
                set_active_event: this.events.get('pageState'),
                components: [this.search_funds, this.show_fund, this.edit_fund],
            },
            this.shared_components,
        );

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('funds', this.handle_url);

            Observer.register(this.events.get('editFund'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('publish'), fund => {
                this.endpoints.update_fund({
                    data: {
                        uid: fund.uid,
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

            Observer.register(this.events.get('unpublish'), fund => {
                this.endpoints.update_fund({
                    data: {
                        uid: fund.uid,
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

            Observer.register(this.events.get('realize'), fund => {
                this.endpoints.update_fund({
                    data: {
                        uid: fund.uid,
                        updates: {
                            fully_realized: true,
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

            Observer.register(this.events.get('unrealize'), fund => {
                this.endpoints.update_fund({
                    data: {
                        uid: fund.uid,
                        updates: {
                            fully_realized: false,
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

            Observer.register(this.events.get('deleteFund'), fund => {
                this.endpoints.delete_fund({
                    data: {uid: fund.uid},
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

            Observer.register(this.events.get('download_cashflows'), () => {
                DataThing.get({
                    params: {
                        target: 'csv_download_key',
                        columns: [
                            {key: 'uid', label: 'uid'},
                            {key: 'fund_name', label: 'Fund'},
                            {key: 'company_name', label: 'Company'},
                            {key: 'date', label: 'Date', format: 'backend_date'},
                            {key: 'amount', label: 'Amount'},
                            {key: 'type', label: 'Type'},
                            {key: 'note', label: 'Note'},
                        ],
                        query: {
                            target: 'commander:market_data_cashflows',
                        },
                    },
                    success: key => {
                        DataThing.form_post(config.download_csv_base + key);
                    },
                    force: true,
                });
            });

            this.dfd.resolve();
        });
    }

    firm_metric() {
        if (auth.user_has_features(['edit_funds'])) {
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
            value_key: 'firm_name',
        };
    }

    static_performance({key, overrides}) {
        if (auth.user_has_feature('static_fund_performance')) {
            const k = key || 'key';
            return [
                {label: 'IRR', [k]: 'irr', format: 'percent'},
                {label: 'DPI', [k]: 'dpi', format: 'multiple'},
                {label: 'TVPI', [k]: 'tvpi', format: 'multiple'},
                {label: 'RVPI', [k]: 'rvpi', format: 'multiple'},
                {label: 'Paid in %', [k]: 'picc', format: 'percent'},
                {label: 'As of Date', [k]: 'as_of_date', format: 'backend_date'},
                {label: 'Gross IRR', [k]: 'gross_irr', format: 'percent'},
                {label: 'Gross Multiple', [k]: 'gross_multiple', format: 'multiple'},
            ].map(v => ({...v, ...overrides}));
        }
        return [];
    }
}

export default Funds;
