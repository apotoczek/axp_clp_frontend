import React from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Link} from 'react-router-dom';

import {is_set} from 'src/libs/Utils';

const A = styled.a`
    text-decoration: none;
    &:hover {
        text-decoration: none;
    }
`;

export const NonRouterLink = ({to, ...rest}) => <A href={to} {...rest} />;

CPanelModeButton.propTypes = {
    children: PropTypes.node,
    linkComponent: PropTypes.elementType,
    onClick: PropTypes.func,
    to: PropTypes.string,
};

function CPanelModeButton({to, onClick, children, linkComponent, ...restProps}) {
    if (!is_set(to, true)) {
        return (
            <Wrapper {...restProps} onClick={onClick}>
                {children}
            </Wrapper>
        );
    }

    const LinkComponent = linkComponent || Link;

    return (
        <LinkComponent to={to}>
            <Wrapper {...restProps}>{children}</Wrapper>
        </LinkComponent>
    );
}

const Wrapper = styled.div`
    color: ${({theme}) => theme.cPanel.modeButtonFg};
    font-size: 12px;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
    padding: 8px 10px;

    ${props =>
        props.isActive &&
        css`
            background: ${({theme}) => theme.cPanel.modeButtonBg};
            border-left: 4px solid ${({theme}) => theme.cPanel.modeButtonBorder};
            padding-right: 6px;
            color: ${({theme}) => theme.cPanel.modeButtonActiveFg};
        `}
`;

export default CPanelModeButton;
