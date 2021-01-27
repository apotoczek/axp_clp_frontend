/* Automatically transformed from AMD to ES6. Beware of code smell. */
import PointInTimeChart from 'src/libs/components/charts/PointInTimeChart';
import ko from 'knockout';
import BaseChart from 'src/libs/components/charts/BaseChart';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

let _component = function(opts, components) {
    let self = new BaseChart(opts, components);

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);
    self.render_currency = opts.render_currency;
    self.value_key = opts.value_key || 'value';
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

    self.options = Utils.deep_merge(
        self.options,
        {
            chart: {
                zoomType: 'x',
            },
            tooltip: {
                formatter: function() {
                    let string = `<span style="font-size: 10px;">${Formatters.date(
                        this.point.x,
                    )}</span>`;
                    if (this.series.name == 'Total Value') {
                        string += `<br>Total Value: <strong>${Formatters.money(
                            this.point.y,
                            false,
                            {render_currency: ko.unwrap(self.render_currency)},
                        )}</strong>`;
                    } else {
                        string += `<br>Rate of Return: <strong>${Formatters.irr(
                            this.point.y,
                        )}</strong>`;
                    }
                    return string;
                },
            },
            xAxis: {
                type: 'datetime',
            },
            yAxis: [
                {
                    title: {
                        text: 'Total Value',
                    },
                    labels: {
                        formatter: function() {
                            return Formatters.money(this.value, false, {
                                render_currency: ko.unwrap(self.render_currency),
                            });
                        },
                    },
                },
                {
                    title: {
                        text: 'Rate of Return',
                    },
                    opposite: true,
                    labels: {
                        formatter: function() {
                            return Formatters.irr(this.value);
                        },
                    },
                },
            ],
        },
        opts.options,
    );

    self.series = opts.series_callback
        ? ko.pureComputed(() => opts.series_callback(self))
        : ko.pureComputed(() => {
              let data = self.data();
              if (data && data.periods && !data.error_data) {
                  return [
                      {
                          name: 'Total Value',
                          data: data.periods.reduce((series, period) => {
                              series.push([period.start * 1000, period.start_value]);
                              series.push([period.end * 1000, period.end_value]);
                              return series;
                          }, []),
                          type: 'line',
                          yAxis: 0,
                          zIndex: 10,
                          color: '#4D4D4D',
                      },
                      {
                          name: 'Rate of Return',
                          data: data.periods.map(period => {
                              let time = period.start + (period.end - period.start) / 2;
                              return [time * 1000, period.hpr];
                          }),
                          type: 'column',
                          yAxis: 1,
                          color: self.get_color('first'),
                          negativeColor: self.get_color('second'),
                      },
                  ];
              }
              return [];
          });

    return self;
};

_component.config = {
    id: '',
    component: PointInTimeChart,
    template: 'tpl_chart_box',
};

export default _component;
