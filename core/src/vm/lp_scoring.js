/* Automatically transformed from AMD to ES6. Beware of code smell. */
import PopoverEntitySearch from 'src/libs/components/popovers/PopoverEntitySearch';
import Radiolist from 'src/libs/components/basic/Radiolist';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import EventButton from 'src/libs/components/basic/EventButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import ko from 'knockout';
import $ from 'jquery';
import Context from 'src/libs/Context';
import Aside from 'src/libs/components/basic/Aside';
import DataSource from 'src/libs/DataSource';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataTable from 'src/libs/components/basic/DataTable';
import BubbleChart from 'src/libs/components/charts/BubbleChart';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';

export default function() {
    let self = new Context({
        id: 'datamanager',
    });

    self.dfd = $.Deferred();

    self.events = self.new_instance(EventRegistry, {});

    self.datasource = self.new_instance(DataSource, {
        get_data_timeout: 500,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'lp_scoring',
                fund_vintages: {
                    type: 'observer',
                    event_type: self.events.resolve_event('fund_vintages', 'PopoverButton.value'),
                    mapping: 'get_values',
                    required: true,
                },
                loss_ratio_vintages: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'loss_ratio_vintages',
                        'PopoverButton.value',
                    ),
                    mapping: 'get_values',
                    required: true,
                },
                selected_uid: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'selected_investor',
                        'PopoverButton.value',
                    ),
                    mapping: 'get',
                    mapping_args: {
                        key: 'uid',
                    },
                },
                match_investor_type: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'match_investor_type',
                        'BooleanButton.state',
                    ),
                },
                risk_threshold: {
                    type: 'observer',
                    event_type: self.events.resolve_event('risk_threshold', 'PopoverButton.value'),
                    mapping: 'get_value',
                    required: true,
                },
                fund_size_threshold: {
                    type: 'observer',
                    event_type: self.events.resolve_event(
                        'fund_size_threshold',
                        'PopoverButton.value',
                    ),
                    mapping: 'get_value',
                    required: true,
                },
                // filters: {
                //     type: 'dynamic',
                //     query: {
                //         investor_type: {
                //             type: 'observer',
                //             event_type: self.events.resolve_event('investor_type', 'PopoverButton.value'),
                //             mapping: 'get_values',
                //         },
                //         investor_uids: {
                //             type: 'observer',
                //             event_type: self.events.resolve_event('investor', 'PopoverButton.value'),
                //             mapping: 'get_values',
                //             mapping_args: {
                //                 key: 'uid',
                //             }
                //         },
                //     }
                // },
            },
        },
    });

    self.events.new('count');

    self.datasource.data.subscribe(data => {
        if (data && data.count) {
            Observer.broadcast(self.events.get('count'), data.count);
        }
    });

    self.chart = self.new_instance(BubbleChart, {
        label: 'LP Scoring',
        dependencies: [self.datasource.get_id()],
        label_in_chart: true,
        exporting: true,
        height: 600,
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data) {
                return data.metrics;
            }
        }),
        x_format: 'multiple',
        x_label: 'Fund Size Metric',
        y_format: 'percent',
        y_label: 'Risk Metric',
        z_label: 'Count',
        z_format: 'number',
    });

    self.table = self.new_instance(DataTable, {
        label: 'Investors',
        dependencies: [self.datasource.get_id()],
        inline_data: true,
        enable_csv_export: true,
        data: ko.computed(() => {
            let data = self.datasource.data();
            let rows = [];

            if (data && data.metrics) {
                for (let [investor, metrics] of Object.entries(data.metrics)) {
                    rows.push({
                        name: investor,
                        investor_type: metrics.investor_type,
                        fund_size: metrics.x,
                        risk: metrics.y,
                        count: metrics.z,
                    });
                }
            }

            return rows;
        }),
        columns: [
            {
                key: 'name',
                label: 'Name',
            },
            {
                key: 'investor_type',
                label: 'Investor Type',
            },
            {
                key: 'fund_size',
                label: 'Fund Size Metric',
                format: 'multiple',
            },
            {
                key: 'risk',
                label: 'Risk Metric',
                format: 'percent',
            },
            {
                key: 'count',
                label: 'Count',
                format: 'number',
            },
        ],
        results_per_page: 15,
        css: {'table-light': true, 'table-sm': true},
    });

    self.cpanel = self.new_instance(Aside, {
        id: 'cpanel',
        component: Aside,
        template: 'tpl_analytics_cpanel',
        layout: {
            body: [
                'meta_info',
                'fund_vintages',
                'loss_ratio_vintages',
                // 'investor_type',
                // 'investor',
                'selected_investor',
                'match_investor_type',
                'fund_size_threshold',
                'risk_threshold',
                'clear_button',
            ],
        },
        components: [
            {
                component: MetaInfo,
                id: 'meta_info',
                label: 'Count',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: self.events.get('count'),
                },
            },
            {
                id: 'clear_button',
                id_callback: self.events.register_alias('clear_button'),
                component: EventButton,
                template: 'tpl_cpanel_button',
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Restore Defaults',
            },
            {
                id: 'match_investor_type',
                id_callback: self.events.register_alias('match_investor_type'),
                component: BooleanButton,
                template: 'tpl_cpanel_boolean_button',
                default_state: true,
                label: 'Match Investor Type',
            },
            {
                id: 'risk_threshold',
                id_callback: self.events.register_alias('risk_threshold'),
                label: 'Risk Threshold',
                clear_event: self.events.resolve_event('clear_button', 'EventButton'),
                component: NewPopoverButton,
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Risk Threshold',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: [0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.1, 0.2, 0.5].map(v => ({
                        value: v,
                        label: Formatters.percent(v),
                    })),
                },
            },
            {
                id: 'fund_size_threshold',
                id_callback: self.events.register_alias('fund_size_threshold'),
                label: 'Fund Size Threshold',
                clear_event: self.events.resolve_event('clear_button', 'EventButton'),
                component: NewPopoverButton,
                label_track_selection: true,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                popover_options: {
                    title: 'Fund Size Threshold',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: Radiolist,
                    datasource: [0.1, 0.2, 0.3, 0.4, 0.5, 1.0, 2.0].map(v => ({
                        value: v,
                        label: Formatters.multiple(v),
                    })),
                },
            },
            {
                id: 'fund_vintages',
                id_callback: self.events.register_alias('fund_vintages'),
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Fund Vintages',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                label: 'Fund Vintages',
                reset_event: self.events.resolve_event('clear_button', 'EventButton'),
                enable_localstorage: true,
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:vintage_years',
                        },
                    },
                    selected_datasource: Number.range(2010, 2016).every(),
                },
            },
            {
                id: 'loss_ratio_vintages',
                id_callback: self.events.register_alias('loss_ratio_vintages'),
                component: NewPopoverButton,
                css: {
                    'btn-block': true,
                    'btn-cpanel-primary': true,
                    'btn-sm': true,
                },
                icon_css: 'glyphicon glyphicon-plus',
                popover_options: {
                    title: 'Loss Ratio Vintages',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                label: 'Loss Ratio Vintages',
                reset_event: self.events.resolve_event('clear_button', 'EventButton'),
                enable_localstorage: true,
                popover_config: {
                    component: Checklist,
                    enable_exclude: true,
                    datasource: {
                        type: 'dynamic',
                        mapping: 'list_to_options',
                        mapping_default: [],
                        query: {
                            target: 'market_data:vintage_years',
                        },
                    },
                    selected_datasource: Number.range(1990, 2011).every(),
                },
            },
            {
                id: 'selected_investor',
                id_callback: self.events.register_alias('selected_investor'),
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
                component: NewPopoverButton,
                clear_event: self.events.resolve_event('clear_button', 'EventButton'),
                label: 'Selected Investor',
                enable_localstorage: true,
                popover_config: {
                    component: PopoverEntitySearch,
                    single_selection: true,
                    data_target: 'market_data:investors',
                },
            },
        ],
    });

    self.when(self.cpanel, self.chart, self.table).done(() => {
        Observer.register_hash_listener('lp-scoring', url => {
            if (url.length === 1) {
                Observer.broadcast_for_id('UserAction', 'record_action', {
                    action_type: 'view_lp_scoring',
                });
            }
        });
        self.dfd.resolve();
    });

    return self;
}
