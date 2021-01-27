import ko from 'knockout';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionButton from 'src/libs/components/basic/ActionButton';
import DiligenceDataTable from 'src/libs/components/market_insights/DiligenceDataTable';
import EventButton from 'src/libs/components/basic/EventButton';
import AddToListButton from 'src/libs/components/AddToListButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Label from 'src/libs/components/basic/Label';
import Observer from 'src/libs/Observer';
import MetaInfo from 'src/libs/components/MetaInfo';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import Checklist from 'src/libs/components/basic/Checklist';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import Radiolist from 'src/libs/components/basic/Radiolist';
import StringFilter from 'src/libs/components/basic/StringFilter';
import auth from 'auth';

class FamilySearch extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        const dfd = this.new_deferred();
        this.define_default_template(`
            <!-- ko renderComponent: page --><!-- /ko -->
        `);
        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('string_filter', 'StringFilter.value');
        this.events.resolve_and_add('clear', 'EventButton');
        this.events.resolve_and_add('download', 'ActionButton.action.download', 'download');
        this.events.resolve_and_add('view_details', 'EventButton');
        this.events.resolve_and_add('status', 'PopoverButton.value');
        this.events.resolve_and_add('avg_quartile', 'PopoverButton.value');
        this.events.resolve_and_add('locations', 'PopoverButton.value');
        this.events.resolve_and_add('has_performance', 'BooleanButton.state');
        this.events.resolve_and_add('has_cashflows', 'PopoverButton.value');
        this.events.resolve_and_add('compact_columns', 'BooleanButton.state');
        this.events.resolve_and_add('enum_attributes', 'AttributeFilters.state');

        let available_datasets = [
            ...(auth.user_has_feature('hl_dataset')
                ? [
                      {
                          label: 'Hamilton Lane',
                          value: Constants.datasets.hl,
                      },
                  ]
                : []),
            ...(auth.user_has_feature('cobalt_dataset')
                ? [
                      {
                          label: 'Cobalt',
                          value: Constants.datasets.cobalt,
                      },
                  ]
                : []),
            ...(auth.user_has_feature('pitchbook_dataset')
                ? [
                      {
                          label: 'PitchBook',
                          value: Constants.datasets.pb,
                      },
                  ]
                : []),
        ];

        this.events.resolve_and_add('dataset', 'PopoverButton.value');

        this.active_dataset = Observer.observable(
            this.events.get('dataset'),
            undefined,
            dataset => dataset && dataset.value,
        );

        let search_table = {
            id: 'search_table',
            enable_selection: true,
            component: DiligenceDataTable,
            css: {'table-light': true, 'table-sm': true},
            view_details_event: this.events.get('view_details'),
            download_attachment: this.events.get('download'),
            broadcast_page_change: true,
            broadcast_order_change: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            compact_columns_event: this.events.get('compact_columns'),
            clear_order_event: this.events.get('clear'),
            dropdown_data_list: 'funds',
            results_per_page: 50,
            columns: [
                {
                    type: 'component',
                    width: '0px',
                    component_callback: 'data',
                    label: '',
                    component: {
                        id: 'view_details',
                        id_callback: this.events.register_alias('view_details'),
                        component: EventButton,
                        template: 'tpl_cpanel_button',
                        css: {
                            'btn-xs': true,
                            'btn-ghost-default': true,
                            'btn-block': false,
                        },
                        label:
                            '<a data-toggle="collapse" data-target="#view-details"><span class="glyphicon glyphicon-menu-down"></span></a>',
                    },
                },
                {
                    label: 'Fund Family Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        url: 'families/<uid>',
                        label_key: 'name',
                    },
                },
                {
                    type: 'component',
                    width: '0px',
                    component_callback: 'data',
                    component: {
                        id: 'download',
                        id_callback: this.events.register_alias('download'),
                        hidden_callback: data => {
                            return data ? !data.document_uid : true;
                        },
                        component: ActionButton,
                        action: 'download',
                        label: '<span class="glyphicon glyphicon-file"></span>',
                        css: {
                            'btn-ghost-default': true,
                            'btn-xs': true,
                            'btn-block': false,
                        },
                    },
                },
                {
                    label: '',
                    format: 'contextual_link',
                    component_callback: 'data',
                    format_args: {
                        url: 'families/<uid>/net/analytics',
                        label: 'Net',
                        cssClass: 'btn btn-xs btn-ghost-default',
                        visible_toggle_property: 'has_net_cashflows',
                    },
                },
                {
                    label: '',
                    format: 'contextual_link',
                    component_callback: 'data',
                    format_args: {
                        url: 'families/<uid>/gross/analytics',
                        label: 'Gross',
                        cssClass: 'btn btn-xs btn-ghost-default',
                        visible_toggle_property: 'has_gross_cashflows',
                    },
                },
                {
                    label: 'Status',
                    sort_key: 'status',
                    first_sort: 'desc',
                    type: 'string',
                    key: 'status',
                },
                {
                    label: 'Fund Size',
                    sort_key: 'target_size',
                    first_sort: 'desc',
                    format: 'money',
                    format_args: {
                        currency_key: 'family_size_currency',
                        value_key: 'target_size',
                    },
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: '# of Funds',
                    sort_key: 'fund_count',
                    format: 'numeric',
                    key: 'fund_count',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: '# w/ Perf.',
                    sort_key: 'fund_with_performance_count',
                    first_sort: 'desc',
                    format: 'numeric',
                    key: 'fund_with_performance_count',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'Total Gross Invested',
                    sort_key: 'total_gross_invested',
                    first_sort: 'desc',
                    format: 'money',
                    format_args: {
                        currency_key: 'family_size_currency',
                        value_key: 'total_gross_invested',
                    },
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Total Gross Realized',
                    sort_key: 'total_gross_realized',
                    first_sort: 'desc',
                    format: 'money',
                    format_args: {
                        currency_key: 'family_size_currency',
                        value_key: 'total_gross_realized',
                    },
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Total Gross Unrealized',
                    sort_key: 'total_gross_unrealized',
                    first_sort: 'desc',
                    format: 'money',
                    format_args: {
                        currency_key: 'family_size_currency',
                        value_key: 'total_gross_unrealized',
                    },
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Avg. Gross Multiple',
                    sort_key: 'avg_gross_multiple',
                    first_sort: 'desc',
                    format: 'multiple',
                    key: 'avg_gross_multiple',
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Avg. Gross IRR',
                    sort_key: 'avg_gross_irr',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'irr',
                    key: 'avg_gross_irr',
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Avg. Net IRR',
                    sort_key: 'avg_irr',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'irr',
                    key: 'avg_irr',
                    component_callback: 'data',
                },
                {
                    label: 'Avg. Quartile',
                    sort_key: 'avg_irr_quartile',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'number',
                    key: 'avg_irr_quartile',
                    component_callback: 'data',
                },
                {
                    label: 'Avg. TVPI',
                    sort_key: 'avg_tvpi',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'multiple',
                    key: 'avg_tvpi',
                    component_callback: 'data',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'Avg. DPI',
                    sort_key: 'avg_dpi',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'multiple',
                    key: 'avg_dpi',
                    component_callback: 'data',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'Avg. PME Alpha',
                    sort_key: 'avg_bison_pme_alpha',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'percent',
                    key: 'avg_bison_pme_alpha',
                    component_callback: 'data',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'First Close',
                    sort_key: 'first_close',
                    first_sort: 'desc',
                    format: 'backend_date',
                    key: 'first_close',
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Final Close',
                    sort_key: 'final_close',
                    first_sort: 'desc',
                    format: 'backend_date',
                    key: 'final_close',
                    component_callback: 'data',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Geography',
                    sort_key: 'family_geography',
                    first_sort: 'desc',
                    type: 'string',
                    key: 'family_geography',
                    visible: false,
                },
                {
                    label: 'Style / Focus',
                    sort_key: 'family_style_focus',
                    first_sort: 'desc',
                    type: 'string',
                    key: 'family_style_focus',
                    visible: false,
                },
                {
                    label: 'Modified',
                    sort_key: 'last_manual_edit',
                    first_sort: 'desc',
                    format: 'backend_date',
                    key: 'last_manual_edit',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
            ],
            dropdown_columns: [
                {
                    label: 'Name',
                    key: 'name',
                    url: '#!/fund-in-family/',
                },
                {
                    label: 'Vintage Year',
                    key: 'vintage_year',
                },
                {
                    label: 'Fund Size',
                    format: 'money',
                    key: 'target_size_value',
                    format_args: {
                        currency_key: 'target_size_currency',
                    },
                },
                {
                    label: 'Geography',
                    key: 'geography',
                },
                {
                    label: 'Style',
                    key: 'style',
                },
                {
                    label: 'Sector',
                    key: 'sector',
                },
                {
                    label: 'Gross Invested',
                    key: 'gross_invested',
                    format: 'money',
                    format_args: {
                        currency_key: 'target_size_currency',
                    },
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Gross Realized',
                    key: 'gross_realized',
                    format: 'money',
                    format_args: {
                        currency_key: 'target_size_currency',
                    },
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Gross Unrealized',
                    key: 'gross_unrealized',
                    format: 'money',
                    format_args: {
                        currency_key: 'target_size_currency',
                    },
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Gross Multiple',
                    key: 'gross_multiple',
                    format: 'multiple',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Gross IRR',
                    key: 'gross_irr',
                    format: 'percent',
                    visible: ko.pureComputed(() => this.active_dataset() === Constants.datasets.hl),
                },
                {
                    label: 'Net IRR',
                    key: 'irr',
                    format: 'percent',
                },
                {
                    label: 'Quartile',
                    key: 'irr_quartile',
                    format: 'integer',
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    format: 'multiple',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'TVPI',
                    key: 'tvpi',
                    format: 'multiple',
                    visible: ko.pureComputed(
                        () => this.active_dataset() === Constants.datasets.cobalt,
                    ),
                },
                {
                    label: 'As of Date',
                    key: 'as_of_date',
                    format: 'backend_date',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'market_data:families',
                    results_per_page: 50,
                    filters: {
                        type: 'dynamic',
                        query: {
                            name: {
                                type: 'observer',
                                event_type: this.events.get('string_filter'),
                                default: '',
                            },
                            enums: {
                                type: 'observer',
                                event_type: this.events.get('enum_attributes'),
                            },
                            status: {
                                type: 'observer',
                                event_type: this.events.get('status'),
                                default: [],
                            },
                            avg_quartile: {
                                type: 'observer',
                                event_type: this.events.get('avg_quartile'),
                                default: [],
                            },
                            has_performance: {
                                type: 'observer',
                                event_type: this.events.get('has_performance'),
                                default: false,
                            },
                            has_cashflows: {
                                type: 'observer',
                                event_type: this.events.get('has_cashflows'),
                                mapping: 'get_values',
                                default: [],
                            },
                            locations: {
                                type: 'observer',
                                event_type: this.events.get('locations'),
                                default: false,
                            },
                            ...(available_datasets.length > 1 && {
                                dataset: {
                                    type: 'observer',
                                    event_type: this.events.get('dataset'),
                                    mapping: 'get_value',
                                },
                            }),
                        },
                    },
                    order_by: [{name: 'sort_score', sort: 'desc'}],
                },
            },
        };

        let cpanel_components = [
            {
                id: 'search_label',
                component: Label,
                css: {'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Search',
            },
            {
                id: 'string_filter',
                component: StringFilter,
                template: 'tpl_string_filter',
                cpanel_style: true,
                enable_localstorage: true,
                id_callback: this.events.register_alias('string_filter'),
                placeholder: 'Name...',
                set_state_event_type: 'StateHandler.load',
                clear_event: this.events.get('clear'),
            },
            {
                id: 'compact_columns',
                component: BooleanButton,
                label: 'Compact Columns',
                id_callback: this.events.register_alias('compact_columns'),
                reset_event: this.events.get('clear'),
                template: 'tpl_cpanel_boolean_button',
                btn_css: {'cpanel-btn-sm': true},
                default_state: true,
            },
            {
                id: 'meta_info',
                component: MetaInfo,
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.count',
                        this.get_id(),
                        'page',
                        'search_body',
                        'search_table',
                    ),
                },
            },
            {
                id: 'filter_by_latest_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filter by latest fund',
            },
            {
                id: 'filter_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Filter by family',
            },
            {
                id: 'has_performance',
                component: BooleanButton,
                label: 'Has Performance',
                id_callback: this.events.register_alias('has_performance'),
                reset_event: this.events.get('clear'),
                template: 'tpl_cpanel_boolean_button',
                btn_css: {'cpanel-btn-sm': true},
                default_state: false,
            },
            {
                component: NewPopoverButton,
                id: 'has_cashflows',
                id_callback: this.events.register_alias('has_cashflows'),
                label: 'Has Cashflows',
                label_track_selection: false,
                icon_css: 'glyphicon glyphicon-plus',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Has Cashflows',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'static',
                        data: [
                            {
                                label: 'Net Cashflows',
                                value: 'net',
                            },
                            {
                                label: 'Gross Cashflows',
                                value: 'gross',
                            },
                        ],
                    },
                },
            },
            {
                id: 'enum_attributes',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
                enable_localstorage: true,

                id_callback: this.events.register_alias('enum_attributes'),
                clear_event: self.clear_event,
                component: AttributeFilters,
                set_state_event_type: 'StateHandler.load',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                        exclude_enums: ['vertical', 'status'],
                    },
                },
            },
            {
                id: 'status',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                clear_event: this.events.get('clear'),
                label: 'Status',
                enable_localstorage: true,
                id_callback: this.events.register_alias('status'),
                set_state_event_type: 'StateHandler.load',
                popover_options: {
                    title: 'Status',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'enums',
                            enum_type: 'status',
                        },
                    },
                    selected_datasource: {
                        type: 'dynamic',
                        mapping: data => {
                            return data.filter(obj =>
                                ['First Close', 'Fundraising'].includes(obj.label),
                            );
                        },
                        query: {
                            target: 'enums',
                            enum_type: 'status',
                        },
                    },
                },
            },
            {
                id: 'locations',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.events.get('clear'),
                label: 'Primary Location',
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
                id_callback: this.events.register_alias('locations'),
                popover_config: {
                    component: PopoverLocationSearch,
                },
            },
            {
                id: 'avg_quartile',
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Average Quartile',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.events.get('clear'),
                label: 'Average Quartile',
                enable_localstorage: true,
                id_callback: this.events.register_alias('avg_quartile'),
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverInputRange,
                    mode: 'number',
                    min: {
                        placeholder: 'Min Average Quartile',
                    },
                    max: {
                        placeholder: 'Max Average Quartile',
                    },
                },
            },
            {
                id: 'clear',
                component: EventButton,
                id_callback: this.events.register_alias('clear'),
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            },
            ...(available_datasets.length > 1
                ? [
                      {
                          component: NewPopoverButton,
                          id: 'datasets',
                          id_callback: this.events.register_alias('dataset'),
                          label: 'Dataset',
                          label_track_selection: true,
                          css: {
                              'btn-block': true,
                              'btn-cpanel-primary': true,
                              'btn-sm': true,
                          },
                          popover_options: {
                              title: 'Select Dataset',
                              placement: 'right',
                              css_class: 'popover-cpanel',
                          },
                          popover_config: {
                              component: Radiolist,
                              default_selected_value: Constants.datasets.hl,
                              datasource: {
                                  type: 'static',
                                  data: available_datasets,
                              },
                          },
                      },
                  ]
                : []),
        ];

        self.breadcrumb = {
            id: 'breadcrumb',
            component: Breadcrumb,
            items: [
                {
                    label: 'Families',
                    link: '#!/families',
                },
                {
                    label: 'Search',
                },
            ],
        };

        self.header = {
            id: 'header',
            component: BreadcrumbHeader,
            template: 'tpl_breadcrumb_header',
            buttons: [],
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [self.breadcrumb],
        };

        self.action_toolbar = {
            id: 'action_toolbar',
            component: ActionHeader,
            template: 'tpl_action_toolbar',
            disable_export: true,
            buttons: [
                {
                    id: 'list',
                    component: AddToListButton,
                    label: 'Add To List <span class="glyphicon glyphicon-plus"></span>',
                    entity_type: 'family',
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'DataTable.selected',
                            this.get_id(),
                            'page',
                            'search_body',
                            'search_table',
                        ),
                        default: [],
                    },
                },
            ],
        };

        let search_cpanel = {
            id: 'search_cpanel',
            template: 'tpl_cpanel',
            component: Aside,
            layout: {
                body: [
                    'search_label',
                    'string_filter',
                    'compact_columns',
                    'meta_info',
                    'filter_by_latest_label',
                    'status',
                    'enum_attributes',
                    'locations',
                    'filter_label',
                    'has_performance',
                    'has_cashflows',
                    'avg_quartile',
                    ...(available_datasets.length > 1 ? ['datasets'] : []),
                    'clear',
                ],
            },
            components: cpanel_components,
        };

        let search_body = {
            id: 'search_body',
            component: Aside,
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'search_table',
            },
            components: [self.header, self.action_toolbar, search_table],
        };

        this.page = this.new_instance(Aside, {
            id: 'page',
            template: 'tpl_aside_body',
            layout: {
                body: ['search_cpanel', 'search_body'],
            },
            components: [search_body, search_cpanel],
        });

        this.when(this.page).done(() => {
            dfd.resolve();
        });
    }
}
export default FamilySearch;
