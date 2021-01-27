import isEqual from 'lodash.isequal';

import {Format} from 'libs/spec-engine/utils';
import {is_set, is_numeric} from 'src/libs/Utils';

import genFormatter from 'utils/formatters';

import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

import {orderValues, deriveLabel} from './shared';

function _calculateYAxes(uniqueValues) {
    const yAxes = [];
    const yAxesByEntryId = {};

    for (const entry of uniqueValues) {
        // For now assume there are no grouped values
        // IE every entry is their own category
        const match = yAxes.findIndex(
            yAxis =>
                yAxis.format.type === entry.format &&
                isEqual(yAxis.format.formatArgs, entry.formatArgs),
        );

        if (match >= 0) {
            yAxesByEntryId[entry.id] = match;
        } else {
            yAxesByEntryId[entry.id] = yAxes.length;
            yAxes.push({format: {type: entry.format, formatArgs: {...entry.formatArgs}}});
        }
    }

    return [yAxes, yAxesByEntryId];
}

function _calculateCategories(uniqueValues) {
    const categories = [];
    const categoryByEntryId = {};

    for (const entry of uniqueValues) {
        const matchCategory = categories.findIndex(
            category => category === (entry.isGrouped ? entry.groupLabel : entry.entityName),
        );

        if (matchCategory >= 0) {
            categoryByEntryId[entry.id] = matchCategory;
        } else {
            categories.push(entry.isGrouped ? entry.groupLabel : entry.entityName);
            categoryByEntryId[entry.id] = categories.length;
        }
    }

    return [categories, categoryByEntryId];
}

