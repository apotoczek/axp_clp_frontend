import React from 'react';
import PropTypes from 'prop-types';
import styled, {css, keyframes} from 'styled-components';
import {Box} from '@rebass/grid';

import ExtraPropTypes from 'utils/extra-prop-types';

const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(359deg);
    }
`;

const Wrapper = styled(Box)`
    display: inline-block;
    font-size: ${props => props.fontSize || 14}px;

    ${props =>
        props.left &&
        css`
            margin-right: 8px;
            float: left;
        `}

    ${props =>
        props.right &&
        css`
            float: right;
            margin-left: 8px;
        `}

    ${props =>
        props.button &&
        css`
            cursor: pointer;
            &:hover {
                color: ${props.hoverColor};
            }
        `}

    ${props =>
        props.buttonDark &&
        css`
            cursor: pointer;
            color: #95a5a6;
            &:hover {
                color: #6d8082;
            }
        `}

    ${props =>
        props.small &&
        css`
            font-size: 13px;
        `}

    ${props =>
        props.color &&
        css`
            color: ${props.color};
        `};

    &.glyphicon {
        line-height: inherit;
        top: 0;
    }

    ${props =>
        props.spin &&
        css`
            animation: ${spin} 2.5s infinite linear;
        `}

    ${props =>
        props.disabled &&
        css`
            opacity: 0.5;
            pointer-events: none;
        `}
`;

Icon.propTypes = {
    glyphicon: PropTypes.bool,
    bison: PropTypes.bool,
    className: PropTypes.string,
    name: PropTypes.string,
    spin: PropTypes.bool,
    small: ExtraPropTypes.deprecated(PropTypes.bool),
};

export default function Icon({glyphicon, bisonicon, size, className, name, ...rest}) {
    let prefix;
    if (glyphicon) {
        prefix = 'glyphicon glyphicon-';
    } else if (bisonicon) {
        prefix = 'bison-icon bison-icon-';
    } else {
        prefix = 'icon-';
    }

    return <Wrapper className={`${className || ''} ${prefix}${name}`} fontSize={size} {...rest} />;
}
