import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Flex, Box} from '@rebass/grid';

import TextInput from 'components/basic/forms/input/TextInput';
import {Checkboard} from 'react-color/lib/components/common';

const SwatchWrapper = styled(Box)`
    cursor: pointer;
    height: ${props => `${props.size || 30}px`};
    width: ${props => `${props.size || 30}px`};
    margin: ${props => (props.margin === undefined ? '0 6px 6px 0' : props.margin)};
`;

const ActiveSwatch = styled(Flex)`
    height: 30px;
    border-radius: 2px;
    color: #666666;
`;

Swatch.propTypes = {
    color: PropTypes.string,
};
export function Swatch({color = 'transparent', size, margin, onClick = () => {}}) {
    return (
        <SwatchWrapper size={size} margin={margin} onClick={onClick}>
            <Color color={color} />
        </SwatchWrapper>
    );
}

const ColorWrapper = styled(Flex)`
    background: ${({color}) => (color === 'transparent' ? '#FFFFFF' : color)};
    position: relative;
    color: #ffffff;
    width: 100%;
    height: 100%;

    border-radius: 2px;
`;

Color.propTypes = {
    color: PropTypes.string.isRequired,
    children: PropTypes.node,
};
function Color({color = 'transparent', children}) {
    return (
        <ColorWrapper color={color} alignItems='center' justifyContent='center'>
            {children}
            {color === 'transparent' && <Checkboard />}
        </ColorWrapper>
    );
}

export default class ColorPicker extends React.PureComponent {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        color: PropTypes.string.isRequired,
        colors: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    };

    static defaultProps = {
        colors: [
            '#39BEE5',
            '#FF006E',
            '#3AC376',
            '#6D83A3',
            '#F39C12',
            '#C33A3A',
            '#006FF1',
            '#F95532',
            '#BEBEBE',
            '#4A4A4A',
            '#555555',
            '#000000',
            '#FFFFFF',
            'transparent',
        ],
        color: 'transparent',
    };

    textInputRef = React.createRef();

    setColor = closePicker =>
        (color => {
            if (typeof this.props.onChange === 'function') {
                this.props.onChange(color === 'transparent' ? undefined : color, closePicker);
                // In dashboards the TextInput loses focus after this has been triggered
                // So we manually force the focus to let the user continue to write
                if (this.textInputRef.current && !closePicker) {
                    this.textInputRef.current.focus();
                }
            }
        }).debounce(250);

    inputError = color => {
        if (!color) {
            return 'Missing color';
        }

        if (color === 'transparent') {
            return;
        }

        if (color.startsWith('#') && color.length !== 4 && color.length !== 7) {
            return 'Hex code needs to contain 3 or 6 characters';
        }

        // Last resort validation to catch any valid colors that are not in HEX form.
        let s = new Option().style;
        s.color = color;
        if (!color.startsWith('#') && s.color != color.toLowerCase()) {
            return 'Invalid color';
        }
    };

    render() {
        return (
            <Flex flexDirection='column'>
                <ActiveSwatch mb={2}>
                    <Color color={this.props.color}>{this.props.color}</Color>
                </ActiveSwatch>
                <Flex flexWrap='wrap'>
                    {this.props.colors.map(color => (
                        <Swatch
                            key={color}
                            color={color}
                            onClick={() => this.setColor(true)(color)}
                        />
                    ))}
                </Flex>
                <TextInput
                    ref={this.textInputRef}
                    leftLabel='Hex'
                    value={this.props.color}
                    error={this.inputError(this.props.color)}
                    onValueChanged={this.setColor(false)}
                    debounceValueChange={false}
                />
            </Flex>
        );
    }
}
