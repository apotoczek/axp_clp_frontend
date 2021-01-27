/* Automatically transformed from AMD to ES6. Beware of code smell. */
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Aside from 'src/libs/components/basic/Aside';
import Header from 'src/libs/components/commander/Header';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataTable from 'src/libs/components/basic/DataTable';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';

export default function() {
    let self = new Context({
        id: 'sign_ins',
    });

    self.dfd = self.new_deferred();

    self.ids = {
        search_sign_in_attempts: {
            table: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_sign_in_attempts',
                'search_body',
                'search_table',
            ),
            clear: Utils.gen_id(
                self.get_id(),
                'page_wrapper',
                'search_sign_in_attempts',
                'search_cpanel',
                'clear',
            ),
        },
    };

    self.events = {
        page_state: Utils.gen_event(self.get_id(), 'SignIns.state'),
        search_sign_in_attempts: {
            data_table_counts: Utils.gen_event(
                'DataTable.counts',
                self.ids.search_sign_in_attempts.table,
            ),
            clear: Utils.gen_event('EventButton', self.ids.search_sign_in_attempts.clear),
        },
    };

    self.search_table = {
        id: 'search_table',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        enable_selection: true,
        enable_column_toggle: true,
        enable_localstorage: true,
        enable_clear_order: true,
        enable_csv_export: true,
        results_per_page: 50,
        columns: [
            {
                label: 'Email',
                sort_key: 'email',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<user_uid>',
                    label_key: 'email',
                },
            },
            {
                label: 'Success',
                key: 'success',
                format: 'boolean_highlight',
                format_args: {
                    css: {
                        yes: 'text-green',
                    },
                },
            },
            {
                label: 'Description',
                key: 'description',
            },
            {
                label: 'IP',
                key: 'ip_address',
            },
            {
                label: 'Date',
                key: 'created',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:sign_in_attempts',
                results_per_page: 50,
                filters: {
                    type: 'dynamic',
                    query: {
                        string_filter: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'StringFilter.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_sign_in_attempts',
                                'search_cpanel',
                                'string_filter',
                            ),
                        },
                        created: {
                            type: 'observer',
                            event_type: Utils.gen_event(
                                'PopoverButton.value',
                                self.get_id(),
                                'page_wrapper',
                                'search_sign_in_attempts',
                                'search_cpanel',
                                'created',
                            ),
                        },
                    },
                },
            },
        },
    };

    self.search_header = {
        id: 'search_header',
        component: Header,
        buttons: [],
        data_table_id: self.ids.search_sign_in_attempts.table,
    };

    self.search_body = {
        component: Aside,
        id: 'search_body',
        template: 'tpl_aside_main_content',
        layout: {
            body: ['search_header', 'search_table'],
        },
        components: [self.search_header, self.search_table],
    };

    self.search_cpanel = {
        component: Aside,
        id: 'search_cpanel',
        template: 'tpl_aside_control_panel',
        layout: {
            body: ['string_filter', 'meta', 'filter_label', 'created', 'clear'],
        },
        components: [
            {
                id: 'string_filter',
                component: StringFilter,
                clear_event: self.events.search_sign_in_attempts.clear,
                placeholder: 'Search...',
            },
            {
                id: 'filter_label',
                html: '<h3>Filters</h3>',
                component: HTMLContent,
            },
            {
                id: 'meta',
                component: MetaInfo,
                label: 'Attempts',
                format: 'visible_count',
                css: {
                    'meta-primary': true,
                    'match-btn-sm': true,
                },
                datasource: {
                    type: 'observer',
                    event_type: self.events.search_sign_in_attempts.data_table_counts,
                },
            },
            {
                id: 'created',
                component: NewPopoverButton,
                label: 'Date Range',
                clear_event: self.events.search_sign_in_attempts.clear,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                enable_localstorage: true,
                popover_options: {
                    css_class: 'popover-default',
                    placement: 'right',
                    title: 'Date Range',
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
                id: 'clear',
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Restore Defaults',
            },
        ],
    };

    self.search_sign_in_attempts = {
        component: Aside,
        id: 'search_sign_in_attempts',
        template: 'tpl_aside_body',
        layout: {
            body: ['search_cpanel', 'search_body'],
        },
        components: [self.search_body, self.search_cpanel],
    };

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_sign_in_attempts',
            set_active_event: self.events.page_state,
            components: [self.search_sign_in_attempts],
        },
        self.shared_components,
    );

    self.handle_url = function(url) {
        if (url.length === 1) {
            Observer.broadcast(self.events.page_state, 'search_sign_in_attempts');
        }
    };

    self.when(self.page_wrapper).done(() => {
        Observer.register_hash_listener('sign-ins', self.handle_url);

        self.dfd.resolve();
    });

    return self;
}
