import React from 'react';
import styled from 'styled-components';
import {Link} from './buttons';
import {Box} from '@rebass/grid';

export const ContextHint = styled.div`
    display: flex;
    margin: 6px 0;
    font-size: 13px;
    background-color: #eeeeee;
    padding: 8px;
    align-items: center;
    justify-content: space-between;
`;

export const MembersWrapper = styled(Box)`
    max-height: 220px;
    min-height: 220px;
    overflow-y: scroll;
    /* push scrollbar into gutter */
    margin-right: -10px;
    padding-right: 10px;
`;

export const ContextNav = ({context, parent, onNavigateUp}) => {
    return (
        <ContextHint>
            <div>{context.name}</div>
            {parent && <Link onClick={onNavigateUp}>Back to {parent.name}</Link>}
        </ContextHint>
    );
};
