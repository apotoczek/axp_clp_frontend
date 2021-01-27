import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import List, {optionArrayType} from 'components/basic/forms/dropdowns/List';
import Popover, {calculatePosition} from 'components/basic/Popover';
import TextInput from 'components/basic/forms/input/TextInput';

import {DropdownContent} from 'components/basic/forms/dropdowns/base';

import {Box} from '@rebass/grid';

const TypeaheadWrapper = styled(Box)`
    position: relative;
`;

export default class TypeaheadInput extends React.Component {
    state = {
        focused: false,
    };

    static propTypes = {
        ...TextInput.propTypes,
        value: PropTypes.string,
        labelKey: PropTypes.string,
        subLabelKey: PropTypes.string,
        minLength: PropTypes.number,
        options: optionArrayType,
    };

    static defaultProps = {
        value: '',
        labelKey: 'label',
        minLength: 0,
        options: [],
    };

    popoverRef = React.createRef();
    wrapperRef = React.createRef();

    get popover() {
        return this.popoverRef.current;
    }

    get wrapper() {
        return this.wrapperRef.current;
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleBlur = () => {
        this.setState(state => (state.focused ? {focused: false} : null));
    };

    handleFocus = () => {
        this.setState(state => (!state.focused ? {focused: true} : null));
    };

    handleValueChanged = value => {
        this.props.onValueChanged(value);

        this.handleFocus();
    };

    handleClickSuggestion = suggestion => {
        const {labelKey, onValueChanged} = this.props;

        onValueChanged(suggestion[labelKey]);

        this.handleBlur();
    };

    filteredOptions = () => {
        const {options, value, minLength, labelKey, subLabelKey} = this.props;

        if (value.length >= minLength) {
            const lowerCaseValue = value.toLowerCase();

            if (lowerCaseValue.length) {
                return options
                    .filter(
                        option =>
                            (option[labelKey] &&
                                option[labelKey].toLowerCase().includes(lowerCaseValue)) ||
                            (option[subLabelKey] &&
                                option.subLabelKey.toLowerCase().includes(lowerCaseValue)),
                    )
                    .sortBy(o => !o[labelKey].toLowerCase().startsWith(lowerCaseValue));
            }

            return options;
        }

        return [];
    };

    handleClickOutside = ({target}) => {
        this.setState(state => {
            if (!state.focused) {
                return null;
            }

            const clickedInside = this.wrapper.contains(target) || this.popover.contains(target);
            if (!clickedInside) {
                return {focused: false};
            }

            return null;
        });
    };

    render() {
        const {focused} = this.state;
        const {value, labelKey, subLabelKey, ...rest} = this.props;

        const filteredOptions = this.filteredOptions();
        const showSuggestions = focused && filteredOptions.length > 0;

        let x, y, minWidth;

        if (this.popover) {
            ({x, y, minWidth} = calculatePosition(
                this.wrapper.getBoundingClientRect(),
                this.popover.getBoundingClientRect(),
            ));
        }

        return (
            <TypeaheadWrapper ref={this.wrapperRef}>
                <TextInput
                    {...rest}
                    onFocus={this.handleFocus}
                    value={value}
                    debounceValueChange={false}
                    onValueChanged={this.handleValueChanged}
                />
                <Popover x={x} y={y} minWidth={minWidth}>
                    <div ref={this.popoverRef}>
                        {showSuggestions && (
                            <DropdownContent>
                                <List
                                    items={filteredOptions}
                                    broadcastFullOption
                                    onItemClick={this.handleClickSuggestion}
                                    labelKey={labelKey}
                                    subLabelKey={subLabelKey}
                                />
                            </DropdownContent>
                        )}
                    </div>
                </Popover>
            </TypeaheadWrapper>
        );
    }
}
