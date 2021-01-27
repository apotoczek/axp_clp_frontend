import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import {FrontendDataType} from 'src/libs/Enums';
import genFormatter from 'utils/formatters';
import {getValueParameters} from 'libs/spec-engine/params';
import {ValueMapFilter, getValueMapEntries} from 'libs/spec-engine/value-map';
import BaseValueHandler from 'libs/spec-engine/values-handler/base-value-handler';
import {is_set} from 'src/libs/Utils';

export default class TextBlockProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(TextBlockProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        this.mapping = {};
        for (const [valueId, variable] of Object.entries(this.componentData.variables || {})) {
            if (variable.name) {
                this.mapping[variable.name] = {...variable, valueId};
            }
        }
    }

    variableNames = () => Object.keys(this.mapping);

    getMapping = variableName => {
        if (!(variableName in this.mapping)) {
            return undefined;
        }
        const variables = this.mapping[variableName];
        const valueId = variables.valueId;
        if (variables.type === FrontendDataType.DateValue) {
            // If it is a DateValue we return that
            return this.staticData[valueId].formattedValue;
        }

        const valueEntry = this.additionalData.componentDataSpec.values[valueId];
        if (!is_set(valueEntry.entities, true) || !is_set(valueEntry.key, true)) {
            return null;
        }
        const valueHash = BaseValueHandler.uniqueValueHash(
            valueEntry.entities[0].uid,
            valueEntry.key,
            valueId,
            valueEntry.params,
        );
        const value = this.valueProvider.data(valueEntry.key, valueHash);

        if (!is_set(value, true)) {
            return null;
        }

        return genFormatter(value.format)(value.value);
    };

    getText = () => {
        return (this.componentData.settings && this.componentData.settings.text) || '';
    };
}

export class TextBlockSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(TextBlockSettingsProvider);

    valueIdForName = name => {
        for (const [valueId, variable] of Object.entries(this.componentData.variables || {})) {
            if (variable.name === name) {
                return valueId;
            }
        }
    };

    isDateVariable = valueId =>
        this.componentData.variables[valueId].type === FrontendDataType.DateValue;

    getDataVariable = valueId => {
        const data = this.valueProvider.data(valueId);
        const params = {};

        for (const [paramKey, param] of Object.entries(data.params)) {
            params[paramKey] = param.value;
        }

        return {
            name: this.componentData.variables[valueId].name,
            entity: data.entities[0],
            valueKey: data.valueKey,
            params,
        };
    };

    getDateVariable = valueId => ({
        ...this.componentData.staticData[valueId],
        name: this.componentData.variables[valueId].name,
    });

    filterMapVariables = (filterStr, valueGetter) =>
        Object.entries(this.componentData.variables || {})
            .filter(([_, {name}]) => name.toLowerCase().includes(filterStr.toLowerCase()))
            .map(([valueId, {name, type}]) => ({
                name,
                valueId,
                variable: `{{${name}}}`,
                type: type === FrontendDataType.DateValue ? 'DATE' : 'VALUE',
                formattedValue: valueGetter(name),
            }));

    getValueLabel = valueKey =>
        this.additionalData.valueMap.entries[valueKey] &&
        this.additionalData.valueMap.entries[valueKey].label;

    getValuesForEntity = (entity, valueParams) => {
        const valueMapEntries = getValueMapEntries(this.additionalData.valueMap, entity, {
            overTime: ValueMapFilter.False,
            grouped: ValueMapFilter.False,
            value: {
                key: undefined,
                isGrouped: is_set(valueParams.group_by) && valueParams.group_by.value,
                isOverTime: is_set(valueParams.over_time) && valueParams.over_time.value,
            },
        });

        return Object.entries(valueMapEntries).map(([valueKey, valueEntry]) => ({
            label: valueEntry.label,
            value: valueKey,
            key: valueKey,
        }));
    };

    getParams = (entity, valueKey, params) =>
        getValueParameters(
            entity,
            valueKey,
            this.additionalData.valueMap,
            params,
            this.globalParams(),
        );

    valueMapEntry = key => {
        return getValueMapEntries(this.additionalData.valueMap, undefined, {value: {key}});
    };
}
