import React from 'react';
import PropTypes from 'prop-types';
import {html} from 'common-tags';
import {Box} from '@rebass/grid';
import {lighten, transparentize} from 'polished';

import {is_set} from 'src/libs/Utils';

import {Chart} from 'components/charts/base';

import PieChartProvider from 'providers/pie-chart-provider';

export default class PieChart extends React.PureComponent {
    static propTypes = {
        height: PropTypes.number.isRequired,
        exporting: PropTypes.bool.isRequired,
        dataProvider: PropTypes.instanceOf(PieChartProvider).isRequired,
    };

    static defaultProps = {
        exporting: false,
    };

    getConfig() {
        const {dataProvider, exporting} = this.props;
        const height = this._getHeight();

        const distance = dataProvider.settingsValueForComponent(
            ['dataPointLabel', 'insideSlices'],
            false,
        )
            ? -20
            : 15;

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
                type: 'pie',
                height: dataProvider.settingsValueForComponent(['titleDisabled'], false)
                    ? height
                    : height - 54,
                backgroundColor: null,
                spacing: [8, 0, 8, 0],
                borderWidth: 0,
            },
            title: {
                text: null,
            },
            tooltip: {
                formatter: function() {
                    const yFormatter = dataProvider.getYFormatter();
                    const formattedValue = yFormatter(this.point.y);

                    return html`
                        <span style="font-size: 10px;">${this.point.valueLabel}</span><br />
                        ${this.point.name}: <b>${formattedValue}</b><br />
                    `;
                },
            },
            plotOptions: {
                pie: {
                    animation: false,
                    innerSize: dataProvider.settingsValueForComponent(['donut'], false)
                        ? '50%'
                        : undefined,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: dataProvider.settingsValueForComponent(
                            ['dataPointLabel', 'enableDataLabels'],
                            true,
                        ),
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
                        distance,
                    },
                    showInLegend: dataProvider.settingsValueForComponent(
                        ['legend', 'enable'],
                        true,
                    ),
                },
            },
            legend: {
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
            series: dataProvider.series(),
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

export const PieChartFromProvider = ({dataProvider, _isEditing, ...rest}) => (
    <PieChart dataProvider={dataProvider} exporting {...rest} />
);
