import React from 'react';
import styled, {css} from 'styled-components';

import {interleave} from 'src/libs/Utils';

const ContextMenuWrapper = styled.div`
    background-color: ${({theme}) => theme.directoryIndex.contextMenuBg};
    border: 1px solid ${({theme}) => theme.directoryIndex.contextMenuBorder};
    position: fixed;
    z-index: 9001;
    border-radius: 7px;
    overflow: hidden;
    font-size: 13px;
    text-align: left;

    ${({posX}) =>
        posX > window.innerWidth / 2
            ? css`
                  right: ${window.innerWidth - posX}px;
              `
            : css`
                  left: ${posX}px;
              `}
    ${({posY}) =>
        posY > window.innerHeight / 2
            ? css`
                  bottom: ${window.innerHeight - posY}px;
              `
            : css`
                  top: ${posY}px;
              `}
`;

const ContextMenuEntry = styled.div`
    padding: 7px 11px;
    background-color: ${({theme}) => theme.directoryIndex.contextMenuBg};
    color: ${({theme}) => theme.directoryIndex.contextMenuFg};
    cursor: pointer;
    font-weight: 700;
    &:hover {
        background-color: ${({theme}) => theme.directoryIndex.contextMenuHoverBg};
    }
`;

const ContextMenuSeparator = styled.hr`
    margin: 0;
    border-color: ${({theme}) => theme.directoryIndex.contextMenuBorder};
`;

const stopPropagation = callback => event => {
    event.stopPropagation();
    if (callback) {
        callback();
    }
};

export default function ContextMenu({posX, posY, items}) {
    const menuItems = items.map(item => (
        <ContextMenuEntry key={item.key} onClick={stopPropagation(item.onClick)}>
            {item.label}
        </ContextMenuEntry>
    ));

    return (
        <ContextMenuWrapper posX={posX} posY={posY}>
            {interleave(v => <ContextMenuSeparator key={`${v.key}_after`} />)(menuItems)}
        </ContextMenuWrapper>
    );
}
