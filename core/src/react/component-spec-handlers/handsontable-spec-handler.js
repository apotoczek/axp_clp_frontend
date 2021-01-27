import uuid from 'uuid/v4';

import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';
import {is_set} from 'src/libs/Utils';
import {FrontendDataType} from 'src/libs/Enums';

export default class HandsonTableSpecHandler extends BaseSpecHandler {
    static _createVariable(payload, componentId, componentData, dataSpec, valueMap) {
        const {name, entity, valueKey, params, valueId: currentValueId} = payload;

        const valueId = currentValueId || uuid();
        const dataSpecValues = dataSpec[componentId].values || {};
        const componentDataEntry = componentData[componentId] || {};
        const variables = componentDataEntry.variables || {};

        variables[valueId] = {name};
        componentDataEntry.variables = variables;

        dataSpecValues[valueId] = {
            entities: [entity],
            type: 'base',
        };
        dataSpec[componentId].values = dataSpecValues;
        let [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler.changeValue(
            {
                valueId,
                key: valueKey,
            },
            componentId,
            componentData,
            {...dataSpec},
            valueMap,
        );

        for (const [key, value] of Object.entries(params)) {
            [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler._changeParameter(
                {
                    valueId,
                    key,
                    value,
                },
                componentId,
                componentData,
                {...updatedDataSpec},
            );
        }

        componentData[componentId] = componentDataEntry;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec: updatedDataSpec, updatedComponents: [componentId]},
        ];
    }

    static _createDateVariable(payload, componentId, componentData, dataSpec) {
        const {name, date, format, valueId: currentValueId} = payload;

        const valueId = currentValueId || uuid();
        const componentDataEntry = componentData[componentId] || {};
        const variables = componentDataEntry.variables || {};

        variables[valueId] = {name, type: FrontendDataType.DateValue};
        componentDataEntry.variables = variables;

        const staticData = componentDataEntry.staticData || {};

        staticData[valueId] = {
            type: FrontendDataType.DateValue,
            format: format,
            date: date,
        };

        componentDataEntry.staticData = staticData;
        componentData[componentId] = componentDataEntry;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _deleteVariables(payload, componentId, componentData, dataSpec) {
        const {valueIds} = payload;
        const componentDataEntry = componentData[componentId];
        let updateDataSpec = false;

        for (const valueId of valueIds) {
            const variablesEntry = componentDataEntry.variables[valueId];

            if (variablesEntry.type === FrontendDataType.DateValue) {
                // Date Values are stored in static data so remove that
                delete componentDataEntry.staticData[valueId];
            } else {
                // It is a regular data value, remove accordingly
                delete dataSpec[componentId].values[valueId];
                updateDataSpec = true;
            }
            // Delete the variable name mapping
            delete componentDataEntry.variables[valueId];
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: updateDataSpec ? [componentId] : []},
        ];
    }

