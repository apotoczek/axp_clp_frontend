import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Icon from 'components/basic/Icon';
import {BarButton, BarTextInput, BarDropdownList} from 'components/dashboards/buttons';

import {FONT_SIZES} from 'utils/handsontableUtils';
import {is_set} from 'src/libs/Utils';

import {DASHBOARDS_DATE_FORMATS as DATE_FORMATS} from 'src/libs/Constants';

const BORDER_OPTIONS = [
    {
        key: 'border-top',
        iconName: 'border-top',
        subLabel: 'Top Border',
        value: {
            width: 1,
            position: 'top',
        },
    },
    {
        key: 'border-right',
        iconName: 'border-right',
        subLabel: 'Right Border',
        value: {
            width: 1,
            position: 'right',
        },
    },
    {
        key: 'border-bottom',
        iconName: 'border-bottom',
        subLabel: 'Bottom Border',
        value: {
            width: 1,
            position: 'bottom',
        },
    },
    {
        key: 'border-left',
        iconName: 'border-left',
        subLabel: 'Left Border',
        value: {
            width: 1,
            position: 'left',
        },
    },
    {
        key: 'thick-border-top',
        iconName: 'border-top',
        subLabel: 'Thick Top Border',
        value: {
            width: 2,
            position: 'top',
        },
    },
    {
        key: 'thick-border-right',
        iconName: 'border-right',
        subLabel: 'Thick Right Border',
        value: {
            width: 2,
            position: 'right',
        },
    },
    {
        key: 'thick-border-bottom',
        iconName: 'border-bottom',
        subLabel: 'Thick Bottom Border',
        value: {
            width: 2,
            position: 'bottom',
        },
    },
    {
        key: 'thick-border-left',
        iconName: 'border-left',
        subLabel: 'Thick Left Border',
        value: {
            width: 2,
            position: 'left',
        },
    },
    {
        key: 'border-none',
        iconName: 'border-none',
        subLabel: 'No Border',
        value: null,
    },
];

const ToolbarItem = styled(Flex)`
    cursor: pointer;
    padding: 0 6px;
    margin: 3px 1px;
    color: ${({theme}) => theme.input.labelFg};
    align-items: center;
    justify-content: space-around;
    min-width: 28px;
    border-radius: 3px;

    user-select: none;

    &:hover {
        color: ${({theme}) => theme.cobaltSpreadsheet.toolbar.selectedFg};
    }

    ${props =>
        props.selected &&
        css`
            color: ${({theme}) => theme.cobaltSpreadsheet.toolbar.selectedFg};
        `}
`;

const CharItem = styled.div`
    position: relative;
    font-size: 50px;
    top: -20px;
    line-height: 1px;
`;

const DropdownToolbarItem = styled(ToolbarItem)`
    background: none;

    &:hover {
        background: none;
    }
`;

const MoreSettingsContainer = styled(Flex)`
    position: absolute;
    transform: translateX(calc(-100% + 16px));
    top: 36px;
    z-index: 100;
    background: ${({theme}) => theme.dashboard.componentBar.bg};
    border: 1px solid ${({theme}) => theme.dashboard.componentBar.separator};
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    padding: 2px 0;
    align-items: center;
`;

export const ToolbarSection = styled(Flex)`
    border-right: 1px solid ${({theme}) => theme.cobaltSpreadsheet.toolbar.sectionBorder};
    padding: 0 12px;
    align-items: center;

    &:last-child {
        border: none;
    }

    &:first-child {
        padding-left: 0;
    }
`;

export default class HandsontableToolbar extends Component {
    static propTypes = {
        onSettingsChanged: PropTypes.func.isRequired,
    };

    state = {
        isMoreSettingsOpen: true,
    };

    handleChangeStyle = (key, value) => {
        const {selectedRow: row, selectedColumn: column, subSelection} = this.props.sharedState;
        if (!is_set(row) || !is_set(column)) {
            return;
        }
        this.props.onSettingsChanged('changeStyle', {
            row,
            column,
            subSelection,
            key,
            value,
        });
    };

    handleAddColumn = () => {
        this.props.onSettingsChanged('addColumn', {});
    };

    handleAddRow = () => {
        this.props.onSettingsChanged('addRow', {});
    };

    handleChangeFormula = formula => {
        const {
            sharedState: {selectedRow: row, selectedColumn: column},
        } = this.props;
        if (!is_set(row) || !is_set(column)) {
            return;
        }
        this.props.onSettingsChanged('setFormula', {changes: [[row, column, formula]]});
    };

    toggleMoreSettings = () => {
        this.setState(state => ({isMoreSettingsOpen: !state.isMoreSettingsOpen}));
    };

    handleAddBorder = value => {
        const {subSelection} = this.props.sharedState;
        if (!is_set(subSelection)) {
            return;
        }

        if (value === null) {
            this.props.onSettingsChanged('clearBorders', {subSelection});
            return;
        }

        this.props.onSettingsChanged('addBorder', {value, subSelection});
    };

