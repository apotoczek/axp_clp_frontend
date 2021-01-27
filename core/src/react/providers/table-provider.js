import uuid from 'uuid/v4';
import moment from 'moment';

import {deepGet, is_set, deep_copy_object} from 'src/libs/Utils';
import {singularizeEntityType} from 'src/libs/Mapping';

import {Format} from 'libs/spec-engine/utils';
import {ValueMapFilter} from 'libs/spec-engine/value-map';
import {getValueParameters} from 'libs/spec-engine/params';
import TabularValueHandler from 'libs/spec-engine/values-handler/tabular-value-handler';

import {CellMode} from 'src/libs/Enums';
import genFormatter from 'utils/formatters';
import {dateSelectionTimestamp, formattedDateSelectionValue} from 'src/helpers/dashboards';
import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';

const userFundsOpt = {key: 'userFunds', label: 'Funds', value: 'userFunds'};
const dealsOpt = {key: 'deals', label: 'Deals', value: 'deals'};
const noOpt = {key: 'nothing', label: 'Nothing', value: null};

const AvailableRepeaters = {
    portfolio: {
        gross: [noOpt, userFundsOpt, dealsOpt],
        net: [noOpt, userFundsOpt],
    },
    user_fund: {
        gross: [noOpt, dealsOpt],
        net: [noOpt],
    },
    deal: {
        gross: [noOpt],
    },
};

function isCellFormat(value, formats) {
    return formats.indexOf(value.format) >= 0;
}

function isDateCell(cell) {
    return (
        cell.cellMode === CellMode.DateValue ||
        (cell.cellMode === CellMode.DataValue &&
            isCellFormat(cell, [Format.Date, Format.BackendDate]))
    );
}

function normalizeCellWithDate(cell, globalDate) {
    const data = cell.cellData;
    if (!is_set(data)) {
        return null;
    }

    if (cell.cellMode === CellMode.DateValue) {
        return dateSelectionTimestamp(cell.cellData.date, globalDate) * 1000;
    } else if (
        cell.cellMode === CellMode.DataValue &&
        isCellFormat(cell, [Format.Date, Format.BackendDate])
    ) {
        return cell.cellData * 1000;
    }

    return null;
}

const aggFunctions = {
    add: (first, second) => {
        const isFirstValid =
            isCellFormat(first, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(first.cellData));
        const isSecondValid =
            isCellFormat(second, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(second.cellData));
        if (!isFirstValid || !isSecondValid) {
            return null;
        }
        return first.cellData + second.cellData;
    },
    sub: (first, second) => {
        const isFirstValid =
            isCellFormat(first, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(first.cellData));
        const isSecondValid =
            isCellFormat(second, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(second.cellData));
        if (!isFirstValid || !isSecondValid) {
            return null;
        }

        return first.cellData - second.cellData;
    },
    mul: (first, second) => {
        const isFirstValid =
            isCellFormat(first, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(first.cellData));
        const isSecondValid =
            isCellFormat(second, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(second.cellData));
        if (!isFirstValid || !isSecondValid) {
            return null;
        }

        return first.cellData * second.cellData;
    },
    div: (first, second) => {
        const isFirstValid =
            isCellFormat(first, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(first.cellData));
        const isSecondValid =
            isCellFormat(second, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(second.cellData));
        if (!isFirstValid || !isSecondValid) {
            return null;
        }

        return first.cellData / second.cellData;
    },
    distance: (first, second, globalDate) => {
        if (isDateCell(first) && isDateCell(second)) {
            const firstTimestamp = normalizeCellWithDate(first, globalDate);
            const secondTimestamp = normalizeCellWithDate(second, globalDate);
            if (!firstTimestamp || !secondTimestamp) {
                return null;
            }

            return Math.abs(moment(firstTimestamp).diff(secondTimestamp, 'days'));
        }

        if (isNaN(parseFloat(first.cellData)) || isNaN(parseFloat(second.cellData))) {
            return Math.abs(second.cellData - first.cellData);
        }

        return null;
    },
    growth: (first, second) => {
        const isFirstValid =
            isCellFormat(first, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(first.cellData));
        const isSecondValid =
            isCellFormat(second, [
                Format.Money,
                Format.Percentage,
                Format.Percent,
                Format.Multiple,
                Format.Integer,
                Format.Float,
            ]) && !isNaN(parseFloat(second.cellData));
        if (!isFirstValid || !isSecondValid) {
            return null;
        }

        return (second.cellData - first.cellData) / first.cellData;
    },
};

