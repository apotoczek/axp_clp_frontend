import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import genFormatter from 'utils/formatters';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

export default class WaterfallChartProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(WaterfallChartProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);
        this.componentData = componentData;
        this.settings = this.componentData.settings || {};

        this._yAxisFormat = (this.valueProvider.values()[0] || {}).format;
        this._yAxisFormatArgs = (this.valueProvider.values()[0] || {}).formatArgs;
    }

    xAxis = () => {
        return {
            title: {
                text: this.settings.xAxisLabel,
            },
            type: 'category',
        };
    };

    yAxis = () => {
        const yAxisFormat = this._yAxisFormat;

        if (yAxisFormat) {
            return {
                title: {
                    text: this.settings.yAxisLabel,
                },
                labels: {
                    formatter: function() {
                        const formatter = genFormatter({
                            type: yAxisFormat,
                            formatArgs: this._yAxisFormatArgs,
                        });
                        return formatter(this.value);
                    },
                },
                gridLineWidth: this.settings.gridDisabled ? 0 : 1,
                minorGridLineWidth: this.settings.gridDisabled ? 0 : 1,
            };
        }
    };

    series = () => {
        if (this.valueProvider.values().isEmpty()) {
            return [];
        }
        const values = this.valueProvider.values().map(entry => {
            let yValue = entry.value || null;
            const valueSettings = (this.componentData.values || {})[entry.id] || {};
            if (valueSettings.valueNegation) {
                yValue = -yValue;
            }
            return {
                //If it is a grouped value, we wanna show the group label
                name:
                    valueSettings.label || (entry.isGrouped ? entry.groupLabel : entry.valueLabel),
                y: yValue,
            };
        });

        if (this.settings.showTotal) {
            values.append({
                name: this.settings.totalLabel || 'Total',
                isSum: true,
                color: this.settings.totalColor,
            });
        }

        return [
            {
                upColor: this.settings.posColor,
                color: this.settings.negColor,
                data: values,
                format: this._yValueFormat, //Ugly for now, support multiple?
            },
        ];
    };

    getCurrency = () => this._currency;
    getFormatter = () =>
        genFormatter({type: this._yAxisFormat, formatArgs: {...this._yAxisFormatArgs}});
    titleDisabled = () => this.settings.titleDisabled;
}

export class WaterfallSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(WaterfallSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);
        this.componentData = componentData;
        this.settings = this.componentData.settings || {};
    }

    optionsForValueId = valueId => {
        return this.valueProvider.valueOptions(
            valueId,
            this.valueProvider.entities(valueId)[0],
            ValueMapFilter.Maybe,
        );
    };

    settingsForValueId = valueId => {
        const {values = {}} = this.componentData;
        return values[valueId] || {};
    };

    values = () =>
        this.valueProvider.values().map(value => ({
            ...value,
            valueId: value.id,
            entityLabel:
                value.entities && value.entities[0]
                    ? this.getVehicleName(value.entities[0].uid)
                    : null,
            entityError:
                value.entities && value.entities[0]
                    ? this.getVehicleError(value.entities[0].uid)
                    : null,
        }));
}
