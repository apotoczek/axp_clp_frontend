import isEqual from 'lodash.isequal';
import uuid from 'uuid/v4';
import moment from 'moment';

import {Format} from 'libs/spec-engine/utils';
import {identity, is_set, deep_merge} from 'src/libs/Utils';

import genFormatter from 'utils/formatters';
import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import * as Constants from 'src/libs/Constants';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

import {orderValues, deriveLabel} from './shared';

function _calculateYAxes(uniqueValues) {
    const _yAxes = [];
    const _yAxesByValueId = {};
    for (const value of uniqueValues) {
        // Not a grouped value, so we find an axis that already has the same format
        const matchingExisting = Object.values(_yAxes).findIndex(
            yAxis =>
                yAxis.format.type === value.format &&
                isEqual(yAxis.format.formatArgs, value.formatArgs),
        );

        // If we found a matching one, we set the axis of the current data
        // to be the one we found
        if (matchingExisting >= 0) {
            _yAxesByValueId[value.id] = matchingExisting;

            // If we didn't find a matching axis, we add the data axis as a new
            // one and set the current data to be on the newly added axis
        } else {
            _yAxesByValueId[value.id] = _yAxes.length;
            _yAxes.push({format: {type: value.format, formatArgs: value.formatArgs}});
        }
    }

    return [_yAxes, _yAxesByValueId];
}

// Timeseries chart can be either categorized or not, this enum keeps track of which
// different types this chart can be.
const ChartType = {
    DateTime: 'datetime',
    Column: 'column',
};

function sortAndFilterTimestamps(uniqueValues, min, max) {
    let sortedTimestamps = [];
    for (const value of uniqueValues || []) {
        for (const [timestamp, _value] of value.value || []) {
            if ((min && timestamp < min) || (max && timestamp > max)) {
                continue;
            }

            sortedTimestamps.push(timestamp);
        }
    }
    sortedTimestamps.sort();
    return sortedTimestamps;
}

function _calculateXAxisCategories(uniqueValues, chartType, interval, min, max) {
    const timestamps = sortAndFilterTimestamps(uniqueValues, min && min * 1000, max && max * 1000);
    if (timestamps.length === 0) {
        // No data, so it does not matter which interval we return.
        return [undefined, 'year'];
    }

    if (!interval) {
        min = timestamps[0];
        max = timestamps[timestamps.length - 1];
        interval = _calculateDefaultInterval(min / 1000, max / 1000);
    }

    if (chartType === ChartType.DateTime) {
        return [undefined, interval];
    }

    const categories = [];
    const categoriesSet = new Set([]);
    for (const timestamp of timestamps) {
        const formatter = genFormatter(interval);
        const formattedTimestamp = formatter(timestamp);
        if (categoriesSet.has(formattedTimestamp)) {
            continue;
        }

        categoriesSet.add(formattedTimestamp);
        categories.push(formattedTimestamp);
    }

    return [categories, interval];
}

function _calculateDefaultInterval(min, max) {
    if (max - min <= 1 * 365 * 24 * 60 * 60) {
        return 'month';
    } else if (max - min <= 2 * 365 * 24 * 60 * 60) {
        return 'quarter';
    }

    return 'year';
}

