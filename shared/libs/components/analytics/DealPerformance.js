/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Handles the deal snapshots metrics view in deal analytics.
 */
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import DataTable from 'src/libs/components/basic/DataTable';
import Snapshots from 'src/libs/components/analytics/Snapshots';
import MetricTable from 'src/libs/components/MetricTable';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import Aside from 'src/libs/components/basic/Aside';
import Checklist from 'src/libs/components/basic/Checklist';
import auth from 'auth';
import * as Constants from 'src/libs/Constants';

export default class DealPerformance extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();
        let _events = opts.events;

        _events.resolve_and_add('cashflow_toggle', 'RadioButtons.state');
        _events.resolve_and_add('metric_versions_snapshots', 'PopoverButton.value');
        _events.resolve_and_add('time_frame_snapshots', 'PopoverButton.value');

        if (!_events || !_events.get('deal_uid_event') || !_events.get('company_uid')) {
            throw 'Trying to initialize DealPerformance without uid events';
        }

        const cashflow = {
            id: 'cashflow',
            component: DataTable,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 15,
            columns: [
                {
                    label: 'Date',
                    key: 'date',
                    format: 'backend_date',
                },
                {
                    label: 'Amount',
                    format: 'money',
                    format_args: {
                        value_key: 'amount',
                        currency_key: 'base_currency',
                    },
                    type: 'numeric',
                    disable_sorting: true,
                },
                {
                    label: 'Translated Amount',
                    format: 'money',
                    toggle_visible_event: self.currency_event,
                    format_args: {
                        value_key: 'translated_amount',
                        currency_key: 'translated_currency',
                    },
                    type: 'numeric',
                    disable_sorting: true,
                },
                {
                    label: 'Type',
                    key: 'cf_type',
                    format: 'cf_type',
                },
                {
                    label: 'Non Capital',
                    key: 'non_capital',
                    format: 'boolean',
                },
                {
                    label: 'Note',
                    key: 'note',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:gross:cashflows',
                    deal_uid: {
                        type: 'observer',
                        event_type: _events.get('deal_uid_event'),
                        required: true,
                    },
                    render_currency: {
                        type: 'observer',
                        event_type: _events.get('render_currency'),
                        mapping: 'get_value',
                        required: true,
                    },
                },
            },
        };

        const metric_table = {
            id: 'metric_table',
            component: MetricTable,
            css: {'table-light': true},
            top_css: {'top-padding': true},
            columns: 3,
            metrics: [
                {
                    label: 'Invested',
                    format: 'money',
                    format_args: {
                        value_key: 'paid_in',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Realized Value',
                    format: 'money',
                    format_args: {
                        value_key: 'distributed',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Unrealized Value (NAV)',
                    format: 'money',
                    format_args: {
                        value_key: 'nav',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Total Value',
                    format: 'money',
                    format_args: {
                        value_key: 'total_value',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'First Close',
                    format: 'backend_date',
                    value_key: 'first_close',
                },
                {
                    label: 'As of date',
                    format: 'backend_date',
                    value_key: 'as_of_date',
                },
                {
                    label: 'IRR',
                    format: 'percent',
                    value_key: 'irr',
                },
                {
                    label: 'DPI',
                    format: 'multiple',
                    value_key: 'dpi',
                },
                {
                    label: 'RVPI',
                    format: 'multiple',
                    value_key: 'rvpi',
                },
                {
                    label: 'MOIC',
                    format: 'multiple',
                    value_key: 'tvpi',
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle:overview',
                    deal_uid: {
                        type: 'observer',
                        event_type: _events.get('deal_uid_event'),
                        required: true,
                    },
                    render_currency: {
                        type: 'observer',
                        event_type: _events.get('render_currency'),
                        mapping: 'get',
                        mapping_args: {
                            key: 'symbol',
                        },
                        required: true,
                    },
                },
            },
        };

        const cpanel_components = [
            {
                id: 'charts_label',
                component: HTMLContent,
                html: '<h5>Chart Filters</h5>',
            },
            {
                id: 'metric_versions',
                id_callback: _events.register_alias('metric_versions_snapshots'),
                component: NewPopoverButton,
                visible: auth.user_has_feature('metric_versions'),
                label_track_selection: true,
                label: 'Metric Versions',
                title: 'Metric Version',
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Select metric versions',
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
                                event_type: _events.get('company_uid'),
                                required: true,
                            },
                            entity_type: 'company',
                        },
                    },
                },
            },
            {
                id: 'time_frame',
                component: NewPopoverButton,
                id_callback: _events.register_alias('time_frame_snapshots'),
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
                    enable_exclude: true,
                    options: Constants.time_frame_display_options,
                },
            },
        ];

        const cpanel_body_layout = [
            'metric_versions',
            'time_frame',
            'render_currency',
            'charts_label',
            'date_range',
        ];

        let body;

        if (opts.no_cashflows) {
            body = {
                id: 'body',
                component: Snapshots,
                events: _events,
            };
        } else {
            body = {
                id: 'body',
                active_component: 'main',
                component: DynamicWrapper,
                template: 'tpl_dynamic_wrapper',
                set_active_event: _events.get('cashflow_toggle'),
                components: [
                    {
                        id: 'main',
                        component: Aside,
                        template: 'tpl_aside_body',
                        layout: {
                            body: ['metric_table', 'snapshots'],
                        },
                        components: [
                            metric_table,
                            {
                                id: 'snapshots',
                                component: Snapshots,
                                events: _events,
                            },
                        ],
                    },
                    cashflow,
                ],
            };

            cpanel_components.push({
                id: 'cashflow_toggle',
                component: RadioButtons,
                id_callback: _events.register_alias('cashflow_toggle'),
                template: 'tpl_cpanel_radio_toggle',
                default_state: 'main',
                buttons: [
                    {
                        label: 'Show Performance',
                        state: 'main',
                    },
                    {
                        label: 'Show Cashflows',
                        state: 'cashflow',
                    },
                ],
            });

            cpanel_body_layout.push('cashflow_toggle');
        }

        this.body = this.new_instance(DynamicWrapper, {
            id: 'main',
            component: Aside,
            template: 'tpl_analytics_body_static',
            layout: {
                header: 'breadcrumbs',
                toolbar: 'header',
                expandable_meta_data: 'meta_data',
                body: ['body'],
            },
            components: [body],
        });

        this.cpanel = this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: cpanel_body_layout,
            },
            components: cpanel_components,
        });

        this.when(this.body, this.cpanel).done(() => {
            _dfd.resolve();
        });
    }
}