    render() {
        const {
            settingsProvider,
            sharedState: {selectedRow: row, selectedColumn: column},
        } = this.props;
        let cell = {};
        let styles = {};

        // This is a little awkard but works for now. How should we handle selected row etc.?
        if (is_set(row) && is_set(column)) {
            styles = settingsProvider.styles(row, column);
            cell = settingsProvider.getCell(row, column);
        }

        return (
            <Flex flex={1}>
                <ToolbarSection justifyContent='flex-end'>
                    <BarButton onClick={this.handleAddColumn} mr={2}>
                        <Icon bisonicon name='add-column' size={20} button />
                    </BarButton>
                    <BarButton onClick={this.handleAddRow} ml={2}>
                        <Icon bisonicon name='add-row' size={20} button />
                    </BarButton>
                </ToolbarSection>
                <ToolbarSection justifyContent='center'>
                    <BarButton onClick={this.props.toggleComponentSettings}>=VARIABLES</BarButton>
                </ToolbarSection>
                <ToolbarSection flex={1}>
                    <BarTextInput
                        value={cell.formula}
                        leftIcon='formula'
                        leftBisonicon
                        placeholder='=4+3   or   =REVENUE/EBITDA'
                        onValueChanged={this.handleChangeFormula}
                        flex={1}
                    />
                </ToolbarSection>
                <ToolbarSection>
                    <DropdownToolbarItem>
                        <BarDropdownList
                            noBorder
                            leftIcon='text-size'
                            leftGlyphicon
                            label={styles.fontSize || '12'}
                            options={FONT_SIZES}
                            onValueChanged={size => this.handleChangeStyle('fontSize', size)}
                        />
                    </DropdownToolbarItem>
                    <ToolbarItem
                        selected={styles.bold}
                        onClick={() => this.handleChangeStyle('bold', !styles.bold)}
                    >
                        <Icon bisonicon name='bold' title='Bold' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.italic}
                        onClick={() => this.handleChangeStyle('italic', !styles.italic)}
                    >
                        <Icon bisonicon name='italic' title='Italic' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.underline}
                        onClick={() => this.handleChangeStyle('underline', !styles.underline)}
                    >
                        <Icon bisonicon name='underline' title='Underline' size={20} />
                    </ToolbarItem>
                </ToolbarSection>
                <ToolbarSection>
                    <DropdownToolbarItem>
                        <BarDropdownList
                            noBorder
                            leftIcon='border-none'
                            leftBisonicon
                            iconType='bisonicon'
                            iconKey='iconName'
                            options={BORDER_OPTIONS}
                            onValueChanged={value => this.handleAddBorder(value)}
                            on
                        />
                    </DropdownToolbarItem>
                    <ToolbarSection justifyContent='flex-start'>
                        <Icon
                            name='option-vertical'
                            glyphicon
                            button
                            onClick={this.toggleMoreSettings}
                        />
                        {this.state.isMoreSettingsOpen && (
                            <MoreSettingsDropdown
                                styles={styles}
                                sharedState={this.props.sharedState}
                                onSettingsChanged={this.props.onSettingsChanged}
                                settingsProvider={this.props.settingsProvider}
                                onChangeStyle={this.handleChangeStyle}
                            />
                        )}
                    </ToolbarSection>
                </ToolbarSection>
            </Flex>
        );
    }
}

class MoreSettingsDropdown extends Component {
    handleChangeCurrency = currency => {
        const {selectedRow: row, selectedColumn: column, subSelection} = this.props.sharedState;
        this.props.onSettingsChanged('changeStyle', {
            row,
            column,
            subSelection,
            key: 'format',
            value: 'money',
        });

        this.props.onSettingsChanged('changeStyle', {
            row,
            column,
            subSelection,
            key: 'subFormat',
            value: currency,
        });
    };

    handleIncreaseMantissa = mantissa => {
        this.props.onChangeStyle('mantissa', (mantissa || 0) + 1);
    };

    handleDecreaseMantissa = mantissa => {
        this.props.onChangeStyle('mantissa', Math.max(-2, (mantissa || 0) - 1));
    };

    handleMergeCells = () => {
        const {subSelection} = this.props.sharedState;
        if (!is_set(subSelection) || subSelection <= 1) {
            // Not possible to merge no cells or a single cell
            return;
        }

        const [firstX, firstY] = subSelection[0];
        let xMin = firstX,
            yMin = firstY,
            xMax = firstX,
            yMax = firstY;

        for (const [x, y] of subSelection) {
            xMin = x < xMin ? x : xMin;
            xMax = x > xMax ? x : xMax;
            yMin = y < yMin ? y : yMin;
            yMax = y > yMax ? y : yMax;
        }

        if (this.props.settingsProvider.isMerged(firstX, firstY)) {
            this.props.onSettingsChanged('unmergeCells', {
                fromRow: xMin,
                fromCol: yMin,
                toCol: yMax,
                toRow: xMax,
            });
            return;
        }

        this.props.onSettingsChanged('mergeCells', {
            fromRow: xMin,
            fromCol: yMin,
            toCol: yMax,
            toRow: xMax,
        });
    };

