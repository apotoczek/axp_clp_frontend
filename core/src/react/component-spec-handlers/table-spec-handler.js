import uuid from 'uuid/v4';

import specEngine from 'libs/spec-engine';
import {is_set} from 'src/libs/Utils';

import {getValueMapEntries} from 'libs/spec-engine/value-map';
import {ParamType, CellMode, DateParamType} from 'src/libs/Enums';

import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';

export default class TableSpecHandler extends BaseSpecHandler {
    static _getSection(sectionId, componentData) {
        if (!is_set(sectionId)) {
            return;
        }

        return componentData.sections[sectionId];
    }

    static _getRow(sectionId, rowIdx, componentData) {
        const section = this._getSection(sectionId, componentData);
        if (!is_set(rowIdx) || !is_set(section)) {
            return;
        }

        return section.rows[rowIdx];
    }

    static _getColumn(sectionId, columnIdx, componentData) {
        const section = this._getSection(sectionId, componentData);
        if (!is_set(columnIdx) || !is_set(section)) {
            return;
        }
        return section.columns[columnIdx];
    }

    static _getCell(sectionId, rowIdx, columnIdx, componentData) {
        const section = this._getSection(sectionId, componentData);
        if (!is_set(rowIdx) || !is_set(columnIdx) || !is_set(section)) {
            return;
        }

        return section.cells[rowIdx][columnIdx];
    }

    static _getPartsFromPosition(sectionId, rowIdx, columnIdx, componentData) {
        const section = this._getSection(sectionId, componentData);
        const row = this._getRow(sectionId, rowIdx, componentData);
        const column = this._getColumn(sectionId, columnIdx, componentData);
        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData);

