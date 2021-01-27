/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import DataTable from 'src/libs/components/basic/DataTable';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import StringFilter from 'src/libs/components/basic/StringFilter';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Aside from 'src/libs/components/basic/Aside';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = 'tpl_page_wrapper';

    self.events = {
        states: {
            search: Utils.gen_event(self.get_id(), 'search'),
        },
        clear_search: Utils.gen_event(
            'EventButton',
            self.get_id(),
            'search_actions',
            'tabs_and_search',
            'action_search',
            'search_cpanel',
            'clear',
        ),
        search_filter: Utils.gen_event(
            'StringFilter.value',
            self.get_id(),
            'search_actions',
            'tabs_and_search',
            'action_search',
            'search_cpanel',
            'filter',
        ),
        diligence_only_event: Utils.gen_event(
            'BooleanButton.value',
            self.get_id(),
            'search_actions',
            'tabs_and_search',
            'action_search',
            'search_cpanel',
            'diligence_only',
        ),
        created: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'search_actions',
            'tabs_and_search',
            'action_search',
            'search_cpanel',
            'created',
        ),
    };

    const table_filters = {
        type: 'dynamic',
        query: {
            string_filter: {
                type: 'observer',
                event_type: self.events.search_filter,
                default: '',
            },
            diligence_only: {
                type: 'observer',
                event_type: self.events.diligence_only_event,
                default: false,
            },
            created: {
                type: 'observer',
                event_type: self.events.created,
                default: {},
            },
        },
    };

    self.filter = {
        id: 'filter',
        component: StringFilter,
        placeholder: 'Filter...',
        clear_event: self.events.clear_search,
        enable_localstorage: true,
        data: '',
    };

    self.diligence_only = {
        id: 'diligence_only',
        component: BooleanButton,
        label: 'Diligence Activity Only',
        reset_event: self.events.clear_search,
        template: 'tpl_cpanel_boolean_button',
        btn_css: {'cpanel-btn-sm': true},
        default_state: false,
    };

    self.date_input = {
        id: 'created',
        component: NewPopoverButton,
        label: 'Date Range',
        clear_event: self.events.clear_search,
        css: {
            'btn-sm': true,
            'btn-cpanel-primary': true,
            'btn-block': true,
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

    self.summary_content = {
        id: 'summary_content',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Actions',
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
                key: 'clients',
                label: '# of Clients',
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
            {
                label: '% of Clients',
                key: 'percent_of_clients',
                format: 'percent',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:action_summary',
                activity_percentages: true,
                filters: table_filters,
            },
        },
    };

    self.summary_content_wrapper = {
        id: 'summary_content_wrapper',
        component: Aside,
        template: 'tpl_aside_main_content',
        layout: {
            body: ['summary_content'],
        },
        components: [self.summary_content],
    };

    self.overview_chart = {
        id: 'overview_chart',
        component: TimeseriesChart,
        title: 'Activity',
        min: 0,
        colors: [
            '#4D4D4D',
            '#6D83A3',
            '#3A66C3',
            '#3AC376',
            '#C36161',
            '#8547D4',
            '#F95532',
            '#C33A3A',
            '#61C38C',
            '#6180C3',
            '#F97559',
        ],
        series: [
            {
                key: 'portfolio',
                name: 'Portfolio Activity',
                type: 'line',
            },
            {
                key: 'user_fund',
                name: 'Fund Activity',
                type: 'line',
            },
            {
                key: 'cashflow',
                name: 'Cashflow Activity',
                type: 'line',
            },
            {
                key: 'company',
                name: 'Company Activity',
                type: 'line',
            },
        ],
        format: 'number',
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:action_activity_count',
                filters: table_filters,
            },
        },
    };

    self.cpanel_components = [self.filter, self.diligence_only, self.date_input, self.clear];

    self.search_cpanel = {
        id: 'search_cpanel',
        component: Aside,
        template: 'tpl_aside_control_panel',
        layout: {
            body: ['filter', 'diligence_only', 'created', 'clear'],
        },
        components: self.cpanel_components,
    };

    self.search_tabs = {
        id: 'search_tabs',
        default_state: 'search_content_wrapper',
        component: RadioButtons,
        template: 'tpl_radio_buttons_tabs',
        button_css: {
            'btn-block': true,
            //'btn-transparent':true
        },
        buttons: [
            {
                label: 'Search',
                state: 'search_content_wrapper',
                icon: {'icon-list-alt': true},
            },
            {
                label: 'Summary',
                state: 'summary_content_wrapper',
                icon: {'icon-list-alt': true},
            },
            {
                label: 'Per Client',
                state: 'per_client_content_wrapper',
                icon: {'icon-list-alt': true},
            },
        ],
    };

    self.search_content = {
        id: 'search_content',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Activity',
        enable_csv_export: true,
        enable_clear_order: true,
        columns: [
            {
                label: 'Email',
                sort_key: 'email',
                format: 'contextual_link',
                format_args: {
                    url: 'action-activity/user/<user:uid>',
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
                    url: 'action-activity/client/<client:uid>',
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
                results_per_page: 50,
                filters: table_filters,
            },
        },
    };

    self.search_content_wrapper = {
        id: 'search_content_wrapper',
        component: Aside,
        template: 'tpl_aside_main_content',
        layout: {
            body: ['search_content'],
        },
        components: [self.search_content],
    };

    let actions_to_columns = () => {
        let actions = {
            activation: 'Activation',
            update_entity: 'Update Entity',
            delete_entity: 'Delete Entity',
            create_entity: 'Create Entity',
            upload_cashflow: 'Upload Cashflow',
            upload_index: 'Upload Index',
            view_analytics_entity: 'Viewed Analytics Entity',
            //'create_visual_report': 'Created Visual Report',
            generate_data_report: 'Generated Data Report',
            download_data_report: 'Downloaded Data Report',
            view_market_data_lists: 'Browsed Lists',
            view_market_data_firms: 'Browsed Firms',
            view_market_data_historic_funds: 'Browsed Historic Funds',
            view_market_data_benchmark: 'Browsed Benchmarks',
            view_market_data_funds_in_market: 'Browsed Funds in Market',
            view_market_data_investors: 'Browsed Investors',
            view_market_data_investments: 'Browsed Investments',
            view_visual_reports: 'Browsed Visual Reports',
            view_visual_report: 'Viewed Visual Report',
            edit_visual_report: 'Edited Visual Report',
            publish_visual_report: 'Publish Visual Report',
            view_lp_scoring: 'Browsed LP Scoring',
            view_diligence_families: 'Diligence - Browsed Families',
            view_diligence_projects: 'Diligence - Browsed Projects',
        };

        let cols = [];
        for (let i = 0, j = Object.keys(actions).length; i < j; i++) {
            cols.push({
                label: Object.values(actions)[i],
                key: Object.keys(actions)[i],
                format: 'percent',
            });
            /*cols.push({
                    label: Object.values(actions)[i],
                    key: Object.keys(actions)[i]
                })*/
        }

        return cols;
    };

    self.per_client_content = {
        id: 'per_client_content',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_with_label',
        label: 'Activity',
        disable_sorting: true,
        columns: [
            {
                sort_key: 'client',
                label: 'Client',
                format: 'contextual_link',
                format_args: {
                    url: 'action-activity/client/<client_uid>',
                    label_key: 'client',
                },
            },
        ].concat(actions_to_columns()),
        datasource: {
            type: 'dynamic',
            query: {
                target: 'commander:client_actions',
                results_per_page: 50,
                filters: table_filters,
            },
        },
    };

    self.per_client_content_wrapper = {
        id: 'per_client_content_wrapper',
        component: Aside,
        template: 'tpl_aside_main_content',
        layout: {
            body: ['per_client_content'],
        },
        components: [self.per_client_content],
    };

    self.search_wrapper = {
        id: 'search_wrapper',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        active_component: 'search_content_wrapper',
        set_active_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'search_actions',
            'tabs_and_search',
            'search_tabs',
        ),
        components: [
            self.search_content_wrapper,
            self.summary_content_wrapper,
            self.per_client_content_wrapper,
        ],
    };

    self.search_body = {
        id: 'action_search',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['search_cpanel', 'search_wrapper'],
        },
        components: [self.search_cpanel, self.search_wrapper],
    };

    self.search_and_tabs = {
        id: 'tabs_and_search',
        component: Aside,
        template: 'tpl_aside_horizontal_split',
        disable_seperator: true,
        css: {
            'commander-padding-less': true,
        },
        layout: {
            top: 'search_tabs',
            bottom: 'action_search',
        },
        components: [self.search_tabs, self.search_body],
    };

    self.action_overview = {
        id: 'action_overview',
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['overview_chart'],
        },
        components: [self.overview_chart],
    };

    self.page_wrapper = self.new_instance(Aside, {
        id: 'search_actions',
        component: Aside,
        template: 'tpl_aside_horizontal_split',
        css: {
            'commander-padding-less': true,
        },
        layout: {
            top: 'action_overview',
            bottom: 'tabs_and_search',
        },
        components: [self.action_overview, self.search_and_tabs],
    });

    self.when(self.page_wrapper).done(() => {
        self.dfd.resolve();
    });

    return self;
}