export default class TableProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(TableProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const sectionsByRow = _sectionsByRowOrder(this.componentData);
        this._tableData = this._fillTableData(
            _resolveSectionLayout(sectionsByRow, this.additionalData.componentDataSpec),
        );
    }

    _styleValueForCell(row, column, cell, path, defaultValue) {
        return this._optionValueForCell(
            row,
            column,
            cell,
            path,
            defaultValue,
            'inheritCellStylingFrom',
        );
    }

    _textStyleValueForCell(row, column, cell, path, defaultValue) {
        return this._optionValueForCell(
            row,
            column,
            cell,
            path,
            defaultValue,
            'inheritTextStylingFrom',
        );
    }

    _valueFormatValueForCell(row, column, cell, path, defaultValue) {
        return this._optionValueForCell(
            row,
            column,
            cell,
            path,
            defaultValue,
            'inheritValueFormatFrom',
        );
    }

    _optionValueForCell(row, column, cell, path, defaultValue, inheritKey) {
        let inheritsFrom;
        if (inheritKey) {
            inheritsFrom = cell[inheritKey] === undefined ? 'row' : cell[inheritKey];
        }

        const cellValue = deepGet(cell, path, defaultValue);
        if (inheritsFrom === 'column') {
            return deepGet(column, path, defaultValue);
        } else if (inheritsFrom === 'row') {
            return deepGet(row, path, defaultValue);
        }

        return cellValue;
    }

    _borderOptionForCell(parent, cell, path) {
        // Borders are additive
        // Top and bottom borders are derived from row or cell
        // Right and left borders are derived from column or cell
        return deepGet(parent, path, false) || deepGet(cell, path, false);
    }

    _optionsForCell(row, column, cell) {
        const _styleValue = this._styleValueForCell.bind(this, row, column, cell);
        const _optionValue = this._optionValueForCell.bind(this, row, column, cell);
        const _textStyleValue = this._textStyleValueForCell.bind(this, row, column, cell);
        const _valueFormatValue = this._valueFormatValueForCell.bind(this, row, column, cell);
        return {
            isHeader: _styleValue(['isHeader'], false),
            backgroundColor: _styleValue(['backgroundColor']),
            span: _optionValue(['span']),
            textBold: _textStyleValue(['textBold'], false),
            textItalic: _textStyleValue(['textItalic'], false),
            textAlignment: _textStyleValue(['textAlignment']),
            textSize: _textStyleValue(['textSize'], 12),
            displayUnits: _valueFormatValue(['displayUnits']),
            decimalPlaces: _valueFormatValue(['decimalPlaces'], 2),
            showUnit: _valueFormatValue(['showUnit'], true),
            currencySymbol: _valueFormatValue(['currencySymbol']),
            borderTop: this._borderOptionForCell(row, cell, ['borderTop']),
            borderBottom: this._borderOptionForCell(row, cell, ['borderBottom']),
            borderLeft: this._borderOptionForCell(column, cell, ['borderLeft']),
            borderRight: this._borderOptionForCell(column, cell, ['borderRight']),
        };
    }

    _formatterForCell(cell, row) {
        const _getFormatOption = (name, defaultVal) =>
            is_set(cell[name]) ? cell[name] : is_set(row[name]) ? row[name] : defaultVal;

        return genFormatter({
            type: cell.format,
            formatArgs: {
                ...cell.formatArgs,
                abbreviate: !!_getFormatOption('displayUnits', false),
                abbreviateAs: _getFormatOption('displayUnits', undefined),
                decimals: _getFormatOption('decimalPlaces', 2),
                showUnit: _getFormatOption('showUnit', true),
                currencySymbol: _getFormatOption('currencySymbol'),
            },
        });
    }

    _cellDataForManualCell = cell => [false, {value: cell.manualValue}];

    _cellDataForDateCell = cell => [false, {value: cell.dateValue}];

    _cellDataForCalculatedCell = cell => [false, {value: cell.calculatedValue}];

    _decideCalculatedValueFormat = (leftCell, operator, rightCell) => {
        if (operator === 'div') {
            if (leftCell.format === rightCell.format) {
                return 'multiple';
            }
            return leftCell.format;
        } else if (operator === 'mul') {
            return leftCell.format === 'integer' ? rightCell.format : leftCell.format;
        } else if (operator === 'growth') {
            return 'percentage';
        } else if (operator === 'distance') {
            if (isDateCell(leftCell) && isDateCell(rightCell)) {
                return 'date_distance';
            }

            return leftCell.format;
        }
        return leftCell.format;
    };

    _getCell = (rowIdx, columnIdx, tableData) => {
        if (
            rowIdx >= tableData.length ||
            columnIdx >= tableData[rowIdx].columns.length ||
            rowIdx < 0 ||
            columnIdx < 0
        ) {
            return {};
        }

        // return {format: cell.format, formatArgs: cell.formatArgs, unformatted: cell.cellData};
        return tableData[rowIdx].columns[columnIdx];
    };

    _calculatedValueForCell = (calculatedCell, rowIdx, tableData) => {
        const {first, second, operator, firstRow, secondRow} = calculatedCell.cellData;
        const aggFunction = aggFunctions[operator];

        // Default to current rowIdx if not specified
        const operandOneRow = firstRow || rowIdx + 1;
        const operandTwoRow = secondRow || rowIdx + 1;

        const firstCell = this._getCell(operandOneRow - 1, first - 1, tableData);
        const secondCell = this._getCell(operandTwoRow - 1, second - 1, tableData);

        let format;
        let formatArgs;

        const globalDate = this.additionalData.globalParams.globalDate;
        const unformattedValue = aggFunction(firstCell, secondCell, globalDate);

        if (unformattedValue === null) {
            return [format, formatArgs, ''];
        }

        if (calculatedCell.cellData.format) {
            format = calculatedCell.cellData.format;
            formatArgs = {};
        } else {
            format = this._decideCalculatedValueFormat(firstCell, operator, secondCell);
            formatArgs = format === firstCell.format ? firstCell.formatArgs : {};
        }

        return [format, formatArgs, unformattedValue];
    };

    _cellDataForDataCell = (row, cell, entity) => {
        const {componentDataSpec = {}} = this.additionalData;
        const {values: valueSpecifications = {}} = componentDataSpec;
        const rowValueSpecification = valueSpecifications[row.valueId];
        const cellValueSpecification = valueSpecifications[row.valueId].values[cell.valueId];
        if (!cellValueSpecification.key || !is_set(entity, true)) {
            if (
                rowValueSpecification &&
                rowValueSpecification.params &&
                is_set(rowValueSpecification.params.group_by)
            ) {
                return [true, undefined];
            }
            return [false, undefined];
        }
        const valueHash = TabularValueHandler.uniqueValueHash(
            entity.uid,
            cellValueSpecification.key,
            cell.valueId,
            {...rowValueSpecification.params, ...cellValueSpecification.params},
        );

        if (this.valueProvider.isDataGrouped(valueHash)) {
            const data = this.valueProvider.valuesByGroup(valueHash);
            return [true, data];
        }

        const cellData = this.valueProvider.data(cellValueSpecification.key, valueHash) || {};
        return [false, cellData];
    };

    _sortRowsFn = (row, newRows) => {
        const {sortByColumn} = row;
        if (!is_set(sortByColumn) || newRows.length <= sortByColumn) {
            return () => 0;
        }

        // Operator generator depending on if sorting ascending or descending
        const op = row.sortDesc ? (a, b) => a < b : (a, b) => a > b;

        return (fst, snd) => {
            const fstValue = fst.columns[sortByColumn].cellData;
            const sndValue = snd.columns[sortByColumn].cellData;

            if (fstValue === undefined) {
                return 1;
            } else if (sndValue === undefined) {
                return -1;
            }

            return op(fstValue, sndValue) ? 1 : -1;
        };
    };

    _validCalculatedCell = calculatedValue => {
        return (
            is_set(calculatedValue, true) &&
            is_set(calculatedValue.first, true) &&
            is_set(calculatedValue.operator, true) &&
            is_set(calculatedValue.second, true)
        );
    };

    /**
     * Inserts data into a collection of rows. Considers whether or not the data is grouped, and if
     * so inserts the correct data at the correct group, while at the same time copying the
     * non-grouped to each new row created for each group.
     *
     * @param {string / number / object} value The value that should be inserted to each row at
     * column `colIdx`.
     * @param {object} rows An object representing each row that the value should be inserted into.
     * @param {number} colIdx The index of the column to insert value at on each row.
     * @returns {object} An object representing each row that now has value inserted at column
     * `colIdx`.
     */
    _expandGroupedRow = (rows, colIdx, cellData = {}, cellMode, options) => {
        const newRows = deep_copy_object(rows);

        for (const [key, value] of Object.entries(cellData)) {
            if (newRows[key] === undefined) {
                newRows[key] = deep_copy_object(rows._bDefaultRow);
            }
            newRows[key].name = value.groupLabel;
            newRows[key].columns[colIdx] = {
                rawValue: value.value,
                format: value.format,
                formatArgs: value.formatArgs,
                valueKey: value.valueKey,
                cellMode,
                ...options,
            };
        }

        return Object.map(newRows, val => ({
            ...val,
            columns: val.columns.map(col => ({...col, id: uuid()})),
        }));
    };

    _insertRowData(row, colIdx, cellData = {}, cellMode, options) {
        const newRow = deep_copy_object(row);

        newRow.columns[colIdx] = {
            id: uuid(),
            rawValue: cellData.value,
            format: cellData.format,
            formatArgs: cellData.formatArgs,
            valueKey: cellData.valueKey,
            cellMode,
            ...options,
        };

        return newRow;
    }

    _formatValues = rows => {
        const newRows = deep_copy_object(rows);

        for (const [rowId, row] of Object.entries(newRows)) {
            for (const [colIdx, cell] of row.columns.entries()) {
                let value;
                if (cell.cellMode === CellMode.DateValue) {
                    value = formattedDateSelectionValue(
                        (cell.rawValue || {}).date || {},
                        this.additionalData.globalParams.globalDate,
                        (cell.rawValue || {}).format,
                    );
                } else {
                    const formatter = this._formatterForCell(cell, row);
                    value = formatter(cell.rawValue);
                }

                newRows[rowId].columns[colIdx] = {
                    ...newRows[rowId].columns[colIdx],
                    value,
                    cellData: cell.rawValue,
                };
            }
        }

        return newRows;
    };

    _fillCalculatedCells = tableData => {
        for (const [rowIdx, row] of tableData.entries()) {
            for (const [colIdx, cell] of row.columns.entries()) {
                if (
                    cell.cellMode !== CellMode.CalculatedValue ||
                    !this._validCalculatedCell(cell.cellData)
                ) {
                    continue;
                }
                const [format, formatArgs, unformattedValue] = this._calculatedValueForCell(
                    cell,
                    rowIdx,
                    tableData,
                );
                const formatter = this._formatterForCell({...cell, format, formatArgs}, row);
                tableData[rowIdx].columns[colIdx] = {
                    ...tableData[rowIdx].columns[colIdx],
                    id: uuid(),
                    value: formatter(unformattedValue),
                    cellData: unformattedValue,
                };
            }
        }
    };

    _fillTableData = resolvedSectionLayout => {
        const tableData = [];
        const {componentDataSpec = {}} = this.additionalData;
        for (const section of resolvedSectionLayout) {
            for (const [rowIdx, rowOfCells] of section.cells.entries()) {
                const row = section.rows[rowIdx];

                const {values: valueSpecifications = {}} = componentDataSpec;
                const valueSpecification = valueSpecifications[row.valueId] || {};

                // These are the new rows for this row. Multiple rows are created if we have
                // repeating specified on the row.
                let newRows = [];

                const entities = valueSpecification.entities || [{}];
                for (const entity of entities) {
                    if (Object.keys(rowOfCells).length == 0) {
                        // Add an empty row if we have no cells yet
                        return [];
                    }

                    // This is the new rows for this entity, multiple rows are created if there
                    // is a breakdown specified.
                    let _newRows = {_bDefaultRow: {columns: []}};
                    const groupedColumns = [];

                    for (const [colIdx, cell] of rowOfCells.entries()) {
                        const column = section.columns[colIdx];

                        let isGrouped, cellData;
                        const cellMode = cell.mode;

                        if (cellMode == CellMode.DataValue && cell.valueId) {
                            [isGrouped, cellData = {}] = this._cellDataForDataCell(
                                row,
                                cell,
                                entity,
                            );
                        } else if (cellMode == CellMode.DateValue) {
                            [isGrouped, cellData] = this._cellDataForDateCell(cell);
                        } else if (cellMode == CellMode.ManualValue) {
                            [isGrouped, cellData = {}] = this._cellDataForManualCell(cell);
                        } else if (
                            cellMode == CellMode.CalculatedValue &&
                            this._validCalculatedCell(cell.calculatedValue)
                        ) {
                            // Calculated cells are saved and calculated later, once we filled in
                            // all of the data in the table.
                            [isGrouped, cellData = {}] = this._cellDataForCalculatedCell(cell);
                        } else {
                            [isGrouped, cellData] = [false, {}];
                        }

                        if (isGrouped) {
                            const col = {
                                colIdx,
                                cellData,
                                cellMode,
                                optionsForCell: this._optionsForCell(row, column, cell),
                            };
                            groupedColumns.push(col);
                        }
                        // Data or empty placeholder for grouped ones
                        _newRows._bDefaultRow = this._insertRowData(
                            _newRows._bDefaultRow,
                            colIdx,
                            isGrouped ? {} : cellData,
                            cellMode,
                            this._optionsForCell(row, column, cell),
                        );
                    }

                    // Add grouped AFTER individual ones to avoid deletion of _bDefaultRow
                    for (const groupedColumn of groupedColumns) {
                        _newRows = this._expandGroupedRow(
                            _newRows,
                            groupedColumn.colIdx,
                            groupedColumn.cellData,
                            groupedColumn.cellMode,
                            groupedColumn.optionsForCell,
                        );
                    }

                    if (is_set(groupedColumns, true)) {
                        delete _newRows._bDefaultRow;
                    }

                    _newRows = this._formatValues(_newRows);

                    newRows.push(_newRows);
                }

                const unsortedRows = newRows
                    .map(r => (Object.isObject(r) ? Object.values(r) : r))
                    .flatten(1);
                const sortedRows = unsortedRows.sort(this._sortRowsFn(row, unsortedRows));

                tableData.push(...sortedRows);
            }

            // Go through all calculated cells now that all the data has been filled in.
            this._fillCalculatedCells(tableData);
        }
        return tableData;
    };

    tableData = () => {
        const tableData = [];
        for (const [rowIdx, row] of this._tableData.entries()) {
            tableData[rowIdx] = row.columns.map(cell => ({
                id: cell.id,
                label: cell.value,
                header: cell.isHeader,
                colSpan: cell.span,
                selected: false,
                isMovable: false,
                backgroundColor: cell.backgroundColor,
                textAlignment: cell.textAlignment,
                textBold: cell.textBold,
                textItalic: cell.textItalic,
                textSize: cell.textSize,
                rawValue: cell.cellData,
                format: cell.format,
                cellMode: cell.cellMode,
                borderTop: cell.borderTop,
                borderBottom: cell.borderBottom,
                borderLeft: cell.borderLeft,
                borderRight: cell.borderRight,
            }));
        }
        return tableData;
    };

    exportDataForCell(cell) {
        if (isDateCell(cell)) {
            return cell.label;
        }

        return cell.rawValue;
    }
}

