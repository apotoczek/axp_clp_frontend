/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ko from 'knockout';
import pager from 'pager';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MetricTable from 'src/libs/components/MetricTable';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import DataTable from 'src/libs/components/basic/DataTable';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import * as Constants from 'src/libs/Constants';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self._prepare_data_report_xls = DataThing.backends.useractionhandler({
        url: 'prepare_data_report_xls',
    });

    self.events = self.new_instance(EventRegistry, {});

    self.events.new('download_xls');
    self.events.resolve_and_add('register_export', 'DynamicActions.register_action');

    self.sub_type = ko.observable();
    self.report = ko.observable();

    Observer.broadcast(
        self.events.get('register_export'),
        {
            title: 'Data Report',
            subtitle: 'XLS',
            event_type: self.events.get('download_xls'),
        },
        true,
    );

    Observer.register(self.events.get('download_xls'), () => {
        let report = self.report();

        if (report) {
            self._prepare_data_report_xls({
                data: {
                    uid: report.uid,
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    });

    self.define_default_template(`
            <div class="layout-aside page analytics full-body no-cpanel">
                <div class="layout-vbox">
                    <div class="row">
                        <div class="col-xs-6"></div>
                        <div class="col-xs-6"></div>
                    </div>
                    <!-- ko renderComponent: header --><!-- /ko -->
                    <!-- ko renderComponent: action_toolbar --><!-- /ko -->
                    <div class="scrollable content page" style="padding: 20px 0;">
                        <!-- ko renderComponent: metric_table --><!-- /ko -->
                        <!-- ko if: show_params -->
                            <!-- ko renderComponent: params_table --><!-- /ko -->
                        <!-- /ko -->
                        <!-- ko renderComponent: table --><!-- /ko -->
                        <div data-bind="foreach: footnotes">
                            <p data-bind="text: $data" class="report-footnote"></p>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.get_report = function(uid, callback) {
        DataThing.get({
            params: {
                target: 'data_report',
                report_type: 'data_report',
                format_report_params: true,
                uid: uid,
            },
            success: report => {
                self.report(report);
                callback(report);
            },
            error: () => {},
        });
    };

    self.parse_column = function(column) {
        let parsed = {
            label: column.title,
        };

        if (column.fmt === 'money') {
            parsed.format = 'money';
            parsed.format_args = {
                value_key: column.key,
                currency_key: 'currency',
            };
        } else {
            parsed.key = column.key;

            if (column.fmt === 'date') {
                parsed.format = 'backend_date';
            } else {
                parsed.format = column.fmt;
            }
        }

        return parsed;
    };

    self.metric_table = self.new_instance(MetricTable, {
        id: 'metric_table',
        css: {'table-light': true, 'metric-table': true},
        template: 'tpl_metric_table_multi_col',
        columns: 2,
        metrics: [
            {
                label: 'Report Name',
                value_key: 'name',
            },
            {
                label: 'Type',
                value_key: 'sub_type',
                format: 'titleize',
            },
            {
                label: 'Created',
                value_key: 'created',
                format: 'backend_local_datetime',
            },
        ],
        data: self.report,
    });

    self.use_vehicle_default_html = '<span class="text-muted">Vehicle Default</span>';
    self.none_html = '<span class="text-muted">None</span>';

    self.visible_callback = function(type) {
        return function(data) {
            if (data && data.sub_type == type) {
                return true;
            }

            return false;
        };
    };

    self.pme_visible_callback = function(data) {
        if (data) {
            if (data.sub_type == 'pme_benchmark') {
                return true;
            } else if (
                data.sub_type == 'quarterly_progression' &&
                Constants.pme_metrics.indexOf(data.params.metric) > -1
            ) {
                return true;
            }
        }

        return false;
    };

    self.show_params = ko.pureComputed(() => {
        let report = self.report();

        let reports_without_params = ['net_cashflows', 'lp_report'];

        if (report) {
            return reports_without_params.indexOf(report.sub_type) === -1;
        }

        return false;
    });

    self.params_table = self.new_instance(MetricTable, {
        id: 'metric_table',
        css: {'table-light': true, 'metric-table': true},
        template: 'tpl_metric_table_multi_col',
        columns: 3,
        metrics: [
            {
                label: 'As of Date',
                value_key: 'params:as_of_date',
                format: 'backend_date',
                default_value: self.use_vehicle_default_html,
            },
            {
                label: 'Horizon',
                value_key: 'params:start_date_horizon',
                format: 'years',
                default_value: '<span class="text-muted">Since Inception</span>',
            },
            {
                label: 'Currency',
                value_key: 'params:currency_symbol',
                format: 'strings',
                default_value: self.use_vehicle_default_html,
            },
            {
                label: 'Post Date NAVs',
                value_key: 'params:post_date_navs',
                format: 'boolean_highlight',
            },
            {
                label: 'Aggregate Only',
                value_key: 'params:aggregate_only',
                format: 'boolean_highlight',
            },
            {
                label: 'Grouping',
                value_key: 'params:grouping',
                format: 'strings',
                default_value: self.none_html,
            },
            {
                label: 'PME Index',
                value_key: 'params:pme_index',
                visible: self.pme_visible_callback,
            },
            {
                label: 'Use Default Index',
                value_key: 'params:use_default_index',
                format: 'boolean_highlight',
                visible: self.pme_visible_callback,
            },
            {
                label: 'Benchmark',
                value_key: 'params:benchmark',
                visible: self.visible_callback('peer_benchmark'),
            },
            {
                label: 'Benchmark Geography',
                value_key: 'params:attributes:geography',
                format: 'strings',
                visible: self.visible_callback('peer_benchmark'),
            },
            {
                label: 'Benchmark Style',
                value_key: 'params:attributes:style',
                format: 'strings',
                visible: self.visible_callback('peer_benchmark'),
            },
            {
                label: 'Benchmark Sector',
                value_key: 'params:attributes:sector',
                format: 'strings',
                visible: self.visible_callback('peer_benchmark'),
            },
            {
                label: 'Metric',
                value_key: 'params:metric',
                visible: self.visible_callback('quarterly_progression'),
            },
        ],
        data: self.report,
    });

    self.table = self.new_instance(DataTable, {
        id: 'table',
        id_callback: self.events.register_alias('table'),
        css: {
            'table-light': true,
            'table-sm': true,
            'table-condensed': true,
            'table-bordered': true,
            'table-form': true,
            'table-bison': false,
            'condensed-table-padding': true,
        },
        inline_data: true,
        results_per_page: 20,
        dynamic_columns: {
            data: ko.pureComputed(() => {
                let report = self.report();

                let columns = [];

                if (report && report.json_data) {
                    for (let column of report.json_data.columns) {
                        columns.push(self.parse_column(column));
                    }
                }

                return columns;
            }),
        },
        data: ko.pureComputed(() => {
            let report = self.report();

            let rows = [];

            if (report && report.json_data) {
                for (let item of report.json_data.data) {
                    rows.push(item);
                }

                for (let item of report.json_data.summary_data) {
                    rows.push(item);
                }
            }

            return rows;
        }),
        columns: [],
    });

    self.header = self.new_instance(BreadcrumbHeader, {
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
                        label: 'Reports',
                        link: '#!/reports',
                    },
                    {
                        label: 'Data Reports',
                    },
                    {
                        label: ko.pureComputed(() => {
                            let report = self.report();
                            if (report) {
                                return report.name;
                            }
                        }),
                    },
                ],
            },
        ],
    });

    self.footnotes = ko.pureComputed(() => {
        let report = self.report();

        if (report && report.json_data && report.json_data.footnotes) {
            return report.json_data.footnotes;
        }

        return [];
    });

    self.action_toolbar = self.new_instance(ActionHeader, {
        component: ActionHeader,
        id: 'action_toolbar',
        export_id_callback: self.events.register_alias('register_export'),
        template: 'tpl_action_toolbar',
        data_table_id: Utils.gen_id(self.get_id(), 'table'),
        datasource: {
            type: 'observer',
            event_type: Utils.gen_event('DataTable.selected', self.get_id(), 'table'),
        },
        buttons: [
            {
                id: 'rerun',
                action: 'rerun',
                id_callback: self.events.register_alias('rerun'),
                css: {
                    btn: true,
                    'btn-transparent-danger': true,
                },
                label: 'Run This Report Again',
            },
        ],
    });

    Observer.register(self.events.resolve_event('rerun', 'ActionButton.action.rerun'), () => {
        let report = self.report();
        let sub_type = self.sub_type();

        pager.navigate(`#!/data-reports/${sub_type}/rerun/${report.uid}`);
    });

    self.when(
        self.table,
        self.header,
        self.action_toolbar,
        self.metric_table,
        self.params_table,
    ).done(() => {
        _dfd.resolve();
    });

    return self;
}
