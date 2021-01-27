/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import {html} from 'common-tags';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import auth from 'auth';
import pager from 'pager';

import * as Constants from 'src/libs/Constants';
import {match_array} from 'src/libs/Utils';

import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Checklist from 'src/libs/components/basic/Checklist';
import DataTable from 'src/libs/components/basic/DataTable';
import DealTrendlines from 'src/libs/components/analytics/DealTrendlines';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Label from 'src/libs/components/basic/Label';
import MetaInfo from 'src/libs/components/MetaInfo';
import NestedRadioButtons from 'src/libs/components/basic/NestedRadioButtons';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import Radiolist from 'src/libs/components/basic/Radiolist';
import RegExps from 'src/libs/RegExps';
import StringFilter from 'src/libs/components/basic/StringFilter';
import ReactWrapper from 'src/libs/components/ReactWrapper';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import SpreadsheetUploadWizard from 'src/libs/components/upload/SpreadsheetUploadWizard';

const DEFAULT_MODE = 'overview';

import DataSource from 'src/libs/DataSource';
import ActionButtons from 'src/libs/components/basic/ActionButtons';
import DeleteCompaniesModal from 'src/libs/components/modals/DeleteCompaniesModal';
import MergeCompaniesModal from 'src/libs/components/modals/MergeCompaniesModal';
import NewCompanyAnalytics from 'containers/analytics/CompanyAnalytics';

class Metrics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const dfd = this.new_deferred();

        const events = opts.events;

        events.resolve_and_add('chart_type', 'PopoverButton.value');
        events.resolve_and_add('metric_versions', 'PopoverButton.value');
        events.resolve_and_add('rate_of_change', 'PopoverButton.value');
        events.resolve_and_add('time_frame', 'PopoverButton.value');
        events.new('toggle_export');

        this.cpanel = this.init_cpanel(events);
        this.body = this.init_body(events);

        this.define_template(html`
            <!-- ko renderComponent: cpanel --><!-- /ko -->
            <!-- ko renderComponent: body --><!-- /ko -->
        `);

        this.when(this.cpanel, this.body).done(() => {
            Observer.register_hash_listener('company-analytics', url => {
                const match = !!match_array(url, [
                    'company-analytics',
                    RegExps.uuid,
                    (_, page) => page === 'metrics',
                ]);

                Observer.broadcast(events.get('toggle_export'), match);
            });

            dfd.resolve();
        });
    }

    init_body(events) {
        return this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_analytics_body_static',
            layout: {
                header: 'breadcrumbs',
                toolbar: 'header',
                body: ['trendlines'],
            },
            components: [
                {
                    id: 'trendlines',
                    component: DealTrendlines,
                    events: events,
                },
            ],
        });
    }

    init_cpanel(events) {
        return this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: [
                    'metric_versions',
                    'render_currency',
                    'chart_type',
                    'rate_of_change',
                    'time_frame',
                ],
            },
            components: [
                {
                    id: 'metric_versions',
                    id_callback: events.register_alias('metric_versions'),
                    component: NewPopoverButton,
                    label_track_selection: true,
                    label: 'Metric Versions',
                    title: 'Metric Version',
                    // visible: auth.user_has_feature('metric_versions'),
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select metric version',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        select_first_option: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'uid',
                                label_key: 'name',
                            },
                            query: {
                                target: 'vehicle:metric_versions',
                                entity_uid: {
                                    type: 'observer',
                                    event_type: events.get('company_uid'),
                                    required: true,
                                },
                                entity_type: 'company',
                            },
                        },
                    },
                },
                {
                    id: 'chart_type',
                    id_callback: events.register_alias('chart_type'),
                    component: NewPopoverButton,
                    label_track_selection: true,
                    label: 'Chart',
                    title: 'Chart Type',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select type of Chart',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Radiolist,
                        options: Constants.chart_type_options,
                        strings: {
                            clear: 'Reset',
                        },
                    },
                },
                {
                    id: 'rate_of_change',
                    component: NewPopoverButton,
                    id_callback: events.register_alias('rate_of_change'),
                    label_track_selection: true,
                    label: 'Function',
                    title: 'Rate of Change',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Function',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        default_selected_index: null,
                        component: Radiolist,
                        options: [{label: 'Rate of change', value: true}],
                    },
                },
                {
                    id: 'time_frame',
                    component: NewPopoverButton,
                    id_callback: events.register_alias('time_frame'),
                    label_track_selection: true,
                    label: 'Period',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Select Period',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Radiolist,
                        options: Constants.time_frame_display_options,
                    },
                },
            ],
        });
    }
}

