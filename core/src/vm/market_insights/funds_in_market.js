/* Automatically transformed from AMD to ES6. Beware of code smell. */
import NetAnalytics from 'src/libs/components/analytics/NetAnalytics';
import DataTable from 'src/libs/components/basic/DataTable';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import NumberBox from 'src/libs/components/basic/NumberBox';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MetricTable from 'src/libs/components/MetricTable';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import PopoverRange from 'src/libs/components/popovers/PopoverRange';
import PopoverLocationSearch from 'src/libs/components/popovers/PopoverLocationSearch';
import PopoverSavedSearches from 'src/libs/components/popovers/PopoverSavedSearches';
import PopoverSaveSearches from 'src/libs/components/popovers/PopoverSaveSearches';
import Checklist from 'src/libs/components/basic/Checklist';
import AddToListButton from 'src/libs/components/AddToListButton';

import ko from 'knockout';
import $ from 'jquery';
import auth from 'auth';
import config from 'config';
import Aside from 'src/libs/components/basic/Aside';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Observer from 'src/libs/Observer';
import Context from 'src/libs/Context';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import MetaInfo from 'src/libs/components/MetaInfo';
import EventButton from 'src/libs/components/basic/EventButton';
import StateHandler from 'src/libs/components/basic/StateHandler';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';
import FundPerformance from 'src/libs/components/market_insights/FundPerformance';
import DataThing from 'src/libs/DataThing';
import MarketInsightsHelper from 'src/libs/helpers/MarketInsightsHelper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';

