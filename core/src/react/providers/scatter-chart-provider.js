import {is_set, identity} from 'src/libs/Utils';

import {getValueParameters} from 'libs/spec-engine/params';

import genFormatter from 'utils/formatters';
import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

import {deriveLabel} from './shared';

export default class ScatterChartProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(ScatterChartProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);
    }

    isBubbleChart() {
        return this.componentData.componentKey === 'bubbleChart';
    }

    getDataLabelFormatter() {
        const self = this;
        let defaultName = this.isBubbleChart() ? '{{zValue}}' : '{{groupName}}';
        const nameTemplate = this.settingsValueForComponent(
            ['dataPointLabel', 'content'],
            defaultName,
            v => !is_set(v, true),
        );

        return function() {
            const {yAxisValueId, xAxisValueId, zAxisValueId} = self.componentData;
            const xFormatter = self.valueFormatter(xAxisValueId, 'xAxisLabel');
            const yFormatter = self.valueFormatter(yAxisValueId, 'yAxisLabel');
            const zFormatter = self.valueFormatter(zAxisValueId, 'dataPointLabel');
            const {x = 'N/A', y = 'N/A', z = 'N/A'} = this.point;

            return deriveLabel(nameTemplate, {
                xValue: xFormatter(x),
                yValue: yFormatter(y),
                zValue: zFormatter(z),
                xValueName: this.point.series.userOptions.xValueName,
                yValueName: this.point.series.userOptions.yValueName,
                zValueName: this.point.series.userOptions.zValueName,
                entityName: this.point.series.userOptions.entityName,
                groupName: this.point.series.userOptions.groupName,
            });
        };
    }

    valueFormatter(valueId, axisName) {
        if (!valueId) {
            return identity;
        }

        const format = this.valueProvider.valueFormat(valueId);
        const formatArgs = {
            ...this.valueProvider.valueFormatArgs(valueId),
            abbreviate: this.settingsValueForComponent([axisName, 'displayUnits'], false),
            abbreviateAs: this.settingsValueForComponent([axisName, 'displayUnits'], undefined),
            decimals: this.settingsValueForComponent([axisName, 'decimalPlaces'], 2),
            showUnit: this.settingsValueForComponent([axisName, 'showUnit'], true),
            currencySymbol: this.settingsValueForComponent([axisName, 'currencySymbol']),
        };

        return genFormatter({type: format, formatArgs});
    }

    _axisConf(axisName) {
        const self = this;
        function labelFormatter() {
            const formatter = self.valueFormatter(
                self.componentData[`${axisName}ValueId`],
                `${axisName}Label`,
            );

            return formatter(this.value);
        }

        const labelFontStyle = this.settingsValueForComponent([`${axisName}Label`, 'italic'])
            ? 'italic'
            : 'normal';
        const labelFontWeight = this.settingsValueForComponent([`${axisName}Label`, 'bold'])
            ? 'bold'
            : 'normal';
        const labelTextDecoration = this.settingsValueForComponent([
            `${axisName}Label`,
            'underline',
        ])
            ? 'underline'
            : 'none';

        return {
            title: {
                text: this.settingsValueForComponent([`${axisName}Label`, 'name']),
            },
            crosshair: {
                color: 'rgba(150, 150, 150, 0.8)',
                width: 1,
            },
            min: this.settingsValueForComponent([`${axisName}Label`, 'customDataInterval', 'min']),
            max: this.settingsValueForComponent([`${axisName}Label`, 'customDataInterval', 'max']),
            tickInterval: this.settingsValueForComponent([
                `${axisName}Label`,
                'customDataInterval',
                'interval',
            ]),
            labels: {
                enabled: this.settingsValueForComponent(
                    [`${axisName}Label`, 'enableDataLabels'],
                    true,
                ),
                formatter: labelFormatter,
                style: {
                    fontFamily: 'Lato, Arial',
                    color: this.settingsValueForComponent([`${axisName}Label`, 'color'], '#666666'),
                    fontSize: this.settingsValueForComponent([`${axisName}Label`, 'fontSize'], 10),
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    textDecoration: labelTextDecoration,
                },
                rotation: -this.settingsValueForComponent([`${axisName}Label`, 'tickRotation'], 0),
            },
        };
    }

    isNormalized() {
        // Decides if a disclaimer label should be rendered
        const uniqueValues = this.valueProvider.values();
        let normalized = false;

        for (const [_, value] of uniqueValues.entries()) {
            normalized = normalized || value.additionalData.normalized;
        }

        return normalized;
    }

    xAxis() {
        return this._axisConf('xAxis');
    }

    yAxis() {
        return {
            ...this._axisConf('yAxis'),
            gridLineWidth: this.settingsValueForComponent(['gridDisabled'], false) ? 0 : 1,
            minorGridLineWidth: this.settingsValueForComponent(['gridDisabled'], false) ? 0 : 1,
        };
    }

    zAxis() {
        return this._axisConf('zAxis');
    }

    _serieNameForValue(uniqueValue) {
        return uniqueValue.isGrouped ? uniqueValue.groupLabel : uniqueValue.entityName;
    }

    _valuesBySerieName(uniqueValues) {
        const {xAxisValueId, yAxisValueId, zAxisValueId} = this.componentData;

        const axisDataBySerieName = {};
        for (const value of uniqueValues) {
            const serieName = this._serieNameForValue(value);
            const data = axisDataBySerieName[serieName] || {};

            let field;
            if (xAxisValueId && value.id === xAxisValueId) {
                field = 'x';
            } else if (yAxisValueId && value.id === yAxisValueId) {
                field = 'y';
            } else if (zAxisValueId && value.id === zAxisValueId) {
                field = 'z';
            }

            data[field] = value;
            axisDataBySerieName[serieName] = data;
        }

        return axisDataBySerieName;
    }

    series() {
        const uniqueValues = this.valueProvider.values();
        const valuesBySerieName = this._valuesBySerieName(uniqueValues);
        const series = [];
        let i = 0;
        for (const [serieName, values] of Object.entries(valuesBySerieName)) {
            const color = this._getGroupColor(i);
            const {x = {}, y = {}, z = {}} = values;
            const data = [x.value, y.value, z.value];

            const serie = {
                name: serieName,
                data: [data],
                color,
                xAxis: 0,
                yAxis: 0,
                xValueName: x.valueLabel || 'N/A',
                yValueName: y.valueLabel || 'N/A',
                zValueName: z.valueLabel || 'N/A',
                entityName: x.entityName || '',
                groupName: serieName,
            };
            series.push(serie);
            i++;
        }

        return series;
    }
}

