/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.series = ko.pureComputed(() => {
        let data = self.data();

        if (data) {
            return [
                {
                    data: data.series,
                    categories: data.groups,
                },
            ];
        }
        return [];
    });

    self.options = Utils.deep_merge(self.options, {
        chart: {
            borderWidth: opts.borderWidth || 0,
            borderColor: opts.borderColor || '#efefef',
            spacing: opts.borderWidth ? [20, 10, 35, 10] : [10, 10, 25, 10],
            type: 'vendela',
        },
        plotOptions: {
            vendela: {
                firstColor: self.get_color('eighth'),
                secondColor: '#404040',
                thirdColor: self.get_color('first'),
                fourthColor: '#A6A6A6',
                maxPointWidth: 20,
            },
        },
        xAxis: {
            categories_from_data: true,
        },
        tooltip: {
            formatter: function() {
                let style = 'font-size:11px;';
                let bold_style = 'font-weight:bold; font-size:11px;';

                return `
                        <strong>${this.key}</strong><br />
                        <span style="${style}">Upper Fence:</span>
                        <span style="${bold_style}">${self.formatter(this.point.high)}</span><br/>
                        <span style="${style}">Q1:</span>
                        <span style="${bold_style}">${self.formatter(this.point.q3)}</span><br/>
                        <span style="${style}">Q2 / Median:</span>
                        <span style="${bold_style}">${self.formatter(this.point.median)}</span><br/>
                        <span style="${style}">Q3:</span>
                        <span style="${bold_style}">${self.formatter(this.point.q1)}</span><br/>
                        <span style="${style}">Lower Fence:</span>
                        <span style="${bold_style}">${self.formatter(this.point.low)}</span><br/>
                    `;
            },
            enabled: true,
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

    return self;
}
