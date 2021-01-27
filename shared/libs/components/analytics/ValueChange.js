import ko from 'knockout';
import {html} from 'common-tags';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import DataSource from 'src/libs/DataSource';
import Customizations from 'src/libs/Customizations';
import * as Formatters from 'src/libs/Formatters';
import ValueChangeChart from 'src/react/containers/analytics/ValueChange';
import * as Utils from 'src/libs/Utils';

import 'src/libs/bindings/react'; // Registers `renderReactComponent`

export default class ValueChange extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.dfd = this.new_deferred();

        this.ValueChangeChart = ValueChangeChart;
        const timeInterval = Observer.observable(opts.time_interval);
        const currency = Observer.observable(opts.currency);
        let splitByCashflowType;

        if (opts.split_by_cfs_event) {
            splitByCashflowType = Observer.observable(opts.split_by_cfs_event, false);
        } else {
            splitByCashflowType = ko.observable(false);
        }

        const userColors = Customizations.get_color_set();
        const chartColors = {
            nav: userColors[0],
            paidIn: userColors[1],
            distributed: userColors[2],
            valueChange: userColors[3],
            ...userColors.slice(1),
        };

        this.props = ko.pureComputed(() => {
            return {
                timeInterval: timeInterval(),
                backendData: this.datasource.data(),
                currency: currency(),
                chartColors: chartColors,
                loading: this.datasource.loading(),
            };
        });

        this.dateFormatter = ko.pureComputed(() => {
            return function() {
                Formatters.gen_for_time_interval(timeInterval);
            };
        });

        this.datasource = this.new_instance(DataSource, {
            auto_get_data: opts.auto_get_data,
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'vehicle_value_change',
                    entity_uid: {
                        type: 'observer',
                        event_type: opts.entity_uid,
                        required: true,
                    },
                    entity_type: opts.entity_type,
                    as_of_date: {
                        type: 'observer',
                        event_type: opts.as_of_date,
                        required: true,
                    },
                    horizon_date: {
                        type: 'observer',
                        event_type: opts.horizon_date,
                        required: true,
                    },
                    render_currency: {
                        type: 'observer',
                        event_type: opts.currency,
                        required: true,
                    },
                    time_interval: {
                        type: 'observer',
                        event_type: opts.time_interval,
                        required: true,
                    },
                    post_date_navs: {
                        type: 'observer',
                        event_type: Utils.gen_event(
                            'BooleanButton.state',
                            this.get_id(),
                            'post_date_navs',
                        ),
                        default: true,
                        required: true,
                    },
                    split_by_cfs: {
                        type: 'observer',
                        event_type: opts.split_by_cfs_event,
                        default: false,
                    },
                    filters: {
                        type: 'dynamic',
                        query: opts.filter_query,
                    },
                },
            },
        });

        this.add_dependency(this.datasource);

        this.define_template(html`
            <div class="big-message" data-bind="visible: loading">
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                <h1>Loading..</h1>
            </div>
            <!-- ko if: !loading() && error() && error_template() -->
            <!-- ko template: error_template --><!-- /ko -->
            <!-- /ko -->
            <!-- ko if: !loading() && !error() && datasource.data() -->
            <div data-bind="attr: { id: html_id() }">
                <div data-bind="renderReactComponent: ValueChangeChart, props: props"></div>
                <!-- ko renderComponent: table --><!-- /ko -->
            </div>
            <!-- /ko -->
        `);

        this.table = this.new_instance(DataTable, {
            id: 'value_change',
            dependencies: [this.datasource.get_id()],
            label: 'Value Change',
            enable_column_toggle: true,
            enable_clear_order: true,
            enable_csv_export: true,
            css: {'table-light': true, 'table-sm': true},
            results_per_page: 25,
            inline_data: true,
            columns: [
                {
                    label: 'Holding Period',
                    sort_key: 'time',
                    type: 'string',
                    format: 'backend_date_range',
                    definition: 'Sub period for value change',
                },
                {
                    label: 'Starting NAV',
                    key: 'prev_nav',
                    format: 'money',
                    format_args: {
                        render_currency: currency,
                    },
                },
                {
                    label: 'Net Value Change',
                    key: 'value_change',
                    format: 'money',
                    format_args: {
                        render_currency: currency,
                    },
                    definition: 'Change in NAV during this period.',
                },
                {
                    label: 'End NAV',
                    key: 'nav',
                    format: 'money',
                    format_args: {
                        render_currency: currency,
                    },
                },
            ],
            dynamic_columns: {
                data: ko.pureComputed(() => {
                    let columns = [];
                    if (splitByCashflowType()) {
                        const {labels: cfTypeLabels, results: rows = []} =
                            this.datasource.data() || {};

                        // Collect the columns needed by iterating all rows.
                        let nonCapitalColumns = {};
                        let rollUpColumns = {};
                        let nonRollUpColumns = {};
                        let leveredColumns = {};

                        for (const {cfs} of rows) {
                            const {non_capital, roll_up, non_rollup, levered} = cfs;
                            for (const cfTypeUid of Object.keys(non_capital)) {
                                nonCapitalColumns[cfTypeUid] = cfTypeLabels[cfTypeUid];
                            }
                            for (const cfTypeUid of Object.keys(roll_up)) {
                                rollUpColumns[cfTypeUid] = cfTypeLabels[cfTypeUid];
                            }
                            if (cfs.non_rollup) {
                                for (const cfTypeUid of Object.keys(non_rollup)) {
                                    nonRollUpColumns[cfTypeUid] = cfTypeLabels[cfTypeUid];
                                }
                            }
                            if (cfs.levered) {
                                for (const cfTypeUid of Object.keys(levered)) {
                                    leveredColumns[cfTypeUid] = cfTypeLabels[cfTypeUid];
                                }
                            }
                        }

                        // Sort columns alphabetically
                        nonCapitalColumns = Object.entries(nonCapitalColumns).sort((left, right) =>
                            left[1].name.localeCompare(right[1].name),
                        );
                        rollUpColumns = Object.entries(rollUpColumns).sort((left, right) =>
                            left[1].name.localeCompare(right[1].name),
                        );
                        nonRollUpColumns = Object.entries(nonRollUpColumns).sort((left, right) =>
                            left[1].name.localeCompare(right[1].name),
                        );
                        leveredColumns = Object.entries(leveredColumns).sort((left, right) =>
                            left[1].name.localeCompare(right[1].name),
                        );

                        let prevLabel = 'Starting NAV';
                        for (const [cfTypeUid, label] of rollUpColumns) {
                            if (label) {
                                columns.push({
                                    label: label.name,
                                    key: `cfs:roll_up:${cfTypeUid}`,
                                    format: 'money',
                                    format_args: {render_currency: currency},
                                    placement: {position: 'right', relative: prevLabel},
                                    visible: true,
                                });
                                prevLabel = label.name;
                            }
                        }

                        prevLabel = 'End NAV';
                        for (const [cfTypeUid, label] of nonCapitalColumns) {
                            if (label) {
                                columns.push({
                                    label: label.name,
                                    key: `cfs:non_capital:${cfTypeUid}`,
                                    format: 'money',
                                    format_args: {render_currency: currency},
                                    placement: {position: 'right', relative: prevLabel},
                                    visible: true,
                                });
                                prevLabel = label.name;
                            }
                        }

                        for (const [cfTypeUid, label] of nonRollUpColumns) {
                            if (label) {
                                columns.push({
                                    label: label.name,
                                    key: `cfs:non_rollup:${cfTypeUid}`,
                                    format: 'money',
                                    format_args: {render_currency: currency},
                                    placement: {position: 'right', relative: prevLabel},
                                    visible: true,
                                });
                                prevLabel = label.name;
                            }
                        }

                        for (const [cfTypeUid, label] of leveredColumns) {
                            if (label) {
                                columns.push({
                                    label: label.name,
                                    key: `cfs:levered:${cfTypeUid}`,
                                    format: 'money',
                                    format_args: {render_currency: currency},
                                    placement: {position: 'right', relative: prevLabel},
                                    visible: true,
                                });
                                prevLabel = label.name;
                            }
                        }
                    } else {
                        columns = [
                            ...columns,
                            {
                                label: 'Paid In (NAV)',
                                key: 'cfs:roll_up:paid_in',
                                format: 'money',
                                format_args: {render_currency: currency},
                                definition: oneLine`
                                    Capital Committed / Paid In which is included in
                                    NAV calculation.
                                `,
                                placement: {
                                    position: 'right',
                                    relative: 'Starting NAV',
                                },
                                visible: true,
                            },
                            {
                                label: 'Distributed (NAV)',
                                key: 'cfs:roll_up:distributed',
                                format: 'money',
                                format_args: {render_currency: currency},
                                definition: oneLine`
                                    Capital distributed which is included in NAV
                                    calculation.
                                `,
                                placement: {
                                    position: 'right',
                                    relative: 'Paid In (NAV)',
                                },
                                visible: true,
                            },
                            {
                                label: 'Paid In (Other)',
                                key: 'cfs:non_capital:paid_in',
                                format: 'money',
                                format_args: {render_currency: currency},
                                definition: oneLine`
                                    Capital Committed / Paid In which is not included in
                                    NAV calculation.
                                `,
                                placement: {
                                    position: 'right',
                                    relative: 'End NAV',
                                },
                                visible: true,
                            },
                            {
                                label: 'Distributed (Other)',
                                key: 'cfs:non_capital:distributed',
                                format: 'money',
                                format_args: {render_currency: currency},
                                definition: oneLine`
                                    Capital distributed which is not included in NAV
                                    calculation.
                                `,
                                placement: {
                                    position: 'right',
                                    relative: 'Paid In (Other)',
                                },
                                visible: true,
                            },
                        ];
                    }
                    return columns;
                }),
            },
            data: ko.pureComputed(() => {
                return this.datasource.data()?.results;
            }),
        });

        this.set_auto_get_data = value => {
            this.datasource.set_auto_get_data(value);
        };

        if (opts.register_export_event) {
            const export_csv_event = Utils.gen_event('ValueChange.export', this.get_id());
            Observer.broadcast(
                opts.register_export_event,
                {
                    title: 'Table',
                    subtitle: 'CSV',
                    type: 'Value Change',
                    event_type: export_csv_event,
                },
                true,
            );

            Observer.register(export_csv_event, () => {
                this.table.export_csv();
            });
        }

        this.when(this.datasource, this.table).done(() => {
            this.dfd.resolve();
        });
    }
}
