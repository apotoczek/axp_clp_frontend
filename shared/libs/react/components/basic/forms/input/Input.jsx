import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Icon from 'components/basic/Icon';
import {Wrapper, Label, Value, Placeholder, ErrorDescription} from 'components/basic/forms/base';

import {is_set} from 'src/libs/Utils';

const Left = styled.div`
    float: left;
`;

const Right = styled.div`
    float: right;
`;

function Side({position, label, icon, glyphicon, bisonicon, render, onClick}) {
    if (label) {
        return <Label>{label}</Label>;
    }

    if (icon) {
        return (
            <Icon
                button
                glyphicon={glyphicon}
                bisonicon={bisonicon}
                name={icon}
                onClick={onClick}
                left={position === 'left'}
                right={position === 'right'}
            />
        );
    }

    if (render && typeof render === 'function') {
        return render();
    }

    return null;
}

class Input extends Component {
    static propTypes = {
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        invalidValue: PropTypes.bool,
        placeholder: PropTypes.string,

        leftLabel: PropTypes.string,
        leftRender: PropTypes.func,
        leftIcon: PropTypes.string,
        leftGlyphicon: PropTypes.bool,
        leftBisonicon: PropTypes.bool,
        leftOnClick: PropTypes.func,
        rightLabel: PropTypes.string,
        rightRender: PropTypes.func,
        rightIcon: PropTypes.string,
        rightGlyphicon: PropTypes.bool,
        rightBisonicon: PropTypes.bool,
        rightOnClick: PropTypes.func,
    };

    hasError = () => is_set(this.props.error, true) || this.props.invalidValue;

    render() {
        const {
            label,
            value,
            leftLabel,
            leftIcon,
            leftGlyphicon,
            leftBisonicon,
            leftRender,
            leftOnClick,
            rightLabel,
            rightIcon,
            rightGlyphicon,
            rightBisonicon,
            rightRender,
            rightOnClick,
            error,
            placeholder,
            ...rest
        } = this.props;

        return (
            <Wrapper {...rest} error={this.hasError()}>
                <Left>
                    <Side
                        position='left'
                        label={leftLabel}
                        icon={leftIcon}
                        glyphicon={leftGlyphicon}
                        bisonicon={leftBisonicon}
                        render={leftRender}
                        onClick={leftOnClick}
                    />
                </Left>
                <Right>
                    <Side
                        position='right'
                        label={rightLabel}
                        icon={rightIcon}
                        glyphicon={rightGlyphicon}
                        bisonicon={rightBisonicon}
                        render={rightRender}
                        onClick={rightOnClick}
                    />
                    {this.hasError() ? <ErrorDescription>{error}</ErrorDescription> : null}
                </Right>
                {is_set(label, true) ? <Label>{label}</Label> : null}
                {is_set(value, true) ? <Value invalidValue={this.hasError()}>{value}</Value> : null}
                {is_set(placeholder) && !is_set(value, true) ? (
                    <Placeholder>{placeholder}</Placeholder>
                ) : null}
            </Wrapper>
        );
    }
}

export default Input;
