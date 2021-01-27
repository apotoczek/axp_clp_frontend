/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BarChart from 'src/libs/components/charts/BarChart';
import LineChart from 'src/libs/components/charts/LineChart';
import NumberBox from 'src/libs/components/basic/NumberBox';
import MetricTable from 'src/libs/components/MetricTable';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import * as Formatters from 'src/libs/Formatters';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import {SystemMetricType, CalculatedMetric} from 'src/libs/Enums';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div style="margin:0 5%;">
                <div style="text-align: left; padding-left: 28px;" data-bind="renderComponent: company_name_header"></div>

                <div class="row">
                    <div class="col-xs-4">
                        <div style="padding: 5px 20px 10px;margin-top:15px;" data-bind="renderComponent: metric_table_1">
                        </div>
                    </div>
                    <div class="col-xs-4">
                        <div style="padding: 5px 20px 10px;margin-top:15px;" data-bind="renderComponent: metric_table_2">
                        </div>
                    </div>
                    <div class="col-xs-4">
                        <div style="padding: 5px 20px 10px;margin-top:15px;" data-bind="renderComponent: metric_table_3">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <!-- ko renderComponent: revenue --><!-- /ko -->
                    </div>
                    <div class="col-xs-6">
                        <!-- ko renderComponent: ebitda_and_net_debt --><!-- /ko -->
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <!-- ko renderComponent: ebitda --><!-- /ko -->
                    </div>
                    <div class="col-xs-6">
                        <!-- ko renderComponent: net_debt_multiple --><!-- /ko -->
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-6">
                        <!-- ko renderComponent: ebitda_margin --><!-- /ko -->
                    </div>
                    <div class="col-xs-6">
                        <!-- ko renderComponent: ev_multiple --><!-- /ko -->
                    </div>
                </div>

            </div>
        `);

    // Component is initialized after data is available

    const operating_metrics = self.data().operating_metrics;

    let chart_data = {};
    if (operating_metrics && Object.keys(operating_metrics)) {
        chart_data = operating_metrics[Object.keys(operating_metrics)[0]].trends;
    }

    let company_chart_height = 200;

    self.metric_table_1 = new MetricTable({
        template: opts.metric_table_template || 'tpl_metric_table',
        css: opts.metric_table_css || {'table-light': true},
        metrics: [
            {
                label: 'Acquisition Date',
                value_key: 'first_close',
                format: 'backend_date',
            },
            {
                label: 'Age',
                value_key: 'age_years',
                format: 'years',
            },
            {
                label: 'Deal Team Leader',
                value_key: 'deal_team_leader',
            },
            {
                label: 'Country',
                value_key: 'country',
            },
            {
                label: 'Geography',
                value_key: 'geography',
            },
        ],
        data: self.data,
        loading: self.loading,
    });
    self.metric_table_2 = new MetricTable({
        template: opts.metric_table_template || 'tpl_metric_table',
        css: opts.metric_table_css || {'table-light': true},
        metrics: [
            {
                label: 'Deal Type',
                value_key: 'deal_type',
            },
            {
                label: 'Invested',
                format: 'money',
                format_args: {
                    value_key: 'paid_in',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Realized',
                format: 'money',
                format_args: {
                    value_key: 'distributed',
                    currency_key: 'render_currency',
                },
            },
            {
                label: 'Unrealized',
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
        data: self.data,
        loading: self.loading,
    });
    self.metric_table_3 = new MetricTable({
        template: opts.metric_table_template || 'tpl_metric_table',
        css: opts.metric_table_css || {'table-light': true},
        metrics: [
            {
                label: 'Deal Role',
                value_key: 'deal_role',
            },
            {
                label: 'Gross IRR',
                value_key: 'irr',
                format: 'percent',
            },
            {
                label: 'MOIC',
                value_key: 'tvpi',
                format: 'multiple',
            },
            {
                label: 'DPI',
                value_key: 'dpi',
                format: 'multiple',
            },
            {
                label: 'RVPI',
                value_key: 'rvpi',
                format: 'multiple',
            },
        ],
        data: self.data,
        loading: self.loading,
    });

    self.company_name_header = new HTMLContent({
        html: ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return `<h2>${data.name}</h2>`;
            }
        }),
    });

    let chart_data_formatter = arr => ({label: arr[0], value: arr[1]});

    let grouped_chart_formatter = datasets_obj => {
        let key_map = {
            EBITDA: 'ebitda',
            'Net Debt': 'net_debt',
        };
        let labels = [];
        let groups = [];
        let metrics = [];
        for (let metric_name in datasets_obj) {
            if (metric_name in key_map && datasets_obj[metric_name]) {
                let values = datasets_obj[metric_name].values;
                let data = {};

                labels.push(metric_name);
                for (let i = 0; i < values.length; i++) {
                    let date = values[i][0];
                    let val = values[i][1];

                    if (!groups.includes(date)) {
                        groups.push(date);
                    }
                    data[date] = val;
                }

                metrics.push({
                    data: data,
                    key: key_map[metric_name],
                    name: metric_name,
                });
            }
        }
        groups.sort();

        return {
            groups: groups,
            metrics: metrics,
            vehicle_name: 'vehicle_name',
        };
    };

    self.revenue = self.new_instance(BarChart, {
        id: 'revenue',
        label: 'Revenue',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['seventh'],
        data: chart_data[SystemMetricType.Revenue]
            ? chart_data[SystemMetricType.Revenue].values.map(chart_data_formatter)
            : undefined,
        format: 'money',
        label_formatter: Formatters.gen_formatter('date_year'),
    });

    self.ebitda_and_net_debt = self.new_instance(GroupedBarChart, {
        id: 'ebitda_and_net_debt',
        label: 'EBITDA & Net Debt',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['third', 'fourth'],
        data: grouped_chart_formatter({
            EBITDA: chart_data[SystemMetricType.Ebitda],
            'Net Debt': chart_data[SystemMetricType.NetDebt],
        }),
        format: 'money',
        x_formatter: Formatters.gen_formatter('date_year'),
        value_key: 'value',
        label_key: 'label',
    });

    self.ebitda = self.new_instance(LineChart, {
        id: 'ebitda',
        label: 'EBITDA',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['fifth'],
        data: chart_data[SystemMetricType.Ebitda]
            ? chart_data[SystemMetricType.Ebitda].values.map(chart_data_formatter)
            : undefined,
        format: 'money',
        label_formatter: Formatters.gen_formatter('date_year'),
        value_key: 'value',
        label_key: 'label',
    });

    self.net_debt_multiple = self.new_instance(BarChart, {
        id: 'net_debt_multiple',
        label: 'Net Debt Multiple',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['fifth'],
        data: chart_data[CalculatedMetric.DebtMultiple]
            ? chart_data[CalculatedMetric.DebtMultiple].values.map(chart_data_formatter)
            : undefined,
        format: 'multiple',
        label_formatter: Formatters.gen_formatter('date_year'),
        value_key: 'value',
        label_key: 'label',
    });
    self.ebitda_margin = self.new_instance(LineChart, {
        id: 'ebitda_margin',
        label: 'EBITDA Margin',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['seventh'],
        data: chart_data[CalculatedMetric.EbitdaMargin]
            ? chart_data[CalculatedMetric.EbitdaMargin].values.map(chart_data_formatter)
            : undefined,
        format: 'percent',
        label_formatter: Formatters.gen_formatter('date_year'),
        value_key: 'value',
        label_key: 'label',
    });
    self.ev_multiple = self.new_instance(BarChart, {
        id: 'ev_multiple',
        label: 'EV Multiple',
        template: 'tpl_chart_box',
        height: company_chart_height,
        vertical_bars: true,
        colors: ['fourth'],
        data: chart_data[CalculatedMetric.EvMultiple]
            ? chart_data[CalculatedMetric.EvMultiple].values.map(chart_data_formatter)
            : undefined,
        format: 'multiple',
        label_formatter: Formatters.gen_formatter('date_year'),
        value_key: 'value',
        label_key: 'label',
    });

    self.init_callout = function(opts) {
        return new NumberBox({
            template: 'tpl_number_box',
            label: opts.label,
            format: opts.format,
            subtext: opts.subtext,
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data) {
                    return data[opts.value_key];
                }
            }),
            loading: self.loading,
        });
    };

    return self;
}
