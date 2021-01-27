import {is_set} from 'src/libs/Utils';

import {ValueMapFilter, getValueMapEntries} from 'libs/spec-engine/value-map';
import {getValueParameters} from 'libs/spec-engine/params';
import BaseValueHandler from 'libs/spec-engine/values-handler/base-value-handler';

import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import {FrontendDataType} from 'src/libs/Enums';

export default class HandsontableProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(HandsontableProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        this._tableData = [[]];
        this._componentData = componentData;
        this._mergedCells = componentData.mergedCells || [];
        this._borders = [];

        if (is_set(componentData.cells, true)) {
            this._tableData = [];

            for (let rowIdx = 0; rowIdx < componentData.cells.length; rowIdx++) {
                this._tableData.push([]);
                for (let colIdx = 0; colIdx < componentData.cells[rowIdx].length; colIdx++) {
                    this._tableData.last().push(componentData.cells[rowIdx][colIdx].formula);
                    const borders = componentData.cells[rowIdx][colIdx].borders;
                    if (borders) {
                        this._borders.push({
                            row: rowIdx,
                            col: colIdx,
                            top: borders.top && {width: borders.top},
                            right: borders.right && {width: borders.right},
                            bottom: borders.bottom && {width: borders.bottom},
                            left: borders.left && {width: borders.left},
                        });
                    }
                }
            }
        }

        this._variables = {};
        for (const [valueId, {name, type}] of Object.entries(componentData.variables || {})) {
            const entry = this.staticData[valueId];
            if (type === FrontendDataType.DateValue) {
                this._variables[name] = entry.formattedValue;
                continue;
            }
            this._variables[name] = this._extractVariableData(valueId);
        }
    }

    _extractVariableData = valueId => {
        if (!is_set(this.additionalData.componentDataSpec)) {
            return;
        }

        const variableEntry = this.additionalData.componentDataSpec.values[valueId];

        if (!is_set(variableEntry)) {
            return;
        }
        const entity = (variableEntry.entities || [])[0];

        if (!is_set(entity)) {
            return;
        }

        const {key, params} = variableEntry;
        const valueHash = BaseValueHandler.uniqueValueHash(entity.uid, key, valueId, params);
        return this.valueProvider.value(key, valueHash);
    };

    tableData = () => (is_set(this._tableData, true) ? this._tableData : [[]]);

    variableValue = name => this._variables[name];

    variables = () => this._variables || {};

    isLoading = () => this.additionalData.isLoading;

    mergedCells = () => this._mergedCells;
    borders = () => this._borders;

    columnSizes = () => (this._componentData.columns || []).map(obj => obj.size);
    rowSizes = () => (this._componentData.rows || []).map(obj => obj.size);

    styles = (row, column) =>
        (((this._componentData.cells || [])[row] || [])[column] || {}).styles || {};
}

export class HandsontableSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(HandsontableSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        this._mergedCells = componentData.mergedCells || [];
    }

    getCell = (row, column) => {
        if (!is_set(this.componentData.cells, true)) {
            return {};
        }
        return this.componentData.cells[row][column] || {};
    };

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

    getParams = (entity, valueKey, params) => {
        const valueParams = getValueParameters(
            entity,
            valueKey,
            this.additionalData.valueMap,
            params,
            this.globalParams(),
        );

        const blacklistKeysSet = new Set(['group_by']);
        return Object.filter(valueParams, (_, key) => !blacklistKeysSet.has(key));
    };

    getDateVariable = valueId => ({
        ...this.componentData.staticData[valueId],
        name: this.componentData.variables[valueId].name,
    });

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

    filterMapVariables = (filterStr, valueGetter) =>
        Object.entries(this.componentData.variables || {})
            .filter(([_, {name}]) => name.toLowerCase().includes(filterStr.toLowerCase()))
            .map(([valueId, {name, type}]) => ({
                name,
                valueId,
                variable: `=${name}`,
                type: type === FrontendDataType.DateValue ? 'DATE' : 'DATA',
                formattedValue: valueGetter(name),
            }));

    valueIdForName = name => {
        for (const [valueId, variable] of Object.entries(this.componentData.variables || {})) {
            if (variable.name === name) {
                return valueId;
            }
        }
    };

    isDateVariable = valueId =>
        this.componentData.variables[valueId].type === FrontendDataType.DateValue;

    valueMapEntry = key => {
        return getValueMapEntries(this.additionalData.valueMap, undefined, {value: {key}});
    };

    getValueLabel = valueKey =>
        this.additionalData.valueMap.entries[valueKey] &&
        this.additionalData.valueMap.entries[valueKey].label;

    getVariables = () => {
        if (!this.componentData.variables) {
            return [];
        }
        return Object.entries(this.componentData.variables);
    };

    isMerged = (x, y) =>
        this._mergedCells.find(({row, col, rowspan, colspan}) => {
            return row <= x && x <= row + rowspan - 1 && col <= y && y <= col + colspan - 1;
        });

    styles = (row, column) => {
        // Right now we do not support multi cell/single row selection but the UI does.
        // We cannot be sure what is requested actually exists here. Therefore be defensive.
        if (!this.componentData.cells) {
            return {};
        }
        const rowStyles = this.componentData.cells[row] || [];
        const cell = rowStyles[column] || {};
        return cell.styles || {};
    };
}
