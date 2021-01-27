import React from 'react';
import PropTypes from 'prop-types';
import {Box} from '@rebass/grid';
import {lighten, transparentize} from 'polished';

import {is_set} from 'src/libs/Utils';

import {Chart} from 'components/charts/base';

import Loader from 'components/basic/Loader';

class BarChart extends React.PureComponent {
    static propTypes = {
        height: PropTypes.number.isRequired,
        exporting: PropTypes.bool.isRequired,
        dataProvider: PropTypes.shape({
            axes: PropTypes.func,
            series: PropTypes.func.isRequired,
            formatter: PropTypes.func,
        }).isRequired,
        yAxisTitle: PropTypes.string,
        horizontal: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        exporting: false,
        horizontal: false,
    };

    getConfig() {
        const {dataProvider, exporting} = this.props;
        const height = this._getHeight();

        const tooltip = {
            pointFormatter: function() {
                let resultTooltip = '';

                const series_name = this.series.name;
                const axisIdx = this.series.yAxis.userOptions.index;
                const yFormatter = dataProvider.yTooltipFormatter(
                    axisIdx,
                    axisIdx === 0 ? 'leftYAxisLabel' : 'rightYAxisLabel',
                );

                resultTooltip += oneLine`
                    <span style="color: ${this.color}">
                        \u25CF
                    </span>
                    ${series_name}: <b>${yFormatter(this.y)}</b>
                    <br/>
                `;

                return resultTooltip;
            },
        };

        const placement = dataProvider.settingsValueForComponent(['legend', 'placement'], 'bottom');

        let align = 'center';
        let layout = 'horizontal';
        let verticalAlign = 'bottom';
        if (placement === 'right') {
            align = 'right';
            layout = 'vertical';
            verticalAlign = 'middle';
        } else if (placement === 'left') {
            align = 'left';
            layout = 'horizontal';
            verticalAlign = 'middle';
        } else if (placement === 'top') {
            align = 'center';
            layout = 'horizontal';
            verticalAlign = 'top';
        }

        return {
            credits: false,
            exporting: {
                enabled: exporting,
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
                height: dataProvider.settingsValueForComponent(['titleDisabled'], false)
                    ? height
                    : height - 54,
                backgroundColor: null,
                type: dataProvider.settingsValueForComponent(['horizontalBars'], false)
                    ? 'bar'
                    : 'column',
                spacing: [8, 0, 8, 0],
                borderWidth: 0,
            },
            plotOptions: {
                series: {
                    tooltip: tooltip,
                    animation: false,
                    stacking: dataProvider.settingsValueForComponent(['stacked'])
                        ? 'normal'
                        : undefined,
                    dataLabels: {
                        enabled: dataProvider.settingsValueForComponent([
                            'dataPointLabel',
                            'enableDataLabels',
                        ]),
                        align: dataProvider.settingsValueForComponent(['horizontalBars'])
                            ? dataProvider.settingsValueForComponent(['dataPointLabel', 'inside'])
                                ? 'right'
                                : undefined
                            : 'center',
                        formatter: dataProvider.getDataLabelFormatter(),
                        inside: dataProvider.settingsValueForComponent(
                            ['dataPointLabel', 'inside'],
                            'true',
                        ),
                        style: {
                            fontFamily: 'Lato, Arial',
                            color: dataProvider.settingsValueForComponent(
                                ['dataPointLabel', 'color'],
                                'contrast',
                            ),
                            fontSize: dataProvider.settingsValueForComponent(
                                ['dataPointLabel', 'fontSize'],
                                10,
                            ),
                            fontStyle: dataProvider.settingsValueForComponent([
                                'dataPointLabel',
                                'italic',
                            ])
                                ? 'italic'
                                : 'normal',
                            fontWeight: dataProvider.settingsValueForComponent([
                                'dataPointLabel',
                                'bold',
                            ])
                                ? 'bold'
                                : 'normal',
                            textDecoration: dataProvider.settingsValueForComponent([
                                'dataPointLabel',
                                'underline',
                            ])
                                ? 'underline'
                                : 'none',
                            textOutline: false,
                        },
                    },
                    events: {
                        afterAnimate: function() {
                            let chart = this.chart;
                            let disclaimer = dataProvider.isNormalized();
                            if (disclaimer) {
                                chart.renderer
                                    .text(
                                        '*Indicates Normalized Fiscal Year End',
                                        20,
                                        chart.chartHeight,
                                    )
                                    .css({
                                        fontSize: '10px',
                                        color: '#666666',
                                        fontWeight: '300',
                                        fontFamily: 'Lato',
                                    })
                                    .add();
                            }
                        },
                    },
                },
            },
            title: {
                text: null,
            },
            legend: {
                enabled: dataProvider.settingsValueForComponent(['legend', 'enable'], true),
                align,
                layout,
                verticalAlign,
                itemStyle: {
                    color: dataProvider.settingsValueForComponent(['legend', 'color'], '#666666'),
                    fontSize: dataProvider.settingsValueForComponent(['legend', 'fontSize'], 10),
                    fontStyle: dataProvider.settingsValueForComponent(['legend', 'italic'])
                        ? 'italic'
                        : 'normal',
                    fontWeight: dataProvider.settingsValueForComponent(['legend', 'bold'], true)
                        ? 'bold'
                        : 'normal',
                    textDecoration: dataProvider.settingsValueForComponent(['legend', 'underline'])
                        ? 'underline'
                        : 'none',
                },
                itemHiddenStyle: {
                    color: transparentize(
                        0.8,
                        dataProvider.settingsValueForComponent(['legend', 'color'], '#666666'),
                    ),
                    fontSize: dataProvider.settingsValueForComponent(['legend', 'fontSize'], 10),
                    fontStyle: dataProvider.settingsValueForComponent(['legend', 'italic'])
                        ? 'italic'
                        : 'normal',
                    fontWeight: dataProvider.settingsValueForComponent(['legend', 'bold'], true)
                        ? 'bold'
                        : 'normal',
                    textDecoration: dataProvider.settingsValueForComponent(['legend', 'underline'])
                        ? 'underline'
                        : 'none',
                },
                itemHoverStyle: {
                    color: lighten(
                        0.3,
                        dataProvider.settingsValueForComponent(['legend', 'color'], '#666666'),
                    ),
                    fontSize: dataProvider.settingsValueForComponent(['legend', 'fontSize'], 10),
                    fontStyle: dataProvider.settingsValueForComponent(['legend', 'italic'])
                        ? 'italic'
                        : 'normal',
                    fontWeight: dataProvider.settingsValueForComponent(['legend', 'bold'], true)
                        ? 'bold'
                        : 'normal',
                    textDecoration: dataProvider.settingsValueForComponent(['legend', 'underline'])
                        ? 'underline'
                        : 'none',
                },
            },
            xAxis: dataProvider.xAxes(),
            yAxis: dataProvider.yAxes(),
            series: dataProvider.series(),
        };
    }

    _getHeight() {
        const paddingY = this.props.dataProvider.settingsValueForComponent(['paddingY'], 0);
        return this.props.height - paddingY * 2;
    }

    render() {
        const {dataProvider, ...props} = this.props;

        if (dataProvider.isLoading()) {
            return <Loader />;
        }

        const title = dataProvider.settingsValueForComponent(['titleDisabled'], false)
            ? null
            : dataProvider.settingsValueForComponent(['title'], undefined, v => !is_set(v, true));

        const paddingX = dataProvider.settingsValueForComponent(['paddingX'], 0);
        const paddingY = dataProvider.settingsValueForComponent(['paddingY'], 0);

        return (
            <Box py={`${paddingY}px`} px={`${paddingX}px`}>
                <Chart
                    {...props}
                    dataProvider={dataProvider}
                    title={title}
                    config={this.getConfig()}
                />
            </Box>
        );
    }
}

export const BarChartFromProvider = ({dataProvider, _isEditing, ...rest}) => (
    <BarChart dataProvider={dataProvider} exporting {...rest} />
);

export default BarChart;