class ReactAnalytics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        const dfd = this.new_deferred();
        opts.events.resolve_and_add('metric_version', 'PopoverButton.value');
        this.body = this.init_body(opts.events);

        this.upload_wizard = this.new_instance(SpreadsheetUploadWizard, {});

        this.company_uid = Observer.observable(opts.events.get('company_uid'));
        this.mode = Observer.observable(opts.events.get('mode_toggle'));

        this.define_template(html`
            <!-- ko renderComponent: body --><!-- /ko -->
        `);
        dfd.resolve();
    }

    init_body() {
        return this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_react_page',
            layout: {
                body: 'overview',
            },
            components: [
                {
                    id: 'overview',
                    component: ReactWrapper,
                    reactComponent: NewCompanyAnalytics,
                    props: ko.pureComputed(() => {
                        return {
                            showUploadWizard: () => this.upload_wizard.show(),
                        };
                    }),
                },
            ],
        });
    }
}

class CompanyAnalytics extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const dfd = this.new_deferred();

        const events = opts.events || this.new_instance(EventRegistry, {});

        events.resolve_and_add('mode_toggle', 'RadioButtons.state');
        events.resolve_and_add('deal', 'PopoverButton.value');
        events.resolve_and_add('render_currency', 'PopoverButton.value');
        events.resolve_and_add('as_of_date', 'PopoverButton.value');
        events.resolve_and_add('register_export', 'DynamicActions.register_action');
        events.resolve_and_add('register_export', 'DynamicActions.enabled', 'enable_export');
        events.resolve_and_add('edit', 'ActionButton.action.edit');

        events.add({
            name: 'deal_uid',
            event: Observer.map(events.get('deal'), deal => deal.uid),
        });

        const shared_components = this.init_shared_components(events);

        this.mode = ko.observable(DEFAULT_MODE);
        this.react_analytics = this.new_instance(ReactAnalytics, {events}, shared_components);
        this.modes = {
            react_analytics: this.react_analytics,
            metrics: this.new_instance(Metrics, {events}, shared_components),
        };

        if (auth.user_has_features('data_collection_upload')) {
            this.has_upload_permission = this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/has-upload-permission',
                        company_uid: {
                            type: 'observer',
                            event_type: events.get('company_uid'),
                            required: true,
                        },
                    },
                },
            });
        }

        this.active = ko.observable(
            this.mode() === 'metrics' ? this.modes.metrics : this.modes.react_analytics,
        );
        this.mode.subscribe(mode => {
            if (mode === 'metrics') {
                this.active(this.modes.metrics);
            } else if (this.active() !== this.modes.react_analytics) {
                // We only set the new active mode if the actual component to show has changed. This is to prevent
                // re-mounting the react component when moving between different routes handled by ReactAnalytics
                this.active(this.modes.react_analytics);
            }
        });

        this.define_template(html`
            <!-- ko renderComponent: active --><!-- /ko -->
        `);

        Observer.register(events.get('edit'), uid => {
            pager.navigate(`#!/company-analytics/${uid}/metric-sets`);
        });

        Observer.register(events.get('set_mode'), mode => {
            this.mode(mode);
        });

        Observer.register(events.get('mode_toggle'), mode => {
            VehicleHelper.navigate_to_mode(mode, DEFAULT_MODE);
        });

        dfd.resolve();
    }

    init_shared_components(events) {
        const deal_datasource = this.new_instance(DataSource, {
            datasource: {
                key: 'results',
                type: 'dynamic',
                mapping: deals => deals.filter(deal => !!deal.read),
                query: {
                    target: 'deals',
                    results_per_page: 'all',
                    company_uid: {
                        type: 'observer',
                        event_type: events.get('company_uid'),
                        required: true,
                    },
                },
            },
        });

        const has_deals = ko.pureComputed(() => {
            const deals = deal_datasource.data();
            if (deals) {
                return deals.length;
            }

            return false;
        });

        return {
            header: this.new_instance(ActionHeader, {
                id: 'header',
                template: 'tpl_action_toolbar',
                export_id_callback: events.register_alias('register_export'),
                buttons: [
                    {
                        id: 'edit',
                        label: 'Edit Metrics <span class="glyphicon glyphicon-edit"></span>',
                        id_callback: events.register_alias('edit'),
                        action: 'edit',
                        css: {
                            btn: true,
                            'btn-transparent': true,
                        },
                        datasource: {
                            type: 'observer',
                            event_type: events.get('company_uid'),
                        },
                    },
                ],
            }),
            breadcrumbs: this.new_instance(BreadcrumbHeader, {
                id: 'breadcrumbs',
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
                                label: 'Investments',
                            },
                            {
                                label: 'Companies',
                                link: '#!/company-analytics',
                            },
                            {
                                label_key: 'name',
                                inherit_data: true,
                            },
                        ],
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'company_data',
                                company_uid: {
                                    type: 'observer',
                                    event_type: events.get('company_uid'),
                                    required: true,
                                },
                            },
                        },
                    },
                ],
            }),
            mode_toggle: this.new_instance(NestedRadioButtons, {
                id: 'mode_toggle',
                component: NestedRadioButtons,
                id_callback: events.register_alias('mode_toggle'),
                default_state: 'overview',
                set_state_event: events.get('set_mode'),
                menues: [
                    {
                        label: 'Overview',
                        state: 'overview',
                    },
                    {
                        label: 'Operating Metrics',
                        state: 'metrics',
                    },
                    {
                        label: 'Data Upload',
                        visible: ko.pureComputed(() => {
                            return this.has_upload_permission && this.has_upload_permission.data();
                        }),
                        state: 'data_upload',
                    },
                    {
                        label: 'Documents',
                        visible: ko.pureComputed(() => auth.user_has_feature('data_collection')),
                        state: 'supporting_documents',
                    },
                    {
                        label: 'Valuations',
                        state: 'valuations',
                    },
                    {
                        label: 'Text Values',
                        state: 'text_values',
                    },
                    {
                        label: 'Reporting Components',
                        visible: ko.pureComputed(() => auth.user_has_feature('dashboards_beta')),
                        state: 'reporting_components',
                    },
                    {
                        label: 'Contacts',
                        state: 'contacts',
                    },
                ],
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
            }),
            deal: this.new_instance(NewPopoverButton, {
                id: 'deal',
                label: 'Deal',
                id_callback: events.register_alias('deal'),
                label_track_selection: true,
                visible_callback: () => has_deals(),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Deal',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    dependencies: [deal_datasource.get_id()],
                    component: Radiolist,
                    value_key: 'uid',
                    label_key: 'fund_name',
                    data: deal_datasource.data,
                },
            }),
            as_of_date: this.new_instance(NewPopoverButton, {
                id: 'as_of_date',
                label: 'As of',
                id_callback: events.register_alias('as_of_date'),
                label_track_selection: true,
                visible_callback: () => has_deals(),
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select As of Date',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    datasource: {
                        mapping: 'backend_dates_to_options',
                        mapping_default: [],
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:as_of_dates',
                            deal_uid: {
                                type: 'observer',
                                event_type: events.get('deal_uid'),
                                required: true,
                            },
                        },
                    },
                },
            }),
            render_currency: this.new_instance(NewPopoverButton, {
                id: 'render_currency',
                label: 'Currency',
                id_callback: events.register_alias('render_currency'),
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select Currency',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    option_disabled_key: 'invalid',
                    enable_filter: true,
                    filter_value_keys: ['label'],
                    datasource: {
                        mapping: 'to_options',
                        mapping_args: {
                            value_key: 'id',
                            label_keys: ['symbol', 'name'],
                            additional_keys: ['symbol', 'invalid'],
                        },
                        type: 'dynamic',
                        query: {
                            target: 'currency:markets',
                            deal_uid: {
                                type: 'observer',
                                event_type: events.get('deal_uid'),
                            },
                        },
                    },
                    selected_datasource: {
                        key: 'base_currency',
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:currency_id',
                            deal_uid: {
                                type: 'observer',
                                event_type: events.get('deal_uid'),
                            },
                        },
                    },
                },
            }),
        };
    }
}

class CompanySearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry);

        this.events.resolve_and_add('upload', 'ActionButton.action.upload');
        this.events.resolve_and_add(
            'action_buttons',
            'ActionButtons.action.merge_companies',
            'merge_companies',
        );
        this.events.resolve_and_add(
            'action_buttons',
            'ActionButtons.action.export_csv',
            'export_csv',
        );

        this.events.resolve_and_add('table', 'DataTable.selected', 'table_selection');
        this.events.resolve_and_add('table', 'DataTable.count', 'table_count');
        this.events.resolve_and_add('clear', 'EventButton');

        // Register Filters
        this.events.resolve_and_add('custom_attributes', 'AttributeFilters.state');
        this.events.resolve_and_add('in_portfolio', 'PopoverButton.value');
        this.events.resolve_and_add('deal_role', 'PopoverButton.value');
        this.events.resolve_and_add('deal_source', 'PopoverButton.value');
        this.events.resolve_and_add('user_fund_uid', 'PopoverButton.value');
        this.events.resolve_and_add('deal_team_leader', 'PopoverButton.value');
        this.events.resolve_and_add('deal_team_second', 'PopoverButton.value');
        this.events.resolve_and_add('deal_type', 'PopoverButton.value');
        this.events.resolve_and_add('deal_year', 'PopoverButton.value');
        this.events.resolve_and_add('enums', 'AttributeFilters.state');
        this.events.resolve_and_add('manager', 'PopoverButton.value');
        this.events.resolve_and_add('name', 'StringFilter.value');
        this.events.resolve_and_add('seller_type', 'PopoverButton.value');
        this.events.resolve_and_add('investment_amount', 'PopoverButton.value');
        this.events.resolve_and_add('transaction_status', 'PopoverButton.value');

        this.define_template(html`
            <!-- ko renderComponent: cpanel --><!-- /ko -->
            <!-- ko renderComponent: body --><!-- /ko -->
        `);

        this.upload_wizard = this.new_instance(SpreadsheetUploadWizard, {});
        Observer.register(this.events.get('upload'), () => this.upload_wizard.show());

        this.cpanel = this.init_cpanel();
        this.table = this.init_table();
        this.body = this.init_body(this.table);
        Observer.register(this.events.get('export_csv'), () => this.table.export_csv());

        dfd.resolve();
    }

    init_table() {
        return this.new_instance(DataTable, {
            id: 'table',
            id_callback: this.events.register_alias('table'),
            enable_localstorage: true,
            enable_selection: true,
            enable_column_toggle: true,
            enable_clear_order: true,
            column_toggle_css: {'fixed-column-toggle': true},
            css: {'table-light': true, 'table-sm': true},
            columns: [
                {
                    label: 'Name',
                    sort_key: 'name',
                    format: 'contextual_link',
                    format_args: {
                        label_key: 'name',
                        url: 'company-analytics/<uid>',
                    },
                },
                {
                    label: 'Country',
                    sort_key: 'country',
                    key: 'country',
                },
                {
                    label: 'Currency',
                    key: 'base_currency_symbol',
                    sort_key: 'base_currency_id',
                },
                {
                    label: 'Deal Currency',
                    format: 'formatted_listing',
                    key: 'deal_currency_symbols',
                    disable_sorting: true,
                    visible: false,
                },
                {
                    label: 'Deal Team Leader',
                    format: 'formatted_listing',
                    key: 'deal_team_leader',
                    disable_sorting: true,
                },
                {
                    label: 'Deal Team Second',
                    format: 'formatted_listing',
                    key: 'deal_team_second',
                    disable_sorting: true,
                },
                {
                    label: 'Deal Source',
                    format: 'formatted_listing',
                    key: 'deal_source',
                    disable_sorting: true,
                },
                {
                    label: 'Deal Role',
                    format: 'formatted_listing',
                    key: 'deal_role',
                    disable_sorting: true,
                },
                {
                    label: 'Seller Type',
                    format: 'formatted_listing',
                    key: 'seller_type',
                    disable_sorting: true,
                },
                {
                    label: 'Deal Type',
                    format: 'formatted_listing',
                    key: 'deal_type',
                    disable_sorting: true,
                },
                {
                    label: 'Created',
                    sort_key: 'created',
                    key: 'created',
                    format: 'backend_date',
                    visible: false,
                },
                {
                    label: 'Modified',
                    sort_key: 'modified',
                    key: 'modified',
                    format: 'backend_date',
                    visible: false,
                },
            ],
            dynamic_columns: [
                {
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'table_columns',
                            public_taxonomy: true,
                            include_enums: ['gics'],
                        },
                    },
                    placement: {
                        position: 'right',
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'companies:deal_data',
                    filters: {
                        type: 'dynamic',
                        query: {
                            ...this.observerFilter('name'),
                            ...this.observerFilter('user_fund_uid', 'get_values'),
                            ...this.observerFilter('deal_team_leader', 'get_values'),
                            ...this.observerFilter('deal_team_second', 'get_values'),
                            ...this.observerFilter('manager', 'get_values'),
                            ...this.observerFilter('enums'),
                            ...this.observerFilter('deal_year', 'get_values'),
                            ...this.observerFilter('deal_source', 'get_values'),
                            ...this.observerFilter('deal_role', 'get_values'),
                            ...this.observerFilter('deal_type', 'get_values'),
                            ...this.observerFilter('seller_type', 'get_values'),
                            ...this.observerFilter('transaction_status', 'get_values'),
                            ...this.observerFilter('in_portfolio', 'get_values'),
                            ...this.observerFilter('custom_attributes'),
                            ...this.observerFilter('investment_amount'),
                        },
                    },
                },
            },
        });
    }

    init_cpanel() {
        return this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                body: [
                    'search_label',
                    'name',
                    'meta_info',
                    'clear',
                    'advanced_filters',
                    'user_fund_uid',
                    'deal_team_leader',
                    'deal_team_second',
                    'manager',
                    'enums',
                    'deal_year',
                    'deal_source',
                    'deal_role',
                    'deal_type',
                    'seller_type',
                    'custom_attributes',
                ],
            },
            components: [
                {
                    id: 'search_label',
                    component: Label,
                    css: {'first-header': true},
                    template: 'tpl_cpanel_label',
                    label: 'Search',
                },
                {
                    id: 'name',
                    id_callback: this.events.register_alias('name'),
                    component: StringFilter,
                    template: 'tpl_string_filter',
                    cpanel_style: true,
                    clear_event: this.events.get('clear'),
                    enable_localstorage: true,
                    placeholder: 'Name...',
                },
                {
                    id: 'meta_info',
                    component: MetaInfo,
                    label: 'Results',
                    format: 'number',
                    datasource: {
                        type: 'observer',
                        event_type: this.events.get('table_count'),
                    },
                },
                {
                    id: 'clear',
                    id_callback: this.events.register_alias('clear'),
                    component: EventButton,
                    template: 'tpl_cpanel_button',
                    css: {'btn-sm': true, 'btn-default': true},
                    label: 'Clear',
                },
                {
                    id: 'user_fund_uid',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('user_fund_uid'),
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    label: 'Fund',
                    icon_css: 'glyphicon glyphicon-plus',
                    clear_event: this.events.get('clear'),
                    popover_options: {
                        title: 'Fund',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        enable_filter: true,
                        datasource: {
                            key: 'results',
                            type: 'dynamic',
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'user_fund_uid',
                                label_key: 'name',
                            },
                            query: {
                                target: 'vehicles',
                                results_per_page: 'all',
                                filters: {
                                    type: 'dynamic',
                                    query: {
                                        entity_type: ['user_fund'],
                                        cashflow_type: 'gross',
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
                    },
                },
                {
                    id: 'deal_team_leader',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('deal_team_leader'),
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Deal Team Leader',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Deal Team Leader',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            query: {
                                target: 'client:managers',
                                exclude_deal_team_seconds: true,
                            },
                        },
                    },
                },
                {
                    id: 'deal_team_second',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('deal_team_second'),
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Deal Team Second',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Deal Team Second',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            query: {
                                target: 'client:managers',
                                exclude_deal_team_leaders: true,
                            },
                        },
                    },
                },
                {
                    id: 'manager',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('manager'),
                    icon_css: 'glyphicon glyphicon-plus',
                    label: 'Manager',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    popover_options: {
                        title: 'Manager',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            query: {
                                target: 'client:managers',
                            },
                        },
                    },
                },
                {
                    id: 'enums',
                    id_callback: this.events.register_alias('enums'),
                    clear_event: this.clear_event,
                    set_state_event_type: 'StateHandler.load',
                    enable_localstorage: true,
                    component: AttributeFilters,
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
                    id: 'deal_year',
                    id_callback: this.events.register_alias('deal_year'),
                    label: 'Deal Year',
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    component: NewPopoverButton,
                    popover_options: {
                        title: 'Deal Year',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            mapping: 'list_to_options',
                            query: {
                                target: 'client:deal_years',
                            },
                        },
                    },
                },
                {
                    id: 'deal_source',
                    id_callback: this.events.register_alias('deal_source'),
                    label: 'Deal Source',
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    component: NewPopoverButton,
                    popover_options: {
                        title: 'Deal Source',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'static_enums',
                                enum_type: 'company_deal_source',
                            },
                        },
                    },
                },
                {
                    id: 'deal_role',
                    id_callback: this.events.register_alias('deal_role'),
                    label: 'Deal Role',
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    component: NewPopoverButton,
                    popover_options: {
                        title: 'Deal Role',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'static_enums',
                                enum_type: 'company_deal_role',
                            },
                        },
                    },
                },
                {
                    id: 'deal_type',
                    id_callback: this.events.register_alias('deal_type'),
                    label: 'Deal Type',
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    component: NewPopoverButton,
                    popover_options: {
                        title: 'Deal Type',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'static_enums',
                                enum_type: 'company_deal_type',
                            },
                        },
                    },
                },
                {
                    id: 'seller_type',
                    id_callback: this.events.register_alias('seller_type'),
                    label: 'Seller Type',
                    icon_css: 'glyphicon glyphicon-plus',
                    css: {
                        'btn-block': true,
                        'btn-cpanel-primary': true,
                        'btn-sm': true,
                    },
                    component: NewPopoverButton,
                    popover_options: {
                        title: 'Seller Type',
                        placement: 'right',
                        css_class: 'popover-cpanel',
                    },
                    popover_config: {
                        component: Checklist,
                        enable_exclude: true,
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'static_enums',
                                enum_type: 'company_seller_type',
                            },
                        },
                    },
                },
                {
                    id: 'custom_attributes',
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
                        id: 'custom_attributes_popover',
                        id_callback: this.events.register_alias('custom_attributes'),
                        component: AttributeFilters,
                        active_template: 'in_popover',
                        datasource: {
                            type: 'dynamic',
                            query: {
                                target: 'user:custom_attributes',
                                entity_type: 'company',
                                public_taxonomy: false,
                            },
                        },
                    },
                },
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
                                'investment_amount',
                                'transaction_status',
                                'in_portfolio',
                            ],
                        },
                        components: [
                            {
                                id: 'advanced_filters_popover_label',
                                component: Label,
                                template: 'tpl_cpanel_label',
                                label: 'Advanced',
                            },
                            {
                                id: 'investment_amount',
                                id_callback: this.events.register_alias('investment_amount'),
                                label: 'Investment Amount',
                                icon_css: 'glyphicon glyphicon-plus',
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                component: NewPopoverButton,
                                popover_options: {
                                    title: 'Investment Amount',
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                },
                                popover_config: {
                                    component: PopoverInputRange,
                                    placement: 'right',
                                    title: 'Date Created',
                                    mode: 'amount',
                                    min: {
                                        placeholder: 'Min Amount',
                                    },
                                    max: {
                                        placeholder: 'Max Amount',
                                    },
                                },
                            },
                            {
                                id: 'transaction_status',
                                id_callback: this.events.register_alias('transaction_status'),
                                label: 'Investment Status',
                                icon_css: 'glyphicon glyphicon-plus',
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                component: NewPopoverButton,
                                popover_options: {
                                    title: 'Investment Status',
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                },
                                popover_config: {
                                    component: Checklist,
                                    enable_exclude: true,
                                    datasource: {
                                        type: 'static',
                                        mapping: 'list_to_options',
                                        data: ['Unrealized', 'Partially Realized', 'Realized'],
                                    },
                                },
                            },
                            {
                                id: 'in_portfolio',
                                id_callback: this.events.register_alias('in_portfolio'),
                                label: 'In Portfolio',
                                icon_css: 'glyphicon glyphicon-plus',
                                css: {
                                    'btn-block': true,
                                    'btn-cpanel-primary': true,
                                    'btn-sm': true,
                                },
                                component: NewPopoverButton,
                                popover_options: {
                                    title: 'Portfolios',
                                    placement: 'right',
                                    css_class: 'popover-cpanel',
                                },
                                popover_config: {
                                    component: Checklist,
                                    enable_filter: true,
                                    strings: {
                                        no_selection: 'All',
                                    },
                                    datasource: {
                                        type: 'dynamic',
                                        key: 'results',
                                        mapping: 'to_options',
                                        mapping_args: {
                                            value_key: 'entity_uid',
                                            label_key: 'name',
                                        },
                                        query: {
                                            target: 'vehicles',
                                            results_per_page: 'all',
                                            filters: {
                                                entity_type: 'portfolio',
                                                cashflow_type: 'gross',
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });
    }

    init_body(companiesTable) {
        return this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: 'table',
            },
            components: [
                {
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
                                    label: 'Investments',
                                },
                                {
                                    label: 'Companies',
                                },
                            ],
                        },
                    ],
                },
                {
                    component: ActionHeader,
                    id: 'action_toolbar',
                    template: 'tpl_action_toolbar',
                    disable_export: true,
                    buttons: [
                        {
                            id: 'action_buttons',
                            component: ActionButtons,
                            template: 'tpl_action_buttons_dropdown',
                            label:
                                '<span class="glyphicon glyphicon-option-horizontal" style="font-size: 20px; line-height: 32px"></span>',
                            id_callback: this.events.register_alias('action_buttons'),
                            css: {'dropdown-flow-left': true, 'btn-block': true},
                            buttons: [
                                {
                                    id: 'delete',
                                    action: 'delete_selected',
                                    label: '<span class="icon-trash-1"></span> Delete Selected',
                                    trigger_modal: {
                                        id: 'delete_modal',
                                        component: DeleteCompaniesModal,
                                    },
                                    disabled_callback: function(data) {
                                        return !data.length;
                                    },
                                    datasource: {
                                        type: 'observer',
                                        default: [],
                                        event_type: this.events.get('table_selection'),
                                    },
                                },
                                {
                                    id: 'export',
                                    action: 'export_csv',
                                    label:
                                        '<div style="display: inline-block; width: 20px"></div> Export CSV',
                                },
                                {
                                    label:
                                        '<div style="display: inline-block; width: 20px"></div> Merge',
                                    action: 'merge_companies',
                                    trigger_modal: {
                                        id: 'merge',
                                        component: MergeCompaniesModal,
                                    },
                                    disabled_callback: function(data) {
                                        return data.length < 2;
                                    },
                                    datasource: {
                                        type: 'observer',
                                        default: [],
                                        event_type: this.events.get('table_selection'),
                                    },
                                },
                            ],
                        },
                        {
                            id: 'new_company',
                            label: 'Create <span class="icon-plus"></span>',
                            action: 'new_company',
                            trigger_url: {url: '/company-analytics/new-company'},
                        },
                        {
                            id: 'upload',
                            label: 'Upload <span class="icon-upload"></span>',
                            id_callback: this.events.register_alias('upload'),
                            action: 'upload',
                            css: {
                                btn: true,
                                'btn-transparent-success': true,
                            },
                        },
                    ],
                },
                companiesTable,
            ],
        });
    }

    observerFilter(name, mapping = undefined, required = false) {
        return {
            [name]: {
                type: 'observer',
                event_type: this.events.get(name),
                required,
                mapping,
            },
        };
    }
}

