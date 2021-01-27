import ko from 'knockout';

import MetricTable from 'src/libs/components/MetricTable';
import NumberBox from 'src/libs/components/basic/NumberBox';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';

class HLPROverview extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.define_template(`
            <div class="row" data-bind="foreach: callouts">
                <div style="height: 120px;" class="col-xs-12 col-md-3" data-bind="renderComponent: $data">
                </div>
            </div>
            <div class="row">
                <div class="col-xs-6">
                    <div style="padding: 5px 20px 10px;margin-top:15px;" data-bind="renderComponent: metric_table_1">
                    </div>
                </div>
                <div class="col-xs-6">
                    <div style="padding: 5px 20px 10px;margin-top:15px;" data-bind="renderComponent: metric_table_2">
                    </div>
                </div>
            </div>

        `);

        const callout_settings = [
            {
                label: 'Net IRR',
                value_key: 'irr',
                format: 'irr_highlight',
            },
            {
                label: 'TVPI',
                value_key: 'tvpi',
                format: 'multiple_highlight',
            },
            {
                label: 'DPI',
                value_key: 'dpi',
                format: 'multiple_neutral',
            },
            {
                label: 'RVPI',
                value_key: 'rvpi',
                format: 'multiple_neutral',
            },
        ];

        this.chart_data = ko.pureComputed(() => {
            let data = this.data();
            if (data) {
                return data['chart_data'];
            }
            return [];
        });

        this.metric_table_1 = new MetricTable({
            template: opts.metric_table_template || 'tpl_metric_table',
            css: opts.metric_table_css || {'table-light': true},
            data: this.data,
            loading: this.loading,
            metrics: [
                {
                    label: 'Commitment',
                    format: 'money',
                    format_args: {
                        value_key: 'commitment',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Paid In',
                    format: 'money',
                    format_args: {
                        value_key: 'sum_paid_in',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Unfunded',
                    format: 'money',
                    format_args: {
                        value_key: 'unfunded',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Distributed',
                    format: 'money',
                    format_args: {
                        value_key: 'sum_distributed',
                        currency_key: 'render_currency',
                    },
                },
            ],
        });

        this.metric_table_2 = new MetricTable({
            template: opts.metric_table_template || 'tpl_metric_table',
            css: opts.metric_table_css || {'table-light': true},
            data: this.data,
            loading: this.loading,
            metrics: [
                {
                    label: 'Remaining (NAV)',
                    format: 'money',
                    format_args: {
                        value_key: 'nav',
                        currency_key: 'render_currency',
                    },
                },
                {
                    label: 'Total Value',
                    format: 'money',
                    format_args: {
                        value_key: 'total_value',
                        currency_key: 'render_currency',
                    },
                },
            ],
        });

        this.metrics_progression_chart = this.new_instance(TimeseriesChart, {
            id: 'chart',
            label: 'Metrics Progression',
            template: 'tpl_chart_box',
            height: 300,

            formatter: this.formatter,
            shared_tooltip: true,
            exporting: true,
            y_axes: [
                {
                    format: 'irr',
                    title: 'IRR',
                },
                {
                    format: 'multiple',
                    min: 0,
                    title: 'Multiple',
                    opposite: true,
                },
            ],
            series: [
                {
                    key: 'irr',
                    name: 'IRR',
                    type: 'line',
                    y_axis: 0,
                },
                {
                    key: 'dpi',
                    name: 'DPI',
                    type: 'line',
                    y_axis: 1,
                },
                {
                    key: 'rvpi',
                    name: 'RVPI',
                    type: 'line',
                    y_axis: 1,
                },
                {
                    key: 'tvpi',
                    name: 'TVPI',
                    type: 'line',
                    y_axis: 1,
                },
            ],
            data: ko.pureComputed(() => {
                let dat = opts.metrics_progression_datasource;
                if (dat && dat.data) {
                    return dat.data();
                }
            }),
        });
        this.add_dependency(this.metrics_progression_chart);

        this.callouts = [];

        for (let i = 0, l = callout_settings.length; i < l; i++) {
            this.callouts.push(this.init_callout(callout_settings[i]));
        }

        return this;
    }

    init_callout(opts) {
        return this.new_instance(NumberBox, {
            template: 'tpl_number_box',
            label: opts.label,
            format: opts.format,
            subtext: opts.subtext,
            data: ko.pureComputed(() => {
                let data = this.data();
                if (data) {
                    return data[opts.value_key];
                }
            }),
            loading: this.loading,
        });
    }
}

export default HLPROverview;
