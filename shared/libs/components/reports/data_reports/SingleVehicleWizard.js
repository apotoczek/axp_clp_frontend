/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import EventButton from 'src/libs/components/basic/EventButton';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import ko from 'knockout';
import pager from 'pager';
import auth from 'auth';
import bison from 'bison';
import DataReportSettings from 'src/libs/components/reports/data_reports/DataReportSettings';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataTable from 'src/libs/components/basic/DataTable';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import TextInput from 'src/libs/components/basic/TextInput';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import lang from 'lang';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.progress_update_event = opts.progress_update_event;

    self.cashflow_types = opts.cashflow_types || ['net'];
    self.allowed_entity_types = opts.entity_types;

    self.define_default_template(`
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
                                <span class="glyphicon glyphicon-cog animate-spin"></span>
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
                                        <button class="btn btn-success btn-large pull-right" data-bind="click: generate_report, enable: can_generate">
                                            Generate Report
                                        </button>
                                        <button class="btn btn-default btn-large pull-right" data-bind="click: show_settings, visible: has_settings" style="margin-right: 5px;">
                                            <span class="btn-icon glyphicon glyphicon-cog"></span> Settings
                                        </button>
                                    </div>
                                </div>
                                <hr>
                                <div class="text-center">
                                    <h3>Select <span data-bind="text: entity_text"></span> to run your report on..</h3>
                                </div>
                            </div>

                            <!-- ko renderComponent: table --><!-- /ko -->
                        <!-- /ko -->
                    </div>
                </div>
            </div>
        `);

    self.restore_from_previous = function(uid, callback) {
        DataThing.get({
            params: {
                target: 'data_report',
                uid: uid,
            },
            success: report => {
                self.name.value(`${report.name} Copy`);

                let entity_uid =
                    report.params.user_fund_uid ||
                    report.params.entity.user_fund_uid ||
                    report.params.entity.portfolio_uid;

                delete report.params.entity;

                self.settings.restore_settings(report.params);

                DataThing.get({
                    params: {
                        target: 'vehicles',
                        filters: {
                            entity_uids: [entity_uid],
                            entity_type: self.default_entity_types,
                            exclude_portfolio_only: true,
                            cashflow_type: self.cashflow_types,
                        },
                        results_per_page: 1,
                    },
                    success: res => {
                        if (res && res.results && res.results.length > 0) {
                            self.table.toggle_select(res.results[0]);
                        }

                        callback(report);
                    },
                });
            },
            error: () => {},
        });
    };

    self.events = self.new_instance(EventRegistry, {});

    self.name = self.new_instance(TextInput, {
        id: 'name',
        label: 'Report Name',
    });

    self.sub_type = ko.observable();

    self.events.new('clear_event');

    self.clear_event_proxy = Observer.proxy({
        event_types: {
            'clear_button:': self.events.resolve_event('clear_button', 'EventButton'),
            clear_event: self.events.get('clear_event'),
        },
    });

    self.clear_selection = function() {
        self.table.reset_selected();
    };

    self.clear_filters = function() {
        Observer.broadcast(self.events.get('clear_event'));
    };

    self.reset = function(sub_type) {
        self.clear_selection();
        self.clear_filters();

        self.table.clear_order();
        self.settings.reset_settings();

        self.name.clear();
        self.loading(false);

        if (sub_type) {
            self.sub_type(sub_type);
            self.name.value(self.gen_report_name(sub_type));
            self.settings.update_sections(sub_type);
        }
    };

    self.gen_report_name = function(sub_type) {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1; //Indexed from 0
        let day = date.getDate();

        return `${sub_type.titleize()} - ${year}/${month}/${day}`;
    };

    self.progress_update = function(payload) {
        if (self.progress_update_event) {
            Observer.broadcast(self.progress_update_event, payload);
        }
    };

    self.generate_report = function() {
        self.loading(true);

        let settings = self.settings.get_settings();

        let selected = self.table.get_selected();

        let entity_params = {
            user_fund_uid: selected[0].user_fund_uid,
            portfolio_uid: selected[0].portfolio_uid,
            as_of_date: selected[0].last_date,
        };

        let report_task_uid = bison.helpers.uuid();
        let report_name = self.name.value();

        self.progress_update({
            task_uid: report_task_uid,
            action: 'start',
            name: report_name,
        });

        DataThing.get({
            params: {
                target: 'generate_data_report',
                report_task_uid: report_task_uid,
                report_name: report_name,
                sub_type: self.sub_type(),
                sub_type_params: Object.assign({}, settings, {
                    entity: entity_params,
                }),
            },
            success: () => {
                self.progress_update({
                    task_uid: report_task_uid,
                    action: 'finish',
                });

                DataThing.status_check();
            },
            error: error => {
                self.progress_update({
                    task_uid: report_task_uid,
                    action: 'fail',
                    error: error.error_message,
                });
            },
        });

        pager.navigate('#!/reports');
    };

    self.show_settings = function() {
        self.settings.show();
    };

    self.has_settings = ko.pureComputed(() => {
        return self.settings.sections().length > 0;
    });

    self.has_selection = ko.pureComputed(() => {
        return self.table.has_selected();
    });

    self.can_generate = ko.pureComputed(() => {
        let name = self.name.value();

        return name && name.length > 0 && self.has_selection();
    });

    self.entity_type_options = [
        {
            label: 'Portfolio',
            value: 'portfolio',
        },
        {
            label: 'Fund',
            value: 'user_fund',
        },
    ];

    self.default_entity_types = ['user_fund', 'portfolio'];

    let show_bison_funds =
        auth.user_has_feature('bison_funds_in_portfolios') ||
        auth.user_has_feature('bison_internal');

    if (show_bison_funds) {
        self.entity_type_options.push({
            label: 'Bison Fund',
            value: 'bison_fund',
        });

        self.default_entity_types.push('bison_fund');
    }

    if (self.allowed_entity_types) {
        self.default_entity_types = self.default_entity_types.filter(entity_type => {
            return self.allowed_entity_types.indexOf(entity_type) > -1;
        });

        self.entity_type_options = self.entity_type_options.filter(({value: entity_type}) => {
            return self.allowed_entity_types.indexOf(entity_type) > -1;
        });

        let entity_text_components = [];

        if (self.allowed_entity_types.indexOf('portfolio') > -1) {
            entity_text_components.push('portfolio');
        }

        if (self.allowed_entity_types.indexOf('user_fund') > -1) {
            entity_text_components.push('fund');
        }

        self.entity_text = entity_text_components.join(' or ');
    } else {
        self.entity_text = 'fund or portfolio';
    }

    self.general_settings = {
        title: 'General',
        description: 'General settings for your report',
        settings: [
            {
                component_id: 'as_of_date',
                mapping: 'get_value',
            },
            {
                component_id: 'start_date_horizon',
                mapping: 'get_value',
            },
            {
                component_id: 'render_currency',
                mapping: 'get_value',
            },
            {
                component_id: 'post_date_navs',
            },
            {
                component_id: 'aggregate_only',
            },
        ],
    };

    self.settings = self.new_instance(DataReportSettings, {
        id: 'settings',
        sections: {},
        components: [],
    });

    self.cpanel = self.new_instance(Aside, {
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
                id_callback: self.events.register_alias('name'),
                component: StringFilter,
                template: 'tpl_string_filter',
                cpanel_style: true,
                clear_event: self.clear_event_proxy.event,
                placeholder: 'Name...',
            },
            {
                id: 'meta_info',
                component: MetaInfo,
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: self.events.resolve_event('table', 'DataTable.count'),
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
                id_callback: self.events.register_alias('enums'),
                clear_event: self.clear_event_proxy.event,
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
                id_callback: self.events.register_alias('entity_type'),
                clear_event: self.clear_event_proxy.event,
                component: NewPopoverButton,
                label: 'Type',
                label_track_selection: false,
                icon_css: 'glyphicon glyphicon-plus',
                visible_callback: popover => {
                    return popover.options().length > 1;
                },
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
                    datasource: self.entity_type_options,
                },
            },
            {
                id: 'in_portfolio',
                id_callback: self.events.register_alias('in_portfolio'),
                component: NewPopoverButton,
                clear_event: self.clear_event_proxy.event,
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
                id_callback: self.events.register_alias('vintage_year'),
                component: NewPopoverButton,
                label: 'Vintage Year',
                clear_event: self.clear_event_proxy.event,
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
                id_callback: self.events.register_alias('clear_button'),
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear Filters',
            },
        ],
    });

    self.table = self.new_instance(DataTable, {
        id: 'table',
        id_callback: self.events.register_alias('table'),
        row_key: 'entity_uid',
        enable_selection: true,
        radio_selection: true,
        enable_column_toggle: true,
        css: {
            'table-light': true,
            'table-sm': true,
        },
        results_per_page: 15,
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
                            event_type: self.events.resolve_event('name', 'StringFilter.value'),
                        },
                        enums: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'enums',
                                'AttributeFilters.state',
                            ),
                        },
                        entity_type: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'entity_type',
                                'PopoverButton.value',
                            ),
                            default: self.default_entity_types,
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'vintage_year',
                                'PopoverButton.value',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'fund_size',
                                'PopoverButton.value',
                            ),
                        },
                        in_portfolio_uid: {
                            type: 'observer',
                            event_type: self.events.resolve_event(
                                'in_portfolio',
                                'PopoverButton.value',
                            ),
                        },
                        exclude_portfolio_only: true,
                        cashflow_type: self.cashflow_types,
                    },
                },
            },
        },
    });

    self.header = self.new_instance(BreadcrumbHeader, {
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
                            let sub_type = self.sub_type();
                            if (sub_type) {
                                return sub_type.titleize();
                            }
                        }),
                    },
                    {
                        label: 'Select Vehicle',
                    },
                ],
            },
        ],
    });

    self.when(self.table, self.header, self.cpanel, self.settings).done(() => {
        _dfd.resolve();
    });

    return self;
}
