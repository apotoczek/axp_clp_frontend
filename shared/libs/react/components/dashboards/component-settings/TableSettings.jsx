import React, {Component, useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';
import memoize from 'lodash.memoize';

import {is_set} from 'src/libs/Utils';
import {CellMode} from 'src/libs/Enums';

import {Bold, Italic} from 'components/basic/text';
import Icon from 'components/basic/Icon';
import TextInput from 'components/basic/forms/input/TextInput';
import Checkbox from 'components/basic/forms/Checkbox';
import Button from 'components/basic/forms/Button';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import NumberInput from 'components/basic/forms/input/NumberInput';
import ContextMenu from 'components/basic/ContextMenu';

import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import ChecklistDropdown from 'components/basic/forms/dropdowns/ChecklistDropdown';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import AttributeSelectorDropdown from 'components/basic/forms/dropdowns/AttributeSelectorDropdown';

import {SectionTitle, SectionSubTitle} from 'components/dashboards/component-settings/base';

import Collapsible from 'components/dashboards/component-settings/Collapsible';

import ValueSelector from 'components/dashboards/component-settings/ValueSelector';
import DateSelector from 'components/dashboards/component-settings/DateSelector';

import TableSpecHandler from 'component-spec-handlers/table-spec-handler';

function alphabeticColumnName(columnIdx) {
    let dividend = columnIdx + 1;
    let columnName = '';
    let modulo;

    while (dividend > 0) {
        modulo = (dividend - 1) % 26; // 26 is 'Z'
        columnName = String.fromCharCode(65 + modulo) + columnName; // 65 i 'A'
        dividend = Math.floor((dividend - modulo) / 26);
    }

    return columnName;
}

function numericColumnName(alphabeticColumnName) {
    alphabeticColumnName = alphabeticColumnName.toUpperCase();
    if (alphabeticColumnName.length <= 0) {
        return undefined;
    }

    let num = 0;
    for (let i = 0; i < alphabeticColumnName.length; i++) {
        num *= 26;
        num += alphabeticColumnName[i].charCodeAt(0) - 65 + 1; // 65 is 'A'
    }

    return num - 1;
}

function combinedName(columnIdx, rowIdx) {
    return oneLine`
        ${is_set(columnIdx) ? alphabeticColumnName(columnIdx - 1) : ''}${rowIdx || ''}
    `;
}

const Highlight = styled(Bold)`
    color: ${({theme}) => theme.dashboard.settings.table.highlight};
`;

const SectionsWrapper = styled(Flex)`
    overflow-x: auto;
`;

const ColumnSelectorWrapper = styled.td`
    background: ${({theme}) => theme.dashboard.settings.table.columnSelector.bg};
    padding: 4px;
    text-align: center;
    font-size: 12px;
    border: 1px solid ${({theme}) => theme.dashboard.settings.table.columnSelector.border};
    border-top: none;
    cursor: pointer;

    ${props =>
        props.isColumnSelected &&
        css`
            color: ${props =>
                !props.header && props.theme.dashboard.settings.table.columnSelector.selectedFg};
            border: 2px solid
                ${({theme}) => theme.dashboard.settings.table.columnSelector.selectedBorder};
            border-bottom: none;
        `};

    &:hover {
        background: ${({theme}) => theme.dashboard.settings.table.columnSelector.hoverBg};
    }
`;

function ColumnSelector({
    onClick,
    onDeleteColumn,
    onAddColumnBefore,
    onAddColumnAfter,
    onMoveColumnLeft,
    onMoveColumnRight,
    isColumnSelected,
    contextMenu,
    children,
}) {
    return (
        <ColumnSelectorWrapper
            onClick={onClick}
            onContextMenu={onClick}
            isColumnSelected={isColumnSelected}
        >
            {contextMenu && (
                <ContextMenu
                    posX={contextMenu.x}
                    posY={contextMenu.y}
                    items={[
                        {
                            key: 'insert-column-before',
                            onClick: onAddColumnBefore,
                            label: 'Insert Column Before',
                        },
                        {
                            key: 'insert-column-after',
                            onClick: onAddColumnAfter,
                            label: 'Insert Column After',
                        },
                        {
                            key: 'move-column-left',
                            onClick: onMoveColumnLeft,
                            label: 'Move Column Left',
                        },
                        {
                            key: 'move-column-right',
                            onClick: onMoveColumnRight,
                            label: 'Move Column Right',
                        },
                        {key: 'delete-column', onClick: onDeleteColumn, label: 'Delete Column'},
                    ]}
                />
            )}
            {children}
        </ColumnSelectorWrapper>
    );
}

const RowSelectorWrapper = styled.td`
    background: ${({theme}) => theme.dashboard.settings.table.rowSelector.bg};
    text-align: center;
    width: 35px;
    font-size: 12px;
    border: 1px solid ${({theme}) => theme.dashboard.settings.table.rowSelector.border};
    border-left: none;
    cursor: pointer;

    padding: 4px 6px;

    ${props =>
        props.isRowSelected &&
        css`
            color: ${props =>
                !props.header && props.theme.dashboard.settings.table.rowSelector.selectedFg};
            border: 2px solid
                ${({theme}) => theme.dashboard.settings.table.rowSelector.selectedBorder};
            border-right: none;
        `};

    &:hover {
        background: ${({theme}) => theme.dashboard.settings.table.rowSelector.hoverBg};
    }
`;

function RowSelector({
    onClick,
    onDeleteRow,
    onAddRowAbove,
    onAddRowBelow,
    onMoveRowUp,
    onMoveRowDown,
    isRowSelected,
    contextMenu,
    children,
}) {
    return (
        <RowSelectorWrapper onClick={onClick} onContextMenu={onClick} isRowSelected={isRowSelected}>
            {contextMenu && (
                <ContextMenu
                    posX={contextMenu.x}
                    posY={contextMenu.y}
                    items={[
                        {
                            key: 'insert-row-above',
                            onClick: onAddRowAbove,
                            label: 'Insert Row Above',
                        },
                        {
                            key: 'insert-row-below',
                            onClick: onAddRowBelow,
                            label: 'Insert Row Below',
                        },
                        {key: 'move-row-up', onClick: onMoveRowUp, label: 'Move Row Up'},
                        {key: 'move-row-down', onClick: onMoveRowDown, label: 'Move Row Down'},
                        {key: 'delete-row', onClick: onDeleteRow, label: 'Delete Row'},
                    ]}
                />
            )}
            {children}
        </RowSelectorWrapper>
    );
}

const MoveIcon = styled(props => <Icon {...props} name='menu' left />)`
    cursor: grab;
`;

const Table = styled.table`
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 8px;
`;

const CellTextContent = styled.span`
    /* Text Style */
    flex: 1;
    color: #95a5a6;
    font-size: 12px;
    font-style: italic;
    font-weight: 100;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Cell = styled(({isMovable, label, onClick, selected, ...rest}) => (
    <td title={label} onClick={onClick} onContextMenu={!selected ? onClick : undefined} {...rest}>
        <Flex>
            {isMovable ? <MoveIcon /> : null}
            <CellTextContent>{label}</CellTextContent>
        </Flex>
    </td>
))`
    width: 50px;
    max-width: 100px;
    background: ${({theme}) => theme.dashboard.settings.table.cell.bg};
    border: 1px solid ${({theme}) => theme.dashboard.settings.table.cell.border};

    padding: 4px 6px;

    user-select: none;
    cursor: pointer;

    &:hover {
        background: ${({theme}) => theme.dashboard.settings.table.cell.hoverBg};
        opacity: 1.0;
    }

    ${props =>
        props.header &&
        css`
            color: ${({theme}) => theme.dashboard.settings.table.cell.headerFg};
            font-size: 12px;
            font-style: normal;
            font-weight: 500;
            letter-spacing: 0.86px;
            text-transform: uppercase;

            background: ${({theme}) => theme.dashboard.settings.table.cell.headerBg};
        `}

    ${props =>
        props.selected &&
        css`
            color: ${props =>
                !props.header && props.theme.dashboard.settings.table.cell.selectedBorder};
            position: relative;

            &::after {
                content: '';
                width: 100%;
                height: 100%;
                left: 0;
                top: 0;
                position: absolute;
                border: 2px solid ${props.theme.dashboard.settings.table.cell.selectedBorder};
            }
        `}

    ${props =>
        props.isColumnSelected &&
        css`
            border-left: 2px solid ${props.theme.dashboard.settings.table.cell.selectedBorder};
            border-right: 2px solid ${props.theme.dashboard.settings.table.cell.selectedBorder};

            ${props =>
                props.isLastCellInColumn &&
                css`
                    border-bottom: 2px solid
                        ${props.theme.dashboard.settings.table.cell.selectedBorder};
                `}
        `}

    ${props =>
        props.isRowSelected &&
        css`
            border-top: 2px solid ${props.theme.dashboard.settings.table.cell.selectedBorder};
            border-bottom: 2px solid ${props.theme.dashboard.settings.table.cell.selectedBorder};

            ${props =>
                props.isLastCellInRow &&
                css`
                    border-right: 2px solid
                        ${props.theme.dashboard.settings.table.cell.selectedBorder};
                `}
        `}
`;

const NewSectionButton = styled(Button)`
    display: inline-block;
`;

const NewRowButton = styled.div`
    width: 100%;
    background: ${({theme}) => theme.dashboard.settings.table.newCellButton.bg};
    border: 2px dashed ${({theme}) => theme.dashboard.settings.table.newCellButton.border};
    margin-top: 4px;

    &:hover {
        background: ${({theme}) => theme.dashboard.settings.table.newCellButton.hoverBg};
    }

    cursor: pointer;
    text-align: center;
    color: ${({theme}) => theme.dashboard.settings.table.newCellButton.fg};
    font-size: 12px;
`;

const NewColumnButton = styled.div`
    display: flex;

    justify-content: center;
    align-items: center;

    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: ${({theme}) => theme.dashboard.settings.table.newCellButton.bg};
    border: 2px dashed ${({theme}) => theme.dashboard.settings.table.newCellButton.border};
    margin-left: 4px;

    &:hover {
        background: ${({theme}) => theme.dashboard.settings.table.newCellButton.hoverBg};
    }

    cursor: pointer;
    text-align: center;
    color: ${({theme}) => theme.dashboard.settings.table.newCellButton.fg};
    font-size: 12px;
`;

function NewSectionForm({sectionIdx, onAddSection}) {
    const [showForm, setShowForm] = useState(false);
    const [rowCount, setRowCount] = useState();
    const [columnCount, setColumnCount] = useState();

    const handleAddSection = () => {
        onAddSection(rowCount, columnCount);
        setRowCount(null);
        setColumnCount(null);
        setShowForm(false);
    };

    return (
        <Flex flexDirection='column'>
            {showForm && (
                <Collapsible header={`Section ${sectionIdx + 1}`} isOpen>
                    <Flex>
                        <NumberInput
                            leftLabel='# of Rows'
                            value={rowCount}
                            placeholder='E.g. 6'
                            mr={2}
                            onValueChanged={setRowCount}
                            min={1}
                        />
                        <NumberInput
                            leftLabel='# of Columns'
                            value={columnCount}
                            placeholder='E.g. 6'
                            mr={2}
                            onValueChanged={setColumnCount}
                            min={1}
                        />
                        <Button
                            secondary
                            onClick={handleAddSection}
                            disabled={!is_set(rowCount) || !is_set(columnCount)}
                        >
                            Create Table
                        </Button>
                    </Flex>
                </Collapsible>
            )}
            <NewSectionButton onClick={() => setShowForm(true)} secondary alignSelf='flex-start'>
                New Section
                <Icon name='plus' right />
            </NewSectionButton>
        </Flex>
    );
}

const EditTableWrapper = styled(Flex)`
    overflow-x: auto;
`;

class EditTable extends Component {
    static propTypes = {
        table: PropTypes.objectOf(
            PropTypes.arrayOf(
                PropTypes.shape({
                    sectionId: PropTypes.string,
                    isMovable: PropTypes.bool,
                    isRepeatRow: PropTypes.bool,
                    columns: PropTypes.arrayOf(
                        PropTypes.shape({
                            colSpan: PropTypes.number,
                            selected: PropTypes.bool,
                            header: PropTypes.bool,
                            isMovable: PropTypes.bool,
                            label: PropTypes.string,
                        }).isRequired,
                    ),
                }),
            ),
        ),

        selectedSection: PropTypes.string,
        selectedRow: PropTypes.number,
        selectedColumn: PropTypes.number,

        onCellSelected: PropTypes.func.isRequired,
        onRowSelected: PropTypes.func.isRequired,
        onColumnSelected: PropTypes.func.isRequired,

        onAddNewSection: PropTypes.func.isRequired,
        onAddNewRow: PropTypes.func.isRequired,
        onAddNewColumn: PropTypes.func.isRequired,
        onDeleteColumn: PropTypes.func.isRequired,
        onDeleteRow: PropTypes.func.isRequired,
        onMoveRow: PropTypes.func.isRequired,
        onMoveColumn: PropTypes.func.isRequired,
    };

    state = {
        isOpen: {},
        contextMenu: null,
    };

    handleClickCellContextMenu = (sectionId, rowIdx, columnIdx) => event => {
        event.stopPropagation();
        event.preventDefault();
        this.openContextMenu(sectionId, rowIdx, columnIdx)(event);
    };

    closeContextMenu = () => {
        this.setState({contextMenu: null});
        document.removeEventListener('click', this.closeContextMenu);
    };

    openContextMenu = (sectionId, rowIdx, columnIdx) => event => {
        this.setState({
            contextMenu: {
                sectionId,
                rowIdx,
                columnIdx,
                x: event.clientX,
                y: event.clientY,
            },
        });
        document.addEventListener('click', this.closeContextMenu);
    };

    handleCellSelected = (sectionId, rowIdx, columnIdx) => event => {
        event.preventDefault();
        this.props.onCellSelected(sectionId, rowIdx, columnIdx);
    };

    handleRowClicked = (section, rowIdx) => event => {
        event.preventDefault();
        if (event.type == 'click') {
            this.props.onRowSelected(section, rowIdx);
        } else if (event.type == 'contextmenu') {
            this.openContextMenu(section, rowIdx, null)(event);
        }
    };

    handleColumnClicked = (section, colIdx) => event => {
        event.preventDefault();
        if (event.type == 'click') {
            this.props.onColumnSelected(section, colIdx);
        } else if (event.type == 'contextmenu') {
            this.openContextMenu(section, null, colIdx)(event);
        }
    };

    _isCellSelected = (sectionId, row, column) => {
        const {selectedSection, selectedRow, selectedColumn} = this.props;

        if (is_set(selectedSection) || is_set(selectedRow) || is_set(column)) {
            return (
                selectedSection === sectionId && selectedRow === row && selectedColumn === column
            );
        }
        return false;
    };

    _isRowSelected = (section, rowIdx) => {
        const {selectedSection, selectedRow, selectedColumn} = this.props;

        return selectedSection == section && selectedRow == rowIdx && !is_set(selectedColumn);
    };

    _isColumnSelected = (section, colIdx) => {
        const {selectedSection, selectedRow, selectedColumn} = this.props;

        return selectedSection == section && selectedColumn == colIdx && !is_set(selectedRow);
    };

    toggleSectionOpen(sectionId) {
        this.setState(state => ({
            isOpen: {
                ...state.isOpen,
                [sectionId]: is_set(state.isOpen[sectionId]) ? !state.isOpen[sectionId] : false,
            },
        }));
    }

    isSectionOpen(sectionId) {
        const sectionState = this.state.isOpen[sectionId];
        return is_set(sectionState) ? sectionState : true;
    }

    sectionSizeMetaData = memoize(rows => {
        const rowsPerColumn = {};
        let longestRow = 0;
        for (const row of rows) {
            longestRow = Math.max(longestRow, row.columns.length);
            for (let columnIdx = 0; columnIdx < row.columns.length; columnIdx++) {
                rowsPerColumn[columnIdx] = rowsPerColumn[columnIdx] || 0;
                rowsPerColumn[columnIdx]++;
            }
        }

        return [rowsPerColumn, longestRow];
    });

    renderSection = (rows, idx) => {
        const sectionId = rows[0].sectionId;

        const [rowsPerColumn, longestRow] = this.sectionSizeMetaData(rows);
        const header = `Section ${idx + 1}`;

        return (
            <Collapsible
                key={sectionId}
                header={header}
                isOpen={this.isSectionOpen(sectionId)}
                toggleOpen={() => this.toggleSectionOpen(sectionId)}
            >
                <Table>
                    <tbody>
                        <tr key={`${sectionId}.columnSelector`}>
                            <td />
                            {[...Array(longestRow)].map((_, colIdx) => (
                                <ColumnSelector
                                    onClick={this.handleColumnClicked(sectionId, colIdx)}
                                    isColumnSelected={this._isColumnSelected(sectionId, colIdx)}
                                    onDeleteColumn={() =>
                                        this.props.onDeleteColumn(sectionId, colIdx)
                                    }
                                    onAddColumnBefore={() =>
                                        this.props.onAddNewColumn(sectionId, colIdx)
                                    }
                                    onAddColumnAfter={() =>
                                        this.props.onAddNewColumn(sectionId, colIdx + 1)
                                    }
                                    onMoveColumnLeft={() =>
                                        this.props.onMoveColumn(sectionId, colIdx, -1)
                                    }
                                    onMoveColumnRight={() =>
                                        this.props.onMoveColumn(sectionId, colIdx, 1)
                                    }
                                    key={sectionId + colIdx}
                                    contextMenu={
                                        sectionId == this.state.contextMenu?.sectionId &&
                                        colIdx == this.state.contextMenu?.columnIdx &&
                                        this.state.contextMenu
                                    }
                                >
                                    {alphabeticColumnName(colIdx)}
                                </ColumnSelector>
                            ))}
                        </tr>
                        {rows.map(({columns}, rowIdx) => (
                            <tr key={`sectionId${columns.map(c => c.id).join('')}`}>
                                <RowSelector
                                    key={sectionId + rowIdx}
                                    onClick={this.handleRowClicked(sectionId, rowIdx)}
                                    onDeleteRow={() => this.props.onDeleteRow(sectionId, rowIdx)}
                                    onAddRowAbove={() => this.props.onAddNewRow(sectionId, rowIdx)}
                                    onAddRowBelow={() =>
                                        this.props.onAddNewRow(sectionId, rowIdx + 1)
                                    }
                                    onMoveRowUp={() => this.props.onMoveRow(sectionId, rowIdx, -1)}
                                    onMoveRowDown={() => this.props.onMoveRow(sectionId, rowIdx, 1)}
                                    isRowSelected={this._isRowSelected(sectionId, rowIdx)}
                                    contextMenu={
                                        sectionId == this.state.contextMenu?.sectionId &&
                                        rowIdx == this.state.contextMenu?.rowIdx &&
                                        this.state.contextMenu
                                    }
                                >
                                    {rowIdx + 1}
                                </RowSelector>
                                {columns.map((column, columnIdx) => (
                                    <Cell
                                        key={column.id}
                                        selected={this._isCellSelected(
                                            sectionId,
                                            rowIdx,
                                            columnIdx,
                                        )}
                                        isRowSelected={this._isRowSelected(sectionId, rowIdx)}
                                        isLastCellInRow={columns.length - 1 === columnIdx}
                                        isColumnSelected={this._isColumnSelected(
                                            sectionId,
                                            columnIdx,
                                        )}
                                        isLastCellInColumn={rowsPerColumn[columnIdx] - 1 === rowIdx}
                                        onClick={this.handleCellSelected(
                                            sectionId,
                                            rowIdx,
                                            columnIdx,
                                        )}
                                        label={column.value}
                                        colSpan={column.span}
                                    />
                                ))}
                                {rowIdx == 0 && (
                                    <td rowSpan={rows.length} style={{position: 'relative'}}>
                                        <NewColumnButton
                                            key={`${sectionId} + newCell`}
                                            onClick={() => this.props.onAddNewColumn(sectionId)}
                                        >
                                            <Icon name='plus' />
                                        </NewColumnButton>
                                    </td>
                                )}
                            </tr>
                        ))}
                        <tr key={`${sectionId}.newButton`}>
                            <td />
                            <td colSpan={rows[0].columns.length}>
                                <NewRowButton onClick={() => this.props.onAddNewRow(sectionId)}>
                                    <Icon name='plus' />
                                </NewRowButton>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Collapsible>
        );
    };

    render() {
        // TODO: We should sort according to section order?
        return (
            <EditTableWrapper flexDirection='column' mb={4}>
                <SectionsWrapper flexDirection='column'>
                    {Object.values(this.props.table).map((section, idx) =>
                        this.renderSection(section, idx),
                    )}
                </SectionsWrapper>
                <NewSectionForm
                    sectionIdx={Object.values(this.props.table).length}
                    onAddSection={this.props.onAddNewSection}
                />
            </EditTableWrapper>
        );
    }
}

function CellFormattingSettings({provider, sectionId, rowIdx, columnIdx, onSettingsChanged}) {
    const changeOption = useCallback(
        (key, value) => onSettingsChanged(TableSpecHandler.changeOption, {key, value}),
        [onSettingsChanged],
    );

    const optionValueForCell = provider.optionValueForCell.bind(
        provider,
        sectionId,
        rowIdx,
        columnIdx,
    );

    const textAccentValues = [];
    if (optionValueForCell(['textBold'], false, 'inheritTextStylingFrom')) {
        textAccentValues.push('bold');
    }
    if (optionValueForCell(['textItalic'], false, 'inheritTextStylingFrom')) {
        textAccentValues.push('italic');
    }

    const borderValues = [];
    for (const option of ['top', 'bottom', 'left', 'right']) {
        if (optionValueForCell([`border${option.capitalize()}`], false, undefined)) {
            borderValues.push(option);
        }
    }

    return (
        <Flex flexDirection='column'>
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <DropdownList
                leftLabel='Inherit from'
                value={optionValueForCell(['inheritCellStylingFrom'], 'row')}
                options={[
                    {label: 'None', value: null},
                    {label: 'Row', value: 'row'},
                    {label: 'Column', value: 'column'},
                ]}
                onValueChanged={value => changeOption('inheritCellStylingFrom', value)}
                mb={1}
            />
            <ColorPickerDropdown
                label='Cell Background Color'
                color={optionValueForCell(
                    ['backgroundColor'],
                    'transparent',
                    'inheritCellStylingFrom',
                )}
                colors={provider.getCustomColors()}
                onChange={color => changeOption('backgroundColor', color)}
                mb={1}
                disabled={optionValueForCell(['inheritCellStylingFrom'], 'row')}
            />
            <ChecklistDropdown
                label='Cell Border'
                values={borderValues}
                iconKey='icon'
                iconType='bisonicon'
                options={[
                    {label: 'Top Border', value: 'top', icon: 'border-top'},
                    {label: 'Bottom Border', value: 'bottom', icon: 'border-bottom'},
                    {label: 'Left Border', value: 'left', icon: 'border-left'},
                    {label: 'Right Border', value: 'right', icon: 'border-right'},
                ]}
                mb={1}
                onValueChanged={value =>
                    changeOption(`border${value.capitalize()}`, !borderValues.includes(value))
                }
            />
            <SectionSubTitle>Text Styling</SectionSubTitle>
            <DropdownList
                leftLabel='Inherit from'
                value={optionValueForCell(['inheritTextStylingFrom'], 'row')}
                options={[
                    {label: 'None', value: null},
                    {label: 'Row', value: 'row'},
                    {label: 'Column', value: 'column'},
                ]}
                onValueChanged={value => changeOption('inheritTextStylingFrom', value)}
                mb={1}
            />
            <Flex>
                <NumberInput
                    leftLabel='Text Size'
                    value={optionValueForCell(['textSize'], undefined, 'inheritTextStylingFrom')}
                    placeholder='E.g. 14 (Default: 12)'
                    onValueChanged={size => changeOption('textSize', size)}
                    mr={1}
                    disabled={optionValueForCell(['inheritTextStylingFrom'], 'row')}
                />
                <ChecklistDropdown
                    label='Text accent'
                    values={textAccentValues}
                    options={[
                        {label: 'Bold', value: 'bold'},
                        {label: 'Italic', value: 'italic'},
                    ]}
                    mr={1}
                    disabled={optionValueForCell(['inheritTextStylingFrom'], 'row')}
                    onValueChanged={value =>
                        changeOption(`text${value.capitalize()}`, !textAccentValues.includes(value))
                    }
                />
                <DropdownList
                    iconKey='icon'
                    iconType='glyphicon'
                    leftLabel='Text Alignment'
                    value={optionValueForCell(
                        ['textAlignment'],
                        undefined,
                        'inheritTextStylingFrom',
                    )}
                    options={[
                        {label: 'Left', value: 'left', icon: 'align-left'},
                        {label: 'Center', value: 'center', icon: 'align-center'},
                        {label: 'Right', value: 'right', icon: 'align-right'},
                    ]}
                    onValueChanged={value => changeOption('textAlignment', value)}
                    disabled={optionValueForCell(['inheritTextStylingFrom'], 'row')}
                />
            </Flex>
            <SectionSubTitle>Value Format</SectionSubTitle>
            <DropdownList
                leftLabel='Inherit from'
                value={optionValueForCell(['inheritValueFormatFrom'], 'row')}
                options={[
                    {label: 'None', value: null},
                    {label: 'Row', value: 'row'},
                    {label: 'Column', value: 'column'},
                ]}
                onValueChanged={value => changeOption('inheritValueFormatFrom', value)}
                mb={1}
            />
            <Flex mb={1}>
                <DropdownList
                    leftLabel='Display Units'
                    value={optionValueForCell(
                        ['displayUnits'],
                        undefined,
                        'inheritValueFormatFrom',
                    )}
                    options={[
                        {label: 'None', value: undefined},
                        {label: 'Hundreds', value: 'hundreds'},
                        {label: 'Thousands', value: 'thousands'},
                        {label: 'Millions', value: 'millions'},
                        {label: 'Billions', value: 'billions'},
                        {label: 'Trillions', value: 'trillions'},
                    ]}
                    onValueChanged={value => changeOption('displayUnits', value)}
                    mr={1}
                    disabled={optionValueForCell(['inheritValueFormatFrom'], 'row')}
                />
                <Checkbox
                    leftLabel='Show Unit'
                    checked={optionValueForCell(['showUnit'], true, 'inheritValueFormatFrom')}
                    onValueChanged={value => changeOption('showUnit', value)}
                    disabled={optionValueForCell(['inheritValueFormatFrom'], 'row')}
                />
            </Flex>
            <NumberInput
                leftLabel='Decimal Places'
                min={0}
                max={20}
                placeholder='E.g. 0 (Default 2)'
                value={optionValueForCell(['decimalPlaces'], undefined, 'inheritValueFormatFrom')}
                onValueChanged={value => changeOption('decimalPlaces', value)}
                mb={1}
                disabled={optionValueForCell(['inheritValueFormatFrom'], 'row')}
            />
            <TextInput
                leftLabel='Currency Symbol Override'
                min={0}
                placeholder='E.g. USD'
                value={optionValueForCell(['currencySymbol'], undefined, 'inheritValueFormatFrom')}
                onValueChanged={value => changeOption('currencySymbol', value)}
                mb={1}
                disabled={optionValueForCell(['inheritValueFormatFrom'], 'row')}
            />
            <SectionSubTitle>Layout</SectionSubTitle>
            <NumberInput
                leftLabel='Column Span'
                value={optionValueForCell(['span'], undefined)}
                placeholder='E.g. 4 (Default: 1)'
                onValueChanged={span => changeOption('span', span)}
                mb={1}
            />
        </Flex>
    );
}

function RowFormattingSettings({provider, sectionId, rowIdx, onSettingsChanged}) {
    const changeOption = useCallback(
        (key, value) => onSettingsChanged(TableSpecHandler.changeOption, {key, value}),
        [onSettingsChanged],
    );

    const optionValueForRow = provider.optionValueForRow.bind(provider, sectionId, rowIdx);

    const textAccentValues = [];
    if (optionValueForRow(['textBold'], false)) {
        textAccentValues.push('bold');
    }
    if (optionValueForRow(['textItalic'], false)) {
        textAccentValues.push('italic');
    }

    const borderValues = [];
    if (optionValueForRow(['borderTop'], false)) {
        borderValues.push('top');
    }
    if (optionValueForRow(['borderBottom'], false)) {
        borderValues.push('bottom');
    }

    return (
        <Flex flexDirection='column'>
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <Checkbox
                checked={optionValueForRow(['isHeader'], false)}
                leftLabel='Header Row'
                onValueChanged={isHeader => changeOption('isHeader', isHeader)}
                mb={1}
            />
            <ColorPickerDropdown
                label='Row Background Color'
                color={optionValueForRow(['backgroundColor'], 'transparent')}
                colors={provider.getCustomColors()}
                onChange={color => changeOption('backgroundColor', color)}
                mb={1}
            />
            <ChecklistDropdown
                label='Row Border'
                values={borderValues}
                iconKey='icon'
                iconType='bisonicon'
                options={[
                    {label: 'Top Border', value: 'top', icon: 'border-top'},
                    {label: 'Bottom Border', value: 'bottom', icon: 'border-bottom'},
                ]}
                mb={1}
                onValueChanged={value =>
                    changeOption(`border${value.capitalize()}`, !borderValues.includes(value))
                }
            />
            <SectionSubTitle>Text Styling</SectionSubTitle>
            <Flex>
                <NumberInput
                    leftLabel='Text Size'
                    value={optionValueForRow(['textSize'])}
                    placeholder='E.g. 14 (Default: 12)'
                    onValueChanged={size => changeOption('textSize', size)}
                    mr={1}
                />
                <ChecklistDropdown
                    label='Text accent'
                    values={textAccentValues}
                    options={[
                        {label: 'Bold', value: 'bold'},
                        {label: 'Italic', value: 'italic'},
                    ]}
                    mr={1}
                    onValueChanged={value =>
                        changeOption(`text${value.capitalize()}`, !textAccentValues.includes(value))
                    }
                />
                <DropdownList
                    iconKey='icon'
                    iconType='glyphicon'
                    leftLabel='Text Alignment'
                    value={optionValueForRow(['textAlignment'])}
                    options={[
                        {label: 'Left', value: 'left', icon: 'align-left'},
                        {label: 'Center', value: 'center', icon: 'align-center'},
                        {label: 'Right', value: 'right', icon: 'align-right'},
                    ]}
                    onValueChanged={value => changeOption('textAlignment', value)}
                />
            </Flex>
            <SectionSubTitle>Value Format</SectionSubTitle>
            <Flex mb={1}>
                <DropdownList
                    leftLabel='Display Units'
                    value={optionValueForRow(['displayUnits'])}
                    options={[
                        {label: 'None', value: undefined},
                        {label: 'Hundreds', value: 'hundreds'},
                        {label: 'Thousands', value: 'thousands'},
                        {label: 'Millions', value: 'millions'},
                        {label: 'Billions', value: 'billions'},
                        {label: 'Trillions', value: 'trillions'},
                    ]}
                    onValueChanged={value => changeOption('displayUnits', value)}
                    mr={1}
                />
                <Checkbox
                    leftLabel='Show Unit'
                    checked={optionValueForRow(['showUnit'], true)}
                    onValueChanged={value => changeOption('showUnit', value)}
                />
            </Flex>
            <NumberInput
                leftLabel='Decimal Places'
                min={0}
                max={20}
                placeholder='E.g. 0 (Default 2)'
                value={optionValueForRow(['decimalPlaces'])}
                onValueChanged={value => changeOption('decimalPlaces', value)}
                mb={1}
            />
            <TextInput
                leftLabel='Currency Symbol Override'
                min={0}
                placeholder='E.g. USD'
                value={optionValueForRow(['currencySymbol'])}
                onValueChanged={value => changeOption('currencySymbol', value)}
                mb={1}
            />
        </Flex>
    );
}

function ColumnFormattingSettings({provider, sectionId, columnIdx, onSettingsChanged}) {
    const changeOption = useCallback(
        (key, value) => onSettingsChanged(TableSpecHandler.changeOption, {key, value}),
        [onSettingsChanged],
    );

    const optionValueForColumn = provider.optionValueForColumn.bind(provider, sectionId, columnIdx);

    const textAccentValues = [];
    if (optionValueForColumn(['textBold'], false)) {
        textAccentValues.push('bold');
    }
    if (optionValueForColumn(['textItalic'], false)) {
        textAccentValues.push('italic');
    }

    const borderValues = [];
    if (optionValueForColumn(['borderLeft'], false)) {
        borderValues.push('left');
    }
    if (optionValueForColumn(['borderRight'], false)) {
        borderValues.push('right');
    }

    return (
        <Flex flexDirection='column'>
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <ColorPickerDropdown
                label='Column Background Color'
                color={optionValueForColumn(['backgroundColor'], 'transparent')}
                colors={provider.getCustomColors()}
                onChange={color => changeOption('backgroundColor', color)}
                mb={1}
            />
            <ChecklistDropdown
                label='Column Border'
                values={borderValues}
                iconKey='icon'
                iconType='bisonicon'
                options={[
                    {label: 'Left Border', value: 'left', icon: 'border-left'},
                    {label: 'Right Border', value: 'right', icon: 'border-right'},
                ]}
                mb={1}
                onValueChanged={value =>
                    changeOption(`border${value.capitalize()}`, !borderValues.includes(value))
                }
            />
            <SectionSubTitle>Text Styling</SectionSubTitle>
            <Flex>
                <NumberInput
                    leftLabel='Text Size'
                    value={optionValueForColumn(['textSize'])}
                    placeholder='E.g. 14 (Default: 12)'
                    onValueChanged={size => changeOption('textSize', size)}
                    mr={1}
                />
                <ChecklistDropdown
                    label='Text accent'
                    values={textAccentValues}
                    options={[
                        {label: 'Bold', value: 'bold'},
                        {label: 'Italic', value: 'italic'},
                    ]}
                    mr={1}
                    onValueChanged={value =>
                        changeOption(`text${value.capitalize()}`, !textAccentValues.includes(value))
                    }
                />
                <DropdownList
                    iconKey='icon'
                    iconType='glyphicon'
                    leftLabel='Text Alignment'
                    value={optionValueForColumn(['textAlignment'])}
                    options={[
                        {label: 'Left', value: 'left', icon: 'align-left'},
                        {label: 'Center', value: 'center', icon: 'align-center'},
                        {label: 'Right', value: 'right', icon: 'align-right'},
                    ]}
                    onValueChanged={value => changeOption('textAlignment', value)}
                />
            </Flex>
            <SectionSubTitle>Value Format</SectionSubTitle>
            <Flex mb={1}>
                <DropdownList
                    leftLabel='Display Units'
                    value={optionValueForColumn(['displayUnits'])}
                    options={[
                        {label: 'None', value: undefined},
                        {label: 'Hundreds', value: 'hundreds'},
                        {label: 'Thousands', value: 'thousands'},
                        {label: 'Millions', value: 'millions'},
                        {label: 'Billions', value: 'billions'},
                        {label: 'Trillions', value: 'trillions'},
                    ]}
                    onValueChanged={value => changeOption('displayUnits', value)}
                    mr={1}
                />
                <Checkbox
                    leftLabel='Show Unit'
                    checked={optionValueForColumn(['showUnit'], true)}
                    onValueChanged={value => changeOption('showUnit', value)}
                />
            </Flex>
            <NumberInput
                leftLabel='Decimal Places'
                min={0}
                max={20}
                placeholder='E.g. 0 (Default 2)'
                value={optionValueForColumn(['decimalPlaces'])}
                onValueChanged={value => changeOption('decimalPlaces', value)}
                mb={1}
            />
            <TextInput
                leftLabel='Currency Symbol Override'
                min={0}
                placeholder='E.g. USD'
                value={optionValueForColumn(['currencySymbol'])}
                onValueChanged={value => changeOption('currencySymbol', value)}
                mb={1}
            />
            <SectionSubTitle>Layout</SectionSubTitle>
            <NumberInput
                leftLabel='Column Span'
                value={optionValueForColumn(['span'])}
                placeholder='E.g. 4 (Default: 1)'
                onValueChanged={span => changeOption('span', span)}
                mb={1}
            />
        </Flex>
    );
}

class ColumnOptions extends Component {
    static propTypes = {};

    render() {
        return (
            <Flex alignItems='flex-start'>
                <Flex width={[1, 1, 1, 0.5]} pl={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Column Formatting</SectionTitle>
                    <ColumnFormattingSettings
                        onSettingsChanged={this.props.onSettingsChanged}
                        provider={this.props.provider}
                        sectionId={this.props.selectedSection}
                        columnIdx={this.props.selectedColumn}
                    />
                </Flex>
            </Flex>
        );
    }
}

class RowOptions extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
    };

    handleEntityChanged = entity => {
        const {onSettingsChanged, selectedSection, selectedRow, valueId} = this.props;

        onSettingsChanged('changeEntity', {
            entity,
            sectionId: selectedSection,
            row: selectedRow,
            valueId,
        });
    };

    handleGroupingChanged = grouping => {
        const {onSettingsChanged, selectedSection, selectedRow} = this.props;

        onSettingsChanged('changeParameter', {
            key: 'group_by',
            value: grouping,
            sectionId: selectedSection,
            row: selectedRow,
        });
    };

    handleFilterClicked = (filterKey, value) => {
        const {onSettingsChanged, selectedSection, selectedRow} = this.props;

        onSettingsChanged('changeFilterSelection', {
            filterKey,
            value,
            sectionId: selectedSection,
            row: selectedRow,
        });
    };

    handleRepeatingChanged = repeating => {
        const {onSettingsChanged, selectedSection, selectedRow} = this.props;

        onSettingsChanged('changeRepeating', {
            repeating,
            sectionId: selectedSection,
            row: selectedRow,
        });
    };

    handleChangeSorting = alphabeticColumn => {
        const {onSettingsChanged, selectedSection, selectedRow} = this.props;
        const columnIdx = numericColumnName(alphabeticColumn);

        onSettingsChanged('changeOption', {
            key: 'sortByColumn',
            value: columnIdx,
            row: selectedRow,
            sectionId: selectedSection,
        });
    };

    handleChangeSortDesc = desc => {
        const {onSettingsChanged, selectedSection, selectedRow} = this.props;

        onSettingsChanged('changeOption', {
            key: 'sortDesc',
            value: desc,
            row: selectedRow,
            sectionId: selectedSection,
        });
    };

    render() {
        const {
            provider,
            entityUid,
            repeating,
            repeatOptions,
            selectedSection,
            selectedRow,
            onSettingsChanged,
        } = this.props;

        const rowParams = provider.getRowParams(selectedSection, selectedRow);
        const {group_by: groupingParams = {}, filters: filterParams = {}} = rowParams;
        const attributeFilters = Object.entries(filterParams).map(([uid, attribute]) => ({
            value: uid,
            label: attribute.label,
            options: attribute.options,
            selected: attribute.selected,
        }));

        return (
            <Flex alignItems='flex-start'>
                <Flex width={[1, 1, 1, 0.5]} pr={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Row Entity</SectionTitle>
                    <FilterableDropdownList
                        manualValue={provider.getVehicleName(entityUid)}
                        error={provider.getVehicleError(entityUid)}
                        label='Entity'
                        placeholder='E.g. My Fund I'
                        onValueChanged={entity => this.handleEntityChanged(entity)}
                        options={provider.getAvailableEntities()}
                        subLabelKey='description'
                        mb={1}
                    />
                    <FilterableDropdownList
                        manualValue={repeating['label']}
                        label='Repeat For'
                        onValueChanged={repeating => this.handleRepeatingChanged(repeating)}
                        options={repeatOptions}
                        disabled={provider.repeatDisabled(selectedSection, selectedRow)}
                        broadcastFullOption
                        mb={1}
                    />
                    <FilterableDropdownList
                        manualValue={groupingParams.formattedValue}
                        label={groupingParams.label}
                        onValueChanged={group => this.handleGroupingChanged(group)}
                        options={groupingParams.options}
                        disabled={provider.groupedByDisabled(selectedSection, selectedRow)}
                        mb={1}
                    />
                    <AttributeSelectorDropdown
                        items={attributeFilters}
                        onAttributeClicked={this.handleFilterClicked}
                    />
                    <SectionSubTitle>Sorting</SectionSubTitle>
                    <TextInput
                        leftLabel='Sort by column'
                        value={alphabeticColumnName(
                            provider.optionValueForRow(selectedSection, selectedRow, [
                                'sortByColumn',
                            ]),
                        )}
                        onValueChanged={value => this.handleChangeSorting(value)}
                        mb={1}
                    />
                    <Checkbox
                        leftLabel='Sort by descending'
                        checked={provider.optionValueForRow(
                            selectedSection,
                            selectedRow,
                            ['sortDesc'],
                            false,
                        )}
                        onValueChanged={value => this.handleChangeSortDesc(value)}
                        mb={1}
                    />
                </Flex>
                <Flex width={[1, 1, 1, 0.5]} pl={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Row Formatting</SectionTitle>
                    <RowFormattingSettings
                        sectionId={selectedSection}
                        rowIdx={selectedRow}
                        onSettingsChanged={onSettingsChanged}
                        provider={provider}
                    />
                </Flex>
            </Flex>
        );
    }
}

class CellOptions extends Component {
    static propTypes = {
        value: PropTypes.shape({
            valueId: PropTypes.string,
            value: PropTypes.string,
            label: PropTypes.string,
            valueType: PropTypes.string,
            format: PropTypes.string,
        }).isRequired,

        selectedSection: PropTypes.string,
        provider: PropTypes.object.isRequired,

        onSettingsChanged: PropTypes.func.isRequired,
    };

    CellMode = [
        {
            key: 'manual',
            value: CellMode.ManualValue,
            label: 'Manual Value',
        },
        {
            key: 'calculated',
            value: CellMode.CalculatedValue,
            label: 'Calculated Value',
        },
        {
            key: 'dataValue',
            value: CellMode.DataValue,
            label: 'Data Value',
        },
        {
            key: 'dateValue',
            value: CellMode.DateValue,
            label: 'Date Value',
        },
    ];

    handleValueKeyChanged = valueKey => {
        const {onSettingsChanged, value, selectedRow, selectedColumn, selectedSection} = this.props;
        onSettingsChanged('changeValue', {
            valueId: value.valueId,
            valueKey,
            row: selectedRow,
            column: selectedColumn,
            sectionId: selectedSection,
        });
    };

    handleParameterChanged = payload => {
        const {onSettingsChanged, value} = this.props;

        onSettingsChanged('changeParameter', {valueId: value.valueId, ...payload});
    };

    handleEntityChanged = entity => {
        const {onSettingsChanged, value} = this.props;

        onSettingsChanged('changeEntity', {
            valueId: value.valueId,
            entity,
        });
    };

    handleManualValueChange = value => {
        const {onSettingsChanged, selectedSection, selectedRow, selectedColumn} = this.props;

        onSettingsChanged('setManualValue', {
            value,
            sectionId: selectedSection,
            row: selectedRow,
            column: selectedColumn,
        });
    };

    handleDateValueChanged = value => {
        const {onSettingsChanged, selectedSection, selectedRow, selectedColumn} = this.props;
        onSettingsChanged('setDateValue', {
            value,
            sectionId: selectedSection,
            row: selectedRow,
            column: selectedColumn,
        });
    };

    handleDateFormatChanged = format => {
        const {onSettingsChanged, selectedSection, selectedRow, selectedColumn} = this.props;
        onSettingsChanged('setDateFormat', {
            format,
            sectionId: selectedSection,
            row: selectedRow,
            column: selectedColumn,
        });
    };

    handleCalculatedValueChange = key => value => {
        const {onSettingsChanged, selectedSection, selectedRow, selectedColumn} = this.props;

        onSettingsChanged('setCalculatedValue', {
            key,
            value,
            sectionId: selectedSection,
            row: selectedRow,
            column: selectedColumn,
        });
    };

    handleCalculatedOperandChanged = operand => value => {
        let [_, alphabeticColumn, rowIdx] = /([A-Za-z]*)([0-9]*)/g.exec(value);
        let columnIdx;
        if (is_set(alphabeticColumn, true)) {
            columnIdx = numericColumnName(alphabeticColumn) + 1;
        } else {
            columnIdx = null;
        }
        this.handleCalculatedValueChange(operand)(columnIdx);

        if (!is_set(rowIdx, true)) {
            rowIdx = null;
        }
        this.handleCalculatedValueChange(`${operand}Row`)(rowIdx);
    };

    handleCellModeChanged = mode => {
        const {onSettingsChanged, selectedSection, selectedRow, selectedColumn} = this.props;
        onSettingsChanged('setCellMode', {
            sectionId: selectedSection,
            row: selectedRow,
            column: selectedColumn,
            mode,
        });
    };

    renderCellValueForm = () => {
        const {value, selectedRow, selectedColumn, selectedSection, provider} = this.props;

        const calculatedValue = value.calculatedValue || {};
        const dateValue = value.dateValue || {date: {}};
        const cellMode = value.mode;

        const operatorOptions = [
            {label: 'None', value: null},
            {label: 'Add', value: 'add'},
            {label: 'Subtract', value: 'sub'},
            {label: 'Multiply', value: 'mul'},
            {label: 'Divide', value: 'div'},
            {label: 'Distance', value: 'distance'},
            {label: 'Growth', value: 'growth'},
        ];

        const selectedOperator = calculatedValue.operator || null;
        const operatorValue = operatorOptions.find(o => o.value === selectedOperator).label;

        const formatOptions = [
            {label: 'Default', value: null},
            {label: 'Percent', value: 'percentage'},
            {label: 'Multiple', value: 'multiple'},
            {label: 'Money', value: 'money'},
        ];

        const selectedFormat = calculatedValue.format || null;
        const formatValue = formatOptions.find(o => o.value === selectedFormat).label;

        return (
            <Flex flexDirection='column'>
                <SectionSubTitle noTopMargin>Value Type</SectionSubTitle>
                <DropdownList
                    mb={1}
                    label='Type'
                    options={this.CellMode}
                    manualValue={this.CellMode.find(o => o.value === cellMode).label}
                    onValueChanged={this.handleCellModeChanged}
                />
                {cellMode === CellMode.ManualValue && (
                    <TextInput
                        leftLabel='Manual Value'
                        placeholder='Enter a manual value'
                        onValueChanged={this.handleManualValueChange}
                        value={value.manualValue}
                    />
                )}
                {cellMode === CellMode.DataValue && (
                    <Flex flexDirection='column'>
                        <SectionSubTitle>Data Value</SectionSubTitle>
                        <ValueSelector
                            selectedValue={value['value']}
                            valueOptions={provider.getAvailableValues(
                                selectedSection,
                                selectedRow,
                                selectedColumn,
                            )}
                            params={provider.getSelectedValueParams(
                                selectedSection,
                                selectedRow,
                                selectedColumn,
                            )}
                            onValueChanged={this.handleValueKeyChanged}
                            onParameterChanged={this.handleParameterChanged}
                        />
                    </Flex>
                )}
                {cellMode === CellMode.CalculatedValue && (
                    <>
                        <Flex flexDirection='column'>
                            <SectionSubTitle>Operands</SectionSubTitle>
                            <TextInput
                                leftLabel='Left Cell'
                                placeholder='E.g. A'
                                value={combinedName(
                                    calculatedValue.first,
                                    calculatedValue.firstRow,
                                )}
                                onValueChanged={this.handleCalculatedOperandChanged('first')}
                                mb={1}
                            />
                            <TextInput
                                leftLabel='Right Cell'
                                placeholder='E.g. B'
                                value={combinedName(
                                    calculatedValue.second,
                                    calculatedValue.secondRow,
                                )}
                                onValueChanged={this.handleCalculatedOperandChanged('second')}
                            />
                        </Flex>
                        <Flex flexDirection='column'>
                            <SectionSubTitle>Operation</SectionSubTitle>
                            <DropdownList
                                mb={1}
                                label='Operation'
                                manualValue={operatorValue}
                                options={operatorOptions}
                                onValueChanged={this.handleCalculatedValueChange('operator')}
                            />
                            <DropdownList
                                label='Result Format'
                                manualValue={formatValue}
                                options={formatOptions}
                                onValueChanged={this.handleCalculatedValueChange('format')}
                            />
                        </Flex>
                    </>
                )}
                {cellMode === CellMode.DateValue && (
                    <DateSelector
                        formattedValue={provider.formattedDate(dateValue.date, dateValue.format)}
                        date={dateValue.date}
                        timestamp={provider.dateTimestamp(dateValue.date)}
                        onDateValueChanged={this.handleDateValueChanged}
                        onFormatChanged={this.handleDateFormatChanged}
                    />
                )}
            </Flex>
        );
    };

    render() {
        return (
            <Flex>
                <Flex width={[1, 1, 1, 0.5]} pr={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Cell Value</SectionTitle>
                    {this.renderCellValueForm()}
                </Flex>
                <Flex width={[1, 1, 1, 0.5]} pl={[0, 0, 0, 1]} flexDirection='column'>
                    <SectionTitle>Cell Formatting</SectionTitle>
                    <CellFormattingSettings
                        sectionId={this.props.selectedSection}
                        rowIdx={this.props.selectedRow}
                        columnIdx={this.props.selectedColumn}
                        onSettingsChanged={this.props.onSettingsChanged}
                        provider={this.props.provider}
                    />
                </Flex>
            </Flex>
        );
    }
}

class TableSettings extends Component {
    static propTypes = {
        onMoveCell: PropTypes.func,
        onSettingsChanged: PropTypes.func.isRequired,

        provider: PropTypes.object.isRequired,
    };

    constructor(params) {
        super(params);

        this.state = {
            selectedSection: null,
            selectedRow: null,
            selectedColumn: null,
            tableSettingsOpen: false,
            selectionSettingsOpen: true,
        };
    }

    handleCellSelected = (sectionId, row, column) => {
        const {onSettingsChanged} = this.props;

        this.setState({
            selectedRow: row,
            selectedColumn: column,
            selectedSection: sectionId,
            selectionSettingsOpen: is_set(sectionId) && is_set(row) && is_set(column),
        });

        onSettingsChanged('selectCell', {row, column});
    };

    handleRowSelected = (sectionId, rowIdx) => {
        this.setState({
            selectedSection: sectionId,
            selectedRow: rowIdx,
            selectedColumn: null,
        });
    };

    handleColumnSelected = (sectionId, colIdx) => {
        this.setState({
            selectedSection: sectionId,
            selectedRow: null,
            selectedColumn: colIdx,
        });
    };

    handleAddNewSection = (rowCount, columnCount) => {
        this.props.onSettingsChanged('newSection', {rowCount, columnCount});
    };

    handleAddNewRow = (sectionId, position) => {
        this.props.onSettingsChanged('newRow', {sectionId, position});
    };

    handleMoveRow = (sectionId, row, direction) => {
        const {onSettingsChanged, provider} = this.props;
        const {selectedSection, selectedRow} = this.state;

        if (!is_set(sectionId)) {
            sectionId = selectedSection;
        }

        if (!is_set(row)) {
            row = selectedRow;
        }

        onSettingsChanged('moveRow', {
            sectionId,
            row,
            direction,
        });
        const table = provider.tableData();
        const section = table[sectionId];
        const newPos = row + direction;

        if (newPos >= 0 && newPos < section.length) {
            this.setState({
                selectedRow: newPos,
            });
        }
    };

    handleMoveColumn = (sectionId, column, direction) => {
        const {onSettingsChanged, provider} = this.props;
        const {selectedSection, selectedColumn} = this.state;

        if (!is_set(sectionId)) {
            sectionId = selectedSection;
        }

        if (!is_set(column)) {
            column = selectedColumn;
        }

        onSettingsChanged('moveColumn', {
            sectionId,
            column,
            direction,
        });
        const table = provider.tableData();
        const section = table[sectionId];
        const longestRow = section.reduce((longest, {columns}) => {
            return columns.length > longest ? columns.length : longest;
        }, 0);
        const newPos = column + direction;

        if (newPos >= 0 && newPos < longestRow) {
            this.setState({
                selectedColumn: newPos,
            });
        }
    };

    handleAddNewColumn = (sectionId, position) => {
        this.props.onSettingsChanged('newColumn', {sectionId, position});
    };

    handleDeleteColumn = (sectionId, column) => {
        if (this.state.selectedSection == sectionId && this.state.selectedColumn == column) {
            this.setState({
                selectedSection: null,
                selectedRow: null,
                selectedColumn: null,
                contextMenu: null,
            });
        }

        this.props.onSettingsChanged(TableSpecHandler.deleteColumn, {sectionId, column});
    };

    handleDeleteRow = (sectionId, row) => {
        if (this.state.selectedSection == sectionId && this.state.selectedRow == row) {
            this.setState({
                selectedSection: null,
                selectedRow: null,
                selectedColumn: null,
                contextMenu: null,
            });
        }

        this.props.onSettingsChanged(TableSpecHandler.deleteRow, {sectionId, row});
    };

    handleSectionSettingsChanged = (action, payload) => {
        this.props.onSettingsChanged(action, {...payload, sectionId: this.state.selectedSection});
    };

    handleCellSettingsChanged = (action, payload) => {
        this.props.onSettingsChanged(action, {
            ...payload,
            sectionId: this.state.selectedSection,
            row: this.state.selectedRow,
            column: this.state.selectedColumn,
        });
    };

    handleTableSettingsChanged = (key, value) => {
        this.props.onSettingsChanged(TableSpecHandler.changeOption, {key, value});
    };

    toggleTableSettings = () => {
        this.setState(state => ({tableSettingsOpen: !state.tableSettingsOpen}));
    };

    toggleSelectionSettings = () => {
        this.setState(state => ({selectionSettingsOpen: !state.selectionSettingsOpen}));
    };

    renderSelectionOptions = () => {
        const {selectedSection, selectedRow, selectedColumn} = this.state;
        const {provider, selectedComponentId} = this.props;

        if (is_set(selectedSection) && is_set(selectedRow) && is_set(selectedColumn)) {
            return (
                <CellOptions
                    onSettingsChanged={this.handleCellSettingsChanged}
                    value={provider.getCellValue(selectedSection, selectedRow, selectedColumn)}
                    hasCalculated={provider.hasCalculated(
                        selectedSection,
                        selectedRow,
                        selectedColumn,
                    )}
                    selectedRow={selectedRow}
                    selectedColumn={selectedColumn}
                    selectedSection={selectedSection}
                    provider={provider}
                />
            );
        } else if (is_set(selectedSection) && is_set(selectedRow)) {
            return (
                <RowOptions
                    provider={provider}
                    onSettingsChanged={this.handleCellSettingsChanged}
                    entityUid={provider.getSelectedEntityUid(selectedSection, selectedRow)}
                    repeating={provider.getSelectedRepeatOption(selectedSection, selectedRow)}
                    repeatOptions={provider.getRepeatOptions(selectedSection, selectedRow)}
                    selectedSection={selectedSection}
                    selectedRow={selectedRow}
                    valueId={provider.getValueId(selectedSection, selectedRow)}
                    componentId={selectedComponentId}
                />
            );
        } else if (is_set(selectedSection) && is_set(selectedColumn)) {
            return (
                <ColumnOptions
                    provider={provider}
                    selectedSection={selectedSection}
                    selectedColumn={selectedColumn}
                    onSettingsChanged={this.handleCellSettingsChanged}
                />
            );
        }

        return null;
    };

    _selectionDescription() {
        const {selectedSection, selectedRow, selectedColumn} = this.state;
        if (!is_set(selectedSection) && !is_set(selectedRow) && !is_set(selectedColumn)) {
            return (
                <>
                    Settings for <Italic>No Selection Made</Italic>
                </>
            );
        }

        const rowDescription = selectedRow + 1;
        const columnDescription = alphabeticColumnName(selectedColumn);
        let sectionDescription = this.props.provider.sectionIdx(selectedSection) + 1;
        sectionDescription = sectionDescription > 0 ? sectionDescription : '';

        let combinedRowColumnDescription = '';
        if (is_set(selectedColumn) && is_set(selectedRow)) {
            combinedRowColumnDescription = (
                <>
                    for{' '}
                    <Highlight>
                        cell {columnDescription}
                        {rowDescription}
                    </Highlight>
                </>
            );
        } else if (is_set(selectedColumn) && !is_set(selectedRow)) {
            combinedRowColumnDescription = (
                <>
                    for <Highlight>column {columnDescription}</Highlight>
                </>
            );
        } else if (!is_set(selectedColumn) && is_set(selectedRow)) {
            combinedRowColumnDescription = (
                <>
                    for <Highlight>row {rowDescription}</Highlight>
                </>
            );
        }

        return (
            <>
                Settings {combinedRowColumnDescription} in
                <Highlight> Section {sectionDescription}</Highlight>
            </>
        );
    }

    _isSelectionSettingsOpen = () => {
        const hasSelection =
            is_set(this.state.selectedSection) ||
            is_set(this.state.selectedRow) ||
            is_set(this.state.selectedColumn);

        if (!hasSelection) {
            return false;
        }

        if (!is_set(this.state.selectionSettingsOpen)) {
            return hasSelection;
        }

        return this.state.selectionSettingsOpen;
    };

    render() {
        const {selectedSection, selectedRow, selectedColumn} = this.state;
        const {onMoveCell, provider} = this.props;

        const hasSelection =
            is_set(selectedSection) || is_set(selectedRow) || is_set(selectedColumn);
        const tableSettingsHeader = (
            <>
                Settings for <Highlight>Table</Highlight>
            </>
        );

        return (
            <Flex p={3} flexDirection='column'>
                <SectionTitle>Table Structure</SectionTitle>
                <EditTable
                    onMoveCell={onMoveCell}
                    onCellSelected={this.handleCellSelected}
                    onAddNewSection={this.handleAddNewSection}
                    onAddNewRow={this.handleAddNewRow}
                    onAddNewColumn={this.handleAddNewColumn}
                    onDeleteColumn={this.handleDeleteColumn}
                    onMoveColumn={this.handleMoveColumn}
                    onMoveRow={this.handleMoveRow}
                    onDeleteRow={this.handleDeleteRow}
                    onRowSelected={this.handleRowSelected}
                    onColumnSelected={this.handleColumnSelected}
                    table={provider.tableData()}
                    selectedSection={selectedSection}
                    selectedRow={selectedRow}
                    selectedColumn={selectedColumn}
                />
                <SectionTitle>Settings</SectionTitle>
                <Collapsible
                    header={this._selectionDescription()}
                    isOpen={this._isSelectionSettingsOpen()}
                    disabled={!hasSelection}
                    toggleOpen={this.toggleSelectionSettings}
                >
                    {this.renderSelectionOptions(this.props)}
                </Collapsible>
                <Collapsible
                    header={tableSettingsHeader}
                    isOpen={this.state.tableSettingsOpen}
                    toggleOpen={this.toggleTableSettings}
                >
                    <Flex width={[1, 1, 1, 1, 1, 0.5]} pr={[0, 0, 0, 0]} flexDirection='column'>
                        <SectionTitle>Row Styling</SectionTitle>
                        <Checkbox
                            leftLabel='Banded Rows'
                            checked={provider.settingsValueForComponent(['bandedRows'], true)}
                            onValueChanged={value =>
                                this.handleTableSettingsChanged('bandedRows', value)
                            }
                            mb={1}
                        />
                        <Flex mb={1}>
                            <ColorPickerDropdown
                                label='1st Background Color'
                                color={provider.settingsValueForComponent(
                                    ['rowBgColorMain'],
                                    '#FFFFFF',
                                )}
                                colors={provider.getCustomColors()}
                                onChange={value =>
                                    this.handleTableSettingsChanged('rowBgColorMain', value)
                                }
                                mr={1}
                                disabled={!provider.settingsValueForComponent(['bandedRows'], true)}
                            />
                            <ColorPickerDropdown
                                label='2nd Background Color'
                                color={provider.settingsValueForComponent(
                                    ['rowBgColorAlt'],
                                    '#F8F8F9',
                                )}
                                colors={provider.getCustomColors()}
                                onChange={value =>
                                    this.handleTableSettingsChanged('rowBgColorAlt', value)
                                }
                                disabled={!provider.settingsValueForComponent(['bandedRows'], true)}
                            />
                        </Flex>
                    </Flex>
                </Collapsible>
            </Flex>
        );
    }
}

export default TableSettings;
