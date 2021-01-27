/* Automatically transformed from AMD to ES6. Beware of code smell. */

import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';
import Radiolist from 'src/libs/components/basic/Radiolist';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import Label from 'src/libs/components/basic/Label';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import DataTable from 'src/libs/components/basic/DataTable';
import GroupedBoxplotChart from 'src/libs/components/charts/GroupedBoxplotChart';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import ko from 'knockout';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Mapping from 'src/libs/Mapping';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.events = self.new_instance(EventRegistry, {});

    self.dfd = self.new_deferred();
    self.render_currency = ko.observable();

    /**********************************************************************
     *   OPTIONS DEFINITIONS
     **********************************************************************/
    self.template = opts.template || 'tpl_test_body';
    self.cpanel_id = opts.cpanel_id;
    self.top_level_id = opts.top_level_id;
    self.state_event = opts.state_event;

    self.chart_state = ko.observable('cashflow_analysis');

    /**********************************************************************
     *   ID DEFINITIONS
     **********************************************************************/
    self.cashflow_analysis_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'cashflow_analysis',
    );
    self.navs_dry_powder_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'navs_dry_powder',
    );
    self.distribution_pace_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'distribution_pace',
    );
    self.contribution_pace_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'contribution_pace',
    );
    self.time_weighted_analysis_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'time_weighted_analysis',
    );
    self.liquidity_ratio_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'liquidity_ratio',
    );
    self.performance_metrics_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'performance_metrics',
    );
    self.dispersion_of_returns_id = Utils.gen_id(
        self.get_id(),
        'body',
        'content',
        'chart_block_wrapper',
        'chart_block',
        'visualization',
        'dispersion_of_returns',
    );

    /**********************************************************************
     *   DATA OBSERVABLE DEFINITIONS
     **********************************************************************/
    self.cashflow_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.cashflow_analysis_id),
    );
    self.navs_dry_powder_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.navs_dry_powder_id),
    );
    self.distribution_pace_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.distribution_pace_id),
    );
    self.contribution_pace_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.contribution_pace_id),
    );
    self.time_weighted_analysis_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.time_weighted_analysis_id),
    );
    self.liquidity_ratio_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.liquidity_ratio_id),
    );
    self.performance_metrics_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.performance_metrics_id),
    );
    self.dispersion_of_returns_data = Observer.observable(
        Utils.gen_event('DataSource.data', self.dispersion_of_returns_id),
    );

    self.clear_event = Utils.gen_event('EventButton', self.cpanel_id, 'clear_button');

    self._update_timeout = 500;

    /**********************************************************************
     *   LABEL OBSERVABLE DEFINITIONS
     **********************************************************************/
    self.twrr_grouping = ko.observable('').extend({rateLimit: self._update_timeout});
    self.liquidity_grouping = ko.observable('').extend({rateLimit: self._update_timeout});
    self.performance_metrics_metric = ko.observable('').extend({rateLimit: self._update_timeout});
    self.performance_metrics_grouping = ko.observable('').extend({rateLimit: self._update_timeout});
    self.performance_metrics_pme_format = ko
        .observable('irr')
        .extend({rateLimit: self._update_timeout});
    self.dispersion_of_returns_grouping = ko
        .observable('')
        .extend({rateLimit: self._update_timeout});
    self.dispersion_of_returns_metric = ko
        .observable('irr')
        .extend({rateLimit: self._update_timeout});
    self.pme_methodology = ko.observable('').extend({rateLimit: self._update_timeout});

    /**********************************************************************
     *   OBSERVERS
     **********************************************************************/
    Observer.register(
        Utils.gen_event('PopoverButton.value', self.top_level_id, 'render_currency'),
        currency => {
            self.render_currency(Utils.get(currency, 'symbol'));
        },
    );

    Observer.register(
        Utils.gen_event(
            'RadioButtons.state_data',
            self.get_id(),
            'body',
            'content',
            'chart_block_wrapper',
            'chart_block',
            'chart_cpanel',
            'chart_mode',
        ),
        payload => {
            if (payload) {
                if (payload.viz_state) {
                    Observer.broadcast(
                        Utils.gen_event('Visualization.state', self.get_id()),
                        payload.viz_state,
                    );
                }

                if (payload.state) {
                    self.chart_state(payload.state);
                }
            }
        },
    );

    /**********************************************************************
     *   Event Resolves and Aliasing
     **********************************************************************/
    self.events.resolve_and_add(
        'dispersion_metric_popover',
        'PopoverButton.value',
        'dispersion_metric',
    );
    self.events.resolve_and_add(
        'liquidity_date_range_popover',
        'PopoverButton.value',
        'liquidity_date_range',
    );
    self.events.resolve_and_add(
        'time_weighted_grouping_popover',
        'PopoverButton.value',
        'time_weighted_grouping',
    );
    self.events.resolve_and_add(
        'liquidity_ratio_grouping_popover',
        'PopoverButton.value',
        'liquidity_ratio_grouping',
    );
    self.events.resolve_and_add(
        'performance_metrics_as_of_popover',
        'PopoverButton.value',
        'performance_metrics_as_of',
    );
    self.events.resolve_and_add(
        'performance_metrics_index_popover',
        'PopoverButton.value',
        'performance_metrics_index',
    );
    self.events.resolve_and_add(
        'liquidity_ratio_date_range_popover',
        'PopoverButton.value',
        'liquidity_ratio_date_range',
    );
    self.events.resolve_and_add(
        'performance_metrics_metric_popover',
        'PopoverButton.value',
        'performance_metrics_metric',
    );
    self.events.resolve_and_add(
        'navs_dry_powder_date_range_popover',
        'PopoverButton.value',
        'navs_dry_powder_date_range',
    );
    self.events.resolve_and_add(
        'performance_metrics_horizon_popover',
        'PopoverButton.value',
        'performance_metrics_horizon',
    );
    self.events.resolve_and_add(
        'cashflow_analysis_date_range_popover',
        'PopoverButton.value',
        'cashflow_analysis_date_range',
    );
    self.events.resolve_and_add(
        'contribution_pace_date_range_popover',
        'PopoverButton.value',
        'contribution_pace_date_range',
    );
    self.events.resolve_and_add(
        'distribution_pace_date_range_popover',
        'PopoverButton.value',
        'distribution_pace_date_range',
    );
    self.events.resolve_and_add(
        'performance_metrics_grouping_popover',
        'PopoverButton.value',
        'performance_metrics_grouping',
    );
    self.events.resolve_and_add(
        'performance_metrics_date_range_popover',
        'PopoverButton.value',
        'performance_metrics_date_range',
    );
    self.events.resolve_and_add(
        'dispersion_of_returns_grouping_popover',
        'PopoverButton.value',
        'dispersion_grouping',
    );
    self.events.resolve_and_add(
        'time_weighted_analysis_date_range_popover',
        'PopoverButton.value',
        'time_weighted_analysis_date_range',
    );
    self.events.resolve_and_add(
        'performance_metrics_pme_methodology_popover',
        'PopoverButton.value',
        'performance_metrics_pme_methodology',
    );

    /**********************************************************************
     *   Observers
     **********************************************************************/
    Observer.register(self.events.get('performance_metrics_pme_methodology'), payload => {
        if (payload) {
            let methodology = payload.value;
            self.pme_methodology(methodology);
        }
    });

    Observer.register(self.events.get('time_weighted_grouping'), payload => {
        let grouping = payload ? payload.label : null;
        self.twrr_grouping(grouping ? `by ${grouping}` : '');
    });

    Observer.register(self.events.get('liquidity_ratio_grouping'), payload => {
        let grouping = payload ? payload.label : null;
        self.liquidity_grouping(grouping ? `by ${grouping}` : '');
    });

    Observer.register(self.events.get('performance_metrics_metric'), payload => {
        self.performance_metrics_metric(payload || {});
    });

    Observer.register(self.events.get('performance_metrics_grouping'), payload => {
        self.performance_metrics_grouping(payload || {});
    });

    Observer.register(self.events.get('performance_metrics_pme_methodology'), payload => {
        if (payload) {
            let format = payload.format;
            self.performance_metrics_pme_format(format);
        }
    });

    Observer.register(self.events.get('dispersion_grouping'), payload => {
        if (payload) {
            self.dispersion_of_returns_grouping(payload || {});
        }
    });

    Observer.register(self.events.get('dispersion_metric'), payload => {
        if (payload) {
            self.dispersion_of_returns_metric(payload || {});
        }
    });

    self.bounds_datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'research:date_bounds',
                provider: {
                    mapping: 'get',
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'PopoverButton.value',
                        self.top_level_id,
                        'chart_provider',
                    ),
                    required: true,
                },
                navs_only: {
                    mapping: state => {
                        if (state) {
                            return ['time_weighted_analysis', 'performance_metrics'].includes(
                                state.state,
                            );
                        }
                        return false;
                    },
                    type: 'observer',
                    event_type: Utils.gen_event(
                        'RadioButtons.state_data',
                        self.get_id(),
                        'body',
                        'content',
                        'chart_block_wrapper',
                        'chart_block',
                        'chart_cpanel',
                        'chart_mode',
                    ),
                    required: true,
                },
            },
        },
    });

    self.min_start_date = ko.computed(() => {
        let min_max = self.bounds_datasource.data();
        if (min_max) {
            return min_max[0];
        }
    });

    self.max_as_of_date = ko.computed(() => {
        let min_max = self.bounds_datasource.data();
        if (min_max) {
            return min_max[1];
        }
    });

    self.metric_date_range_disabled = ko.pureComputed(() => {
        let metric = self.performance_metrics_metric();
        let invalid_metric = ['tvpi', 'rvpi', 'dpi'].includes(metric.value);
        let invalid_pme = self.pme_methodology() === 'kaplan_schoar' && metric.value === 'pme';
        return invalid_metric || invalid_pme;
    });
    /**********************************************************************
     *   Factory Methods
     **********************************************************************/
    self.make_date_range_config = (analysis, disabled_callback) => {
        let component_id = `${analysis}_date_range_popover`;

        let config = {
            id: component_id,
            id_callback: self.events.register_alias(component_id),
            component: NewPopoverButton,
            label: 'Date Range',
            visible_callback: () => {
                return self.chart_state() === analysis;
            },
            disabled_callback: disabled_callback || null,
            css: {
                'cpanel-btn-sm': true,
                'btn-cpanel-light': true,
                'btn-block': true,
            },
            popover_options: {
                title: 'Date Range',
                placement: 'right',
                css_class: 'popover-ghost-default',
            },
            popover_config: {
                component: PopoverInputRange,
                placement: 'right',
                title: 'Range',
                mode: 'date',
                min: {
                    placeholder: 'Start',
                    in_cpanel: true,
                    min_value: self.min_start_date,
                    limit_error: true,
                },
                max: {
                    placeholder: 'End',
                    in_cpanel: true,
                    max_value: self.max_as_of_date,
                    limit_error: true,
                },
            },
        };
        return config;
    };

    self.make_datasource = analysis => {
        let query = {
            target: 'pooled:analysis',
            provider: {
                type: 'observer',
                mapping: 'get',
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.top_level_id,
                    'chart_provider',
                ),
                required: true,
            },
            roll_forward: false,
            post_date_nav: false,
            analysis: analysis,
            filters: {
                type: 'dynamic',
                query: {
                    vintage_year: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.cpanel_id,
                            'vintage_year',
                        ),
                    },
                    enums: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'AttributeFilters.state',
                            self.top_level_id,
                            'enum_attributes',
                        ),
                    },
                    fund_size: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'PopoverButton.value',
                            self.top_level_id,
                            'fund_size',
                        ),
                    },
                },
            },
            render_currency: {
                type: 'observer',
                mapping: 'get',
                mapping_args: {
                    key: 'symbol',
                },
                event_type: Utils.gen_event(
                    'PopoverButton.value',
                    self.top_level_id,
                    'render_currency',
                ),
            },
        };
        if (analysis === 'navs_dry_powder') {
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('navs_dry_powder_date_range'),
            };
        }
        if (analysis === 'cashflow_analysis') {
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('cashflow_analysis_date_range'),
            };
        }
        if (analysis === 'distribution_pace') {
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('distribution_pace_date_range'),
            };
        }
        if (analysis === 'contribution_pace') {
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('contribution_pace_date_range'),
            };
        }
        if (analysis === 'time_weighted_analysis') {
            query.grouping = {
                type: 'observer',
                event_type: self.events.get('time_weighted_grouping'),
                mapping: 'get_value',
            };
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('time_weighted_analysis_date_range'),
            };
        }

        if (analysis === 'liquidity_ratio') {
            query.grouping = {
                type: 'observer',
                event_type: self.events.get('liquidity_ratio_grouping'),
                mapping: 'get_value',
            };
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('liquidity_ratio_date_range'),
            };
        }

        if (analysis === 'performance_metrics') {
            query.metric = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_metric'),
                mapping: 'get_value',
            };
            query.grouping = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_grouping'),
                mapping: 'get_value',
            };
            query.index = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_index'),
                mapping: 'get_value',
                required: true,
            };
            query.start_date = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_horizon'),
                mapping: 'get_value',
            };
            query.methodology = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_pme_methodology'),
                mapping: 'get_value',
            };
            query.as_of_date = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_as_of'),
                mapping: 'get_value',
            };
            query.date_range = {
                type: 'observer',
                event_type: self.events.get('performance_metrics_date_range'),
            };
            query.roll_forward = false;
            query.post_date_nav = false;
        }

        if (analysis === 'dispersion_of_returns') {
            query.grouping = {
                type: 'observer',
                event_type: self.events.get('dispersion_grouping'),
                mapping: 'get_value',
                required: true,
            };
            query.metric = {
                type: 'observer',
                event_type: self.events.get('dispersion_metric'),
                mapping: 'get_value',
                required: true,
            };
        }

        return {
            type: 'dynamic',
            query: query,
        };
    };

    self.format_pace_data_for_table = function({data, quarterly_key, annual_key}) {
        let timeseries = {
            annual: data[annual_key],
        };

        for (let [key, values] of Object.entries(data[quarterly_key])) {
            timeseries[key] = values;
        }

        return Mapping.keyed_timeseries_to_rows(timeseries);
    };

    self.performance_metrics_format = ko.pureComputed(() => {
        let pme_format = self.performance_metrics_pme_format();
        let metric = self.performance_metrics_metric().value;
        let format = 'percent';
        if (metric === 'pme') {
            format = pme_format;
        } else if (metric === 'tvpi' || metric === 'rvpi' || metric === 'dpi') {
            format = 'multiple';
        }
        return format;
    });

    self.performance_metrics_formatter = value => {
        let format = self.performance_metrics_format();
        let formatter = Formatters.gen_formatter(format);
        return formatter(value);
    };

    self.dispersion_of_returns_formatter = value => {
        let metric = self.dispersion_of_returns_metric().value;
        let format = 'percent';
        if (metric == 'tvpi' || metric === 'rvpi' || metric === 'dpi') {
            format = 'multiple';
        }
        let formatter = Formatters.gen_formatter(format);
        return formatter(value);
    };

    self.visibility = {
        performance_metrics_pme_index: ko.pureComputed(() => {
            return (
                self.performance_metrics_metric().value === 'pme' &&
                self.chart_state() === 'performance_metrics'
            );
        }),
    };

    /**********************************************************************
     *   COMPONENTS
     **********************************************************************/
    self.breadcrumb = {
        id: 'breadcrumb',
        component: Breadcrumb,
        items: [
            {
                label: 'Market Analysis',
                link: '#!/market-analysis',
            },
        ],
    };

    self.header = {
        id: 'header',
        component: BreadcrumbHeader,
        template: 'tpl_breadcrumb_header',
        layout: {
            breadcrumb: 'breadcrumb',
        },
        components: [self.breadcrumb],
        buttons: [],
    };

    self.action_toolbar = {
        id: 'action_toolbar',
        component: ActionHeader,
        template: 'tpl_action_toolbar',
        disable_export: true,
        buttons: [],
    };

    self.sublabel_fn = data => {
        if (data && data.meta) {
            let meta = data.meta;
            return `As of ${Formatters.backend_date(meta.as_of_date)} - ${self.render_currency()}`;
        }
    };

    self.cashflow_analysis = {
        id: 'cashflow_analysis',
        exporting: true,
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        title: 'Pooled Distributions/Contributions',
        shared_tooltip: true,
        format: 'money',
        format_args: {
            render_currency: self.render_currency,
        },
        series: [
            {
                name: 'Contributions',
                key: 'contributions',
                type: 'column',
                color: 'second',
            },
            {
                name: 'Distributions',
                key: 'distributions',
                type: 'column',
                color: 'first',
            },
        ],
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('cashflow_analysis'),
    };

    self.distribution_pace = {
        id: 'distribution_pace',
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        title: 'Distribution Pace',
        shared_tooltip: true,
        format: 'percent',
        reversed_stacks: false,
        exporting: true,
        y_label: 'Distributions as a % of NAV',
        series: [
            {
                name: 'Quarterly Pace',
                key: 'quarterly_grouped',
                type: 'column',
                stack: 'Quarters',
            },
            {
                name: 'Annual Pace',
                key: 'annual',
                type: 'spline',
            },
        ],
        plotlines_conf: [
            {
                name: 'Average',
                key: 'average',
                color: '#444444',
                display_value: true,
            },
        ],
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('distribution_pace'),
    };

    self.contribution_pace = {
        id: 'contribution_pace',
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        title: 'Contribution Pace',
        shared_tooltip: true,
        format: 'percent',
        reversed_stacks: false,
        y_label: 'Contributions as a % of Unfunded',
        exporting: true,
        series: [
            {
                name: 'Quarterly Pace',
                key: 'quarterly_grouped',
                type: 'column',
                stack: 'Quarters',
            },
            {
                name: 'Annual Pace',
                key: 'annual',
                type: 'spline',
            },
        ],
        plotlines_conf: [
            {
                name: 'Average',
                key: 'average',
                color: '#444444',
                display_value: true,
            },
        ],
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('contribution_pace'),
    };

    self.navs_dry_powder = {
        id: 'navs_dry_powder',
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        title: 'NAVs and Dry Powder',
        shared_tooltip: true,
        format: 'money',
        format_args: {
            render_currency: self.render_currency,
        },
        exporting: true,
        series: [
            {
                name: 'NAVs',
                key: 'navs',
                type: 'spline',
            },
            {
                name: 'Dry Powder',
                key: 'dry_powders',
                type: 'spline',
            },
        ],
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('navs_dry_powder'),
    };

    self.liquidity_ratio = {
        id: 'liquidity_ratio',
        template: 'tpl_chart_box',
        component: GroupedBarChart,
        exporting: true,
        label: ko.pureComputed(() => `Liquidity Ratio ${self.liquidity_grouping()}`),
        label_in_chart: true,
        format: 'multiple',
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        zoom_type: 'x',
        threshold: 1,
        min: 0,
        y_label: 'Distributions / Contributions',
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('liquidity_ratio'),
    };

    self.metrics_state_display = ko.pureComputed(() => {
        let metric = self.performance_metrics_metric();
        let grouping = self.performance_metrics_grouping();
        return `${metric.label} by ${grouping.label}`;
    });

    self.performance_metrics = {
        id: 'performance_metrics',
        colors: ['tenth', 'third'],
        template: 'tpl_chart_box',
        component: GroupedBarChart,
        exporting: true,
        label: ko.pureComputed(() => `Metrics - ${self.metrics_state_display()}`),
        label_in_chart: true,
        formatter: self.performance_metrics_formatter,
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        zoom_type: 'x',
        y_label: ko.pureComputed(() => self.performance_metrics_metric().label),
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('performance_metrics'),
    };

    self.dispersion_of_returns = {
        id: 'dispersion_of_returns',
        template: 'tpl_chart_box',
        component: GroupedBoxplotChart,
        exporting: true,
        label: ko.pureComputed(
            () => `Dispersion of Returns by ${self.dispersion_of_returns_grouping().label}`,
        ),
        sublabel_fn: self.sublabel_fn,
        label_in_chart: true,
        formatter: self.dispersion_of_returns_formatter,
        get_data_timeout: self._update_timeout,
        y_label: ko.pureComputed(() => self.dispersion_of_returns_metric().label),
        auto_get_data: false,
        broadcast_data: true,
        datasource: self.make_datasource('dispersion_of_returns'),
    };

    self.dispersion_of_returns_table = {
        id: 'dispersion_of_returns',
        component: DataTable,
        results_per_page: 20,
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.dispersion_of_returns_id],
        enable_csv_export: true,
        export_type: 'market_analysis_dispersion_of_returns',
        columns: [
            {
                label: 'Group',
                key: 'group',
            },
            {
                label: 'Lower Fence',
                key: 'lower_fence',
                formatter: self.dispersion_of_returns_formatter,
            },
            {
                label: 'Third Quartile',
                key: 'q3',
                formatter: self.dispersion_of_returns_formatter,
            },
            {
                label: 'Median',
                key: 'median',
                formatter: self.dispersion_of_returns_formatter,
            },
            {
                label: 'First Quartile',
                key: 'q1',
                formatter: self.dispersion_of_returns_formatter,
            },
            {
                label: 'Upper Fence',
                key: 'upper_fence',
                formatter: self.dispersion_of_returns_formatter,
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.dispersion_of_returns_data();
            if (data) {
                let groups = data.groups;
                let series = data.series;
                let rows = [];
                for (let i = 0; i < groups.length; i++) {
                    let group = groups[i];
                    let plot = series[i];
                    rows.push({
                        group: group,
                        lower_fence: plot[0],
                        q3: plot[1],
                        median: plot[2],
                        q1: plot[3],
                        upper_fence: plot[4],
                    });
                }
                return rows;
            }
        }),
    };

    self.performance_metrics_table = {
        id: 'performance_metrics',
        component: DataTable,
        results_per_page: 20,
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.performance_metrics_id],
        enable_csv_export: true,
        export_type: 'market_analysis_performance_metrics',
        columns: [
            {
                label: 'Group',
                key: 'group',
            },
        ],
        dynamic_columns: [
            {
                data: ko.pureComputed(() => {
                    let data = self.performance_metrics_data();
                    if (data) {
                        let metrics = data.metrics;
                        let columns = metrics.map(m => {
                            return {
                                label: m.name,
                                key: m.name,
                                format: self.performance_metrics_format(),
                            };
                        });
                        return columns;
                    }
                }),
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.performance_metrics_data();

            if (data) {
                let groups = data.groups;
                let metrics = data.metrics;

                let rows = [];
                for (let group of groups) {
                    let row = {group: group};
                    for (let metric of metrics) {
                        row[metric.name] = metric.data[group];
                    }
                    rows.push(row);
                }
                return rows;
            }
        }),
    };
    self.liquidity_ratio_table = {
        id: 'liquidity_ratio',
        component: DataTable,
        results_per_page: 20,
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.liquidity_ratio_id],
        enable_csv_export: true,
        export_type: 'market_analysis_liquidity_ratio',
        columns: [
            {
                label: 'Date',
                key: 'date',
            },
        ],
        dynamic_columns: [
            {
                data: ko.computed(() => {
                    let data = self.liquidity_ratio_data();
                    if (data) {
                        let rv = [];
                        for (let i = 0; i < data.metrics.length; i++) {
                            let name = data.metrics[i].name;
                            rv.push({
                                label: name,
                                format: 'multiple',
                                key: name,
                            });
                        }
                        return rv;
                    }
                }),
            },
        ],
        data: ko.computed(() => {
            let data = self.liquidity_ratio_data();

            if (data) {
                let rows_by_year = {};
                let years = data.groups;
                for (let i = 0; i < years.length; i++) {
                    rows_by_year[years[i]] = {};
                }

                let metrics = data.metrics;
                for (let i = 0; i < metrics.length; i++) {
                    let {name, data} = metrics[i];

                    let keys = Object.keys(data);
                    for (let j = 0; j < keys.length; j++) {
                        rows_by_year[keys[j]][name] = data[keys[j]];
                    }
                }

                let rows = [];

                for (let [date, row] of Object.entries(rows_by_year)) {
                    row.date = parseInt(date);
                    rows.push(row);
                }

                return rows;
            }
        }),
    };

    self.distribution_pace_table = {
        id: 'distribution_pace',
        component: DataTable,
        results_per_page: 10,
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.distribution_pace_id],
        enable_csv_export: true,
        export_type: 'market_analysis_distribution_pace',
        columns: [
            {
                label: 'Year',
                key: 'date',
                format: 'date_year',
            },
            {
                label: '1st quarter',
                key: '1st quarter',
                format: 'percent',
            },
            {
                label: '2nd quarter',
                key: '2nd quarter',
                format: 'percent',
            },
            {
                label: '3rd quarter',
                key: '3rd quarter',
                format: 'percent',
            },
            {
                label: '4th quarter',
                key: '4th quarter',
                format: 'percent',
            },
            {
                label: 'Annual',
                key: 'annual',
                format: 'percent',
            },
        ],
        data: ko.computed(() => {
            let data = self.distribution_pace_data();
            if (data) {
                return self.format_pace_data_for_table({
                    data: data,
                    quarterly_key: 'quarterly_grouped',
                    annual_key: 'annual',
                });
            }
        }),
    };

    self.time_weighted_return_table = {
        id: 'time_weighted_analysis',
        component: DataTable,
        results_per_page: 20,
        inline_data: true,
        css: {
            'table-light': true,
            'table-sm': true,
            'btn-block': true,
        },
        dependencies: [self.time_weighted_analysis_id],
        enable_csv_export: true,
        export_type: 'market_analysis_time_weighted',
        columns: [
            {
                label: 'Date',
                key: 'date',
                format: 'date',
            },
        ],
        dynamic_columns: [
            {
                data: ko.computed(() => {
                    let data = self.time_weighted_analysis_data();
                    if (data) {
                        let rv = [];

                        for (let key of Object.keys(data.time_weighted_analysis)) {
                            rv.push({
                                label: key,
                                format: 'percent',
                                key: key,
                            });
                        }

                        return rv;
                    }
                }),
            },
        ],
        data: ko.computed(() => {
            let data = self.time_weighted_analysis_data();
            if (data) {
                let datas = data.time_weighted_analysis;
                let rows_by_date = {};

                for (let [key, datevals] of Object.entries(datas)) {
                    for (let [date, val] of datevals) {
                        if (!rows_by_date[date]) {
                            rows_by_date[date] = {};
                        }
                        rows_by_date[date][key] = val;
                    }
                }

                let rows = [];

                for (let [date, row] of Object.entries(rows_by_date)) {
                    row.date = parseInt(date);
                    rows.push(row);
                }

                return rows;
            }
        }),
    };

    self.contribution_pace_table = {
        id: 'contribution_pace',
        component: DataTable,
        results_per_page: 10,
        inline_data: true,
        css: {'table-light': true, 'table-sm': true},
        dependencies: [self.contribution_pace_id],
        enable_csv_export: true,
        export_type: 'market_analysis_contribution_pace',
        columns: [
            {
                label: 'Year',
                key: 'date',
                format: 'date_year',
            },
            {
                label: '1st quarter',
                key: '1st quarter',
                format: 'percent',
            },
            {
                label: '2nd quarter',
                key: '2nd quarter',
                format: 'percent',
            },
            {
                label: '3rd quarter',
                key: '3rd quarter',
                format: 'percent',
            },
            {
                label: '4th quarter',
                key: '4th quarter',
                format: 'percent',
            },
            {
                label: 'Annual',
                key: 'annual',
                format: 'percent',
            },
        ],
        data: ko.computed(() => {
            let data = self.contribution_pace_data();
            if (data) {
                return self.format_pace_data_for_table({
                    data: data,
                    quarterly_key: 'quarterly_grouped',
                    annual_key: 'annual',
                });
            }
        }),
    };

    self.cashflow_table = {
        id: 'cashflow_analysis',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 20,
        inline_data: true,
        dependencies: [self.cashflow_analysis_id],
        enable_csv_export: true,
        export_type: 'market_analysis_cashflow',
        columns: [
            {
                label: 'Quarter',
                key: 'date',
                format: 'date',
            },
            {
                label: 'Distributions',
                key: 'distributions',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
            },
            {
                label: 'Contributions',
                key: 'contributions',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.cashflow_data();

            if (data) {
                let timeseries = {
                    contributions: data.contributions,
                    distributions: data.distributions,
                };

                return Mapping.keyed_timeseries_to_rows(timeseries, 0);
            }

            return [];
        }),
    };

    self.navs_dry_powder_table = {
        id: 'navs_dry_powder',
        component: DataTable,
        css: {'table-light': true, 'table-sm': true},
        results_per_page: 20,
        inline_data: true,
        dependencies: [self.navs_dry_powder_id],
        enable_csv_export: true,
        export_type: 'market_analysis_navs_dry_powder',
        columns: [
            {
                label: 'Quarter',
                key: 'date',
                format: 'date',
            },
            {
                label: 'NAV',
                key: 'nav',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
            },
            {
                label: 'Dry Powder',
                key: 'dry_powder',
                format: 'money',
                format_args: {
                    render_currency: self.render_currency,
                },
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.navs_dry_powder_data();

            if (data) {
                return Mapping.keyed_timeseries_to_rows({
                    dry_powder: data.dry_powders,
                    nav: data.navs,
                });
            }

            return [];
        }),
    };

    self.time_weighted_analysis = {
        id: 'time_weighted_analysis',
        template: 'tpl_chart_box',
        component: TimeseriesChart,
        exporting: true,
        title: ko.pureComputed(() => `Time Weighted Return ${self.twrr_grouping()}`),
        format: 'percent',
        y_label: 'Time Weighted Return',
        series: [
            {
                key: 'time_weighted_analysis',
                type: 'line',
            },
        ],
        get_data_timeout: self._update_timeout,
        auto_get_data: false,
        broadcast_data: true,
        sublabel_fn: self.sublabel_fn,
        datasource: self.make_datasource('time_weighted_analysis'),
    };

    let visualizations = [
        self.cashflow_analysis,
        self.distribution_pace,
        self.contribution_pace,
        self.navs_dry_powder,
        self.time_weighted_analysis,
        self.liquidity_ratio,
        self.performance_metrics,
        self.dispersion_of_returns,
    ];

    self.visualization = {
        component: DynamicWrapper,
        id: 'visualization',
        tpl: 'tpl_dynamic_wrapper',
        active_component: 'cashflow_analysis',
        set_active_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'body',
            'content',
            'chart_block_wrapper',
            'chart_block',
            'chart_cpanel',
            'chart_mode',
        ),
        components: visualizations,
        toggle_auto_get_data: true,
    };

    self.table = {
        component: DynamicWrapper,
        id: 'table',
        tpl: 'tpl_dynamic_wrapper',
        active_component: 'cashflow_analysis',
        set_active_event: Utils.gen_event(
            'RadioButtons.state',
            self.get_id(),
            'body',
            'content',
            'chart_block_wrapper',
            'chart_block',
            'chart_cpanel',
            'chart_mode',
        ),
        components: [
            self.cashflow_table,
            self.navs_dry_powder_table,
            self.distribution_pace_table,
            self.contribution_pace_table,
            self.time_weighted_return_table,
            self.liquidity_ratio_table,
            self.performance_metrics_table,
            self.dispersion_of_returns_table,
        ],
        toggle_auto_get_data: true,
    };

    let cpanel_buttons = [
        {
            label: 'Cash Flows',
            state: 'cashflow_analysis',
        },
        {
            label: 'Index Returns',
            state: 'time_weighted_analysis',
        },
        {
            label: 'Dry Powder / NAV',
            state: 'navs_dry_powder',
        },
        {
            label: 'Distribution Pace',
            state: 'distribution_pace',
        },
        {
            label: 'Contribution Pace',
            state: 'contribution_pace',
        },
        {
            label: 'Liquidity Ratio',
            state: 'liquidity_ratio',
        },
        {
            label: 'Performance Metrics',
            state: 'performance_metrics',
        },
        {
            label: 'Dispersion of Returns',
            state: 'dispersion_of_returns',
        },
    ];

    self.chart_cpanel = {
        component: BaseComponent,
        id: 'chart_cpanel',
        template: 'tpl_aside_body',
        layout: {
            body: [
                'visualization_label',
                'chart_mode',
                'options_label',
                'time_weighted_grouping_popover',
                'liquidity_ratio_grouping_popover',
                'performance_metrics_metric_popover',
                'performance_metrics_pme_methodology_popover',
                'performance_metrics_index_popover',
                'performance_metrics_grouping_popover',
                'dispersion_of_returns_grouping_popover',
                'dispersion_metric_popover',
                'distribution_pace_date_range_popover',
                'contribution_pace_date_range_popover',
                'time_weighted_analysis_date_range_popover',
                'navs_dry_powder_date_range_popover',
                'cashflow_analysis_date_range_popover',
                'liquidity_ratio_date_range_popover',
                'performance_metrics_date_range_popover',
            ],
        },
        components: [
            self.make_date_range_config('time_weighted_analysis'),
            self.make_date_range_config('cashflow_analysis'),
            self.make_date_range_config('distribution_pace'),
            self.make_date_range_config('contribution_pace'),
            self.make_date_range_config('navs_dry_powder'),
            self.make_date_range_config('liquidity_ratio'),
            self.make_date_range_config('performance_metrics', () =>
                self.metric_date_range_disabled(),
            ),
            {
                id: 'visualization_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Chart Selection',
            },
            {
                id: 'chart_mode',
                component: RadioButtons,
                template: 'tpl_full_width_radio_buttons',
                default_state: 'cashflow_analysis',
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'arrow-select': true,
                },
                reset_event: self.chart_cpanel_radio_reset_event,
                buttons: cpanel_buttons,
            },
            {
                id: 'options_label',
                component: Label,
                template: 'tpl_cpanel_label',
                label: 'Options',
            },
            {
                id: 'time_weighted_grouping_popover',
                id_callback: self.events.register_alias('time_weighted_grouping_popover'),
                component: NewPopoverButton,
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                label_track_selection: true,
                clear_event: self.clear_event,
                label: 'Grouping',
                visible_callback: () => self.chart_state() === 'time_weighted_analysis',
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    default_selected_index: 1,
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    data: [
                        {
                            value: 'geography',
                            label: 'Geography',
                        },
                        {
                            value: 'style',
                            label: 'Style',
                        },
                        {
                            value: null,
                            label: 'All',
                        },
                    ],
                },
            },
            // {
            //     id: 'performance_metrics_as_of_popover',
            //     id_callback: self.events.register_alias('performance_metrics_as_of_popover'),
            //     label: 'As of',
            //     component: NewPopoverButton,
            //     clear_event: self.clear_event,
            //     label_track_selection: true,
            //     visible_callback: () => self.chart_state() === 'performance_metrics',
            //     css: {
            //         'btn-cpanel-light': true,
            //         'cpanel-btn-sm': true,
            //         'btn-block': true
            //     },
            //     popover_options: {
            //         title: 'As of Date',
            //         placement: 'right',
            //         css_class: 'popover-ghost-default',
            //     },
            //     popover_config: {
            //         component: Radiolist,
            //         clear_btn_css: {
            //             'btn-ghost-default': true,
            //             'btn-block': true,
            //             'btn-sm': true
            //         },
            //         datasource: {
            //             mapping: 'backend_dates_to_options',
            //             type: 'dynamic',
            //             query: {
            //                 target: 'research:as_of_dates',
            //                 provider: {
            //                     type: 'observer',
            //                     event_type: Utils.gen_event('PopoverButton.value', self.top_level_id, 'chart_provider'),
            //                     required: true,
            //                     mapping: 'get_value'
            //                 },
            //                 navs_only: true
            //             }
            //         }
            //     }
            // },
            {
                id: 'dispersion_of_returns_grouping_popover',
                id_callback: self.events.register_alias('dispersion_of_returns_grouping_popover'),
                label: 'Grouping',
                component: NewPopoverButton,
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.chart_state() === 'dispersion_of_returns',
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    default_selected_index: 1,
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    data: [
                        {
                            value: 'geography',
                            label: 'Geography',
                        },
                        {
                            value: 'style',
                            label: 'Style',
                        },
                        {
                            value: null,
                            label: 'All',
                        },
                    ],
                },
            },
            {
                id: 'liquidity_ratio_grouping_popover',
                id_callback: self.events.register_alias('liquidity_ratio_grouping_popover'),
                component: NewPopoverButton,
                css: {
                    'cpanel-btn-sm': true,
                    'btn-cpanel-light': true,
                    'btn-block': true,
                },
                clear_event: self.clear_event,
                label: 'Grouping',
                label_track_selection: true,
                visible_callback: () => self.chart_state() === 'liquidity_ratio',
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    default_selected_index: 2,
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    data: [
                        {
                            value: 'geography',
                            label: 'Geography',
                        },
                        {
                            value: 'style',
                            label: 'Style',
                        },
                        {
                            value: null,
                            label: 'All',
                        },
                    ],
                },
            },
            {
                id: 'performance_metrics_index_popover',
                id_callback: self.events.register_alias('performance_metrics_index_popover'),
                label: 'Index',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.visibility.performance_metrics_pme_index(),
                css: {
                    'btn-cpanel-light': true,
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Select Index',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
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
                    min_height: '350px',
                    filter_value_keys: ['sub_label', 'label'],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:index_options',
                            tree_mode: true,
                            date_range: {
                                type: 'observer',
                                event_type: self.events.get('performance_metrics_date_range'),
                                mapping: 'get_value',
                            },
                        },
                    },
                },
            },
            {
                id: 'performance_metrics_pme_methodology_popover',
                id_callback: self.events.register_alias(
                    'performance_metrics_pme_methodology_popover',
                ),
                label: 'Methodology',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.visibility.performance_metrics_pme_index(),
                css: {
                    'btn-cpanel-light': true,
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    default_selected_value: 'bison_pme',
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'pme:methodologies',
                            tree_mode: true,
                        },
                    },
                },
            },
            // {
            //     id: 'performance_metrics_horizon_popover',
            //     id_callback: self.events.register_alias('performance_metrics_horizon_popover'),
            //     label: 'Horizon',
            //     component: NewPopoverButton,
            //     clear_event: self.events.get('performance_metrics_as_of'),
            //     label_track_selection: true,
            //     visible_callback: () => self.chart_state() === 'performance_metrics',
            //     css: {
            //         'btn-cpanel-light': true,
            //         'cpanel-btn-sm': true,
            //         'btn-block': true
            //     },
            //     popover_options: {
            //         title: 'Horizon',
            //         placement: 'right',
            //         css_class: 'popover-ghost-default',
            //     },
            //     popover_config: {
            //         component: Radiolist,
            //         value_key: 'value',
            //         label_key: 'label',
            //         clear_btn_css: {
            //             'btn-ghost-default': true,
            //             'btn-block': true,
            //             'btn-sm': true
            //         },
            //         datasource: {
            //             type: 'dynamic',
            //             query: {
            //                 target: 'research:horizon_dates',
            //                 provider: {
            //                     type: 'observer',
            //                     mapping: 'get',
            //                     event_type: Utils.gen_event('PopoverButton.value', self.top_level_id, 'chart_provider'),
            //                     required: true
            //                 },
            //                 as_of_date: {
            //                     type: 'observer',
            //                     mapping: 'get',
            //                     event_type: self.events.get('performance_metrics_as_of')
            //                 }
            //             }
            //         }
            //     }
            // },
            {
                id: 'performance_metrics_metric_popover',
                id_callback: self.events.register_alias('performance_metrics_metric_popover'),
                label: 'Metric',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.chart_state() === 'performance_metrics',
                css: {
                    'btn-cpanel-light': true,
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Metrics',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    options: [
                        {
                            value: 'irr',
                            label: 'IRR',
                        },
                        {
                            value: 'tvpi',
                            label: 'TVPI',
                        },
                        {
                            value: 'rvpi',
                            label: 'RVPI',
                        },
                        {
                            value: 'dpi',
                            label: 'DPI',
                        },
                        {
                            value: 'pme',
                            label: 'PME',
                        },
                    ],
                },
            },
            {
                id: 'dispersion_metric_popover',
                id_callback: self.events.register_alias('dispersion_metric_popover'),
                label: 'Metric',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.chart_state() === 'dispersion_of_returns',
                css: {
                    'btn-cpanel-light': true,
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Metrics',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    options: [
                        {
                            value: 'irr',
                            label: 'IRR',
                        },
                        {
                            value: 'tvpi',
                            label: 'TVPI',
                        },
                        {
                            value: 'rvpi',
                            label: 'RVPI',
                        },
                        {
                            value: 'dpi',
                            label: 'DPI',
                        },
                    ],
                },
            },
            {
                id: 'performance_metrics_grouping_popover',
                id_callback: self.events.register_alias('performance_metrics_grouping_popover'),
                label: 'Grouping',
                component: NewPopoverButton,
                clear_event: self.clear_event,
                label_track_selection: true,
                visible_callback: () => self.chart_state() === 'performance_metrics',
                css: {
                    'btn-cpanel-light': true,
                    'cpanel-btn-sm': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Grouping',
                    placement: 'right',
                    css_class: 'popover-ghost-default',
                },
                popover_config: {
                    component: Radiolist,
                    value_key: 'value',
                    label_key: 'label',
                    default_selected_index: 2,
                    clear_btn_css: {
                        'btn-ghost-default': true,
                        'btn-block': true,
                        'btn-sm': true,
                    },
                    options: [
                        {
                            value: 'geography',
                            label: 'Geography',
                        },
                        {
                            value: 'style',
                            label: 'Style',
                        },
                        {
                            value: 'vintage_year',
                            label: 'Vintage Year',
                        },
                        {
                            value: null,
                            label: 'All',
                        },
                    ],
                },
            },
        ],
    };

    self.chart_block = {
        id: 'chart_block',
        component: Aside,
        template: 'tpl_chart_block',
        layout: {
            cpanel: 'chart_cpanel',
            chart: 'visualization',
        },
        components: [self.chart_cpanel, self.visualization],
    };

    self.chart_block_wrapper = {
        component: Aside,
        id: 'chart_block_wrapper',
        template: 'tpl_chart_block_wrapper_simple',
        layout: {
            body: 'chart_block',
        },
        components: [self.chart_block],
    };

    self.content = {
        component: Aside,
        id: 'content',
        template: 'tpl_aside_body',
        layout: {
            body: ['chart_block_wrapper', 'table'],
        },
        components: [self.chart_block_wrapper, self.table],
    };

    self.body = self.new_instance(Aside, {
        id: 'body',
        template: 'tpl_body',
        layout: {
            header: 'header',
            toolbar: 'action_toolbar',
            body: 'content',
        },
        components: [self.header, self.action_toolbar, self.content],
    });

    self.when(self.body).done(() => {
        self.dfd.resolve();
    });

    return self;
}
