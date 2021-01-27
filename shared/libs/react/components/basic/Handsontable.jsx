import React from 'react';
import Handsontable from 'handsontable';
import CobaltSpreadsheet from 'src/libs/react/components/basic/CobaltSpreadsheet';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import isEqual from 'lodash.isequal';

import {is_set} from 'src/libs/Utils';

import {gen_date_formatter} from 'src/libs/Formatters';

const Wrapper = styled.div`
    font-size: 12px;
    text-align: center;

    width: 100%;
    height: 100%;

    /*Override handsontable gray color when read only mode*/
    .htDimmed {
        color: #000000;
    }
`;

function customRender(dataProvider) {
    return function renderer(instance, td, row, col, prop, value, _cellProperties) {
        const styles = dataProvider.styles(row, col);
        if (!isNaN(value || NaN) && styles.format == 'date') {
            const formatter = gen_date_formatter(styles.dateFormat);
            const newValue = formatter(value * 1000);
            Handsontable.renderers.TextRenderer.apply(this, [
                instance,
                td,
                row,
                col,
                prop,
                newValue,
                _cellProperties,
            ]);
        } else if (!isNaN(value || NaN)) {
            Handsontable.renderers.NumericRenderer.apply(this, [
                instance,
                td,
                row,
                col,
                prop,
                parseFloat(value),
                _cellProperties,
            ]);
        } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
        }

        if (styles.bold) {
            // Without a WebkitFilter, text-shadow styling is not applied when exporting.
            // An opacity(1), no-op, filter is applied to circumvent this.
            td.style.WebkitFilter = 'opacity(1)';
            td.style.textShadow = '0px 0px .65px #333';
        }
        if (styles.italic) {
            td.style.fontStyle = 'italic';
        }
        if (styles.color) {
            td.style.color = styles.color;
        }
        if (styles.backgroundColor) {
            td.style.background = styles.backgroundColor;
        }
        if (!dataProvider.settingsValueForComponent(['gridLines'], true)) {
            td.style.border = 'none';
        }

        if (styles.stroke || styles.underline) {
            td.style.textDecoration =
                (styles.stroke ? 'line-through ' : '') + (styles.underline ? 'underline' : '');
        }
        if (is_set(styles.fontSize)) {
            td.style.fontSize = `${styles.fontSize}px`;
        }
    };
}

class HandsontableComponent extends React.Component {
    static propTypes = {
        dataProvider: PropTypes.object.isRequired,
        sharedState: PropTypes.object,
        onSharedStateChange: PropTypes.func,
    };

    tableRef = React.createRef();

    componentDidUpdate(prevProps) {
        const {dataProvider: currentProvider, isSelected} = this.props;
        const {dataProvider: oldProvider} = prevProps;
        const currentVariables = currentProvider.variables();
        const oldVariables = oldProvider.variables();
        const currentBorders = currentProvider.borders();
        const oldBorders = oldProvider.borders();

        if (prevProps.isSelected && !isSelected) {
            this.tableRef.current.hotInstance.deselectCell();
        }
        /*
            We need to explicitly use the `setVariable` method on the instance to update variables.
            Simply changing the settings object sent to HOT does not update the variables.
        */
        if (!isEqual(currentVariables, oldVariables)) {
            const formulasInstance = this.tableRef.current.hotInstance.getPlugin('Formulas');
            for (const [name, value] of Object.entries(currentVariables)) {
                formulasInstance.setVariable(name, value);
            }
            // We have new variables so need to recalculate or re-render the component
            formulasInstance.recalculate();
            this.forceUpdate();
        }
        if (!isEqual(currentBorders, oldBorders)) {
            const bordersInstance = this.tableRef.current.hotInstance.getPlugin('CustomBorders');
            bordersInstance.clearBorders(this.tableRef.current.hotInstance.getSelectedRange());
            this.tableRef.current.hotInstance.updateSettings({
                customBorders: currentBorders,
            });
        }
    }
    /*
        NOTE: the setTimeout solution is a workaround because of the implementation
        In HOT, after the create hooks have been called it immediately references itself
        (`this``). Because if the data prop updates the component is re-rendered and `this`.
        Therefore we need to postpone the redux change so HOT can do its thing before we
        re-render. (Any other solution to this would obviously be gladly accepted.)
    */
    handleCreateRow = (index, _amount, _source) => {
        setTimeout(() => this.props.onSettingsChanged('addRow', {index}), 0);
    };

