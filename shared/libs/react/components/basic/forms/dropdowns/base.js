import styled from 'styled-components';
import {Box} from '@rebass/grid';

import Input from 'components/basic/forms/input/Input';

export const DropdownContent = styled(Box)`
    background: ${({theme}) => theme.cPanelPopover.bg};
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.23);
    border: 1px solid ${({theme}) => theme.input.border};
    border-top: none;

    border-radius: 3px;

    color: ${({theme}) => theme.cPanelPopover.fg};
`;

export const DropdownInput = styled(Input)`
    cursor: pointer;
`;
