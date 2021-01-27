import {css} from 'styled-components';

export const CPanelElementMixin = css`
    display: block;
    width: 100%;

    margin-bottom: 5px;

    border-radius: 2px;
    border: none;
    outline: none;

    color: ${({theme}) => theme.cPanel.buttonFg};
    line-height: 1.5;
    font-size: 12px;
    padding: 5px 10px;
`;

export const CPanelInputMixin = css`
    ${CPanelElementMixin}

    background: ${props =>
        props.active ? props.theme.cPanel.activeInputBg : props.theme.cPanel.inputBg};
    color: ${props =>
        props.active ? props.theme.cPanel.activeInputFg : props.theme.cPanel.inputFg};
`;
