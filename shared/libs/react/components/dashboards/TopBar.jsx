import {Flex} from '@rebass/grid';
import styled, {css} from 'styled-components';

export default styled(Flex)`
    position: relative;
    background: ${({theme}) => theme.dashboard.componentBar.bg};
    align-items: center;
    flex-wrap: wrap;
    color: ${({theme}) => theme.dashboard.componentBar.fg};

    padding: 6px 0;

    height: 40px;
    max-height: 40px;
    min-height: 40px;

    border-bottom: 1px solid ${({theme}) => theme.dashboard.componentBar.separator};
    ${props =>
        props.borderRight &&
        css`
            border-right: 1px solid ${({theme}) => theme.dashboard.componentBar.separator};
        `}
    ${props =>
        props.borderLeft &&
        css`
            border-left: 1px solid ${({theme}) => theme.dashboard.componentBar.separator};
        `}
`;
