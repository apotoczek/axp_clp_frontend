/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import {html} from 'common-tags';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.default_metric = opts.default_metric || 'irr';

    self.metric = ko.observable(self.default_metric);

    self.metric_event = opts.metric_event;

    self.chart_click_callback = opts.chart_click_callback || function() {};

    self.hide_empty = opts.hide_empty || false;

    if (self.metric_event) {
        Observer.register(self.metric_event, metric => {
            self.metric(Utils.get(metric, 'value') || self.default_metric);
        });
    }

    self.formatter = value => {
        let _formatter = Formatters.deal_benchmark_metric_formatter(self.metric());
        return _formatter(value);
    };

    self.format_color = is_from_list => {
        if (is_from_list == true) {
            return self.get_color('second');
        }
        return self.get_color('fifth');
    };

    self.format_marker = is_from_list => {
        if (is_from_list == true) {
            return {
                radius: 6,
                symbol: 'diamond',
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)',
                    },
                },
            };
        }
        return {
            radius: 3,
            symbol: 'circle',
            states: {
                hover: {
                    enabled: true,
                    lineColor: 'rgb(100,100,100)',
                },
            },
        };
    };

    self.series = ko.pureComputed(() => {
        let data = self.data();
        let metric = self.metric();

        if (data && metric && data.metrics && data.metrics[metric]) {
            let metric_data = data.metrics[metric];
            let categories = [];
            let series_data = [];

            for (let i = 0, l = metric_data.length; i < l; i++) {
                if (metric_data[i] && metric_data[i].length > 0) {
                    series_data.push(metric_data[i]);
                    categories.push(Utils.unescape_html(data.labels[i]));
                } else {
                    if (!self.hide_empty) {
                        series_data.push([0, 0, 0, 0, 0]);
                        categories.push(Utils.unescape_html(data.labels[i]));
                    }
                }
            }

            // Vendela chart series by default
            let all_series = [
                {
                    data: series_data,
                    enableMouseTracking: true,
                    categories: categories,
                },
            ];

            // Dotted chart series
            if (data.comp_funds) {
                all_series.push({
                    type: 'scatter',
                    name: data.comp_funds['name'],
                    data: data.comp_funds[metric].map(perf => {
                        return {
                            x: perf.x,
                            y: perf.y,
                            name: perf.name,
                            metric: metric,
                            color: self.format_color(perf.from_list),
                            marker: self.format_marker(perf.from_list),
                        };
                    }),
                    enableMouseTracking: true,
                });
            }

            return all_series;
        }
        return [];
    });

    self.options = Utils.deep_merge(self.options, {
        chart: {
            borderWidth: opts.borderWidth || 0,
            borderColor: opts.borderColor || '#efefef',
            spacing: opts.borderWidth ? [20, 10, 35, 10] : [10, 10, 25, 10],
            zoomType: 'xy',
            type: 'vendela',
        },
        plotOptions: {
            vendela: {
                allowPointSelect: true,
                firstColor: self.get_color('eighth'),
                secondColor: '#404040',
                thirdColor: self.get_color('first'),
                fourthColor: '#A6A6A6',
                maxPointWidth: 20,
                cursor: 'pointer',
                point: {
                    events: {
                        click: function() {
                            self.chart_click_callback(this.category);
                        },
                    },
                },
            },
            scatter: {
                color: self.get_color('fifth'),
                marker: {
                    radius: 3,
                    symbol: 'circle',
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)',
                        },
                    },
                },
                jitter: {
                    x: 0.24,
                },
            },
        },
        tooltip: {
            formatter: function() {
                let style = 'font-size:11px;';
                let bold_style = 'font-weight:bold; font-size:11px;';

                // Optional formats for scatter or benchmark
                return this.point.high
                    ? html`
                          <strong>${this.key}</strong><br />
                          <span style="${style}">Upper Fence:</span>
                          <span style="${bold_style}">${self.formatter(this.point.high)}</span
                          ><br />
                          <span style="${style}">Q1:</span>
                          <span style="${bold_style}">${self.formatter(this.point.q3)}</span><br />
                          <span style="${style}">Q2:</span>
                          <span style="${bold_style}">${self.formatter(this.point.median)}</span
                          ><br />
                          <span style="${style}">Q3:</span>
                          <span style="${bold_style}">${self.formatter(this.point.q1)}</span><br />
                          <span style="${style}">Lower Fence:</span>
                          <span style="${bold_style}">${self.formatter(this.point.low)}</span><br />
                      `
                    : html`
                          <b>${this.point.name}</b><br />${this.point.metric}:
                          ${self.formatter(this.point.y)}
                      `;
            },
            enabled: true,
        },
        xAxis: {
            categories_from_data: true,
        },
        yAxis: {
            title: {
                text: undefined,
            },
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
        },
    });

    console.log(self);

    return self;
}