    handleCreateColumn = (index, _amount, _source) => {
        setTimeout(() => this.props.onSettingsChanged('addColumn', {index}), 0);
    };

    handleRemoveRow = (index, amount, _source) => {
        setTimeout(() => this.props.onSettingsChanged('removeRow', {index, amount}), 0);
    };

    handleRemoveColumn = (index, amount, _source) => {
        setTimeout(() => this.props.onSettingsChanged('removeColumn', {index, amount}), 0);
    };

    handleMergeCells = (cellRange, auto) => {
        if (auto) {
            return;
        }

        const {from, to} = cellRange;
        this.props.onSettingsChanged('mergeCells', {
            fromRow: from.row,
            fromCol: from.col,
            toRow: to.row,
            toCol: to.col,
        });
    };

    handleUnmergeCells = (cellRange, auto) => {
        if (auto) {
            return;
        }
        const {from, to} = cellRange;
        this.props.onSettingsChanged('unmergeCells', {
            fromRow: from.row,
            fromCol: from.col,
            toRow: to.row,
            toCol: to.col,
        });
    };

    handleCellAlignment = (_stateBefore, range, type, alignmentClass) => {
        const {
            sharedState: {subSelection},
        } = this.props;
        this.props.onSettingsChanged('changeStyle', {
            subSelection,
            key: type,
            value: alignmentClass,
        });
    };

    handleBeforeChange = (changes, source) => {
        if (source === 'loadData' || source === 'populateFromArray') {
            // The change was probably caused by us modifying the data prop
            return true;
        }
        if (this.props.onSettingsChanged) {
            this.props.onSettingsChanged('setFormula', {
                changes: changes.map(change => [change[0], change[1], change[3]]),
            });
        }
        return false;
    };

