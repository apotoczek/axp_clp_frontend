/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTablePageWrapper from 'src/libs/components/reports/visual_reports/DataTablePageWrapper';
import EventButton from 'src/libs/components/basic/EventButton';
import PortfolioUpdateOverview from 'src/libs/components/reports/visual_reports/portfolio_update/PortfolioUpdateOverview';
import PortfolioUpdateCompanyDetails from 'src/libs/components/reports/visual_reports/portfolio_update/PortfolioUpdateCompanyDetails';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import DataTable from 'src/libs/components/reports/visual_reports/DataTable';
import $ from 'jquery';
import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import Report from 'src/libs/components/reports/visual_reports/base/Report';
import Editor from 'src/libs/components/reports/visual_reports/base/Editor';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Wizard from 'src/libs/components/reports/visual_reports/base/Wizard';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import * as Formatters from 'src/libs/Formatters';
import DataSource from 'src/libs/DataSource';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import PopoverNestedChecklist from 'src/libs/components/popovers/PopoverNestedChecklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import DataThing from 'src/libs/DataThing';
import {CalculatedMetric, TimeFrame, SystemMetricType} from 'src/libs/Enums';

export default function(opts, components) {
    let self = new Report(opts, components);

    self.sub_type = 'portfolio_update';
    self.__class__ = 'PortfolioUpdate';

    let report_title = 'Portfolio Update';
    let _dfd = self.new_deferred();

    self.events.new('user_fund_uid');
    self.events.new('portfolio_uid');

    self.events.new('preview');
    self.events.new('disable_preview');
    self.events.new('edit');
    self.events.new('download_pdf');

    self.events.new('entity_uid');
    self.events.new('entity_type');

    // cpanel events
    self.events.resolve_and_add('as_of_date', 'PopoverButton.value');
    self.events.resolve_and_add('new_sector', 'PopoverButton.value');
    self.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
    self.events.resolve_and_add('clear_filters', 'EventButton');
    self.events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');
    self.events.resolve_and_add('custom_attributes_filter', 'AttributeFilters.state');

    self.hooks.push('after_set_state', () => {
        $('body').trigger('highchart:reflow');
    });

    let get_default_query = (target, overrides = {}) => {
        let query = {
            target: target,
            user_fund_uid: {
                type: 'observer',
                event_type: self.events.get('user_fund_uid'),
            },
            portfolio_uid: {
                type: 'observer',
                event_type: self.events.get('portfolio_uid'),
            },
            render_currency: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.resolve_event('render_currency', 'PopoverButton.value'),
                required: true,
            },
            as_of_date: {
                mapping: 'get_value',
                type: 'observer',
                event_type: self.events.get('as_of_date'),
                required: true,
            },
            filters: {
                type: 'dynamic',
                query: {
                    in_user_fund_uid: {
                        type: 'observer',
                        event_type: self.events.resolve_event('user_fund', 'PopoverButton.value'),
                    },
                    deal_uid: {
                        type: 'observer',
                        event_type: self.events.resolve_event('deal', 'PopoverButton.value'),
                        mapping: 'get_value',
                    },
                    manager: {
                        type: 'observer',
                        event_type: self.events.resolve_event('manager', 'PopoverButton.value'),
                    },
                    enums: {
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            'enum_attributes',
                            'AttributeFilters.state',
                        ),
                    },
                    vintage_year: {
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            'vintage_year',
                            'PopoverButton.value',
                        ),
                    },
                    new_sector: {
                        type: 'observer',
                        event_type: self.events.resolve_event('new_sector', 'PopoverButton.value'),
                    },
                    custom_attributes: {
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            'custom_attributes_filter',
                            'AttributeFilters.state',
                        ),
                    },
                },
            },
        };

        for (let [key, config] of Object.entries(overrides)) {
            query[key] = config;
        }
        return query;
    };

    let editor_cpanel_components = [
        self.helpers.cpanel.as_of_date({
            id: 'as_of_date',
            clear_event: self.events.get('clear_filters'),
            user_fund_uid_event: self.events.get('user_fund_uid'),
            portfolio_uid_event: self.events.get('portfolio_uid'),
        }),
        self.helpers.cpanel.currency_radiolist({
            id: 'render_currency',
            user_fund_uid_event: self.events.get('entity_uid'),
        }),

        self.helpers.cpanel.label({
            id: 'filters_label',
            label: 'Filters',
        }),

        self.helpers.cpanel.checklist({
            id: 'user_fund',
            label: 'Fund',
            clear_event: self.events.get('clear_filters'),
            visible_callback: chklist => chklist.data(),
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    label_key: 'name',
                    value_key: 'user_fund_uid',
                },
                query: {
                    target: 'vehicles',
                    results_per_page: 'all',
                    filters: {
                        type: 'dynamic',
                        query: {
                            in_portfolio_uid: {
                                type: 'observer',
                                event_type: self.events.get('portfolio_uid'),
                                required: true,
                            },
                            entity_type: 'user_fund',
                        },
                    },
                    order_by: [
                        {
                            name: 'name',
                            sort: 'asc',
                        },
                    ],
                },
            },
        }),

        self.helpers.cpanel.checklist({
            id: 'deal',
            label: 'Deal',
            clear_event: self.events.get('clear_filters'),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    label_key: 'company_name',
                    value_key: 'uid',
                    additional_keys: ['parent_name'],
                },
                one_required: ['user_fund_uid', 'portfolio_uid'],
                query: {
                    target: 'deals',
                    results_per_page: 'all',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: self.events.get('user_fund_uid'),
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: self.events.get('portfolio_uid'),
                    },
                    order_by: [
                        {
                            name: 'name',
                            sort: 'asc',
                        },
                    ],
                },
            },
        }),
        self.helpers.cpanel.checklist({
            id: 'manager',
            label: 'Manager',
            clear_event: self.events.get('clear_filters'),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                type: 'dynamic',
                mapping: 'list_to_options',
                one_required: ['user_fund_uid', 'portfolio_uid'],
                query: {
                    target: 'vehicle:managers',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: self.events.get('user_fund_uid'),
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: self.events.get('portfolio_uid'),
                    },
                },
            },
        }),
        {
            id: 'enum_attributes',
            id_callback: self.events.register_alias('enum_attributes'),
            component: AttributeFilters,
            clear_event: self.events.get('clear_filters'),
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                    include_enums: ['geography'],
                },
            },
            css: {
                'cpanel-btn-sm': true,
                'btn-block': true,
                'btn-cpanel-primary': true,
            },
        },
        {
            id: 'new_sector',
            id_callback: self.events.register_alias('new_sector'),
            component: NewPopoverButton,
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                placement: 'right',
                title: 'Sector / Industry',
                css_class: 'popover-cpanel',
            },
            label: 'Sector / Industry',
            clear_event: self.events.get('clear_filters'),
            popover_config: {
                component: PopoverNestedChecklist,
                template: 'tpl_popover_nested_checklist',
                l1: {
                    key: 'sector',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'classifications',
                            type: 'sector',
                        },
                    },
                },
                l2: {
                    key: 'industry',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'classifications',
                            type: 'industry',
                        },
                    },
                    empty_text: 'Select a Sector to select Industry',
                },
            },
        },

        self.helpers.cpanel.checklist({
            id: 'vintage_year',
            label: 'Deal Year',
            clear_event: self.events.get('clear_filters'),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                type: 'dynamic',
                mapping: 'list_to_options',
                mapping_default: [],
                one_required: ['user_fund_uid', 'portfolio_uid'],
                query: {
                    target: 'vehicle:deal_years',
                    user_fund_uid: {
                        type: 'observer',
                        event_type: self.events.get('user_fund_uid'),
                    },
                    portfolio_uid: {
                        type: 'observer',
                        event_type: self.events.get('portfolio_uid'),
                    },
                },
            },
        }),

        {
            id: 'custom_attributes',
            id_callback: self.events.register_alias('custom_attributes'),
            component: NewPopoverButton,
            label: 'Custom Attributes',
            css: {
                'btn-block': true,
                'btn-cpanel-primary': true,
                'btn-sm': true,
            },
            icon_css: 'glyphicon glyphicon-plus',
            popover_options: {
                placement: 'right',
                css_class: 'popover-cpanel',
            },
            visible_callback: function(popover) {
                return popover.filters().length > 0;
            },
            popover_config: {
                id: 'custom_attributes_filter',
                id_callback: self.events.register_alias('custom_attributes_filter'),
                component: AttributeFilters,
                clear_event: self.events.get('clear_filters'),
                active_template: 'in_popover',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'filter_configs',
                        entity_uid: {
                            type: 'observer',
                            event_type: self.events.get('entity_uid'),
                            required: true,
                        },
                        entity_type: {
                            type: 'observer',
                            event_type: self.events.get('entity_type'),
                            required: true,
                        },
                        public_taxonomy: false,
                    },
                },
            },
        },

        {
            id: 'clear_filters',
            id_callback: self.events.register_alias('clear_filters'),
            label: 'Clear Filters',
            component: EventButton,
            template: 'tpl_cpanel_button',
            css: {'btn-sm': true, 'btn-default': true},
        },
    ];

    let datasources = {
        vehicle_overview: self.new_instance(DataSource, {
            datasource: {
                one_required: ['user_fund_uid', 'portfolio_uid'],
                type: 'dynamic',
                query: get_default_query('vehicle:gross'),
            },
        }),
        operating_metrics: self.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'metric_analysis_for_companies_in_entity',
                    entity_uid: {
                        type: 'observer',
                        event_type: self.events.get('entity_uid'),
                        required: true,
                    },
                    entity_type: {
                        type: 'observer',
                        event_type: self.events.get('entity_type'),
                        required: true,
                    },
                    render_currency: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: self.events.resolve_event(
                            'render_currency',
                            'PopoverButton.value',
                        ),
                        required: true,
                    },
                    as_of_date: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: self.events.get('as_of_date'),
                        required: true,
                    },
                    time_frame: TimeFrame.TTM,
                    system_metric_types: [
                        SystemMetricType.Revenue,
                        SystemMetricType.Ebitda,
                        SystemMetricType.NetDebt,

                        SystemMetricType.EnterpriseValue,
                        SystemMetricType.NumberOfCustomers,
                        SystemMetricType.NumberOfEmployees,
                        SystemMetricType.NetDebt,
                    ],
                    calculated_identifiers: [
                        CalculatedMetric.EvMultiple,
                        CalculatedMetric.RevenueMultiple,
                        CalculatedMetric.DebtMultiple,
                        CalculatedMetric.EbitdaMargin,
                    ],
                    use_labels: false,
                    filters: {
                        type: 'dynamic',
                        query: {
                            in_user_fund_uid: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'user_fund',
                                    'PopoverButton.value',
                                ),
                            },
                            deal_uid: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'deal',
                                    'PopoverButton.value',
                                ),
                                mapping: 'get_value',
                            },
                            manager: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'manager',
                                    'PopoverButton.value',
                                ),
                            },
                            enums: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'enum_attributes',
                                    'AttributeFilters.state',
                                ),
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'vintage_year',
                                    'PopoverButton.value',
                                ),
                            },
                            new_sector: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'new_sector',
                                    'PopoverButton.value',
                                ),
                            },
                            custom_attributes: {
                                type: 'observer',
                                event_type: self.events.resolve_event(
                                    'custom_attributes_filter',
                                    'AttributeFilters.state',
                                ),
                            },
                        },
                    },
                },
            },
        }),
    };

    let render_currency = ko.pureComputed(() => {
        let data = datasources.vehicle_overview.data();

        if (data) {
            return data.render_currency;
        }
    });

    let formatters = {
        date: Formatters.backend_date,
        multiple: Formatters.multiple,
        percent: Formatters.percent,
        money: Formatters.gen_formatter({
            format: 'money',
            format_args: {render_currency: render_currency},
        }),
    };

    let entity_type = ko.pureComputed(() => {
        let report = self.report();
        if (report) {
            return (report.params || {}).entity_type;
        }
    });

    let fmtd_entity_type = ko.pureComputed(() => {
        let report = self.report();
        if (report) {
            let entity_type = (report.params || {}).entity_type || 'user_fund';
            return entity_type === 'portfolio' ? 'portfolio' : 'fund';
        }
    });

    let overview_text = ko.pureComputed(() => {
        let data = datasources.vehicle_overview.data();

        if (
            data &&
            data.as_of_date &&
            data.name &&
            Object.isNumber(data.tvpi) &&
            Object.isNumber(data.irr) &&
            Object.isNumber(data.time_zero_irr)
        ) {
            let p1 = oneLine`
                    As of ${formatters.date(data.as_of_date)}, ${data.name} has a gross
                    multiple of ${formatters.multiple(data.tvpi)} and a gross IRR of
                    ${formatters.percent(data.irr)}.
                `;

            let p2 = oneLine`
                    The ${fmtd_entity_type()} has a time zero IRR
                    of ${formatters.percent(data.time_zero_irr)}. The time zero IRR
                    assumes each investment occurred on Day 1.
                    This removes the timing aspect from the IRR calculation
                    and emphasizes a manager's ability to pick good companies.
                `;

            return [p1, p2].join('\n\n');
        }

        return '';
    });

    let deal_text = ko.pureComputed(() => {
        let data = datasources.vehicle_overview.data();

        if (data && data.companies) {
            let realized = data.companies.filter(c => c.transaction_status !== 'Unrealized');
            let unrealized = data.companies.filter(c => c.transaction_status === 'Unrealized');
            let total_invested = data.companies.reduce((a, c) => a + c.paid_in, 0);
            let real_invested = realized.reduce((a, c) => (a += c.paid_in), 0);
            let unreal_invested = unrealized.reduce((a, c) => (a += c.paid_in), 0);

            let p1 = oneLine`
                    The ${fmtd_entity_type()} has invested ${formatters.money(data.paid_in)}
                    in ${data.companies.length} companies. Of these companies,
                    ${realized.length} are currently fully or partially realized.
                    This represents ${formatters.percent(
                        real_invested / total_invested,
                    )} of invested capital.
                `;

            let p2 = oneLine`
                    There are ${unrealized.length} companies unrealized.
                    This represents ${formatters.percent(unreal_invested / total_invested)}
                    of invested capital.
                `;

            return [p1, p2].join('\n\n');
        }

        return '';
    });

    let portfolio_details_table_cols = [
        {
            label: 'Name',
            key: 'name',
            format: 'truncate',
            format_args: {
                max_length: 15,
            },
        },
        {
            label: 'Deal Year',
            key: 'vintage_year',
            format: 'strings',
        },
        {
            label: 'geography',
            key: 'geography',
            format: 'strings',
        },
        {
            label: 'Sector',
            key: 'sector',
            format: 'strings',
        },
        {
            label: 'Invested',
            key: 'paid_in',
            format: 'money',
            format_args: {
                value_key: 'paid_in',
                render_currency: render_currency,
            },
        },
        {
            label: 'Distributed',
            key: 'distributed',
            format: 'money',
            format_args: {
                value_key: 'distributed',
                render_currency: render_currency,
            },
        },
        {
            label: 'NAV',
            key: 'nav',
            format: 'money',
            format_args: {
                value_key: 'nav',
                render_currency: render_currency,
            },
        },
    ];

    let pages = [
        {
            layout: ['fund_meta_data'],
            is_cover: true,
        },
        {
            title: ko.pureComputed(() =>
                entity_type() == 'portfolio' ? 'PORTFOLIO OVERVIEW' : 'FUND OVERVIEW',
            ),
            subtitle: 'Gross Performance',
            layout: ['gross_performance'],
        },
        {
            title: ko.pureComputed(() =>
                entity_type() == 'portfolio' ? 'PORTFOLIO DETAILS' : 'FUND DETAILS',
            ),
            multi_page: true,
            layout: ['portfolio_details'],
        },
        {
            title: 'COMPANY DETAILS',
            subtitle: 'Deal Details',
            array_of_pages: true,
            layout: ['company_details'],
        },
    ];

    self.editor_layout = {
        id: 'layout',
        component: PageLayout,
        page_css: 'fbr',
        mode: 'edit',
        pages: pages,
        components: [
            {
                id: 'fund_meta_data',
                component: ReportComponentWrapper,
                can_hide: false,
                widget_config: {
                    id: 'fund_meta_data',
                    component: ReportMeta,
                    metric_table: {
                        data_key: 'characteristics',
                    },
                    report_title: report_title,
                    logo_id: 'report_logo',
                    title_id: 'report_name',
                    datasources: {
                        characteristics: {
                            type: 'dynamic',
                            one_required: ['user_fund_uid', 'portfolio_uid'],
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('user_fund_uid'),
                                },
                                portfolio_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('portfolio_uid'),
                                },
                            },
                        },
                        params: {
                            type: 'observer',
                            event_types: {
                                as_of_date: {
                                    event_type: self.events.get('as_of_date'),
                                    mapping: 'get_value',
                                },
                                logo_src: {
                                    event_type: Utils.gen_event(
                                        'ImageCropper.chosen_image',
                                        self.get_id(),
                                        'editor',
                                        'report_logo',
                                    ),
                                },
                            },
                        },
                    },
                },
            },

            {
                id: 'gross_performance',
                component: ReportComponentWrapper,
                allow_description: true,
                caption: {
                    text_body_provider: overview_text,
                    max_length: 500,
                    rows: 6,
                },
                widget_config: {
                    component: PortfolioUpdateOverview,
                    dependencies: [datasources.vehicle_overview.get_id()],
                    data: datasources.vehicle_overview.data,
                    render_currency: render_currency,
                },
            },
            {
                id: 'portfolio_details',
                component: ReportComponentWrapper,
                allow_description: true,
                disable_sorting: true,
                caption: {
                    text_body_provider: deal_text,
                    max_length: 500,
                    rows: 6,
                },
                widget_config: {
                    inline_data: true,
                    css: {'table-light': true, 'table-sm': true},
                    component: DataTable,
                    columns: portfolio_details_table_cols,
                    disable_sorting: true,
                    datasource: {
                        type: 'dynamic',
                        key: 'companies',
                        one_required: ['user_fund_uid', 'portfolio_uid'],
                        query: get_default_query('vehicle:gross'),
                    },
                    render_currency: render_currency,
                },
            },

            {
                id: 'company_details',
                component: ReportComponentWrapper,
                allow_description: false,
                caption: {
                    text_body_provider: overview_text,
                    max_length: 500,
                    rows: 6,
                },
                widget_config: {
                    component: PortfolioUpdateCompanyDetails,
                    dependencies: [
                        datasources.vehicle_overview.get_id(),
                        datasources.operating_metrics.get_id(),
                    ],
                    data: ko.pureComputed(() => {
                        let vehicle_overview = datasources.vehicle_overview.data();
                        let operating_metrics = datasources.operating_metrics.data();
                        if (vehicle_overview && operating_metrics) {
                            return {
                                vehicle_overview: vehicle_overview,
                                operating_metrics: operating_metrics,
                            };
                        }
                    }),
                },
            },
        ],
    };

    self.viewer_layout = {
        id: 'layout',
        component: PageLayout,
        page_css: 'fbr',
        // enable_toc: true,
        enable_toc: false,
        toc_page_number: 2,
        mode: 'view',
        pages: pages,
        components: [
            {
                id: 'fund_meta_data',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    id: 'fund_meta_data',
                    report: self.report,
                    template: 'tpl_fbr_report_cover',
                    include_meta: false,
                    component: ReportMeta,
                    report_title: report_title,
                    data_map: {
                        as_of_date: {
                            key: 'params:as_of_date',
                            format: 'backend_date_quarterly',
                        },
                        logo_src: {
                            key: 'params:logo_src',
                            default_value: require('src/img/fake_logo.png'),
                        },
                    },
                },
            },
            {
                id: 'portfolio_details',
                template: 'tpl_report_component_wrapper_view',
                component: DataTablePageWrapper,
                allow_description: true,
                max_per_page: 30,
                caption: {
                    text_body_provider: deal_text,
                    rows: 6,
                },
                widget_config: {
                    disable_sorting: true,
                    inline_data: true,
                    css: {'table-light': true, 'table-sm': true},
                    component: DataTable,
                    columns: portfolio_details_table_cols,
                },
            },
            {
                id: 'gross_performance',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                caption: {
                    text_body_provider: overview_text,
                    rows: 6,
                },
                widget_config: {
                    component: PortfolioUpdateOverview,
                },
            },
            {
                id: 'company_details',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                caption: {
                    text_body_provider: overview_text,
                    rows: 6,
                },
                widget_config: {
                    component: PortfolioUpdateCompanyDetails,
                    events: self.events,
                },
            },
        ],
    };

    self.editor = self.new_instance(Editor, {
        id: 'editor',
        report: self.report,
        cpanel: {
            id: 'cpanel',
            components: editor_cpanel_components,
        },
        body: {
            layout_engine: self.editor_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
                portfolio_uid_event: self.events.get('portfolio_uid'),
            }),
            toolbar: self.helpers.body.editor_toolbar({
                preview_event: self.events.get('preview'),
                disable_event: self.events.get('disable_preview'),
                start_disabled: true,
            }),
        },
    });

    self.viewer = self.new_instance(Viewer, {
        id: 'viewer',
        report: self.report,
        body: {
            layout_engine: self.viewer_layout,
            header: self.helpers.body.breadcrumb_header({
                report: self.report,
                user_fund_uid_event: self.events.get('user_fund_uid'),
                portfolio_uid_event: self.events.get('portfolio_uid'),
                css: {'sub-page-header': true},
            }),
            toolbar: self.helpers.body.viewer_toolbar({
                edit_event: self.events.get('edit'),
                report: self.report,
            }),
        },
    });

    self.wizard = self.new_instance(Wizard, {
        id: 'wizard',
        cashflow_type: 'gross',
        entity_types: ['user_fund', 'portfolio'],
        breadcrumb_label: report_title,
        callback: entity => {
            self.create_report(entity, report => {
                self.report(report);
                self.navigate('edit', report);
            });
        },
    });

    self.when(self.editor, self.viewer, self.wizard).done(() => {
        Observer.broadcast(
            self.events.get('register_export'),
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: self.events.get('download_pdf'),
            },
            true,
        );

        Observer.register(self.events.get('download_pdf'), () => {
            let report = self.report();
            let download_url = `${config.api_base_url}download/${report.report_type}/pdf/${report.uid}`;
            if (!report.is_frozen || !report.binary_asset_uid) {
                self.publish_report(() => {
                    DataThing.form_post(download_url);
                });
            } else {
                DataThing.form_post(download_url);
            }
        });

        Observer.register(self.events.get('edit'), () => {
            self.navigate('edit', self.report());
        });

        Observer.register(self.events.get('preview'), () => {
            let updates = self.editor.get_full_snapshot();
            self.editor.loading(true);
            self.update_report(updates, report => {
                self.editor.loading(false);
                self.navigate('view', report);
            });
        });

        Observer.register(self.events.get('save_draft'), () => {
            let updates = self.editor.get_static_snapshot();
            self.update_report(updates, () => {
                bison.utils.Notify(
                    'Draft Saved!',
                    '',
                    'alert-success',
                    1500,
                    undefined,
                    '<div class="system_notification alert alert-dismissable" style="display:none; width: 200px; text-align: center; position: absolute; top: 33px; left: 50%; margin-left: 50px;"><button type="button" class="close" data-dismiss="alert">&times;</button></div>',
                );
            });
        });

        self.report.subscribe(report => {
            if (report && report.params) {
                if (report.params.entity_type) {
                    if (report.params.entity_type == 'portfolio') {
                        Observer.broadcast(self.events.get('user_fund_uid'), undefined);
                    }
                    if (report.params.entity_type == 'user_fund') {
                        Observer.broadcast(self.events.get('portfolio_uid'), undefined);
                    }
                }
                Observer.broadcast(self.events.get('entity_type'), report.params.entity_type);
                Observer.broadcast(self.events.get('entity_uid'), report.params.entity_uid);
            }
            self.broadcast_uid(report);
        });

        self.set_state(self.initial_state);

        self.editor.body_loading.subscribe(loading => {
            Observer.broadcast(self.events.get('disable_preview'), loading);
        });

        _dfd.resolve();
    });
    return self;
}
