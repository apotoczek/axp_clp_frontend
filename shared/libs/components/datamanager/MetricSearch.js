/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import DataThing from 'src/libs/DataThing';
import CreateMetricModal from 'src/libs/components/modals/CreateMetricModal';
import EditMetricModal from 'src/libs/components/modals/EditMetricModal';
import MergeMetricsModal from 'src/libs/components/modals/MergeMetricsModal';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import EventButton from 'src/libs/components/basic/EventButton';

export default class MetricSearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry, {});
        events.resolve_and_add('edit', 'EventButton');

        this.results_per_page = opts.results_per_page || 50;

        this.clear_event = opts.clear_event;

        this.data_table_id = Utils.gen_id(this.get_id(), 'body', 'entities_table');

        DataManagerHelper.register_upload_wizard_event(
            Utils.gen_event(
                'ActionButton.action.upload',
                this.get_id(),
                'body',
                'action_toolbar',
                'upload',
            ),
        );

        this.edit_modal = this.new_instance(EditMetricModal, {
            id: 'edit_metric_modal',
        });

        Observer.register(events.get('edit'), data => {
            this.edit_modal.show_and_populate(data);
        });

        this._delete_metrics = DataThing.backends.useractionhandler({
            url: 'delete_metrics',
        });

        this.body = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_list_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: ['entities_table'],
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
                                    label: 'Data Manager',
                                    link: '#!/data-manager',
                                },
                                {
                                    label: 'Metrics',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'action_toolbar',
                    component: ActionHeader,
                    template: 'tpl_action_toolbar',
                    disable_export: true,
                    buttons: [
                        DataManagerHelper.buttons.confirm({
                            data_table_id: this.data_table_id,
                            label: 'Delete Selected <span class="icon-trash-1"></span>',
                            text: 'Are you sure you want to delete the selected metrics?',
                            callback: metrics => {
                                this._delete_metrics({
                                    data: {
                                        metric_uids: metrics.map(m => m.uid),
                                    },
                                    success: DataThing.api.XHRSuccess(() => {
                                        DataThing.status_check();
                                    }),
                                });
                            },
                        }),
                        DataManagerHelper.buttons.upload(),
                        {
                            id: 'new_metric',
                            action: 'new_metric',
                            label:
                                'New Metric <span class="glyphicon glyphicon-plus" style="margin-right:5px;"></span>',
                            trigger_modal: {
                                id: 'create_metric_modal',
                                component: CreateMetricModal,
                            },
                        },
                        {
                            id: 'consolidate_metric_sets',
                            action: 'consolidate_metric_sets',
                            label:
                                'Consolidate Metric Sets <span class="glyphicon glyphicon-resize-small"></span>',
                            trigger_modal: {
                                id: 'merge_metrics_modal',
                                component: MergeMetricsModal,
                            },
                            datasource: {
                                type: 'observer',
                                default: [],
                                event_type: Utils.gen_event(
                                    'DataTable.selected',
                                    this.data_table_id,
                                ),
                            },
                            disabled_callback: data => {
                                return data.length < 2;
                            },
                        },
                    ],
                },
                {
                    component: DataTable,
                    id: 'entities_table',
                    enable_selection: true,
                    enable_clear_order: true,
                    column_toggle_css: {'fixed-column-toggle': true},
                    css: {'table-light': true, 'table-sm': true},
                    results_per_page: this.results_per_page,
                    clear_order_event: this.clear_event,
                    empty_template: 'tpl_data_table_empty_metrics',
                    columns: [
                        {
                            label: 'Name',
                            sort_key: 'name',
                            component_callback: 'data',
                            component: {
                                id: 'edit',
                                id_callback: events.register_alias('edit'),
                                component: EventButton,
                                template: 'tpl_text_button',
                                label_key: 'name',
                            },
                        },
                        {
                            label: 'Value Type',
                            key: 'value_type',
                        },
                        {
                            label: 'Reporting Period',
                            sort_key: 'reporting_period',
                            key: 'reporting_period',
                        },
                        {
                            label: 'Format / Unit',
                            sort_key: 'format',
                            key: 'format_label',
                        },
                        {
                            label: 'Number of sets',
                            key: 'set_count',
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'user:metrics',
                        },
                    },
                },
            ],
        });

        this.when(this.body).done(() => {
            _dfd.resolve();
        });
    }
}