export default class CompanyAnalyticsVM extends Context {
    constructor() {
        super({id: 'company-analytics'});

        this.dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry, {});
        events.new('set_mode');
        events.new('company_uid');
        events.new('reset');

        this.loading = ko.observable(false);

        /********************************************************************
         * Generators for lazy loading of instances
         *******************************************************************/

        const gen = {
            /****************************************************************
             * Search mode. Active when url is just #!/analytics.
             ***************************************************************/
            search: () => {
                return this.new_instance(CompanySearch, {
                    id: 'search',
                });
            },

            /****************************************************************
             * Gross deal mode
             ***************************************************************/
            analytics: () => {
                return this.new_instance(CompanyAnalytics, {
                    id: 'analytics',
                    events: events,
                });
            },
        };

        /********************************************************************
         * Used to load up an instance
         *******************************************************************/

        this.instances = {};

        this.instance = name => {
            if (!this.instances[name]) {
                this.instances[name] = gen[name]();
            }

            return this.instances[name];
        };

        /********************************************************************
         * Active observable. Contains one of the modes defined above.
         *******************************************************************/

        this.active = ko.observable();

        /********************************************************************
         * Each of the modes has an 'asides' property which is essentially
         what columns to render.
        *******************************************************************/

        this.asides = ko.computed(() => {
            let active = this.active();
            if (active) {
                return [active];
            }
        });

