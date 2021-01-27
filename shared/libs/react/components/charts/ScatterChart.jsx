import React from 'react';
import PropTypes from 'prop-types';
import {Box} from '@rebass/grid';
import {lighten, transparentize} from 'polished';

import {is_set} from 'src/libs/Utils';

import {Chart} from 'components/charts/base';

export default class ScatterChart extends React.PureComponent {
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
        title: 'Scatter Chart',
    };

    getConfig() {
        const {dataProvider, exporting} = this.props;
        const height = this._getHeight();

        const tooltip = {
            pointFormatter: function() {
                const xAxisValueId = dataProvider.componentDataValueForComponent(['xAxisValueId']);
                const xAxisFormatter = dataProvider.valueFormatter(xAxisValueId, 'xAxisLabel');
                const xAxisFormattedValue = xAxisFormatter(this.x);
                const xAxisValueLabel = dataProvider.valueProvider.valueLabel(xAxisValueId);

                const yAxisValueId = dataProvider.componentDataValueForComponent(['yAxisValueId']);
                const yAxisFormatter = dataProvider.valueFormatter(yAxisValueId, 'yAxisLabel');
                const yAxisFormattedValue = yAxisFormatter(this.y);
                const yAxisValueLabel = dataProvider.valueProvider.valueLabel(yAxisValueId);

                const zAxisValueId = dataProvider.componentDataValueForComponent(['zAxisValueId']);
                const zAxisFormatter = dataProvider.valueFormatter(zAxisValueId, 'dataPointLabel');
                const zAxisFormattedValue = zAxisFormatter(this.z);
                const zAxisValueLabel = dataProvider.valueProvider.valueLabel(zAxisValueId);

                let label = `
                    ${xAxisValueLabel}: <b>${xAxisFormattedValue}</b><br />
                    ${yAxisValueLabel}: <b>${yAxisFormattedValue}</b>
                `;

                if (dataProvider.isBubbleChart()) {
                    label += `<br />${zAxisValueLabel}: <b>${zAxisFormattedValue}</b>`;
                }

                return label;
            },
            shared: true,
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
                type: dataProvider.isBubbleChart(this.props.componentKey) ? 'bubble' : 'scatter',
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
            yAxis: dataProvider.yAxis(),
            zAxis: dataProvider.zAxis(),
            series: dataProvider.series(),
            tooltip: tooltip,
        };
    }

    _getHeight() {
        const paddingY = this.props.dataProvider.settingsValueForComponent(['paddingY'], 0);
        return this.props.height - paddingY * 2;
    }

    render() {
        const {dataProvider, ...props} = this.props;
        const title = dataProvider.settingsValueForComponent(['titleDisabled'], false)
            ? null
            : dataProvider.settingsValueForComponent(['title'], undefined, v => !is_set(v, true));

        const paddingX = this.props.dataProvider.settingsValueForComponent(['paddingX'], 0);
        const paddingY = this.props.dataProvider.settingsValueForComponent(['paddingY'], 0);

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

export function ScatterChartFromProvider({dataProvider, _isEditing, ...restProps}) {
    return <ScatterChart dataProvider={dataProvider} exporting {...restProps} />;
}