export class TableSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(TableSettingsProvider);

    constructor(valueProvider, componentData, additionalData) {
        super(valueProvider, componentData, additionalData);

        const sectionsByRow = _sectionsByRowOrder(this.componentData);
        const resolvedSectionLayout = _resolveSectionLayout(
            sectionsByRow,
            this.additionalData.componentDataSpec,
        );
        this._tableData = this._fillTableData(resolvedSectionLayout);
    }

    _fillTableData = resolvedSectionLayout => {
        const tableData = {};

        for (const section of resolvedSectionLayout) {
            tableData[section.id] = {rows: [], cells: [], columns: []};

            for (const column of section.columns) {
                tableData[section.id].columns.push({...column});
            }

            for (const [rowIdx, rowOfCells = []] of section.cells.entries()) {
                const row = section.rows[rowIdx];

                // TODO: Migrate to breakdown by vehicle instead of repeating with rootEntities.
                tableData[section.id].rows.push({valueId: row.valueId, ...section.rows[rowIdx]});

                // const dataSpecValues = dataSpec.values && dataSpec.values[row.valueId];
                const cellsInRow = rowOfCells.map((cell, colIdx) => {
                    let value;
                    const {valueKey, valueLabel} =
                        this.valueProvider.data(`${row.valueId}${cell.valueId}`) || {};

                    if (cell.mode == CellMode.DataValue && cell.valueId) {
                        value = valueLabel;
                    } else if (cell.mode == CellMode.DateValue) {
                        value = formattedDateSelectionValue(
                            (cell.dateValue || {}).date || {},
                            this.additionalData.globalParams.globalDate,
                            (cell.dateValue || {}).format,
                        );
                    } else if (cell.mode == CellMode.ManualValue) {
                        value = cell.manualValue;
                    } else if (cell.mode == CellMode.CalculatedValue) {
                        value = 'Calculated';
                    }

                    return {
                        id: cell.id,
                        valueId: cell.valueId,
                        valueKey,
                        ...section.cells[rowIdx][colIdx],
                        value,
                    };
                });

                tableData[section.id].cells.push(cellsInRow);
            }
        }

        return tableData;
    };

    _getSection = sectionId => this._tableData[sectionId];

    _getRow = (sectionId, rowIdx) => {
        const section = this._getSection(sectionId);
        if (!is_set(section)) {
            return;
        }

        return section.rows[rowIdx];
    };

    _getCell = (sectionId, rowIdx, columnIdx) => {
        const section = this._getSection(sectionId);
        if (!is_set(section)) {
            return;
        }

        return section.cells[rowIdx][columnIdx];
    };

    _getColumn = (sectionId, columnIdx) => {
        const section = this._getSection(sectionId);
        if (!is_set(section)) {
            return;
        }

        return section.columns[columnIdx];
    };

    getCellValue = (sectionId, rowIdx, columnIdx) => {
        const row = this._getRow(sectionId, rowIdx);
        const cell = this._getCell(sectionId, rowIdx, columnIdx);
        if (!cell) {
            return;
        }

        const data = this.valueProvider.data(`${row.valueId}${cell.valueId}`) || {};
        return {...cell, value: data.valueLabel};
    };

    formattedDate = (date, format) =>
        formattedDateSelectionValue(date, this.additionalData.globalParams.globalDate, format);

    dateTimestamp = date =>
        dateSelectionTimestamp(date, this.additionalData.globalParams.globalDate);

    _calculatedIsSet = value =>
        value &&
        is_set(value.first, true) &&
        is_set(value.operator, true) &&
        is_set(value.second, true);

    tableData = () => {
        const tableData = {};

        for (const [sectionId, section] of Object.entries(this._tableData)) {
            tableData[sectionId] = [];
            let sectionBaseRow = 0;
            for (const [rowIdx, rowOfCells = []] of section.cells.entries()) {
                const row = this._getRow(sectionId, rowIdx);
                tableData[sectionId].push({...row, sectionId, columns: []});

                const finalRowIndex = sectionBaseRow + rowIdx;
                tableData[sectionId][finalRowIndex].columns = rowOfCells.map(cell => {
                    return {
                        id: cell.id,
                        sectionId,
                        value: cell.value,
                        span: cell.span,
                    };
                });
            }
            sectionBaseRow++;
        }

        return tableData;
    };

    hasCalculated = (sectionId, row, col) => {
        const cell = this._getCell(sectionId, row, col);
        return cell && this._calculatedIsSet(cell.calculatedValue);
    };

    getSelectedEntityUid = (sectionId, rowIdx, colIdx) => {
        const cell = this._getCell(sectionId, rowIdx, colIdx);
        const row = this._getRow(sectionId, rowIdx);

        const data =
            this.valueProvider.data(oneLine`
            ${(row && row.valueId) || ''}${(cell && cell.valueId) || ''}
        `) || {};
        const entities = is_set(data.rootEntities, true) ? data.rootEntities : data.entities || [];

        return entities[0] && entities[0].uid;
    };

    getSelectedRepeatOption = (sectionId, rowIdx) => {
        const row = this._getRow(sectionId, rowIdx);
        return (row && row.repeating) || {label: 'Nothing'};
    };

    getOptions = (sectionId, rowIdx, colIdx) => {
        const cell = this._getCell(sectionId, rowIdx, colIdx);
        const row = this._getRow(sectionId, rowIdx);

        return cell || row || {};
    };

    optionValueForCell(
        sectionId,
        rowIdx,
        columnIdx,
        path,
        defaultValue,
        inheritKey,
        notSetChecker,
    ) {
        const cell = this._getCell(sectionId, rowIdx, columnIdx);
        const row = this._getRow(sectionId, rowIdx);
        const column = this._getColumn(sectionId, columnIdx);

        let inheritsFrom;
        if (inheritKey) {
            inheritsFrom = cell[inheritKey] === undefined ? 'row' : cell[inheritKey];
        }

        const cellValue = deepGet(cell, path, defaultValue, notSetChecker);
        if (inheritsFrom === 'column') {
            return deepGet(column, path, defaultValue, notSetChecker);
        } else if (inheritsFrom === 'row') {
            return deepGet(row, path, defaultValue, notSetChecker);
        }

        return cellValue;
    }

    optionValueForRow(sectionId, rowIdx, path, defaultValue, notSetChecker) {
        // TODO: Inherit from table
        const row = this._getRow(sectionId, rowIdx);
        return deepGet(row, path, defaultValue, notSetChecker);
    }

    optionValueForColumn(sectionId, columnIdx, path, defaultValue, notSetChecker) {
        // TODO: Inherit from table
        const column = this._getColumn(sectionId, columnIdx);
        return deepGet(column, path, defaultValue, notSetChecker);
    }

    /**
     * Get possible repeat options given a section. The sections needs to have an
     * entity defined.
     */
    getRepeatOptions = (sectionId, row, _column) => {
        const entityUid = this.getSelectedEntityUid(sectionId, row);
        const entity = this.getVehicle(entityUid);

        return entity ? AvailableRepeaters[entity.entity_type][entity.cashflow_type] : [];
    };

    repeatDisabled = (sectionId, rowIdx) => {
        const groupBy = this.getRowGroupingParams(sectionId, rowIdx);
        return is_set(groupBy, true) ? !!groupBy.value : false;
    };

    getValueId = (sectionId, rowIdx, columnIdx) => {
        // TODO: This must support multiple rows in a section
        const cell = this._getCell(sectionId, rowIdx, columnIdx);
        const row = this._getRow(sectionId, rowIdx);

        return (is_set(cell) && cell.valueId) || (is_set(row) && row.valueId) || undefined;
    };

    getNbrOfCellsInRow = (sectionId, row) => this._getSection(sectionId).cells[row].length || 0;

    getAvailableEntities = () =>
        Object.values(this.additionalData.baseEntities).map(vehicle => ({
            label: vehicle.entity_name,
            key: vehicle.entity_uid,
            description: vehicle.description,
            value: {
                entity_uid: vehicle.entity_uid,
                type: vehicle.entity_type.camelize(false),
                cashflow_type: vehicle.cashflow_type,
            },
        }));

    getAvailableValues = (sectionId, rowIdx, colIdx) => {
        const selectedEntityUid = this.getSelectedEntityUid(sectionId, rowIdx, colIdx);
        const selectedEntity = this.getVehicle(selectedEntityUid);

        const cell = this._getCell(sectionId, rowIdx, colIdx);
        const {value: repeatValue} = this.getSelectedRepeatOption(sectionId, rowIdx) || {};
        const entityType =
            (repeatValue && repeatValue.camelize(false)) ||
            (selectedEntity && selectedEntity.entity_type.camelize(false));
        const entity = {
            type: entityType ? singularizeEntityType(entityType) : undefined,
            cashflowType: selectedEntity && selectedEntity.cashflow_type,
        };
        const rowParams = this.getRowParams(sectionId, rowIdx);
        const groupBy = rowParams.group_by || {};
        const filters = rowParams.filters || {};

        const isFiltered = Object.values(filters).reduce(
            (accumulator, {selected}) => accumulator || is_set(selected, true),
            false,
        );

        return this.valueProvider.valueOptions(
            cell.valueId,
            entity,
            ValueMapFilter.False,
            is_set(groupBy, true) && groupBy.value ? ValueMapFilter.Maybe : ValueMapFilter.False,
            isFiltered ? ValueMapFilter.True : ValueMapFilter.Maybe,
        );
    };

    getSelectedValueParams = (sectionId, rowIdx, columnIdx) => {
        const cell = this._getCell(sectionId, rowIdx, columnIdx);
        const row = this._getRow(sectionId, rowIdx);
        const {params = {}} = this.valueProvider.data(`${row.valueId}${cell.valueId}`) || {};

        // Filter out group_by param, since we select grouping on the row instead of on the cell.
        const filteredParams = Object.filter(params, (_entry, key) => key !== 'group_by');

        return filteredParams;
    };

    getRowParams = (sectionId, rowIdx) => {
        const row = this._getRow(sectionId, rowIdx);
        const data = this.valueProvider.data(row.valueId) || {};
        const entity = data.entities && data.entities[0];

        const valueParameters = getValueParameters(
            entity,
            'irr',
            this.additionalData.valueMap,
            this.valueProvider.rawParamValuesForValueId(row.valueId),
        );
        return valueParameters;
    };

    getRowGroupingParams = (sectionId, rowIdx) => {
        return this.getRowParams(sectionId, rowIdx).group_by || {};
    };

    groupedByDisabled = (sectionId, rowIdx) => {
        const {value} = this.getSelectedRepeatOption(sectionId, rowIdx) || {};
        return is_set(value, true);
    };

    sectionIdx(sectionId) {
        return Object.entries(this._tableData).findIndex(([id, _]) => id === sectionId);
    }
}