        return [section, row, column, cell];
    }

    static _changeRepeating(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, repeating} = payload;
        const row = this._getRow(sectionId, rowIdx, componentData[componentId]);
        const valueEntry = dataSpec[componentId].values[row.valueId];

        // TODO: This is hacky should not be dependent on the first index etc.
        const entity = (valueEntry.rootEntities || [])[0];

        row.repeating = repeating;

        if (repeating.value === 'userFunds' || repeating.value === 'deals') {
            valueEntry.type = 'tabular';
            valueEntry.rootEntities = [
                {
                    ...entity,
                    repeatFor: repeating.value,
                },
            ];
        } else {
            delete entity.repeatFor;
            valueEntry.entities = [entity];
            valueEntry.type = 'tabular';
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
            true,
        ];
    }

    static _changeEntity(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, entity} = payload;
        const row = this._getRow(sectionId, rowIdx, componentData[componentId]);

        row.valueId = row.valueId || uuid();

        // Make sure the values dict exists
        dataSpec[componentId].values = dataSpec[componentId].values || {};
        const dataSpecValues = dataSpec[componentId].values;

        // Make sure the value object exists for this row
        dataSpecValues[row.valueId] = dataSpecValues[row.valueId] || {};
        const rowValues = dataSpecValues[row.valueId];

        // Find old repeatFor and determine whether or not to keep repeatFor around
        let newRepeatFor;
        const {repeatFor: oldRepeatFor} = (dataSpecValues[row.valueId].rootEntities || [])[0] || {};
        if (oldRepeatFor) {
            const validRepeatFor = {
                userFunds: entity.type !== 'userFund',
                deals: entity.cashflow_type === 'gross',
            };

            if (validRepeatFor[oldRepeatFor]) {
                newRepeatFor = oldRepeatFor;
            } else {
                delete row.repeating;
            }
        }

        const entityObject = {
            uid: entity.entity_uid,
            type: entity.type,
            cashflowType: entity.cashflow_type,
            repeatFor: newRepeatFor,
        };

        dataSpec[componentId].values[row.valueId] = {
            ...rowValues,
            type: 'tabular',
            entities: [entityObject],
            rootEntities: [entityObject],
        };

        if (
            entityObject.type == 'deal' &&
            is_set(dataSpec[componentId].values[row.valueId].params)
        ) {
            delete dataSpec[componentId].values[row.valueId].params.group_by;
        }

        const [updatedDataSpec, updatedComponents] = specEngine.setComponentValues(
            componentId,
            dataSpec[componentId].values,
            dataSpec,
        );

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec: updatedDataSpec || dataSpec, updatedComponents},
            true,
        ];
    }

    static _newSection(payload, componentId, componentData, dataSpec) {
        const {rowCount = 1, columnCount = 1} = payload;
        componentData[componentId].sections = componentData[componentId].sections || {};

        const rows = [];
        const columns = [];
        const cells = [];

        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            rows.push({valueId: uuid()});

            const cellsInRow = [];
            for (let colIdx = 0; colIdx < columnCount; colIdx++) {
                cellsInRow.push({id: uuid(), mode: CellMode.DataValue});
            }

            cells.push(cellsInRow);
        }

        for (let colIdx = 0; colIdx < columnCount; colIdx++) {
            columns.push({});
        }

        const currentRowOrderMax = Object.values(componentData[componentId].sections)
            .map(section => section.order.row)
            .reduce((max, rowOrder) => (rowOrder > max ? rowOrder : max), -1);

        const sectionId = uuid();
        componentData[componentId].sections[sectionId] = {
            order: {row: currentRowOrderMax + 1, column: 0},
            rows,
            columns,
            cells,
        };

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _newRow(payload, componentId, componentData, dataSpec) {
        const {sectionId} = payload;
        const section = this._getSection(sectionId, componentData[componentId]);

        let position = payload.position;
        if (!is_set(position)) {
            position = section.cells.length;
        }

        const valueId = uuid();
        section.rows.splice(position, 0, {valueId, styles: {}});

        const columnCount = section.cells[0]?.length || 0;

        const newRowCells = [];
        for (let i = 0; i < columnCount; i++) {
            newRowCells.push({id: uuid(), mode: CellMode.DataValue});
        }

        section.cells.splice(position, 0, newRowCells);

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _newColumn(payload, componentId, componentData, dataSpec) {
        const {sectionId} = payload;
        const section = this._getSection(sectionId, componentData[componentId]);

        let position = payload.position;
        if (!is_set(position)) {
            position = section.cells[0].length;
        }

        const rowCount = section.cells?.length || 0;

        for (let i = 0; i < rowCount; i++) {
            section.cells[i].splice(position, 0, {id: uuid(), mode: CellMode.DataValue});
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static changeOption(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, key, value} = payload;

        const [section, _row, _column, _cell] = this._getPartsFromPosition(
            sectionId,
            rowIdx,
            columnIdx,
            componentData[componentId],
        );

        if (!is_set(section)) {
            return this.changeSettings({[key]: value}, componentId, componentData, dataSpec);
        } else if (is_set(rowIdx) && is_set(columnIdx)) {
            if (!section.cells[rowIdx] || !section.cells[rowIdx][columnIdx]) {
                section.cells[rowIdx][columnIdx] = {};
            }

            section.cells[rowIdx][columnIdx][key] = value;
        } else if (is_set(rowIdx)) {
            if (!section.rows[rowIdx]) {
                section.rows[rowIdx] = {};
            }

            section.rows[rowIdx][key] = value;
        } else if (is_set(columnIdx)) {
            if (!section.columns[columnIdx]) {
                section.columns[columnIdx] = {};
            }

            section.columns[columnIdx][key] = value;
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setCellMode(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, mode} = payload;

        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);

        cell.mode = mode;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setManualValue(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, value} = payload;

        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);

        cell.manualValue = value;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setCalculatedValue(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, key, value} = payload;

        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);

        const calculatedValue = cell.calculatedValue || {};
        calculatedValue[key] = value;
        cell.calculatedValue = calculatedValue;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setDateValue(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, value} = payload;

        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);
        const dateValue = cell.dateValue || {};
        dateValue.date = value;

        if (!dateValue.format) {
            // Make sure that there is always a default format
            dateValue.format = '{M}/{d}/{yy}';
        }

        cell.dateValue = dateValue;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setDateFormat(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, format} = payload;

        const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);
        const dateValue = cell.dateValue || {};
        dateValue.format = format;

        if (!is_set(dateValue.date, true)) {
            // Make sure that there is always a default date
            dateValue.date = {type: DateParamType.RELATIVE_GLOBAL};
        }

        cell.dateValue = dateValue;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _changeValue(payload, componentId, componentData, dataSpec, valueMap) {
        const {sectionId, row: rowIdx, column: columnIdx, valueKey} = payload;
        const [_section, row, _column, cell] = this._getPartsFromPosition(
            sectionId,
            rowIdx,
            columnIdx,
            componentData[componentId],
        );

        row.valueId = row.valueId || uuid();

        const componentValues = dataSpec[componentId].values;
        componentValues[row.valueId] = componentValues[row.valueId] || {};
        componentValues[row.valueId].values = componentValues[row.valueId].values || {};

        const innerTableValues = componentValues[row.valueId].values;

        // If the cell already has a value inner table value coupled with it,
        // we change that one, otherwise we create a new entry in the data spec.
        if (innerTableValues[cell.valueId]) {
            innerTableValues[cell.valueId].key = valueKey;
            delete innerTableValues[cell.valueId].params;
        } else {
            cell.valueId = uuid();
            innerTableValues[cell.valueId] = {key: valueKey};
        }

        // Set all default parameters
        const entity = componentValues[row.valueId].entities?.[0];
        const valueMapEntry = getValueMapEntries(valueMap, entity, {value: {key: valueKey}});
        let newDataSpec = {...dataSpec};
        for (const [paramKey, param] of Object.entries(valueMapEntry.params || {})) {
            if (!is_set(param.defaultOption)) {
                continue;
            }

            let defaultValue = param.defaultOption;
            if (param.type === ParamType.SINGLE_SELECTION) {
                defaultValue = defaultValue.toString();
            }

            const [_, {dataSpec: updatedDataSpec}] = TableSpecHandler._changeParameter(
                {
                    sectionId,
                    row: rowIdx,
                    column: columnIdx,
                    key: paramKey,
                    value: defaultValue,
                },
                componentId,
                componentData,
                newDataSpec,
            );
            newDataSpec = updatedDataSpec;
            innerTableValues[cell.valueId] =
                updatedDataSpec[componentId].values[row.valueId].values[cell.valueId];
        }

        // Tell spec-engine to update the component values.
        const [finalDataSpec, updatedComponents] = specEngine.setComponentValues(
            componentId,
            componentValues,
            newDataSpec,
        );

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec: finalDataSpec, updatedComponents},
        ];
    }

    static _changeParameter(payload, componentId, componentData, dataSpec) {
        const {
            sectionId,
            row: rowIdx,
            column: columnIdx,
            key: paramKey,
            value: newParamValue,
        } = payload;

        const [_section, row, _column, cell] = this._getPartsFromPosition(
            sectionId,
            rowIdx,
            columnIdx,
            componentData[componentId],
        );

        const componentValues = dataSpec[componentId].values;
        const values = componentValues[row.valueId];
        const innerTableValues = values.values;
        if (cell && cell.valueId) {
            innerTableValues[cell.valueId].params = {
                ...(innerTableValues[cell.valueId].params || {}),
                [paramKey]: newParamValue,
            };
        } else {
            values.params = {
                ...values.params,
                [paramKey]: newParamValue,
            };
        }

        const [updatedDataSpec, updatedComponents] = specEngine.setComponentValues(
            componentId,
            componentValues,
            dataSpec,
        );

        return [
            {componentData, updatedComponents: []},
            {dataSpec: updatedDataSpec, updatedComponents: updatedComponents},
        ];
    }

    static _changeFilterSelection(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx, column: columnIdx, filterKey, value} = payload;

        const [_section, row, _column, _cell] = this._getPartsFromPosition(
            sectionId,
            rowIdx,
            columnIdx,
            componentData[componentId],
        );

        const componentValues = dataSpec[componentId].values;
        const rowValues = componentValues[row.valueId];
        const rowParams = rowValues.params || {};
        const rowFilters = rowParams.filters || {};
        const filterEntry = rowFilters[filterKey] || {};
        const selected = filterEntry.selected || [];
        const exists = selected.indexOf(value);
        if (exists != -1) {
            selected.splice(exists, 1);
        } else {
            selected.push(value);
        }
        const updatedRowFilters = {
            ...rowFilters,
            [filterKey]: {
                ...filterEntry,
                selected,
            },
        };
        if (!is_set(selected, true)) {
            delete updatedRowFilters[filterKey];
        }

        componentValues[row.valueId] = {
            ...rowValues,
            params: {
                ...rowParams,
                filters: updatedRowFilters,
            },
        };

        const [updatedDataSpec, updatedComponents] = specEngine.setComponentValues(
            componentId,
            componentValues,
            dataSpec,
        );

        return [
            {componentData, updatedComponents: []},
            {dataSpec: updatedDataSpec, updatedComponents: updatedComponents},
        ];
    }

    static deleteRow(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: rowIdx} = payload;
        if (!is_set(rowIdx)) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }
        const section = this._getSection(sectionId, componentData[componentId]);
        const row = this._getRow(sectionId, rowIdx, componentData[componentId]);
        // const cell = this._getCell(sectionId, rowIdx, columnIdx, componentData[componentId]);

        // Remove the dataSpec entry for the row
        if (row.valueId && dataSpec[componentId].values) {
            delete dataSpec[componentId].values[row.valueId];
        }

        // Remove all the cells in the row.
        section.cells.splice(rowIdx, 1);

        // Remove the row itself
        section.rows.splice(rowIdx, 1);

        // Did we remove the last row / column? If so, remove the section.
        if (section.cells.isEmpty()) {
            // There is no more rowIdx in the section
            delete componentData[componentId].sections[sectionId];
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static deleteColumn(payload, componentId, componentData, dataSpec) {
        const {sectionId, column: columnIdx} = payload;
        if (!is_set(columnIdx)) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }
        const section = this._getSection(sectionId, componentData[componentId]);
        const rowCount = section.cells.length;

        // Remove the dataSpec entries for each cell.
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            try {
                const row = this._getRow(sectionId, rowIdx, componentData);
                const cell = this._getCell(
                    sectionId,
                    rowIdx,
                    columnIdx,
                    componentData[componentId],
                );
                delete dataSpec[componentId].values[row.valueId].values[cell.valueId];
            } catch (_e) {
                // There is no dataSpec entry for the cell
            }
        }

        // Remove cell from each row.
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            section.cells[rowIdx].splice(columnIdx, 1);
        }

        // Remove the column itself
        section.columns.splice(columnIdx, 1);

        // Did we remove the last row / column? If so, remove the section.
        if (section.cells.isEmpty()) {
            // There is no more rowIdx in the section
            delete componentData[componentId].sections[sectionId];
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static _moveRow(payload, componentId, componentData, dataSpec) {
        const {sectionId, row: fromPos, direction} = payload;
        const section = this._getSection(sectionId, componentData[componentId]);
        const toPos = fromPos + direction;

        // Ensure the move index is within bounds
        if (toPos < section.cells.length && toPos >= 0) {
            // Move cell elements
            const element = section.cells.splice(fromPos, 1)[0];
            section.cells.splice(toPos, 0, element);
            // Move row element
            const rowElement = section.rows.splice(fromPos, 1)[0];
            section.rows.splice(toPos, 0, rowElement);
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _moveColumn(payload, componentId, componentData, dataSpec) {
        const {sectionId, column: fromPos, direction} = payload;
        const section = this._getSection(sectionId, componentData[componentId]);
        const toPos = fromPos + direction;
        if (fromPos < 0 || toPos < 0) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }

        for (const row of section.cells) {
            if (fromPos >= row.length || toPos >= row.length) {
                continue;
            }
            const element = row.splice(fromPos, 1)[0];
            row.splice(toPos, 0, element);
        }

        // Move the column element
        const columnElement = section.columns.splice(fromPos, 1)[0];
        section.columns.splice(toPos, 0, columnElement);

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }
}
