import React from 'react';
import styled from 'styled-components';

import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';

const FullPage = styled(Grid)`
    height: 100%;
    background: #1b3966;
    background: linear-gradient(90deg, #1b3966 0%, #1d3e7a 100%);
    overflow: hidden;
    position: relative;
`;

export default function FullSizeLoadingPage(props: {}) {
    return (
        <FullPage container alignItems='center' justify='center'>
            <CircularProgress />
        </FullPage>
    );
}
