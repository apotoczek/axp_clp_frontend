import React from 'react';
import {Flex} from '@rebass/grid';
import styled, {keyframes} from 'styled-components';

const Wrapper = styled(Flex)`
    width: 100%;
    height: 100%;

    overflow: hidden;

    justify-content: center;
    align-items: center;
    flex-direction: column;

    color: ${({theme}) => theme.loader.fg};
`;

const Text = styled.div`
    margin-top: 8px;
    font-size: 18px;
    text-align: center;
`;

const scaleCube = keyframes`
    0%, 70%, 100% {
        transform: scale3d(1, 1, 1);
    }

    35% {
        transform: scale3d(0, 0, 1);
    }
`;

const CubeGrid = styled.div`
    width: 40px;
    height: 40px;
    margin: 0 auto;

    color: ${({theme}) => theme.loader.cube};
`;

const Cube = styled.div`
    width: 33%;
    height: 33%;
    background: ${({theme}) => theme.loader.cube};
    float: left;
    animation: ${scaleCube} 1.3s infinite ease-in-out;

    :nth-child(1) {
        animation-delay: 0.2s;
    }
    :nth-child(2) {
        animation-delay: 0.3s;
    }
    :nth-child(3) {
        animation-delay: 0.4s;
    }
    :nth-child(4) {
        animation-delay: 0.1s;
    }
    :nth-child(5) {
        animation-delay: 0.2s;
    }
    :nth-child(6) {
        animation-delay: 0.3s;
    }
    :nth-child(7) {
        animation-delay: 0s;
    }
    :nth-child(8) {
        animation-delay: 0.1s;
    }
    :nth-child(9) {
        animation-delay: 0.2s;
    }
`;

const Loader = ({text = 'Loading...', width = 100}) => (
    // loaderSelector is used by the pdf generator to know when all loaders are gone
    // TODO(Viktor): Implement this using a purpose-built component in BareReportContainer
    <Wrapper width={width} className='loaderSelector'>
        <CubeGrid>
            <Cube />
            <Cube />
            <Cube />
            <Cube />
            <Cube />
            <Cube />
            <Cube />
            <Cube />
            <Cube />
        </CubeGrid>
        <Text>{text}</Text>
    </Wrapper>
);
export default Loader;
