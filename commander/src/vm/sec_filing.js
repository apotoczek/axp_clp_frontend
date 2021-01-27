import EditForm from 'src/libs/components/forms/EditForm';
import TypeaheadInput from 'src/libs/components/TypeaheadInput';
import JSONContent from 'src/libs/components/basic/JSONContent';
import CreateFundModal from 'src/libs/components/modals/CreateFundModal';
import CreateFirmModal from 'src/libs/components/modals/CreateFirmModal';
import ToggleActionButton from 'src/libs/components/basic/ToggleActionButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import Header from 'src/libs/components/commander/Header';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataTable from 'src/libs/components/basic/DataTable';
import EditFormConfig from 'src/libs/components/forms/EditFormConfig';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

class SecFiling extends Context {
    constructor() {
        super({id: 'sec'});

        this.dfd = this.new_deferred();

        this.endpoints = {
            update_sec: DataThing.backends.commander({
                url: 'update_sec',
            }),
        };
        this.data_table_id = Utils.gen_id(
            this.get_id(),
            'page_wrapper',
            'search_secs',
            'sec_list_body',
            'sec_table',
        );
        this.sec_uid = undefined;

        this.eventRegistry = this.new_instance(EventRegistry, {});
        this.eventRegistry.resolve_and_add('dataTable', 'DataTable.counts', 'dataTableCounts');
        this.eventRegistry.resolve_and_add('stringFilter', 'StringFilter.value');
        this.eventRegistry.resolve_and_add('onlyUnprocessed', 'BooleanButton.state');
        this.eventRegistry.resolve_and_add(
            'processor',
            'ToggleActionButton.action.processed',
            'processed',
        );
        this.eventRegistry.resolve_and_add(
            'processor',
            'ToggleActionButton.action.unprocess',
            'unprocessed',
        );

        this.eventRegistry.new('pageState');
        this.eventRegistry.new('secUid');
        this.eventRegistry.new('firmUid');
        this.eventRegistry.new('fundUid');
        this.eventRegistry.new('saveFundSuccess');
        this.eventRegistry.new('clearForm');
        this.eventRegistry.new('createFundSuccess');

        this.edit_config = EditFormConfig({event_fund_uid: this.eventRegistry.get('fundUid')});

        this.handle_url = url => {
            if (url.length == 1) {
                Observer.broadcast(this.eventRegistry.get('pageState'), 'search_secs');
                Observer.broadcast(this.eventRegistry.get('secUid'), undefined);
                Observer.broadcast(this.eventRegistry.get('fundUid'), undefined);
                Observer.broadcast(this.eventRegistry.get('firmUid'), undefined);
                Observer.broadcast(this.eventRegistry.get('clearForm'));
                this.sec_uid = undefined;
            }
            if (url.length == 2) {
                Observer.broadcast(this.eventRegistry.get('pageState'), 'show_sec');
                Observer.broadcast(this.eventRegistry.get('secUid'), url[1]);
                this.sec_uid = url[1];
            }
        };

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'SEC Filings',
            data_table_id: this.data_table_id,
        };

