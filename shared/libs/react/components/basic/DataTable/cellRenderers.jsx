import React from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import {contextual_url} from 'src/libs/Utils';
import Icon from 'components/basic/Icon';
import {Link} from 'components/basic/text';
import Dropdown, {
    DropdownOpenMode,
    DropdownOpenLocation,
} from 'components/basic/forms/dropdowns/Dropdown';

import {gen_formatter} from 'src/libs/Formatters';

const Muted = styled.span`
    color: ${({theme}) => theme.dataTable.mutedFg};
`;

export function defaultCellRenderer({cellData, columnData, rowData}) {
    if (cellData === null || cellData === undefined) {
        return <Muted>N/A</Muted>;
    }

    let formatted;

    if (columnData.format) {
        const formatter = gen_formatter(columnData);
        formatted = formatter(cellData);
    } else if (typeof columnData.formatter === 'function') {
        formatted = columnData.formatter({cellData, columnData, rowData});
    } else {
        formatted = String(cellData);
    }

    if (columnData.link) {
        const url = contextual_url(rowData, {
            url: columnData.link,
        });

        formatted = (
            <a href={url} onClick={e => e.stopPropagation()}>
                {formatted}
            </a>
        );
    }

    return formatted;
}

const CellWrapper = styled.div`
    display: relative;
`;

const ContextMenu = styled(Flex)`
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    background: #f5f5f5;
    border-radius: 4px;
    flex-direction: column;
`;

const ContextMenuItem = styled(Box)`
    border-bottom: 1px solid #e4e8ee;
    padding: 6px 8px;
    font-size: 12px;
    color: #212428;
    min-width: 150px;
    cursor: pointer;

    &:hover {
        background: #ffffff;
    }

    &:first-child {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }

    &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        border-bottom: none;
    }
`;

function ContextMenuCell({contextMenuGetter, cellRenderer, cellData, columnData, rowData}) {
    const contextMenuOptions = contextMenuGetter({cellData, columnData, rowData}) ?? [];
    const CellRenderer = cellRenderer;

    return (
        <CellWrapper>
            <Dropdown
                openLocation={DropdownOpenLocation.MouseCoordinate}
                openWith={DropdownOpenMode.ContextMenuClick | DropdownOpenMode.Click}
                render={({togglePopover}) => (
                    <ContextMenu>
                        {contextMenuOptions.map(item => (
                            <ContextMenuItem
                                onClick={e => {
                                    togglePopover();
                                    item.onClick(e);
                                }}
                                key={item.key}
                            >
                                {item.label}
                            </ContextMenuItem>
                        ))}
                    </ContextMenu>
                )}
            >
                <CellRenderer {...{cellData, columnData, rowData}} />
            </Dropdown>
        </CellWrapper>
    );
}

export function contextMenuCellRenderer(contextMenuGetter, cellRenderer = linkCellRenderer) {
    return function ContextMenuCellWrapper({cellData, columnData, rowData}) {
        return (
            <ContextMenuCell
                cellData={cellData}
                columnData={columnData}
                rowData={rowData}
                contextMenuGetter={contextMenuGetter}
                cellRenderer={cellRenderer}
            />
        );
    };
}

export function linkCellRenderer({cellData, rowData, columnData}) {
    if (cellData === null || cellData === undefined) {
        return <Muted>N/A</Muted>;
    }

    return <Link>{defaultCellRenderer({cellData, rowData, columnData})}</Link>;
}

export const DotsCell = styled(Icon).attrs(_props => ({
    name: 'option-vertical',
    button: true,
    glyphicon: true,
}))`
    padding: 6px 8px;
`;

const Bad = styled.span`
    color: #c33a3a;
`;

const Mediocre = styled.span`
    color: #bbbbbb;
`;

const Good = styled.span`
    color: #3ac376;
`;

export function highlightedValueCellRenderer(thresholds, invert = false) {
    return function HighlightedValueCell({cellData, columnData, rowData}) {
        let TextStyler = Bad;
        if (invert) {
            if (cellData < thresholds?.max ?? false) {
                TextStyler = Good;
            } else if ((cellData <= thresholds?.min && cellData >= thresholds?.max) ?? false) {
                TextStyler = Mediocre;
            }
        } else {
            if (cellData > thresholds?.max ?? false) {
                TextStyler = Good;
            } else if ((cellData >= thresholds?.min && cellData <= thresholds?.max) ?? false) {
                TextStyler = Mediocre;
            }
        }

        return <TextStyler>{defaultCellRenderer({cellData, columnData, rowData})}</TextStyler>;
    };
}
