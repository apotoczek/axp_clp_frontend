import React from 'react';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';
import {CSSTransition} from 'react-transition-group';

import Icon from 'components/basic/Icon';

const Wrapper = styled(Flex)`
    flex: 1;
    min-width: 350px;

    padding: 16px;

    background: ${({theme}) => theme.slideInSidePanel.bg};
    border-left: 1px solid ${({theme}) => theme.slideInSidePanel.border};

    &.slide-in-enter {
        flex: 0;
        min-width: 0;
        opacity: 0;
    }

    &.slide-in-enter-active {
        flex: 1;
        min-width: 350px;
        opacity: 1;
        transition: flex 350ms ease-in-out, min-width 350ms ease-in-out, opacity 350ms ease-in-out;
    }

    &.slide-in-exit {
        flex: 1;
        min-width: 350px;
        opacity: 1;
    }

    &.slide-in-exit-active {
        flex: 0;
        min-width: 0;
        opacity: 0;
        transition: flex 350ms ease-in-out, min-width 350ms ease-in-out, opacity 350ms ease-in-out;
    }
`;

const CloseButton = styled(Box)`
    text-transform: uppercase;
    cursor: pointer;
    width: auto;
    font-weight: 700;
    user-select: none;

    border-radius: 3px;
    padding: 8px 12px;

    &:hover {
        background: #ffffff;
    }
`;

SlideInSidePanel.propTypes = {
    children: PropTypes.node,
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default function SlideInSidePanel({children, visible, onClose}) {
    return (
        <CSSTransition in={visible} timeout={350} classNames='slide-in' unmountOnExit>
            <Wrapper flexDirection='column'>
                <Flex alignSelf='flex-start' mb={2}>
                    <CloseButton onClick={onClose}>
                        <Icon name='menu-left' glyphicon left />
                        Close
                    </CloseButton>
                </Flex>
                <Flex flex={1}>{children}</Flex>
            </Wrapper>
        </CSSTransition>
    );
}
