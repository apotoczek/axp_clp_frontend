import React from 'react';
import styled from 'styled-components';

import {is_set} from 'src/libs/Utils';

import {CPanelInputMixin} from 'components/basic/cpanel/mixins';

export const CPanelInputWrapper = styled.input`
    ${CPanelInputMixin}

    border: 1px solid ${({theme}) => theme.cPanel.inputBorder};
    box-shadow: inset 0 1px 1px ${({theme}) => theme.cPanel.insetShadow};
    transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;

    &:focus {
        box-shadow:
            inset 0 1px 1px ${({theme}) => theme.cPanel.insetShadow},
            0 0 8px ${({theme}) => theme.cPanel.focusedInputDropShadow}
        ;
    }

    &::placeholder {
        color: ${({theme}) => theme.cPanel.inputPlaceholderFg};
    }
`;

export default function CPanelInput(props) {
    return (
        <CPanelInputWrapper {...props} active={is_set(props.value, true)}>
            {props.children}
        </CPanelInputWrapper>
    );
}
