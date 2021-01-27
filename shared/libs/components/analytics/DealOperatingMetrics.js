/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Handles the operating metrics view in deal analytics. Used primarly for viewing trendlines for different deal multiples
 */
import Observer from 'src/libs/Observer';
import Checklist from 'src/libs/components/basic/Checklist';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import DealTrendlines from 'src/libs/components/analytics/DealTrendlines';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import Radiolist from 'src/libs/components/basic/Radiolist';
import auth from 'auth';
import * as Constants from 'src/libs/Constants';
import RegExps from 'src/libs/RegExps';
import {match_array} from 'src/libs/Utils';

export default class DealOperatingMetrics extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        let _dfd = this.new_deferred();

        this.events = opts.events;
        this.events.resolve_and_add('chart_type', 'PopoverButton.value');
        this.events.resolve_and_add('metric_versions', 'PopoverButton.value');
        this.events.resolve_and_add('rate_of_change', 'PopoverButton.value');
        this.events.resolve_and_add('time_frame', 'PopoverButton.value');
        this.events.new('toggle_export');

        if (!this.events || !this.events.get('company_uid')) {
            throw 'Trying to initialize DealOperatingMetrics without company_uid_event';
        }

        /***********************s************************************
         *                   COMPONENTS
         ***********************************************************/

        this.body = this.new_instance(Aside, {
            id: 'operating_metrics_body',
            template: 'tpl_analytics_body_static',
            layout: {
                header: 'breadcrumbs',
                toolbar: 'header',
                expandable_meta_data: 'meta_data',
                body: ['trendlines'],
            },
            components: [
                {
                    id: 'trendlines',
                    component: DealTrendlines,
                    events: this.events,
                    disable_audit_trail: opts.disable_audit_trail ?? false,
                },
            ],
        });

        this.cpanel = this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: [
                    'metric_versions',
                    'render_currency',
                    'date_range',
                    'chart_type',
                    'rate_of_change',
                    'time_frame',
                ],
            },
            components: [
                {
                    id: 'metric_versions',
                    id_callback: this.events.register_alias('metric_versions'),
                    component: NewPopoverButton,
                    label_track_selection: true,
                    label: 'Metric Versions',
                    title: 'Metric Version',
                    visible: auth.user_has_feature('metric_versions'),
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
                                    event_type: this.events.get('company_uid'),
                                    required: true,
                                },
                                entity_type: 'company',
                            },
                        },
                    },
                },
                {
                    id: 'chart_type',
                    id_callback: this.events.register_alias('chart_type'),
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
                    id_callback: this.events.register_alias('rate_of_change'),
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
                    id_callback: this.events.register_alias('time_frame'),
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

        this.when(this.body, this.cpanel).done(() => {
            Observer.register_hash_listener(/(fund|reporting)-analytics/g, url => {
                const match = !!match_array(
                    url,
                    [
                        'fund-analytics',
                        'deal',
                        RegExps.uuid,
                        (_, page) => page === 'deal-operating-metrics',
                    ],
                    ['reporting-analytics', page => page === 'deal-operating-metrics'],
                );

                Observer.broadcast(this.events.get('toggle_export'), match);
            });

            _dfd.resolve();
        });
    }
}
