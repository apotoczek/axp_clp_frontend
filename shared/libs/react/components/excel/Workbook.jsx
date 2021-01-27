import PropTypes from 'prop-types';
import React from 'react';

import {Wrapper as FormWrapper} from 'components/basic/forms/base';

import styled from 'styled-components';
import Sheet from 'components/excel/Sheet';
import {dataType, dimensionsType, selectionType, cellColorsType} from 'components/excel/Sheet';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;

    .excelGrid {
        outline: none;
        user-select: none;
        background-color: #ffffff;
    }
`;

const SheetSelector = styled.div`
    width: 100%;
    height: 50px;
    background-color: #616a75;
    overflow-x: auto;
    white-space: nowrap;
`;

const SheetButton = styled(FormWrapper)`
    display: inline-block;
    margin: 6px 0 0 6px;
    max-height: 40px;
    padding: 8px 16px;
    color: #ffffff;
    text-align: center;
    user-select: none;
    cursor: pointer;

    background-color: ${props => (props.active ? '#323E4C' : 'transparent')};

    :hover {
        background-color: '#323E4C';
    }
`;

export const sheetsType = PropTypes.arrayOf(PropTypes.string.isRequired);
export const sheetDataType = PropTypes.arrayOf(dataType.isRequired);
export const sheetDimensionsType = PropTypes.arrayOf(dimensionsType.isRequired);
export const sheetSelectionType = PropTypes.objectOf(selectionType.isRequired);
export const sheetCellColorsType = PropTypes.objectOf(cellColorsType.isRequired);

export default class Workbook extends React.PureComponent {
    static propTypes = {
        activeSheet: PropTypes.number.isRequired,
        sheets: sheetsType.isRequired,
        onClickCell: PropTypes.func,

        sheetData: sheetDataType.isRequired,
        sheetDimensions: sheetDimensionsType.isRequired,
        sheetSelection: sheetSelectionType.isRequired,
        sheetCellColors: sheetCellColorsType.isRequired,
    };

    handleSheetChanged(idx) {
        const {onSheetChanged} = this.props;

        if (typeof onSheetChanged === 'function') {
            onSheetChanged(idx);
        }
    }

    scrollToCell = (...args) => this.sheet.scrollToCell(...args);

    render() {
        const {
            activeSheet,
            sheets,
            sheetData,
            sheetDimensions,
            sheetSelection,
            sheetCellColors,
            onClickCell,
        } = this.props;

        return (
            <Wrapper>
                <Sheet
                    ref={ref => (this.sheet = ref)}
                    data={sheetData[activeSheet]}
                    selection={sheetSelection[activeSheet]}
                    cellColors={sheetCellColors[activeSheet]}
                    onClickCell={onClickCell}
                    dimensions={sheetDimensions[activeSheet]}
                />
                <SheetSelector>
                    {sheets.map((label, idx) => (
                        <SheetButton
                            key={label}
                            active={idx === activeSheet}
                            onClick={() => this.handleSheetChanged(idx)}
                        >
                            {label}
                        </SheetButton>
                    ))}
                </SheetSelector>
            </Wrapper>
        );
    }
}
