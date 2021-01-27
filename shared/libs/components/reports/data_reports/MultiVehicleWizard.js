import auth from 'auth';
import bison from 'bison';
import ko from 'knockout';
import lang from 'lang';
import pager from 'pager';

import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';

import ComponentHelper from 'src/libs/helpers/ComponentHelper';

import MetaInfo from 'src/libs/components/MetaInfo';

import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Checklist from 'src/libs/components/basic/Checklist';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import Radiolist from 'src/libs/components/basic/Radiolist';
import SelectionDataTable from 'src/libs/components/basic/SelectionDataTable';
import StringFilter from 'src/libs/components/basic/StringFilter';
import TextInput from 'src/libs/components/basic/TextInput';
import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';

import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';

import DataReportSettings from 'src/libs/components/reports/data_reports/DataReportSettings';

/* <button
    class="btn btn-default btn-large pull-right"
    data-bind="
        click: show_settings,
        visible: has_settings
    "
    style="margin-right: 5px;"
>
    <span
        class="btn-icon glyphicon glyphicon-cog"
    ></span> Settings
</button> */

const DEFAULT_TEMPLATE = `
    <!-- ko renderComponent: cpanel --><!-- /ko -->

    <div class="layout-aside page analytics">
        <div class="layout-vbox">
            <div class="row">
                <div class="col-xs-6"></div>
                <div class="col-xs-6"></div>
            </div>
            <!-- ko renderComponent: header --><!-- /ko -->
            <div class="scrollable content page" style="top: 33px; padding: 0;">
                <!-- ko if: loading -->
                    <div class="big-message">
                        <span
                            class="glyphicon glyphicon-cog animate-spin"
                        >
                        </span>
                        <h1>Generating Report..</h1>
                    </div>
                <!-- /ko -->
                <!-- ko ifnot: loading -->
                    <div style="padding: 20px;" class="clearfix">
                        <div class="row row-margins">
                            <div class="col-xs-4 new-world-form">
                                <!-- ko renderComponent: name --><!-- /ko -->
                            </div>
                            <div class="col-xs-8">

                                <button
                                    class="btn btn-success btn-large pull-right"
                                    data-bind="
                                        click: generate_report,
                                        enable: can_generate
                                    "
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                        <div class="row row-margins">
                            <div class="col-xs-12 new-world-form">
                                <!-- ko renderComponent: settings --><!-- /ko -->
                            </div>
                        </div>
                        <hr>
                        <div class="text-center">
                            <h3>
                                Select
                                <span data-bind="text: entity_text"></span>
                                to be included in your report
                            </h3>
                            <p class="lead" style="margin-bottom: 0;">
                                <span data-bind="text: num_portfolios"></span>
                                portfolios and
                                <span data-bind="text: num_funds"></span>
                                funds selected
                                <!-- ko if: has_selection -->
                                    &ndash;
                                    <a
                                        class="clickable"
                                        data-bind="click: clear_selection"
                                    >
                                        Clear Selected
                                    </a>
                                <!-- /ko -->
                            </p>
                        </div>
                    </div>

                    <!-- ko renderComponent: table --><!-- /ko -->
                <!-- /ko -->
            </div>
        </div>
    </div>
`;

