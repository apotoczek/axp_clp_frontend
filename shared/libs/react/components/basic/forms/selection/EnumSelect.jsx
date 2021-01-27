import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    box-sizing: border-box;
    border: 1px solid ${({theme}) => theme.multiSelect.enumItemBorder};
`;

const EnumItem = styled.div`
    box-sizing: border-box;
    user-select: none;
    padding: 3px 0;
    height: 100%;
    border-right: 1px solid ${({theme}) => theme.multiSelect.enumItemBorder};
    &:last-child {
        border-right-width: 0;
    }
    text-align: center;
    display: inline-block;
    width: ${({width}) => width};
    transition: 0.12s;
    &:hover {
        background-color: ${({theme}) => theme.multiSelect.enumItemBgHover};
    }
    &:active {
        background-color: ${({theme}) => theme.multiSelect.enumItemBgActive};
    }
    background-color: ${props =>
        props.active
            ? props.theme.multiSelect.enumItemBgActive
            : props.theme.multiSelect.enumItemBg};
    color: ${props =>
        props.active
            ? props.theme.multiSelect.enumItemFgActive
            : props.theme.multiSelect.enumItemFg};
    font-size: 0.85em;
    cursor: pointer;
`;

const EnumSelect = ({options, selected, onSelect}) => (
    <Wrapper>
        {options.map(o => (
            <EnumItem
                key={o.value}
                active={o.value === selected.value}
                onClick={() => onSelect(o)}
                width={`${100 / options.length}%`}
            >
                {o.text || o.label}
            </EnumItem>
        ))}
    </Wrapper>
);
export default EnumSelect;