        this.sec_table = {
            id: 'sec_table',
            id_callback: this.eventRegistry.register_alias('dataTable'),
            component: DataTable,
            template: 'tpl_data_table',
            css: {'table-light': true, 'table-sm': true},
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
                {
                    label: 'Marked processed',
                    key: 'processed',
                    format: 'boolean_highlight',
                    visible: true,
                    disable_sorting: true,
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
                    target: 'commander:sec_filings',
                    filters: {
                        type: 'dynamic',
                        query: {
                            only_unprocessed: {
                                type: 'observer',
                                event_type: this.eventRegistry.get('onlyUnprocessed'),
                                default: true,
                            },
                            string_filter: {
                                type: 'observer',
                                event_type: this.eventRegistry.get('stringFilter'),
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
                body: ['string_filter', 'meta', 'filter_label', 'processed'],
            },
            components: [
                {
                    id: 'string_filter',
                    id_callback: this.eventRegistry.register_alias('stringFilter'),
                    component: StringFilter,
                    placeholder: 'Fund Name...',
                    enable_localstorage: true,
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'SEC Filings',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: this.eventRegistry.get('dataTableCounts'),
                    },
                },
                {
                    id: 'filter_label',
                    html: '<h3>Filters</h3>',
                    component: HTMLContent,
                },
                {
                    id: 'processed',
                    id_callback: this.eventRegistry.register_alias('onlyUnprocessed'),
                    component: BooleanButton,
                    default_state: true,
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                    label: 'Show only unprocessed',
                },
            ],
        };

        this.sec_list_body = {
            id: 'sec_list_body',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['search_header', 'sec_table'],
            },
            components: [this.search_header, this.sec_table],
        };

        this.search_secs = {
            id: 'search_secs',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'sec_list_body'],
            },
            components: [this.search_cpanel, this.sec_list_body],
        };

        this.sec_header = {
            id: 'sec_header',
            component: Header,
            title: 'SEC',
            buttons: [
                {
                    id: 'toggle_processed',
                    id_callback: this.eventRegistry.register_alias('processor'),
                    component: ToggleActionButton,
                    labels: [
                        'Mark Processed <span class="icon-link-1"></span>',
                        'Mark Unprocess <span class="icon-unlink"></span>',
                    ],
                    actions: ['processed', 'unprocessed'],
                    state_css: ['btn-cpanel-success', 'btn-warning'],
                    key: 'processed',
                    css: {
                        'btn-sm': true,
                        'pull-right': true,
                        'btn-block': true,
                    },
                    use_header_data: true,
                },
                {
                    id: 'edit',
                    label: 'Create Firm',
                    action: 'edit',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'pull-right': true,
                        'btn-cpanel-success': true,
                    },
                    trigger_modal: {
                        component: CreateFirmModal,
                        id: 'create_firm_modal',
                    },
                },
                {
                    id: 'delete',
                    label: 'Create Fund',
                    action: 'delete',
                    css: {
                        'btn-sm': true,
                        'btn-default': true,
                        'btn-cpanel-success': true,
                    },
                    trigger_modal: {
                        component: CreateFundModal,
                        id: 'create_fund_modal',
                        success_event: this.eventRegistry.get('createFundSuccess'),
                        data_mapper: data => {
                            const results = {};
                            if (data.sec_data) {
                                for (const entry of data.sec_data) {
                                    if (entry.key === 'Fund Name') {
                                        results.fund_name = entry.value;
                                    }
                                    if (entry.key === 'Fund Size') {
                                        results.target_size_value = parseFloat(
                                            entry.value.replace(/,/g, ''),
                                        );
                                    }
                                    if (entry.key === 'Date of first sale') {
                                        const date = Utils.date_to_epoch(entry.value);
                                        results.first_close = date;
                                    }
                                }
                            }
                            return results;
                        },
                    },
                    use_header_data: true,
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:sec',
                    uid: {
                        type: 'observer',
                        event_type: this.eventRegistry.get('secUid'),
                        required: true,
                    },
                },
            },
        };

        this.sec_info = {
            id: 'sec_info',
            component: JSONContent,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:sec',
                    uid: {
                        type: 'observer',
                        event_type: this.eventRegistry.get('secUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund_search = {
            id: 'fund_search',
            component: TypeaheadInput,
            placeholder: 'Search fund...',
            select_event: this.eventRegistry.get('fundUid'),
            clear_event: this.eventRegistry.get('clearForm'),
            fetch_event: this.eventRegistry.get('createFundSuccess'),
            endpoint: {
                target: 'commander:funds',
                query_key: 'string_filter',
                display_key: 'name',
                return_key: 'uid',
                order_by: [
                    {
                        name: 'name',
                        sort: 'asc',
                    },
                ],
            },
        };

        this.edit_fund = {
            id: 'edit_fund',
            component: EditForm,
            num_columns: 4,
            reset_event: this.eventRegistry.get('clearForm'),
            fields: this.edit_config.fund_fields,
            success_event: this.eventRegistry.get('saveFundSuccess'),
            send_success_data: true,
            backend: 'commander',
            endpoint: 'update_fund',
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:fund',
                    uid: {
                        type: 'observer',
                        event_type: this.eventRegistry.get('fundUid'),
                        required: true,
                    },
                },
            },
        };

        this.fund_section = {
            id: 'fund_section',
            title: 'Fund',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['fund_search', 'edit_fund'],
            },
            components: [this.fund_search, this.edit_fund],
        };

        this.edit_section = {
            id: 'edit_section',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['fund_section'],
            },
            components: [this.fund_section],
        };

        this.show_sec_content = {
            id: 'show_sec_content',
            component: Aside,
            template: 'tpl_aside_split',
            layout: {
                col_1: 'sec_info',
                col_2: 'edit_section',
            },
            components: [this.sec_info, this.edit_section],
        };

        this.prev_secs = {
            id: 'prev_secs',
            label: 'Attached secs for fund',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            empty_template: 'tpl_data_table_empty_with_label',
            results_per_page: 10,
            columns: [
                {
                    label: 'Sec fund name',
                    key: 'fund_name',
                },
                {
                    label: 'Url',
                    sort_key: 'url',
                    format: 'external_link',
                    format_args: {
                        url_key: 'url',
                        label_key: 'url',
                        max_length: 200,
                    },
                },
                {
                    label: 'Sec amount closed',
                    key: 'data:offeringData:offeringSalesAmounts:totalAmountSold',
                    format: 'maybe_number',
                },
                {
                    label: 'Sec fund size',
                    key: 'data:offeringData:offeringSalesAmounts:totalOfferingAmount',
                    format: 'maybe_number',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    results_per_page: 10,
                    target: 'commander:sec_filings',
                    filters: {
                        type: 'dynamic',
                        query: {
                            fund_uid: {
                                type: 'observer',
                                event_type: this.eventRegistry.get('fundUid'),
                                required: true,
                            },
                        },
                    },
                },
            },
        };

        this.show_sec = {
            id: 'show_sec',
            component: Aside,
            template: 'tpl_aside_main_content',
            layout: {
                body: ['sec_header', 'show_sec_content', 'prev_secs'],
            },
            components: [this.sec_header, this.show_sec_content, this.prev_secs],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_secs',
            set_active_event: this.eventRegistry.get('pageState'),
            components: [this.search_secs, this.show_sec],
        });

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('sec-filing', this.handle_url);

            Observer.register(this.eventRegistry.get('processed'), sec => {
                this.endpoints.update_sec({
                    data: {
                        uid: sec.uid,
                        updates: {
                            processed: true,
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

            Observer.register(this.eventRegistry.get('unprocessed'), sec => {
                this.endpoints.update_sec({
                    data: {
                        uid: sec.uid,
                        updates: {
                            processed: false,
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

            Observer.register_many(
                [
                    this.eventRegistry.get('saveFundSuccess'),
                    this.eventRegistry.get('createFundSuccess'),
                ],
                fund => {
                    this.endpoints.update_sec({
                        data: {
                            uid: this.sec_uid,
                            updates: {
                                fund_uid: fund.uid,
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
                },
            );

            this.dfd.resolve();
        });
    }
}

export default SecFiling;
