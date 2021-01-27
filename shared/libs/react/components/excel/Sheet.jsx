import PropTypes from 'prop-types';
import React from 'react';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import {is_set} from 'src/libs/Utils';

import Input from 'components/basic/forms/input/Input';

import styled from 'styled-components';

const FIRST_ROW_HEIGHT = 20;
const DEFAULT_ROW_HEIGHT = 20;

const FIRST_COLUMN_WIDTH = 75;
const DEFAULT_COLUMN_WIDTH = 150;

const ROW_HEIGHT_MULTIPLIER = 1.2;
const COLUMN_WIDTH_MULTIPLIER = 7.6;

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    flex: 1;
`;

const Toolbar = styled(Input)`
    border-radius: 0;
    :hover {
        color: #95a5a6;
        background: #2c3039;
    }
`;

const Cell = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    padding: 0 0.5em;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer !important;

    font-size: 12px;
    white-space: nowrap;

    position: relative;

    z-index: ${props => (props.zIndex ? props.zIndex : 'auto')};

    text-align: ${props => (props.centered ? 'center' : 'left')};

    color: ${props => (props.bgColor ? '#FFFFFF;!important' : '#555')};
    background-color: ${props => (props.bgColor ? `${props.bgColor}!important` : '#FFFFFF;')};
    :hover {
        background-color: ${props => (props.bgColor ? `${props.bgColor}!important` : '#efefef')};
    }
`;

const HeaderCell = styled(Cell)`
    text-align: center;

    color: ${props => (props.isSelected ? '#4da875' : '#555')};
    background-color: ${props => (props.isSelected ? '#e5e5e5' : '#efefef')};
    :hover {
        background-color: ${props => (props.isSelected ? '#e5e5e5' : '#efefef')};
    }
`;

const CellHighlight = styled.div`
    position: absolute;
    top: -1px;
    left: -1px;
    bottom: -1px;
    right: -1px;
    border: 2px solid #555555;
    background-color: transparent;
    z-index: 100;
`;

export function columnString(n) {
    let letters = [];

    while (n > 0) {
        let rem = (n - 1) % 26;
        n = Math.floor((n - 1) / 26);

        letters.unshift(String.fromCharCode(65 + rem));
    }

    return letters.join('');
}

export function cellKey(row, column) {
    return `${row}.${column}`;
}

const cellType = PropTypes.shape({
    value: PropTypes.any,
    style: PropTypes.object,
});

export const rowType = PropTypes.arrayOf(cellType.isRequired);

export const dataType = PropTypes.arrayOf(rowType.isRequired);

export const dimensionsType = PropTypes.shape({
    rows: PropTypes.object,
    columns: PropTypes.object,
});

export const selectionType = PropTypes.shape({
    row: PropTypes.number,
    column: PropTypes.number,
});

export const cellColorsType = PropTypes.object;

export default class Sheet extends React.Component {
    static propTypes = {
        data: dataType.isRequired,
        dimensions: dimensionsType,
        cellColors: cellColorsType,
        selection: selectionType,
        onClickCell: PropTypes.func,
        rowPadding: PropTypes.number,
        columnPadding: PropTypes.number,
    };

    static defaultProps = {
        selection: {row: 0, column: 0},
        cellColors: {},
        dimensions: {},
        data: [],
        rowPadding: 5,
        columnPadding: 5,
        scrollToRow: -1,
        scrollToColumn: -1,
        scrollToTop: -1,
        propScroll: false,
    };

    constructor(props, context) {
        super(props, context);

        this.preventScroll = false;
    }

    scrollToTop = () => {
        if (this.grid && this.grid._bottomRightGrid && !this.preventScroll) {
            this.grid._bottomRightGrid.scrollToPosition({
                scrollLeft: 0,
                scrollTop: 0,
            });
        }

        this.preventScroll = false;
    };

    scrollToCell = (row, column) => {
        if (this.grid && this.grid._bottomRightGrid && !this.preventScroll) {
            const offset = this.grid._bottomRightGrid.getOffsetForCell({
                rowIndex: row + 1,
                columnIndex: column + 1,
                alignment: 'center',
            });

            this.grid._bottomRightGrid.scrollToPosition(offset);
        }

        this.preventScroll = false;
    };

    componentDidUpdate(prevProps) {
        if (!this.props.propScroll) {
            if (this.grid && prevProps.data !== this.props.data) {
                this.scrollToTop();
                this.grid.recomputeGridSize();
                return;
            }

            if (this.props.selection && prevProps.selection !== this.props.selection) {
                const {row, column} = this.props.selection;

                if (is_set(row) && is_set(column)) {
                    this.scrollToCell(row, column);
                }
            }
        }
    }

