import React from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';

const StyledInput = styled.input`
    appearance: none;
    border-radius: 8px;
    height: 15px;
    outline: none;
    width: 200px !important;
    background: #374050;
    opacity: 0.8;
    cursor: pointer;
    box-shadow: 1px 1px 1px #000000, 1px 1px 1px #0d0d0d;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background: #a6afbd;
        cursor: pointer;
        box-shadow: 1px 1px 1px #000000, 0 0 1px #0d0d0d;
    }
`;

const Slider = ({min, max, current, className, onChange}) => {
    const handleValueChanged = event => {
        const value = event.target.value;
        if (!isNaN(parseInt(value))) {
            onChange(parseInt(value));
        }
    };

    return (
        <StyledInput
            type='range'
            className={className}
            min={min}
            max={max}
            value={current}
            onChange={handleValueChanged}
        />
    );
};

Slider.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    current: PropTypes.number,
    onChange: PropTypes.func,
};

export default Slider;
