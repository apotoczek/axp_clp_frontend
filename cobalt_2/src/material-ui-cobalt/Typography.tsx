import React from 'react';
import styled from 'styled-components';

import MUITypography, {TypographyProps as MUITypographyProps} from '@material-ui/core/Typography';

import {ThemeColor, FontWeight, getColor, getFontWeight} from 'theme';

interface TypographyProps extends Omit<MUITypographyProps, 'color'> {
    color: ThemeColor;
    fontWeight: FontWeight;
}

const StyleWrapper = styled.div<TypographyProps>`
    & .MuiTypography-root {
        color: ${props => getColor(props.color)};
        font-weight: ${props => getFontWeight(props.fontWeight)};
    }
`;

export default class Typography extends React.Component<TypographyProps, {}> {
    static defaultProps = {
        color: 'initial',
        fontWeight: 'inherit',
    };

    render() {
        const {color, fontWeight, ...restProps} = this.props;

        return (
            <StyleWrapper color={color} fontWeight={fontWeight}>
                <MUITypography {...restProps} />
            </StyleWrapper>
        );
    }
}
