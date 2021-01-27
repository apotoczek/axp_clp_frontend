/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import SimpleTable from 'src/libs/components/SimpleTable';
import MetricTable from 'src/libs/components/MetricTable';
import DataSource from 'src/libs/DataSource';
import BarChart from 'src/libs/components/charts/BarChart';
import AdvancedBarChart from 'src/libs/components/charts/AdvancedBarChart';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.template = opts.template || 'tpl_investor_modeling';

    self.investor_uid_event = opts.investor_uid_event;
    self.user_fund_uid_event = opts.user_fund_uid_event;

    self.datasource = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                investor_uid: {
                    type: 'observer',
                    event_type: self.investor_uid_event,
                    required: true,
                },
                user_fund_uid: {
                    type: 'observer',
                    event_type: self.user_fund_uid_event,
                    required: true,
                },
                target: 'vehicle:investor_modeling',
            },
        },
    });

    self.recent_performance_is_market_average = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.recent && data.recent.market) {
            return true;
        }

        return false;
    });

    self.created_date = ko.pureComputed(() => {
        return Date.create().format('{Month} {yyyy}');
    });

    self.as_of_date = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data) {
            return Formatters.backend_date_quarterly(data.meta.as_of_date);
        }
    });

    self.comp_count = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.alpha_driver) {
            return data.alpha_driver.count;
        }
    });

    self.comp_count_with_performance = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.alpha_driver) {
            return data.alpha_driver.count_with_performance;
        }
    });

    self.alpha_driver_vintage_range = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.alpha_driver) {
            return data.alpha_driver.vintage_range;
        }
    });

    self.recent_vintage_range_text = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            let range = data.recent.vintage_range;

            if (range) {
                if (range.includes('-')) {
                    return `${range} vintage years`;
                }
                return `${range} vintage year`;
            }
        }
    });

    self.info_table = self.new_instance(MetricTable, {
        id: 'information_table',
        dependencies: [self.datasource.get_id()],
        css: {
            'table-light': true,
            'multi-line-data': true,
            'metric-table': true,
            'metric-table-sm': true,
        },
        template: 'tpl_investor_model_characteristics_table',
        columns: 2,
        metrics: [
            {
                label: 'Geography',
                value_key: 'geography',
                format: 'strings',
                format_args: {
                    len: 5,
                },
            },
            {
                label: 'Style / Focus',
                value_key: 'style',
                format: 'strings',
                format_args: {
                    len: 5,
                },
            },
            {
                label: 'Sector',
                value_key: 'sector',
                format: 'strings',
                format_args: {
                    len: 5,
                },
            },
            {
                label: 'Vintage Years',
                value_key: 'vintage_years',
            },
            {
                label: 'Commitment Sizes',
                value_key: 'commitment_sizes',
            },
            {
                label: 'Fund Sizes',
                value_key: 'fund_sizes',
            },
            {
                label: 'Location',
                value_key: 'location',
            },
            {
                label: 'Website',
                value_key: 'website',
                format: 'external_link',
                format_args: {
                    truncate_length: 40,
                },
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data) {
                return {
                    location: data.investor.location,
                    website: data.investor.website,
                    fund_sizes: data.all_time.fund_size_range,
                    commitment_sizes: data.all_time.commitment_range,
                    vintage_years: data.all_time.vintage_range,
                    geography: data.meta.investor_characteristics.geography,
                    style: data.meta.investor_characteristics.style,
                    sector: data.meta.investor_characteristics.sector,
                };
            }
        }),
    });

    self.market_alpha_driver_metric = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.alpha_driver.market_alpha_percent) {
            return Formatters.percent(Math.abs(data.alpha_driver.market_alpha_percent));
        }

        return 'N/A';
    });

    self.market_alpha_driver_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.alpha_driver.market_alpha_percent) {
            if (data.alpha_driver.market_alpha_percent < 0) {
                return 'lower';
            }
            return 'higher';
        }
    });

    self.alpha_driver_metric = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.alpha_driver.alpha_percent) {
            return Formatters.percent(data.alpha_driver.alpha_percent);
        }

        return 'N/A';
    });

    self.alpha_driver_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.alpha_driver.alpha_percent) {
            if (data.alpha_driver.alpha_percent > 0) {
                return 'have been additive';
            }
            return 'not have been additive';
        }
    });

    self.alpha_driver_change_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.alpha_driver.alpha_percent) {
            if (data.alpha_driver.alpha_percent > 0) {
                return 'increased';
            }
            return 'decreased';
        }
    });

    self.fund_name = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta) {
            return data.meta.fund_name;
        }

        return '';
    });

    self.fund_name_possesive = ko.pureComputed(() => {
        let fund_name = self.fund_name();

        if (fund_name.toLowerCase().endsWith('s')) {
            return `${fund_name}'`;
        }
        return `${fund_name}'s`;
    });

    self.vintage_year = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta) {
            return data.meta.vintage_year;
        }
    });

    self.geography = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta.geography) {
            return data.meta.geography;
        }

        return '';
    });

    self.style = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta.style) {
            return data.meta.style;
        }

        return '';
    });

    self.fund_size = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta) {
            return Formatters.money(data.meta.commitment, false, {
                render_currency: data.meta.render_currency,
            });
        }
    });

    self.investor_name = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.meta && data.meta.investor_name) {
            return data.meta.investor_name;
        }

        return '';
    });

    self.investor_name_possesive = ko.pureComputed(() => {
        let investor_name = self.investor_name();

        if (investor_name.toLowerCase().endsWith('s')) {
            return `${investor_name}'`;
        }
        return `${investor_name}'s`;
    });

    self.first_commitment_year = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.all_time.min_vintage;
        }
    });

    self.recent_commitment_count = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.recent.commitment_count;
        }
    });

    self.recent_commitment_sum = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.recent && data.recent.commitment_value) {
            return Formatters.money(data.recent.commitment_value, false, {render_currency: 'USD'});
        }
    });

    self.recent_commitment_mean = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.recent && data.recent.commitment) {
            return Formatters.money(data.recent.commitment.mean, false, {render_currency: 'USD'});
        }
    });

    self.all_time_manager_count = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.all_time.manager_count;
        }
    });

    self.recent_manager_count = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.recent.manager_count;
        }
    });

    self.recent_commitment_count_max = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent && data.recent.by_vintage_ranges) {
            return data.recent.by_vintage_ranges.count.max;
        }
    });

    self.recent_commitment_count_min = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent && data.recent.by_vintage_ranges) {
            return data.recent.by_vintage_ranges.count.min;
        }
    });

    self.characteristics = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.meta) {
            return data.meta.characteristics;
        }
    });

    self.has_commitment_values = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            return data.recent.has_commitment_values;
        }
    });

    self.platform_name = config.lang.legal_text_platform_name;

    self.recent_commitments_table = self.new_instance(SimpleTable, {
        id: 'recent_commitment_values_table',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                key: 'label',
                cell_css: 'table-lbl',
            },
            {
                key: 'commitment',
                label: 'Commitment',
                format: 'money',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'fund_size',
                label: 'Fund Size',
                format: 'money',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data && data.recent) {
                let commitment = data.recent.commitment || {};
                let fund_size = data.recent.fund_size || {};
                return [
                    {
                        label: 'Max',
                        commitment: commitment.max,
                        fund_size: fund_size.max,
                    },
                    {
                        label: 'Mean',
                        commitment: commitment.mean,
                        fund_size: fund_size.mean,
                    },
                    {
                        label: 'Median',
                        commitment: commitment.median,
                        fund_size: fund_size.median,
                    },
                    {
                        label: 'Min',
                        commitment: commitment.min,
                        fund_size: fund_size.min,
                    },
                    {
                        label: 'Count',
                        formats: {
                            commitment: 'number',
                            fund_size: 'number',
                        },
                        commitment: commitment.count,
                        fund_size: fund_size.count,
                    },
                ];
            }
        }),
    });

    self.recent_investments_table = self.new_instance(SimpleTable, {
        id: 'recent_investments_table',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                key: 'label',
                cell_css: 'table-lbl',
            },
            {
                key: 'fund_size',
                label: 'Fund Size',
                format: 'money',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data && data.recent) {
                let fund_size = data.recent.fund_size || {};
                return [
                    {
                        label: 'Max',
                        fund_size: fund_size.max,
                    },
                    {
                        label: 'Mean',
                        fund_size: fund_size.mean,
                    },
                    {
                        label: 'Median',
                        fund_size: fund_size.median,
                    },
                    {
                        label: 'Min',
                        fund_size: fund_size.min,
                    },
                    {
                        label: 'Count',
                        formats: {
                            fund_size: 'number',
                        },
                        fund_size: fund_size.count,
                    },
                ];
            }
        }),
    });

    self.recent_performance = self.new_instance(SimpleTable, {
        id: 'recent_performance',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                key: 'label',
                cell_css: 'table-lbl',
            },
            {
                key: 'irr',
                label: 'IRR',
                format: 'irr',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'dpi',
                label: 'DPI',
                format: 'multiple',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'tvpi',
                label: 'TVPI',
                format: 'multiple',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data && data.recent) {
                let irr, tvpi, dpi;

                if (data.recent.market) {
                    irr = data.recent.market.irr || {};
                    dpi = data.recent.market.dpi || {};
                    tvpi = data.recent.market.tvpi || {};
                } else {
                    irr = data.recent.irr || {};
                    dpi = data.recent.dpi || {};
                    tvpi = data.recent.tvpi || {};
                }

                return [
                    {
                        label: 'Max',
                        irr: irr.max,
                        dpi: dpi.max,
                        tvpi: tvpi.max,
                    },
                    {
                        label: 'Mean',
                        irr: irr.mean,
                        dpi: dpi.mean,
                        tvpi: tvpi.mean,
                    },
                    {
                        label: 'Median',
                        irr: irr.median,
                        dpi: dpi.median,
                        tvpi: tvpi.median,
                    },
                    {
                        label: 'Min',
                        irr: irr.min,
                        dpi: dpi.min,
                        tvpi: tvpi.min,
                    },
                    {
                        label: 'Count',
                        formats: {
                            irr: 'number',
                            dpi: 'number',
                            tvpi: 'number',
                        },
                        irr: irr.count,
                        dpi: dpi.count,
                        tvpi: tvpi.count,
                    },
                ];
            }
        }),
    });

    self.recent_commitments_chart = self.new_instance(AdvancedBarChart, {
        id: 'recent_commitments_chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart',
        label: ko.pureComputed(() => {
            return 'Commitments by Vintage';
        }),
        sublabel: ko.pureComputed(() => {
            return self.characteristics();
        }),
        label_in_chart: true,
        height: 275,
        shared_tooltip: true,
        series: [
            {
                name: 'Count',
                key: 'count',
                color: 'fifth',
            },
            {
                name: 'Commitment',
                key: 'commitment',
                y_axis: 1,
                color: 'first',
            },
        ],
        y_axes: [
            {
                format: 'number',
                allow_decimals: false,
                tick_interval: 1,
                min: 0,
            },
            {
                format: 'usd',
                min: 0,
                opposite: true,
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return data.recent.by_vintage;
            }
        }),
        // redraw animations cause issues with yAxix during pdf generation
        redraw_animations: false,
    });

    self.recent_investments_chart = self.new_instance(BarChart, {
        id: 'recent_investments_chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart',
        label: ko.pureComputed(() => {
            return 'Investments by Vintage';
        }),
        sublabel: ko.pureComputed(() => {
            return self.characteristics();
        }),
        label_in_chart: true,
        y_min: 0,
        vertical_bars: true,
        height: 250,
        tick_interval: 1,
        format: 'number',
        allow_decimals: false,
        colors: ['first'],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                let comps = [];

                for (let [key, stats] of Object.entries(data.recent.by_vintage)) {
                    comps.push({
                        label: key,
                        value: stats.count,
                    });
                }

                return comps;
            }
        }),
    });

    self.new_manager_count = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            return data.recent.new_manager_count;
        }
    });

    self.new_manager_ratio = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data) {
            return Formatters.percent(data.recent.new_manager_ratio);
        }
    });

    self.new_managers = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            return data.recent.new_managers;
        }
    });

    self.retention_ratio = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data) {
            return Formatters.percent(data.recent.retention_ratio);
        }
    });

    self.lost_manager_count = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            return data.recent.lost_managers.length;
        }
    });

    self.lost_managers = ko.pureComputed(() => {
        let data = self.datasource.data();
        if (data && data.recent) {
            return data.recent.lost_managers;
        }
    });

    let score_text = function(median, target) {
        if (target > median) {
            return 'above';
        } else if (target < median) {
            return 'below';
        }
        return 'in line with';
    };

    self.lp_scoring_table = self.new_instance(SimpleTable, {
        id: 'lp_scoring_table',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                key: 'label',
                cell_css: 'table-lbl',
            },
            {
                key: 'fund_size',
                label: 'Fund Size Rating',
                format: 'multiple',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'risk',
                label: 'Risk Rating',
                format: 'percent',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data && data.lp_scoring) {
                return [
                    {
                        label: data.meta.investor_name,
                        fund_size: data.lp_scoring.selected.x,
                        risk: data.lp_scoring.selected.y,
                    },
                    {
                        label: 'Median',
                        fund_size: data.lp_scoring.medians.x,
                        risk: data.lp_scoring.medians.y,
                    },
                ];
            }
        }),
    });

    self.lp_scoring_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.lp_scoring) {
            let selected = data.lp_scoring.selected;
            let m = data.lp_scoring.medians;

            if (m.x < selected.x && m.y < selected.y) {
                return 'risk rating and fund size scores are above the median';
            } else if (m.x > selected.x && m.y > selected.y) {
                return 'risk rating and fund size scores are below the median';
            } else if (m.x == selected.x && m.y == selected.y) {
                return 'risk rating and fund size scores are in line with the median';
            }
            let risk_text = score_text(m.y, selected.y);
            let fund_size_text = score_text(m.x, selected.x);

            return `risk rating is ${risk_text} the median while the fund size score is ${fund_size_text} the median`;
        }
    });

    self.lp_scoring_risk_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.lp_scoring) {
            let selected = data.lp_scoring.selected;
            let m = data.lp_scoring.medians;

            if (m.y < selected.y) {
                return 'higher';
            }
            return 'smaller';
        }
    });

    self.lp_scoring_fund_size_text = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data && data.lp_scoring) {
            let selected = data.lp_scoring.selected;
            let m = data.lp_scoring.medians;

            if (m.x < selected.x) {
                return 'larger';
            }
            return 'smaller';
        }
    });

    // self.lp_scoring = self.new_instance(BubbleChart, {
    //     // label: 'Risk Rating / Fund Size Score',
    //     dependencies: [self.datasource.get_id()],
    //     // label_in_chart: true,
    //     exporting: false,
    //     height: 600,
    //     data: ko.pureComputed(function() {
    //         let data = self.datasource.data();

    //         if(data) {
    //             return data.lp_scoring.metrics;
    //         }
    //     }),
    //     x_format: 'multiple',
    //     x_label: 'Fund Size Score',
    //     y_format: 'percent',
    //     y_label: 'Risk Rating',
    //     z_label: 'Count',
    //     z_format: 'number',
    // });

    self.alpha_driver_chart = self.new_instance(BarChart, {
        id: 'alpha_driver_chart',
        dependencies: [self.datasource.get_id()],
        template: 'tpl_chart',
        vertical_bars: true,
        format: 'multiple',
        value_key: 'tvpi',
        label_key: 'label',
        data: ko.pureComputed(() => {
            let data = self.datasource.data();
            if (data) {
                return [
                    {
                        label: `${data.alpha_driver.vintage_range} Market Average`,
                        tvpi: data.alpha_driver.tvpi_market_average,
                        color: 'fifth',
                    },
                    {
                        label: data.meta.fund_name,
                        tvpi: data.alpha_driver.vehicle_tvpi,
                        color: '#909DA2',
                    },
                    {
                        label: `${data.meta.investor_name} Portfolio`,
                        tvpi: data.alpha_driver.tvpi_without_vehicle,
                        color: '#3C7DC9',
                    },
                    {
                        label: `${data.meta.investor_name} Portfolio w/ ${data.meta.fund_name}`,
                        tvpi: data.alpha_driver.tvpi_with_vehicle,
                        color: '#3C7DC9',
                    },
                ];
            }
        }),
    });

    self.alpha_driver_table = self.new_instance(SimpleTable, {
        id: 'alpha_driver_table',
        dependencies: [self.datasource.get_id()],
        css: {
            'table-bison': true,
            'metric-table': true,
            'table-light': true,
            'metric-table-condensed': true,
        },
        highlight_key: 'target',
        columns: [
            {
                label: 'Fund',
                key: 'name',
                cell_css: 'table-lbl',
            },
            {
                key: 'vintage_year',
                label: 'Vintage',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'tvpi',
                label: 'TVPI',
                format: 'multiple',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'dpi',
                label: 'DPI',
                format: 'multiple',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'irr',
                label: 'IRR',
                format: 'irr',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data) {
                return data.alpha_driver.comps;
            }
        }),
    });

    self.core_relationships_data = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.core_relationships;
        }
    });

    self.core_relationships_commitment = self.new_instance(SimpleTable, {
        id: 'core_relationships',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                label: 'Firm',
                key: 'name',
                cell_css: 'table-lbl',
            },
            {
                key: 'commitment',
                label: 'Total Commitment',
                format: 'money',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'count',
                label: '# of commitments',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'last_vintage',
                label: 'Last Vintage',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: self.core_relationships_data,
    });

    self.core_relationships_no_commitment = self.new_instance(SimpleTable, {
        id: 'core_relationships',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                label: 'Firm',
                key: 'name',
                cell_css: 'table-lbl',
            },
            {
                key: 'count',
                label: '# of commitments',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
            {
                key: 'last_vintage',
                label: 'Last Vintage',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: self.core_relationships_data,
    });

    self.core_relationships = ko.pureComputed(() => {
        if (self.has_commitment_values()) {
            return self.core_relationships_commitment;
        }
        return self.core_relationships_no_commitment;
    });

    self.has_forward_calendar = ko.pureComputed(() => {
        let data = self.datasource.data();

        if (data) {
            return data.projected_funds.length > 0;
        }

        return false;
    });

    self.forward_calendar = self.new_instance(SimpleTable, {
        id: 'forward_calendar',
        dependencies: [self.datasource.get_id()],
        columns: [
            {
                label: 'Projected Fund',
                key: 'name',
                cell_css: 'table-lbl',
            },
            {
                key: 'target_size_usd',
                label: 'Projected Size',
                format: 'money',
                css: 'numeric',
                cell_css: 'numeric table-data',
            },
        ],
        data: ko.pureComputed(() => {
            let data = self.datasource.data();

            if (data) {
                return data.projected_funds;
            }
        }),
    });

    self.add_dependency(self.datasource);

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
            let loading = self.datasource.loading();
            let error = self.datasource.error();
            if (!loading && !error && data) {
                self.clear_callback();

                setTimeout(callback, 200);
            }
        }, 500);
    };

    self.when(
        self.info_table,
        self.recent_investments_table,
        self.recent_investments_chart,
        self.recent_commitments_table,
        self.recent_commitments_chart,
        //self.lp_scoring,
        self.lp_scoring_table,
        self.alpha_driver_chart,
        self.forward_calendar,
        self.datasource,
    ).done(() => {
        self.dfd.resolve();

        // Observer.register(self.investor_uid_event, self.investor_uid);
    });

    return self;
}
