/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DynamicActionButton from 'src/libs/components/basic/DynamicActionButton';
import EventButton from 'src/libs/components/basic/EventButton';
import MetaInfo from 'src/libs/components/MetaInfo';
import StringFilter from 'src/libs/components/basic/StringFilter';
import Label from 'src/libs/components/basic/Label';
import ActionButton from 'src/libs/components/basic/ActionButton';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import pager from 'pager';
import config from 'config';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Formatters from 'src/libs/Formatters';
import Aside from 'src/libs/components/basic/Aside';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import ConfirmDeleteModal from 'src/libs/components/modals/ConfirmDeleteModal';
import ProgressIndicator from 'src/libs/components/reports/data_reports/ProgressIndicator';

export default class ReportArchive extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.progress_update_event = opts.progress_update_event;

        this.dfd = this.new_deferred();
        this.events = this.new_instance(EventRegistry, {});

        this.register_export_event = Utils.gen_event(
            'DynamicActions.register_action',
            this.get_id(),
            'toolbar',
            'export_actions',
        );

        this.events.new('confirm_delete');

        this.define_template(`
                <!-- ko renderComponent: cpanel --><!-- /ko -->
                <div class="layout-aside page analytics">
                    <div class="layout-vbox">
                        <div class="row">
                            <div class="col-xs-6"></div>
                            <div class="col-xs-6"></div>
                        </div>
                        <!-- ko renderComponent: header --><!-- /ko -->
                        <!-- ko renderComponent: toolbar --><!-- /ko -->
                        <div class="scrollable content page">
                            <!-- ko renderComponent: progress_indicator --><!-- /ko -->
                            <!-- ko renderComponent: table --><!-- /ko -->
                        </div>
                    </div>
                </div>
            `);

        this._delete_reports = DataThing.backends.useractionhandler({
            url: 'delete_reports',
        });

        this._prepare_data_report_xls = DataThing.backends.useractionhandler({
            url: 'prepare_data_report_xls',
        });

        this._prepare_fund_modeler_pdf = DataThing.backends.useractionhandler({
            url: 'prepare_fund_modeler_pdf',
        });

        this._copy_visual_report = DataThing.backends.useractionhandler({
            url: 'copy_visual_report',
        });

        this.progress_indicator = this.new_instance(ProgressIndicator, {
            id: 'progress_indicator',
            title: 'Pending Reports',
            progress_update_event: this.progress_update_event,
        });

        this.cpanel = this.init_cpanel();
        this.table = this.init_table();
        this.header = this.init_header();
        this.toolbar = this.init_toolbar();

        this.register_export = function(title, subtitle, callback) {
            let export_event = Observer.gen_event_type();

            Observer.broadcast(
                this.register_export_event,
                {
                    title: title,
                    subtitle: subtitle,
                    type: 'Reports',
                    event_type: export_event,
                },
                true,
            );

            Observer.register(export_event, callback);
        };

        this.register_export('Reports List', 'CSV', () => {
            this.table.export_csv();
        });

        this.confirm_delete_modal = this.new_instance(ConfirmDeleteModal, {
            id: 'confirm_delete_modal',
            text: 'Are you sure you want to delete the selected reports?',
            confirm_delete_event: this.events.get('confirm_delete'),
        });

        this.when(
            this.cpanel,
            this.header,
            this.toolbar,
            this.table,
            this.confirm_delete_modal,
        ).done(() => {
            this.dfd.resolve();

            this.setup_event_listeners();
        });
    }

    init_header() {
        return this.new_instance(BreadcrumbHeader, {
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
                            label: 'Reports',
                        },
                    ],
                },
            ],
        });
    }

    init_toolbar() {
        return this.new_instance(ActionHeader, {
            component: ActionHeader,
            id: 'toolbar',
            template: 'tpl_action_toolbar',
            data_table_id: Utils.gen_id(this.get_id(), 'table'),
            datasource: {
                type: 'observer',
                event_type: Utils.gen_event(
                    'DataTable.selected',
                    Utils.gen_id(this.get_id(), 'table'),
                ),
            },
            buttons: [
                {
                    id: 'delete',
                    action: 'delete_selected',
                    id_callback: this.events.register_alias('delete_selected'),
                    label: 'Delete Selected <span class="icon-trash-1"></span>',
                    disabled_callback: data => {
                        if (Object.isArray(data)) {
                            return data.length < 1;
                        }
                    },
                    use_header_data: true,
                },
                {
                    id: 'create_new_report',
                    component: ActionButton,
                    label: '<span class="icon-doc-text"></span> Create New Report',
                    trigger_url: {url: 'report-menu'},
                },
            ],
        });
    }

    init_cpanel() {
        const events = this.new_instance(EventRegistry, {});
        let data_table_count_event = Utils.gen_event('DataTable.count', this.get_id(), 'table');
        const clear_event = events.resolve_and_add('clear', 'EventButton');
        let components = [
            {
                component: Label,
                id: 'search_label',
                css: {'first-header': true},
                template: 'tpl_cpanel_label',
                label: 'Search',
            },
            {
                component: StringFilter,
                id: 'name',
                id_callback: this.events.register_alias('name_filter'),
                template: 'tpl_string_filter',
                enable_localstorage: true,
                placeholder: 'Name...',
                cpanel_style: true,
                set_state_event_type: 'StateHandler.load',
                clear_event: clear_event,
            },
            {
                component: MetaInfo,
                id: 'meta_info',
                label: 'Results',
                format: 'number',
                datasource: {
                    type: 'observer',
                    event_type: data_table_count_event,
                },
            },
            {
                component: EventButton,
                id: 'clear_button',
                template: 'tpl_cpanel_button',
                id_callback: events.register_alias('clear'),
                css: {'btn-sm': true, 'btn-default': true},
                label: 'Clear All',
            },
        ];

        return this.new_instance(Aside, {
            id: 'cpanel',
            title: 'Reports',
            title_css: 'performance-calculator',
            template: 'tpl_analytics_cpanel',
            layout: {
                body: ['search_label', 'name', 'meta_info', 'clear_button'],
            },
            components: components,
        });
    }

    init_table() {
        let is_editable = report => {
            return report.report_type != 'fund_modeler_report' && !report.is_frozen;
        };

        return this.new_instance(DataTable, {
            id: 'table',
            empty_template: 'tpl_empty_reports_table',
            enable_localstorage: true,
            enable_clear_order: true,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 50,
            row_key: 'uid',
            enable_selection: true,
            register_export: {
                export_event_id: this.register_export_event,
                title: 'Reports Table',
                subtitle: 'CSV',
            },
            columns: [
                {
                    disable_sorting: true,
                    key: 'is_frozen',
                    format: 'enumeration',
                    type: 'icon',
                    format_args: {
                        mapping: {
                            true:
                                '<span class="glyphicon glyphicon-lock" title="This report is locked and cannot be modified.."></span>',
                            false: '',
                        },
                    },
                    width: '1%',
                },
                {
                    label: 'Name',
                    key: 'name',
                    format: 'truncate',
                    format_args: {
                        max_length: 50,
                    },
                },
                {
                    label: 'Type',
                    key: 'report_type',
                    formatter: type => {
                        if (type == 'data_report') {
                            return 'Data';
                        }

                        return 'Visual';
                    },
                },
                {
                    label: 'Sub Type',
                    key: 'sub_type',
                    formatter: sub_type => {
                        if (sub_type) {
                            switch (sub_type) {
                                case 'lp_update':
                                    return 'Performance Dashboard';
                                case 'fbr':
                                    return 'FBR';
                                case 'lp_insider_report':
                                case 'lp_report':
                                    return 'LP Report';
                                case 'deal_report':
                                    return 'Deal Intelligence Report';
                                case 'pme_benchmark':
                                    return 'PME Benchmark';
                                case 'delayed_cashflows':
                                    return 'Delayed Cashflow IRRs';
                                case 'hl_portfolio_report':
                                    return 'Portfolio Review Report';
                                default:
                                    return sub_type.titleize();
                            }
                        }

                        return '<span class="text-muted">N/A</span>';
                    },
                    disable_sorting: true,
                },
                {
                    label: 'Date',
                    key: 'created',
                    format: 'backend_local_date',
                },
                {
                    format: 'view_report_archive_link',
                    width: '80px',
                },
                {
                    component_callback: 'data',
                    always_visible: true,
                    disable_sorting: true,
                    type: 'component',
                    width: '80px',
                    component: {
                        id: 'rerun',
                        component: DynamicActionButton,
                        action_callback: report => (is_editable(report) ? 'edit' : 'rerun'),
                        label_callback: report => (is_editable(report) ? 'Edit' : 'Re-Run'),
                        css: {
                            'btn-ghost-default': true,
                            'btn-xs': true,
                            'report-archive-action': true,
                        },
                    },
                },
                {
                    component_callback: 'data',
                    always_visible: true,
                    disable_sorting: true,
                    type: 'component',
                    width: '80px',
                    component: {
                        hidden_callback: report => !report || !report.binary_asset_uid,
                        disabled_callback: report => !report || !report.binary_asset_uid,
                        id: 'download',
                        component: ActionButton,
                        action: 'download',
                        label: 'Download',
                        css: {
                            'btn-ghost-default': true,
                            'btn-xs': true,
                            'report-archive-action': true,
                        },
                    },
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'get_reports',
                    include_params: true,
                    filters: {
                        type: 'dynamic',
                        query: {
                            string_filter: {
                                type: 'observer',
                                event_type: this.events.resolve_event(
                                    'name_filter',
                                    'StringFilter.value',
                                ),
                                default: '',
                            },
                        },
                    },
                    order_by: [
                        {
                            name: 'created',
                            sort: 'desc',
                        },
                    ],
                },
            },
        });
    }

    setup_event_listeners() {
        Observer.register(
            Utils.gen_event('ActionButton.action.download', this.get_id(), 'table', 'download'),
            report => {
                if (report && report.report_type == 'fund_modeler_report') {
                    this._prepare_fund_modeler_pdf({
                        data: {
                            uid: report.uid,
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_file_base + key);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                } else if (report && report.report_type == 'visual_report') {
                    let download_url = `${config.api_base_url}download/${report.report_type}/pdf/${report.uid}`;
                    DataThing.form_post(download_url);
                } else if (report && report.report_type == 'data_report') {
                    this._prepare_data_report_xls({
                        data: {
                            uid: report.uid,
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_file_base + key);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                }
            },
        );

        Observer.register(
            Utils.gen_event('ActionButton.action.edit', this.get_id(), 'table', 'rerun'),
            report => {
                pager.navigate(`#!/visual-reports/${report.sub_type}/edit/${report.uid}`);
            },
        );

        Observer.register(
            Utils.gen_event('ActionButton.action.rerun', this.get_id(), 'table', 'rerun'),
            report => {
                if (report.report_type == 'visual_report' && report.is_frozen) {
                    this._copy_visual_report({
                        data: {
                            uid: report.uid,
                        },
                        success: DataThing.api.XHRSuccess(res => {
                            let report_uid = res;
                            let url = `#!/visual-reports/${report.sub_type}/edit/${report_uid}`;
                            pager.navigate(url);
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                } else {
                    pager.navigate(Formatters.rerun_report_archive_link(report));
                }
            },
        );

        Observer.register(
            this.events.resolve_event('delete_selected', 'ActionButton.action.delete_selected'),
            payload => {
                this.confirm_delete_modal.payload(payload);
                this.confirm_delete_modal.show();
            },
        );

        Observer.register(this.events.get('confirm_delete'), payload => {
            if (payload) {
                this._delete_reports({
                    data: {uids: payload.map(report => report.uid)},
                    success: DataThing.api.XHRSuccess(() => {
                        DataThing.status_check();
                    }),
                });
            }
        });
    }
}
