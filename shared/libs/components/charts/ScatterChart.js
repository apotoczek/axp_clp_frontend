/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseChart(opts, components);

    self.x_formatter = opts.x_formatter || Formatters.gen_formatter(opts.x_format);
    self.y_formatter = opts.y_formatter || Formatters.gen_formatter(opts.y_format);

    self.x_value_key = opts.x_value_key || 'x_value';
    self.y_value_key = opts.y_value_key || 'y_value';
    self.label_key = opts.label_key || 'label';

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self._loading = self.loading;

        self.loading = ko.computed({
            write: function(val) {
                self._loading(val);
            },
            read: function() {
                return self._loading() || self.compset.loading();
            },
        });
    }

    self.options = Utils.deep_merge(self.options, {
        colors: self.get_color_set(),
        chart: {
            type: 'scatter',
            zoomType: 'xy',
        },
        xAxis: {
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            labels: {
                formatter: function() {
                    return self.x_formatter(this.value);
                },
            },
            min: opts.x_min,
        },
        yAxis: {
            labels: {
                formatter: function() {
                    return self.y_formatter(this.value);
                },
            },
            min: opts.y_min,
        },
        legend: {
            enabled: true,
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)',
                        },
                    },
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false,
                        },
                    },
                },
            },
        },
        tooltip: {
            formatter: function() {
                return `${this.series.name}<br>${ko.unwrap(
                    opts.x_label,
                )}: <strong>${self.x_formatter(this.x)}</strong><br>${ko.unwrap(
                    opts.y_label,
                )}: <strong>${self.y_formatter(this.y)}</strong>`;
            },
        },
    });

    self.series = ko.pureComputed(() => {
        let series = [];

        let comps = self.comps();

        for (let i = 0, l = comps.length; i < l; i++) {
            let x_value = comps[i][self.x_value_key];
            let y_value = comps[i][self.y_value_key];
            let label = comps[i][self.label_key];

            if (Utils.is_set(x_value) && Utils.is_set(y_value) && Utils.is_set(label)) {
                series.push({
                    name: Utils.unescape_html(label),
                    data: [[x_value, y_value]],
                });
            }
        }
        return series;
    });

    return self;
}
