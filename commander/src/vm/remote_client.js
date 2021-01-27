import Aside from 'src/libs/components/basic/Aside';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import StringFilter from 'src/libs/components/basic/StringFilter';

import Header from 'src/libs/components/commander/Header';
import MetaInfo from 'src/libs/components/MetaInfo';
import ShowRemotePartner from 'src/libs/components/remote_access/ShowRemotePartner';

import {gen_event, gen_id} from 'src/libs/Utils';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';

class RemoteClientVM extends Context {
    constructor(opts = {}, components = {}) {
        super({...opts, id: 'remote_client'}, components);

        this.dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry);
        this.events.new('page_state');
        this.events.new('client_uid');
        this.events.resolve_and_add('table_count', 'DataTable.counts');

        const client_list_table = this.init_client_list_table();
        const client_list_cpanel = this.init_client_list_cpanel();
        const client_list_content = this.init_client_list_content(
            client_list_table,
            client_list_cpanel,
        );

        const client_page = this.init_client_page();

        this.page_wrapper = this.new_instance(DynamicWrapper, {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'content',
            set_active_event: this.events.get('page_state'),
            components: [client_list_content, client_page],
        });

        this.when(this.page_wrapper).done(() => {
            Observer.register_hash_listener('remote_client', this.handle_url.bind(this));
            this.dfd.resolve();
        });
    }

    init_client_list_table() {
        return {
            id: 'table',
            id_callback: this.events.register_alias('table_count'),
            component: DataTable,
            enable_selection: true,
            enable_column_toggle: true,
            enable_localstorage: true,
            results_per_page: 50,
            title: 'Remote Client Partners',
            css: {'table-light': true, 'table-sm': true},
            columns: [
                {
                    label: 'Remote Client Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'remote_client/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    label: '# Remote Funds',
                    key: 'nbr_of_remote_user_funds',
                    visible: true,
                },
                {
                    label: '# User Funds',
                    key: 'nbr_of_user_funds',
                    visible: true,
                },
                {
                    label: '# Remote Client Managers',
                    key: 'nbr_of_managers',
                    visible: true,
                },
                {
                    label: 'Cobalt Client',
                    key: 'cobalt_client_name',
                    visible: true,
                },
                {
                    label: 'Last Refreshed',
                    sort_key: 'last_update',
                    visible: true,
                    format: 'date_or_pending',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'commander:remote_client_partners',
                    string_filter: {
                        type: 'observer',
                        event_type: gen_event(
                            'StringFilter.value',
                            this.get_id(),
                            'page_wrapper',
                            'content',
                            'cpanel',
                            'string_filter',
                        ),
                    },
                    filter_empty: {
                        type: 'observer',
                        event_type: gen_event(
                            'BooleanButton.state',
                            this.get_id(),
                            'page_wrapper',
                            'content',
                            'cpanel',
                            'filter_empty',
                        ),
                    },
                },
            },
        };
    }

    init_client_list_cpanel() {
        return {
            id: 'cpanel',
            component: Aside,
            template: 'tpl_aside_control_panel',
            layout: {
                body: ['string_filter', 'meta', 'filter_empty'],
            },
            components: [
                {
                    id: 'meta',
                    component: MetaInfo,
                    label: 'Remote Clients',
                    format: 'visible_count',
                    css: {
                        'meta-primary': true,
                        'match-btn-sm': true,
                    },
                    datasource: {
                        type: 'observer',
                        event_type: this.events.table_count,
                    },
                },
                {
                    id: 'string_filter',
                    component: StringFilter,
                    placeholder: 'Search...',
                    enable_localstorage: true,
                },
                {
                    id: 'filter_empty',
                    component: BooleanButton,
                    default_state: false,
                    label: 'Hide Empty',
                    template: 'tpl_boolean_button',
                    btn_css: {
                        'btn-primary': true,
                        'btn-sm': true,
                        'btn-block': true,
                    },
                },
            ],
        };
    }

    init_client_page() {
        return {
            id: 'client_page',
            component: ShowRemotePartner,
            partner_event: this.events.get('client_uid'),
        };
    }

    init_client_list_content(client_list_table, client_list_cpanel) {
        const list_remote_partners_header = {
            id: 'list_remote_partners_header',
            component: Header,
            title: 'Remote Client Partners',
            data_table_id: gen_id(
                this.get_id(),
                'page_wrapper',
                'content',
                'list_remote_partners',
                'table',
            ),
        };

        const list_remote_partners = {
            component: Aside,
            id: 'list_remote_partners',
            title: 'Hello',
            template: 'tpl_aside_main_content',
            layout: {
                body: ['list_remote_partners_header', 'table'],
            },
            components: [client_list_table, list_remote_partners_header],
        };

        return {
            id: 'content',
            component: Aside,
            template: 'tpl_aside_body',
            layout: {
                body: ['cpanel', 'list_remote_partners'],
            },
            components: [client_list_cpanel, list_remote_partners],
        };
    }

    handle_url(url) {
        if (url.length == 1) {
            Observer.broadcast(this.events.get('page_state'), 'content');
            Observer.broadcast(this.events.get('client_uid'), undefined);
        } else if (url.length == 2) {
            Observer.broadcast(this.events.get('page_state'), 'client_page');
            Observer.broadcast(this.events.get('client_uid'), url[1]);
        }
    }
}

export default RemoteClientVM;
