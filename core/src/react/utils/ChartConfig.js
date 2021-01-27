import lodash from 'lodash';

export default class ChartConfig {
    // Base config for all charts constructed with a type.
    // Note that this will be shallow cloned into new charts.
    static BASE_CONFIG = {
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: [
                        'downloadCSV',
                        'downloadXLS',
                        'separator',
                        'downloadJPEG',
                        'downloadPNG',
                        'downloadPDF',
                        'downloadSVG',
                    ],
                },
            },
        },
        title: {text: null},
        legend: {enabled: true, symbolRadius: 0},
    };

    constructor(chartType) {
        if (chartType == undefined) {
            this.config = {
                title: {text: null},
            };
        } else {
            this.config = {...ChartConfig.BASE_CONFIG};
            this.config.chart = {
                type: chartType,
            };
        }
    }

    merge(newValues) {
        lodash.merge(this.config, newValues);
        return this;
    }

    buildWith(newValues) {
        this.merge(newValues);
        return this.config;
    }

    build() {
        return this.config;
    }

    /*
      Config Builder Methods
    */

    setChartType(chartType) {
        return this.merge({chart: {type: chartType}});
    }

    setSeries(series) {
        return this.merge({series: series});
    }

    setTooltipFormatter(tooltipFormatter) {
        return this.merge({tooltip: {formatter: tooltipFormatter}});
    }

    setYAxisTitle(titleText) {
        return this.merge({yAxis: {title: {text: titleText}}});
    }
}
