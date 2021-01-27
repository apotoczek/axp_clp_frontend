import styled, {css} from 'styled-components';

import TextInput from 'components/basic/forms/input/TextInput';
import Button from 'components/basic/forms/Button';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';

export const BarButton = styled(Button)`
    padding: 0;

    display: flex;
    align-items: center;

    transition: all 150ms ease-in-out;

    box-shadow: none;
    border: none;

    background: transparent;
    &:hover {
        background: transparent;
        color: ${({theme}) => theme.dashboard.componentBar.hoverFg};
    }
    color: ${({theme}) => theme.dashboard.componentBar.fg};

    ${props =>
        props.active &&
        css`
            color: ${({theme}) => theme.dashboard.componentBar.fg};
        `}

    ${props =>
        !props.disabled &&
        css`
            &:hover {
                color: color: ${({theme}) => theme.dashboard.componentBar.fg};
            }
        `}
`;

export const BarTextInput = styled(TextInput)`
    padding-top: 0;
    padding-bottom: 0;
    border-radius: 2px;
`;

export const BarDropdownList = styled(DropdownList)`
    padding-top: 0;
    padding-bottom: 0;
`;
