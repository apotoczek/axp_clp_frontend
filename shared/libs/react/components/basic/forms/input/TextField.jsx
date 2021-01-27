import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {Wrapper, Label, Value} from 'components/basic/forms/base';

import {is_set, extractLayoutProps} from 'src/libs/Utils';

import {ErrorDescription} from 'components/basic/forms/base';

const StyledErrorDescription = styled(ErrorDescription)`
    position: absolute;
    right: 15px;
    top: 10px;
    max-width: 50%;
    text-align: right;
`;

const DynamicHeightWrapper = styled(Wrapper)`
    max-height: none;
    overflow: visible;
    position: relative;
    height: auto;

    transition: border 150ms ease-out;
`;

const Textarea = styled(Value)`
    cursor: text;
    border: none;
    background: transparent;
    padding: 0;

    outline: none;
    min-width: 100%;
    max-width: 100%;

    min-height: ${props => (props.height ? `${props.height}px` : 'auto')};

    user-select: text;

    width: 100%;
    resize: vertical;
    white-space: normal;

    &::placeholder {
        color: ${({theme}) => theme.input.placeholderFg};
    }
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

export default class TextField extends Component {
    static propTypes = {
        topLabel: PropTypes.string,
        maxLength: PropTypes.number,
        height: PropTypes.number,
        placeholder: PropTypes.string,
        readOnly: PropTypes.bool,
        autoGrow: PropTypes.bool,

        onValueChanged: PropTypes.func,
        debounceValueChange: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        debounceValueChange: true,
        invalidValue: false,
        autoGrow: false,
        readOnly: false,
    };

    state = {
        text: is_set(this.props.value) ? this.props.value : '',
    };

    textArea = React.createRef();

    componentDidMount() {
        if (this.props.autoGrow && this.textArea.current) {
            this.textArea.current.style.height = `${this.textArea.current.scrollHeight}px`;
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value != this.props.value) {
            this.setState({text: is_set(this.props.value) ? this.props.value : ''});
        }

        if (this.props.autoGrow && this.textArea.current) {
            this.textArea.current.style.height = `${this.textArea.current.scrollHeight}px`;
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

    render() {
        const {topLabel, maxLength, height, placeholder, readOnly, className, error} = this.props;

        const layoutProps = extractLayoutProps(this.props);

        return (
            <DynamicHeightWrapper error={error} {...layoutProps}>
                {topLabel && <ShiftedLabel>{topLabel}</ShiftedLabel>}
                {error && <StyledErrorDescription>{error}</StyledErrorDescription>}
                <Textarea
                    as='textarea'
                    className={className}
                    placeholder={placeholder}
                    height={height}
                    maxLength={maxLength}
                    value={this.state.text}
                    ref={this.textArea}
                    onChange={this.handleValueChanged}
                    readOnly={readOnly}
                />
            </DynamicHeightWrapper>
        );
    }
}
