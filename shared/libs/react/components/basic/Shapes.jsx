import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

export const Circle = styled.div`
    width: 100%;
    height: 100%;
    background: ${props => props.color || '#000000'};
    border-radius: 50%;
`;

export const Rect = styled.div`
    width: 100%;
    height: 100%;
    background: ${props => props.color || '#000000'};
`;

export const Triangle = styled.div`
    width: 0;
    height: 0;
    border-left: ${props => (props.width && `${props.width * 0.5}px`) || '10px'} solid transparent;
    border-right: ${props => (props.width && `${props.width * 0.5}px`) || '10px'} solid transparent;
    border-bottom: ${props => (props.height && `${props.height}px`) || '10px'} solid
        ${props => props.color || '#000000'};
`;

export const CircleFromProvider = ({dataProvider, ...rest}) => (
    <Circle color={dataProvider.getColor()} {...rest} />
);

CircleFromProvider.propTypes = {
    dataProvider: PropTypes.shape({
        getColor: PropTypes.func.isRequired,
    }),
};

export const RectFromProvider = ({dataProvider, ...rest}) => (
    <Rect color={dataProvider.getColor()} {...rest} />
);

RectFromProvider.propTypes = {
    dataProvider: PropTypes.shape({
        getColor: PropTypes.func.isRequired,
    }),
};

export const TriangleFromProvider = ({dataProvider, ...rest}) => (
    <Triangle color={dataProvider.getColor()} {...rest} />
);

TriangleFromProvider.propTypes = {
    dataProvider: PropTypes.shape({
        getColor: PropTypes.func.isRequired,
    }),
};
