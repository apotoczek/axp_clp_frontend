/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import NumberBox from 'src/libs/components/basic/NumberBox';
import MetricTable from 'src/libs/components/MetricTable';
import CashflowChart from 'components/charts/CashflowChart';
import Customizations from 'src/libs/Customizations';

import 'src/libs/bindings/react';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="row" data-bind="foreach: callouts">
                <div class="col-xs-12 col-md-3" data-bind="renderComponent: $data">
                </div>
            </div>
            <div class="row">
                <div class="print-col-4 col-md-12 col-lg-4">
                    <div style="margin:35px 0 10px;" data-bind="renderComponent: metric_table">
                    </div>
                </div>
                <div class="print-col-8 col-md-12 col-lg-8">
                    <!-- ko if: $data.metrics_chart -->
                            <h4 class="text-center">Performance Metrics</h4>
                            <!-- ko renderComponent: metrics_chart --><!-- /ko -->
                    <!--/ko -->
                    <!-- ko ifnot: $data.metrics_chart -->
                        <h4 class="text-center">Cashflow Overview</h4>
                        <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                    <!-- /ko -->
                </div>
            </div>
            <!-- ko if:$data.metrics_chart -->
                <div class="page-break"></div>
                <div class="row" style="padding: 5px 20px 10px; margin-top:15px;">
                    <h4 class="text-center">Cashflow Overview</h4>
                    <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                </div>
            <!-- /ko -->
        `);

    self.define_template(
        'gross',
        `
            <div class="row" data-bind="foreach: callouts">
                <div class="col-xs-12 col-md-1-5" data-bind="renderComponent: $data"></div>
            </div>
            <div class="row">
                <div class="print-col-4 col-md-12 col-lg-4">
                    <div style="margin:35px 0 10px;" data-bind="renderComponent: metric_table">
                    </div>
                </div>
                <div class="print-col-8 col-md-12 col-lg-8">
                    <!-- ko if: $data.metrics_chart -->
                        <h4 class="text-center">Performance Metrics</h4>
                        <!-- ko renderComponent: metrics_chart --><!-- /ko -->
                    <!--/ko -->

                    <!-- ko ifnot: $data.metrics_chart -->
                        <h4 class="text-center">Cashflow Overview</h4>
                        <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                    <!-- /ko -->
                </div>
            </div>
            <!-- ko if:$data.metrics_chart -->
                <div class="page-break"></div>
                <div class="row" style="padding: 5px 20px 10px; margin-top:15px;">
                    <h4 class="text-center">Cashflow Overview</h4>
                    <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                </div>
            <!-- /ko -->
        `,
    );

    self.define_template(
        'visual_reports',
        `
            <div class="row" data-bind="foreach: callouts">
                <div class="col-xs-3" data-bind="renderComponent: $data">
                </div>
            </div>
            <div class="row">
                <div class="col-xs-4">
                    <div style="margin:35px 0 10px;" data-bind="renderComponent: metric_table">
                    </div>
                </div>
                <div class="col-xs-8">
                    <!-- ko if: $data.metrics_chart -->
                            <h4 class="text-center">Performance Metrics</h4>
                            <!-- ko renderComponent: metrics_chart --><!-- /ko -->
                    <!--/ko -->

                    <!-- ko ifnot: $data.metrics_chart -->
                        <h4 class="text-center">Cashflow Overview</h4>
                        <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                    <!-- /ko -->
                </div>
            </div>
            <!-- ko if:$data.metrics_chart -->
                <div class="page-break"></div>
                <div class="row" style="padding: 5px 20px 10px; margin-top:15px;">
                    <h4 class="text-center">Cashflow Overview</h4>
                    <div data-bind="renderReactComponent: CashflowChart, props: cf_props"></div>
                </div>
            <!-- /ko -->
        `,
    );

    opts.callouts = opts.callouts || [
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

    const commitment_label =
        opts.entity_type == 'market_data_fund' || opts.entity_type == 'market_data_family'
            ? 'Target Size'
            : 'Commitment';
    opts.metrics = opts.metrics || [
        {
            label: commitment_label,
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
                value_key: 'paid_in',
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
                value_key: 'distributed',
                currency_key: 'render_currency',
            },
        },
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
        {
            label: 'Vintage Year',
            value_key: 'vintage_year',
        },
        {
            label: 'First Close',
            value_key: 'first_close',
            format: 'backend_date',
        },
        {
            label: 'As of Date',
            value_key: 'as_of_date',
            format: 'backend_date',
        },
        {
            label: 'Age',
            value_key: 'age_years',
            format: 'years',
        },
    ];

    opts.metrics = opts.metrics.concat(opts.additional_metrics || []);

    if (opts.metrics) {
        self.metric_table = new MetricTable({
            template: opts.metric_table_template || 'tpl_metric_table',
            css: opts.metric_table_css || {'table-light': true},
            metrics: opts.metrics,
            data: self.data,
            loading: self.loading,
        });
    }

    const chartColors = {
        calculatedNav: Customizations.get_color('tenth'),
        nav: Customizations.get_color('ninth'),
        paidIn: Customizations.get_color('second'),
        distributed: Customizations.get_color('first'),
        totalValue: Customizations.get_color('tenth'),
        cashflows: Customizations.get_color('ninth'),
        commitment: Customizations.get_color('third'),
    };

    self.CashflowChart = CashflowChart;
    self.cf_props = ko.pureComputed(() => {
        const data = self.data() || {};

        return {
            chartData: data.chart_data,
            renderCurrency: data.render_currency,
            chartColors,
            height: 510,
            exporting: opts.exporting ?? false,
        };
    });

    self.metrics_chart = opts.metrics_chart;

    self.callouts = [];

    self.init_callout = function(opts) {
        return new NumberBox({
            template: 'tpl_number_box',
            label: opts.label,
            format: opts.format,
            subtext: opts.subtext,
            data: ko.computed(() => {
                let data = self.data();
                if (data) {
                    return data[opts.value_key];
                }
            }),
            loading: self.loading,
        });
    };

    for (let i = 0, l = opts.callouts.length; i < l; i++) {
        self.callouts.push(self.init_callout(opts.callouts[i]));
    }
    return self;
}
