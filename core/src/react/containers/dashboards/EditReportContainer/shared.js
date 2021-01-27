import {Flex} from '@rebass/grid';
import styled from 'styled-components';

export const Columns = {
    EDITOR: 'editor',
    SETTINGS: 'settings',
    ADD_COMPONENT: 'add_component',
};

export const Column = styled(Flex)`
    position: relative;
    overflow-y: auto;
    transition: flex 500ms ease-out;
`;