    handleClickCell(row, column) {
        this.preventScroll = true;

        const {onClickCell} = this.props;

        if (typeof onClickCell === 'function') {
            onClickCell(row, column);
        }
    }

    cellRenderer({
        columnIndex, // Horizontal (column) index of cell
        rowIndex, // Vertical (row) index of cell
        key, // Unique key within array of cells
        style,
        parent,
    }) {
        if (rowIndex === 0 && columnIndex === 0) {
            return <HeaderCell key={key} style={style} onClick={this.scrollToTop} />;
        }

        const {selection, cellColors} = this.props;

        const row = rowIndex - 1;
        const column = columnIndex - 1;
        const rowIsSelected = selection.row === row;
        const columnIsSelected = selection.column === column;

        if (rowIndex === 0) {
            return (
                <HeaderCell key={key} style={style} isSelected={columnIsSelected}>
                    {columnString(columnIndex)}
                </HeaderCell>
            );
        }

        if (columnIndex === 0) {
            return (
                <HeaderCell key={key} style={style} isSelected={rowIsSelected}>
                    {rowIndex}
                </HeaderCell>
            );
        }

        const content = this.getContent(row, column);
        const bgColor = cellColors[cellKey(row, column)];
        const isSelected = rowIsSelected && columnIsSelected;

        const nextHasValue = is_set(this.getContent(row, column + 1).value);

        return (
            <Cell
                key={key}
                style={{...content.style, ...style}}
                onClick={() => this.handleClickCell(row, column)}
                bgColor={bgColor}
                zIndex={nextHasValue ? 0 : parent.props.columnCount - column}
            >
                {isSelected && <CellHighlight />}
                {content.value}
            </Cell>
        );
    }

    columnWidth({index}) {
        const {dimensions} = this.props;

        if (index === 0) {
            return FIRST_COLUMN_WIDTH;
        }

        const columnDimensions = dimensions.columns || {};

        const excelWidth = columnDimensions[columnString(index)];

        if (excelWidth) {
            return excelWidth * COLUMN_WIDTH_MULTIPLIER;
        }

        return DEFAULT_COLUMN_WIDTH;
    }

    rowHeight({index}) {
        const {dimensions} = this.props;

        if (index === 0) {
            return FIRST_ROW_HEIGHT;
        }

        const rowDimensions = dimensions.rows || {};

        const excelHeight = rowDimensions[index];

        if (excelHeight) {
            return excelHeight * ROW_HEIGHT_MULTIPLIER;
        }

        return DEFAULT_ROW_HEIGHT;
    }

    getContent(row, column) {
        const rowData = this.props.data[row] || [];
        return rowData[column] || {};
    }

    selectedCell() {
        const {selection} = this.props;

        if (is_set(selection.column) && is_set(selection.row)) {
            return `${columnString(selection.column + 1)}${selection.row + 1}`;
        }
    }

    selectedValue() {
        const {selection} = this.props;

        if (is_set(selection.column) && is_set(selection.row)) {
            const value = this.getContent(selection.row, selection.column).value;

            if (is_set(value)) {
                return String(value).truncate(50);
            }
        }
    }

    render() {
        const {
            data,
            rowPadding,
            columnPadding,
            scrollToColumn,
            scrollToRow,
            scrollToTop,
        } = this.props;

        const rowCount = data.length;
        const columnCount = rowCount ? data[0].length : 0;

        return (
            <Wrapper>
                <Toolbar label={this.selectedCell()} value={this.selectedValue()} />
                <AutoSizer>
                    {({height, width}) => (
                        <MultiGrid
                            ref={ref => (this.grid = ref)}
                            cellRenderer={this.cellRenderer.bind(this)}
                            columnWidth={this.columnWidth.bind(this)}
                            rowHeight={this.rowHeight.bind(this)}
                            classNameBottomLeftGrid='excelGrid'
                            classNameBottomRightGrid='excelGrid'
                            classNameTopLeftGrid='excelGrid'
                            classNameTopRightGrid='excelGrid'
                            overscanColumnCount={10}
                            overscanRowCount={50}
                            columnCount={columnCount + columnPadding + 1}
                            rowCount={rowCount + rowPadding + 1}
                            fixedColumnCount={1}
                            fixedRowCount={1}
                            width={width}
                            height={height - 45} // Subtract the toolbar height
                            scrollToColumn={scrollToColumn}
                            scrollToRow={scrollToRow}
                            scrollToAlignment='center'
                            scrollToTop={scrollToTop}
                        />
                    )}
                </AutoSizer>
            </Wrapper>
        );
    }
}