export default class TimeseriesChartProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(TimeseriesChartProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        // Calculate y axis
        const [yAxes, yAxesByValueId] = _calculateYAxes(orderedUniqueValues);
        this._yAxes = yAxes;
        this._yAxesByValueId = yAxesByValueId;

        // Calculate x axis
        const xAxisInterval = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'interval',
        ]);
        const xAxisMin = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'min',
        ]);
        const xAxisMax = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'max',
        ]);
        const [_xAxisCategories, _xAxisInterval] = _calculateXAxisCategories(
            orderedUniqueValues,
            this.chartType(),
            xAxisInterval,
            xAxisMin,
            xAxisMax,
        );
        this._xAxisCategories = _xAxisCategories;
        this._xAxisInterval = _xAxisInterval;
    }

    chartType() {
        const categorizeIntervals = this.settingsValueForComponent([
            'xAxisLabel',
            'categorizeIntervals',
        ]);
        return categorizeIntervals ? ChartType.Column : ChartType.DateTime;
    }

    xTooltipFormatter() {
        if (this.chartType() === ChartType.DateTime) {
            return genFormatter('date');
        }

        return identity;
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

    xAxisTickPositioner() {
        const self = this;
        const minSetting = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'min',
        ]);
        const maxSetting = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'max',
        ]);

        return function(min, max) {
            const _min = minSetting || min / 1000;
            const _max = maxSetting || max / 1000;

            let ticks = [];
            let pos = moment(_min * 1000);

            while (pos.unix() < _max) {
                pos = pos.add(1, self._xAxisInterval).startOf(self._xAxisInterval);
                ticks.push(pos.unix() * 1000);
            }

            return ticks;
        };
    }

    xAxis() {
        const self = this;
        const minSetting = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'min',
        ]);
        const maxSetting = this.settingsValueForComponent([
            'xAxisLabel',
            'customDataInterval',
            'max',
        ]);

        function labelFormatter() {
            return genFormatter(self._xAxisInterval)(this.value - Constants.day_in_milliseconds);
        }

        const labelFontStyle = this.settingsValueForComponent(['xAxisLabel', 'italic'])
            ? 'italic'
            : 'normal';
        const labelFontWeight = this.settingsValueForComponent(['xAxisLabel', 'bold'])
            ? 'bold'
            : 'normal';
        const labelTextDecoration = this.settingsValueForComponent(['xAxisLabel', 'underline'])
            ? 'underline'
            : 'none';

        const dateTimeConfig =
            this.chartType() === ChartType.DateTime
                ? {
                      type: 'datetime',
                      min: minSetting ? minSetting * 1000 : undefined,
                      max: maxSetting ? maxSetting * 1000 : undefined,
                      tickPositioner: this.xAxisTickPositioner(),
                      labels: {
                          formatter: labelFormatter,
                      },
                  }
                : {};

        const columnConfig =
            this.chartType() === ChartType.Column
                ? {
                      type: 'column',
                      categories: this._xAxisCategories,
                  }
                : {};

        const commonConfig = {
            title: {
                text: this.settingsValueForComponent(['xAxisLabel', 'name']),
            },
            crosshair: {
                color: 'rgba(150, 150, 150, 0.8)',
                width: 1,
            },
            labels: {
                enabled: this.settingsValueForComponent(['xAxisLabel', 'enableDataLabels'], true),
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
        };

        return [deep_merge(commonConfig, dateTimeConfig, columnConfig)];
    }

    yAxes() {
        const yAxes = [];
        const instance = this;

        const labelFormatter = (axis, axisName) => {
            return function() {
                const format = {...axis.format};
                format.formatArgs = {
                    ...format.formatArgs,
                    abbreviate: instance.settingsValueForComponent(
                        [axisName, 'displayUnits'],
                        false,
                    ),
                    abbreviateAs: instance.settingsValueForComponent(
                        [axisName, 'displayUnits'],
                        undefined,
                    ),
                    decimals: instance.settingsValueForComponent([axisName, 'decimalPlaces'], 2),
                    showUnit: instance.settingsValueForComponent([axisName, 'showUnit'], true),
                    currencySymbol: instance.settingsValueForComponent([
                        axisName,
                        'currencySymbol',
                    ]),
                };

                return genFormatter(format)(this.value);
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

    _seriesName(value) {
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
        return deriveLabel(nameTemplate, {
            valueName: value.valueLabel || '',
            entityName: value.entityName || '',
            groupName: value.groupLabel || '',
        });
    }

    _categorizedSeriesData(timeValueTuples) {
        const data = new Array(this._xAxisCategories.length).fill(null);

        for (const [timestamp, value] of timeValueTuples) {
            const category = genFormatter(this._xAxisInterval)(timestamp);
            const categoryIdx = this._xAxisCategories.findIndex(category);
            data[categoryIdx] = value;
        }

        return data;
    }

    series() {
        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);
        const chartType = this.chartType();

        const series = [];
        for (const [idx, value] of orderedUniqueValues.entries()) {
            const yAxisIdx = this._yAxesByValueId[value.id];

            const name = this._seriesName(value);

            const color = value.isGrouped
                ? this._getGroupColor(idx)
                : this.settingsValueForValueId(value.id, ['color']);

            const stack = this.settingsValueForValueId(value.id, ['stacked'], false)
                ? this._yAxes[yAxisIdx].format.type
                : undefined;

            let data;
            if (chartType === ChartType.DateTime) {
                data = value.value;
            } else if (chartType === ChartType.Column && is_set(value.value)) {
                data = this._categorizedSeriesData(value.value);
            }

            series.push({
                id: uuid(),
                name,
                data,
                xAxis: 0,
                yAxis: yAxisIdx,
                color,
                type: this.settingsValueForValueId(value.id, ['type']),
                stack,
                stacking: stack ? 'normal' : undefined,
                valueLabel: value.valueLabel || '',
                entityName: value.entityName || '',
                groupName: value.groupLabel || '',
                // This is required for column series to respect the min and max values.
                // See: https://github.com/highcharts/highcharts/issues/3489
                pointRange: 0,
            });
        }

        return series;
    }
}

export class TimeseriesChartSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(TimeseriesChartSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);
        const [yAxes, yAxesByValueId] = _calculateYAxes(orderedUniqueValues);
        this._yAxes = yAxes;
        this._yAxesByValueId = yAxesByValueId;
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

    settingsValueForValueId(valueId, key, defaultValue, notSetChecker) {
        const isValueGrouped = this.valueProvider.isValueGrouped(valueId);

        if (isValueGrouped) {
            if (key === 'name') {
                return undefined;
            }

            if (key === 'color') {
                return undefined;
            }
        }

        return super.settingsValueForValueId(valueId, key, defaultValue, notSetChecker);
    }

    optionsForValueId(valueId) {
        const entity = this.valueProvider.entities(valueId)[0];
        return this.valueProvider.valueOptions(valueId, entity, ValueMapFilter.True);
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
            return Format.Date;
        }

        // Only supports two y-axes. This is a limitation in the timeseries settings
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

    hasColumnSeries() {
        for (const valueSettings of Object.values(this.componentData.valueSettings)) {
            if (valueSettings.type === 'column') {
                return true;
            }
        }

        return false;
    }

    inferredValueLabel(valueId) {
        const value = this.valueProvider.data(valueId);
        let autoName = value.valueLabel;
        if (this.valueProvider.isValueGrouped(valueId)) {
            autoName = 'Automatic';
        } else if (is_set(value.entityLabel, true)) {
            autoName = `${autoName} (${value.entityLabel})`;
        }

        return autoName;
    }
}
