import pager from 'pager';
import auth from 'auth';
import config from 'config';
import EnumValuesForm from 'src/libs/components/datamanager/EnumValuesForm';
import EditForm from 'src/libs/components/forms/EditForm';
import MetricTable from 'src/libs/components/MetricTable';
import DeleteSingleModal from 'src/libs/components/modals/DeleteSingleModal';
import EventButton from 'src/libs/components/basic/EventButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import DataTable from 'src/libs/components/basic/DataTable';
import ActionButton from 'src/libs/components/basic/ActionButton';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import DeleteMultiple from 'src/libs/components/modals/DeleteMultiple';
import CreateAnticipatedFundModal from 'src/libs/components/modals/CreateAnticipatedFundModal';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import ConvertSingle from 'src/libs/components/modals/ConvertSingle';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class AnticipatedFunds extends Context {
    constructor() {
        super({id: 'anticipated-funds'});

        this.dfd = this.new_deferred();

        this.data_table_id = Utils.gen_id(
            this.get_id(),
            'page_wrapper',
            'search_anticipated_funds',
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
        this.events.resolve_and_add('convert', 'ActionButton.action.convert');
        this.events.resolve_and_add('editAnticipatedFund', 'ActionButton.action.edit');
        this.events.resolve_and_add('stringFilter', 'StringFilter.value');
        this.events.resolve_and_add('onlyUnpublished', 'BooleanButton.state');

        this.events.new('pageState');
        this.events.new('anticipatedFundUid');
        this.events.new('editSuccess');
        this.events.new('editCancel');

        this.endpoints = {
            update_anticipated_fund: DataThing.backends.commander({
                url: 'update_anticipated_fund',
            }),
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Anticipated Funds',
            buttons: [
                {
                    id: 'create',
                    label: 'Create Anticipated Fund<span class="icon-plus">',
                    action: 'create',
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-cpanel-success': true,
                        'pull-right': true,
                    },
                    trigger_modal: {
                        component: CreateAnticipatedFundModal,
                        id: 'create_anticipated_fund_modal',
                    },
                },
                {
                    id: 'delete_multiple',
                    label: 'Delete Anticipated Funds<span class="icon-trash">',
                    action: 'delete_selected',
                    disable_if_no_data: true,
                    css: {
                        btn: true,
                        'btn-sm': true,
                        'btn-danger': true,
                    },
                    disabled_callback: data => {
                        if (data && data.length > 0) {
                            return false;
                        }
                        return true;
                    },
                    trigger_modal: {
                        id: 'delete_modal',
                        component: DeleteMultiple,
                        endpoint: 'delete_anticipated_funds',
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
                },
            ],
            data_table_id: this.data_table_id,
        };

        this.search_table_columns = () => {
            let columns = [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'anticipated-funds/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: 'Firm',
                    key: 'firm_name',
                    disable_sorting: true,
                },
                {
                    label: 'Family',
                    key: 'family_name',
                    disable_sorting: true,
                },
                {
                    label: 'Ordinal',
                    key: 'ordinal',
                    disable_sorting: true,
                },
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                },
                {
                    label: 'Fund Size',
                    sort_key: 'fund_size',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency_symbol',
                        value_key: 'fund_size',
                    },
                },
                {
                    label: 'Currency',
                    key: 'currency_symbol',
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
                    label: 'Source',
                    key: 'source',
                    visible: true,
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
            ];

            if (auth.user_has_features(['edit_funds'])) {
                columns.push({
                    id: 'convert',
                    component_callback: 'data',
                    label: 'Convert',
                    disable_sorting: true,
                    always_visible: true,
                    width: '1%',
                    component: {
                        id: 'action',
                        id_callback: this.events.register_alias('convert'),
                        component: ActionButton,
                        label: 'Convert to Fund',
                        action: 'convert',
                        css: {
                            'btn-xs': true,
                            'pull-right': true,
                            'btn-block': true,
                            'btn-cpanel-success': true,
                        },
                    },
                });
            }

            return columns;
        };

        this.search_table = {
            id: 'search_table',
            id_callback: this.events.register_alias('dataTable'),
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_localstorage: true,
            enable_csv_export: true,
            columns: this.search_table_columns(),
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:anticipated_funds',
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

        this.search_body = {
            id: 'search_body',
            compoent: 'basic/Aside',
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
                body: ['string_filter', 'meta', 'filters_label', 'publish', 'clear'],
            },
            components: [
                {
                    id: 'string_filter',
                    id_callback: this.events.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Search...',
                    clear_event: this.events.get('clear'),
                    enable_localstorage: true,
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Showing',
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
                    id: 'filters_label',
                    component: HTMLContent,
                    html: '<h3>Filters</h3>',
                },
                {
                    id: 'publish',
                    id_callback: this.events.register_alias('onlyUnpublished'),
                    reset_event: this.events.get('clear'),
                    component: BooleanButton,
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
                    id_callback: this.events.register_alias('clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Restore Defaults',
                },
            ],
        };

        this.search_anticipated_funds = {
            id: 'search_anticipated_funds',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [this.search_cpanel, this.search_body],
        };

        this.anticipated_fund_header = {
            id: 'anticipated_fund_header',
            component: Header,
            buttons: [
                {
                    id: 'edit',
                    id_callback: this.events.register_alias('editAnticipatedFund'),
                    label: 'Edit Anticipated Fund<span class="icon-wrench"></span>',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Anticipated Fund',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-danger': true,
                    },
                    use_header_data: true,
                    disable_if_no_data: true,
                    trigger_modal: {
                        id: 'delete_modal',
                        url: config.commander.anticipated_funds_url,
                        component: DeleteSingleModal,
                        endpoint: 'delete_anticipated_funds',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:anticipated_fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('anticipatedFundUid'),
                        required: true,
                    },
                },
            },
        };

        this.firm_metric = () => {
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
        };
        this.anticipated_fund_info = {
            id: 'anticipated_fund_info',
            component: MetricTable,
            css: {'table-light': true},
            columns: 2,
            metrics: [
                {
                    label: 'name',
                    value_key: 'name',
                },
                this.firm_metric(),
                {
                    label: 'Family',
                    sort_key: 'family_name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'families/<family_uid>',
                        label_key: 'family_name',
                    },
                },
                {
                    label: 'Ordinal',
                    value_key: 'ordinal',
                },
                {
                    label: 'Geography',
                    value_key: 'geography',
                    format: 'weighted_strings',
                },
                {
                    label: 'Sector',
                    value_key: 'sector',
                    format: 'weighted_strings',
                },
                {
                    label: 'Style / Focus',
                    value_key: 'style',
                    format: 'weighted_strings',
                },

                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Fund Size',
                    sort_key: 'fund_size',
                    format: 'money',
                    format_args: {
                        currency_key: 'currency',
                        value_key: 'fund_size',
                    },
                },
                {
                    label: 'Currency',
                    value_key: 'currency_symbol',
                    visible: false,
                },
                {
                    label: 'Source',
                    value_key: 'source',
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
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:anticipated_fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('anticipatedFundUid'),
                        required: true,
                    },
                },
            },
        };

        this.show_anticipated_fund = {
            id: 'show_anticipated_fund',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['anticipated_fund_header', 'anticipated_fund_info'],
            },
            components: [this.anticipated_fund_header, this.anticipated_fund_info],
        };

        this.anticipated_fund_form = {
            id: 'anticipated_fund_form',
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
                    label: 'Firm',
                    input_type: 'typeahead',
                    key: 'firm_uid',
                    input_options: {
                        placeholder: 'Firm',
                        allow_empty: false,
                        endpoint: {
                            target: 'commander:firms',
                            query_key: 'string_filter',
                            display_key: 'name',
                            return_key: 'uid',
                            order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
                        },
                        selected_datasource: {
                            type: 'dynamic',
                            mapping: 'filter_object',
                            mapping_args: {
                                key_map: {
                                    firm_uid: 'uid',
                                    firm_name: 'name',
                                },
                            },
                            query: {
                                target: 'commander:anticipated_fund',
                                uid: {
                                    type: 'observer',
                                    event_type: this.events.get('anticipatedFundUid'),
                                    required: true,
                                },
                            },
                        },
                    },
                },
                {
                    label: 'Family',
                    input_type: 'typeahead',
                    key: 'family_uid',
                    input_options: {
                        placeholder: 'Family',
                        allow_empty: false,
                        endpoint: {
                            target: 'commander:families',
                            query_key: 'string_filter',
                            display_key: 'name',
                            return_key: 'uid',
                            order_by: [{name: 'name_startswith'}, {name: 'name', sort: 'asc'}],
                        },
                        selected_datasource: {
                            type: 'dynamic',
                            mapping: 'filter_object',
                            mapping_args: {
                                key_map: {
                                    family_uid: 'uid',
                                    family_name: 'name',
                                },
                            },
                            query: {
                                target: 'commander:anticipated_fund',
                                uid: {
                                    type: 'observer',
                                    event_type: this.events.get('anticipatedFundUid'),
                                    required: true,
                                },
                            },
                        },
                    },
                },
                {
                    label: 'Vintage Year',
                    input_type: 'number',
                    key: 'vintage_year',
                    input_options: {
                        format: 'no_format',
                        placeholder: 'Vintage year',
                        allow_empty: true,
                        value_on_empty: null,
                    },
                },
                {
                    label: 'Ordinal',
                    input_type: 'text',
                    key: 'ordinal',
                    input_options: {
                        allow_empty: false,
                        custom_validator: {
                            function: e => e != undefined && e > 0,
                            message: 'Can not be empty or less than 1',
                        },
                    },
                },
                {
                    label: 'Fund Size',
                    input_type: 'number',
                    key: 'fund_size',
                    input_options: {
                        placeholder: 'Fund Size',
                        allow_empty: true,
                        value_on_empty: null,
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
                    key: 'style',
                    label: 'Style',
                    input_type: 'new_popover_button',
                    input_options: {
                        label: 'Style / Focus',
                        track_selection_property: 'selected_summary',
                        ellipsis: true,
                        icon_css: 'caret',
                        css: {
                            'btn-block': true,
                            'btn-ghost-info': true,
                        },
                        popover_options: {
                            placement: 'bottom',
                            title: 'Style / Focus',
                            css_class: 'popover-enums',
                        },
                        popover_config: {
                            component: EnumValuesForm,
                            attribute_identifier: 'style',
                            options_target: 'attribute:editable_data',
                            selected_datasource: {
                                type: 'dynamic',
                                disable_cache: true,
                                query: {
                                    target: 'commander:enum_values_for_entity',
                                    entity_uid: {
                                        type: 'observer',
                                        event_type: this.events.get('anticipatedFundUid'),
                                        required: true,
                                    },
                                    attribute_identifier: 'style',
                                    entity_type: 'anticipated_fund',
                                },
                            },
                        },
                    },
                },
                {
                    key: 'geography',
                    label: 'Geography',
                    input_type: 'new_popover_button',
                    input_options: {
                        track_selection_property: 'selected_summary',
                        ellipsis: true,
                        label: 'Geography',
                        icon_css: 'caret',
                        css: {
                            'btn-block': true,
                            'btn-ghost-info': true,
                        },
                        popover_options: {
                            placement: 'bottom',
                            title: 'Geography',
                            css_class: 'popover-enums',
                        },
                        popover_config: {
                            component: EnumValuesForm,
                            attribute_identifier: 'geography',
                            options_target: 'attribute:editable_data',
                            selected_datasource: {
                                type: 'dynamic',
                                disable_cache: true,
                                query: {
                                    target: 'commander:enum_values_for_entity',
                                    entity_uid: {
                                        type: 'observer',
                                        event_type: this.events.get('anticipatedFundUid'),
                                        required: true,
                                    },
                                    attribute_identifier: 'geography',
                                    entity_type: 'anticipated_fund',
                                },
                            },
                        },
                    },
                },
                {
                    key: 'sector',
                    label: 'Sector',
                    input_type: 'new_popover_button',
                    input_options: {
                        label: 'Sector',
                        track_selection_property: 'selected_summary',
                        ellipsis: true,
                        icon_css: 'caret',
                        css: {
                            'btn-block': true,
                            'btn-ghost-info': true,
                        },
                        popover_options: {
                            placement: 'bottom',
                            title: 'Sector',
                            css_class: 'popover-enums',
                        },
                        popover_config: {
                            component: EnumValuesForm,
                            attribute_identifier: 'sector',
                            options_target: 'attribute:editable_data',
                            selected_datasource: {
                                type: 'dynamic',
                                disable_cache: true,
                                query: {
                                    target: 'commander:enum_values_for_entity',
                                    entity_uid: {
                                        type: 'observer',
                                        event_type: this.events.get('anticipatedFundUid'),
                                        required: true,
                                    },
                                    attribute_identifier: 'sector',
                                    entity_type: 'anticipated_fund',
                                },
                            },
                        },
                    },
                },
            ],
            backend: 'commander',
            endpoint: 'update_anticipated_fund',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:anticipated_fund',
                    uid: {
                        type: 'observer',
                        event_type: this.events.get('anticipatedFundUid'),
                        required: true,
                    },
                },
            },
        };

        this.edit_anticipated_fund = {
            id: 'edit_anticipated_fund',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['anticipated_fund_form'],
            },
            components: [this.anticipated_fund_form],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_anticipated_funds',
            set_active_event: this.events.get('pageState'),
            components: [
                this.search_anticipated_funds,
                this.show_anticipated_fund,
                this.edit_anticipated_fund,
            ],
        });

        this.convert_modal = this.new_instance(ConvertSingle, {
            id: 'convert_modal',
            endpoint: 'convert_anticipated_to_funds',
            table_columns: [
                {
                    label: 'UID',
                    key: 'uid',
                },
                {
                    label: 'Name',
                    key: 'name',
                },
            ],
        });

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(this.events.get('pageState'), 'search_anticipated_funds');
                Observer.broadcast(this.events.get('anticipatedFundUid'), undefined);
            }
            if (url.length == 2) {
                Observer.broadcast(this.events.get('pageState'), 'show_anticipated_fund');
                Observer.broadcast(this.events.get('anticipatedFundUid'), url[1]);
            }
            if (url.length == 3 && url[2] == 'edit') {
                Observer.broadcast(this.events.get('pageState'), 'edit_anticipated_fund');
                Observer.broadcast(this.events.get('anticipatedFundUid'), url[1]);
            }
        };

        this.when(this.page_wrapper, this.convert_modal).done(() => {
            Observer.register(this.events.get('convert'), data => {
                this.convert_modal.data(data);
                this.convert_modal.show();
            });

            Observer.register_hash_listener('anticipated-funds', this.handle_url);

            Observer.register(this.events.get('editAnticipatedFund'), () => {
                pager.navigate(`${window.location.hash}/edit`);
            });

            Observer.register(this.events.get('publish'), anticipated_fund => {
                anticipated_fund.publish = true;
                this.endpoints.update_anticipated_fund({
                    data: {
                        uid: anticipated_fund.uid,
                        updates: anticipated_fund,
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

            Observer.register(this.events.get('unpublish'), anticipated_fund => {
                anticipated_fund.publish = false;
                this.endpoints.update_anticipated_fund({
                    data: {
                        uid: anticipated_fund.uid,
                        updates: anticipated_fund,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                    error: DataThing.api.XHRError(error => {
                        DataThing.status_check();
                        throw `Error: ${error}`;
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

export default AnticipatedFunds;
