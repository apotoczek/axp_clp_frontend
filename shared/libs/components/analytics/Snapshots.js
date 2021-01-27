/* Automatically transformed from AMD to ES6. Beware of code smell. */
/**
 * Handles the snapshot view in deal analytics. Lists a bunch of metric charts in a grid format.
 */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import DataSource from 'src/libs/DataSource';
import Customizations from 'src/libs/Customizations';
import auth from 'auth';
import {SystemMetricType, CalculatedMetric} from 'src/libs/Enums';

export default class Snapshots extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();
        let _events = opts.events;
        const metric_version_permission = auth.user_has_feature('metric_versions');

        if (!_events || !_events.get('company_uid')) {
            throw 'Trying to initialize DealOperatingMetrics without company_uid_event';
        }

        this.render_currency = ko.observable('USD');

        this.define_default_template(`
            <!-- ko foreach: grouped_charts -->
                <div class="row">
                    <div class="col-md-4">
                        <!-- ko renderComponent: $data[0] --><!-- /ko -->
                    </div>
                    <div class="col-md-4">
                        <!-- ko renderComponent: $data[1] --><!-- /ko -->
                    </div>
                    <div class="col-md-4">
                        <!-- ko renderComponent: $data[2] --><!-- /ko -->
                    </div>
                </div>
            <!-- /ko -->
        `);

        const metrics = [
            {
                label: 'Revenue',
                format: 'money',
                type: 'bar',
                system_metric_type: SystemMetricType.Revenue,
            },
            {
                label: 'EBITDA',
                format: 'money',
                type: 'bar',
                system_metric_type: SystemMetricType.Ebitda,
            },
            {
                label: 'Enterprise Value',
                format: 'money',
                type: 'bar',
                system_metric_type: SystemMetricType.EnterpriseValue,
            },
            {
                label: 'Number of Customers',
                format: 'number',
                type: 'bar',
                system_metric_type: SystemMetricType.NumberOfCustomers,
            },
            {
                label: 'Number of Employees',
                format: 'number',
                type: 'line',
                system_metric_type: SystemMetricType.NumberOfEmployees,
            },
            {
                label: 'EV Multiple',
                format: 'multiple',
                type: 'bar',
                identifier: CalculatedMetric.EvMultiple,
            },
            {
                label: 'Revenue Multiple',
                format: 'multiple',
                type: 'bar',
                identifier: CalculatedMetric.RevenueMultiple,
            },
            {
                label: 'Debt Multiple',
                format: 'multiple',
                type: 'bar',
                identifier: CalculatedMetric.DebtMultiple,
            },
            {
                label: 'EBITDA Margin',
                format: 'percent',
                type: 'line',
                identifier: CalculatedMetric.EbitdaMargin,
            },
        ];

        // This datasource has hard coded metrics for now,
        // will possibly change in the future
        let _metrics_datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                mapping: data => data.metrics_for_version,
                query: {
                    target: 'company_metric_analysis',
                    company_uid: {
                        type: 'observer',
                        event_type: _events.get('company_uid'),
                        required: true,
                    },
                    metric_versions: {
                        type: 'observer',
                        event_type: _events.get('metric_versions_snapshots'),
                    },
                    date_range: {
                        type: 'observer',
                        event_type: _events.get('date_range'),
                    },
                    render_currency: {
                        type: 'observer',
                        event_type: _events.get('render_currency'),
                        mapping: 'get',
                        mapping_args: {
                            key: 'symbol',
                        },
                        required: true,
                    },
                    time_frame: {
                        mapping: 'get_value',
                        type: 'observer',
                        event_type: _events.get('time_frame_snapshots'),
                        default: 3,
                    },
                    system_metric_types: metrics
                        .filter(m => m.system_metric_type)
                        .map(m => m.system_metric_type),
                    calculated_identifiers: metrics
                        .filter(m => m.identifier)
                        .map(m => m.identifier),
                    use_labels: false,
                },
            },
        });

        let _charts = metrics.map(({label, format, type, system_metric_type, identifier}) => {
            const metric_key = system_metric_type || identifier;
            let min_range = undefined;
            if (format == 'percent') {
                min_range = 0.02;
            }
            if (format == 'multiple') {
                min_range = 2;
            }
            return this.new_instance(TimeseriesChart, {
                id: `${label
                    .toLowerCase()
                    .split(' ')
                    .join('_')}_chart`,
                label: label,
                dependencies: [_metrics_datasource.get_id()],
                label_in_chart: true,
                vertical_bars: true,
                format: format,
                min_range: min_range,
                format_args: {
                    render_currency: this.render_currency,
                },
                series: ko.pureComputed(() => {
                    const data = _metrics_datasource.data();
                    const res = [];
                    const color_set = [...Customizations.color_names];
                    if (data) {
                        for (const version of Object.keys(data)) {
                            const formated_name = metric_version_permission
                                ? `${label} - ${version}`
                                : label;
                            const series_color = color_set.shift();
                            res.push({
                                key: version,
                                name: formated_name,
                                type: type,
                                color: series_color,
                                stack: version,
                            });
                        }
                    }
                    return res;
                }),
                data: ko.pureComputed(() => {
                    const data = _metrics_datasource.data();
                    if (data) {
                        const _data = {};
                        for (const version of Object.keys(data).sort()) {
                            if (data[version].trends[metric_key]) {
                                const compare_values = data[version].trends[metric_key].values;
                                _data[version] = compare_values;
                            }
                        }
                        return _data;
                    }
                }),
            });
        });

        this.grouped_charts = [];

        for (let i = 0; i < _charts.length; i++) {
            let group = Math.floor(i / 3);
            if (this.grouped_charts[group] === undefined) {
                this.grouped_charts[group] = [];
            }
            this.grouped_charts[group].push(_charts[i]);
        }

        this.when(_charts).done(() => {
            Observer.register(_events.get('render_currency'), currency => {
                if (currency) {
                    this.render_currency(currency.symbol);
                }
            });
            _dfd.resolve();
        });
    }
}
