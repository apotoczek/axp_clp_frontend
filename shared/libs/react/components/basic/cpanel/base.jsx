import React from 'react';
import styled, {css} from 'styled-components';
import PropTypes from 'prop-types';

import {darken} from 'polished';

import {CPanelElementMixin} from 'components/basic/cpanel/mixins';

export const CPanelSection = styled.div`
    padding: 10px;
    margin-bottom: 20px;

    width: ${props => (props.pct ? `${props.pct}%` : '100%')};
`;

export const CPanelSectionTitle = styled.div`
    margin-bottom: 10px;

    color: ${({theme}) => theme.cPanel.fg};
    font-weight: 700;
    font-size: 11px;

    text-transform: uppercase;
    letter-spacing: 1px;
`;

export const CPanelButton = styled.button`
    ${CPanelElementMixin}

    border: none;

    ${props =>
        props.fg &&
        css`
            color: ${props.theme.colors[props.fg]};
        `}

    background: ${props => (props.bg ? props.theme.colors[props.bg] : props.theme.cPanel.buttonBg)};

    &:hover {
        background: ${props =>
            props.bg
                ? darken(0.1, props.theme.colors[props.bg])
                : props.theme.cPanel.buttonBgHover};
    }

    opacity: ${props => (props.disabled ? 0.6 : 1.0)};
`;

const Wrapper = styled.div`
    background-color: ${({theme}) => theme.cPanel.bg};

    width: ${props => props.width || 200}px;
    flex-shrink: 0;
`;

const CPanel = props => <Wrapper {...props}>{props.children}</Wrapper>;

CPanel.propTypes = {
    children: PropTypes.node,
};

export default CPanel;
