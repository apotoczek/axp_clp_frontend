/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);
    self.x_formatter = opts.x_formatter ? Formatters.gen_formatter(opts.x_formatter) : undefined;

    self.group_key = opts.group_key || 'groups';
    self.metric_key = opts.metric_key || 'metrics';

    self.x_categories = ko.pureComputed(() => {
        let data = self.data();

        if (data && data[self.group_key]) {
            return data[self.group_key];
        }

        return [];
    });

    self.series = ko.pureComputed(() => {
        let data = self.data();

        if (data && data[self.group_key]) {
            let all_series = [];
            let groups = data[self.group_key];
            let metrics = data[self.metric_key];

            for (let i = 0, l = metrics.length; i < l; i++) {
                let series = {
                    name: Utils.unescape_html(metrics[i].name),
                    data: [],
                    type: metrics[i].type || 'bar',
                    color: self.get_color_from_int(i),
                };
                for (let j = 0, k = groups.length; j < k; j++) {
                    series.data.push(metrics[i].data[groups[j]] || null);
                }
                all_series.push(series);
            }

            return all_series;
        }
    });

    self.options = Utils.deep_merge(self.options, {
        colors: opts.colors || self.get_color_set(),
        chart: {
            type: 'column',
            spacing: opts.spacing || [10, 10, 10, 10],
            zoomType: opts.zoom_type,
            height: opts.height || 400,
        },
        xAxis: {
            title: {
                text: opts.x_label || undefined,
            },
            labels: {
                formatter: function() {
                    if (self.truncate_label_length) {
                        return Utils.unescape_html(String(this.value)).truncate(
                            self.truncate_label_length,
                            'middle',
                        );
                    } else if (self.x_formatter) {
                        return self.x_formatter(this.value);
                    }

                    return Utils.unescape_html(this.value);
                },
            },
        },
        yAxis: {
            max: opts.max || opts.y_max,
            min: opts.min || opts.y_min,
            allowDecimals: opts.allowDecimals == undefined ? true : opts.allowDecimals,
            title: {
                text: opts.y_label || undefined,
            },
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size:10px;">${
                    this.series.name
                }</span><br>${self.formatter(this.y)}`;
            },
        },
        legend: {
            enabled: true,
        },
        plotOptions: {
            series: {
                threshold: opts.threshold,
            },
        },
    });

    return self;
}
