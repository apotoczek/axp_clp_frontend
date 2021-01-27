import React from 'react';

import {Chart} from 'components/charts/base';
import Loader from 'components/basic/Loader';

class WaterfallChart extends React.PureComponent {
    getConfig() {
        const {dataProvider} = this.props;

        const tooltip = {
            pointFormatter: function() {
                let resultTooltip = '';

                const series_name = this.series.name;
                const yFormatter = dataProvider.getFormatter();
                const formattedValue = yFormatter(this.y);

                resultTooltip += oneLine`
                    <span style="color: ${this.color}">
                        \u25CF
                    </span>
                    ${series_name}: <b>${formattedValue}</b>
                    <br/>
                `;

                return resultTooltip;
            },
        };

        return {
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
            chart: {
                type: 'waterfall',
            },
            title: {
                text: null,
            },
            legend: {
                enabled: !dataProvider.settings.legendDisabled,
            },
            plotOptions: {
                series: {
                    tooltip: tooltip,
                    animation: false,
                },
            },
            series: dataProvider.series(),
            yAxis: dataProvider.yAxis(),
            xAxis: dataProvider.xAxis(),
        };
    }

    render() {
        const {dataProvider} = this.props;
        return (
            <Chart
                title={dataProvider.titleDisabled() ? null : dataProvider.settings.title}
                config={this.getConfig()}
            />
        );
    }
}

export const WaterfallChartFromProvider = ({dataProvider, _isEditing, ...rest}) => {
    if (dataProvider.isLoading()) {
        return <Loader />;
    }

    return <WaterfallChart dataProvider={dataProvider} exporting {...rest} />;
};

export default WaterfallChart;