class MultiVehicleFund extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();
        this.define_default_template(DEFAULT_TEMPLATE);

        this.progress_update_event = opts.progress_update_event;

        this.cashflow_types = opts.cashflow_types || ['net'];
        this.allowed_entity_types = opts.entity_types;

        this.restore_from_previous = (uid, callback) => {
            DataThing.get({
                params: {
                    target: 'data_report',
                    uid: uid,
                },
                success: report => {
                    this.name.value(`${report.name} Copy`);

                    let entity_uids = report.params.entities.map(
                        entity => entity.user_fund_uid || entity.portfolio_uid,
                    );

                    const params = {...report.params};

                    delete params.entities;

                    this.settings.restore_settings(params);

                    DataThing.get({
                        params: {
                            target: 'vehicles',
                            filters: {
                                entity_uids: entity_uids,
                                entity_type: this.default_entity_types,
                                exclude_portfolio_only: true,
                                cashflow_type: this.cashflow_types,
                            },
                            results_per_page: 'all',
                        },
                        success: result => {
                            this.table.set_selected(result.results);

                            callback(report);
                        },
                    });
                },
                error: () => {},
            });
        };

        this.events = this.new_instance(EventRegistry, {});
        this.events.resolve_and_add('table', 'SelectionDataTable.selected', 'table_selected');

        this.events.add({
            name: 'selected_user_funds',
            event: Observer.map(this.events.get('table_selected'), selected => {
                if (selected.length > 0) {
                    return selected.filter(
                        ({entity_type}) =>
                            entity_type === 'user_fund' || entity_type === 'bison_fund',
                    );
                }

                return null;
            }),
        });
        this.events.add({
            name: 'selected_portfolios',
            event: Observer.map(this.events.get('table_selected'), selected => {
                if (selected.length > 0) {
                    return selected.filter(({entity_type}) => entity_type === 'portfolio');
                }

                return null;
            }),
        });

        this.events.resolve_and_add('grouping_state', 'PopoverButton.state');

        this.events.add({
            name: 'disable_aggregate_only_option',
            event: Observer.map(this.events.get('grouping_state'), grouping_state => {
                for (const value of Object.values(grouping_state)) {
                    if (value) {
                        return true;
                    }
                }
                return false;
            }),
        });

        this.name = this.new_instance(TextInput, {
            id: 'name',
            label: 'Report Name',
        });

        this.sub_type = ko.observable();

        this.events.new('clear_event');

        this.clear_event_proxy = Observer.proxy({
            event_types: {
                'clear_button:': this.events.resolve_event('clear_button', 'EventButton'),
                clear_event: this.events.get('clear_event'),
            },
        });

        this.clear_selection = () => {
            this.table.reset_selected();
        };

        this.clear_filters = () => {
            Observer.broadcast(this.events.get('clear_event'));
        };

        this.reset = sub_type => {
            this.clear_selection();
            this.clear_filters();

            this.table.clear_order();
            this.settings.reset_settings();

            this.name.clear();
            this.loading(false);

            if (sub_type) {
                this.sub_type(sub_type);
                this.name.value(this.gen_report_name(sub_type));
                this.settings.update_sections(sub_type);
            }
        };

        this.gen_report_name = sub_type => {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1; //Indexed from 0
            let day = date.getDate();

            return `${sub_type.titleize()} - ${year}/${month}/${day}`;
        };

        this.progress_update = payload => {
            if (this.progress_update_event) {
                Observer.broadcast(this.progress_update_event, payload);
            }
        };

        this.generate_report = () => {
            this.loading(true);

            let entities = [];

            let settings = this.settings.get_settings();

            for (let vehicle of this.table.selected()) {
                entities.push({
                    user_fund_uid: vehicle.user_fund_uid,
                    portfolio_uid: vehicle.portfolio_uid,
                    as_of_date: vehicle.last_date,
                });
            }

            let report_task_uid = bison.helpers.uuid();
            let report_name = this.name.value();

            this.progress_update({
                task_uid: report_task_uid,
                action: 'start',
                name: report_name,
            });

            DataThing.get({
                params: {
                    target: 'generate_data_report',
                    report_task_uid: report_task_uid,
                    report_name: report_name,
                    sub_type: this.sub_type(),
                    sub_type_params: Object.assign({}, settings, {
                        entities: entities,
                    }),
                },
                success: () => {
                    this.progress_update({
                        task_uid: report_task_uid,
                        action: 'finish',
                    });
                    DataThing.status_check();
                },
                error: error => {
                    this.progress_update({
                        task_uid: report_task_uid,
                        action: 'fail',
                        error: error.error_message,
                    });
                },
            });

            pager.navigate('#!/reports');
        };

        this.show_settings = () => {
            this.settings.show();
        };

        this.has_settings = ko.pureComputed(() => {
            return this.settings.sections().length > 0;
        });

        this.num_portfolios = ko.pureComputed(() => {
            let portfolios = Object.values(this.table.selected()).filter(
                vehicle => vehicle.entity_type === 'portfolio',
            );

            return portfolios.length;
        });

        this.num_funds = ko.pureComputed(() => {
            let funds = Object.values(this.table.selected()).filter(
                ({entity_type}) => entity_type === 'user_fund' || entity_type === 'bison_fund',
            );

            return funds.length;
        });

        this.has_selection = ko.pureComputed(() => {
            return this.num_funds() + this.num_portfolios() > 0;
        });

        this.can_generate = ko.pureComputed(() => {
            let name = this.name.value();

            return name && name.length > 0 && this.has_selection();
        });

        this.entity_type_options = [
            {
                label: 'Portfolio',
                value: 'portfolio',
            },
            {
                label: 'Fund',
                value: 'user_fund',
            },
        ];

        this.default_entity_types = ['user_fund', 'portfolio'];

        let show_bison_funds =
            auth.user_has_feature('bison_funds_in_portfolios') ||
            auth.user_has_feature('bison_internal');
        if (show_bison_funds) {
            this.entity_type_options.push({
                label: 'Bison Fund',
                value: 'bison_fund',
            });

            this.default_entity_types.push('bison_fund');
        }

        if (this.allowed_entity_types) {
            this.default_entity_types.filter(entity_type => {
                return this.allowed_entity_types.indexOf(entity_type) > -1;
            });

            this.entity_type_options.filter(({value: entity_type}) => {
                return this.allowed_entity_types.indexOf(entity_type) > -1;
            });

            let entity_text_components = [];

            if (this.allowed_entity_types.indexOf('user_fund') > -1) {
                entity_text_components.push('funds');
            }

            if (this.allowed_entity_types.indexOf('portfolio') > -1) {
                entity_text_components.push('portfolios');
            }

            this.entity_text = entity_text_components.join(' and ');
        } else {
            this.entity_text = 'funds and portfolios';
        }

        this.general_settings = {
            title: 'General',
            description: 'General settings for your report',
            settings: [
                {component_id: 'as_of_date', mapping: 'get_value'},
                {component_id: 'start_date_horizon', mapping: 'get_value'},
                {component_id: 'render_currency', mapping: 'get_value'},
                {component_id: 'post_date_navs'},
                {component_id: 'aggregate_only'},
                {
                    component_id: 'grouping',
                    key: 'breakdown_key',
                    mapping: 'get',
                    mapping_args: {key: 'breakdown_key'},
                },
            ],
        };

        this.pme_metrics = [
            'Kaplan Schoar',
            'Cobalt PME',
            'Direct Alpha',
            'GEM IPP',
            'Long Nickels',
            'PME+',
            'mPME',
        ];

        this.quarterly_progression_metrics = [
            {label: 'IRR', value: 'IRR'},
            {label: 'TVPI', value: 'TVPI'},
            {label: 'DPI', value: 'DPI'},
            {label: 'RVPI', value: 'RVPI'},
        ];

        for (let metric of this.pme_metrics) {
            this.quarterly_progression_metrics.push({
                label: `PME - ${metric}`,
                value: metric,
            });
        }

        this.settings = this.new_instance(DataReportSettings, {
            id: 'settings',
            sections: {
                net_overview: [this.general_settings],
                pme_benchmark: [
                    this.general_settings,
                    {
                        title: 'PME Settings',
                        description: oneLine`
                            If &quot;Use Vehicle Default Index&quot; is checked,
                            the default index as defined in Data Manager
                            will be used.<br />
                            Any fund/portfolio without a default index will
                            fall back to the index selected below.
                        `,
                        settings: [
                            {component_id: 'use_default_index'},
                            {component_id: 'market_id', mapping: 'get_value'},
                        ],
                    },
                ],
                time_weighted: [this.general_settings],
                peer_benchmark: [
                    this.general_settings,
                    {
                        title: 'Benchmark Settings',
                        description: `
                            Select benchmark and optionally
                            specify fallback characteristics
                        `,
                        settings: [
                            {
                                component_id: 'benchmark_provider',
                                mapping: 'get_value',
                            },
                            {
                                component_id: 'benchmark',
                                key: 'benchmark_edition_uid',
                                mapping: 'get_value',
                            },
                            {
                                component_id: 'enums',
                                column_css: 'col-xs-12',
                            },
                        ],
                    },
                ],
                quarterly_progression: [
                    this.general_settings,
                    {
                        title: 'Quarterly Progression Settings',
                        description: '',
                        settings: [
                            {
                                component_id: 'metric',
                                mapping: 'get_value',
                            },
                            {
                                component_id: 'use_default_index',
                                visible_callback: ({metric}) =>
                                    this.pme_metrics.indexOf(metric) > -1,
                            },
                            {
                                component_id: 'market_id',
                                mapping: 'get_value',
                                visible_callback: ({metric}) =>
                                    this.pme_metrics.indexOf(metric) > -1,
                            },
                        ],
                    },
                ],
                delayed_cashflows: [this.general_settings],
            },
            components: [
                ComponentHelper.cpanel.currency_radiolist({
                    id: 'render_currency',
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    placement: 'bottom',
                    popover_css_class: 'popover-ghost-default',
                    extra_options: [{label: 'Use Vehicle Default', value: null}],
                }),
                {
                    id: 'post_date_navs',
                    component: BooleanButton,
                    template: 'tpl_boolean_button',
                    default_state: true,
                    label: 'Roll Forward NAVs',
                    btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': false,
                    },
                },
                {
                    id: 'aggregate_only',
                    component: BooleanButton,
                    template: 'tpl_boolean_button',
                    default_state: true,
                    disable_event: this.events.get('disable_aggregate_only_option'),
                    label: 'Aggregate Only',
                    btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': false,
                    },
                },
                {
                    id: 'grouping',
                    id_callback: this.events.register_alias('grouping_state'),
                    component: NewPopoverButton,
                    label: 'Grouping',
                    label_track_selection: true,
                    disabled_callback: popover => {
                        if (popover) {
                            const options = popover.options();
                            return !options || options.length === 0;
                        }
                    },
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Grouping',
                        placement: 'bottom',
                        css_class: 'popover-ghost-info',
                    },
                    popover_config: {
                        component: Checklist,
                        single_selection: true,
                        strings: {
                            empty: 'Select at least one entity to group',
                            no_selection: 'None',
                        },
                        value_key: 'breakdown_key',
                        datasource: {
                            type: 'dynamic',
                            one_required: ['user_fund_uids', 'portfolio_uids'],
                            query: {
                                target: 'vehicle:breakdown_options',
                                user_fund_uids: {
                                    type: 'observer',
                                    mapping: 'get_values',
                                    mapping_args: {
                                        key: 'entity_uid',
                                    },
                                    event_type: this.events.get('selected_user_funds'),
                                },
                                portfolio_uids: {
                                    type: 'observer',
                                    mapping: 'get_values',
                                    mapping_args: {
                                        key: 'entity_uid',
                                    },
                                    event_type: this.events.get('selected_portfolios'),
                                },
                            },
                        },
                    },
                },
                {
                    id: 'use_default_index',
                    component: BooleanButton,
                    template: 'tpl_boolean_button',
                    default_state: true,
                    label: 'Use Vehicle Default Index',
                    btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                        'btn-cpanel-primary': false,
                    },
                },
                {
                    id: 'market_id',
                    component: NewPopoverButton,
                    label: 'Index',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select PME Index',
                        placement: 'bottom',
                        css_class: 'popover-ghost-info',
                        listen_to: ['checklists'],
                    },
                    popover_config: {
                        component: TieredRadiolist,
                        parent_key: 'parent',
                        value_key: 'value',
                        label_key: 'label',
                        sub_label_key: 'sub_label',
                        option_disabled_key: 'invalid',
                        enable_filter: true,
                        max_tier: 2,
                        min_height: '300px',
                        filter_value_keys: ['sub_label', 'label'],
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'vehicle:index_options',
                                tree_mode: true,
                            },
                        },
                    },
                },
                {
                    id: 'as_of_date',
                    component: NewPopoverButton,
                    label: 'As of',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select As of',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'backend_dates_to_options',
                            mapping_args: {
                                extra_options: [{label: 'Use Vehicle Default', value: null}],
                            },
                            query: {
                                target: 'user:as_of_dates',
                                filters: {
                                    entity_type: this.default_entity_types,
                                    exclude_portfolio_only: true,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'start_date_horizon',
                    component: NewPopoverButton,
                    label: 'Horizon',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Horizon',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'static',
                            data: [
                                {label: 'Since Inception', value: null},
                                {label: '1 year', value: 1},
                                {label: '2 years', value: 2},
                                {label: '3 years', value: 3},
                                {label: '5 years', value: 5},
                                {label: '10 years', value: 10},
                            ],
                        },
                    },
                },
                {
                    id: 'metric',
                    component: NewPopoverButton,
                    label: 'Metric',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Metric',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'static',
                            data: this.quarterly_progression_metrics,
                        },
                    },
                },
                {
                    id: 'enums',
                    component: AttributeFilters,
                    active_template: 'row',
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_css_class: 'popover-ghost-default',
                    placement: 'bottom',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            public_taxonomy: true,
                        },
                    },
                },
                {
                    id: 'benchmark_provider',
                    id_callback: this.events.register_alias('benchmark_provider'),
                    component: NewPopoverButton,
                    label: 'Provider',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Provider',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    visible_callback: popover => {
                        let options = popover.data();
                        return options && options.length > 1;
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            query: {
                                target: 'benchmark:providers',
                            },
                        },
                    },
                },
                {
                    id: 'benchmark',
                    component: NewPopoverButton,
                    label: 'Benchmark',
                    label_track_selection: true,
                    css: {
                        'btn-block': true,
                        'btn-ghost-default': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Benchmark',
                        placement: 'bottom',
                        css_class: 'popover-ghost-default',
                    },
                    popover_config: {
                        component: Radiolist,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                provider: {
                                    type: 'observer',
                                    event_type: this.events.resolve_event(
                                        'benchmark_provider',
                                        'PopoverButton.value',
                                    ),
                                    mapping: 'get_value',
                                },
                                target: 'benchmarks',
                            },
                        },
                    },
                },
            ],
        });

        this.cpanel = this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                body: [
                    'name',
                    'meta_info',
                    'filter_label',
                    'entity_type',
                    'enums',
                    'vintage_year',
                    'in_portfolio',
                    'clear_button',
                ],
            },
            components: [
                {
                    id: 'name',
                    id_callback: this.events.register_alias('name'),
                    component: StringFilter,
                    template: 'tpl_string_filter',
                    cpanel_style: true,
                    clear_event: this.clear_event_proxy.event,
                    placeholder: 'Name...',
                },
                {
                    id: 'meta_info',
                    component: MetaInfo,
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: this.events.resolve_event('table', 'DataTable.count'),
                    },
                },
                {
                    component: HTMLContent,
                    id: 'filter_label',
                    html: '<h5>Filters</h5>',
                },
                {
                    id: 'enums',
                    component: AttributeFilters,
                    id_callback: this.events.register_alias('enums'),
                    clear_event: this.clear_event_proxy.event,
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'filter_configs',
                            public_taxonomy: true,
                        },
                    },
                },
                {
                    id: 'entity_type',
                    id_callback: this.events.register_alias('entity_type'),
                    clear_event: this.clear_event_proxy.event,
                    component: NewPopoverButton,
                    label: 'Type',
                    label_track_selection: false,
                    icon_css: 'glyphicon glyphicon-plus',
                    visible_callback: popover => popover.options().length > 1,
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Type',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        datasource: this.entity_type_options,
                    },
                },
                {
                    id: 'in_portfolio',
                    id_callback: this.events.register_alias('in_portfolio'),
                    component: NewPopoverButton,
                    clear_event: this.clear_event_proxy.event,
                    label: 'In Portfolio',
                    label_track_selection: false,
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'In Portfolio',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        datasource: {
                            type: 'dynamic',
                            key: 'results',
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'portfolio_uid',
                                label_key: 'name',
                            },
                            query: {
                                target: 'vehicles',
                                results_per_page: 'all',
                                filters: {
                                    entity_type: 'portfolio',
                                },
                            },
                        },
                    },
                },
                {
                    id: 'vintage_year',
                    id_callback: this.events.register_alias('vintage_year'),
                    component: NewPopoverButton,
                    label: 'Vintage Year',
                    clear_event: this.clear_event_proxy.event,
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Vintage Year',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            mapping_default: [],
                            query: {
                                target: 'market_data:vintage_years',
                            },
                        },
                    },
                },
                {
                    id: 'clear_button',
                    id_callback: this.events.register_alias('clear_button'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear Filters',
                },
            ],
        });

        this.table = this.new_instance(SelectionDataTable, {
            id: 'table',
            id_callback: this.events.register_alias('table'),
            enable_selection: true,
            enable_column_toggle: true,
            css: {
                'table-light': true,
                'table-sm': true,
            },
            results_per_page: 15,
            row_key: 'entity_uid',
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
                        relative: 'Type',
                        position: 'right',
                    },
                },
            ],
            columns: [
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Type',
                    key: 'entity_type',
                    format: 'entity_type',
                    definition: lang['Entity Type'].definition,
                },
                {
                    label: 'Cash Flow Type',
                    key: 'cashflow_type',
                    format: 'titleize',
                    visible: false,
                },
                {
                    label: 'Shared By',
                    key: 'shared_by',
                    format: 'strings',
                    visible: false,
                },
                {
                    label: 'Permissions',
                    key: 'permissions',
                    format: 'strings',
                    visible: false,
                },
                {
                    label: 'Base Currency',
                    key: 'base_currency_symbol',
                    visible: false,
                },
                {
                    label: 'Commitment',
                    sort_key: 'commitment',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'commitment',
                    },
                    visible: false,
                },
                {
                    label: 'Unfunded',
                    sort_key: 'unfunded',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'unfunded',
                    },
                    visible: false,
                },
                {
                    label: 'IRR',
                    key: 'irr',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'irr',
                    visible: false,
                },
                {
                    label: 'TVPI',
                    key: 'tvpi',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'multiple',
                    visible: false,
                },
                {
                    label: 'RVPI',
                    key: 'rvpi',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'multiple',
                    visible: false,
                },
                {
                    label: 'DPI',
                    key: 'dpi',
                    first_sort: 'desc',
                    type: 'numeric',
                    format: 'multiple',
                    visible: false,
                },
                {
                    label: 'Paid In',
                    sort_key: 'paid_in',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'paid_in',
                    },
                    visible: false,
                },
                {
                    label: 'Distributed',
                    sort_key: 'distributed',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'distributed',
                    },
                    visible: false,
                },
                {
                    label: 'Total Value',
                    sort_key: 'total_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'total_value',
                    },
                    visible: false,
                },
                {
                    label: 'NAV',
                    sort_key: 'residual_value',
                    type: 'numeric',
                    format: 'money',
                    format_args: {
                        currency_key: 'base_currency_symbol',
                        value_key: 'residual_value',
                    },
                    visible: false,
                },
                {
                    label: 'Vintage',
                    key: 'vintage_year',
                    type: 'numeric',
                    first_sort: 'desc',
                },
                {
                    label: 'First Close',
                    key: 'first_close',
                    first_sort: 'desc',
                    format: 'backend_date',
                },
                {
                    label: 'As of Date',
                    key: 'last_date',
                    first_sort: 'desc',
                    format: 'backend_date',
                },
                {
                    label: 'Age',
                    key: 'age_years',
                    first_sort: 'desc',
                    format: 'years',
                    visible: false,
                },
                {
                    label: 'Last Update',
                    key: 'created',
                    first_sort: 'desc',
                    format: 'backend_local_datetime',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicles',
                    filters: {
                        type: 'dynamic',
                        query: {
                            name: {
                                type: 'observer',
                                event_type: this.events.resolve_event('name', 'StringFilter.value'),
                            },
                            enums: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'enums',
                                    'AttributeFilters.state',
                                ),
                            },
                            entity_type: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'entity_type',
                                    'PopoverButton.value',
                                ),
                                default: this.default_entity_types,
                            },
                            vintage_year: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'vintage_year',
                                    'PopoverButton.value',
                                ),
                            },
                            fund_size: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'fund_size',
                                    'PopoverButton.value',
                                ),
                            },
                            in_portfolio_uid: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'in_portfolio',
                                    'PopoverButton.value',
                                ),
                            },
                            exclude_portfolio_only: true,
                            cashflow_type: this.cashflow_types,
                        },
                    },
                },
            },
        });

        this.header = this.new_instance(BreadcrumbHeader, {
            component: BreadcrumbHeader,
            id: 'header',
            template: 'tpl_breadcrumb_header',
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [
                {
                    id: 'breadcrumb',
                    component: Breadcrumb,
                    items: [
                        {
                            label: 'Reports',
                            link: '#!/reports',
                        },
                        {
                            label: 'Data Reports',
                        },
                        {
                            label: ko.pureComputed(() => {
                                let sub_type = this.sub_type();
                                if (sub_type) {
                                    return sub_type.titleize();
                                }
                            }),
                        },
                        {
                            label: 'Select Vehicles',
                        },
                    ],
                },
            ],
        });

        this.when(this.table, this.header, this.cpanel, this.settings).done(() => {
            _dfd.resolve();
        });
    }
}

export default MultiVehicleFund;
