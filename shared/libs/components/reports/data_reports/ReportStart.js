/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import DataReportModal from 'src/libs/components/how_to_modals/DataReportModal';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import TemplateSelector from 'src/libs/components/reports/TemplateSelector';
import TemplatePreview from 'src/libs/components/reports/TemplatePreview';
import ProgressIndicator from 'src/libs/components/reports/data_reports/ProgressIndicator';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import Observer from 'src/libs/Observer';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.progress_update_event = opts.progress_update_event;

    self.define_default_template(`
            <div class="layout-aside page analytics full-body no-cpanel">
                <div class="layout-vbox">
                    <div class="row">
                        <div class="col-xs-6"></div>
                        <div class="col-xs-6"></div>
                    </div>
                    <!-- ko renderComponent: header --><!-- /ko -->
                    <!-- ko renderComponent: action_toolbar --><!-- /ko -->
                    <div class="scrollable content page">
                        <!-- ko renderComponent: template_selector --><!-- /ko -->
                        <!-- ko renderComponent: template_preview --><!-- /ko -->
                        <!-- ko renderComponent: progress_indicator --><!-- /ko -->
                        <!-- ko renderComponent: table --><!-- /ko -->
                    </div>
                </div>
            </div>
        `);

    self._prepare_data_report_xls = DataThing.backends.useractionhandler({
        url: 'prepare_data_report_xls',
    });

    self._delete_report = DataThing.backends.useractionhandler({
        url: 'delete_data_report',
    });

    self._delete_reports = DataThing.backends.useractionhandler({
        url: 'delete_data_reports',
    });

    self.events = self.new_instance(EventRegistry, {});

    self.events.new('preview');
    self.events.new('confirm_delete');
    self.events.new('generate_report');

    self.progress_indicator = self.new_instance(ProgressIndicator, {
        id: 'progress_indicator',
        title: 'Pending Reports',
        progress_update_event: self.progress_update_event,
    });

    self.table = self.new_instance(DataTable, {
        id: 'reports_table',
        enable_localstorage: true,
        enable_clear_order: true,
        css: {'table-light': true, 'table-sm': true},
        empty_template: 'tpl_data_table_empty_data_reports',
        row_key: 'uid',
        enable_selection: true,
        columns: [
            {
                label: 'Name',
                sort_key: 'name',
                format: 'contextual_link',
                format_args: {
                    url: 'data-reports/<sub_type>/<uid>',
                    label_key: 'name',
                },
            },
            {
                label: 'Type',
                key: 'sub_type',
                format: 'enumeration',
                format_args: {
                    mapping: {
                        pme_benchmark: 'PME Benchmark',
                        time_weighted: 'Time-Weighted Analysis',
                    },
                },
            },
            {
                label: 'Created',
                key: 'created',
                format: 'backend_local_datetime',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'data_reports',
                results_per_page: 50,
            },
        },
    });

    self.header = self.new_instance(BreadcrumbHeader, {
        id: 'header',
        template: 'tpl_breadcrumb_header',
        buttons: [
            {
                id: 'tips',
                label: 'How to Use <span class="glyphicon glyphicon-info-sign"></span>',
                trigger_modal: {
                    component: DataReportModal,
                },
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
                        label: 'Data Reports',
                    },
                    {
                        label: 'Start',
                    },
                ],
            },
        ],
    });

    self.action_toolbar = self.new_instance(ActionHeader, {
        component: ActionHeader,
        id: 'action_toolbar',
        template: 'tpl_action_toolbar',
        data_table_id: self.table.get_id(),
        disable_export: true,
        datasource: {
            type: 'observer',
            event_type: Utils.gen_event('DataTable.selected', self.table.get_id()),
        },
        buttons: [
            {
                id: 'delete',
                action: 'delete_selected',
                id_callback: self.events.register_alias('delete_selected'),
                css: {
                    btn: true,
                    'btn-transparent-danger': true,
                },
                label: 'Delete Selected <span class="icon-trash-1"></span>',
                disabled_callback: function(data) {
                    if (Object.isArray(data)) {
                        return data.length < 1;
                    }
                },
                use_header_data: true,
            },
        ],
    });

    self.template_selector = self.new_instance(TemplateSelector, {
        id: 'report_template_selector',
        datasource: {
            type: 'dynamic',
            query: {
                target: 'data_report_templates',
            },
        },
        preview_event: self.events.get('preview'),
    });

    self.template_preview = self.new_instance(TemplatePreview, {
        id: 'template_preview',
        datasource: {
            type: 'dynamic',
            query: {
                target: 'data_report_templates',
            },
        },
        default_preview_img: require('src/img/excel.png'),
        preview_event: self.events.get('preview'),
        generate_report_event: self.events.get('generate_report'),
    });

    self.confirm_delete_modal = self.new_instance(ConfirmDeleteModal, {
        id: 'confirm_delete_modal',
        text: 'Are you sure you want to delete the selected reports?',
        confirm_delete_event: self.events.get('confirm_delete'),
    });

    self.when(
        self.confirm_delete_modal,
        self.table,
        self.header,
        self.action_toolbar,
        self.template_selector,
        self.template_preview,
    ).done(() => {
        Observer.register(
            self.events.resolve_event('delete_selected', 'ActionButton.action.delete_selected'),
            payload => {
                self.confirm_delete_modal.payload(payload);
                self.confirm_delete_modal.show();
            },
        );

        Observer.register(self.events.get('confirm_delete'), payload => {
            if (payload) {
                self._delete_reports({
                    data: {uids: payload.map(report => report.uid)},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
            }
        });

        _dfd.resolve();
    });

    return self;
}
