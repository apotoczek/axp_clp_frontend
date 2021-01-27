import React, {useCallback} from 'react';
import styled, {css} from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import Icon from 'components/basic/Icon';

const CollapsibleWrapper = styled(Flex)`
    background: ${({theme}) => theme.dashboard.settings.collapsible.bg};
    color: ${({theme}) => theme.dashboard.settings.collapsible.fg};
    border: 1px solid ${({theme}) => theme.dashboard.settings.collapsible.border};
    border-radius: 3px;

    transition: flex 150ms ease-out;
    user-select: none;

    ${props =>
        props.disabled &&
        css`
            opacity: 0.5;
        `}
`;

const HeaderWrapper = styled(Flex)`
    cursor: pointer;
    padding: 8px 4px;

    background: ${({theme}) => theme.dashboard.settings.collapsible.headerBg};
    ${props =>
        !props.disabled &&
        css`
            &:hover {
                background: ${({theme}) => theme.dashboard.settings.collapsible.headerHoverBg};
            }
        `}

    ${props =>
        props.disabled &&
        css`
            cursor: not-allowed;
        `}
`;

const HorizontalScroll = styled(Flex)`
    overflow-x: auto;
`;

const Header = styled.span`
    margin: 0;
    font-size: 11px;
    color: ${({theme}) => theme.input.labelFg};
    letter-spacing: 0.86px;
    text-transform: uppercase;
    user-select: none;
`;

export default function Collapsible({
    header,
    disabled,
    children,
    isOpen,
    toggleOpen = () => {},
    headerRightContent,
}) {
    const onClickHeader = useCallback(() => {
        if (disabled) {
            return;
        }

        toggleOpen();
    }, [disabled, toggleOpen]);

    return (
        <CollapsibleWrapper disabled={disabled} flexDirection='column' mb={2}>
            <HeaderWrapper disabled={disabled} onClick={onClickHeader} alignItems='center'>
                <Icon name={isOpen ? 'down-dir' : 'right-dir'} />
                <Box flex={1}>
                    <Header>{header}</Header>
                </Box>
                <Flex alignSelf='flex-end'>{headerRightContent}</Flex>
            </HeaderWrapper>
            {isOpen && !disabled && (
                <HorizontalScroll flexDirection='column' px={2} py={3}>
                    {children}
                </HorizontalScroll>
            )}
        </CollapsibleWrapper>
    );
}
