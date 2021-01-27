import React from 'react';
import styled from 'styled-components';

import MUILink, {LinkProps as MUILinkProps} from '@material-ui/core/Link';

import {ThemeColor, FontWeight, getColor, getFontWeight} from 'theme';

interface LinkProps extends Omit<MUILinkProps, 'color'> {
    color: ThemeColor;
    fontWeight: FontWeight;
}

const StyleWrapper = styled.div<LinkProps>`
    & .MuiLink-root {
        color: ${props => getColor(props.color)};
        font-weight: ${props => getFontWeight(props.fontWeight)};
    }
`;

export default class Link extends React.Component<LinkProps, {}> {
    static defaultProps = {
        color: 'primary.main',
        fontWeight: 'inherit',
    };

    render() {
        const {color, fontWeight, ...restProps} = this.props;

        return (
            <StyleWrapper color={color} fontWeight={fontWeight}>
                <MUILink {...restProps} />
            </StyleWrapper>
        );
    }
}