export default class BarChartProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(BarChartProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        const [yAxes, yAxesByEntryId] = _calculateYAxes(orderedUniqueValues);
        this._yAxes = yAxes;
        this._yAxesByEntryId = yAxesByEntryId;

        const [categories, categoryByEntryId] = _calculateCategories(orderedUniqueValues);
        this._categories = categories;
        this._categoryByEntryId = categoryByEntryId;
    }

    yTooltipFormatter(yAxisIndex, axisName) {
        const format = {...this._yAxes[yAxisIndex].format};
        format.formatArgs = {
            ...format.formatArgs,
            abbreviate: this.settingsValueForComponent([axisName, 'displayUnits'], false),
            abbreviateAs: this.settingsValueForComponent([axisName, 'displayUnits'], undefined),
            decimals: this.settingsValueForComponent([axisName, 'decimalPlaces'], 2),
            showUnit: this.settingsValueForComponent([axisName, 'showUnit'], true),
            currencySymbol: this.settingsValueForComponent([axisName, 'currencySymbol']),
        };

        return genFormatter(format);
    }

    isNormalized() {
        // Decides if a disclaimer label should be rendered
        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);
        let normalized = false;

        for (const [_, value] of orderedUniqueValues.entries()) {
            normalized = normalized || value.additionalData.normalized;
        }

        return normalized;
    }

    getDataLabelFormatter() {
        const self = this;
        const nameTemplate = this.settingsValueForComponent(
            ['dataPointLabel', 'content'],
            '{{value}}',
            v => !is_set(v, true),
        );

        return function() {
            const yAxisIdx = this.point.series.yAxis.userOptions.index;
            const yFormatter = self.yTooltipFormatter(yAxisIdx, 'dataPointLabel');
            return deriveLabel(nameTemplate, {
                value: yFormatter(this.point.y),
                valueName: this.point.series.userOptions.valueLabel,
                entityName: this.point.series.userOptions.entityName,
                groupName: this.point.series.userOptions.groupName,
            });
        };
    }

    xAxes() {
        const labelFontStyle = this.settingsValueForComponent(['xAxisLabel', 'italic'])
            ? 'italic'
            : 'normal';
        const labelFontWeight = this.settingsValueForComponent(['xAxisLabel', 'bold'])
            ? 'bold'
            : 'normal';
        const labelTextDecoration = this.settingsValueForComponent(['xAxisLabel', 'underline'])
            ? 'underline'
            : 'none';

        return [
            {
                title: {
                    text: this.settingsValueForComponent(['xAxisLabel', 'name']),
                },
                type: 'category',
                categories: this._categories,
                labels: {
                    enabled: this.settingsValueForComponent(
                        ['xAxisLabel', 'enableDataLabels'],
                        true,
                    ),
                    style: {
                        fontFamily: 'Lato, Arial',
                        color: this.settingsValueForComponent(['xAxisLabel', 'color'], '#666666'),
                        fontSize: this.settingsValueForComponent(['xAxisLabel', 'fontSize'], 10),
                        fontStyle: labelFontStyle,
                        fontWeight: labelFontWeight,
                        textDecoration: labelTextDecoration,
                    },
                    rotation: -this.settingsValueForComponent(['xAxisLabel', 'tickRotation'], 0),
                },
            },
        ];
    }

    yAxes() {
        const yAxes = [];
        const self = this;

        const labelFormatter = (axis, axisName) => {
            return function() {
                const format = axis.format;
                format.formatArgs = {
                    ...format.formatArgs,
                    abbreviate: self.settingsValueForComponent([axisName, 'displayUnits'], false),
                    abbreviateAs: self.settingsValueForComponent(
                        [axisName, 'displayUnits'],
                        undefined,
                    ),
                    decimals: self.settingsValueForComponent([axisName, 'decimalPlaces'], 2),
                    showUnit: self.settingsValueForComponent([axisName, 'showUnit'], true),
                    currencySymbol: self.settingsValueForComponent([axisName, 'currencySymbol']),
                };

                return genFormatter(axis.format)(this.value);
            };
        };

        for (const [idx, axis] of this._yAxes.entries()) {
            const isOpposite = !!(idx % 2);
            const axisName = isOpposite ? 'rightYAxisLabel' : 'leftYAxisLabel';

            const labelFontStyle = this.settingsValueForComponent([axisName, 'italic'])
                ? 'italic'
                : 'normal';
            const labelFontWeight = this.settingsValueForComponent([axisName, 'bold'])
                ? 'bold'
                : 'normal';
            const labelTextDecoration = this.settingsValueForComponent([axisName, 'underline'])
                ? 'underline'
                : 'none';

            const axisConf = {
                title: {
                    text: this.settingsValueForComponent([axisName, 'name']),
                },
                min: this.settingsValueForComponent([axisName, 'customDataInterval', 'min']),
                max: this.settingsValueForComponent([axisName, 'customDataInterval', 'max']),
                tickInterval: this.settingsValueForComponent([
                    axisName,
                    'customDataInterval',
                    'interval',
                ]),
                labels: {
                    enabled: this.settingsValueForComponent([axisName, 'enableDataLabels'], true),
                    formatter: labelFormatter(axis, axisName),
                    style: {
                        fontFamily: 'Lato, Arial',
                        color: this.settingsValueForComponent([axisName, 'color'], '#666666'),
                        fontSize: this.settingsValueForComponent([axisName, 'fontSize'], 10),
                        fontStyle: labelFontStyle,
                        fontWeight: labelFontWeight,
                        textDecoration: labelTextDecoration,
                    },
                    rotation: this.settingsValueForComponent([axisName, 'tickRotation'], 0),
                },
                alignTicks: false,
                opposite: isOpposite,
                gridLineWidth:
                    this.settingsValueForComponent(['gridDisabled'], false) || isOpposite ? 0 : 1,
                minorGridLineWidth: this.settingsValueForComponent(['gridDisabled'], false) ? 0 : 1,
            };

            yAxes.push(axisConf);
        }

        return yAxes;
    }

    series() {
        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        const seriesByValue = {};
        for (const [idx, value] of orderedUniqueValues.entries()) {
            let autoName = '{{valueName}}';
            if (is_set(value.groupLabel, true)) {
                autoName = '{{valueName}} ({{groupName}})';
            }

            const nameTemplate = this.settingsValueForValueId(
                value.id,
                ['name'],
                autoName,
                v => !is_set(v, true),
            );
            const name = deriveLabel(nameTemplate, {
                valueName: value.valueLabel || '',
                entityName: value.entityName || '',
                groupName: value.groupLabel || '',
            });

            if (!seriesByValue[name]) {
                const yAxisIdx = this._yAxesByEntryId[value.id];
                const stack = this.settingsValueForComponent(['stacked'])
                    ? this._yAxes[yAxisIdx].format.type
                    : undefined;

                const color = value.isGrouped
                    ? this._getGroupColor(idx)
                    : this.settingsValueForValueId(value.id, ['color']);

                // Need to make sure length matches categories
                const data = new Array(this._categories.length).fill(null);

                seriesByValue[name] = {
                    yAxis: yAxisIdx,
                    name,
                    data,
                    color,
                    stack,
                    valueLabel: value.valueLabel || '',
                    entityName: value.entityName || '',
                    groupName: value.groupLabel || '',
                };
            }

            // Find which category it should be placed in, it should always exist
            const matchCategory = this._categories.findIndex(
                category => category === (value.isGrouped ? value.groupLabel : value.entityName),
            );

            seriesByValue[name].data[matchCategory] = is_numeric(value.value) ? value.value : null;
        }

        return Object.values(seriesByValue);
    }
}

export class BarChartSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(BarChartSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        const [yAxes] = _calculateYAxes(orderedUniqueValues);
        this._yAxes = yAxes;
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

    optionsForValueId(valueId) {
        const entity = this.valueProvider.entities(valueId)[0];
        return this.valueProvider.valueOptions(valueId, entity, ValueMapFilter.False);
    }

    values() {
        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        const values = [];
        for (const value of orderedUniqueValues) {
            const entityLabel =
                value.entities && value.entities[0]
                    ? this.getVehicleName(value.entities[0].uid)
                    : null;
            const entityError =
                value.entities && value.entities[0]
                    ? this.getVehicleError(value.entities[0].uid)
                    : null;

            values.push({...value, valueId: value.id, entityLabel, entityError});
        }

        return values;
    }

    axisFormat(axisName) {
        if (axisName === 'xAxis') {
            return Format.String;
        }

        // Only supports two y-axes. This is a limitation in the barchart settings
        // interface, so this limitation is reasonable here, i.e. we don't need to be able
        // to find the format of an arbitrary number of y axes.
        if (axisName === 'leftYAxis' && this._yAxes.length >= 1) {
            return this._yAxes[0].format.type;
        }

        if (axisName === 'rightYAxis' && this._yAxes.length >= 2) {
            return this._yAxes[1].format.type;
        }
    }

    isValueSelected(valueId) {
        return is_set(this.valueProvider.data(valueId).valueKey, true);
    }

    isEntitySelected(valueId) {
        return is_set(this.valueProvider.entities(valueId), true);
    }
}
