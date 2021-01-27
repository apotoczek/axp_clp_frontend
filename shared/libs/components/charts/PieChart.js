/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    // cloned and editted from BarChart, might have code that isn't really used by piecharts

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);
    self.label_formatter = opts.label_formatter || Formatters.gen_formatter(opts.label_format);
    self.data_key = opts.data_key || undefined;
    self.value_key = opts.value_key || 'value';
    self.label_key = opts.label_key || 'label';

    self.colors = (
        opts.colors || [
            'fourth',
            'first',
            'seventh',
            'fifth',
            '#404040',
            'third',
            '#A6A6A6',
            'eighth',
            'second',
            'sixth',
        ]
    ).map(self.get_color);

    self.allow_decimals = opts.allow_decimals === undefined ? true : opts.allow_decimals;

    if (opts.truncate_label_length === undefined) {
        self.truncate_label_length = 30;
    } else {
        self.truncate_label_length = opts.truncate_label_length;
    }

    self.options = Utils.deep_merge(self.options, {
        chart: {
            type: 'pie',
            spacing: opts.spacing || [10, 10, 10, 10],
        },
        xAxis: {
            categories_from_data: true,
            labels: {
                formatter: function() {
                    let label = self.label_formatter(this.value);

                    if (self.truncate_label_length) {
                        return String(label).truncate(self.truncate_label_length, 'middle');
                    }

                    return label;
                },
            },
        },
        title: {
            text: opts.title || null,
            margin: 0,
            style: {
                fontWeight: 600,
            },
        },
        tooltip: {
            formatter: function() {
                let sliceIndex = this.point.index;
                let sliceName = this.series.chart.axes[0].categories[sliceIndex];
                return `<b> ${sliceName} </b>: <b> ${Formatters.percent(
                    this.point.percentage / 100,
                )} </b>`;
            },
        },
        legend: {
            enabled: true,
            labelFormatter: function() {
                let legendIndex = this.index;
                let legendName = this.series.chart.axes[0].categories[legendIndex];

                return legendName;
            },
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',

                startAngle: 90,
                dataLabels: {
                    enabled: true,
                    distance: 5,
                    softConnector: false,
                    formatter: function() {
                        return Formatters.percent(this.point.percentage / 100);
                    },
                    style: {
                        color: 'black',
                    },
                },
                showInLegend: true,
                colors: self.colors,
                size: opts.size || '70%',
            },
            series: {
                colorByPoint: true,
                allowPointSelect: false,
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let series = {
            categories: [],
            data: [],
        };

        let comps = [];

        if (self.comps) {
            comps.push(...self.comps());
        }

        let data = self.data();

        if (data) {
            if (self.data_key) {
                data = Utils.extract_data(self.data_key, data);
            }

            comps.push(...data);
        }

        for (let comp of comps) {
            if (comp) {
                let value = Utils.extract_data(self.value_key, comp);
                let label = Utils.extract_data(self.label_key, comp);

                if ((Utils.is_set(value) || opts.show_null) && Utils.is_set(label)) {
                    series.categories.push(Utils.unescape_html(label));

                    let data = {
                        y: value || null,
                    };

                    if (comp.color) {
                        data.color = self.get_color(comp.color);
                    }

                    series.data.push(data);
                }
            }
        }
        return [series];
    });

    return self;
}
