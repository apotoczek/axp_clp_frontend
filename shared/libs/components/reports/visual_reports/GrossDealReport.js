/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTablePageWrapper from 'src/libs/components/reports/visual_reports/DataTablePageWrapper';
import TotalValueChart from 'src/libs/components/charts/TotalValueChart';
import WaterfallChart from 'src/libs/components/charts/WaterfallChart';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import BarChart from 'src/libs/components/charts/BarChart';
import Row from 'src/libs/components/basic/Row';
import EventButton from 'src/libs/components/basic/EventButton';
import GrossCashflowOverview from 'src/libs/components/analytics/GrossCashflowOverview';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import DataTable from 'src/libs/components/reports/visual_reports/DataTable';
import BubbleChart from 'src/libs/components/charts/BubbleChart';
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
import DataThing from 'src/libs/DataThing';
import * as Formatters from 'src/libs/Formatters';
import DataSource from 'src/libs/DataSource';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import PopoverNestedChecklist from 'src/libs/components/popovers/PopoverNestedChecklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';

export default function(opts, components) {
    let self = new Report(opts, components);

    self.sub_type = 'deal_report';
    self.__class__ = 'GrossDealReport';

    let report_title = 'Deal Intelligence Report';

    let _dfd = self.new_deferred();

    self.events.new('user_fund_uid');
    self.events.new('portfolio_uid');
    self.events.new('market_data_fund_uid');
    self.events.new('market_data_family_uid');
    self.events.new('preview');
    self.events.new('disable_preview');
    self.events.new('edit');
    self.events.new('download_pdf');

    self.disabled_attributes = ko.observable(false);
    self.events.resolve_and_add('as_of_date', 'PopoverButton.value');
    self.events.resolve_and_add('new_sector', 'PopoverButton.value');
    self.events.resolve_and_add('save_draft', 'ActionButton.action.save_draft');
    self.events.resolve_and_add('clear_filters', 'EventButton');
    self.events.resolve_and_add('enum_attributes', 'AttributeFilters.state');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');
    self.events.resolve_and_add('custom_attributes_filter', 'AttributeFilters.state');

    let _make_statistic_rows = data => {
        let first = Object.values(data['metrics'][0]['data']);
        let second = Object.values(data['metrics'][1]['data']);
        let get_avg = items => items.reduce((a, b) => a + b) / items.length;
        return [
            {name: 'Max', first: Math.max(...first), second: Math.max(...second)},
            {name: 'Average', first: get_avg(first), second: get_avg(second)},
            {name: 'Min', first: Math.min(...first), second: Math.min(...second)},
        ];
    };

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
            market_data_fund_uid: {
                type: 'observer',
                event_type: self.events.get('market_data_fund_uid'),
            },
            market_data_family_uid: {
                type: 'observer',
                event_type: self.events.get('market_data_family_uid'),
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
                    user_fund_uid: {
                        type: 'observer',
                        event_type: self.events.resolve_event('market_fund', 'PopoverButton.value'),
                    },
                    company_uid: {
                        type: 'observer',
                        event_type: self.events.resolve_event('company', 'PopoverButton.value'),
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
            market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
            market_data_family_uid_event: self.events.get('market_data_family_uid'),
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
            id: 'company',
            label: 'Company',
            clear_event: self.events.get('clear_filters'),
            visible_callback: chklist => chklist.data(),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    label_key: 'name',
                    value_key: 'uid',
                    additional_keys: ['parent_name'],
                },
                query: {
                    target: 'vehicles',
                    results_per_page: 'all',
                    filters: {
                        type: 'dynamic',
                        one_required: [
                            'in_user_fund_uid',
                            'in_portfolio_uid',
                            'in_market_data_fund_uid',
                        ],
                        query: {
                            in_user_fund_uid: {
                                type: 'observer',
                                event_type: self.events.get('user_fund_uid'),
                            },
                            in_portfolio_uid: {
                                type: 'observer',
                                event_type: self.events.get('portfolio_uid'),
                            },
                            in_market_data_fund_uid: {
                                type: 'observer',
                                event_type: self.events.get('market_data_fund_uid'),
                            },
                            entity_type: 'company',
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
            id: 'market_fund',
            label: 'Fund',
            clear_event: self.events.get('clear_filters'),
            visible_callback: chklist => chklist.data(),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: 'to_options',
                mapping_args: {
                    label_key: 'name',
                    value_key: 'uid',
                    additional_keys: ['parent_name'],
                },
                query: {
                    target: 'vehicles',
                    results_per_page: 'all',
                    filters: {
                        type: 'dynamic',
                        // one_required: ['in_family_uid'],
                        query: {
                            in_family_uid: {
                                type: 'observer',
                                event_type: self.events.get('market_data_family_uid'),
                                required: true,
                            },
                            entity_type: 'market_data_family',
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
            id: 'manager',
            label: 'Manager',
            clear_event: self.events.get('clear_filters'),
            strings: {
                no_selection: 'All',
            },
            datasource: {
                type: 'dynamic',
                mapping: 'list_to_options',
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
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
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: self.events.get('market_data_fund_uid'),
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: self.events.get('market_data_family_uid'),
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
            disabled: self.disabled_attributes,
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
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
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
                    market_data_fund_uid: {
                        type: 'observer',
                        event_type: self.events.get('market_data_fund_uid'),
                    },
                    market_data_family_uid: {
                        type: 'observer',
                        event_type: self.events.get('market_data_family_uid'),
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
                active_template: 'in_popover',
                clear_event: self.events.get('clear_filters'),
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
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                query: get_default_query('vehicle:gross', {cashflow_type: 'gross'}),
            },
        }),
        tvpi_loss_sector: self.new_instance(DataSource, {
            datasource: {
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                mapping: c => c.breakdown.items.sortBy('paid_in', true),
                query: get_default_query('vehicle:gross', {
                    breakdown_key: 'sector',
                    cashflow_type: 'gross',
                    include_morningstar: true,
                }),
            },
        }),
        tvpi_loss_leader: self.new_instance(DataSource, {
            datasource: {
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                mapping: c => c.breakdown.items.sortBy('paid_in', true),
                query: get_default_query('vehicle:gross', {
                    breakdown_key: 'deal_team_leader',
                    cashflow_type: 'gross',
                }),
            },
        }),
        tvpi_loss_vintage: self.new_instance(DataSource, {
            datasource: {
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                mapping: c => c.breakdown.items.sortBy('vintage_year'),
                query: get_default_query('vehicle:gross', {
                    breakdown_key: 'vintage_year',
                    cashflow_type: 'gross',
                }),
            },
        }),
        tvpi_loss_deal_source: self.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                mapping: c => c.breakdown.items.sortBy('paid_in', true),
                query: get_default_query('vehicle:gross', {
                    breakdown_key: 'deal_source',
                    cashflow_type: 'gross',
                }),
            },
        }),
        growth_by_company: self.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                query: get_default_query('vehicle:gross:growth_by_company', {
                    cashflow_type: 'gross',
                }),
                order_by: [{name: 'first_date'}],
            },
        }),
        ev_multiples_by_company: self.new_instance(DataSource, {
            datasource: {
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                query: get_default_query('vehicle:gross:ev_multiples_by_company', {
                    cashflow_type: 'gross',
                }),
                order_by: [{name: 'first_date'}],
            },
        }),
        dispersion_of_returns: self.new_instance(DataSource, {
            datasource: {
                one_required: [
                    'user_fund_uid',
                    'portfolio_uid',
                    'market_data_fund_uid',
                    'market_data_family_uid',
                ],
                type: 'dynamic',
                query: get_default_query('vehicle:gross:fund_dispersion_of_returns', {
                    cashflow_type: 'gross',
                }),
            },
        }),
    };

    let render_currency = ko.pureComputed(() => {
        let data = datasources.vehicle_overview.data();
        if (data) {
            return data.render_currency;
        }
    });

    let performance_config = {
        component: BubbleChart,
        label_key: 'name',
        x_key: 'loss_ratio',
        x_label: 'Loss Ratio',
        x_format: 'percent',
        y_key: 'tvpi',
        y_label: 'TVPI',
        y_format: 'multiple',
        z_key: 'paid_in',
        z_label: 'Invested',
        z_format: {
            format: 'money',
            format_args: {
                render_currency: render_currency,
            },
        },
    };

    let formatters = {
        date: Formatters.backend_date,
        multiple: Formatters.multiple,
        percent: Formatters.percent,
        money: Formatters.gen_formatter({
            format: 'money',
            format_args: {render_currency: render_currency},
        }),
    };

    let fmtd_entity_type = ko.pureComputed(() => {
        let report = self.report();
        if (report) {
            let entity_type = (report.params || {}).entity_type || 'user_fund';
            return entity_type === 'portfolio' ? 'portfolio' : 'fund';
        }
    });

    let overview_title = ko.pureComputed({
        read: () => {
            let fmtd = fmtd_entity_type();
            if (fmtd) {
                return `${Formatters.titleize(fmtd)} Overview`;
            }
        },
        write: () => {},
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

    let fund_overview_2_text = oneLine`
            The charts on this page help you understand the high level story
            about your portfolio.
        `;

    let dispersion_text = ko.pureComputed(() => {
        let data = datasources.vehicle_overview.data();

        if (!data) {
            return '';
        }

        let loss_ratio = data.loss_ratio;
        let total_loss_ratio = data.total_loss_ratio;

        let first = oneLine`
                The dispersion of returns illustrates the amount of capital
                that is invested in each of the four TVPI multiple ranges.
            `;

        if (loss_ratio === undefined || total_loss_ratio === undefined) {
            return first;
        }

        let second = oneLine`
                The fund's loss ratio is ${formatters.percent(loss_ratio)}, which is represented
                by the amount of capital valued below 1.0x. The fund's total loss ratio is
                ${formatters.percent(total_loss_ratio)}, which is equal to the amount of
                invested capital that is currently written off.
            `;

        return `${first}\n\n${second}`;
    });

    let valuation_bridge_text = ko.pureComputed(
        () =>
            'The valuation bridge dissects the key operational categories that are ' +
            `driving your ${fmtd_entity_type()}'s value.`,
    );

    let total_value_curve_text = ko.pureComputed(
        () =>
            'The total value curve illustrates what proportion each company ' +
            `represents as a % of the ${fmtd_entity_type()}'s total value. A 45 ` +
            `degree straight line would indicate the  ${fmtd_entity_type()}'s ` +
            'total value is evenly distributed across the portfolio companies. A line ' +
            'that is bowed downwards indicates that total value is concentrated in ' +
            'fewer deals.',
    );

    let make_performance_table = (name_label, datasource) => {
        let rv = {
            inline_data: true,
            component: DataTable,
            columns: [
                {
                    key: 'name',
                    label: name_label,
                },
                {
                    key: 'vehicle_count',
                    label: '# Deals',
                },
                {
                    sort_key: 'paid_in',
                    label: 'Invested',
                    format: 'money',
                    format_args: {
                        currency_key: 'render_currency',
                        value_key: 'paid_in',
                    },
                },
                {
                    key: 'tvpi',
                    label: 'TVPI',
                    format: 'multiple',
                },
                {
                    key: 'loss_ratio',
                    label: 'Loss Ratio',
                    format: 'percent',
                },
            ],
            enable_column_toggle: false,
            enable_csv_export: false,
            results_per_page: 20,
            css: {'table-light': true, 'table-sm': true},
        };

        if (datasource) {
            rv.data = datasource.data;
            rv.dependencies = [datasource.get_id()];
        }

        return rv;
    };

    let overview_table_cols = [
        {
            label: 'Name',
            key: 'name',
            format: 'truncate',
            format_args: {
                max_length: 15,
            },
        },
        {
            label: 'Year',
            key: 'vintage_year',
            format: 'strings',
        },
        {
            label: 'Holding',
            key: 'age_years',
            visible: false,
            format: 'years',
        },
        {
            label: 'Invested',
            format: 'money',
            format_args: {
                value_key: 'paid_in',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Realized',
            format: 'money',
            format_args: {
                value_key: 'distributed',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'Unrealized',
            format: 'money',
            format_args: {
                value_key: 'nav',
                currency_key: 'render_currency',
            },
        },
        {
            label: 'IRR',
            key: 'irr',
            format: 'irr',
        },
        {
            label: 'TVPI',
            key: 'tvpi',
            format: 'multiple',
        },
        {
            label: 'DPI',
            key: 'dpi',
            format: 'multiple',
        },
        {
            label: 'RVPI',
            key: 'rvpi',
            format: 'multiple',
        },
        {
            label: 'Status',
            key: 'transaction_status',
            format: 'strings',
        },
    ];

    let pages = [
        {
            layout: ['fund_meta_data'],
            is_cover: true,
        },
        {
            title: overview_title,
            subtitle: 'Gross Performance',
            layout: ['gross_performance'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Details',
            multi_page: true,
            layout: ['deal_details'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Details',
            layout: ['fund_overview_1', 'fund_overview_2'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Details',
            layout: ['pme_alpha'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Analysis',
            layout: ['tvpi_loss_sector', 'tvpi_loss_sector_table'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Analysis',
            layout: ['tvpi_loss_leader', 'tvpi_loss_leader_table'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Analysis',
            layout: ['tvpi_loss_vintage', 'tvpi_loss_vintage_table'],
        },
        {
            title: overview_title,
            subtitle: 'Deal Analysis',
            layout: ['tvpi_loss_deal_source', 'tvpi_loss_deal_source_table'],
        },
        {
            title: 'Operational Performance',
            subtitle: 'Growth by Company',
            layout: ['ev_multiples_by_company', 'ev_multiples_by_company_table'],
        },
        {
            title: 'Operational Performance',
            subtitle: 'Growth by Company',
            layout: ['growth_by_company', 'growth_by_company_table'],
        },
        {
            title: 'Operational Performance',
            subtitle: 'Valuation Bridge',
            layout: ['valuation_bridge'],
        },
        {
            title: 'Risk Analysis',
            layout: ['total_value_curve', 'dispersion_of_returns'],
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
                    market_type: 'gross',
                    logo_id: 'report_logo',
                    title_id: 'report_name',
                    datasources: {
                        characteristics: {
                            type: 'dynamic',
                            one_required: [
                                'user_fund_uid',
                                'portfolio_uid',
                                'market_data_fund_uid',
                                'market_data_family_uid',
                            ],
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
                                market_data_fund_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('market_data_fund_uid'),
                                },
                                market_data_family_uid: {
                                    type: 'observer',
                                    event_type: self.events.get('market_data_family_uid'),
                                },
                                include_attributes: true,
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
                    component: GrossCashflowOverview,
                    dependencies: [datasources.vehicle_overview.get_id()],
                    data: datasources.vehicle_overview.data,
                },
            },
            {
                id: 'deal_details',
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
                    columns: overview_table_cols,
                    disable_sorting: true,
                    datasource: {
                        type: 'dynamic',
                        key: 'companies',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: get_default_query('vehicle:gross', {cashflow_type: 'gross'}),
                    },
                },
            },
            {
                id: 'fund_overview_1',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Row,
                    components: [
                        {
                            id: 'holding_period_chart',
                            label: 'Holding Period by Company',
                            vertical_bars: true,
                            label_in_chart: true,
                            component: BarChart,
                            value_key: 'age_years',
                            label_key: 'name',
                            datasource: {
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                type: 'dynamic',
                                mapping: x =>
                                    x.companies ? x.companies.sortBy('first_date') : undefined,
                                query: get_default_query('vehicle:gross', {cashflow_type: 'gross'}),
                            },
                        },
                        {
                            id: 'invested_chart',
                            label: 'Invested by Company',
                            vertical_bars: true,
                            label_in_chart: true,
                            component: BarChart,
                            value_key: 'paid_in',
                            label_key: 'name',
                            format: 'money',
                            format_args: {
                                render_currency: render_currency,
                            },
                            datasource: {
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                mapping: x =>
                                    x.companies ? x.companies.sortBy('first_date') : undefined,
                                query: get_default_query('vehicle:gross', {cashflow_type: 'gross'}),
                            },
                        },
                    ],
                    columns: ['invested_chart', 'holding_period_chart'],
                },
            },
            {
                id: 'fund_overview_2',
                component: ReportComponentWrapper,
                allow_description: true,
                caption: {
                    text_body_provider: fund_overview_2_text,
                    max_length: 500,
                    rows: 6,
                },
                widget_config: {
                    component: Row,
                    components: [
                        {
                            id: 'tvpi_chart',
                            label: 'TVPI by Company',
                            label_in_chart: true,
                            vertical_bars: true,
                            component: BarChart,
                            value_key: 'tvpi',
                            label_key: 'name',
                            format: 'multiple',
                            datasource: {
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                type: 'dynamic',
                                mapping: x =>
                                    x.companies ? x.companies.sortBy('first_date') : undefined,
                                query: get_default_query('vehicle:gross', {cashflow_type: 'gross'}),
                            },
                        },
                        {
                            id: 'pme_alpha',
                            label: 'PME Alpha by Company',
                            label_in_chart: true,
                            vertical_bars: true,
                            component: BarChart,
                            value_key: 'pme_alpha',
                            label_key: 'company',
                            format: 'percent',
                            data_key: 'data',
                            sublabel_fn: data => (data ? data.meta.pme_index : undefined),
                            datasource: {
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                type: 'dynamic',
                                query: get_default_query('vehicle:gross:company_pme_alphas', {
                                    cashflow_type: 'gross',
                                }),
                                order_by: 'first_date',
                            },
                        },
                    ],
                    columns: ['tvpi_chart', 'pme_alpha'],
                },
            },
            {
                id: 'growth_by_company',
                title: 'EBITDA & Revenue Growth',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'percent',
                    depencencies: [datasources.growth_by_company.get_id()],
                    data: datasources.growth_by_company.data,
                },
            },
            {
                id: 'growth_by_company_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: {
                    inline_data: true,
                    component: DataTable,
                    columns: [
                        {
                            key: 'name',
                            label: 'Statistic',
                        },
                        {
                            key: 'first',
                            label: 'Revenue',
                            format: 'percent',
                        },
                        {
                            key: 'second',
                            label: 'EBITDA',
                            format: 'percent',
                        },
                    ],
                    enable_column_toggle: false,
                    enable_csv_export: false,
                    results_per_page: 20,
                    disable_sorting: true,
                    css: {'table-light': true, 'table-sm': true},
                    data: ko.pureComputed({
                        read: () => {
                            let data = datasources.growth_by_company.data();
                            if (data) {
                                return _make_statistic_rows(data);
                            }
                        },
                        write: () => {},
                    }),
                },
            },
            {
                id: 'ev_multiples_by_company',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'EV/EBITDA by Company',
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'multiple',
                    data: datasources.ev_multiples_by_company.data,
                    depencencies: [datasources.ev_multiples_by_company.get_id()],
                },
            },
            {
                id: 'ev_multiples_by_company_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: {
                    inline_data: true,
                    component: DataTable,
                    columns: [
                        {
                            key: 'name',
                            label: 'Statistic',
                        },
                        {
                            key: 'first',
                            label: 'Entry',
                            format: 'multiple',
                        },
                        {
                            key: 'second',
                            label: 'Current',
                            format: 'multiple',
                        },
                    ],
                    enable_column_toggle: false,
                    enable_csv_export: false,
                    results_per_page: 20,
                    disable_sorting: true,
                    css: {'table-light': true, 'table-sm': true},
                    data: ko.pureComputed({
                        read: () => {
                            let data = datasources.ev_multiples_by_company.data();
                            if (data) {
                                return _make_statistic_rows(data);
                            }
                        },
                        write: () => {},
                    }),
                },
            },
            {
                id: 'valuation_bridge',
                component: ReportComponentWrapper,
                allow_description: true,
                caption: {
                    text_body_provider: valuation_bridge_text,
                    max_length: 500,
                    rows: 6,
                },
                title: 'Valuation Bridge',
                widget_config: {
                    component: WaterfallChart,
                    id: 'bridge_chart',
                    loading: self.loading,
                    bars: [
                        {
                            name: 'Invested Capital',
                            key: 'paid_in',
                            color: '#4D4D4D',
                        },
                        {
                            name: 'Revenue Growth',
                            key: 'revenue_growth',
                        },
                        {
                            name: 'Margin Improvement',
                            key: 'margin_improvement',
                        },
                        {
                            name: 'Platform Expansion',
                            key: 'platform_expansion',
                        },
                        {
                            name: 'Add-on Expansion',
                            key: 'addon_expansion',
                        },
                        {
                            name: 'Debt Paydown',
                            key: 'debt_paydown',
                        },
                        {
                            name: 'Other Growth',
                            key: 'other',
                        },
                        {
                            name: 'Total Value',
                            sum: true,
                            color: '#4D4D4D',
                        },
                    ],
                    format: 'money',
                    format_args: {
                        render_currency: render_currency,
                    },
                    template: 'tpl_chart_box',
                    datasource: {
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        key: 'fund',
                        type: 'dynamic',
                        query: get_default_query('vehicle:gross:valuation_bridge', {
                            include_market: false,
                            include_valuations: false,
                            cashflow_type: 'gross',
                        }),
                    },
                },
            },
            {
                id: 'dispersion_of_returns',
                component: ReportComponentWrapper,
                allow_description: true,
                caption: {
                    text_body_provider: dispersion_text,
                    max_length: 500,
                    rows: 6,
                },
                title: 'Dispersion of Returns',
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'percent',
                    data: datasources.dispersion_of_returns.data,
                    dependencies: [datasources.dispersion_of_returns.get_id()],
                },
            },
            {
                id: 'total_value_curve',
                title: 'Total Value Curve',
                component: ReportComponentWrapper,
                allow_description: true,
                caption: {
                    text_body_provider: total_value_curve_text,
                    max_length: 500,
                    rows: 6,
                },
                widget_config: {
                    component: TotalValueChart,
                    cashflow_chart_template: 'tpl_chart',
                    format: 'percent',
                    datasource: {
                        type: 'dynamic',
                        one_required: [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ],
                        query: get_default_query('vehicle:gross:fund_risk_curve', {
                            cashflow_type: 'gross',
                        }),
                    },
                },
            },
            {
                id: 'tvpi_loss_sector',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Performance by Sector',
                widget_config: Object.assign(
                    {
                        data: datasources.tvpi_loss_sector.data,
                        dependencies: [datasources.tvpi_loss_sector.get_id()],
                    },
                    performance_config,
                ),
            },
            {
                id: 'tvpi_loss_sector_table',
                allow_description: false,
                component: ReportComponentWrapper,
                widget_config: make_performance_table('Sector', datasources.tvpi_loss_sector),
            },
            {
                id: 'tvpi_loss_leader',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Performance by Deal Team Leader',
                widget_config: Object.assign(
                    {
                        data: datasources.tvpi_loss_leader.data,
                        dependencies: [datasources.tvpi_loss_leader.get_id()],
                    },
                    performance_config,
                ),
            },
            {
                id: 'tvpi_loss_leader_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table(
                    'Deal Team Leader',
                    datasources.tvpi_loss_leader,
                ),
            },
            {
                id: 'tvpi_loss_vintage',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Performance by Deal Year',
                widget_config: Object.assign(
                    {
                        data: datasources.tvpi_loss_vintage.data,
                        dependencies: [datasources.tvpi_loss_vintage.get_id()],
                        sort_key: 'vintage_year',
                        sort_order: 'asc',
                    },
                    performance_config,
                ),
            },
            {
                id: 'tvpi_loss_vintage_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table('Deal Year', datasources.tvpi_loss_vintage),
            },
            {
                id: 'tvpi_loss_deal_source',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Performance by Deal Source',
                widget_config: Object.assign(
                    {
                        data: datasources.tvpi_loss_deal_source.data,
                        dependencies: [datasources.tvpi_loss_deal_source.get_id()],
                    },
                    performance_config,
                ),
            },
            {
                id: 'tvpi_loss_deal_source_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table(
                    'Deal Source',
                    datasources.tvpi_loss_deal_source,
                ),
            },
        ],
    };

    self.viewer_layout = {
        id: 'layout',
        component: PageLayout,
        page_css: 'fbr',
        enable_toc: true,
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
                        geography: {
                            key: 'characteristics:attributes:geography',
                            format: 'strings',
                        },
                        style: {
                            key: 'characteristics:attributes:style',
                            format: 'strings',
                        },
                        vintage_year: {
                            key: 'characteristics:vintage_year',
                        },
                        logo_src: {
                            key: 'params:logo_src',
                            default_value: require('src/img/fake_logo.png'),
                        },
                    },
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
                    component: GrossCashflowOverview,
                },
            },
            {
                id: 'deal_details',
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
                    columns: overview_table_cols,
                },
            },
            {
                id: 'growth_by_company',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'EBITDA & Revenue Growth',
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'percent',
                },
            },
            {
                id: 'growth_by_company_table',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: {
                    inline_data: true,
                    component: DataTable,
                    columns: [
                        {
                            key: 'name',
                            label: 'Statistic',
                        },
                        {
                            key: 'first',
                            label: 'Revenue',
                            format: 'percent',
                        },
                        {
                            key: 'second',
                            label: 'EBITDA',
                            format: 'percent',
                        },
                    ],
                    enable_column_toggle: false,
                    enable_csv_export: false,
                    results_per_page: 20,
                    disable_sorting: true,
                    css: {'table-light': true, 'table-sm': true},
                },
            },
            {
                id: 'ev_multiples_by_company',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'EV/EBITDA by Company',
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'multiple',
                },
            },
            {
                id: 'ev_multiples_by_company_table',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: {
                    inline_data: true,
                    component: DataTable,
                    columns: [
                        {
                            key: 'name',
                            label: 'Statistic',
                        },
                        {
                            key: 'first',
                            label: 'Entry',
                            format: 'multiple',
                        },
                        {
                            key: 'second',
                            label: 'Current',
                            format: 'multiple',
                        },
                    ],
                    enable_column_toggle: false,
                    enable_csv_export: false,
                    results_per_page: 20,
                    disable_sorting: true,
                    css: {'table-light': true, 'table-sm': true},
                },
            },
            {
                id: 'valuation_bridge',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Valuation Bridge',
                caption: {
                    text_body_provider: valuation_bridge_text,
                    rows: 6,
                },
                widget_config: {
                    component: WaterfallChart,
                    loading: self.loading,
                    bars: [
                        {
                            name: 'Invested Capital',
                            key: 'paid_in',
                            color: '#4D4D4D',
                        },
                        {
                            name: 'Revenue Growth',
                            key: 'revenue_growth',
                        },
                        {
                            name: 'Margin Improvement',
                            key: 'margin_improvement',
                        },
                        {
                            name: 'Platform Expansion',
                            key: 'platform_expansion',
                        },
                        {
                            name: 'Add-on Expansion',
                            key: 'addon_expansion',
                        },
                        {
                            name: 'Debt Paydown',
                            key: 'debt_paydown',
                        },
                        {
                            name: 'Other Growth',
                            key: 'other',
                        },
                        {
                            name: 'Total Value',
                            sum: true,
                            color: '#4D4D4D',
                        },
                    ],
                    format: 'money',
                    format_args: {
                        render_currency: render_currency,
                    },
                },
            },
            {
                id: 'dispersion_of_returns',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Dispersion of Returns',
                caption: {
                    text_body_provider: dispersion_text,
                    rows: 6,
                },
                widget_config: {
                    component: GroupedBarChart,
                    template: 'tpl_chart_box',
                    format: 'percent',
                },
            },
            {
                id: 'total_value_curve',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'Total Value Curve',
                caption: {
                    rows: 6,
                    text_body_provider: total_value_curve_text,
                },
                widget_config: {
                    component: TotalValueChart,
                    cashflow_chart_template: 'tpl_chart',
                    format: 'percent',
                },
            },
            {
                id: 'fund_overview_1',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Row,
                    components: [
                        {
                            id: 'holding_period_chart',
                            vertical_bars: true,
                            label: 'Holding Period by Company',
                            label_in_chart: true,
                            component: BarChart,
                            value_key: 'age_years',
                            label_key: 'name',
                        },
                        {
                            id: 'invested_chart',
                            label: 'Invested by Company',
                            vertical_bars: true,
                            label_in_chart: true,
                            component: BarChart,
                            value_key: 'paid_in',
                            label_key: 'name',
                            format: 'money',
                            format_args: {
                                render_currency: render_currency,
                            },
                        },
                    ],
                    columns: ['invested_chart', 'holding_period_chart'],
                },
            },
            {
                id: 'fund_overview_2',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                caption: {
                    text_body_provider: fund_overview_2_text,
                    rows: 6,
                },
                widget_config: {
                    component: Row,
                    components: [
                        {
                            id: 'tvpi_chart',
                            label: 'TVPI by Company',
                            label_in_chart: true,
                            vertical_bars: true,
                            component: BarChart,
                            value_key: 'tvpi',
                            label_key: 'name',
                            format: 'multiple',
                        },
                        {
                            id: 'pme_alpha',
                            label: 'PME Alpha by Company',
                            label_in_chart: true,
                            vertical_bars: true,
                            component: BarChart,
                            value_key: 'pme_alpha',
                            label_key: 'company',
                            format: 'percent',
                            data_key: 'data',
                            sublabel_fn: data => (data ? data.meta.pme_index : undefined),
                        },
                    ],
                    columns: ['tvpi_chart', 'pme_alpha'],
                },
            },
            {
                id: 'tvpi_loss_sector',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'Performance by Sector',
                widget_config: performance_config,
            },
            {
                id: 'tvpi_loss_sector_table',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table('Sector'),
            },
            {
                id: 'tvpi_loss_leader',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'Performance by Deal Team Leader',
                widget_config: performance_config,
            },
            {
                id: 'tvpi_loss_leader_table',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table('Deal Team Leader'),
            },
            {
                id: 'tvpi_loss_vintage',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                title: 'Performance by Deal Year',
                widget_config: Object.assign(
                    {
                        sort_key: 'vintage_year',
                        sort_order: 'asc',
                    },
                    performance_config,
                ),
            },
            {
                id: 'tvpi_loss_vintage_table',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table('Deal Year'),
            },
            {
                id: 'tvpi_loss_deal_source',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                title: 'Performance by Deal Source',
                widget_config: performance_config,
            },
            {
                id: 'tvpi_loss_deal_source_table',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                allow_description: false,
                widget_config: make_performance_table('Deal Source'),
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
                market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
                market_data_family_uid_event: self.events.get('market_data_family_uid'),
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
                market_data_fund_uid_event: self.events.get('market_data_fund_uid'),
                market_data_family_uid_event: self.events.get('market_data_family_uid'),
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
        entity_types: ['user_fund', 'portfolio', 'market_data_fund', 'market_data_family'],
        breadcrumb_label: report_title,
        callback: entity => {
            self.create_report(entity, report => {
                self.report(report);
                self.navigate('edit', report);
            });
        },
    });

    self.when(
        self.editor,
        self.viewer,
        self.wizard,
        datasources.tvpi_loss_sector,
        datasources.tvpi_loss_leader,
        datasources.tvpi_loss_vintage,
        datasources.tvpi_loss_deal_source,
        datasources.growth_by_company,
        datasources.ev_multiples_by_company,
    ).done(() => {
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
                    if (report.params.entity_type == 'user_fund') {
                        Observer.broadcast(self.events.get('user_fund_uid'), undefined);
                    }
                    if (report.params.entity_type == 'portfolio') {
                        Observer.broadcast(self.events.get('portfolio_uid'), undefined);
                    }
                    if (report.params.entity_type == 'market_data_fund') {
                        self.disabled_attributes(true);
                        Observer.broadcast(self.events.get('market_data_fund_uid'), undefined);
                    }
                    if (report.params.entity_type == 'market_data_family') {
                        self.disabled_attributes(true);
                        Observer.broadcast(self.events.get('market_data_family_uid'), undefined);
                    }
                }
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