        /********************************************************************
         * Url matching function. Takes an array of url components and
         figures out the entity_type, cashflow_type, uids and
        what mode to activate.
        *******************************************************************/

        this.match_url = function(url) {
            return match_array(
                url,
                [
                    'company-analytics',
                    RegExps.uuid,
                    (uid, mode) => ({uid, mode: VehicleHelper.url_to_mode(mode)}),
                ],
                [
                    // Default all non-uid routes to be handled by react router
                    'company-analytics',
                    /.*/,
                    () => ({mode: ''}),
                ],
            );
        };

        /********************************************************************
         * URL listener. Subscribes to the hash that starts with
         #!/analytics. Uses the url matching funciton to determine what
        mode to activate.
        *******************************************************************/

        let prev_uid = undefined;

        this.default_state = () => {
            let active = this.active();

            if (active) {
                Observer.broadcast_for_id(active.get_id(), 'Active.company_uid', undefined);
            }

            let search = this.instance('search');

            this.loading(true);

            this.when(search).done(() => {
                prev_uid = undefined;

                this.active(search);
                this.loading(false);
            });
        };

        Observer.register_hash_listener('company-analytics', url => {
            let match = this.match_url(url);

            if (match) {
                let instance = this.instance('analytics');
                let uid = match.uid;
                let mode = match.mode || DEFAULT_MODE;

                this.loading(true);

                this.when(instance).done(() => {
                    Observer.broadcast(events.get('set_mode'), mode);

                    if (prev_uid != uid) {
                        Observer.broadcast(events.get('reset'));
                        Observer.broadcast(events.get('company_uid'), match.uid);
                    }

                    prev_uid = uid;

                    this.active(instance);
                    this.loading(false);
                });

                if (uid) {
                    Observer.broadcast_for_id('UserAction', 'record_action', {
                        action_type: 'view_analytics_entity',
                        entity_type: 'company',
                        identifier: match.uid,
                    });
                }
            } else {
                this.default_state();
            }
        });

        this.dfd.resolve();
    }
}
