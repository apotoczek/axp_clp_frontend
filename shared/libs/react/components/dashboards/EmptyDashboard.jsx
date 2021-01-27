import React from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';
import {Link} from 'react-router-dom';

import {H1} from 'components/basic/text';

const ColoredLink = styled(Link)`
    color: ${({theme}) => theme.toolBarBg};
    font-weight: 400;
    &:hover {
        text-decoration: none;
        color: ${({theme}) => theme.toolBarHover};
    }
`;

const EmptyDashboard = ({goTo}) => {
    const emptyDashboard = require('src/img/empty_dashboard.png');

    return (
        <Flex flexDirection='column' alignItems='center' my={150}>
            <Box mb={3}>
                <img src={emptyDashboard} alt='emptyDashboard' />
            </Box>
            {goTo && (
                <H1>
                    Click <ColoredLink to={goTo}>Edit Mode</ColoredLink> to add components
                </H1>
            )}
        </Flex>
    );
};

export default EmptyDashboard;
