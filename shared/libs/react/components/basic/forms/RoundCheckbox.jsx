import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 25px;
    margin: -8px 3px;
    position: relative;
`;

const Checkbox = styled.label`
    cursor: pointer;
    position: absolute;
    border-color: #ffffff;
    margin-left: 4px;
    width: 16px;
    height: 16px;
    top: 0;
    left: 0;
    background: #ffffff;
    border-radius: 25px;
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.1);

    &::after {
        opacity: ${props => (props.checked ? 1 : 0)};
        content: '';
        position: absolute;
        width: 10px;
        height: 6px;
        background: transparent;
        top: 4px;
        left: 3px;
        border: 3px solid #3ac376;
        border-top: none;
        border-right: none;
        transform: rotate(-45deg);
    }

    &:hover {
        &::after {
            opacity: ${props => (props.checked ? 1 : 0)};
        }
    }
`;

const RoundCheckbox = ({checked, ...rest}) => (
    <Wrapper {...rest}>
        <Checkbox checked={checked} />
    </Wrapper>
);
export default RoundCheckbox;
