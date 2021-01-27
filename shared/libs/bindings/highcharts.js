import ko from 'knockout';
import $ from 'jquery';
import * as Utils from 'src/libs/Utils';
import Observer from 'src/libs/Observer';

import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsDrilldown from 'highcharts/modules/drilldown';
import HighchartsNoData from 'highcharts/modules/no-data-to-display';
import HighchartsBoost from 'highcharts/modules/boost';
import HighchartsVendela from 'src/libs/vendelachart';

HighchartsMore(Highcharts);
HighchartsExporting(Highcharts);
HighchartsDrilldown(Highcharts);
HighchartsNoData(Highcharts);
HighchartsVendela(Highcharts);
HighchartsBoost(Highcharts);

let credits = {
    href: 'https://cobalt.pe',
    text: 'Powered by Cobalt',
    position: {
        align: 'right',
        x: -10,
        verticalAlign: 'bottom',
        y: -10,
    },
};

if (__DEPLOYMENT__ == 'hl') {
    credits = false;
}

// Bug in highcharts 8.1.1: https://github.com/highcharts/highcharts/issues/13710
// Remove after upgrade with fix
window.Highcharts = Highcharts;

Highcharts.setOptions({
    boost: {
        useGPUTranslations: false,
        enabled: false,
    },
    colors: ['#39C5EB', '#4D4D4D', '#B4B4B4'],
    credits: credits,
    chart: {
        spacing: [20, 10, 40, 10],
        borderWidth: 0,
    },
    legend: {
        itemStyle: {
            color: '#333333',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
        },
        itemMarginTop: 3,
    },
    lang: {
        drillUpText: '◁ Back',
    },
});

