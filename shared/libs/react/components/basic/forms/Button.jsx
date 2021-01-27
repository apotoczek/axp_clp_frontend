import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Box} from '@rebass/grid';

const containedButtonCSS = css`
    color: #222222;
    background: #f9f9fd;
    border: 1px solid #a7abbf;

    ${props =>
        props.primary &&
        css`
            color: #ffffff;
            background: #3ac376;
            border: 1px solid #1d7d38;
        `}

    ${props =>
        props.secondary &&
        css`
            color: #ffffff;
            background: #39bee5;
            border: 1px solid #03a0ce;
        `}

    ${props =>
        props.danger &&
        css`
            color: #ffffff;
            background: #eb6a6e;
            border: 1px solid #f0222f;
        `}

    ${props =>
        props.disabled &&
        css`
            color: #bec2d5;
            background: #f9f9fd;
            border: 1px solid #d9dcec;

            &:hover {
                cursor: auto;
            }
        `}

`;

const outlinedButtonCSS = css`
    color: #222222;
    background: transparent;
    border: 1px solid #a7abbf;

    ${props =>
        props.primary &&
        css`
            color: #3ac376;
            border: 1px solid #3ac376;
        `}

    ${props =>
        props.secondary &&
        css`
            color: #03a0ce;
            border: 1px solid #03a0ce;
        `}

    ${props =>
        props.danger &&
        css`
            color: #f0222f;
            border: 1px solid #f0222f;
        `}

    ${props =>
        props.disabled &&
        css`
            color: #bec2d5;
            border: 1px solid #bec2d5;

            &:hover {
                cursor: auto;
            }
        `}
`;

const textButtonCSS = css`
    color: #222222;
    background: transparent;
    border: none;

    ${props =>
        props.primary &&
        css`
            color: #3ac376;
        `}

    ${props =>
        props.secondary &&
        css`
            color: #03a0ce;
        `}

    ${props =>
        props.danger &&
        css`
            color: #f0222f;
        `}

    ${props =>
        props.disabled &&
        css`
            color: #bec2d5;

            &:hover {
                cursor: auto;
            }
        `}
`;

const ButtonWrapper = styled(Box)`
    box-sizing: border-box;
    flex: ${props => props.flex};

    text-align: center;

    padding: 12px 20px;

    /* Font Styling */
    font-family: Lato, Helvetica, Arial, sans-serif;
    font-style: normal;
    font-weight: 700;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.5px;

    border-radius: 2px;

    white-space: nowrap;

    &:hover {
        cursor: pointer;
    }

    ${props => !props.text && !props.outlined && containedButtonCSS}
    ${props => !props.text && props.outlined && outlinedButtonCSS}
    ${props => props.text && !props.outlined && textButtonCSS}
`;

export default class Button extends Component {
    static propTypes = {
        children: PropTypes.node,
        onClick: PropTypes.func,
        primary: PropTypes.bool,
        secondary: PropTypes.bool,
        danger: PropTypes.bool,
        disabled: PropTypes.bool,
        flex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        text: PropTypes.bool,
        outlined: PropTypes.bool,
    };

    static defaultProps = {
        onClick: () => {},
        primary: false,
        secondary: false,
        danger: false,
        disabled: false,
        flex: 1,
        text: false,
        outlined: false,
    };

    handleClick = (...args) => {
        if (this.props.disabled) {
            return;
        }

        if (typeof this.props.onClick === 'function') {
            this.props.onClick(...args);
        }
    };

    render() {
        const {children, ...rest} = this.props;

        return (
            <ButtonWrapper {...rest} onClick={this.handleClick}>
                {children}
            </ButtonWrapper>
        );
    }
}
