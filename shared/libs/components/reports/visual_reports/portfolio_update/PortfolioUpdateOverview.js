/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import BarChart from 'src/libs/components/charts/BarChart';
import PieChart from 'src/libs/components/charts/PieChart';
import NumberBox from 'src/libs/components/basic/NumberBox';
import SimpleTable from 'src/libs/components/SimpleTable';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="row" data-bind="foreach: callouts">
                <div class="col-xs-12 col-md-3" data-bind="renderComponent: $data">
                </div>
            </div>
            <div class="row">
                <div class="col-xs-7">
                    <!-- ko renderComponent: overview_table --><!-- /ko -->
                </div>
                <div class="col-xs-5">
                    <!-- ko renderComponent: irr_chart --><!-- /ko -->
                </div>
            </div>
            <div class="row">
                <div class="col-xs-4">
                    <!-- ko renderComponent: allocation_by_year --><!-- /ko -->
                </div>
                <div class="col-xs-4">
                    <!-- ko renderComponent: allocation_by_sector --><!-- /ko -->
                </div>
                <div class="col-xs-4">
                    <!-- ko renderComponent: allocation_by_geography --><!-- /ko -->
                </div>
            </div>
        `);

    self.render_currency = opts.render_currency;

    let format = {
        money: Formatters.gen_formatter({
            format: 'money',
            format_args: {
                render_currency: self.render_currency,
            },
        }),
        percent: Formatters.percent,
    };

    self.overview_table = self.new_instance(SimpleTable, {
        id: 'overview_table',
        columns: [
            {
                key: 'metric',
                cell_css: 'table-lbl',
            },
            {
                label: 'Q-T-D',
                key: 'quarter_to_date',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                label: 'Y-T-D',
                key: 'year_to_date',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                label: 'Since Inception',
                key: 'since_inception',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return [
                    {
                        metric: 'Beginning Balance',
                        quarter_to_date: format.money(data.beginning_balance.quarter_to_date),
                        year_to_date: format.money(data.beginning_balance.year_to_date),
                        since_inception: format.money(data.beginning_balance.since_inception),
                    },
                    {
                        metric: 'Contributions',
                        quarter_to_date: format.money(data.contributions.quarter_to_date),
                        year_to_date: format.money(data.contributions.year_to_date),
                        since_inception: format.money(data.contributions.since_inception),
                    },
                    {
                        metric: 'Distributions',
                        quarter_to_date: format.money(data.distributions.quarter_to_date),
                        year_to_date: format.money(data.distributions.year_to_date),
                        since_inception: format.money(data.distributions.since_inception),
                    },
                    {
                        metric: 'Investment Return',
                        quarter_to_date: format.money(data.return.quarter_to_date),
                        year_to_date: format.money(data.return.year_to_date),
                        since_inception: format.money(data.return.since_inception),
                    },
                    {
                        metric: 'Unfunded',
                        quarter_to_date: ' ',
                        year_to_date: ' ',
                        since_inception: format.money(data.unfunded),
                    },
                    {
                        metric: 'TWRR',
                        quarter_to_date: format.percent(data.twrr_variable.quarter_to_date),
                        year_to_date: format.percent(data.twrr_variable.year_to_date),
                        since_inception: format.percent(data.twrr),
                    },
                    {
                        metric: 'IRR',
                        quarter_to_date: format.percent(data.irr_variable.quarter_to_date),
                        year_to_date: format.percent(data.irr_variable.year_to_date),
                        since_inception: format.percent(data.irr),
                    },
                ];
            }
        }),
    });

    opts.callouts = opts.callouts || [
        {
            label: 'Gross IRR',
            value_key: 'irr',
            format: 'irr_highlight',
            subtext: opts.irr_subtext,
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
            label: 'Paid in %',
            value_key: 'picc',
            format: 'picc_highlight',
        },
    ];

    self.irr_chart = self.new_instance(BarChart, {
        id: 'irr_chart',
        template: 'tpl_chart_box',
        height: 280,
        label: 'IRR by Period',
        vertical_bars: false,
        format: 'percent',
        colors: ['seventh'],
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data) {
                return [
                    {
                        label: 'Q-T-D',
                        value: data.irr_variable.quarter_to_date,
                    },
                    {
                        label: 'Y-T-D',
                        value: data.irr_variable.year_to_date,
                    },
                    {
                        label: 'Since Inception',
                        value: data.irr,
                    },
                ];
            }
        }),
        plotlines: [
            {
                value: 0,
                color: '#B8B8B8',
                width: 1,
                zIndex: 5,
            },
        ],
    });

    let pie_colors = [
        '#BBBBBB',
        'first',
        'seventh',
        'fifth',
        '#404040',
        'third',
        '#A6A6A6',
        'eighth',
        'second',
        'sixth',
        'fourth',
    ];

    self.allocation_by_year = self.new_instance(PieChart, {
        id: 'allocation_by_year',
        format: 'percent',
        value_key: 'value',
        label_key: 'label',
        colors: pie_colors,
        title: 'Allocation by Years',
        height: 300,
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.chart_data) {
                return data.chart_data.allocations_by_year.sort((a, b) => a.label < b.label);
            }
        }),
    });
    self.allocation_by_sector = self.new_instance(PieChart, {
        id: 'allocation_by_sector',
        format: 'percent',
        value_key: 'value',
        label_key: 'label',
        colors: pie_colors,
        title: 'Allocation by Sector',
        height: 300,
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.chart_data) {
                return data.chart_data.allocations_by_sector;
            }
        }),
    });
    self.allocation_by_geography = self.new_instance(PieChart, {
        id: 'allocation_by_geography',
        format: 'percent',
        value_key: 'value',
        label_key: 'label',
        colors: pie_colors,
        title: 'Allocation by Geography',
        height: 300,
        data: ko.pureComputed(() => {
            let data = self.data();
            if (data && data.chart_data) {
                return data.chart_data.allocations_by_geography;
            }
        }),
    });

    self.callouts = [];

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

    for (let i = 0, l = opts.callouts.length; i < l; i++) {
        self.callouts.push(self.init_callout(opts.callouts[i]));
    }

    return self;
}
