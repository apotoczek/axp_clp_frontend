import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';

import {is_set} from 'src/libs/Utils';

import genFormatter from 'utils/formatters';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

import {orderValues, deriveLabel} from './shared';

export default class PieChartProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(PieChartProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        this._format = (this.valueProvider.values()[0] || {}).format;
        this._formatArgs = (this.valueProvider.values()[0] || {}).formatArgs;
        this.valueSettings = componentData.valueSettings || {};
    }

    getYFormatter() {
        const format = {
            type: this._format,
            formatArgs: {
                ...this._formatArgs,
                abbreviate: this.settingsValueForComponent(
                    ['dataPointLabel', 'displayUnits'],
                    false,
                ),
                abbreviateAs: this.settingsValueForComponent(
                    ['dataPointLabel', 'displayUnits'],
                    undefined,
                ),
                decimals: this.settingsValueForComponent(['dataPointLabel', 'decimalPlaces'], 2),
                showUnit: this.settingsValueForComponent(['dataPointLabel', 'showUnit'], true),
                currencySymbol: this.settingsValueForComponent([
                    'dataPointLabel',
                    'currencySymbol',
                ]),
            },
        };

        return genFormatter(format);
    }

    getDataLabelFormatter() {
        const self = this;
        const nameTemplate = this.settingsValueForComponent(
            ['dataPointLabel', 'content'],
            '{{valuePercent}}',
            v => !is_set(v, true),
        );

        return function() {
            const yFormatter = self.getYFormatter();
            const percentFormatter = genFormatter({
                type: 'percent',
                formatArgs: {
                    ...self._formatArgs,
                    abbreviate: self.settingsValueForComponent(
                        ['dataPointLabel', 'displayUnits'],
                        false,
                    ),
                    abbreviateAs: self.settingsValueForComponent(
                        ['dataPointLabel', 'displayUnits'],
                        undefined,
                    ),
                    decimals: self.settingsValueForComponent(
                        ['dataPointLabel', 'decimalPlaces'],
                        2,
                    ),
                    showUnit: self.settingsValueForComponent(['dataPointLabel', 'showUnit'], true),
                    currencySymbol: self.settingsValueForComponent([
                        'dataPointLabel',
                        'currencySymbol',
                    ]),
                },
            });

            return deriveLabel(nameTemplate, {
                value: yFormatter(this.point.y),
                valuePercent: percentFormatter(this.point.percentage / 100.0),
                valueName: this.point.valueLabel,
                entityName: this.point.entityName,
                groupName: this.point.groupName,
            });
        };
    }

    series() {
        const uniqueValues = this.valueProvider.values();
        const orderedUniqueValues = orderValues(uniqueValues, this.componentData.valueSettings);

        const slices = [];
        for (const [idx, value] of orderedUniqueValues.entries()) {
            const color = value.isGrouped
                ? this._getGroupColor(idx)
                : (this.valueSettings[value.id] || {}).color;

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

            const slice = {
                name,
                valueLabel: value.valueLabel,
                entityName: value.entityName || '',
                groupName: value.groupLabel || '',
                y: value.value,
                idx,
                color,
            };
            slices.push(slice);
        }

        return [
            {
                data: slices,
                xAxis: 0,
            },
        ];
    }
}

export class PieChartSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(PieChartSettingsProvider);

    disabledOptionValues() {
        const values = [];
        if (this.componentData.settings.titleDisabled) {
            values.push('title');
        }

        return values;
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

    optionsForValueId(valueId) {
        return this.valueProvider.valueOptions(
            valueId,
            this.valueProvider.entities(valueId)[0],
            ValueMapFilter.False, // No time-spanning values
            ValueMapFilter.Maybe, // Grouped and Non-grouped values
        );
    }

    isValueSelected(valueId) {
        return is_set(this.valueProvider.data(valueId).valueKey, true);
    }

    isEntitySelected(valueId) {
        return is_set(this.valueProvider.entities(valueId), true);
    }

    inferredValueLabel(valueId) {
        let autoName = '{{valueName}}';
        if (this.valueProvider.isValueGrouped(valueId)) {
            autoName = '{{valueName}} ({{groupName}})';
        }

        return autoName;
    }
}