(function(H) {
    let each = H.each;
    H.wrap(H.seriesTypes.column.prototype, 'drawPoints', function(proceed) {
        let series = this;
        if (series.data.length > 0) {
            let width =
                series.barW > series.options.maxPointWidth
                    ? series.options.maxPointWidth
                    : series.barW;
            each(this.data, point => {
                point.shapeArgs.x += (point.shapeArgs.width - width) / 2;
                point.shapeArgs.width = width;
            });
        }
        proceed.call(this);
    });

    H.Renderer.prototype.getContrast = function(rgba) {
        function luminanace(r, g, b) {
            const a = [r, g, b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        rgba = H.Color(rgba).rgba;
        if (1.05 / (luminanace(rgba[0], rgba[1], rgba[2]) + 0.05) >= 4.5) {
            return '#FFFFFF';
        }
        return '444444';
    };
})(Highcharts);

ko.bindingHandlers.highchart2 = {
    init: function(element, valueAccessor) {
        let data = valueAccessor();

        let chart = Highcharts.chart(element, data.options);

        let series = ko.unwrap(data.series) || [];
        let plotlines = ko.unwrap(data.plotlines) || [];
        let plotbands = ko.unwrap(data.plotbands) || [];

        let categories = [];
        let x_categories = ko.unwrap(data.x_categories) || false;
        let y_categories = ko.unwrap(data.y_categories) || false;

        if (data.options == undefined) {
            return;
        }

        let options = ko.unwrap(data.options);

        if (ko.isObservable(data.y_axis_conf)) {
            let yAxis = ko.unwrap(data.y_axis_conf);
            for (let axis of yAxis) {
                chart.addAxis(axis);
            }
        }

        if (options.updateColorEvent) {
            Observer.register(options.updateColorEvent, data => {
                let color_name = data.color_name;
                let color_value = data.new_color_val;

                switch (color_name) {
                    case 'first':
                        chart.options.colors[0] = color_value;
                        break;
                    case 'second':
                        chart.options.colors[1] = color_value;
                        break;
                    case 'third':
                        chart.options.colors[2] = color_value;
                        break;
                    case 'fourth':
                        chart.options.colors[3] = color_value;
                        break;
                }

                if (chart.series.length == 1) {
                    if (chart.options.plotOptions.vendela) {
                        switch (color_name) {
                            case 'eighth':
                                chart.options.plotOptions.vendela.firstColor = color_value;
                                break;
                            case 'first':
                                chart.options.plotOptions.vendela.thirdColor = color_value;
                                break;
                        }
                    }
                    chart.update(chart.options);
                } else if (chart.series.length == 2) {
                    // point in time chart
                    switch (color_name) {
                        case 'first':
                            chart.series[1].options.color = color_value;
                            break;
                        case 'second':
                            chart.series[1].options.negativeColor = color_value;
                            break;
                    }
                    chart.series[1].update(chart.series[1].options);
                }

                chart.redraw();
            });
        }

        for (let i = 0, l = series.length; i < l; i++) {
            if (options.xAxis.categories_from_data || options.yAxis.categories_from_data) {
                if (series[i].categories) {
                    categories.push(...series[i].categories);
                }
            }
            chart.addSeries(series[i], false);
        }

        for (let i = 0, l = plotlines.length; i < l; i++) {
            if (plotlines[i].xAxis !== undefined) {
                chart.xAxis[plotlines[i].xAxis || 0].addPlotLine(plotlines[i]);
            } else if (plotlines[i].yAxis !== undefined) {
                chart.xAxis[plotlines[i].yAxis || 0].addPlotLine(plotlines[i]);
            } else {
                chart.yAxis[0].addPlotLine(plotlines[i]);
            }
        }

        for (let i = 0, l = plotbands.length; i < l; i++) {
            if (plotbands[i].xAxis !== undefined) {
                chart.xAxis[plotbands[i].xAxis || 0].addPlotBand(plotbands[i]);
            } else if (plotbands[i].yAxis !== undefined) {
                chart.xAxis[plotbands[i].yAxis || 0].addPlotBand(plotbands[i]);
            } else {
                chart.yAxis[0].addPlotBand(plotbands[i]);
            }
        }

        if (options.xAxis.categories_from_data) {
            chart.xAxis[0].setCategories(categories, false);
        } else if (x_categories && x_categories.length > 0) {
            chart.xAxis[0].setCategories(x_categories, false);
        }

        if (options.yAxis.categories_from_data) {
            chart.yAxis[0].setCategories(categories, false);
        } else if (y_categories && y_categories.length > 0) {
            chart.yAxis[0].setCategories(y_categories, false);
        }

        let reflow_handler = () => {
            chart.reflow();
        };

        $('body').on('highchart:reflow', reflow_handler);

        let redraw_handler = () => {
            chart.redraw();
        };

        $('body').on('highchart:redraw', redraw_handler);

        chart.reflow();
        chart.redraw();

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $('body').off('highchart:reflow', reflow_handler);
            $('body').off('highchart:redraw', redraw_handler);
            chart.destroy();
        });
    },
    update: function(element, valueAccessor) {
        let data = valueAccessor();

        let chart = Highcharts.charts[$(element).data('highchartsChart')];

        let options = ko.unwrap(data.options);

        if (ko.isObservable(data.y_axis_conf)) {
            // If yaxis is observable, we update accordingly
            if (chart && chart.yAxis) {
                while (chart.yAxis.length > 0) {
                    // argument false specifies not to re-render
                    chart.yAxis[0].remove(false);
                }
            }
            let yAxis = ko.unwrap(data.y_axis_conf);
            for (let axis of yAxis) {
                chart.addAxis(axis);
            }
        }

        if (chart && chart.series) {
            while (chart.series.length > 0) {
                chart.series[0].remove(false);
            }

            for (let i = 0, l = chart.xAxis.length; i < l; i++) {
                let plotlines = chart.xAxis[i].plotLinesAndBands || [];
                for (let j = 0, k = plotlines.length; j < k; j++) {
                    chart.xAxis[i].removePlotLine(plotlines[0].id);
                }
            }

            for (let i = 0, l = chart.yAxis.length; i < l; i++) {
                let plotlines = chart.yAxis[i].plotLinesAndBands || [];
                for (let j = 0, k = plotlines.length; j < k; j++) {
                    chart.yAxis[i].removePlotLine(plotlines[0].id);
                }
            }

            let series = ko.unwrap(data.series) || [];
            let plotlines = ko.unwrap(data.plotlines) || [];
            let plotbands = ko.unwrap(data.plotbands) || [];

            let categories = [];
            let x_categories = ko.unwrap(data.x_categories) || false;
            let y_categories = ko.unwrap(data.y_categories) || false;

            for (let i = 0, l = series.length; i < l; i++) {
                if (options.xAxis.categories_from_data || options.yAxis.categories_from_data) {
                    if (series[i].categories) {
                        categories.push(...series[i].categories);
                    }
                }
                chart.addSeries(series[i], false);
            }

            for (let i = 0, l = plotlines.length; i < l; i++) {
                if (plotlines[i].xAxis !== undefined) {
                    chart.xAxis[plotlines[i].xAxis || 0].addPlotLine(plotlines[i]);
                } else if (plotlines[i].yAxis !== undefined) {
                    chart.xAxis[plotlines[i].yAxis || 0].addPlotLine(plotlines[i]);
                } else {
                    chart.yAxis[0].addPlotLine(plotlines[i]);
                }
            }

            for (let i = 0, l = plotbands.length; i < l; i++) {
                if (plotbands[i].xAxis !== undefined) {
                    chart.xAxis[plotbands[i].xAxis || 0].addPlotBand(plotbands[i]);
                } else if (plotbands[i].yAxis !== undefined) {
                    chart.xAxis[plotbands[i].yAxis || 0].addPlotBand(plotbands[i]);
                } else {
                    chart.yAxis[0].addPlotBand(plotbands[i]);
                }
            }

            if (options.xAxis.categories_from_data) {
                chart.xAxis[0].setCategories(categories, false);
            } else if (x_categories && x_categories.length > 0) {
                chart.xAxis[0].setCategories(x_categories, false);
            }

            if (options.yAxis.categories_from_data) {
                chart.yAxis[0].setCategories(categories, false);
            } else if (y_categories && y_categories.length > 0) {
                chart.yAxis[0].setCategories(y_categories, false);
            }

            if (data.label_computed) {
                chart.setTitle({text: Utils.unescape_html(data.label_computed())}, null, false);
            }

            if (data.sublabel_computed) {
                chart.setTitle(null, {text: Utils.unescape_html(data.sublabel_computed())}, false);
            }

            if (data.y_label_computed) {
                chart.yAxis[0].setTitle(
                    {text: Utils.unescape_html(data.y_label_computed())},
                    null,
                    false,
                );
            }

            if (data.x_label_computed) {
                chart.xAxis[0].setTitle(
                    {text: Utils.unescape_html(data.x_label_computed())},
                    null,
                    false,
                );
            }

            if (data.x_units) {
                chart.xAxis[0].update({units: data.x_units()}, null, false);
            }

            if (chart.drilled_down) {
                chart.drillUp();
                chart.drilled_down = false;
            }

            if (typeof data._clear_cloned_tooltip === 'function') {
                data._clear_cloned_tooltip(chart);
            }

            chart.reflow();
            chart.redraw();
        }
    },
};
