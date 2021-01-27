import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import FileUploadButton from 'src/libs/components/upload/FileUploadButton';
import Header from 'src/libs/components/commander/Header';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

class InvestorContacts extends Context {
    constructor() {
        super({id: 'investor-contacts'});

        this.dfd = this.new_deferred();

        let events = this.new_instance(EventRegistry, {});

        events.resolve_and_add('string_filter', 'StringFilter.value');
        events.resolve_and_add('page_state', 'InvestorContacts.state');
        events.resolve_and_add('clear', 'EventButton');
        events.resolve_and_add('data_table_counts', 'DataTable.counts');

        this.search_header = {
            id: 'search_header',
            component: Header,
            title: 'Investor Contacts',
            buttons: [
                {
                    id: 'upload',
                    label: 'Upload Spreadsheet<span class="icon-doc">',
                    component: FileUploadButton,
                    upload_endpoint: 'commander/upload_position_spreadsheet',
                    confirm_endpoint: 'confirm_position_spreadsheet',
                    cancel_endpoint: 'cancel_upload_investors',
                    success_keys: [
                        {
                            label: 'Name',
                            sort_key: 'first_name',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'first_name',
                            },
                        },
                        {
                            label: 'Last Name',
                            sort_key: 'last_name',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'last_name',
                            },
                        },
                        {
                            label: 'Job Title',
                            sort_key: 'job_title',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'job_title',
                            },
                        },
                        {
                            label: 'Investor Name',
                            sort_key: 'investor',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'investor',
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
                            label: 'Email',
                            sort_key: 'email',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'email',
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
                            label: 'Street',
                            sort_key: 'street_1',
                            format: 'highlight_if_update',
                            format_args: {
                                value_key: 'street_1',
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
            ],
        };

        this.search_table = {
            id: 'search_table',
            component: DataTable,
            id_callback: events.register_alias('data_table_counts'),
            css: {'table-light': true, 'table-sm': true},
            enable_selection: true,
            enable_column_toggle: true,
            results_per_page: 50,
            clear_order_event: events.get('clear'),
            enable_clear_order: true,
            enable_localstore: true,
            enable_csv_export: true,
            columns: [
                {
                    label: 'First Name',
                    key: 'first_name',
                },
                {
                    label: 'Last Name',
                    key: 'last_name',
                },
                {
                    label: 'Job Title',
                    key: 'job_title',
                },
                {
                    label: 'Investor',
                    key: 'investor_name',
                },
                {
                    label: 'Phone',
                    key: 'phone',
                },
                {
                    label: 'Email',
                    key: 'email',
                },
                {
                    label: 'Address 1',
                    key: 'street_1',
                },
                {
                    label: 'City',
                    key: 'city',
                    placeholder: 'No city',
                },
                {
                    label: 'State',
                    key: 'state',
                },
                {
                    label: 'Country',
                    key: 'country',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:investor_contacts',
                    filters: {
                        type: 'dynamic',
                        query: {
                            name: {
                                type: 'observer',
                                event_type: events.get('string_filter'),
                            },
                        },
                    },
                },
                results_per_page: 50,
            },
        };

        this.search_cpanel = {
            id: 'search_cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['string_filter', 'meta', 'clear'],
            },
            components: [
                {
                    id: 'string_filter',
                    component: StringFilter,
                    id_callback: events.register_alias('string_filter'),
                    placeholder: 'Search...',
                    enable_localstorage: true,
                    clear_event: events.get('clear'),
                },
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Contacts',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: events.get('data_table_counts'),
                    },
                },
                {
                    id: 'clear',
                    component: EventButton,
                    id_callback: events.register_alias('clear'),
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

        this.search_investor_contacts = {
            id: 'search_investor_contacts',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_content_wrapper'],
            },
            components: [this.search_cpanel, this.search_content_wrapper],
        };

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_investor_contacts',
            set_active_event: events.page_state,
            components: [this.search_investor_contacts],
        });

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('investors', this.handle_url);

            this.dfd.resolve();
        });
    }
}

export default InvestorContacts;
