/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataSource from 'src/libs/DataSource';
import MetricTable from 'src/libs/components/MetricTable';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.__class__ = 'ReportMeta';

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_report_meta';

    self.report = opts.report;

    self.report_title = opts.report_title || 'Fund Benchmark Report';
    self.include_meta = opts.include_meta === undefined ? true : opts.include_meta;
    self.include_logo = opts.include_logo === undefined ? true : opts.include_logo;

    self._legal_html = opts.legal_html || false;

    self.data_map = opts.data_map;
    self.market_type = opts.market_type || 'net';
    self.description = opts.description;
    self.metric_table = undefined;
    self.logo = undefined;
    self.title = undefined;

    self.datasources = {};

    if (opts.datasources) {
        for (let [key, datasource] of Object.entries(opts.datasources)) {
            self.datasources[key] = self.new_instance(DataSource, {
                datasource: datasource,
            });
        }

        self.data = ko.pureComputed(() => {
            let data = {};

            if (opts.data && Object.isObject(opts.data)) {
                for (let [key, value] of Object.entries(opts.data)) {
                    data[key] = value();
                }
            }

            for (let [key, datasource] of Object.entries(self.datasources)) {
                data[key] = datasource.data();
            }
            return data;
        });
    }

    if (opts.logo_id) {
        self.logo = self.components[opts.logo_id];
    }

    if (opts.title_id) {
        self.title = self.components[opts.title_id];
    }

    if (opts.metric_table) {
        self.metric_table = self.new_instance(MetricTable, {
            data: ko.pureComputed(() => {
                let data = self.data();
                if (data && opts.metric_table.data_key) {
                    return data[opts.metric_table.data_key];
                }
            }),
            template: 'tpl_metric_table_multi_col',
            metrics: [
                {
                    label: 'Name',
                    value_key: 'name',
                },
                {
                    label: 'Type',
                    value_key: 'entity_type',
                    format: 'entity_type',
                },
                {
                    label: 'Cashflow Type',
                    value: self.market_type,
                    format: 'titleize',
                    visible: function(data) {
                        return (
                            data &&
                            (data.entity_type === 'market_data_fund' ||
                                data.entity_type === 'market_data_family')
                        );
                    },
                },
                {
                    label: 'Cashflow Type',
                    value_key: 'cashflow_type',
                    format: 'titleize',
                    visible: function(data) {
                        return (
                            data &&
                            data.entity_type !== 'market_data_fund' &&
                            data.entity_type !== 'market_data_family'
                        );
                    },
                },
                {
                    label: 'Vintage Year',
                    value_key: 'vintage_year',
                },
                {
                    label: 'Base Currency',
                    value_key: 'base_currency',
                },
                {
                    label: '# Funds',
                    value_key: 'vehicle_count',
                    format: 'number',
                    visible: function(data) {
                        return (
                            data &&
                            (data.entity_type === 'portfolio' ||
                                data.entity_type === 'market_data_family')
                        );
                    },
                },
                {
                    label: '# Companies',
                    value_key: 'vehicle_count',
                    format: 'number',
                    visible: function(data) {
                        return (
                            data &&
                            (data.entity_type === 'user_fund' ||
                                data.entity_type === 'market_data_fund') &&
                            data.cashflow_type === 'gross'
                        );
                    },
                },
                {
                    label: 'Source Investor',
                    value_key: 'investor_name',
                    visible: function(data) {
                        return data && data.entity_type === 'bison_fund';
                    },
                },
                {
                    label: 'Geography',
                    value_key: 'attributes:geography',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Style / Focus',
                    value_key: 'attributes:style',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Sector',
                    value_key: 'attributes:sector',
                    format: 'weighted_strings',
                    format_args: {
                        len: 1,
                    },
                },
                {
                    label: 'Shared By',
                    value_key: 'shared_by',
                    format: 'strings',
                    format_args: {
                        len: 1,
                    },
                    visible: function(data) {
                        return (
                            data &&
                            data.entity_type !== 'market_data_fund' &&
                            data.entity_type !== 'market_data_family'
                        );
                    },
                },
                {
                    label: 'Permissions',
                    value_key: 'permissions',
                    format: 'strings_full',
                },
            ],
            columns: 2,
            css: {'table-light': true, 'table-sm': true},
        });
    }

    self.mapped_data = ko.pureComputed(() => {
        let data = self.data();

        if (data && self.data_map) {
            let mapped = {};

            for (let [key, item] of Object.entries(self.data_map)) {
                let item_data;

                if (item.key) {
                    item_data = Utils.extract_data(item.key, data);
                } else {
                    item_data = data;
                }

                if (item.format) {
                    let formatter = Formatters.gen_formatter(item);
                    mapped[key] = formatter(item_data);
                } else {
                    mapped[key] = item_data;
                }
            }

            return mapped;
        }

        return false;
    });

    self.report_name = ko.pureComputed(() => {
        let report = self.report();

        if (report) {
            return report.name;
        }
    });

    self.created_date = ko.pureComputed(() => {
        let report = self.report();

        let formatter = Formatters.gen_date_formatter('{Month} {yyyy}', 0, 1000);

        if (report) {
            return formatter(report.modified || report.created);
        }
    });

    self.legal_html = ko.pureComputed(() => {
        if (self._legal_html) {
            return ko.unwrap(self._legal_html);
        }

        let platform_name = config.lang.legal_text_platform_name;

        return `
                <p>All platform-provided information contained within this report has been gathered from sources believed to be reliable, including but not limited to public filings, lead sponsor fund financials, limited partner performance reports, and third party market data sources, but its accuracy cannot be guaranteed. The information contained in this report may include forward-looking statements regarding the portfolio, fund sponsor, or company presented. Forward-looking statements include a number of risks, uncertainties and other factors beyond the control of the sponsor or the target company, which may result in material differences in actual results, performance or other expectations. Any opinions, estimates and analyses reflect our or the lead sponsor’s current judgment, which may change in the future.</p>

                <p>The past performance information contained in this report is not necessarily indicative of future results. The actual realized value of currently unrealized investments will depend on a variety of factors, including future operating results, the value of the assets and market conditions at the time of disposition, any related transaction costs and the timing and manner of sale, all of which may differ from the assumptions and circumstances on which any current unrealized valuations are based.</p>

                <p>Any tables, graphs or charts relating to past performance included in this report are intended only to illustrate the performance of the lead sponsor, fund, company, or the investment opportunity referred to for the historical periods shown. Such tables, graphs and charts are not intended to predict future performance and should not be used as the basis for an investment decision.</p>

                <p>The calculations contained in this document are generated by the ${platform_name} platform based on information provided by the user (e.g. cash flows and valuations), and have not been prepared, reviewed or approved by any other party.</p>

                <p>The information herein is not intended to provide, and should not be relied upon for, accounting, legal or tax advice, or investment recommendations. You should consult your accounting, legal, tax or other advisors about the matters discussed herein.</p>
            `;
    });

    self.when(self.datasources).done(() => {
        _dfd.resolve();
    });

    return self;
}