export class ScatterChartSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(ScatterChartSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);
    }

    isBubbleChart() {
        return this.componentData.componentKey === 'bubbleChart';
    }

    valueForAxisName(axisName) {
        const valueId = this.componentData[`${axisName}ValueId`];
        const value = valueId ? this.valueProvider.data(valueId) : {};
        const entityLabel = this.getVehicleName();

        return {...value, entityLabel};
    }

    getSelectedEntity() {
        return this.valueProvider.entities()[0];
    }

    getGroupingParam() {
        const entity = this.getSelectedEntity();
        const valueParameters = getValueParameters(
            entity,
            'irr', // Hack, IRR has all available groupings.
            this.additionalData.valueMap,
            this.valueProvider.rawParamValues(),
        );

        return valueParameters.group_by || {};
    }

    getVehicleName() {
        const entity = this.getSelectedEntity();
        if (!entity) {
            return;
        }

        return super.getVehicleName(entity.uid);
    }

    getVehicleError() {
        const entity = this.getSelectedEntity();
        if (!entity) {
            return;
        }

        return super.getVehicleError(entity.uid);
    }

    isValueSelected(axisName) {
        const valueId = this.componentData[`${axisName}ValueId`];
        if (!is_set(this.valueProvider.data(valueId), true)) {
            return false;
        }

        return is_set(this.valueProvider.data(valueId).valueKey, true);
    }

    isEntitySelected() {
        return is_set(this.valueProvider.entities(), true);
    }

    optionsForValueId(valueId) {
        const entity = this.getSelectedEntity();
        return this.valueProvider.valueOptions(valueId, entity, ValueMapFilter.False);
    }

    disabledOptionValues() {
        const values = [];
        if (this.componentData.settings.titleDisabled) {
            values.push('title');
        }
        if (this.componentData.settings.gridDisabled) {
            values.push('grid');
        }

        return values;
    }

    axisFormat(axisName) {
        const valueId = this.componentData[`${axisName}ValueId`];
        if (!valueId) {
            return;
        }

        const value = this.valueProvider.data(valueId);
        return value.format;
    }
}
