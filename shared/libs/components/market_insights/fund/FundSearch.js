import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import DataSource from 'src/libs/DataSource';
import DataTable from 'src/libs/components/basic/DataTable';
import DataThing from 'src/libs/DataThing';
import DrilldownChart from 'src/libs/components/charts/DrilldownChart';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import EventButton from 'src/libs/components/basic/EventButton';
import ExpandableVisualizations from 'src/libs/components/basic/ExpandableVisualizations';
import FundPerformance from 'src/libs/components/market_insights/FundPerformance';
import Label from 'src/libs/components/basic/Label';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';
import MetaInfo from 'src/libs/components/MetaInfo';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Notify from 'bison/utils/Notify';
import Observer from 'src/libs/Observer';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import AddToListButton from 'src/libs/components/AddToListButton';
import PopoverEntitySearch from 'src/libs/components/popovers/PopoverEntitySearch';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import PopoverRadioButton from 'src/libs/components/popovers/PopoverRadioButton';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import PopoverSaveSearches from 'src/libs/components/popovers/PopoverSaveSearches';
import PopoverSavedSearches from 'src/libs/components/popovers/PopoverSavedSearches';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Checklist from 'src/libs/components/basic/Checklist';
import StateHandler from 'src/libs/components/basic/StateHandler';
import StringFilter from 'src/libs/components/basic/StringFilter';
import TableToolbar from 'src/libs/components/basic/TableToolbar';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';
import auth from 'auth';
import config from 'config';
import ko from 'knockout';

class FundSearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.dfd = this.new_deferred();

        this.template = opts.template || 'tpl_market_insights_body';

        this.grouping_event = Utils.gen_event(
            'PopoverButton.value',
            this.get_id(),
            'descriptive_grouping',
        );
        this.chart_cpanel_grouping_reset_event = Utils.gen_event(
            'ChartCpanel.reset_descriptive_grouping',
            this.get_id(),
        );
        this.chart_state = ko.observable('drilldown_chart');

        this.visibility = {
            x_y_label: ko.computed(() => {
                return this.chart_state() == 'snapshot';
            }),

            metric_label: ko.computed(() => {
                return this.chart_state() == 'timeseries';
            }),
        };

        this.get_state_events = function(load_event) {
            if (load_event) {
                return [
                    Utils.gen_event(load_event, this.get_id(), 'location'),
                    Utils.gen_event(load_event, this.get_id(), 'fund_size'),
                    Utils.gen_event(load_event, this.get_id(), 'as_of_date'),
                    Utils.gen_event(load_event, this.get_id(), 'pme_alpha'),
                    Utils.gen_event(load_event, this.get_id(), 'irr'),
                    Utils.gen_event(load_event, this.get_id(), 'tvpi'),
                    Utils.gen_event(load_event, this.get_id(), 'vintage_year'),
                    Utils.gen_event(load_event, this.get_id(), 'lists'),
                    ...(this.available_datasets.length > 1
                        ? [Utils.gen_event(load_event, this.get_id(), 'datasets')]
                        : []),
                    Utils.gen_event(load_event, this.get_id(), 'enum_attributes'),
                    Utils.gen_event(load_event, this.get_id(), 'has_cashflows'),
                    Utils.gen_event(load_event, this.get_id(), 'has_performance'),
                    Utils.gen_event(load_event, this.get_id(), 'name'),
                ];
            }

            return [
                Utils.gen_event('PopoverButton.value', this.get_id(), 'location'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_size'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'as_of_date'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'pme_alpha'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'irr'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'tvpi'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'vintage_year'),
                Utils.gen_event('PopoverButton.value', this.get_id(), 'lists'),
                ...(this.available_datasets.length > 1
                    ? [Utils.gen_event('PopoverButton.value', this.get_id(), 'datasets')]
                    : []),
                Utils.gen_event('AttributeFilters.state', this.get_id(), 'enum_attributes'),
                Utils.gen_event('BooleanButton.state', this.get_id(), 'has_cashflows'),
                Utils.gen_event('BooleanButton.state', this.get_id(), 'has_performance'),
                Utils.gen_event('StringFilter.value', this.get_id(), 'name'),
            ];
        };

        this.clear_event = Utils.gen_event('EventButton', this.get_id(), 'clear_button');

        this.chart_metrics = [
            {
                value: 'irr',
                label: 'IRR',
                format: 'irr',
            },
            {
                value: 'multiple',
                label: 'TVPI',
                format: 'multiple',
            },
            {
                value: 'dpi',
                label: 'DPI',
                format: 'multiple',
            },
            {
                value: 'rvpi',
                label: 'RVPI',
                format: 'multiple',
            },
        ];

        this.axis_metrics = [
            {
                value: 'irr',
                label: 'IRR',
                format: 'irr',
            },
            {
                value: 'multiple',
                label: 'TVPI',
                format: 'multiple',
            },
            {
                value: 'dpi',
                label: 'DPI',
                format: 'multiple',
            },
            {
                value: 'rvpi',
                label: 'RVPI',
                format: 'multiple',
            },
            {
                value: 'picc',
                label: 'Paid In %',
                format: 'percent',
            },
            {
                value: 'bison_pme_alpha',
                label: 'PME Alpha',
                format: 'percent',
            },
            {
                value: 'twrr_since_inception',
                label: 'TWRR Since Inception',
                format: 'percent',
            },
            {
                value: 'twrr_1_year',
                label: 'TWRR 1 Year',
                format: 'percent',
            },
            {
                value: 'twrr_3_year',
                label: 'TWRR 3 Year',
                format: 'percent',
            },
            {
                value: 'momentum_1_year',
                label: 'Momentum 1 Year',
                format: 'percent',
            },
            {
                value: 'momentum_3_year',
                label: 'Momentum 3 Year',
                format: 'percent',
            },
            {
                value: 'target_size_usd',
                label: 'Target Size',
                format: 'money',
                format_args: {
                    render_currency: 'USD',
                },
            },
            {
                value: 'total_sold_usd',
                label: 'Amt Closed',
                format: 'money',
                format_args: {
                    render_currency: 'USD',
                },
            },
        ];

        this.available_datasets = [
            ...(auth.user_has_feature('cobalt_dataset')
                ? [
                      {
                          label: 'Cobalt',
                          value: Constants.datasets.cobalt,
                      },
                  ]
                : []),
            ...(auth.user_has_feature('hl_dataset')
                ? [
                      {
                          label: 'Hamilton Lane',
                          value: Constants.datasets.hl,
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

        this.query_params = function(args) {
            args = args || {};

            let force_has_performance = args.force_has_performance || false;

            let query_params = {
                name: {
                    type: 'observer',
                    event_type: Utils.gen_event('StringFilter.value', this.get_id(), 'name'),
                    default: '',
                },
                vintage_year: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        this.get_id(),
                        'vintage_year',
                    ),
                    default: [],
                },
                as_of_date: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'as_of_date'),
                    default: [],
                },
                fund_size: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'fund_size'),
                    default: [],
                },
                locations: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'location'),
                    default: [],
                },
                pme_alpha: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'pme_alpha'),
                    default: [],
                },
                irr: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'irr'),
                    default: [],
                },
                tvpi: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'tvpi'),
                    default: [],
                },
                lists: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'lists'),
                    default: [],
                },
                enums: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'AttributeFilters.state',
                        this.get_id(),
                        'enum_attributes',
                    ),
                    default: [],
                },
                has_cashflows: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'has_cashflows',
                    ),
                    default: false,
                },
                investor_uid: {
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'investor'),
                    mapping: 'get_values',
                    mapping_args: {
                        key: 'uid',
                    },
                    default: [],
                },
                only_historic_funds: true,
            };

            if (force_has_performance) {
                query_params['has_performance'] = true;
            } else {
                query_params['has_performance'] = {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'BooleanButton.state',
                        this.get_id(),
                        'has_performance',
                    ),
                    default: false,
                };
            }

            return query_params;
        };

        const dataset_query = Utils.conditional_element(
            {
                dataset: {
                    mapping: 'get_value',
                    type: 'observer',
                    event_type: Utils.gen_event('PopoverButton.value', this.get_id(), 'datasets'),
                    default: [],
                },
            },
            this.available_datasets.length > 1,
        );

        this.snapshot_datasource = {
            type: 'dynamic',
            key: 'results',
            get_data_timeout: 500,
            query: {
                target: 'market_data:funds',
                results_per_page: 20,
                filters: {
                    type: 'dynamic',
                    query: {
                        ...this.query_params({force_has_performance: true}),
                        ...dataset_query,
                    },
                },
            },
        };

        this.timeseries_datasource = {
            type: 'dynamic',
            get_data_timeout: 500,
            query: {
                target: 'market_data:fund:timeseries',
                results_per_page: 20,
                filters: {
                    type: 'dynamic',
                    query: {
                        ...this.query_params({force_has_performance: true}),
                        ...dataset_query,
                    },
                },
            },
        };

        this.benchmark_datasource = {
            type: 'dynamic',
            get_data_timeout: 500,
            query: {
                target: 'benchmark',
                include_items: false,
                filters: {
                    type: 'dynamic',
                    query: {
                        ...this.query_params({force_has_performance: true}),
                        ...dataset_query,
                    },
                },
            },
        };

        this.successful_delete_event = Utils.gen_event('SavedStates.delete_success', this.get_id());
        this.button_event = Utils.gen_event('add_to_list', this.get_id());
        this.register_export_id = Utils.gen_id(
            this.get_id(),
            'search_body',
            'content',
            'action_toolbar',
            'export_actions',
        );
        this.chart_cpanel_radio_reset_event = Utils.gen_event(
            'ChartCpanel.reset_nav',
            this.get_id(),
        );
        this.data_table_selected_event = Utils.gen_event(
            'DataTable.selected',
            this.get_id(),
            'search_body',
            'content',
            'body',
            'vehicles',
        );
        this.descriptive_grouping_event = Utils.gen_event(
            'PopoverRadioButton.state',
            this.get_id(),
            'descriptive_grouping',
        );
        this.results_per_page = 50;

        this.chart_block_visible_event = Utils.gen_event(
            'ChartBlock.visible',
            this.get_id(),
            'search_body',
            'content',
            'body',
            'chart_block_wrapper',
            'chart_block',
        );

        this.shared_components = {
            fund_performance: this.new_instance(FundPerformance, {
                id: 'fund_performance',
                benchmark_datasource: this.benchmark_datasource,
                snapshot_datasource: this.snapshot_datasource,
                timeseries_datasource: this.timeseries_datasource,
                datatable_page_event: Utils.gen_event(
                    'DataTable.page',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'vehicles',
                ),
                datatable_order_event: Utils.gen_event(
                    'DataTable.order',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'vehicles',
                ),
                metric_events: {
                    snapshot: {
                        y_axis: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'y_axis_options',
                        ),
                        x_axis: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'x_axis_options',
                        ),
                    },
                    timeseries: {
                        metric: Utils.gen_event(
                            'PopoverButton.value',
                            this.get_id(),
                            'metric_options',
                        ),
                    },
                },
                enable_compset: true,
                results_as_compset: true,
                select_chart: Utils.gen_event(
                    'RadioButtons.state',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'chart_block_wrapper',
                    'chart_block',
                    'chart_cpanel',
                    'view_toggle',
                ),
                list_compset_event: Utils.gen_event(
                    'TableToolbar.list_compset_event',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'table_toolbar',
                ),
                set_compset_event: Utils.gen_event(
                    'TableToolbar.set_compset_event',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'table_toolbar',
                ),
                clear_compset_event: Utils.gen_event(
                    'TableToolbar.clear_compset_event',
                    this.get_id(),
                    'search_body',
                    'content',
                    'body',
                    'table_toolbar',
                ),
            }),
            save_button: this.new_instance(NewPopoverButton, {
                id: 'save_button',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Save Search',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-save',
                label: 'Save',
                popover_config: {
                    id: 'save',
                    component: PopoverSaveSearches,
                    type: 'fundsearch',
                },
            }),
            load_button: this.new_instance(NewPopoverButton, {
                id: 'load_button',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    placement: 'right',
                    title: 'Load Search',
                    css_class: 'popover-cpanel',
                },
                icon_css: 'glyphicon glyphicon-share-alt',
                label: 'Load',
                popover_config: {
                    id: 'load',
                    component: PopoverSavedSearches,
                    type: 'fundsearch',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'states:saved',
                        },
                    },
                },
            }),
            save_and_load_label: this.new_instance(Label, {
                id: 'save_and_load_label',
                template: 'tpl_cpanel_label',
                label: 'Save/Load',
            }),
            save_and_load: this.new_instance(StateHandler, {
                id: 'save_and_load',
                component_events: this.get_state_events(),
                save_state_event: Utils.gen_event(
                    'PopoverSaveSearches.save',
                    this.get_id(),
                    'save_button',
                    'save',
                ),
                load_state_event: Utils.gen_event(
                    'PopoverSavedSearches.load',
                    this.get_id(),
                    'load_button',
                    'load',
                ),
                delete_state_event: Utils.gen_event(
                    'PopoverSavedSearches.delete',
                    this.get_id(),
                    'load_button',
                    'load',
                ),
                load_events: this.get_state_events('StateHandler.load'),
                successful_delete_event: this.successful_delete_event,
                type: 'fundsearch',
            }),
            vehicles_label: this.new_instance(Label, {
                id: 'vehicles_label',
                css: {'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Filters',
            }),
            search_label: this.new_instance(Label, {
                id: 'search_label',
                css: {'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Search',
            }),
            grouping_label: this.new_instance(Label, {
                id: 'grouping_label',
                template: 'tpl_cpanel_label',
                label: 'Group By',
            }),
            visualization_label: this.new_instance(Label, {
                id: 'visualization_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Chart Type',
            }),
            x_y_label: this.new_instance(Label, {
                id: 'x_y_label',
                component: Label,
                template: 'tpl_cpanel_label',
                visible: this.visibility.x_y_label,
                label: 'X and Y Axis',
            }),
            metric_label: this.new_instance(Label, {
                id: 'metric_label',
                component: Label,
                template: 'tpl_cpanel_label',
                visible: this.visibility.metric_label,
                label: 'Metric',
            }),
            descriptive_grouping: this.new_instance(PopoverRadioButton, {
                id: 'descriptive_grouping',
                template: 'tpl_popover_radio_button',
                css: {
                    'btn-popover-radio': true,
                    'arrow-select': true,
                },
                clear_event: this.clear_event,
                label: 'Grouping',
                icon_css: {
                    glyphicon: true,
                    'glyphicon-th-list': true,
                },
                enable_localstorage: true,
                default_state: true,
                reset_event: this.chart_cpanel_grouping_reset_event,
                set_state_event_type: 'StateHandler.load',
                popover_options: {
                    placement: 'right',
                    title: 'Grouping',
                    css_class: 'popover-ghost-info',
                },
                popover_config: {
                    component: Radiolist,
                    default_selected_index: 4,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'market_data:funds:breakdown_options',
                        },
                    },
                },
            }),
            advanced_filters_popover_label: this.new_instance(Label, {
                id: 'advanced_filters_popover_label',
                component: Label,
                template: 'tpl_cpanel_label',
                css: {'cpanel-filter-label': true},
                label: 'Advanced Filters',
            }),
            name: this.new_instance(StringFilter, {
                id: 'name',
                template: 'tpl_string_filter',
                enable_localstorage: true,
                placeholder: 'Name...',
                cpanel_style: true,
                set_state_event_type: 'StateHandler.load',
                clear_event: this.clear_event,
            }),
            meta_info: this.new_instance(MetaInfo, {
                id: 'meta_info',
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'DataTable.count',
                        this.get_id(),
                        'search_body',
                        'content',
                        'body',
                        'vehicles',
                    ),
                },
            }),
            has_performance: this.new_instance(BooleanButton, {
                id: 'has_performance',
                label: 'Has Performance',
                template: 'tpl_cpanel_boolean_button',
                btn_css: {'cpanel-btn-sm': true},
                default_state: false,
                reset_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
            }),
            has_cashflows: this.new_instance(BooleanButton, {
                id: 'has_cashflows',
                label: 'Has Cash Flows',
                template: 'tpl_cpanel_boolean_button',
                btn_css: {'cpanel-btn-sm': true},
                default_state: false,
                reset_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
            }),
            enum_attributes: this.new_instance(AttributeFilters, {
                id: 'enum_attributes',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                },
                clear_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                enable_localstorage: true,
                component: AttributeFilters,
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        public_taxonomy: true,
                        exclude_enums: ['status', 'vertical', 'gics'],
                    },
                },
            }),
            x_axis_options: this.new_instance(NewPopoverButton, {
                id: 'x_axis_options',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                clear_event: this.clear_event,
                label: 'X Axis',
                label_track_selection: true,
                visible: this.visibility.x_y_label,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-ghost-info',
                    title: 'X Axis',
                },
                popover_config: {
                    component: Radiolist,
                    default_selected_index: null,
                    data: this.axis_metrics,
                },
            }),
            y_axis_options: this.new_instance(NewPopoverButton, {
                id: 'y_axis_options',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                clear_event: this.clear_event,
                label: 'Y Axis',
                visible: this.visibility.x_y_label,
                label_track_selection: true,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-ghost-info',
                    title: 'Y Axis',
                },
                popover_config: {
                    component: Radiolist,
                    data: this.axis_metrics,
                },
            }),
            metric_options: this.new_instance(NewPopoverButton, {
                id: 'metric_options',
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                clear_event: this.clear_event,
                label: 'Metric',
                label_track_selection: true,
                visible: this.visibility.metric_label,
                enable_localstorage: true,
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-ghost-info',
                    title: 'Metric',
                },
                popover_config: {
                    component: Radiolist,
                    data: this.chart_metrics,
                },
            }),
            location: this.new_instance(NewPopoverButton, {
                id: 'location',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.clear_event,
                label: 'Primary Location',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverLocationSearch,
                    placement: 'right',
                },
            }),
            fund_size: this.new_instance(NewPopoverButton, {
                id: 'fund_size',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                label: 'Fund Size',
                popover_options: {
                    title: 'Fund Size',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                clear_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    prefix: 'USD',
                    suffix: 'MM',
                },
            }),
            as_of_date: this.new_instance(NewPopoverButton, {
                id: 'as_of_date',
                clear_event: this.clear_event,
                label: 'As of Date',
                enable_localstorage: true,
                set_state_event_type: 'StateHandler.load',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Filter by As of Date',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'backend_dates_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:as_of_dates',
                        },
                    },
                },
            }),
            pme_alpha: this.new_instance(NewPopoverButton, {
                id: 'pme_alpha',
                enable_localstorage: true,
                label: 'PME Alpha',
                clear_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'PME Alpha',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: '%',
                },
            }),
            irr: this.new_instance(NewPopoverButton, {
                id: 'irr',
                enable_localstorage: true,
                label: 'Fund IRR',
                clear_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Fund IRR',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: '%',
                },
            }),
            tvpi: this.new_instance(NewPopoverButton, {
                id: 'tvpi',
                enable_localstorage: true,
                label: 'Fund TVPI',
                clear_event: this.clear_event,
                set_state_event_type: 'StateHandler.load',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Fund TVPI',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverRange,
                    template: 'tpl_popover_range',
                    suffix: 'x',
                },
            }),
            drilldown_chart: this.new_instance(DrilldownChart, {
                id: 'drilldown_chart',
                template: 'tpl_drilldown_group_by_chart_box',
                grouping_event: this.grouping_event,
                legend: true,
                exporting: true,
                margin: '0 20px',
                datasource: {
                    type: 'dynamic',
                    get_data_timeout: 500,
                    query: {
                        target: 'market_data:funds:breakdown',
                        aggregation_types: ['count', 'sum'],
                        breakdown_key: {
                            type: 'observer',
                            event_type: this.grouping_event,
                            mapping: 'get',
                            mapping_args: {
                                key: 'breakdown_key',
                            },
                            required: true,
                        },
                        attribute_tree_limit: {
                            type: 'observer',
                            event_type: this.grouping_event,
                            mapping: 'get',
                            mapping_args: {
                                key: 'attribute_tree_limit',
                            },
                        },
                        filters: {
                            type: 'dynamic',
                            query: {
                                ...this.query_params(),
                                ...dataset_query,
                            },
                        },
                    },
                },
            }),
            vintage_year: this.new_instance(NewPopoverButton, {
                id: 'vintage_year',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.clear_event,
                label: 'Vintage Year',
                set_state_event_type: 'StateHandler.load',
                popover_options: {
                    title: 'Vintage Year',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:vintage_years',
                            only_historic_funds: true,
                        },
                    },
                },
            }),
            clear_button: this.new_instance(EventButton, {
                id: 'clear_button',
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            }),
            investor: this.new_instance(NewPopoverButton, {
                id: 'investor',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                clear_event: this.clear_event,
                label: 'Investor Name',
                popover_options: {
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                set_state_event_type: 'StateHandler.load',
                popover_config: {
                    component: PopoverEntitySearch,
                    data_target: 'market_data:investors',
                },
            }),
            lists: this.new_instance(NewPopoverButton, {
                id: 'lists',
                clear_event: this.clear_event,
                label: 'Lists',
                enable_localstorage: true,
                set_state_event_type: 'StateHandler.load',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    placement: 'right',
                    title: 'Filter by Lists',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        key: 'results',
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'uid',
                            label_key: 'name',
                        },
                        type: 'dynamic',
                        query: {
                            target: 'user:lists',
                            results_per_page: 'all',
                        },
                    },
                },
            }),
            ...(this.available_datasets.length > 1 && {
                datasets: this.new_instance(NewPopoverButton, {
                    id: 'datasets',
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
                        datasource: {
                            type: 'static',
                            data: this.available_datasets,
                        },
                    },
                }),
            }),
        };

        this.vehicles_breadcrumb = {
            id: 'vehicles',
            component: Breadcrumb,
            items: [{label: 'Historic Funds'}, {label: 'Search'}],
        };

        this.breadcrumb = {
            id: 'breadcrumb',
            component: DynamicWrapper,
            template: 'tpl_dynamic_wrapper',
            active_component: 'vehicles',
            set_active_event: Utils.gen_event(
                'RadioButtons.state',
                this.get_id(),
                'search_body',
                'cpanel',
                'navigation',
            ),
            components: [this.vehicles_breadcrumb],
        };

        this.vehicles_header = {
            component: BreadcrumbHeader,
            id: 'header',
            template: 'tpl_breadcrumb_header',
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [this.breadcrumb],
            valid_export_features: ['download_market_data'],
        };

        this.vehicles_datasource = {
            type: 'dynamic',
            get_data_timeout: 500,
            query: {
                target: 'market_data:funds',
                results_per_page: this.results_per_page,
                filters: {
                    type: 'dynamic',
                    query: {
                        ...this.query_params(),
                        ...dataset_query,
                    },
                },
            },
        };

        this.action_toolbar = {
            component: ActionHeader,
            id: 'action_toolbar',
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
            buttons: [
                {
                    id: 'list',
                    component: AddToListButton,
                    label: 'Add To List <span class="glyphicon glyphicon-plus"></span>',
                    entity_type: 'fund',
                    datasource: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'DataTable.selected',
                            this.get_id(),
                            'search_body',
                            'content',
                            'body',
                            'vehicles',
                        ),
                        default: [],
                    },
                },
            ],
        };

        this.vehicles_body = {
            component: DataTable,
            id: 'vehicles',
            enable_localstorage: true,
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            register_export: {
                export_event_id: this.register_export_id,
                title: 'Search Results',
                subtitle: 'CSV',
            },
            css: {'table-light': true, 'table-sm': true},
            broadcast_page_change: true,
            broadcast_order_change: true,
            results_per_page: this.results_per_page,
            clear_order_event: this.clear_event,
            row_key: 'unique_id',
            columns: MarketInsightsHelper.fund_table_columns,
            dynamic_columns: [
                {
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'table_columns',
                            public_taxonomy: true,
                            exclude_enums: ['gics', 'geography', 'style'],
                        },
                    },
                    placement: {
                        relative: 'Firm',
                        position: 'right',
                    },
                    visible: false,
                },
                {
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'table_columns',
                            public_taxonomy: true,
                            include_enums: ['geography', 'style'],
                        },
                    },
                    placement: {
                        relative: 'Firm',
                        position: 'right',
                    },
                },
            ],
            datasource: this.vehicles_datasource,
        };

        this.expandable_visualizations = {
            component: ExpandableVisualizations,
            id: 'expandable_visualizations',
            template: 'tpl_expandable_visualizations',
            visible_event: this.chart_block_visible_event,
            enable_localstorage: true,
        };

        this.visualization = {
            component: DynamicWrapper,
            id: 'visualization',
            tpl: 'tpl_dynamic_wrapper',
            active_component: 'fund_performance',
            set_active_event: Utils.gen_event('Visualization.state', this.get_id()),
            components: [],
        };

        this.chart_cpanel = {
            component: BaseComponent,
            id: 'chart_cpanel',
            template: 'tpl_aside_body',
            layout: {
                body: [
                    'visualization_label',
                    'view_toggle',
                    'descriptive_grouping',
                    'x_y_label',
                    'metric_label',
                    'x_axis_options',
                    'y_axis_options',
                    'metric_options',
                ],
            },
            components: [
                {
                    id: 'view_toggle',
                    component: RadioButtons,
                    template: 'tpl_full_width_radio_buttons',
                    default_state: 'default',
                    button_css: {
                        'btn-block': true,
                        'btn-sm': true,
                        'arrow-select': true,
                    },
                    reset_event: this.chart_cpanel_radio_reset_event,
                    buttons: [
                        {
                            label: 'Snapshot',
                            state: 'snapshot',
                            results_per_page: 20,
                            viz_state: 'fund_performance',
                        },
                        {
                            label: 'Timeseries',
                            state: 'timeseries',
                            results_per_page: 20,
                            viz_state: 'fund_performance',
                        },
                        {
                            label: 'Benchmark',
                            state: 'benchmark',
                            results_per_page: 50,
                            viz_state: 'fund_performance',
                        },
                    ],
                },
            ],
        };

        this.chart_block = {
            component: Aside,
            id: 'chart_block',
            template: 'tpl_chart_block',
            layout: {
                cpanel: 'chart_cpanel',
                chart: 'visualization',
            },
            visible_event: this.chart_block_visible_event,
            components: [this.chart_cpanel, this.visualization],
        };

        this.chart_block_wrapper = {
            component: Aside,
            id: 'chart_block_wrapper',
            template: 'tpl_chart_block_wrapper',
            layout: {
                expando: 'expandable_visualizations',
                body: 'chart_block',
            },
            components: [this.chart_block, this.expandable_visualizations],
        };

        this.content_body = {
            component: Aside,
            id: 'body',
            template: 'tpl_aside_body',
            layout: {
                body: ['chart_block_wrapper', 'table_toolbar', 'vehicles'],
            },
            components: [
                this.chart_block_wrapper,
                {
                    id: 'table_toolbar',
                    component: TableToolbar,
                    visible: ko.computed(() => {
                        return (
                            this.chart_state() != 'drilldown_chart' &&
                            this.chart_state() != 'timeseries'
                        );
                    }),
                    fund_performance: this.shared_components.fund_performance,
                    data_table_selected_event: this.data_table_selected_event,
                },
                this.vehicles_body,
            ],
        };

        this.cpanel_tools = {
            id: 'tools',
            template: 'tpl_cpanel_body_items',
            layout: {
                body: [
                    'search_label',
                    'name',
                    'meta_info',
                    'save_and_load_label',
                    'save_button',
                    'load_button',
                    'advanced_filters',
                    'has_performance',
                    'has_cashflows',
                    'enum_attributes',
                    'vintage_year',
                    'fund_size',
                    'location',
                    'investor',
                    ...(this.available_datasets.length > 1 ? ['datasets'] : []),
                    'clear_button',
                ],
            },
            components: [
                {
                    component: NewPopoverButton,
                    id: 'advanced_filters',
                    template: 'tpl_header_with_advanced',
                    label: 'filters',
                    popover_options: {
                        placement: 'right',
                        css_class: 'popover-cpanel-advanced',
                    },
                    popover_config: {
                        id: 'advanced_filters_popover',
                        component: NewPopoverBody,
                        template: 'tpl_popover_new_body',
                        layout: {
                            body: [
                                'advanced_filters_popover_label',
                                'as_of_date',
                                'irr',
                                'tvpi',
                                'pme_alpha',
                                'lists',
                            ],
                        },
                    },
                },
            ],
        };

        this.cpanel = {
            component: Aside,
            id: 'cpanel',
            title: 'Funds',
            title_css: 'performance-calculator',
            template: 'tpl_analytics_cpanel',
            layout: {
                body: ['tools'],
            },
            components: [this.cpanel_tools],
        };

        this.content = {
            component: Aside,
            id: 'content',
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'body',
            },
            components: [this.vehicles_header, this.action_toolbar, this.content_body],
        };

        this.body_components = [this.cpanel, this.content];

        this.body = this.new_instance(
            Aside,
            {
                id: 'search_body',
                template: 'tpl_aside_body',
                layout: {
                    body: ['cpanel', 'content'],
                },
                components: this.body_components,
            },
            this.shared_components,
        );

        // CHART TYPE RADIO BUTTONS
        Observer.register(
            Utils.gen_event(
                'RadioButtons.state_data',
                this.get_id(),
                'search_body',
                'content',
                'body',
                'chart_block_wrapper',
                'chart_block',
                'chart_cpanel',
                'view_toggle',
            ),
            payload => {
                if (payload) {
                    if (!components.has_performance.state()) {
                        components.has_performance.state(true);
                        components.has_performance.broadcast();
                        Notify(
                            'Chart visualizations require performance data - ',
                            'The filter has been automatically activated',
                            'alert-info-light',
                        );
                    }

                    Observer.broadcast(this.chart_cpanel_grouping_reset_event, true);

                    if (payload.viz_state) {
                        Observer.broadcast(
                            Utils.gen_event('Visualization.state', this.get_id()),
                            payload.viz_state,
                        );
                    }

                    if (payload.state) {
                        this.chart_state(payload.state);
                    }
                }
            },
        );

        // GROUPING POPOVER BUTTON
        Observer.register(this.descriptive_grouping_event, () => {
            Observer.broadcast(
                Utils.gen_event('Visualization.state', this.get_id()),
                'drilldown_chart',
            );
            Observer.broadcast(this.chart_cpanel_radio_reset_event);
            this.chart_state('drilldown_chart');
        });

        this.when(this.shared_components, this.body).done(() => {
            this.dfd.resolve();

            this._prepare_extended_benchmark_csv = DataThing.backends.useractionhandler({
                url: 'prepare_extended_benchmark_csv',
            });

            this._prepare_extended_benchmark = this.new_instance(DataSource, {
                auto_get_data: false,
                datasource: {
                    type: 'dynamic',
                    query: {
                        filters: {
                            type: 'dynamic',
                            query: this.query_params({force_has_performance: true}),
                        },
                    },
                },
            });

            this.register_benchmark_export = Utils.gen_event(
                'DynamicActions.register_action',
                this.register_export_id,
            );

            this.export_benchmark_event = Utils.gen_event('Benchmark.export_csv', this.get_id());

            this.export_benchmark_csv = function() {
                this._prepare_extended_benchmark_csv({
                    data: this._prepare_extended_benchmark.get_query_params(),
                    success: DataThing.api.XHRSuccess(key => {
                        DataThing.form_post(config.download_csv_base + key);
                    }),
                });
            };

            Observer.broadcast(
                this.register_benchmark_export,
                {
                    title: 'Benchmark',
                    subtitle: 'CSV',
                    event_type: this.export_benchmark_event,
                },
                true,
            );

            Observer.register(this.export_benchmark_event, () => {
                this.export_benchmark_csv();
            });

            Observer.broadcast(
                Utils.gen_event('Visualization.state', this.get_id()),
                'drilldown_chart',
            );
        });

        return this;
    }
}

export default FundSearch;
