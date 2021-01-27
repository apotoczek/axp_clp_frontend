import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {Wrapper, Label, Value, ErrorDescription} from 'components/basic/forms/base';
import Icon from 'components/basic/Icon';

import {is_set} from 'src/libs/Utils';

const InputWrapper = styled.div`
    overflow: hidden;
    vertical-align: middle;
`;

const ValueInput = styled(Value)`
    cursor: text;
    border: none;
    background: transparent;
    padding: 0;

    outline: none;
    width: 100%;

    user-select: text;

    &::placeholder {
        color: ${({theme}) => theme.input.placeholderFg};
    }
`;

const Left = styled.div`
    float: left;
`;

const Right = styled.div`
    float: right;
`;

const ShiftedLabel = styled(Label)`
    position: absolute;
    top: -11px;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: -6%;
        width: 95%;
        height: 4px;
        background: ${({theme}) => theme.input.wrapperBg};
        z-index: -1;
    }
`;

const DynamicHeightWrapper = styled(Wrapper)`
    max-height: none;
    overflow: visible;
    position: relative;
    height: auto;

    transition: border 150ms ease-out;
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
                bison={bisonicon}
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

class TextInput extends PureComponent {
    static propTypes = {
        leftLabel: PropTypes.string,
        leftRender: PropTypes.func,
        leftIcon: PropTypes.string,
        leftGlyphicon: PropTypes.bool,
        leftOnClick: PropTypes.func,
        rightLabel: PropTypes.string,
        rightRender: PropTypes.func,
        rightIcon: PropTypes.string,
        rightGlyphicon: PropTypes.bool,
        rightOnClick: PropTypes.func,
        error: PropTypes.string,
        topLabel: PropTypes.string,

        onKeyPress: PropTypes.func,
        onValueChanged: PropTypes.func,
        debounceValueChange: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        label: '',
        debounceValueChange: true,
        invalidValue: false,
    };

    state = {
        text: is_set(this.props.value) ? this.props.value : '',
    };

    componentDidUpdate(prevProps) {
        if (prevProps.value != this.props.value) {
            this.setState({text: is_set(this.props.value) ? this.props.value : ''});
        }
    }

    debouncedValueChange = (() => {
        const {onValueChanged} = this.props;
        if (typeof onValueChanged === 'function') {
            onValueChanged(this.state.text);
        }
    }).debounce(250);

    handleValueChanged = event => {
        const {onValueChanged, debounceValueChange} = this.props;

        this.setState({
            text: event.target.value,
        });

        if (debounceValueChange) {
            this.debouncedValueChange();
        } else if (typeof onValueChanged === 'function') {
            onValueChanged(event.target.value);
        }
    };

    hasError = () => is_set(this.props.error, true) || this.props.invalidValue;

    render() {
        const {
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
            placeholder,
            autoFocus,
            error,
            topLabel,
            onFocus,
            onBlur,
            inputRef,
            onValueChanged: _,
            disabled,
            onKeyPress,
            ...rest
        } = this.props;

        const {text} = this.state;

        return (
            <DynamicHeightWrapper {...rest} error={this.hasError()} disabled={disabled}>
                {topLabel && <ShiftedLabel>{topLabel}</ShiftedLabel>}
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
                <InputWrapper>
                    <ValueInput
                        as='input'
                        autoFocus={autoFocus}
                        value={text}
                        ref={inputRef}
                        invalidValue={this.hasError()}
                        placeholder={placeholder}
                        onChange={this.handleValueChanged}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        disabled={disabled}
                        onKeyPress={onKeyPress}
                    />
                </InputWrapper>
            </DynamicHeightWrapper>
        );
    }
}

const InnerTextInput = (props, ref) => <TextInput inputRef={ref} {...props} />;

export default React.forwardRef(InnerTextInput);