    render() {
        const {
            styles,
            settingsProvider,
            sharedState: {selectedRow: row, selectedColumn: column},
        } = this.props;

        return (
            <MoreSettingsContainer>
                <ToolbarSection>
                    <ToolbarItem
                        selected={styles.stroke}
                        onClick={() => this.props.onChangeStyle('stroke', !styles.stroke)}
                    >
                        <Icon bisonicon name='strike-through' title='Strikethrough' size={20} />
                    </ToolbarItem>
                    <ToolbarItem>
                        <ColorPickerDropdown
                            color={styles.color}
                            colors={settingsProvider.getCustomColors()}
                            onChange={color => this.props.onChangeStyle('color', color)}
                        >
                            <Icon color={styles.color} bisonicon name='text-color' size={20} />
                        </ColorPickerDropdown>
                    </ToolbarItem>
                    <ToolbarItem>
                        <ColorPickerDropdown
                            color={styles.backgroundColor}
                            colors={settingsProvider.getCustomColors()}
                            onChange={color => this.props.onChangeStyle('backgroundColor', color)}
                        >
                            <Icon
                                color={styles.backgroundColor}
                                bisonicon
                                name='fill-color'
                                size={20}
                            />
                        </ColorPickerDropdown>
                    </ToolbarItem>
                </ToolbarSection>
                <ToolbarSection>
                    <ToolbarItem
                        selected={styles.format === 'percent'}
                        onClick={() => this.props.onChangeStyle('format', 'percent')}
                    >
                        <Icon bisonicon name='percent' title='Display as percentage' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.format === 'money'}
                        onClick={() => this.handleChangeCurrency('en-US')}
                    >
                        <Icon bisonicon name='currency-usd' title='Display as USD' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.thousandSeparated}
                        onClick={() =>
                            this.props.onChangeStyle('thousandSeparated', !styles.thousandSeparated)
                        }
                    >
                        <CharItem title='Separate thousands'>,</CharItem>
                    </ToolbarItem>
                    <ToolbarItem onClick={() => this.handleIncreaseMantissa(styles.mantissa)}>
                        <Icon bisonicon name='decimal-increase' title='Add decimal' size={20} />
                    </ToolbarItem>
                    <ToolbarItem onClick={() => this.handleDecreaseMantissa(styles.mantissa)}>
                        <Icon bisonicon name='decimal-decrease' title='Remove decimal' size={20} />
                    </ToolbarItem>
                    <ToolbarItem onClick={() => this.props.onChangeStyle('format', undefined)}>
                        <Icon
                            bisonicon
                            name='clear-formatting'
                            title='Clear formatting'
                            size={20}
                        />
                    </ToolbarItem>
                </ToolbarSection>
                <ToolbarSection>
                    <ToolbarItem selected={styles.format === 'date'}>
                        <DropdownList
                            options={DATE_FORMATS}
                            onValueChanged={val => {
                                if (styles.format === 'date' && styles.dateFormat === val) {
                                    this.props.onChangeStyle('format', undefined);
                                    this.props.onChangeStyle('dateFormat', undefined);
                                } else {
                                    this.props.onChangeStyle('format', 'date');
                                    this.props.onChangeStyle('dateFormat', val);
                                }
                            }}
                            value={styles.dateFormat}
                        >
                            <Icon bisonicon name='calendar' title='Convert to date' size={20} />
                        </DropdownList>
                    </ToolbarItem>
                </ToolbarSection>
                <ToolbarSection>
                    <ToolbarItem
                        selected={settingsProvider.isMerged(row, column)}
                        onClick={this.handleMergeCells}
                    >
                        <Icon bisonicon name='merge-cells' title='Merge cells' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.horizontal === 'htLeft'}
                        onClick={() => this.props.onChangeStyle('horizontal', 'htLeft')}
                    >
                        <Icon bisonicon name='align-left' title='Align left' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.horizontal === 'htCenter'}
                        onClick={() => this.props.onChangeStyle('horizontal', 'htCenter')}
                    >
                        <Icon bisonicon name='align-center' title='Align center' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.horizontal === 'htRight'}
                        onClick={() => this.props.onChangeStyle('horizontal', 'htRight')}
                    >
                        <Icon bisonicon name='align-right' title='Align right' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.horizontal === 'htJustify'}
                        onClick={() => this.props.onChangeStyle('horizontal', 'htJustify')}
                    >
                        <Icon bisonicon name='align-justify' title='Justify' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.vertical === 'htTop'}
                        onClick={() => this.props.onChangeStyle('vertical', 'htTop')}
                    >
                        <Icon bisonicon name='align-top' title='Align top' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.vertical === 'htMiddle'}
                        onClick={() => this.props.onChangeStyle('vertical', 'htMiddle')}
                    >
                        <Icon bisonicon name='align-middle' title='Center vertically' size={20} />
                    </ToolbarItem>
                    <ToolbarItem
                        selected={styles.vertical === 'htBottom'}
                        onClick={() => this.props.onChangeStyle('vertical', 'htBottom')}
                    >
                        <Icon bisonicon name='align-bottom' title='Align bottom' size={20} />
                    </ToolbarItem>
                </ToolbarSection>
            </MoreSettingsContainer>
        );
    }
}
