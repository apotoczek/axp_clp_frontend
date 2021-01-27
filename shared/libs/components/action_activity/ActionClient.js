/* Automatically transformed from AMD to ES6. Beware of code smell. */
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import StringFilter from 'src/libs/components/basic/StringFilter';
import DataTable from 'src/libs/components/basic/DataTable';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import Aside from 'src/libs/components/basic/Aside';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.define_template(`
            <!-- ko renderComponent: cpanel --><!-- /ko -->
            <div class="aside aside-content">
                <!-- ko renderComponent: tabs --><!-- /ko -->
                <!-- ko renderComponent: tables --><!-- /ko -->
            </div>
        `);

    self.client_uid_event = opts.client_uid_event;

    self.clear_event = Utils.gen_event('EventButton', self.get_id(), 'search_cpanel', 'clear');
    self.filter_event = Utils.gen_event(
        'StringFilter.value',
        self.get_id(),
        'search_cpanel',
        'filter',
    );
    self.created_event = Utils.gen_event(
        'PopoverButton.value',
        self.get_id(),
        'search_cpanel',
        'created',
    );

    self.tabs = self.new_instance(RadioButtons, {
        id: 'tabs',
        default_state: 'action_search',
        component: RadioButtons,
        template: 'tpl_radio_buttons_tabs',
        css_style: {'counter-margins': true},
        button_css: {
            'btn-block': true,
        },
        buttons: [
            {
                label: 'Actions',
                state: 'action_table',
                icon: {'icon-list-alt': true},
            },
            {
                label: 'Summary',
                state: 'summary_table',
                icon: {'icon-list-alt': true},
            },
        ],
    });

    self.table_filters = {
        type: 'dynamic',
        query: {
            client_uid: {
                type: 'observer',
                event_type: self.client_uid_event,
                required: true,
            },
            string_filter: {
                type: 'observer',
                event_type: self.filter_event,
                default: '',
            },
            created: {
                type: 'observer',
                event_type: self.created_event,
                default: {},
            },
        },
    };

    self.action_table = {
        id: 'action_table',
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Actions',
        component: DataTable,
        enable_csv_export: true,
        enable_clear_order: true,
        columns: [
            {
                label: 'Email',
                sort_key: 'email',
                format: 'contextual_link',
                format_args: {
                    url: 'users/<user:uid>',
                    label_key: 'user:email',
                },
            },
            {
                sort_key: 'user_name',
                key: 'user:name',
                label: 'Name',
            },
            {
                sort_key: 'client_name',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'clients/<client:uid>',
                    label_key: 'client:name',
                },
            },
            {
                sort_key: 'action_type',
                key: 'action:action_type',
                label: 'Action',
                format: 'actions',
            },
            {
                sort_key: 'entity_type',
                key: 'action:entity_type',
                label: 'Entity',
                format: 'entity_type',
            },
            {
                sort_key: 'created',
                key: 'action:created',
                label: 'Date',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:action_activity',
                filters: self.table_filters,
            },
        },
    };

    self.summary_table = {
        id: 'summary_table',
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        component: DataTable,
        label: 'Summary',
        enable_csv_export: true,
        enable_clear_order: true,
        inline_data: true,
        columns: [
            {
                sort_key: 'action',
                key: 'action',
                label: 'Action',
                format: 'actions',
            },
            {
                key: 'total',
                label: '# of Occurrences',
                format: 'number',
            },
            {
                key: 'users',
                label: '# of Users',
                format: 'number',
            },
            {
                label: 'First',
                key: 'first',
                format: 'backend_date',
            },
            {
                label: 'Latest',
                key: 'last',
                format: 'backend_date',
            },
            {
                label: '% of Users',
                key: 'percent_of_users',
                format: 'percent',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:action_summary',
                activity_percentages: true,
                filters: self.table_filters,
            },
        },
    };

    self.tables = self.new_instance(DynamicWrapper, {
        id: 'action_user_tables',
        template: 'tpl_dynamic_wrapper',
        active_component: 'action_table',
        set_active_event: Utils.gen_event('RadioButtons.state', self.tabs.get_id()),
        components: [self.action_table, self.summary_table],
    });

    self.filter = {
        id: 'filter',
        component: StringFilter,
        placeholder: 'Filter...',
        clear_event: self.clear_event,
        enable_localstorage: true,
    };

    self.date_input = {
        id: 'created',
        component: NewPopoverButton,
        label: 'Date Range',
        clear_event: self.clear_event,
        css: {
            'btn-sm': true,
            'btn-primary': true,
        },
        popover_options: {
            placement: 'right',
            title: 'Date Range',
            css_class: 'popover-default',
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
    };

    self.clear = {
        id: 'clear',
        component: EventButton,
        print_id: true,
        template: 'tpl_cpanel_button',
        css: {'btn-sm': true, 'btn-default': true},
        label: 'Clear',
    };

    self.cpanel_components = [self.filter, self.date_input, self.clear];

    self.cpanel = self.new_instance(Aside, {
        id: 'search_cpanel',
        template: 'tpl_aside_control_panel',
        layout: {
            body: ['filter', 'created', 'clear'],
        },
        components: self.cpanel_components,
    });

    self.when(self.tables, self.tabs).done(() => {
        self.dfd.resolve();
    });

    return self;
}