export default function() {
    let self = new Context({
        id: 'funds-in-market',
    });

    self.dfd = self.new_deferred();

    self.events = {
        fund_uid: Utils.gen_event('FundsInMarket.uid', self.get_id()),
        analytics_fund_uid: Utils.gen_event('FundsInMarket.analytics_uid', self.get_id()),
        set_mode_event: Utils.gen_event('FundsInMarket.analytics.mode', self.get_id()),
        page_state: Utils.gen_event('FundsInMarket.page_state', self.get_id()),
        gross_irr: Utils.gen_event(
            'DataSource.data',
            self.get_id(),
            'page_wrapper',
            'entity_state',
            'fund',
            'fund_body',
            'number_boxes',
            'gross_irr',
        ),
        gross_multiple: Utils.gen_event(
            'DataSource.data',
            self.get_id(),
            'page_wrapper',
            'entity_state',
            'fund',
            'fund_body',
            'number_boxes',
            'gross_multiple',
        ),
    };

    self.successful_delete_event = Utils.gen_event('SavedStates.delete_success', self.get_id());

    self.register_export_id = Utils.gen_id(
        self.get_id(),
        'page_wrapper',
        'search_state',
        'content',
        'action_toolbar',
        'export_actions',
    );
    self.fund_register_export_id = Utils.gen_id(
        self.get_id(),
        'page_wrapper',
        'entity_state',
        'fund',
        'fund_action_toolbar',
        'export_actions',
    );
    self.button_event = Utils.gen_event('add_to_list', self.get_id());

    self.fund_uid = ko.observable();

    self.download_pdf_event = Utils.gen_event('FundsInMarket.download_pdf', self.get_id());

    Observer.broadcast_for_id(
        self.fund_register_export_id,
        'DynamicActions.register_action',
        {
            title: 'Current Page',
            subtitle: 'PDF',
            event_type: self.download_pdf_event,
        },
        true,
    );

    self._prepare_pdf = DataThing.backends.download({
        url: 'prepare_market_data_pdf',
    });

    Observer.register(self.download_pdf_event, () => {
        let fund_uid = self.fund_uid();

        if (fund_uid) {
            let body_content_id = Utils.html_id(
                Utils.gen_id(self.get_id(), 'page_wrapper', 'entity_state', 'fund', 'fund_body'),
            );

            self._prepare_pdf({
                data: {
                    html: $(`#${body_content_id}`).html(),
                    uid: self.fund_uid(),
                    type: 'fund_in_market',
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_pdf_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    });

    self.available_datasets = [
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

    self.get_state_events = function(load_event) {
        if (load_event) {
            return [
                Utils.gen_event(load_event, self.get_id(), 'location'),
                Utils.gen_event(load_event, self.get_id(), 'status'),
                Utils.gen_event(load_event, self.get_id(), 'fund_size'),
                Utils.gen_event(load_event, self.get_id(), 'vintage_year'),
                Utils.gen_event(load_event, self.get_id(), 'lists'),
                ...Utils.conditional_element(
                    [Utils.gen_event(load_event, self.get_id(), 'datasets')],
                    self.available_datasets.length > 1,
                ),
                Utils.gen_event(load_event, self.get_id(), 'enum_attributes'),
                Utils.gen_event(load_event, self.get_id(), 'name'),
            ];
        }

        return [
            Utils.gen_event('PopoverButton.value', self.get_id(), 'location'),
            Utils.gen_event('PopoverButton.value', self.get_id(), 'status'),
            Utils.gen_event('PopoverButton.value', self.get_id(), 'fund_size'),
            Utils.gen_event('PopoverButton.value', self.get_id(), 'vintage_year'),
            Utils.gen_event('PopoverButton.value', self.get_id(), 'lists'),
            ...Utils.conditional_element(
                [Utils.gen_event('PopoverButton.value', self.get_id(), 'datasets')],
                self.available_datasets.length > 1,
            ),
            Utils.gen_event('AttributeFilters.state', self.get_id(), 'enum_attributes'),
            Utils.gen_event('StringFilter.value', self.get_id(), 'name'),
        ];
    };

    self.clear_event = Utils.gen_event('EventButton', self.get_id(), 'clear_button');

    self.chart_metrics = [
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

    self.axis_metrics = [
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
            format: 'irr',
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

    self.query_params = function(args) {
        args = args || {};

        let force_has_performance = args.force_has_performance || false;

        let query_params = {
            name: {
                type: 'observer',
                event_type: Utils.gen_event('StringFilter.value', self.get_id(), 'name'),
                default: '',
            },
            vintage_year: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'vintage_year'),
                default: [],
            },
            fund_size: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'fund_size'),
                default: [],
            },
            locations: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'location'),
                default: [],
            },
            status: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'status'),
                default: [],
            },
            enums: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'AttributeFilters.state',
                    self.get_id(),
                    'enum_attributes',
                ),
                default: [],
            },
            lists: {
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'lists'),
                default: [],
            },
            only_funds_in_market: true,
        };

        if (force_has_performance) {
            query_params['has_performance'] = true;
        } else {
            query_params['has_performance'] = {
                type: 'observer',
                event_type: Utils.gen_event(
                    'BooleanButton.value',
                    self.get_id(),
                    'has_performance',
                ),
                default: false,
            };
        }

        return query_params;
    };

    self.dataset_query = Utils.conditional_element(
        {
            dataset: {
                mapping: 'get_value',
                type: 'observer',
                event_type: Utils.gen_event('PopoverButton.value', self.get_id(), 'datasets'),
                default: [],
            },
        },
        self.available_datasets.length > 1,
    );

    self.shared_components = {
        save_button: self.new_instance(NewPopoverButton, {
            id: 'save_button',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Save Search',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-save',
            label: 'Save',
            popover_config: {
                id: 'save',
                component: PopoverSaveSearches,
                type: 'funds_in_market',
            },
        }),
        load_button: self.new_instance(NewPopoverButton, {
            id: 'load_button',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                title: 'Load Search',
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-share-alt',
            label: 'Load',
            popover_config: {
                id: 'load',
                component: PopoverSavedSearches,
                type: 'funds_in_market',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'states:saved',
                    },
                },
            },
        }),
        save_and_load_label: self.new_instance(Label, {
            id: 'save_and_load_label',
            template: 'tpl_cpanel_label',
            label: 'Save/Load',
        }),
        save_and_load: self.new_instance(StateHandler, {
            id: 'save_and_load',
            component_events: self.get_state_events(),
            save_state_event: Utils.gen_event(
                'PopoverSaveSearches.save',
                self.get_id(),
                'save_button',
                'save',
            ),
            load_state_event: Utils.gen_event(
                'PopoverSavedSearches.load',
                self.get_id(),
                'load_button',
                'load',
            ),
            delete_state_event: Utils.gen_event(
                'PopoverSavedSearches.delete',
                self.get_id(),
                'load_button',
                'load',
            ),
            load_events: self.get_state_events('StateHandler.load'),
            successful_delete_event: self.successful_delete_event,
            type: 'funds_in_market',
        }),
        vehicles_label: self.new_instance(Label, {
            id: 'vehicles_label',
            css: {'first-header': true},
            template: 'tpl_cpanel_label',
            label: 'Filters',
        }),
        search_label: self.new_instance(Label, {
            id: 'search_label',
            css: {'first-header': true},
            template: 'tpl_cpanel_label',
            label: 'Search',
        }),
        filter_label: self.new_instance(Label, {
            id: 'filter_label',
            template: 'tpl_cpanel_label',
            label: 'Filters',
        }),
        name: self.new_instance(StringFilter, {
            id: 'name',
            template: 'tpl_string_filter',
            enable_localstorage: true,
            placeholder: 'Name...',
            cpanel_style: true,
            set_state_event_type: 'StateHandler.load',
            clear_event: self.clear_event,
        }),
        meta_info: self.new_instance(MetaInfo, {
            id: 'meta_info',
            label: 'Results',
            format: 'number',
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.count',
                    self.get_id(),
                    'page_wrapper',
                    'search_state',
                    'content',
                    'body',
                    'vehicles',
                ),
            },
        }),
        has_performance: self.new_instance(BooleanButton, {
            id: 'has_performance',
            label: 'Has Performance',
            template: 'tpl_cpanel_boolean_button',
            btn_css: {'cpanel-btn-sm': true},
            default_state: false,
            reset_event: self.clear_event,
            set_state_event_type: 'StateHandler.load',
            enable_localstorage: true,
        }),
        enum_attributes: self.new_instance(AttributeFilters, {
            id: 'enum_attributes',
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
            clear_event: self.clear_event,
            set_state_event_type: 'StateHandler.load',
            component: AttributeFilters,
            enable_localstorage: true,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    exclude_enums: ['vertical', 'status', 'gics'],
                },
            },
        }),
        status: self.new_instance(NewPopoverButton, {
            id: 'status',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                title: 'Status',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: self.clear_event,
            label: 'Status',
            enable_localstorage: true,
            set_state_event_type: 'StateHandler.load',
            popover_config: {
                component: Checklist,
                enable_exclude: true,
                datasource: {
                    type: 'dynamic',
                    mapping: 'filter',
                    mapping_args: {
                        filter_fn: function(option) {
                            return option.label != 'Out of Market';
                        },
                    },
                    query: {
                        target: 'enums',
                        enum_type: 'status',
                    },
                },
            },
        }),
        location: self.new_instance(NewPopoverButton, {
            id: 'location',
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
            clear_event: self.clear_event,
            label: 'Primary Location',
            set_state_event_type: 'StateHandler.load',
            enable_localstorage: true,
            popover_config: {
                component: PopoverLocationSearch,
            },
        }),
        fund_size: self.new_instance(NewPopoverButton, {
            id: 'fund_size',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                title: 'Fund Size',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-plus',
            enable_localstorage: true,
            label: 'Fund Size',
            clear_event: self.clear_event,
            set_state_event_type: 'StateHandler.load',
            popover_config: {
                component: PopoverRange,
                template: 'tpl_popover_range',
                prefix: 'USD',
                suffix: 'MM',
            },
        }),
        as_of_date: self.new_instance(NewPopoverButton, {
            id: 'as_of_date',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                title: 'Filter by As of Date',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: self.clear_event,
            label: 'As of Date',
            enable_localstorage: true,
            set_state_event_type: 'StateHandler.load',
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
        vintage_year: self.new_instance(NewPopoverButton, {
            id: 'vintage_year',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                title: 'Vintage Year',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: self.clear_event,
            label: 'Vintage Year',
            enable_localstorage: true,
            set_state_event_type: 'StateHandler.load',
            popover_config: {
                component: Checklist,
                enable_exclude: true,
                datasource: {
                    type: 'dynamic',
                    mapping: 'list_to_options',
                    mapping_default: [],
                    query: {
                        target: 'market_data:vintage_years',
                        only_funds_in_market: true,
                    },
                },
            },
        }),
        lists: self.new_instance(NewPopoverButton, {
            id: 'lists',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            popover_options: {
                placement: 'right',
                title: 'Filter by Lists',
                css_class: 'popover-cpanel',
            },
            icon_css: 'glyphicon glyphicon-plus',
            clear_event: self.clear_event,
            label: 'Lists',
            enable_localstorage: true,
            set_state_event_type: 'StateHandler.load',
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
        clear_button: self.new_instance(EventButton, {
            id: 'clear_button',
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
            label: 'Clear All',
        }),
        ...Utils.conditional_element(
            {
                datasets: self.new_instance(NewPopoverButton, {
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
                            data: self.available_datasets,
                        },
                    },
                }),
            },
            self.available_datasets.length > 1,
        ),
    };

    self.results_per_page = 50;

    self.vehicles_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            results_per_page: self.results_per_page,
            filters: {
                type: 'dynamic',
                query: {
                    ...self.query_params(),
                    ...self.dataset_query,
                },
            },
        },
    };

    self.fund_summary_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund',
            uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.fund_family_query_filters = {
        type: 'dynamic',
        query: {
            same_family_as_uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.similar_funds_query_filters = {
        type: 'dynamic',
        query: {
            similar_to_uid: {
                type: 'observer',
                event_type: self.events.fund_uid,
                required: true,
            },
        },
    };

    self.fund_family_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            results_per_page: 15,
            filters: self.fund_family_query_filters,
        },
    };

    self.fund_family_timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            results_per_page: self.results_per_page,
            filters: self.fund_family_query_filters,
        },
    };

    self.similar_funds_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:funds',
            results_per_page: 10,
            filters: self.similar_funds_query_filters,
        },
    };

    self.similar_funds_timeseries_datasource = {
        type: 'dynamic',
        query: {
            target: 'market_data:fund:timeseries',
            results_per_page: 10,
            filters: self.similar_funds_query_filters,
        },
    };

    self.fund_family_benchmark_datasource = {
        type: 'dynamic',
        query: {
            target: 'benchmark',
            include_items: false,
            filters: self.fund_family_query_filters,
        },
    };

    self.similar_funds_benchmark_datasource = {
        type: 'dynamic',
        query: {
            target: 'benchmark',
            include_items: false,
            filters: self.similar_funds_query_filters,
        },
    };

    self.vehicles_breadcrumb = {
        id: 'vehicles',
        component: Breadcrumb,
        items: [
            {
                label: 'Funds in Market',
            },
            {
                label: 'Search',
            },
        ],
    };

    self.breadcrumb = {
        id: 'breadcrumb',
        component: DynamicWrapper,
        template: 'tpl_dynamic_wrapper',
        active_component: 'vehicles',
        set_active_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'page_wrapper',
            'search_state',
            'cpanel',
            'navigation',
        ),
        components: [self.vehicles_breadcrumb],
    };

    self.vehicles_header = {
        component: BreadcrumbHeader,
        id: 'header',
        template: 'tpl_breadcrumb_header',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
        valid_export_features: ['download_market_data'],
    };

    self.action_toolbar = {
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
                        self.get_id(),
                        'page_wrapper',
                        'search_state',
                        'content',
                        'body',
                        'vehicles',
                    ),
                    default: [],
                },
            },
        ],
    };

    self.fund_breadcrumb = {
        id: 'fund_breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Funds in Market',
                link: '#!/funds-in-market',
            },
            {
                label_key: 'name',
                datasource: self.fund_summary_datasource,
            },
        ],
    };

    self.fund_header = {
        component: BreadcrumbHeader,
        id: 'fund_header',
        template: 'tpl_breadcrumb_header',
        css: {'sub-page-header': true},
        layout: {
            breadcrumb: 'fund_breadcrumb',
        },
        valid_export_features: ['download_market_data'],
        components: [self.fund_breadcrumb],
    };

    self.fund_action_toolbar = {
        component: ActionHeader,
        id: 'fund_action_toolbar',
        template: 'tpl_action_toolbar',
        valid_export_features: ['download_market_data'],
        buttons: [
            {
                id: 'view_cashflows',
                label: 'View Cashflows for Fund <span class="icon-chart-bar"></span>',
                action: 'view_cashflows',
                datasource: self.fund_summary_datasource,
                disabled_if_no_data: true,
                disabled_callback: function(data) {
                    return !data.cf_investor_uid;
                },
                trigger_url: {
                    url: 'funds-in-market/<uid>/net/analytics',
                },
            },
        ],
    };

    self.fund_tab_views = [
        {
            label: 'Table',
            state: 'table',
            icon: {'icon-list-alt': true},
        },
        {
            label: 'Snapshot',
            state: 'snapshot',
            icon: {'icon-chart-bar': true},
        },
        {
            label: 'Timeseries',
            state: 'timeseries',
            icon: {'icon-chart-line': true},
        },
    ];

    self.similar_fund_tab_views = [
        {
            label: 'Table',
            state: 'table',
            icon: {'icon-list-alt': true},
        },
        {
            label: 'Snapshot',
            state: 'snapshot',
            icon: {'icon-chart-bar': true},
        },
        {
            label: 'Timeseries',
            state: 'timeseries',
            icon: {'icon-chart-line': true},
        },
        {
            label: 'Benchmark',
            state: 'benchmark',
            icon: {'icon-gauge': true},
        },
    ];

    self.fund_body = {
        component: Aside,
        id: 'fund_body',
        template: 'tpl_aside_body',
        layout: {
            body: [
                'separator',
                'metric_table',
                'number_boxes',
                'info_tables',
                'page_break',
                'fund_family_heading',
                'fund_family_tab_nav',
                'fund_family',
                'page_break',
                'similar_funds_heading',
                'similar_funds_tab_nav',
                'similar_funds',
                'page_break',
                'investors_heading',
                'investors',
            ],
        },
        components: [
            {
                id: 'separator',
                component: HTMLContent,
                html: '<div style="padding:15px;"></div>',
            },
            {
                id: 'page_break',
                component: HTMLContent,
                html: '<div class="page-break"></div>',
            },
            {
                component: MetricTable,
                id: 'metric_table',
                inline_data: true,
                css: {'table-light': true},
                template: 'tpl_metric_table_multi_col',
                columns: 2,
                metrics: [
                    {
                        label: 'Firm',
                        format: 'entity_link',
                        format_args: {
                            url: 'firms.firm_uid',
                            name_key: 'firm_name',
                        },
                    },
                    {
                        label: 'Location',
                        value_key: 'location',
                    },
                    {
                        label: 'Vintage Year',
                        value_key: 'vintage_year',
                    },
                    {
                        label: 'Final Close',
                        value_key: 'final_close',
                        visible: MarketInsightsHelper.fund_has_dataset('hl'),
                        format: 'backend_date',
                    },
                    {
                        label: 'Geography',
                        value_key: 'enums:geography',
                        format: 'strings_full',
                    },
                    {
                        label: 'Style / Focus',
                        value_key: 'enums:style',
                        format: 'strings_full',
                    },
                    {
                        label: 'Sector',
                        value_key: 'enums:sector',
                        format: 'strings_full',
                    },
                ],
                datasource: self.fund_summary_datasource,
            },
            {
                id: 'number_boxes',
                component: BaseComponent,
                template: 'tpl_flexible_number_box_row',
                layout: {
                    body: ['irr', 'multiple', 'dpi', 'gross_irr', 'gross_multiple'],
                },
                components: [
                    {
                        id: 'irr',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. IRR',
                        data_key: 'irr',
                        format: 'irr_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'multiple',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. Multiple',
                        data_key: 'multiple',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'dpi',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Avg. DPI',
                        data_key: 'dpi',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'gross_irr',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Gross IRR',
                        data_key: 'gross_irr',
                        format: 'irr_highlight',
                        datasource: self.fund_summary_datasource,
                        visible_event: self.events.gross_irr,
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                        broadcast_data: true,
                    },
                    {
                        id: 'gross_multiple',
                        component: NumberBox,
                        template: 'tpl_number_box',
                        label: 'Gross Multiple',
                        data_key: 'gross_multiple',
                        format: 'multiple_highlight',
                        datasource: self.fund_summary_datasource,
                        visible_event: self.events.gross_multiple,
                        visible_event_fn: MarketInsightsHelper.fund_has_dataset('hl'),
                        broadcast_data: true,
                    },
                ],
            },
            {
                id: 'info_tables',
                component: Aside,
                template: 'tpl_aside_vertical_split',
                layout: {
                    left: 'fundraising_table',
                    right: 'other_table',
                },
                components: [
                    {
                        id: 'fundraising_table',
                        title: 'Fundraising',
                        component: MetricTable,
                        columns: 1,
                        inline_data: true,
                        css: {'table-light': true},
                        template: 'tpl_metric_table',
                        metrics: [
                            {
                                label: 'Fundraising Status',
                                value_fn: function(data) {
                                    let target = Utils.extract_data('target_size_usd', data);
                                    let closed = Utils.extract_data('total_sold_usd', data);
                                    if (
                                        Utils.is_set(target) &&
                                        Utils.is_set(closed) &&
                                        target > 0
                                    ) {
                                        return closed / target;
                                    }
                                },
                                format: 'percent',
                            },
                            {
                                label: 'Fund Size',
                                format: 'money',
                                format_args: {
                                    currency_key: 'target_size_currency',
                                    value_key: 'target_size_value',
                                },
                            },
                            {
                                label: 'Amount Closed',
                                format: 'money',
                                format_args: {
                                    currency_key: 'total_sold_currency',
                                    value_key: 'total_sold_value',
                                },
                            },
                            {
                                label: 'Status',
                                value_key: 'status',
                            },
                        ],
                        datasource: self.fund_summary_datasource,
                    },
                    {
                        id: 'other_table',
                        component: MetricTable,
                        title: 'Other',
                        columns: 1,
                        inline_data: true,
                        css: {'table-light': true},
                        template: 'tpl_metric_table',
                        metrics: [
                            {
                                label: 'PME Alpha',
                                format: 'percent',
                                value_key: 'bison_pme_alpha',
                            },
                            {
                                label: 'Gross Invested',
                                value_key: 'gross_invested',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                            {
                                label: 'Gross Realized',
                                value_key: 'gross_realized',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                            {
                                label: 'Gross Unrealized',
                                value_key: 'gross_unrealized',
                                format: 'money',
                                visible: MarketInsightsHelper.fund_has_dataset('hl'),
                            },
                        ],
                        datasource: self.fund_summary_datasource,
                    },
                ],
            },
            {
                id: 'fund_family_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Fund Family',
            },
            {
                id: 'fund_family_tab_nav',
                component: RadioButtons,
                template: 'tpl_radio_buttons_tabs',
                default_state: 'table',
                button_css: {
                    'btn-block': true,
                    'btn-transparent': true,
                },
                buttons: self.fund_tab_views,
            },
            {
                id: 'fund_family',
                component: FundPerformance,
                default_chart: 'table',
                fund_datasource: self.fund_summary_datasource,
                disable_snapshot_comps: true,
                table_columns: MarketInsightsHelper.fund_table_columns,
                table_datasource: self.fund_family_datasource,
                snapshot_datasource: {
                    ...self.fund_family_datasource,
                    key: 'results',
                },
                timeseries_datasource: self.fund_family_timeseries_datasource,
                select_chart: Utils.gen_event(
                    'RadioButtons.state',
                    self.get_id(),
                    'page_wrapper',
                    'entity_state',
                    'fund',
                    'fund_body',
                    'fund_family_tab_nav',
                ),
                register_export: {
                    export_event_id: self.fund_register_export_id,
                    title: 'Fund Family',
                    subtitle: 'CSV',
                },
            },
            {
                id: 'similar_funds_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Similar Funds',
            },
            {
                id: 'similar_funds_tab_nav',
                component: RadioButtons,
                template: 'tpl_radio_buttons_tabs',
                default_state: 'table',
                button_css: {
                    'btn-block': true,
                    'btn-transparent': true,
                },
                buttons: self.similar_fund_tab_views,
            },
            {
                id: 'similar_funds',
                component: FundPerformance,
                default_chart: 'table',
                fund_datasource: self.fund_summary_datasource,
                table_columns: MarketInsightsHelper.fund_table_columns,
                table_datasource: {
                    ...self.similar_funds_datasource,
                    key: 'results',
                },
                limit_table_to_one_page: true,
                snapshot_datasource: {
                    ...self.similar_funds_datasource,
                    key: 'results',
                },
                benchmark_datasource: self.similar_funds_benchmark_datasource,
                compset_datasource: self.similar_funds_datasource,
                timeseries_datasource: self.similar_funds_timeseries_datasource,
                register_export: {
                    export_event_id: self.fund_register_export_id,
                    title: 'Similar Funds',
                    subtitle: 'CSV',
                },
                select_chart: Utils.gen_event(
                    'RadioButtons.state',
                    self.get_id(),
                    'page_wrapper',
                    'entity_state',
                    'fund',
                    'fund_body',
                    'similar_funds_tab_nav',
                ),
            },
            {
                id: 'investors_heading',
                component: BaseComponent,
                template: 'tpl_base_h2',
                heading: 'Investors',
            },
            {
                component: DataTable,
                id: 'investors',
                columns: MarketInsightsHelper.investment_table_columns({
                    include_investor: true,
                    include_fund: false,
                    investor_view: true,
                }),
                css: {
                    'table-light': true,
                    'table-sm': true,
                },
                empty_template: 'tpl_data_table_investors_empty',
                results_per_page: 15,
                register_export: {
                    export_event_id: self.fund_register_export_id,
                    title: 'Investors',
                    subtitle: 'CSV',
                },
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'market_data:investments',
                        filters: {
                            type: 'dynamic',
                            query: {
                                fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.fund_uid,
                                    required: true,
                                },
                            },
                        },
                        results_per_page: 15,
                        fund_fallback: false,
                        order_by: [
                            {name: 'as_of_date', sort: 'desc'},
                            {name: 'name', sort: 'asc'},
                        ],
                    },
                },
            },
        ],
    };

    self.vehicles_body = {
        component: DataTable,
        id: 'vehicles',
        enable_localstorage: true,
        enable_selection: true,
        enable_column_toggle: true,
        enable_clear_order: true,
        register_export: {
            export_event_id: self.register_export_id,
            title: 'Search Results',
            subtitle: 'CSV',
        },
        css: {'table-light': true, 'table-sm': true},
        broadcast_page_change: true,
        broadcast_order_change: true,
        results_per_page: self.results_per_page,
        results_per_page_event: Utils.gen_event(
            'PopoverButton.value',
            self.get_id(),
            'page_wrapper',
            'search_state',
            'cpanel',
            'tools',
            'chart_type',
            'nested',
        ),
        clear_order_event: self.clear_event,
        columns: MarketInsightsHelper.funds_in_market_table_columns,
        dynamic_columns: [
            {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'table_columns',
                        public_taxonomy: true,
                    },
                },
                placement: {
                    relative: 'Firm',
                    position: 'right',
                },
            },
        ],
        datasource: self.vehicles_datasource,
    };

    self.body = {
        component: Aside,
        id: 'body',
        template: 'tpl_aside_body',
        layout: {
            body: ['vehicles'],
        },
        components: [self.vehicles_body],
    };

    self.cpanel_tools = {
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
                'filter_label',
                'has_performance',
                'status',
                'enum_attributes',
                'vintage_year',
                'fund_size',
                'location',
                'lists',
                ...Utils.conditional_element(['datasets'], self.available_datasets.length > 1),
                'clear_button',
            ],
        },
        components: [],
    };

    self.cpanel = {
        component: Aside,
        id: 'cpanel',
        title: 'Funds in Market',
        title_css: 'performance-calculator',
        template: 'tpl_analytics_cpanel',
        layout: {
            body: ['tools'],
        },
        components: [self.cpanel_tools],
    };

    self.content = {
        component: Aside,
        id: 'content',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'body',
        },
        components: [self.vehicles_header, self.action_toolbar, self.body],
    };

    self.search_state = {
        component: Aside,
        id: 'search_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['cpanel', 'content'],
        },
        components: [self.cpanel, self.content],
    };

    self.fund = {
        id: 'fund',
        component: Aside,
        template: 'tpl_body',
        layout: {
            header: 'fund_header',
            toolbar: 'fund_action_toolbar',
            body: 'fund_body',
        },
        components: [self.fund_header, self.fund_action_toolbar, self.fund_body],
    };

    self.entity_state = {
        component: Aside,
        id: 'entity_state',
        template: 'tpl_aside_body',
        layout: {
            body: ['fund'],
        },
        components: [self.fund],
    };

    self.entity_analytics_state = {
        component: NetAnalytics,
        id: 'entity_analytics_state',
        entity_type: 'user_fund',
        user_fund_uid_event: self.events.analytics_fund_uid,
        template: 'tpl_asides',
        breadcrumbs: [
            {
                label: 'Funds in Market',
                link: '#!/funds-in-market',
            },
            {
                label_key: 'name',
                contextual_url: {
                    url: 'funds-in-market/<user_fund_uid>',
                },
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'vehicle:meta_data',
                        user_fund_uid: {
                            type: 'observer',
                            event_type: self.events.analytics_fund_uid,
                            required: true,
                        },
                    },
                },
            },
            {
                label: 'Analytics',
            },
        ],
        reset_event: self.events.analytics_fund_uid,
        set_mode_event: self.events.set_mode_event,
    };

    self.page_wrapper = self.new_instance(
        DynamicWrapper,
        {
            id: 'page_wrapper',
            template: 'tpl_dynamic_wrapper',
            active_component: 'search_state',
            set_active_event: self.events.page_state,
            components: [self.search_state, self.entity_state, self.entity_analytics_state],
        },
        self.shared_components,
    );

    self.handle_url = function(url) {
        Utils.match_array(
            url,
            [
                'funds-in-market',
                /.+/,
                'analytics',
                (uid, mode) => {
                    Observer.broadcast(self.events.page_state, 'entity_analytics_state');
                    Observer.broadcast(self.events.analytics_fund_uid, uid, true);
                    Observer.broadcast(
                        self.events.set_mode_event,
                        VehicleHelper.url_to_mode(mode) || 'overview',
                    );
                },
            ],
            [
                'funds-in-market',
                /.+/,
                uid => {
                    Observer.broadcast(self.events.page_state, 'entity_state');
                    Observer.broadcast(self.events.fund_uid, uid, true);
                    Observer.broadcast(self.events.analytics_fund_uid, undefined);
                },
            ],
            [
                'funds-in-market',
                () => {
                    Observer.broadcast(self.events.page_state, 'search_state');
                    Observer.broadcast(self.events.fund_uid, undefined);
                    Observer.broadcast(self.events.analytics_fund_uid, undefined);
                    Observer.broadcast_for_id('UserAction', 'record_action', {
                        action_type: 'view_market_data_funds_in_market',
                    });
                },
            ],
        );
    };

    self.when(self.shared_components, self.page_wrapper).done(() => {
        Observer.register(self.events.fund_uid, self.fund_uid);

        Observer.register_hash_listener('funds-in-market', url => {
            self.handle_url(url);
        });

        self.dfd.resolve();
    });

    return self;
}
