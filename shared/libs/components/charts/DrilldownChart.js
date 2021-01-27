/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DrilldownChart from 'src/libs/components/charts/DrilldownChart';
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';
import Highcharts from 'highcharts';

let _component = function(opts, components) {
    let self = new BaseChart(opts, components);

    let _dfd = self.new_deferred();

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.grouping_value_key = opts.grouping_value_key || 'breakdown_key';
    self.grouping_label_key = opts.grouping_label_key || 'label';

    self.grouping_value = ko.observable();
    self.grouping_label = ko.observable();

    self.margin = opts.margin || false;

    self.chart_title = ko.pureComputed(() => {
        return `Funds Grouped by ${self.grouping_label()}`;
    });

    self.chart_subtitle = ko.pureComputed(() => {
        return self.grouping_value() != 'vintage_year' ? 'click on a column to view breakdown' : '';
    });

    Observer.register(opts.grouping_event, grouping => {
        self.grouping_label(Utils.get(grouping, 'label'));
        self.grouping_value(Utils.get(grouping, 'value'));
    });

    if (opts.truncate_label_length === undefined) {
        self.truncate_label_length = 30;
    } else {
        self.truncate_label_length = opts.truncate_label_length;
    }

    self.series_colors = [self.get_color('first'), self.get_color('eighth')];

    self.series = ko.pureComputed(() => {
        let data = self.data();
        if (data) {
            let series = [];

            for (let i = 0, l = data.length; i < l; i++) {
                let series_data = [];

                for (let j = 0, k = data[i].data.length; j < k; j++) {
                    series_data.push({
                        name: Utils.unescape_html(data[i].data[j][0]),
                        y: data[i].data[j][1],
                        drilldown: !!data[i].drilldowns,
                    });
                }

                series.push({
                    name: Utils.unescape_html(data[i].label),
                    type: 'column',
                    data: series_data,
                    yAxis: i,
                    categories: series_data.map(s => Utils.unescape_html(s.name)),
                    color: self.series_colors[i],
                    formatter: Formatters.gen_formatter(data[i].format),
                });
            }

            return series;
        }
        return [];
    });

    self.drilldowns = ko.computed(() => {
        let data = self.data();
        if (data) {
            let drilldowns = {};

            for (let i = 0, l = data.length; i < l; i++) {
                drilldowns[data[i].label] = data[i].drilldowns;
            }

            return drilldowns;
        }
    });

    self.options = Utils.deep_merge(self.options, {
        chart: {
            events: {
                drilldown: function(evt) {
                    let chart = this;
                    let drilldowns = self.drilldowns();

                    let series_opts = evt.point.series.options;

                    let drilldown_name = `${evt.point.series.name} / ${evt.point.name}`;

                    let drilldown_series = {
                        name: drilldown_name,
                        data: drilldowns[evt.point.series.name][evt.point.name],
                        yAxis: series_opts.yAxis,
                        formatter: series_opts.formatter,
                    };

                    chart.addSeriesAsDrilldown(evt.point, drilldown_series);
                },
            },
        },
        xAxis: {
            categories_from_data: true,
            labels: {
                formatter: function() {
                    if (self.truncate_label_length) {
                        return String(this.value).truncate(self.truncate_label_length, 'middle');
                    }
                    return this.value;
                },
            },
        },
        yAxis: [
            {
                showEmpty: false,
                labels: {
                    formatter: function() {
                        return this.axis.series[0].options.formatter(this.value);
                    },
                },
                title: {
                    text: 'Number of Funds',
                },
            },
            {
                showEmpty: false,
                labels: {
                    formatter: function() {
                        return this.axis.series[0].options.formatter(this.value);
                    },
                },
                title: {
                    text: 'Amount Raised',
                },
                opposite: true,
            },
        ],
        tooltip: {
            formatter: function() {
                return `<span style="font-size:10px;">${this.key}</span><br><strong>${
                    this.series.name
                }</strong>: ${this.series.options.formatter(this.y)}`;
            },
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 80,
            verticalAlign: 'top',
            y: 0,
            floating: true,
            backgroundColor:
                (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
        },
        drilldown: {
            activeAxisLabelStyle: {
                color: '#333',
            },
            drillUpButton: {
                position: {
                    x: -30,
                    y: 5,
                },
                relativeTo: 'spacingBox',
            },
        },
    });

    _dfd.resolve();

    return self;
};

_component.config = {
    id: '',
    component: DrilldownChart,
    template: 'tpl_chart_box',
    label: '',
    format: '',
    exporting: false,
    credits: false,
    value_key: '',
    label_key: 'name',
    compset: {
        comps: [
            {
                mapping: 'vehicle_to_market_data',
                color: '#4D4D4D',
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: '',
                        as_of_date: '',
                        fund_idx: '',
                        user_fund_uid: '',
                    },
                },
            },
        ],
        datasource: {
            type: 'dynamic',
            key: '',
            query: {
                target: '',
                filters: {
                    as_of_date: '',
                    vintage_year: '',
                    geography: '',
                    style: '',
                },
            },
        },
    },
};

export default _component;
