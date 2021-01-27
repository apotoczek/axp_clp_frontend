import ko from 'knockout';
import {html} from 'common-tags';

import auth from 'auth';

import Datasource from 'src/libs/DataSource';
import Observer from 'src/libs/Observer';

import * as Constants from 'src/libs/Constants';
import Customizations from 'src/libs/Customizations';
import {is_set} from 'src/libs/Utils';

import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NewDropdown from 'src/libs/components/basic/NewDropdown';
import FilteredDropdown from 'src/libs/components/basic/FilteredDropdown';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Checklist from 'src/libs/components/basic/Checklist';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ReactWrapper from 'src/libs/components/ReactWrapper';

import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import {dataTableCSVExporter} from 'components/basic/DataTable/exporters';
import {ValuesTable, StatisticsTable} from 'containers/analytics/CompanyMetrics';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let _dfd = self.new_deferred();

    const has_metric_versions = auth.user_has_feature('metric_versions');

    self.define_default_template(html`
        <div class="row" style="margin-top: 20px; margin-bottom: 10px;">
            <div class="col-md-offset-4 col-md-4 text-center">
                <!-- ko renderComponent: metric_selection --><!-- /ko -->
                <!-- ko if: is_mode('side_by_side') -->
                <div style="margin-top: 10px">
                    <!-- ko renderComponent: left_dropdown --><!-- /ko -->
                    by
                    <!-- ko renderComponent: right_dropdown --><!-- /ko -->
                </div>
                <!-- /ko -->
                <!-- ko if: is_mode('select_metrics') -->
                <div style="margin-top: 5px">
                    <!-- ko renderComponent: all_metrics --><!-- /ko -->
                </div>
                <!-- /ko -->
            </div>
        </div>
        <div style="margin: 0 10px;" data-bind="renderComponent: trendlines"></div>
        <!-- ko if: normalized_data -->
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
        <!-- ko renderComponent: statistics --><!-- /ko -->
        <div class="page-break"></div>
        <!-- ko renderComponent: values_table --><!-- /ko -->
        <!-- ko renderComponent: audit_trail_modal --><!-- /ko -->
        <!-- ko renderComponent: edit_metric_value_modal --><!-- /ko -->
    `);

    self.events = opts.events;

    self.disable_audit_trail = opts.disable_audit_trail;
    self.chart_type = ko.observable('line');
    self.render_currency = ko.observable('USD');
    self.audit_trail_modal_data = ko.observable({});
    self.edit_metric_value_modal_data = ko.observable({});
    self.company_uid = Observer.observable(self.events.get('company_uid'));
    self.rate_of_change = Observer.observable(
        self.events.get('rate_of_change'),
        undefined,
        'get_value',
    );
    self.display_mode = Observer.observable(self.events.get('time_frame'), undefined, 'get_value');

    if (!self.events || !self.events.get('company_uid')) {
        throw 'Trying to initialize DealTrendLines without company_uid';
    }

    const set_export = (title, enabled) => {
        Observer.broadcast(self.events.get('enable_export'), {
            title: title,
            type: 'Operating Metrics',
            enabled,
        });
    };

    if (self.events.get('register_export')) {
        let register_export = (title, subtitle, callback) => {
            let export_event = Observer.gen_event_type();

            Observer.broadcast(
                self.events.get('register_export'),
                {
                    title: title,
                    subtitle: subtitle,
                    type: 'Operating Metrics',
                    event_type: export_event,
                    enabled: false,
                },
                true,
            );

            Observer.register(export_event, callback);
        };

        register_export('Statistics', 'CSV', () => {
            const data = self.statistics_table_ref.getTableData();
            dataTableCSVExporter(data);
        });
        register_export('Values', 'CSV', () => {
            const data = self.values_table_ref.getTableData();
            dataTableCSVExporter(data);
        });
    }

    if (self.events.get('toggle_export')) {
        Observer.register(self.events.get('toggle_export'), enabled => {
            set_export('Values', enabled);
            set_export('Statistics', enabled);
        });
    }

    const sorted_data_entries = data => {
        return Object.entries(data).sort((a, b) => a[0] - b[0]);
    };

    /***********************************************************
     *                       DATASOURCES                        *
     ***********************************************************/
    self.datasource = self.new_instance(Datasource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'company_metric_analysis',
                company_uid: {
                    type: 'observer',
                    event_type: self.events.get('company_uid'),
                    required: true,
                },
                metric_versions: {
                    type: 'observer',
                    event_type: self.events.get('metric_versions'),
                },
                render_currency: {
                    type: 'observer',
                    event_type: self.events.get('render_currency'),
                    mapping: 'get',
                    mapping_args: {
                        key: 'symbol',
                    },
                    required: true,
                },
                date_range: {
                    type: 'observer',
                    event_type: self.events.get('date_range'),
                },
                rate_of_change: {
                    type: 'observer',
                    event_type: self.events.get('rate_of_change'),
                    mapping: 'get_value',
                },
                time_frame: {
                    type: 'observer',
                    event_type: self.events.get('time_frame'),
                    mapping: 'get_value',
                    required: true,
                },
                operations: {
                    type: 'placeholder',
                    required: true,
                    default: [],
                },
            },
        },
    });

    self.options_datasource = self.new_instance(Datasource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:metric_options',
                entity_uid: {
                    type: 'observer',
                    event_type: self.events.get('company_uid'),
                    required: true,
                },
                entity_type: 'company',
            },
        },
    });

    self.datasource.register_query_update_callback((key, val) => {
        if (key == 'render_currency') {
            self.render_currency(val);
        }
    });

    /***********************************************************
     *                        HELPERS                           *
     ***********************************************************/
    let _idenfifier_dropdown_conf = (id, data) => ({
        id: id,
        title: 'Identifiers',
        allow_empty: true,
        label_key: 'label',
        value_key: 'identifier',
        default_selected_index: 0,
        active_template: 'text-inline',
        btn_css: {},
        btn_style: {'padding-left': 0, 'padding-right': 0},
        data: data,
    });

    self.get_format = (value, compare_key = 'value') => {
        // Returns a format object given a value format from the backend
        // value should be one of the Integer values specified in Constants.format_options
        let return_object = {};
        let format = Constants.format_options.find(item => item[compare_key] === value) || {};

        return_object.format = format.format;
        return_object.label = format.label;
        return_object.format_args = {
            render_currency: self.render_currency(),
        };
        return return_object;
    };

    self.get_formatted_data = ko.pureComputed(() => {
        // Formats the data for axis and series
        // We use the same computed to ensure consistency between them when updated in highcharts
        const _data = self.datasource.data();
        const axes = [];
        const series = [];

        if (_data) {
            const data = _data.metrics_for_version;
            const dash_for_version = {};
            const dash_style_set = [...Customizations.dash_style_names];
            const metric_formats = {};
            const formats = {};
            const metrics = new Set();
            const format_indexes = {};
            const color_set = [...Customizations.color_names];
            const chart_type = self.chart_type();
            for (const [version, {trends}] of sorted_data_entries(data)) {
                dash_for_version[version] = dash_style_set.shift();
                for (const [metric, meta_data] of Object.entries(trends)) {
                    const format = self.get_format(meta_data.format);
                    metric_formats[metric] = format.format;
                    formats[format.format] = format;
                    metrics.add(metric);
                }
            }
            for (const [idx, format] of Object.values(formats).entries()) {
                axes.push({...format, opposite: idx % 2});
                format_indexes[format.format] = idx;
            }
            for (const metric of metrics) {
                const series_color = color_set.shift();
                for (const version of Object.keys(data).sort()) {
                    series.push({
                        key: `${version}${metric}`,
                        type: chart_type,
                        y_axis: format_indexes[metric_formats[metric]],
                        dash_style: dash_for_version[version],
                        color: series_color,
                    });
                }
            }
        }
        return {axes, series};
    });

    /***********************************************************
     *                        COMPONENTS                        *
     ***********************************************************/

    self.left_dropdown = self.new_instance(
        FilteredDropdown,
        _idenfifier_dropdown_conf('left_dropdown', self.options_datasource.data),
    );

    self.right_options = ko.pureComputed(() => {
        let options = self.options_datasource.data();
        let left = self.left_dropdown.selected();

        if (options && left) {
            let identifier = left.identifier;
            let time_frames = left.time_frames;

            return options.filter(option => {
                let shared = time_frames.intersect(option.time_frames);

                return option.identifier !== identifier && shared.length;
            });
        }

        return [];
    });

    self.right_dropdown = self.new_instance(
        FilteredDropdown,
        _idenfifier_dropdown_conf('right_dropdown', self.right_options),
    );

    self.metric_selection = self.new_instance(NewDropdown, {
        id: 'metric_selection',
        title: 'Metrics',
        allow_empty: false,
        default_selected_index: 0,
        active_template: 'text-inline',
        btn_style: {'padding-left': 0, 'padding-right': 0},
        btn_css: {},
        in_pdf: false,
        data: ko.pureComputed(() => {
            let data = self.options_datasource.data();
            let options = [
                {
                    label: 'Side by Side',
                    value: 'side_by_side',
                },
                {
                    label: 'Select Metrics',
                    value: 'select_metrics',
                },
            ];

            if (data) {
                for (let {value, format, title} of Constants.format_options) {
                    let values = data.filter(option => option.format === value);

                    if (values.length) {
                        options.push({
                            label: title,
                            value: values,
                            format: `${format}`,
                        });
                    }
                }
            }
            return options;
        }),
    });

    self.all_metrics = self.new_instance(NewPopoverButton, {
        id: 'all_metrics',
        label: 'Metrics',
        template: 'tpl_new_popover_button_a',
        track_selection_property: 'selected_string',
        css: {
            'btn-link': true,
            'dropdown-toggle': true,
        },
        popover_options: {
            placement: 'bottom',
            css_class: 'popover-ghost-default',
        },
        popover_config: {
            component: Checklist,
            data: self.options_datasource.data,
            value_key: 'identifier',
            label_key: 'label',
            enable_filter: true,
        },
    });

    self.trendlines = self.new_instance(TimeseriesChart, {
        id: 'trendlines',
        dependencies: [self.datasource.get_id()],
        stacking: false,
        show_markers: true,
        series: ko.pureComputed(() => {
            return self.get_formatted_data().series;
        }),
        y_axes: ko.pureComputed(() => {
            return self.get_formatted_data().axes;
        }),
        exporting: true,
        data: ko.pureComputed(() => {
            const data = self.metrics_for_version();
            const res = {};
            if (data) {
                for (const [version, {trends}] of sorted_data_entries(data)) {
                    for (const [metric, meta_data] of Object.entries(trends)) {
                        const format = `${version}${metric}`;
                        const formated_name = has_metric_versions
                            ? `${metric} - ${version}`
                            : metric;
                        if (!res[format]) {
                            res[format] = {};
                        }
                        res[format][formated_name] = meta_data.values;
                    }
                }
            }
            return res;
        }),
    });

    self.metrics_for_version = ko.pureComputed(() => {
        const _data = self.datasource.data();
        if (_data) {
            return _data.metrics_for_version;
        }
        return {};
    });

    self.normalized_data = ko.pureComputed(() => {
        const _data = self.datasource.data();
        if (_data) {
            return _data.normalized;
        }
        return false;
    });

    self.statistics = self.new_instance(ReactWrapper, {
        reactComponent: StatisticsTable,
        props: ko.pureComputed(() => {
            return {
                data: self.metrics_for_version(),
                renderCurrency: self.render_currency(),
                ref: ref => (self.statistics_table_ref = ref),
            };
        }),
    });

    self.values_table = self.new_instance(ReactWrapper, {
        reactComponent: ValuesTable,
        props: ko.pureComputed(() => {
            return {
                data: self.metrics_for_version(),
                renderCurrency: self.render_currency(),
                onOpenAuditTrailModal: self.openAuditTrailModal,
                onOpenEditMetricValueModal: data => self.edit_metric_value_modal_data(data),
                displayMode: self.display_mode(),
                aggregateSelected: self.rate_of_change(),
                disableAuditTrail: self.disable_audit_trail || self.normalized_data,
                companyUid: self.company_uid(),
                ref: ref => (self.values_table_ref = ref),
            };
        }),
    });

    self.audit_trail_modal = self.new_instance(ReactWrapper, {
        reactComponent: AuditTrailModal,
        props: ko.pureComputed(() => {
            const {date, metricSetUid} = self.audit_trail_modal_data() ?? {};
            return {
                isOpen: is_set(self.audit_trail_modal_data(), true),
                toggleModal: self.closeAuditTrailModal,
                companyUid: self.company_uid(),
                enableEditModeToggle: false,
                date,
                metricSetUid,
            };
        }),
    });

    self.edit_metric_value_modal = self.new_instance(ReactWrapper, {
        reactComponent: EditMetricValueModal,
        props: ko.pureComputed(() => {
            const {date, metricSetUid} = self.edit_metric_value_modal_data() ?? {};
            return {
                isOpen: is_set(self.edit_metric_value_modal_data(), true),
                toggleModal: () => self.edit_metric_value_modal_data(null),
                companyUid: self.company_uid(),
                date,
                metricSetUid,
            };
        }),
    });

    self.closeAuditTrailModal = () => {
        self.audit_trail_modal_data(null);
    };

    self.openAuditTrailModal = auditModalData => {
        self.audit_trail_modal_data(auditModalData);
    };

    /***********************************************************
     *                         HANDLERS                         *
     ***********************************************************/
    self._is_mode = (mode, selected) => {
        return selected && selected.value === mode;
    };

    self.is_mode = mode =>
        ko.pureComputed(() => self._is_mode(mode, self.metric_selection.selected()));

    self.selected_operations = ko.pureComputed(() => {
        let selected = self.metric_selection.selected();

        if (self._is_mode('side_by_side', selected)) {
            let left = self.left_dropdown.selected();
            let right = self.right_dropdown.selected();

            if (left && right) {
                return [left, right];
            }
        } else if (self._is_mode('select_metrics', selected)) {
            return self.all_metrics.get_value();
        } else if (selected) {
            return selected.value;
        }

        return [];
    });

    self.selected_operations.subscribe(operations => {
        self.datasource.update_query({operations: operations});
    });

    self.when(
        self.datasource,
        self.options_datasource,
        self.left_dropdown,
        self.right_dropdown,
        self.trendlines,
        self.metric_selection,
    ).done(() => {
        Observer.register(self.events.get('chart_type'), ({value}) => self.chart_type(value));
        _dfd.resolve();
    });

    return self;
}
