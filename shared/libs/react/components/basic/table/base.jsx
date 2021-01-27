import React from 'react';
import styled, {css} from 'styled-components';

export const Table = props => {
    const mappedChildren = React.Children.map(props.children, child =>
        React.cloneElement(child, {
            striped: props.striped,
            stripedBgMain: props.stripedBgMain,
            stripedBgAlt: props.stripedBgAlt,
        }),
    );

    return <TableWrapper>{mappedChildren}</TableWrapper>;
};

const TableWrapper = styled.table`
    width: 100%;
    margin: 0;
    padding: 0;
`;

export const TableHead = props => {
    const mappedChildren = React.Children.map(props.children, child =>
        React.cloneElement(child, {
            striped: props.striped,
            header: true,
        }),
    );

    return <thead>{mappedChildren}</thead>;
};

export const TableBody = props => {
    const mappedChildren = React.Children.map(props.children, child =>
        React.cloneElement(child, {
            striped: props.striped,
            stripedBgMain: props.stripedBgMain,
            stripedBgAlt: props.stripedBgAlt,
        }),
    );

    return <tbody>{mappedChildren}</tbody>;
};

export const Row = ({striped, children, ...rest}) => {
    return (
        <RowWrapper striped={striped} {...rest}>
            {children}
        </RowWrapper>
    );
};

const RowWrapper = styled.tr`
    padding: 0;
    margin: 0;

    /* LIGHT THEME */
    background: ${props => props.stripedBgMain || props.theme.basicTable.bg};
    color: ${({theme}) => theme.basicTable.fg};
    ${props =>
        props.striped &&
        css`
            &:nth-child(even) {
                background: ${props => props.stripedBgAlt || props.theme.basicTable.bgAlt};
            }
        `}

    ${({header}) =>
        header &&
        css`
            background: transparent;
        `};
`;

export const Cell = props => {
    if (props.header) {
        return (
            <HeaderCell as='th' {...props}>
                {props.children}
            </HeaderCell>
        );
    }

    return <TableCell {...props}>{props.children}</TableCell>;
};

// Defines the base of a cell, used for defining header cells and body cells.
const CellBase = styled.td`
    margin: 0;
    padding: 8px 10px;

    letter-spacing: 1px;

    ${props =>
        props.textBold &&
        css`
            font-weight: 700;
        `}
    ${props =>
        props.textItalic &&
        css`
            font-style: italic;
        `}

    text-align: ${props => props.textAlignment};
    font-size: ${props => props.textSize || 12}px;
    color: ${props => props.textColor || 'inherit'}px;
    background: ${props => props.backgroundColor || 'transparent'};
    column-count: ${props => props.colSpan || 'none'};
    border-top: ${props => props.borderTop && '1px solid #000000'};
    border-bottom: ${props => props.borderBottom && '1px solid #000000'};
    border-left: ${props => props.borderLeft && '1px solid #000000'};
    border-right: ${props => props.borderRight && '1px solid #000000'};

    overflow: hidden;
`;

/**
 * Cell that goes into the header of the table.
 */
const HeaderCell = styled(CellBase)`
    font-weight: 700;
    text-transform: uppercase;

    background: ${props => !props.backgroundColor && props.theme.basicTable.headerBg};
    border-bottom: 1px solid
        ${props => (props.borderBottom ? '#000000' : props.theme.basicTable.headerBorder)};
    color: ${props => props.theme.basicTable.headerFg};
    padding: 10px;
`;

/**
 * Cell that goes into the body of the table.
 */
const TableCell = styled(CellBase)`
    user-select: none;
`;
