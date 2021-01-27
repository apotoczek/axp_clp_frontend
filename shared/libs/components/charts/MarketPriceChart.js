/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.options = Utils.deep_merge(self.options, {
        chart: {
            zoomType: 'x',
        },
        xAxis: {
            type: 'datetime',
            minRange: 30 * 24 * 3600000,
            labels: {
                style: {
                    fontSize: '11px',
                },
            },
        },
        yAxis: [
            {
                title: {
                    text: 'Price',
                },
                labels: {
                    formatter: function() {
                        return Formatters.usd(this.value);
                    },
                    style: {
                        fontSize: '11px',
                    },
                },
            },
        ],
        tooltip: {
            formatter: function() {
                let string = `<span style="font-size: 10px;">${Formatters.date(this.x)}</span>`;

                string += `<br>${this.series.name}: <strong>${Formatters.usd(
                    this.point.y,
                )}</strong>`;

                return string;
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let index_data = self.data();
        let series = [];

        if (index_data) {
            series.push({
                name: Utils.unescape_html(index_data.name),
                type: 'line',
                data: index_data.prices,
                yAxis: 0,
                lineWidth: 1,
                zIndex: 15,
            });
        }

        return series;
    });

    return self;
}
