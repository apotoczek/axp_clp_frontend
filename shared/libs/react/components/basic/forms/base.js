import styled, {css} from 'styled-components';
import {Box} from '@rebass/grid';

export const Wrapper = styled(Box)`
    flex: ${props => props.flex || 1};
    box-sizing: border-box;
    position: relative;
    border-radius: 3px;

    width: auto;
    max-height: 48px;

    color: ${({theme}) => theme.input.labelFg};

    background: ${({theme}) => theme.input.wrapperBg};

    font-family: Lato, sans-serif;
    line-height: 21px;

    overflow: auto;

    ${props =>
        props.button &&
        css`
            cursor: pointer;
        `}

    ${props =>
        !props.noBorder &&
        css`
            border: 1px solid ${({theme}) => theme.input.border};
            transition: border 150ms ease-out;
            ${props =>
                !props.disabled &&
                !props.error &&
                css`
                    &:hover,
                    &:focus-within {
                        border: 1px solid ${({theme}) => theme.input.hoverBorder};
                    }
                `}
        `}

    padding: 8px 12px;
    font-size: 11px;

    ${props =>
        props.left &&
        css`
            padding-left: 48px;
        `}

    ${props =>
        props.right &&
        css`
            padding-right: 48px;
        `}

    ${props =>
        props.error &&
        css`
            border: 1px solid ${({theme}) => theme.input.errorBorder};
        `}

    ${props =>
        props.disabled &&
        css`
            opacity: 0.5;
        `}
`;

export const Label = styled.span`
    padding-right: 14px;
    font-weight: 500;
    color: ${({theme}) => theme.input.labelFg};
    letter-spacing: 0.86px;
    font-size: 1em;
    text-transform: uppercase;
    float: left;

    user-select: none;
`;

export const Value = styled.div`
    font-family: Lato, sans-serif;
    color: ${({invalidValue, theme}) =>
        invalidValue ? theme.input.invalidValueFg : theme.input.validValueFg};
    font-size: 1.2em;

    user-select: none;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const Placeholder = styled.div`
    font-family: Lato, sans-serif;
    padding-right: 32px;

    user-select: none;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    color: ${({theme}) => theme.input.placeholderFg};
    font-size: 13px;
`;

export const ErrorDescription = styled.span`
    font-family: Lato, Helvetica, Arial, sans-serif;
    padding: 0;

    color: ${({theme}) => theme.input.invalidValueFg};
`;
