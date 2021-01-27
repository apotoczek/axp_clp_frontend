/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.value_key = opts.value_key || 'value';
    self.label_key = opts.label_key || 'label';
    self.simple_data_format = opts.simple_data_format || false;

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self.add_dependency(self.compset);
    } else {
        self.comps = ko.observableArray([]);
    }

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.series = ko.pureComputed(() => {
        let data = self.data();
        let series = [];

        if (data && self.simple_data_format) {
            series.push({
                type: 'vendela',
                data: [data],
                showInLegend: false,
                enableMouseTracking: false,
            });
        }

        if (data && data.fences && data.quartiles) {
            series.push({
                type: 'vendela',
                data: [
                    [
                        data.fences.inner.lower,
                        data.quartiles[0],
                        data.quartiles[1],
                        data.quartiles[2],
                        data.fences.inner.upper,
                    ],
                ],
                showInLegend: false,
                enableMouseTracking: false,
            });
        }

        if (self.comps && data && ((data.fences && data.quartiles) || self.simple_data_format)) {
            let comps = ko.unwrap(self.comps) || [];
            let value_key = ko.unwrap(self.value_key);
            let label_key = ko.unwrap(self.label_key);

            for (let i = 0, l = comps.length; i < l; i++) {
                let value = Utils.extract_data(value_key, comps[i]);
                let label = Utils.extract_data(label_key, comps[i]);

                if (Utils.is_set(value) && Utils.is_set(label)) {
                    let data = {
                        name: Utils.unescape_html(label),
                        data: [[0.4, value]],
                        type: 'scatter',
                        marker: {
                            lineWidth: 0,
                        },
                    };

                    if (comps[i].color) {
                        if (self.use_custom_colors()) {
                            data.color = self.get_color('third');
                        } else {
                            data.color = comps[i].color;
                        }
                    }

                    series.push(data);
                }
            }
        }

        return series;
    });

    self.options = Utils.deep_merge(self.options, {
        colors: self.get_color_set(),
        chart: {
            zoomType: 'xy',
            type: 'vendela',
        },
        plotOptions: {
            vendela: {
                firstColor: self.get_color('eighth'),
                secondColor: '#404040',
                thirdColor: self.get_color('first'),
                fourthColor: '#A6A6A6',
                pointWidth: 20,
            },
        },
        xAxis: {
            labels: {
                enabled: false,
            },
            min: -1,
            max: 1,
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return self.formatter(this.value);
                },
            },
        },
        tooltip: {
            formatter: function() {
                return `${this.series.name}: <strong>${self.formatter(this.y)}</strong>`;
            },
        },
    });

    return self;
}
