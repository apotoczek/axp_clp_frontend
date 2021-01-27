import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import {VerticalAlign} from 'components/layout';

const Label = styled.div`
    width: 100%;
    color: ${props => props.color};
    font-size: ${props => props.fontSize}px;
    font-weight: 400;
`;

const Value = styled.div`
    width: 100%;
    color: ${props => props.color};
    font-size: ${props => props.fontSize}px;
    font-weight: 700;
`;

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    text-align: center;

    font-size: ${props => props.fontSize || 'inherit'};
    background: ${props => props.background || 'transparent'};
`;

const Callout = React.forwardRef(
    (
        {
            label,
            value,
            labelColor,
            valueColor,
            labelSize,
            valueSize,
            className,
            fontSize,
            background,
        },
        ref,
    ) => (
        <Wrapper ref={ref} className={className} fontSize={fontSize} background={background}>
            <VerticalAlign>
                <Label color={labelColor} fontSize={labelSize}>
                    {label}
                </Label>
                <Value color={valueColor} fontSize={valueSize}>
                    {value}
                </Value>
            </VerticalAlign>
        </Wrapper>
    ),
);

Callout.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    labelColor: PropTypes.string,
    valueColor: PropTypes.string,
    labelSize: PropTypes.number,
    valueSize: PropTypes.number,
};

Callout.displayName = 'Callout';

const CalloutFromProvider = React.forwardRef(({dataProvider, ...rest}, ref) => (
    <Callout label={dataProvider.getLabel()} value={dataProvider.getValue()} ref={ref} {...rest} />
));

CalloutFromProvider.propTypes = {
    dataProvider: PropTypes.shape({
        getLabel: PropTypes.func.isRequired,
        getValue: PropTypes.func.isRequired,
    }),
};

CalloutFromProvider.displayName = 'CalloutFromProvider';

export default CalloutFromProvider;
