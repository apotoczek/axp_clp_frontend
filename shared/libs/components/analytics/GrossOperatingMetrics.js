import ko from 'knockout';
import {html} from 'common-tags';

import Observer from 'src/libs/Observer';
import RegExps from 'src/libs/RegExps';
import {is_set, match_array} from 'src/libs/Utils';

import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import MetricsControls from 'src/libs/components/analytics/MetricsControls';

import ReactWrapper from 'src/libs/components/ReactWrapper';

import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import {dataTableCSVExporter} from 'components/basic/DataTable/exporters';
import {ValuesTable} from 'containers/analytics/FundOperatingMetrics';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.AuditTrailModal = AuditTrailModal;
    self.EditMetricValueModal = EditMetricValueModal;
    self.disable_audit_trail = opts.disable_audit_trail ?? false;

    self.define_default_template(html`
        <div class="big-message" data-bind="visible: loading">
            <span class="glyphicon glyphicon-cog animate-spin"></span>
            <h1>Loading..</h1>
        </div>
        <div data-bind="attr: { id: html_id() }">
            <!-- ko if: !loading() && error() && error_template() -->
            <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() -->
            <div style="margin:10px;">
                <!-- ko renderComponent: controls --><!-- /ko -->
                <!-- ko renderComponent: chart --><!-- /ko -->
                <!-- ko template: {
                        name: 'tpl_data_table_standalone_pagination',
                        data: controls.statistics
                    } --><!--/ko -->
            </div>
            <!-- ko if: controls.normalized -->
            <p
                style="
                position: relative;
                margin-top:-40px;
                font-weight:700;
                padding-left: 20px;
                font-size:12px;
            "
            >
                *Indicates Companies with a Normalized Fiscal Year End
            </p>
            <!-- /ko -->
            <div class="page-break"></div>
            <!-- ko renderComponent: controls.statistics --><!-- /ko -->
            <div class="page-break"></div>
            <div style="margin-top:10px;"><!-- ko renderComponent: table --><!-- /ko --></div>
            <div
                data-bind="renderReactComponent: AuditTrailModal, props: auditTrailModalProps"
            ></div>
            <div
                data-bind="renderReactComponent: EditMetricValueModal, props: editMetricValueModalProps"
            ></div>
            <!-- /ko -->
        </div>
    `);

    if (opts.register_export_event) {
        self.register_export = function(title, subtitle, callback) {
            let export_event = Observer.gen_event_type();

            Observer.broadcast(
                opts.register_export_event,
                {
                    title: title,
                    subtitle: subtitle,
                    type: 'Operating Metrics',
                    event_type: export_event,
                    enabled: !opts.enable_export_event,
                },
                true,
            );

            Observer.register(export_event, callback);
        };

        self.register_export('Statistics', 'CSV', () => {
            self.controls.statistics.export_csv();
        });

        self.register_export('Values', 'CSV', () => {
            const data = self.table_ref.getTableData();
            dataTableCSVExporter(data);
        });
    }

    self.breakdown = Observer.observable(opts.breakdown_event);
    self.time_zero = Observer.observable(opts.time_zero_event);
    self.display_mode = Observer.observable(opts.display_mode_event, undefined, 'get_value');
    self.metric_version = Observer.observable(opts.metric_version_event, undefined, 'get_value');
    self.audit_trail_modal_data = ko.observable();
    self.edit_metric_value_modal_data = ko.observable();

    self.series = ko.pureComputed(() => [{type: self.controls.chart_type()}]);

    self.controls = self.new_instance(MetricsControls, {
        id: 'controls',
        results_per_page_event: opts.results_per_page_event,
        base_query: opts.base_query,
        analysis_query: opts.analysis_query,
    });

    let chart_options = {
        dependencies: [self.controls.get_id()],
        formatter: self.controls.y_formatter,
        exporting: true,
        series: self.series,
        data: self.controls.chart_data,
        max_point_width: 100,
        stacking: false,
    };

    self.normal_chart = self.new_instance(TimeseriesChart, chart_options);

    self.time_zero_chart = self.new_instance(
        TimeseriesChart,
        Object.assign({}, chart_options, {x_quarter_offset: true}),
    );

    self.chart = ko.pureComputed(() => {
        if (self.controls.time_zero()) {
            return self.time_zero_chart;
        }

        return self.normal_chart;
    });

    self.close_audit_trail_modal = () => {
        self.audit_trail_modal_data(null);
    };

    self.open_audit_trail_modal = data => {
        self.audit_trail_modal_data(data);
    };

    self.table = self.new_instance(ReactWrapper, {
        dependencies: [self.controls.get_id()],
        reactComponent: ValuesTable,
        props: ko.pureComputed(() => {
            return {
                dynamicColumns: self.controls.table_dynamic_columns(),
                data: self.controls.table_data(),
                timeZero: self.time_zero(),
                breakdown: self.breakdown(),
                displayMode: self.display_mode(),
                singleMetricMode: self.controls.operation()?.operation === 5, // 5 is "Noop" enum value on the backend
                selectedMetric: self.controls.operation()?.left,
                aggregateSelected:
                    self.controls.aggregate_dropdown.selected_value() !== 0 ||
                    self.controls.operation()?.left?.type == 'calculated_metric',
                isLoading: self.controls.datasource.loading(),
                disableAuditTrail: self.disable_audit_trail || self.controls.normalized,
                ref: ref => (self.table_ref = ref),

                onOpenAuditTrailModal: self.open_audit_trail_modal,
                onOpenEditMetricValueModal: data => self.edit_metric_value_modal_data(data),
            };
        }),
    });

    self.auditTrailModalProps = ko.pureComputed(() => {
        const {date, dealUid} = self.audit_trail_modal_data() ?? {};
        return {
            isOpen: is_set(self.audit_trail_modal_data(), true),
            toggleModal: self.close_audit_trail_modal,
            enableEditModeToggle: false,
            dealUid,
            metricUid: self.controls.left_dropdown.selected()?.identifier,
            metricVersionUid: self.metric_version(),
            date,
        };
    });

    self.editMetricValueModalProps = ko.pureComputed(() => {
        const {date, dealUid} = self.edit_metric_value_modal_data() ?? {};
        return {
            isOpen: is_set(self.edit_metric_value_modal_data(), true),
            toggleModal: () => self.edit_metric_value_modal_data(null),
            dealUid,
            metricUid: self.controls.left_dropdown.selected()?.identifier,
            metricVersionUid: self.metric_version(),
            date,
        };
    });

    if (opts.register_export_event && opts.enable_export_event) {
        const set_export = (title, enabled) => {
            Observer.broadcast(opts.enable_export_event, {
                title: title,
                type: 'Operating Metrics',
                enabled,
            });
        };

        Observer.register_hash_listener('fund-analytics', url => {
            const match = match_array(
                url,
                ['fund-analytics', 'fund', 'gross', RegExps.uuid, 'operating-metrics', () => true],
                ['fund-analytics', 'fund', 'gross', RegExps.uuid, () => false],
            );

            set_export('Values', match);
            set_export('Statistics', match);
        });
    }

    self.when(self.controls, self.normal_chart, self.time_zero_chart, self.table).done(() => {
        _dfd.resolve();
    });

    return self;
}
