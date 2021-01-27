/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.bars = opts.bars;

    self.options = Utils.deep_merge(self.options, {
        chart: {
            type: 'waterfall',
        },
        xAxis: {
            type: 'category',
        },
        yAxis: {
            title: {
                text: opts.y_label,
            },
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
            gridLineColor: '#e5e5e5',
        },
        legend: {
            enabled: false,
        },
        tooltip: {
            formatter: function() {
                return `<span style="font-size: 11px;">${
                    this.key
                }</span><br><strong>${self.formatter(this.y)}</strong>`;
            },
        },
        plotOptions: {
            waterfall: {
                dataLabels: {
                    style: {
                        textShadow: 'none',
                    },
                },
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let data = self.data();

        let series_data = [];

        if (data && self.bars) {
            for (let i = 0, l = self.bars.length; i < l; i++) {
                if (self.bars[i].key && data[self.bars[i].key]) {
                    series_data.push({
                        name: self.bars[i].name,
                        y: data[self.bars[i].key],
                        color: self.bars[i].color,
                    });
                } else if (self.bars[i].sum === true) {
                    series_data.push({
                        name: self.bars[i].name,
                        isSum: true,
                        color: self.bars[i].color,
                    });
                }
            }
        } else {
            return [];
        }

        return [
            {
                upColor: self.get_color('first'),
                color: self.get_color('second'),
                data: series_data,
                dataLabels: {
                    enabled: true,
                    inside: false,
                    formatter: function() {
                        return self.formatter(this.y);
                    },
                    style: {
                        color: '#555',
                        fontWeight: 'bold',
                        fontSize: '12px',
                    },
                    crop: false,
                    overflow: 'none',
                },
                pointPadding: 0,
                borderWidth: 0,
            },
        ];
    });

    return self;
}
