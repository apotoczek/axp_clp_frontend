/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Glossary from 'src/libs/components/reports/visual_reports/Glossary';
import GroupedBarChart from 'src/libs/components/charts/GroupedBarChart';
import BarChart from 'src/libs/components/charts/BarChart';
import SimpleTable from 'src/libs/components/SimpleTable';
import TimeseriesChart from 'src/libs/components/charts/TimeseriesChart';
import ChartCurrencyWrapper from 'src/libs/components/reports/visual_reports/ChartCurrencyWrapper';
import MetricTable from 'src/libs/components/MetricTable';
import Row from 'src/libs/components/basic/Row';
import ReportMeta from 'src/libs/components/reports/visual_reports/ReportMeta';
import ReportComponentWrapper from 'src/libs/components/reports/visual_reports/ReportComponentWrapper';
import PageLayout from 'src/libs/components/reports/visual_reports/PageLayout';
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import Viewer from 'src/libs/components/reports/visual_reports/base/Viewer';
import Customizations from 'src/libs/Customizations';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.define_default_template(`
            <!-- ko if: loading -->
                <div class="big-message">
                    <span class="glyphicon glyphicon-cog animate-spin"></span>
                    <h1>Loading Report..</h1>
                </div>
            <!-- /ko -->
            <!-- ko ifnot: loading -->
                <!-- ko renderComponent: viewer --><!-- /ko -->
            <!-- /ko -->
        `);

    self.events = opts.events;
    self.body_only = opts.body_only;

    self.fund_uid = ko.observable();
    self.user_fund_uid = ko.observable();

    self.datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:peer_report',
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.events.user_fund_uid,
                    required: true,
                },
                comparison_user_fund_uid: {
                    type: 'observer',
                    event_type: self.events.fund_uid,
                    required: true,
                },
            },
        },
    });

    self.possesive = function(str) {
        if (str.toLowerCase().endsWith('s')) {
            return `${str}'`;
        }

        return `${str}'s`;
    };

    self.quote = function(str) {
        return `&quot;${str}&quot;`;
    };

    self.backend_date = Formatters.gen_formatter('backend_date');
    self.percent = Formatters.gen_formatter('percent');

    self.get_computed = key => {
        return ko.pureComputed(() => {
            return Utils.extract_data(key, self.datasource.data());
        });
    };

    self.target_meta = self.get_computed('meta:target');
    self.comparison_meta = self.get_computed('meta:comp');

    self.comp_name = ko.pureComputed(() => {
        let meta = self.comparison_meta();

        if (meta) {
            return meta.name;
        }

        return '';
    });

    self.target_name = ko.pureComputed(() => {
        let meta = self.target_meta();

        if (meta) {
            return meta.name;
        }

        return '';
    });

    self.quartile_progression_data = ko.computed(() => {
        let data = self.datasource.data();

        let result_data = {};

        if (data && data.quartile_progression) {
            let datas = [data.quartile_progression.comp, data.quartile_progression.target];

            for (let data of datas) {
                for (let [key, timeseries] of Object.entries(data.timeseries)) {
                    if (!result_data[key]) {
                        result_data[key] = {};
                    }

                    result_data[key][data.vehicle_name] = timeseries;
                }
            }

            return result_data;
        }

        return {};
    });

    self.horizon_analysis_twrr = self.get_computed('horizon_analysis_twrr');

    self.horizon_analysis_irr = self.get_computed('horizon_analysis_irr');

    self.pme_trend = self.get_computed('pme_trend');

    self.irr_j_curve = self.get_computed('irr_j_curve');

    self.cashflow_j_curve = self.get_computed('cashflow_j_curve');

    self.quarterly_twrr = self.get_computed('quarterly_twrr');

    self.comp_net_performance = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (
            data &&
            data.net_performance &&
            data.net_performance.comp &&
            data.meta &&
            data.meta.comp
        ) {
            let meta = data.meta.comp;
            let analysis = data.net_performance.comp;

            return Object.assign({}, analysis, {
                source_investor: meta.investor_name,
                rolled_forward: meta.as_of_date < analysis.as_of_date,
            });
        }
    });

    self.absolute_value_growth = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.absolute_value_growth) {
            let res = [];

            for (let d of data.absolute_value_growth) {
                res.push({
                    title: d.vehicle_name,
                    items: [
                        {
                            label: d.vehicle_name,
                            value: d.vehicle_growth,
                        },
                        {
                            label: d.market_name,
                            value: d.market_growth,
                        },
                    ],
                });
            }
            return res;
        }
    });

    self.report = ko.pureComputed(() => {
        let meta = self.target_meta();
        let comp_meta = self.comparison_meta();

        if (meta && comp_meta) {
            return {
                name: `${meta.name} vs<br />${comp_meta.name}`,
                created: Utils.epoch() / 1000,
            };
        }

        return {};
    });

    self.overview_metrics = [
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
    ];

    self.captions = {
        total_value_trend: ko.pureComputed(() => {
            return `
                    This chart compares the growth in total value between ${self.quote(
                        self.target_name(),
                    )} and ${self.quote(self.comp_name())} since inception.
                `.trim();
        }),
        pme_trend: `
                The chart above tracks PME alpha since inception against the MSCI ACWI IMI index.

                PME Alpha is the difference between the fund's IRR and the index's IRR. The index's IRR is calulated using the Cobalt PME Methodology.
            `.trim(),
        pme_trend_3_year: ko.pureComputed(() => {
            let data = self.pme_trend();
            let caption = `The chart above analyzes the PME alpha trend for ${self.quote(
                self.target_name(),
            )} and ${self.quote(self.comp_name())} over the last three years.`;

            if (data) {
                for (let footnote of data.footnotes) {
                    caption += ['\n<small>', footnote, '</small>'].join('');
                }

                return caption;
            }

            return caption;
        }),
        horizon_analysis_twrr: ko.pureComputed(() => {
            let data = self.horizon_analysis_twrr();

            if (data && data.metrics) {
                let target = data.metrics.find(m => {
                    return m.name == self.target_name();
                });

                let comp = data.metrics.find(m => {
                    return m.name == self.comp_name();
                });

                if (target && comp) {
                    let caption = `
                            Over the past year, ${self.target_name()} has generated a TWRR of ${self.percent(
                        target.data['1 year'],
                    )} compared to ${self.possesive(self.comp_name())} TWRR of ${self.percent(
                        comp.data['1 year'],
                    )}

                            The time-weighted return serves as a proxy for the total value growth. Since time-weighted looks at the quarterly NAV change, while stripping out cash flow effects, it is best used for an individual fund after the fund's investment period has ended.
                        `.trim();

                    for (let footnote of data.footnotes) {
                        caption += ['\n<small>', footnote, '</small>'].join('');
                    }

                    return caption;
                }
            }
        }),
        horizon_analysis_irr: ko.pureComputed(() => {
            let data = self.horizon_analysis_irr();

            if (data && data.metrics) {
                let target = data.metrics.find(m => {
                    return m.name == self.target_name();
                });

                let comp = data.metrics.find(m => {
                    return m.name == self.comp_name();
                });

                if (target && comp) {
                    return `
                            Over the past year, ${self.target_name()} has generated an IRR of ${self.percent(
                        target.data['1 year'],
                    )} compared to ${self.possesive(self.comp_name())} IRR of ${self.percent(
                        comp.data['1 year'],
                    )}.

                            The horizon IRR calculates an IRR over a given time period. The IRR calculation takes into account the timing and size of cash flows.
                        `.trim();
                }
            }
        }),
        absolute_value_growth: `
                The chart above compares the fund's TVPI change since inception to the public market's change in value over the same time period.

                The analysis provides you with a perspective of the market environment in which each fund operated.
            `.trim(),
        quarterly_twrr: ko.pureComputed(() => {
            return `The chart above plots the quarterly time-weighted returns for ${self.quote(
                self.target_name(),
            )} and ${self.quote(
                self.comp_name(),
            )}. The variability of returns illustrates the volatility of each fund's growth.`;
        }),
        momentum_analysis: `
                The chart above plots each fund's trailing one year TVPI momentum on a quarterly basis. TVPI momentum calculates the year-over-year change in a fund's TVPI.

                The chart will help you identify inflection points in a fund's life, like when did a fund's growth begin to accelerate or slow. When the line is above 0%, TVPI is growing year-over-year.
            `.trim(),
        irr_j_curve: ko.pureComputed(() => {
            let data = self.irr_j_curve();

            let caption = `
                    The chart plots each fund's IRR j-curve since inception. This enables you to analyze each fund manager's ability to mitigate the impact of fees and gauge the ability to build a portfolio that creates value.
                `.trim();

            if (data && data.funds) {
                caption += '\n\n';

                for (let fund of data.funds) {
                    if (fund.break_even_quarter) {
                        caption += `${self.possesive(fund.name)} IRR broke even in Q${
                            fund.break_even_quarter
                        }, ${fund.break_even_quarter / 4} years after the first cash flow. `;
                    }
                }
            }

            return caption;
        }),
        irr_j_curve_12_quarters: `
                This view zooms in on the last 12 quarter, allowing you to get an understanding of each fund's progress.
            `.trim(),
        cashflow_j_curve: ko.pureComputed(() => {
            return `
                    The cash flow j-curve analysis compares ${self.possesive(
                        self.target_name(),
                    )} and ${self.possesive(
                self.comp_name(),
            )} cumulative cash flows (contributions + distributions). The cash flow j-curve analyzes the fund's investment pace as well as the manager's ability to distribute returns back to LPs.

                    An LP looks at this analysis to understand the length of time that their capital is outstanding or &quot;at risk&quot;.
                `.trim();
        }),
        remaining_value_trend: ko.pureComputed(() => {
            return `
                    The remaining value trend analyzes ${self.possesive(
                        self.target_name(),
                    )} and ${self.possesive(
                self.comp_name(),
            )} remaining value over time. During the fund's early years, a higher RVPI position is good. As a fund matures, a GP should consider the RVPI in context with the DPI.

                    LPs look at your RVPI compared to your peers to get an understanding of how much of a fund's value is still unrealized and exposed to market conditions.
                `.trim();
        }),
    };

    self.viewer_layout = {
        id: 'layout',
        component: PageLayout,
        page_css: 'fbr',
        enable_toc: true,
        toc_page_number: 2,
        mode: 'view',
        pages: [
            {
                is_cover: true,
                layout: ['fund_meta_data'],
            },
            {
                title: 'Fund Overview',
                subtitle: 'Net Performance',
                layout: ['net_performance', 'total_value_trend'],
            },
            {
                title: 'Trend Analysis',
                subtitle: 'Bison Benchmark Trend',
                layout: ['peer_trend_irr', 'peer_trend_tvpi', 'peer_trend_dpi'],
            },
            {
                title: 'Trend Analysis',
                subtitle: 'PME Trend',
                layout: ['pme_trend', 'pme_trend_3_year'],
            },
            {
                title: 'Trend Analysis',
                subtitle: 'Momentum Analysis',
                layout: ['momentum_analysis'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Horizon Analysis',
                layout: ['horizon_analysis_twrr', 'horizon_analysis_irr'],
            },
            {
                title: 'Value Growth',
                subtitle: 'Absolute Returns',
                layout: ['absolute_value_growth'],
            },
            {
                title: 'Fund Management',
                subtitle: 'IRR J-Curve',
                layout: ['irr_j_curve', 'irr_j_curve_12_quarters'],
            },
            {
                title: 'Fund Management',
                subtitle: 'Cash Flow J-Curve',
                layout: ['cashflow_j_curve', 'cashflow_stats'],
            },
            {
                title: 'Risk Exposure',
                subtitle: 'Remaining Value Trend',
                layout: ['remaining_value_trend'],
            },
            {
                title: 'Risk Exposure',
                subtitle: 'Return Volatility',
                layout: ['quarterly_twrr', 'quarterly_twrr_metrics'],
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_1'],
            },
            {
                title: 'Appendix',
                subtitle: 'Glossary',
                layout: ['glossary_2'],
            },
        ],
        components: [
            {
                id: 'fund_meta_data',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    id: 'fund_meta_data',
                    report: self.report,
                    report_title: 'Peer Report',
                    include_meta: false,
                    include_logo: false,
                    template: 'tpl_fbr_report_cover',
                    component: ReportMeta,
                    data: self.target_meta,
                    data_map: {
                        as_of_date: {
                            key: 'last_date',
                            format: 'backend_date_quarterly',
                        },
                    },
                },
            },
            {
                id: 'net_performance',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Row,
                    columns: ['left', 'right'],
                    components: [
                        {
                            component: MetricTable,
                            id: 'left',
                            css: {'table-light': true},
                            metrics: self.overview_metrics,
                            title: ko.pureComputed(() => {
                                let meta = self.target_meta();

                                if (meta) {
                                    return meta.name;
                                }
                            }),
                            data: self.get_computed('net_performance:target'),
                        },
                        {
                            component: MetricTable,
                            id: 'right',
                            css: {'table-light': true},
                            metrics: self.overview_metrics.concat([
                                {
                                    label: 'Source Investor',
                                    value_key: 'source_investor',
                                    format: 'truncate',
                                },
                                {
                                    label: 'Rolled Forward',
                                    value_key: 'rolled_forward',
                                    format: 'boolean',
                                },
                            ]),
                            title: ko.pureComputed(() => {
                                let meta = self.comparison_meta();

                                if (meta) {
                                    return meta.name;
                                }
                            }),
                            data: self.comp_net_performance,
                        },
                    ],
                },
            },
            {
                id: 'total_value_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Growth in Total Value Since Inception',
                caption: {
                    text_body_provider: self.captions.total_value_trend,
                },
                widget_config: {
                    component: ChartCurrencyWrapper,
                    currency_event: self.render_currency_event,
                    chart_config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
                        shared_tooltip: true,
                        sticky_tooltip_on_click: true,
                        height: 300,
                        series: [
                            {
                                key: 'vehicle',
                                type: 'line',
                            },
                        ],
                        x_quarter_offset: true,
                        data: self.get_computed('total_value_trend'),
                    },
                },
            },
            {
                id: 'peer_trend_irr',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'IRR Ranking',
                widget_config: {
                    height: 250,
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    y_categories: ['Q4', 'Q3', 'Q2', 'Q1'],
                    min: 0,
                    max: 3,
                    series: [
                        {
                            key: 'irr',
                            type: 'line',
                        },
                    ],
                    data: self.quartile_progression_data,
                    format: 'quartile',
                    format_args: {
                        inverse: true,
                        zero_indexed: true,
                    },
                    show_markers: true,
                },
            },
            {
                id: 'peer_trend_tvpi',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'TVPI Ranking',
                widget_config: {
                    height: 250,
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    y_categories: ['Q4', 'Q3', 'Q2', 'Q1'],
                    min: 0,
                    max: 3,
                    series: [
                        {
                            key: 'tvpi',
                            type: 'line',
                        },
                    ],
                    data: self.quartile_progression_data,
                    format: 'quartile',
                    format_args: {
                        inverse: true,
                        zero_indexed: true,
                    },
                    show_markers: true,
                },
            },
            {
                id: 'peer_trend_dpi',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'DPI Ranking',
                caption: {
                    text_body_provider: ko.pureComputed(() => {
                        return `
                                The charts above compares the peer benchmark ranking of &quot;${self.target_name()}&quot; and &quot;${self.comp_name()}&quot; over the last three years.

                                The peer benchmark for each fund is defined by the fund's Geography, Style and Vintage Year.
                            `;
                    }),
                },
                widget_config: {
                    height: 250,
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    y_categories: ['Q4', 'Q3', 'Q2', 'Q1'],
                    min: 0,
                    max: 3,
                    series: [
                        {
                            key: 'dpi',
                            type: 'line',
                        },
                    ],
                    data: self.quartile_progression_data,
                    format: 'quartile',
                    format_args: {
                        inverse: true,
                        zero_indexed: true,
                    },
                    show_markers: true,
                },
            },
            {
                id: 'pme_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'PME Alpha vs MSCI ACWI IMI',
                caption: {
                    text_body_provider: self.captions.pme_trend,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'pme_alpha',
                            type: 'line',
                        },
                    ],
                    data: self.pme_trend,
                },
            },
            {
                id: 'pme_trend_3_year',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'PME Alpha vs MSCI ACWI IMI - Last 3 Years',
                caption: {
                    text_body_provider: self.captions.pme_trend_3_year,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'pme_alpha',
                            type: 'line',
                        },
                    ],
                    data: ko.pureComputed(() => {
                        let data = self.pme_trend();

                        let new_data = {
                            pme_alpha: {},
                        };

                        if (data) {
                            for (let [key, series] of Object.entries(data.pme_alpha)) {
                                if (series.length > 13) {
                                    new_data.pme_alpha[key] = series.slice(series.length - 13);
                                } else {
                                    new_data.pme_alpha[key] = series;
                                }
                            }
                        }

                        return new_data;
                    }),
                },
            },
            {
                id: 'quarterly_twrr',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Quarterly TWRR',
                caption: {
                    text_body_provider: self.captions.quarterly_twrr,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'volatility',
                            type: 'line',
                        },
                    ],
                    data: self.quarterly_twrr,
                },
            },
            {
                id: 'quarterly_twrr_metrics',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                // caption: {
                //     text_body_provider: self.captions.cashflow_stats,
                // },
                widget_config: {
                    component: SimpleTable,
                    columns: [
                        {
                            key: 'name',
                            cell_css: 'table-lbl',
                        },
                        {
                            label: 'Annualized TWRR',
                            key: 'annualized',
                            css: 'numeric',
                            format: 'percent',
                            cell_css: 'numeric table-data',
                        },
                        {
                            label: 'Std Deviation',
                            key: 'std_dev',
                            css: 'numeric',
                            format: 'percent',
                            cell_css: 'numeric table-data',
                        },
                    ],
                    data: ko.pureComputed(() => {
                        let data = self.quarterly_twrr();

                        if (data) {
                            return data.metrics;
                        }

                        return [];
                    }),
                },
            },
            {
                id: 'absolute_value_growth',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Absolute Value Growth',
                caption: {
                    text_body_provider: self.captions.absolute_value_growth,
                },
                widget_config: {
                    component: Row,
                    columns: ['left', 'right'],
                    components: [
                        {
                            id: 'left',
                            colors: Customizations.get_color_set(),
                            component: BarChart,
                            format: 'percent',
                            vertical_bars: true,
                            label_in_chart: true,
                            label: ko.pureComputed(() => {
                                let data = self.absolute_value_growth();

                                if (data) {
                                    return data[0].title;
                                }
                            }),
                            data: ko.pureComputed(() => {
                                let data = self.absolute_value_growth();

                                if (data) {
                                    return data[0].items;
                                }
                            }),
                        },
                        {
                            id: 'right',
                            component: BarChart,
                            format: 'percent',
                            colors: Customizations.get_color_set(),
                            vertical_bars: true,
                            label_in_chart: true,
                            label: ko.pureComputed(() => {
                                let data = self.absolute_value_growth();

                                if (data) {
                                    return data[1].title;
                                }
                            }),
                            data: ko.pureComputed(() => {
                                let data = self.absolute_value_growth();

                                if (data) {
                                    return data[1].items;
                                }
                            }),
                        },
                    ],
                },
            },
            {
                id: 'horizon_analysis_twrr',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Time Weighted Rate of Return',
                caption: {
                    text_body_provider: self.captions.horizon_analysis_twrr,
                },
                widget_config: {
                    height: 350,
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                    data: self.horizon_analysis_twrr,
                },
            },
            {
                id: 'horizon_analysis_irr',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'IRR',
                caption: {
                    text_body_provider: self.captions.horizon_analysis_irr,
                },
                widget_config: {
                    height: 350,
                    template: 'tpl_chart_box',
                    component: GroupedBarChart,
                    format: 'percent',
                    data: self.horizon_analysis_irr,
                },
            },
            {
                id: 'momentum_analysis',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Trailing 1 Year Momentum',
                caption: {
                    text_body_provider: self.captions.momentum_analysis,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'percent',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                    x_quarter_offset: true,
                    data: self.get_computed('momentum_analysis'),
                },
            },
            {
                id: 'irr_j_curve',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.captions.irr_j_curve,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'irr',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                    x_quarter_offset: true,
                    data: self.irr_j_curve,
                },
            },
            {
                id: 'irr_j_curve_12_quarters',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                title: 'Last 12 quarters',
                caption: {
                    text_body_provider: self.captions.irr_j_curve_12_quarters,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'irr',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                    x_quarter_offset: true,
                    data: ko.pureComputed(() => {
                        let data = self.irr_j_curve();

                        let new_data = {
                            vehicle: {},
                        };

                        if (data) {
                            for (let [key, series] of Object.entries(data.vehicle)) {
                                if (series.length > 13) {
                                    new_data.vehicle[key] = series.slice(series.length - 13);
                                } else {
                                    new_data.vehicle[key] = series;
                                }
                            }
                        }

                        return new_data;
                    }),
                },
            },
            {
                id: 'cashflow_j_curve',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.captions.cashflow_j_curve,
                },
                widget_config: {
                    component: ChartCurrencyWrapper,
                    currency_event: self.render_currency_event,
                    chart_config: {
                        template: 'tpl_chart_box',
                        component: TimeseriesChart,
                        shared_tooltip: true,
                        sticky_tooltip_on_click: true,
                        series: [
                            {
                                key: 'ranges',
                                name: 'Peer Range',
                                type: 'arearange',
                            },
                            {
                                key: 'median',
                                name: 'Peer Median',
                                type: 'line',
                            },
                            {
                                key: 'vehicle',
                                type: 'line',
                            },
                        ],
                        x_quarter_offset: true,
                        data: self.cashflow_j_curve,
                    },
                },
            },
            {
                id: 'cashflow_stats',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                // caption: {
                //     text_body_provider: self.captions.cashflow_stats,
                // },
                widget_config: {
                    component: SimpleTable,
                    columns: [
                        {
                            key: 'name',
                            cell_css: 'table-lbl',
                        },
                        {
                            label: 'Max Outflow',
                            key: 'max_outflow',
                            css: 'numeric',
                            cell_css: 'numeric table-data',
                        },
                        {
                            label: 'Max Outflow %',
                            key: 'max_outflow_value',
                            format: 'percent',
                            css: 'numeric',
                            cell_css: 'numeric table-data',
                        },
                        {
                            label: 'Break Even',
                            key: 'break_even',
                            css: 'numeric',
                            cell_css: 'numeric table-data',
                        },
                    ],
                    data: ko.pureComputed(() => {
                        let data = self.cashflow_j_curve();

                        if (data) {
                            return data.funds.map(fund => {
                                return {
                                    name: fund.name,
                                    max_outflow_value: fund.max_outflow_value / 100,
                                    max_outflow: `${self.backend_date(
                                        fund.max_outflow,
                                    )} (${fund.max_outflow_quarter / 4} years)`,
                                    break_even: fund.break_even
                                        ? `${self.backend_date(
                                              fund.break_even,
                                          )} (${fund.break_even_quarter / 4} years)`
                                        : undefined,
                                };
                            });
                        }

                        return [];
                    }),
                },
            },
            {
                id: 'remaining_value_trend',
                component: ReportComponentWrapper,
                template: 'tpl_report_component_wrapper_view',
                caption: {
                    text_body_provider: self.captions.remaining_value_trend,
                },
                widget_config: {
                    template: 'tpl_chart_box',
                    component: TimeseriesChart,
                    format: 'multiple',
                    shared_tooltip: true,
                    sticky_tooltip_on_click: true,
                    series: [
                        {
                            key: 'ranges',
                            name: 'Peer Range',
                            type: 'arearange',
                        },
                        {
                            key: 'median',
                            name: 'Peer Median',
                            type: 'line',
                        },
                        {
                            key: 'vehicle',
                            type: 'line',
                        },
                    ],
                    x_quarter_offset: true,
                    data: self.get_computed('remaining_value_trend'),
                },
            },
            {
                id: 'glossary_1',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Glossary,
                    glossary: [
                        {
                            title: 'Contribution',
                            desc:
                                'cash flow from the limited partners to the fund. In a cash flow spreadsheet, they should be negative amounts. (Paid-in capital = cumulative amount of capital that has been drawn down).',
                        },
                        {
                            title: 'Distribution',
                            desc: 'cash flow from the fund to the limited partners.',
                        },
                        {
                            title: 'DPI (Distributed to Paid In Capital)',
                            desc:
                                'also called the realization multiple; measures the amount that has been paid out to investors. Calculated by dividing cumulative distributions by paid in capital. This multiple tells investors how much money they have received, and is better for evaluating a fund later in its life when there are more distributions to measure against.',
                        },
                        {
                            title: 'Investment Period',
                            desc:
                                'the timespan during which a fund is allowed to make new investments (typically up to 5 years).',
                        },
                        {
                            title: 'IRR (Internal Rate of Return)',
                            desc:
                                'the discount rate which makes NPV (net present value) of a series of cash flows equal to zero. Can be used to gauge the percentage rate earned on each dollar invested for each period it is invested.',
                        },
                        {
                            title: 'J-curve',
                            desc:
                                "Can refer to IRR curve or cash flow curve. The IRR j-curve refers to the tendency of private equity funds to deliver negative returns in early years and investment gains in later years. When IRRs over time are graphed, the fund's IRR typically plot into a &quot;J&quot; shape. Similarly, the cash-flow j-curve (used in Bison's FBRs) plots cash flows over time. These typically also form a &quot;J&quot; shape, as cash flows are negative in a fund's early years as capital is drawn down, and then start curving upward as the fund starts making distributions.",
                        },
                        {
                            title: 'Maximum Outflow',
                            desc:
                                "the bottom point of a fund's cash flow j-curve (the most negative point in a fund's cash flow timeline).",
                        },
                        {
                            title: 'Momentum',
                            desc: 'percent change in TVPI over a specified time period.',
                        },
                    ],
                },
            },
            {
                id: 'glossary_2',
                template: 'tpl_report_component_wrapper_view',
                component: ReportComponentWrapper,
                widget_config: {
                    component: Glossary,
                    glossary: [
                        {
                            title: 'NAV (Net Asset Value)',
                            desc:
                                "often referred to as a fund's residual value; represents the value of all investments remaining in the portfolio. Individual companies are valued and then aggregated to compute the private equity fund value.",
                        },
                        {
                            title: 'Paid In Capital (PIC)',
                            desc:
                                'sum of capital contributions that have been made in a fund (cumulative amount of capital that has been drawn down).',
                        },
                        {
                            title: 'Paid In To Committed Capital (PICC)',
                            desc:
                                "measures how invested the fund is. Calculated by dividing paid in capital by committed capital. Can help investors measure a fund's investment pace and gauge GPs' ability to fully invest their fund. For many investors, PICC helps evaluate when a fund is coming back to market. High PICC means that the fund has invested most of its committed capital.",
                        },
                        {
                            title: 'PME (Public Market Equivalent)',
                            desc:
                                'methodology used to evaluate the performance of a private equity fund against a public benchmark or index (ex. S&P 500, Russell 3000).',
                        },
                        {
                            title: 'Quartiles',
                            desc:
                                'the three points that divide a ranked data set into four equal groups, each group comprising a quarter of the data.',
                        },
                        {
                            title: 'RVPI (Residual Value to Paid In Capital)',
                            desc:
                                "Measures remaining market value of the fund's capital that has not yet been realized. Calculated by dividing the residual value (or fair market value) by paid in capital.",
                        },
                        {
                            title: 'Time Weighted Return',
                            desc:
                                'Measures the compound rate of return on a portfolio over a stated period of time. Eliminates the effect of cash flow timing on returns.',
                        },
                        {
                            title: 'TVPI (Total Value to Paid In Multiple)',
                            desc:
                                "fund's investment multiple; measures the total value created by a fund. Can be calculated in two ways: (1) by dividing cumulative distributions + residual value by paid in capital or (2) by adding together DPI and RVPI. Since RVPI is incorporated, TVPI will fluctuate until the fund is fully realized.",
                        },
                        {
                            title: 'Vintage Year',
                            desc:
                                "year in which the fund's first cash flow occurs (i.e., first year in which the fund begins making investments).",
                        },
                    ],
                },
            },
        ],
    };

    self.viewer_body = {
        layout_engine: self.viewer_layout,
    };

    if (!self.body_only) {
        self.viewer_body.header = {
            component: BreadcrumbHeader,
            id: 'fund_header',
            template: 'tpl_breadcrumb_header',
            css: {'sub-page-header': true},
            layout: {
                breadcrumb: 'breadcrumb',
            },
            components: [
                {
                    id: 'breadcrumb',
                    component: Breadcrumb,
                    items: [
                        {
                            label: 'Historic Funds',
                            link: '#!/funds',
                        },
                        {
                            datasource: {
                                type: 'dynamic',
                                query: {
                                    target: 'market_data:fund',
                                    uid: {
                                        type: 'observer',
                                        event_type: self.events.fund_uid,
                                        required: true,
                                    },
                                },
                            },
                            link_format: 'market_entity_url',
                            label_key: 'name',
                        },
                        {
                            label: 'Side by Side FBR',
                        },
                    ],
                },
            ],
        };
        self.viewer_body.toolbar = {
            component: ActionHeader,
            id: 'action_toolbar',
            template: 'tpl_action_toolbar',
            valid_export_features: ['download_market_data'],
            buttons: [],
        };
    }

    self.viewer = self.new_instance(Viewer, {
        id: 'viewer',
        body: self.viewer_body,
        body_only: self.body_only,
    });

    self.add_dependency(self.datasource);
    self.add_dependency(self.viewer);

    self.callback_interval = undefined;

    self.clear_callback = function() {
        if (self.callback_interval) {
            clearInterval(self.callback_interval);
            self.callback_interval = undefined;
        }
    };

    self.callback_when_done = callback => {
        self.clear_callback();

        self.callback_interval = setInterval(() => {
            let data = self.datasource.data();
            let loading = self.loading();
            let error = self.error();
            if (!loading && !error && data) {
                self.clear_callback();

                setTimeout(callback, 200);
            }
        }, 500);
    };

    self.when(self.datasource, self.viewer).done(() => {
        self.viewer.restore_data(self.report(), false);

        self.report.subscribe(report => {
            self.viewer.restore_data(report, false);
        });

        Observer.register(self.events.fund_uid, self.fund_uid);
        Observer.register(self.events.user_fund_uid, self.user_fund_uid);

        self.register_export_id = Utils.gen_id(
            self.viewer.get_id(),
            'body',
            'action_toolbar',
            'export_actions',
        );

        self.download_pdf_event = Utils.gen_event('FundReportViewer.download_pdf', self.get_id());

        Observer.broadcast_for_id(
            self.register_export_id,
            'DynamicActions.register_action',
            {
                title: 'Current Page',
                subtitle: 'PDF',
                event_type: self.download_pdf_event,
            },
            true,
        );

        self._prepare_side_by_side_fbr_pdf = DataThing.backends.download({
            url: 'prepare_side_by_side_fbr_pdf',
        });

        Observer.register(self.download_pdf_event, () => {
            let html_id = Utils.html_id(Utils.gen_id(self.viewer.get_id(), 'body', 'layout'));

            self._prepare_side_by_side_fbr_pdf({
                data: {
                    user_fund_uid: self.user_fund_uid(),
                    comparison_user_fund_uid: self.fund_uid(),
                    html: $(`#${html_id}`).html(),
                    width: $(`#${html_id}`).width(),
                    height: $(`#${html_id}`).height(),
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_pdf_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        self.dfd.resolve();
    });

    return self;
}
