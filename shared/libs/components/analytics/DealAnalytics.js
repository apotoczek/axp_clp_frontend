/**
 *   The entrypoint component for Deals in analytics.
 *   This component does not handle any visual elements but rather facilitates
 *   the different underlying components that makes up the feature
 */

import Radiolist from 'src/libs/components/basic/Radiolist';
import PopoverChecklistCustomValue from 'src/libs/components/popovers/PopoverChecklistCustomValue';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import VehicleHelper from 'src/libs/helpers/VehicleHelper';
import DealMetaData from 'src/libs/components/analytics/DealMetaData';
import DealKeyStats from 'src/libs/components/analytics/DealKeyStats';
import DealOperatingMetrics from 'src/libs/components/analytics/DealOperatingMetrics';
import DealPerformance from 'src/libs/components/analytics/DealPerformance';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import ExpandableMetaData from 'src/libs/components/basic/ExpandableMetaData';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';

class DealAnalytics extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();

        const default_mode = opts.default_mode || 'deal_performance';
        const events = this.new_instance(EventRegistry);

        this.no_cashflows = opts.no_cashflows || false;
        this.disable_audit_trail = opts.disable_audit_trail ?? false;

        events.add({
            name: 'set_mode_event',
            event: opts.set_mode_event,
            id: null,
        });
        events.add({name: 'deal_uid_event', event: 'Active.deal_uid'});
        events.add({name: 'company_uid', event: 'Active.company_uid'});
        events.resolve_and_add('render_currency', 'PopoverButton.value');
        events.resolve_and_add('as_of_date', 'PopoverButton.value');
        events.resolve_and_add('date_range', 'PopoverButton.value');
        events.resolve_and_add('register_export', 'DynamicActions.register_action');
        events.resolve_and_add('register_export', 'DynamicActions.enabled', 'enable_export');

        const modes = this.init_modes(opts.modes);

        const shared_components = this.init_shared_components(
            events,
            modes,
            default_mode,
            opts.breadcrumbs,
            opts.disable_edit,
        );

        /***********************************************************
         *                   VIEWS
         ***********************************************************/

        const instances = {};

        for (const {state, cls} of modes) {
            instances[state] = this.new_instance(
                cls,
                {
                    id: state,
                    events: events,
                    no_cashflows: this.no_cashflows,
                    disable_audit_trail: this.disable_audit_trail,
                },
                shared_components,
            );
        }

        /**
         *   Asides describes the current active elements. It should contain two elements.
         *   The first being the cpanel and the body as the second. analytics.js will grab these  and display them appropriately
         */
        this.asides = ko.observableArray([]);

        this.when(instances, shared_components).done(() => {
            this.mode = ko.observable(default_mode);

            Observer.register(events.get('set_mode_event'), this.mode);

            DataManagerHelper.register_view_in_datamanager_event(
                Utils.gen_event(
                    'ActionButton.action.view_in_datamanager',
                    this.get_id(),
                    'header',
                    'view_in_datamanager',
                ),
            );

            const navigate_to_mode = mode => {
                const identifier = this.deal_uid();

                if (identifier) {
                    Observer.broadcast_for_id('UserAction', 'record_action', {
                        action_type: `view_${mode}`,
                        entity_type: 'company',
                        identifier: identifier,
                    });
                }

                VehicleHelper.navigate_to_mode(mode, default_mode);
            };

            Observer.register(
                Utils.gen_event('RadioButtons.state', this.get_id(), 'mode_toggle'),
                navigate_to_mode,
            );

            const valid_export_modes = ['deal_performance', 'deal_operating_metrics'];

            /**
             *   Alters the page by setting the active cpanel and body to that of the view component
             */
            Observer.register(events.get('set_mode_event'), mode => {
                Observer.broadcast(events.get('enable_export'), {
                    enabled: valid_export_modes.includes(mode),
                    title: 'Current Page',
                });

                const instance = instances[`${mode}`];

                this.asides([instance.cpanel, instance.body]);
            });

            this.deal_uid = ko.observable();

            Observer.register(events.get('deal_uid_event'), deal_uid => {
                if (deal_uid) {
                    Observer.broadcast_for_id('UserAction', 'record_action', {
                        action_type: 'view_deal_performance',
                        entity_type: 'company',
                        identifier: deal_uid,
                    });

                    DataThing.get({
                        params: {
                            target: 'deal_data',
                            deal_uid: deal_uid,
                        },
                        success: data => {
                            Observer.broadcast(events.get('company_uid'), data.company_uid);
                        },
                    });
                }
                this.deal_uid(deal_uid);
            });

            const download_pdf_event = Utils.gen_event('DealAnalytics.download_pdf', this.get_id());

            Observer.broadcast(
                events.get('register_export'),
                {
                    title: 'Current Page',
                    subtitle: 'PDF',
                    event_type: download_pdf_event,
                },
                true,
            );

            const prepare_pdf = DataThing.backends.download({
                url: 'prepare_analytics_pdf',
            });

            Observer.register(download_pdf_event, () => {
                const mode = this.mode();
                const uid = this.deal_uid();

                const body_content_id = Utils.html_id(this.asides()[1].get_id());

                if (mode && uid) {
                    prepare_pdf({
                        data: {
                            html: $(`#${body_content_id}`).html(),
                            width: $(`#${body_content_id}`).width(),
                            height: $(`#${body_content_id}`).height(),
                            mode: mode,
                            uid: uid,
                            entity_type: 'company',
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_pdf_base + key);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                }
            });

            _dfd.resolve();
        });
    }

    init_modes(modes) {
        const valid_modes = [
            {
                label: 'Meta Data',
                state: 'deal_meta_data',
                cls: DealMetaData,
            },
            {
                label: 'Deal Performance',
                state: 'deal_performance',
                cls: DealPerformance,
            },
            {
                label: 'Key Stats',
                state: 'deal_key_stats',
                cls: DealKeyStats,
            },
            {
                label: 'Operating Metrics',
                state: 'deal_operating_metrics',
                cls: DealOperatingMetrics,
            },
        ];

        const defaults = ['deal_performance', 'deal_key_stats', 'deal_operating_metrics'];

        const mode_index = Utils.object_from_array(valid_modes, m => [m.state, m]);

        if (modes) {
            return modes.map(id => mode_index[id]);
        }

        return defaults.map(id => mode_index[id]);
    }

    init_shared_components(events, modes, default_mode, breadcrumbs, disable_edit = false) {
        const toolbar_buttons = [];

        if (!disable_edit) {
            toolbar_buttons.push(
                DataManagerHelper.buttons.view_in_datamanager({check_permissions: true}),
            );
        }

        let meta_datasource, default_breadcrumbs;

        if (this.no_cashflows) {
            default_breadcrumbs = [
                {
                    label: 'My Investments',
                    link: '#!/analytics',
                },
                {
                    label_key: 'name',
                    inherit_data: true,
                },
            ];

            meta_datasource = {
                type: 'dynamic',
                query: {
                    target: 'company_data',
                    company_uid: {
                        type: 'observer',
                        event_type: events.get('company_uid'),
                        required: true,
                    },
                },
            };
        } else {
            default_breadcrumbs = [
                {
                    label: 'My Investments',
                    link: '#!/analytics',
                },
                {
                    label_key: 'fund_name',
                    contextual_url: {
                        url: 'analytics/fund/gross/<user_fund_uid>',
                    },
                    inherit_data: true,
                },
                {
                    label_key: 'company_name',
                    inherit_data: true,
                },
            ];

            meta_datasource = {
                type: 'dynamic',
                query: {
                    target: 'deal_data',
                    deal_uid: {
                        type: 'observer',
                        event_type: events.get('deal_uid_event'),
                        required: true,
                    },
                },
            };
        }

        return {
            header: this.new_instance(ActionHeader, {
                id: 'header',
                template: 'tpl_action_toolbar',
                export_id_callback: events.register_alias('register_export'),
                buttons: toolbar_buttons,
                datasource: meta_datasource,
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
                        items: breadcrumbs || default_breadcrumbs,
                        datasource: meta_datasource,
                    },
                ],
            }),
            meta_data: this.new_instance(ExpandableMetaData, {
                id: 'expandable_meta_data',
                metrics: [
                    {
                        label: 'Company Name',
                        value_key: 'name',
                    },
                    {
                        label: 'Fund',
                        value_key: 'user_fund_name',
                    },
                    {
                        label: 'Country',
                        value_key: 'country',
                    },
                    {
                        label: 'Deal Team Leader',
                        value_key: 'deal_team_leader',
                    },
                    {
                        label: 'Deal Type',
                        value_key: 'deal_type',
                    },
                    {
                        label: 'Deal Role',
                        value_key: 'deal_role',
                    },
                    {
                        label: 'Geography',
                        value_key: 'attributes:geography',
                    },
                ],
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'deal_data',
                        deal_uid: {
                            type: 'observer',
                            event_type: events.get('deal_uid_event'),
                            required: true,
                        },
                    },
                },
            }),
            mode_toggle: this.new_instance(RadioButtons, {
                id: 'mode_toggle',
                component: RadioButtons,
                template: 'tpl_full_width_radio_buttons',
                default_state: default_mode,
                set_state_event: events.get('set_mode_event'),
                buttons: modes,
                button_css: {
                    'btn-block': true,
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                },
            }),
            filter_label: this.new_instance(HTMLContent, {
                id: 'filter_label',
                html: '<h5>Filters</h5>',
            }),
            date_range: this.new_instance(NewPopoverButton, {
                id: 'date_range',
                id_callback: events.register_alias('date_range'),
                label: 'Date Range',
                label_track_selection: true,
                hide_icon: true,
                css: {
                    'btn-sm': true,
                    'btn-cpanel-primary': true,
                    'btn-block': true,
                },
                popover_options: {
                    title: 'Date Range',
                    placement: 'right',
                    css_class: 'popover-cpanel',
                },
                popover_config: {
                    component: PopoverInputRange,
                    placement: 'right',
                    title: 'Range',
                    mode: 'date',
                    min: {
                        placeholder: 'Start',
                        in_cpanel: true,
                    },
                    max: {
                        placeholder: 'End',
                        in_cpanel: true,
                    },
                },
            }),
            as_of_date: this.new_instance(NewPopoverButton, {
                id: 'as_of_date',
                id_callback: events.register_alias('as_of_date'),
                label: 'As of',
                track_selection: true,
                hide_icon: true,
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
                    component: PopoverChecklistCustomValue,
                    custom_value_placeholder: 'Custom Date',
                    custom_value_mapping: 'date_to_epoch',
                    single_selection: true,
                    selected_idx: 0,
                    disable_untoggle: true,
                    placement: 'right',
                    title: 'Select As of Date',
                    empty_text: 'Insufficient cash flows',
                    datasource: {
                        mapping: 'backend_dates_to_options',
                        mapping_default: [],
                        type: 'dynamic',
                        query: {
                            target: 'vehicle:as_of_dates',
                            deal_uid: {
                                type: 'observer',
                                event_type: events.get('deal_uid_event'),
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
                                event_type: events.get('deal_uid_event'),
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
                                event_type: events.get('deal_uid_event'),
                            },
                        },
                    },
                },
            }),
        };
    }
}

export default DealAnalytics;
