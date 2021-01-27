import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Aside from 'src/libs/components/basic/Aside';
import DataThing from 'src/libs/DataThing';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import DataManagerHelper from 'src/libs/helpers/DataManagerHelper';
import DataTable from 'src/libs/components/basic/DataTable';
import EventButton from 'src/libs/components/basic/EventButton';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import MetricVersionModal from 'src/libs/components/modals/MetricVersionModal';
import {MetricVersionType} from 'src/libs/Enums';
class MetricVersionsSearch extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();

        const events = this.new_instance(EventRegistry, {});

        events.resolve_and_add('edit', 'EventButton');

        this.template = 'tpl_data_manager_form_table';

        this.edit_modal = this.new_instance(MetricVersionModal, {
            id: 'edit_metric_version',
            edit_mode: true,
            title: 'Edit Metric Version',
        });

        Observer.register(events.get('edit'), data => {
            this.edit_modal.show_and_populate(data);
        });

        this._delete_metric_versions = DataThing.backends.useractionhandler({
            url: 'delete_metric_versions',
        });

        this._set_default_metric_version = DataThing.backends.useractionhandler({
            url: 'set_default_metric_version',
        });

        this.body = this.new_instance(Aside, {
            id: 'body',
            template: 'tpl_list_body',
            layout: {
                header: 'header',
                toolbar: 'action_toolbar',
                body: ['versions_table'],
            },
            components: [
                {
                    component: BreadcrumbHeader,
                    id: 'header',
                    template: 'tpl_breadcrumb_header',
                    buttons: [
                        {
                            id: 'tips',
                            label:
                                'How to Use <span class="glyphicon glyphicon-info-sign" style="margin-right:5px;"></span>',
                            action: 'show_modal',
                        },
                    ],
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
                                    label: 'Attributes',
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
                            data_table_id: Utils.gen_id(this.get_id(), 'body', 'versions_table'),
                            label: 'Delete Selected <span class="icon-trash-1"></span>',
                            text:
                                'Are you sure you want to delete the selected metric versions and all metrics tied to them?',
                            callback: versions => {
                                this._delete_metric_versions({
                                    data: {
                                        metric_version_uids: versions.map(v => v.uid),
                                    },
                                    success: DataThing.api.XHRSuccess(() => {
                                        DataThing.status_check();
                                    }),
                                });
                            },
                        }),
                        DataManagerHelper.buttons.confirm({
                            data_table_id: Utils.gen_id(this.get_id(), 'body', 'versions_table'),
                            label: 'Set Default <span class="icon-trash-1"></span>',
                            text: 'Are you sure you want to set this version to Default?',
                            single_selection: true,
                            callback: versions => {
                                this._set_default_metric_version({
                                    data: {
                                        metric_version_uid: versions[0].uid,
                                    },
                                    success: DataThing.api.XHRSuccess(() => {
                                        DataThing.status_check();
                                    }),
                                });
                            },
                        }),
                        {
                            id: 'new_metric',
                            action: 'new_metric',
                            label:
                                'New Version <span class="glyphicon glyphicon-plus" style="margin-right:5px;"></span>',
                            trigger_modal: {
                                id: 'metric_modal',
                                component: MetricVersionModal,
                                title: 'New Metric Version',
                            },
                        },
                    ],
                },
                {
                    component: DataTable,
                    id: 'versions_table',
                    enable_selection: true,
                    enable_clear_order: true,
                    column_toggle_css: {'fixed-column-toggle': true},
                    css: {'table-light': true, 'table-sm': true},
                    empty_template: 'tpl_data_table_empty_metrics',
                    results_per_page: 'all',
                    columns: [
                        {
                            label: 'Name',
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
                            label: 'Version Type',
                            key: 'version_type',
                            formatter: version_type => {
                                switch (version_type) {
                                    case MetricVersionType.Backward:
                                        return 'Backward-looking';
                                    case MetricVersionType.Forward:
                                        return 'Forward-looking';
                                }
                            },
                        },
                        {
                            label: 'Description',
                            key: 'description',
                        },
                        {
                            label: 'Default Version',
                            key: 'default_version',
                            format: 'boolean',
                        },
                        {
                            label: 'Number of Sets',
                            key: 'set_count',
                        },
                    ],
                    datasource: {
                        type: 'dynamic',
                        query: {
                            target: 'metric_versions_for_client',
                        },
                    },
                },
            ],
        });
        _dfd.resolve();
    }
}

export default MetricVersionsSearch;
