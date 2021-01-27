import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {CSSTransition} from 'react-transition-group';

import {Description} from 'components/basic/text';

import Dropdown, {DropdownOpenMode} from 'components/basic/forms/dropdowns/Dropdown';

const Content = styled.div`
    background-color: ${({theme}) => theme.textDropdown.bg};
    max-width: 450px;

    padding: 10px 15px;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    border: 1px solid ${({theme}) => theme.textDropdown.border};

    color: ${({theme}) => theme.textDropdown.fg};
    font-size: 14px;

    &.fade-appear {
        opacity: 0;
    }

    &.fade-appear-active {
        opacity: 1;
        transition: opacity 100ms ease-in-out;
    }
`;

const InlineDropdown = styled(Dropdown)`
    display: inline-block;
    cursor: pointer;
`;

TextDropdown.propTypes = {
    ...Dropdown.propTypes,
    content: PropTypes.node,
    className: PropTypes.string,
    children: PropTypes.node,
};

export default function TextDropdown({content, className, children, hoverOpenDelay = 300}) {
    const dropdownContent = (
        <CSSTransition in appear timeout={100} classNames='fade'>
            <Content>
                <Description>{content}</Description>
            </Content>
        </CSSTransition>
    );

    return (
        <InlineDropdown
            className={className}
            content={dropdownContent}
            hoverOpenDelay={hoverOpenDelay}
            openOn={DropdownOpenMode.Hover}
        >
            {children}
        </InlineDropdown>
    );
}