/**
 * Groups the sections in the table by the row in which they are rooted in.
 * The sections in each group (row) are sorted by the column order.
 *
 * @param {object} componentData The component data object from the
 * dashboard spec that relates to the component that this provider is for.
 * @returns {Array} An array of arrays where each inner array is one row
 * in the table. The content of the inner arrays are the layout parameters
 * of a section in the table.
 */
function _sectionsByRowOrder(componentData) {
    const {sections = {}} = componentData || {};

    const sectionsByRowOrder = [];
    for (const [sectionId, section] of Object.entries(sections)) {
        const {
            order: {row: rowOrder},
        } = section;

        sectionsByRowOrder[rowOrder] = sectionsByRowOrder[rowOrder] || [];
        sectionsByRowOrder[rowOrder].push({...section, id: sectionId});
    }

    return sectionsByRowOrder.map(s => s.sortBy(({order}) => order.column));
}

/**
 * Determines what direction to push a section in the table if it collides
 * with the first provided section
 *
 * @param {Array} sectionBounds An array with bounding co-ordinates for the
 * section that will not be pushed anywhere.
 * @param {Array} compareSectionBounds An array with bounding co-ordinates
 * for the section that should be pushed away to make space for the first
 * section.
 * @returns {string} One of 'x', 'y', 'both' or 'none'. This is the
 * direction that the second section should be pushed to make space for the
 * first one in the table.
 */
