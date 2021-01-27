import React from 'react';
import PropTypes from 'prop-types';
import {Box} from '@rebass/grid';
import {lighten, transparentize} from 'polished';

import {is_set} from 'src/libs/Utils';

import {Chart} from 'components/charts/base';

class TimeseriesChart extends React.Component {
    static propTypes = {
        height: PropTypes.number.isRequired,
        exporting: PropTypes.bool.isRequired,
        dataProvider: PropTypes.shape({
            xAxis: PropTypes.func,
            yAxes: PropTypes.func,
            series: PropTypes.func.isRequired,
        }).isRequired,
    };

    static defaultProps = {
        exporting: false,
        title: 'Timeseries Chart',
    };

    _getHeight() {
        const paddingY = this.props.dataProvider.settingsValueForComponent(['paddingY'], 0);
        return this.props.height - paddingY * 2;
    }

    getConfig() {
        const {dataProvider, exporting} = this.props;
        const height = this._getHeight();

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

        const tooltip = {
            formatter: function() {
                const color = this.color;
                const otherPoints = [];
                if (this.points && this.points.length > 0) {
                    otherPoints.push(...this.points);
                }
                if (this.point) {
                    otherPoints.push(this.point);
                }

                let resultTooltip = oneLine`
                    <span>${dataProvider.xTooltipFormatter()(this.x)}</span>
                    <br />
                `;

                for (const point of otherPoints) {
                    const series_name = point.series.name;
                    const axisIdx = point.series.yAxis.userOptions.index;
                    const yFormatter = dataProvider.yTooltipFormatter(
                        axisIdx,
                        axisIdx === 0 ? 'leftYAxisLabel' : 'rightYAxisLabel',
                    );
                    const formattedValue = yFormatter(point.y);

                    resultTooltip += oneLine`
                        <span style="color: ${color}">
                            \u25CF
                        </span>
                        ${series_name}: <b>${formattedValue}</b>
                        <br/>
                    `;
                }
                return resultTooltip;
            },
            shared: true,
        };

        return {
            credits: false,
            exporting: {
                enabled: exporting,
                buttons: {
                    contextButton: {
                        align: 'left',
                        y: 10,
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
                spacing: [8, 0, 8, 0],
                borderWidth: 0,
            },
            plotOptions: {
                series: {
                    tooltip: tooltip,
                    animation: false,
                    dataLabels: {
                        enabled: dataProvider.settingsValueForComponent([
                            'dataPointLabel',
                            'enableDataLabels',
                        ]),
                        align: 'center',
                        formatter: dataProvider.getDataLabelFormatter(),
                        style: {
                            fontFamily: 'Lato, Arial',
                            color: dataProvider.settingsValueForComponent(
                                ['dataPointLabel', 'color'],
                                '#666666',
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
            xAxis: dataProvider.xAxis(),
            yAxis: dataProvider.yAxes(),
            series: dataProvider.series(),
            tooltip: tooltip,
        };
    }

    render() {
        const {dataProvider, ...props} = this.props;
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

export const TimeseriesChartFromProvider = ({dataProvider, _isEditing, ...rest}) => (
    <TimeseriesChart dataProvider={dataProvider} exporting {...rest} />
);

export default TimeseriesChart;