    /**
        row - selection start
        column - selection start
        row2/column2 - selection end
    */
    handleSelection = (row, column, _row2, _column2, _preventScrolling, _selectionLayerLevel) => {
        const selected = this.tableRef.current.hotInstance.getSelected();
        const subSelection = [];
        for (let [startX, startY, endX, endY] of selected) {
            if (startX > endX) {
                [startX, endX] = [endX, startX];
            }
            if (startY > endY) {
                [startY, endY] = [endY, startY];
            }
            // Every entry in selected is potentially a range of selected cells
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    subSelection.push([x, y]);
                }
            }
        }

        if (this.props.onSharedStateChange) {
            this.props.onSharedStateChange(this.props.componentId, {
                selectedRow: row,
                selectedColumn: column,
                subSelection,
            });
        }
    };

    handleDeselect = () => {
        if (this.props.onSharedStateChange) {
            this.props.onSharedStateChange(this.props.componentId, {
                selectedRow: null,
                selectedColumn: null,
                subSelection: null,
            });
        }
    };

    handleColumnResize = (currentColumn, newSize, _isDoubleClick) => {
        if (this.props.onSettingsChanged) {
            this.props.onSettingsChanged('setColSize', {
                col: currentColumn,
                size: newSize,
            });
        }
    };

    handleRowResize = (currentRow, newSize, _isDoubleClick) => {
        if (this.props.onSettingsChanged) {
            this.props.onSettingsChanged('setRowSize', {
                row: currentRow,
                size: newSize,
            });
        }
    };

    handleKeyDown = event => {
        if (!event.metaKey) {
            return;
        }
        if (event.key === 'b') {
            this._toggleStyle('bold');
        } else if (event.key === 'i') {
            this._toggleStyle('italic');
        } else if (event.key === 'u') {
            this._toggleStyle('underline');
        }
    };

    _toggleStyle = key => {
        const {selectedRow: row, selectedColumn: column, subSelection} = this.props.sharedState;
        const styles = this.props.dataProvider.styles(row, column);
        if (this.props.onSettingsChanged) {
            this.props.onSettingsChanged('changeStyle', {
                row,
                column,
                key,
                subSelection,
                value: !styles[key],
            });
        }
    };

    cellRenderer = (row, col) => {
        const cellStyles = this.props.dataProvider.styles(row, col);
        const cellProperties = {};

        cellProperties.numericFormat = {
            pattern: {
                thousandSeparated: cellStyles.thousandSeparated || false,
                mantissa: 2 + (cellStyles.mantissa || 0),
            },
        };

        if (cellStyles.format === 'percent') {
            cellProperties.numericFormat.pattern.output = 'percent';
            cellProperties.type = 'numeric';
        } else if (cellStyles.format === 'money') {
            cellProperties.numericFormat.pattern.output = 'currency';
            cellProperties.type = 'numeric';
            cellProperties.numericFormat.culture = 'en-US';
        }

        let className = '';
        if (cellStyles.horizontal) {
            className += cellStyles.horizontal;
        }

        if (cellStyles.vertical) {
            className += ` ${cellStyles.vertical}`;
        }

        cellProperties.className = className;
        cellProperties.renderer = customRender(this.props.dataProvider);
        return cellProperties;
    };

    render() {
        const {dataProvider, isEditing, isSelected} = this.props;
        // HOT modifies the reference and we don't want that.
        const data = JSON.parse(JSON.stringify(dataProvider.tableData()));
        const isLoading = dataProvider.isLoading();
        const variables = dataProvider.variables();
        const mergedCells = dataProvider.mergedCells();
        const borders = dataProvider.borders();
        const columnSizes = dataProvider.columnSizes();
        const rowSizes = dataProvider.rowSizes();

        const settings = {
            colHeaders: isEditing,
            rowHeaders: isEditing,
            mergeCells: mergedCells,
            width: this.props.width,
            height: this.props.height,
            beforeCellAlignment: this.handleCellAlignment,
            afterChange: this.afterChange,
            afterSelectionEnd: this.handleSelection,
            afterDocumentKeyDown: this.handleKeyDown,
            afterDeselect: this.handleDeselect,
            afterCreateRow: this.handleCreateRow,
            afterCreateCol: this.handleCreateColumn,
            afterRemoveRow: this.handleRemoveRow,
            afterRemoveCol: this.handleRemoveColumn,
            afterRowResize: this.handleRowResize,
            afterColumnResize: this.handleColumnResize,
            beforeChange: this.handleBeforeChange,
            beforeMergeCells: this.handleMergeCells,
            beforeUnmergeCells: this.handleUnmergeCells,
            customBorders: borders,
            manualColumnResize: columnSizes,
            manualRowResize: rowSizes,
            disableVisualSelection: !isEditing,
            fillHandle: false,
            contextMenu: isEditing && [
                'row_above',
                'row_below',
                'col_left',
                'col_right',
                '---------',
                'remove_row',
                'remove_col',
                '---------',
                'alignment',
                'mergeCells',
            ],
            readOnly: !isEditing,
            formulas: {
                variables,
            },
            outsideClickDeselects: false,
            data,
            cells: this.cellRenderer,
        };

        return (
            <Wrapper className={isSelected ? 'noDrag' : undefined}>
                <CobaltSpreadsheet
                    ref={this.tableRef}
                    licenseKey='cdc76-632cd-32df0-3463b-9b925'
                    isLoading={isLoading}
                    settings={settings}
                />
            </Wrapper>
        );
    }
}

export default HandsontableComponent;
