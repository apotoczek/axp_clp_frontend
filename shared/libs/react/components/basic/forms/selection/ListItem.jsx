import React from 'react';
import styled, {css} from 'styled-components';
import PropTypes from 'prop-types';

const StyledItem = styled.div`
    display: block;
    user-select: none;
    font-size: 0.9em;
    box-sizing: border-box;
    text-align: left;
    border-bottom: 1px solid ${({theme}) => theme.multiSelect.listItemBorder};
    cursor: pointer;
    margin-left: -14px;
    transition: 0.14s;

    ${props =>
        props.index % 2 === 0 &&
        css`
            background-color: ${({theme}) => theme.multiSelect.listItemBgOdd};
        `}

    &:hover {
        margin-left: 0;
        margin-right: -14px;
    }

    &:active {
        margin-left: -14px;
        margin-right: 0;
    }

    ${props =>
        props.disabled &&
        css`
            pointer-events: none;
            opacity: 0.5;
        `}
`;

const Faded = styled.span`
    float: ${p => p.float || 'none'};
    font-size: 0.8em;
    color: ${({theme}) => theme.multiSelect.listItemFadedFg};
    padding-top: 12px;
    margin-right: 4px;
`;

const ActionIcon = styled.div`
    display: inline-block;
    font-size: 1em;
    text-align: center;
    height: 100%;
    width: 14px;
    margin-right: 6px;
    padding: 10px 0;
    background-color: ${props => props.color};
    color: #ffffff;
`;

const ListItem = ({
    item,
    index,
    onClick,
    actionColor,
    actionSym,
    labelKey = 'name',
    metaKey = undefined,
    disabled = false,
}) => (
    <StyledItem index={index} disabled={disabled} onClick={() => !disabled && onClick(item)}>
        <ActionIcon color={actionColor}>{actionSym}</ActionIcon>
        <span>{item[labelKey]}</span>
        {metaKey && <Faded float='right'>{item[metaKey]}</Faded>}
    </StyledItem>
);
ListItem.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    actionColor: PropTypes.string.isRequired,
    actionSym: PropTypes.string.isRequired,
    labelKey: PropTypes.string.isRequired,
    metaKey: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
};

export default ListItem;