function _pushDirection(sectionBounds, compareSectionBounds) {
    const collides =
        // x
        (compareSectionBounds[0] >= sectionBounds[0] &&
            compareSectionBounds[0] <= sectionBounds[2] &&
            // y
            compareSectionBounds[1] >= sectionBounds[1] &&
            compareSectionBounds[1] <= sectionBounds[3]) ||
        (compareSectionBounds[3] >= sectionBounds[1] &&
            compareSectionBounds[3] <= sectionBounds[3]);
    if (!collides) {
        return 'none';
    }

    let xDiff = compareSectionBounds[0] - sectionBounds[0];
    let yDiff = compareSectionBounds[1] - sectionBounds[1];

    if (xDiff > yDiff || yDiff < 0) {
        return 'x';
    } else if (xDiff < yDiff) {
        return 'y';
    }

    return 'both';
}

/**
 * Resolves the layout of the sections in the table such that they don't
 * overlay each other. This function determines how sections are layed out
 * in the table.
 *
 * @param {Array} sectionsByRowOrder An array of arrays, where the
 * inner array is a row in the table, and the content of the inner array is
 * the table section definitions in that row.
 * @returns {Array} An array of arrays with layout data that has been
 * modified such that no sections overlay each other.
 */
function _resolveSectionLayout(sectionsByRowOrder, dataSpecValues) {
    // Initialize the layout with the starting row and column. Also add in
    // the width and height of the section.
    const unresolvedSections = sectionsByRowOrder.map(sections =>
        sections.map(section => {
            let width = 1;
            let height = 1;
            const {
                table = [],
                order: {row: rowOrder, column: columnOrder},
            } = section;

            for (const row of table) {
                let maxColHeight = 1;
                for (const col of row) {
                    const {valueId, span = 1} = col;
                    if (!valueId || !dataSpecValues) {
                        width += span;
                    } else {
                        const {value} = dataSpecValues[valueId] || {};
                        if (value && value.type === 'tabular') {
                            maxColHeight = 2; // value.rows.entities.length
                        }
                    }
                }
                height += Math.max(height, maxColHeight);
            }

            return {
                ...section,
                width,
                height,
                row: rowOrder,
                column: columnOrder,
            };
        }),
    );

    const resolvedSections = [...unresolvedSections];
    for (let i = 0; i < resolvedSections.length; i++) {
        const sections = resolvedSections[i];
        for (const section of sections) {
            const sectionBounds = [
                section.column,
                section.row,
                section.column + section.width,
                section.row + section.height,
            ];
            for (let j = i + 1; j < resolvedSections.length; j++) {
                const compareSection = resolvedSections[j];
                const compareSectionBounds = [
                    compareSection.column,
                    compareSection.row,
                    compareSection.column + compareSection.width,
                    compareSection.row + compareSection.height,
                ];

                const pushDirection = _pushDirection(sectionBounds, compareSectionBounds);

                switch (pushDirection) {
                    case 'x':
                        compareSection.column = section.y + section.width;
                        break;

                    case 'y':
                        compareSection.row = section.x + section.height;
                        break;

                    case 'both':
                        // TODO (Simon 22 May 2018) What do we do in this
                        // scenario? Moving in both directions is probably not
                        // what we want to do. Let the user define relations
                        // between sections.
                        compareSection.column = section.y + section.width;
                        compareSection.row = section.x + section.height;
                        break;

                    case 'none':
                        continue;
                }
            }
        }
    }

    return resolvedSections.flatten();
}
