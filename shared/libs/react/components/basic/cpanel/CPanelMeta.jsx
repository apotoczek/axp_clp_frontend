import React from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

const Wrapper = styled(Flex)`
    color: ${({theme}) => theme.cPanel.metaFg};
    font-size: 13px;
    line-height: 1.5;
    padding: 5px 15px;
    background: ${({theme}) => theme.cPanel.metaBg};
    border-radius: 3px;
    margin-bottom: 5px;
`;

export default function CPanelMeta({title, count, totalCount}) {
    return (
        <Wrapper>
            <Box flex={1}>{title}</Box>
            <Box>
                {count} of {totalCount}
            </Box>
        </Wrapper>
    );
}
