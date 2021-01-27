import React from 'react';
import styled from 'styled-components';
import Icon from 'components/basic/Icon';
import {Flex} from '@rebass/grid';

const BaseButton = styled(Flex)`
    cursor: pointer;
    user-select: none;
    align-items: center;
    padding: 4px 8px;
    font-size: 12px;
`;

export const Button = ({onClick, children, ...rest}) => {
    return (
        <BaseButton onClick={onClick} {...rest}>
            {children}
        </BaseButton>
    );
};

const StyledRemoveButton = styled(Button)`
    color: #bbbbbb;
    transition: 0.2s;
    font-size: 18px;
    font-weight: 500;
    text-align: center;
    &:hover {
        color: #cc3333;
    }
`;

export const RemoveButton = ({onClick, ...rest}) => {
    return (
        <StyledRemoveButton onClick={onClick} {...rest} mr='1px'>
            <Icon small name='remove' glyphicon />
        </StyledRemoveButton>
    );
};

const StyledHomeButton = styled(Button)`
    color: rgb(107, 164, 255);
    font-size: 12px;
    border: 1px solid #cccccc;
    padding: 8px;
`;

export const RootButton = ({onClick, ...rest}) => {
    return (
        <StyledHomeButton onClick={onClick} {...rest}>
            ↩ Back to Top Level
        </StyledHomeButton>
    );
};

export const ActionButton = styled(Button)`
    font-size: 13px;
    background-color: #f5f5f5;
    border-radius: 3px;
    color: rgb(107, 164, 255);
    border: 1px solid #e5e5e5;
    align-items: center;
    padding: 4px 10px;
    text-transform: capitalize;
    transition: background-color 0.1s ease-in;
    &:hover {
        background-color: #f0f0f0;
    }
    &:active {
        background-color: #ffffff;
    }
`;

export const Link = styled.span`
    color: ${props => props.color || 'rgb(107, 164, 255)'};
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;
