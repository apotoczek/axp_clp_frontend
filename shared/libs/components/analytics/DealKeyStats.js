/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 *   Main view of the deal analytics feature. A performance overview of the deal
 */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import DynamicWrapper from 'src/libs/components/basic/DynamicWrapper';
import RadioButtons from 'src/libs/components/basic/RadioButtons';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Radiolist from 'src/libs/components/basic/Radiolist';
import auth from 'auth';
import ReactWrapper from 'src/libs/components/ReactWrapper';
import * as Utils from 'src/libs/Utils';

import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import KeyStatsTable from 'containers/analytics/KeyStatsTable';
import MetricDataTable from 'containers/analytics/DealKeyStats/MetricDataTable';

export default class DealKeyStats extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.events = opts.events;

        if (!this.events || !this.events.get('company_uid')) {
            throw 'Trying to initialize DealKeyStats without company_uid_event';
        }

        this.disable_audit_trail = opts.disable_audit_trail ?? false;
        this.events.resolve_and_add('data_toggle', 'RadioButtons.state');
        this.events.resolve_and_add('metric_version_key_stats', 'PopoverButton.value');

        this.audit_trail_modal_data = ko.observable();
        this.edit_metric_value_modal_data = ko.observable();
        this.render_currency_symbol = Observer.observable(
            this.events.get('render_currency'),
            'USD',
            v => v?.symbol,
        );
        this.render_currency = Observer.observable(
            this.events.get('render_currency'),
            undefined,
            'get_value',
        );
        this.metric_version = Observer.observable(
            this.events.get('metric_version_key_stats'),
            undefined,
        );
        this.company_uid = Observer.observable(this.events.get('company_uid'));

        /***********************************************************
         *                   COMPONENTS
         ***********************************************************/

        let overview = this.init_overview();
        let data_view = this.init_data_view();
        let audit_trail_modal = this.init_audit_trail_modal();
        let edit_metric_value_modal = this.init_edit_metric_value_modal();

        let wrapper = this.new_instance(DynamicWrapper, {
            id: 'wrapper',
            active_component: 'overview',
            template: 'tpl_dynamic_wrapper',
            set_active_event: this.events.get('data_toggle'),
            components: [overview, data_view],
        });

        this.body = this.new_instance(Aside, {
            id: 'deal_performance_body',
            template: 'tpl_analytics_body_static',
            layout: {
                header: 'breadcrumbs',
                toolbar: 'header',
                expandable_meta_data: 'meta_data',
                body: ['wrapper', 'audit_trail_modal', 'edit_metric_value_modal'],
            },
            components: [wrapper, audit_trail_modal, edit_metric_value_modal],
        });

        this.cpanel = this.new_instance(Aside, {
            id: 'cpanel',
            template: 'tpl_analytics_cpanel',
            layout: {
                header: 'mode_toggle',
                body: ['metric_version', 'render_currency', 'data_toggle'],
            },
            components: [
                {
                    id: 'metric_version',
                    component: NewPopoverButton,
                    id_callback: this.events.register_alias('metric_version_key_stats'),
                    visible: auth.user_has_feature('metric_versions'),
                    label_track_selection: true,
                    label: 'Metric Version',
                    title: 'Metric Version',
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
                        component: Radiolist,
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
                    id: 'data_toggle',
                    component: RadioButtons,
                    id_callback: this.events.register_alias('data_toggle'),
                    template: 'tpl_cpanel_radio_toggle',
                    default_state: 'overview',
                    buttons: [
                        {
                            label: 'Show Key Stats',
                            state: 'overview',
                        },
                        {
                            label: 'Show Data',
                            state: 'data',
                        },
                    ],
                },
            ],
        });

        this.when(this.body, this.cpanel).done(() => {
            _dfd.resolve();
        });
    }

    init_data_view() {
        return this.new_instance(ReactWrapper, {
            id: 'data',
            reactComponent: MetricDataTable,
            props: ko.pureComputed(() => {
                return {
                    companyUid: this.company_uid(),
                    renderCurrencySymbol: this.render_currency_symbol(),
                    metricVersion: this.metric_version(),
                    onOpenAuditTrailModal: this.open_audit_trail_modal,
                    onOpenEditMetricValueModal: data => this.edit_metric_value_modal_data(data),
                    disableAuditTrail: this.disable_audit_trail,
                };
            }),
        });
    }

    init_overview() {
        return this.new_instance(ReactWrapper, {
            id: 'overview',
            reactComponent: KeyStatsTable,
            props: ko.pureComputed(() => {
                return {
                    companyUid: this.company_uid(),
                    renderCurrencySymbol: this.render_currency_symbol(),
                    metricVersion: this.metric_version()?.value,
                    onOpenAuditTrailModal: this.open_audit_trail_modal,
                    onOpenEditMetricValueModal: data => this.edit_metric_value_modal_data(data),
                    disableAuditTrail: this.disable_audit_trail,
                };
            }),
        });
    }

    init_audit_trail_modal() {
        return this.new_instance(ReactWrapper, {
            id: 'audit_trail_modal',
            reactComponent: AuditTrailModal,
            props: ko.pureComputed(() => {
                const {date, metricSetUid} = this.audit_trail_modal_data() ?? {};
                return {
                    isOpen: Utils.is_set(this.audit_trail_modal_data(), true),
                    toggleModal: this.close_audit_trail_modal,
                    companyUid: this.company_uid(),
                    enableEditModeToggle: false,
                    date,
                    metricSetUid,
                };
            }),
        });
    }

    init_edit_metric_value_modal() {
        return this.new_instance(ReactWrapper, {
            id: 'edit_metric_value_modal',
            reactComponent: EditMetricValueModal,
            props: ko.pureComputed(() => {
                const {date, metricSetUid} = this.edit_metric_value_modal_data() ?? {};
                return {
                    isOpen: Utils.is_set(this.edit_metric_value_modal_data(), true),
                    toggleModal: () => this.edit_metric_value_modal_data(null),
                    date,
                    metricSetUid,
                };
            }),
        });
    }

    open_audit_trail_modal = audit_modal_data => {
        this.audit_trail_modal_data(audit_modal_data);
    };

    close_audit_trail_modal = () => {
        this.audit_trail_modal_data(null);
    };
}
