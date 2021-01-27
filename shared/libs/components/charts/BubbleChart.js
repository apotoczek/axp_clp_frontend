/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.x_key = opts.x_key || 'x';
    self.y_key = opts.y_key || 'y';
    self.z_key = opts.z_key || 'z';

    self.x_formatter = opts.x_formatter || Formatters.gen_formatter(opts.x_format);
    self.y_formatter = opts.y_formatter || Formatters.gen_formatter(opts.y_format);
    self.z_formatter = opts.z_formatter || Formatters.gen_formatter(opts.z_format);

    self.z_label = opts.z_label || 'Count';
    self.label_key = opts.label_key || 'name';
    self.sort_key = opts.sort_key;
    self.sort_descending = !(opts.sort_order === 'asc');

    self.series = ko.pureComputed(() => {
        let data = self.data();
        let series = [];

        if (data) {
            if (Object.isObject(data)) {
                data = Object.entries(data).map(([n, o]) => {
                    let copy = {...o};
                    copy[self.label_key] = n;
                    return copy;
                });
            }
            if (self.sort_key) {
                data.sortBy(s => s[self.sort_key], self.sort_descending);
            }
            for (let obj of data) {
                series.push({
                    data: [
                        {
                            x: obj[ko.unwrap(self.x_key)],
                            y: obj[ko.unwrap(self.y_key)],
                            z: obj[ko.unwrap(self.z_key)],
                        },
                    ],
                    name: Utils.unescape_html(obj[self.label_key]),
                });
            }
        }
        if (!self.sort_key) {
            return series.sortBy(s => s.data[0]['z'], self.sort_descending);
        }
        return series;
    });

    self.options = Utils.deep_merge(self.options, {
        colors: self.get_color_set(),
        chart: {
            type: 'bubble',
            zoomType: 'xy',
        },
        xAxis: {
            labels: {
                formatter: function() {
                    return self.x_formatter(this.value);
                },
            },
            title: {
                text: self.x_label,
            },
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return self.y_formatter(this.value);
                },
            },
            title: {
                text: self.y_label,
            },
        },
        tooltip: {
            // shared: self.shared_tooltip,
            formatter: function() {
                let tooltip = this.series.name;

                let x_label = this.series.chart.options.xAxis[0].title.text;
                let y_label = this.series.chart.options.yAxis[0].title.text;

                tooltip += `<br><span style="font-size:11px;">${y_label}: </span><span style="font-weight: bold;font-size:11px;">${self.y_formatter(
                    this.point.y,
                )}</span><br/>`;

                tooltip += `<br><span style="font-size:11px;">${x_label}: </span><span style="font-weight: bold;font-size:11px;">${self.x_formatter(
                    this.point.x,
                )}</span><br/>`;

                tooltip += `<br><span style="font-size:11px;">${ko.unwrap(
                    self.z_label,
                )}: </span><span style="font-weight: bold;font-size:11px;">${self.z_formatter(
                    this.point.z,
                )}</span><br/>`;

                return tooltip;
            },
        },
        plotOptions: {
            series: {
                // colorByPoint: true,
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                },
            },
            bubble: {
                minSize: '5%',
                maxSize: '30%',
            },
        },
        legend: {
            enabled: true,
        },
    });

    return self;
}