    static _addRow(payload, componentId, componentData, dataSpec) {
        const cells = (componentData[componentId] || {}).cells;
        if (!is_set(cells, true)) {
            componentData[componentId].cells = [[{id: uuid()}]];
            componentData[componentId].rows = [{}];
            componentData[componentId].columns = [{}];
            return [
                {componentData, updatedComponents: [componentId]},
                {dataSpec, updatedComponents: []},
            ];
        }
        const {index = cells.length} = payload;
        const numberOfColumns = cells.last().length;

        // Add cells
        const newCells = [
            ...cells.slice(0, index),
            [...Array(numberOfColumns)].map(() => ({id: uuid()})), // Add new row with empty columns
            ...cells.slice(index),
        ];
        componentData[componentId].cells = newCells;

        // Add row representation
        componentData[componentId].rows.splice(index, 0, {});

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _addColumn(payload, componentId, componentData, dataSpec) {
        const cells = (componentData[componentId] || {}).cells;
        if (!is_set(cells, true)) {
            componentData[componentId].cells = [[{id: uuid()}]];
            componentData[componentId].columns = [{}];
            componentData[componentId].rows = [{}];
            return [
                {componentData, updatedComponents: [componentId]},
                {dataSpec, updatedComponents: []},
            ];
        }
        // Add cells
        const {index = cells[0].length} = payload;
        componentData[componentId].cells = cells.map(row => [
            ...row.slice(0, index),
            {id: uuid()},
            ...row.slice(index),
        ]);

        // Add column representation
        componentData[componentId].columns.splice(index, 0, {});

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _removeRow(payload, componentId, componentData, dataSpec) {
        const {index, amount} = payload;

        componentData[componentId].cells.splice(index, amount);
        componentData[componentId].rows.splice(index, amount);

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _removeColumn(payload, componentId, componentData, dataSpec) {
        const {index, amount} = payload;
        const cells = componentData[componentId].cells;

        const newCells = cells.map(row => [...row.slice(0, index), ...row.slice(index + amount)]);
        componentData[componentId].cells = newCells;
        componentData[componentId].columns.splice(index, amount);
        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _changeVariableName(payload, componentId, componentData, dataSpec) {
        const {valueId, name} = payload;
        componentData[componentId].variables[valueId] = name;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setFormula(payload, componentId, componentData, dataSpec) {
        const {changes} = payload;
        if (!is_set(componentData[componentId].cells)) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }
        for (const [row, column, newValue] of changes) {
            componentData[componentId].cells[row][column].formula = newValue;
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _changeStyle(payload, componentId, componentData, dataSpec) {
        const {row, column, subSelection, key, value} = payload;
        if (!is_set(componentData[componentId].cells)) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }

        if (is_set(subSelection, true)) {
            for (const [x, y] of subSelection) {
                const componentEntry = componentData[componentId].cells[x][y] || {};

                componentEntry.styles = {
                    ...componentEntry.styles,
                    [key]: value,
                };
            }
        } else {
            const componentEntry = componentData[componentId].cells[row][column] || {};

            componentEntry.styles = {
                ...componentEntry.styles,
                [key]: value,
            };
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _mergeCells(payload, componentId, componentData, dataSpec) {
        const {fromCol, fromRow, toCol, toRow} = payload;

        const mergedCells = componentData[componentId].mergedCells || [];

        mergedCells.push({
            row: fromRow,
            col: fromCol,
            rowspan: toRow - fromRow + 1,
            colspan: toCol - fromCol + 1,
        });

        componentData[componentId].mergedCells = mergedCells;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _unmergeCells(payload, componentId, componentData, dataSpec) {
        const {fromCol, fromRow, toCol, toRow} = payload;

        const remove = {
            row: fromRow,
            col: fromCol,
            rowspan: toRow - fromRow + 1,
            colspan: toCol - fromCol + 1,
        };

        const mergedCells = componentData[componentId].mergedCells.filter(
            ({row, col, rowspan, colspan}) => {
                return (
                    row !== remove.row ||
                    col !== remove.col ||
                    rowspan !== remove.rowspan ||
                    colspan !== remove.colspan
                );
            },
        );

        componentData[componentId].mergedCells = mergedCells;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setColSize(payload, componentId, componentData, dataSpec) {
        const {col: colPos, size} = payload;
        componentData[componentId].columns[colPos].size = size;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _setRowSize(payload, componentId, componentData, dataSpec) {
        const {row: rowPos, size} = payload;
        componentData[componentId].rows[rowPos].size = size;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _addBorder(payload, componentId, componentData, dataSpec) {
        const {
            value: {position, width},
            subSelection,
        } = payload;
        if (position === 'top') {
            const topRow = subSelection.reduce(
                (current, [row, _]) => (row < current ? row : current),
                subSelection[0][0],
            );

            for (const [row, col] of subSelection) {
                if (row === topRow) {
                    componentData[componentId].cells[row][col].borders = {
                        ...componentData[componentId].cells[row][col].borders,
                        top: width,
                    };
                }
            }
        } else if (position === 'right') {
            const rightmostColumn = subSelection.reduce(
                (current, [_, col]) => (col > current ? col : current),
                subSelection[0][1],
            );
            for (const [row, col] of subSelection) {
                if (col === rightmostColumn) {
                    componentData[componentId].cells[row][col].borders = {
                        ...componentData[componentId].cells[row][col].borders,
                        right: width,
                    };
                }
            }
        } else if (position === 'bottom') {
            const bottomRow = subSelection.reduce(
                (current, [row, _]) => (row > current ? row : current),
                subSelection[0][0],
            );
            for (const [row, col] of subSelection) {
                if (row === bottomRow) {
                    componentData[componentId].cells[row][col].borders = {
                        ...componentData[componentId].cells[row][col].borders,
                        bottom: width,
                    };
                }
            }
        } else if (position === 'left') {
            const leftmostColumn = subSelection.reduce(
                (current, [_, col]) => (col < current ? col : current),
                subSelection[0][1],
            );
            for (const [row, col] of subSelection) {
                if (col === leftmostColumn) {
                    componentData[componentId].cells[row][col].borders = {
                        ...componentData[componentId].cells[row][col].borders,
                        left: width,
                    };
                }
            }
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _clearBorders(payload, componentId, componentData, dataSpec) {
        for (const [row, col] of payload.subSelection) {
            delete componentData[componentId].cells[row][col].borders;
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }
}
