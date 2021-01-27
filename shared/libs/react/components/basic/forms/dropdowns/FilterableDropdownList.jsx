import React from 'react';
import PropTypes from 'prop-types';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import FilterableList from 'components/basic/forms/dropdowns/FilterableList';
import {optionArrayType} from 'components/basic/forms/dropdowns/List';

import {DropdownContent, DropdownInput} from 'components/basic/forms/dropdowns/base';

export default class FilterableDropdownList extends React.Component {
    static propTypes = {
        onValueChanged: PropTypes.func,
        label: PropTypes.string,
        options: optionArrayType,
        broadcastFullOption: PropTypes.bool,
        disabled: PropTypes.bool,
        keyKey: PropTypes.string,
        valueKey: PropTypes.string,
        labelKey: PropTypes.string,
        subLabelKey: PropTypes.string,
    };

    static defaultProps = {
        options: [],
        broadcastFullOption: false,
        keyKey: 'key',
        valueKey: 'value',
        labelKey: 'label',
        onValueChanged: () => {},
    };

    handleOptionSelected = togglePopover => value => {
        this.props.onValueChanged(value);
        togglePopover();
    };

    getSelectedOption = value => {
        for (const option of this.props.options) {
            if (!Object.prototype.hasOwnProperty.call(option, this.props.valueKey)) {
                continue;
            }

            if (option[this.props.valueKey] === value) {
                return option;
            }
        }

        return null;
    };

    render() {
        const {
            label,
            options,
            broadcastFullOption,
            disabled,
            keyKey,
            valueKey,
            labelKey,
            subLabelKey,
            onValueChanged: _,
            manualValue,
            value,
            ...rest
        } = this.props;

        const selectedOption = this.getSelectedOption(value);

        const dropdownContent = ({togglePopover}) => (
            <DropdownContent>
                <FilterableList
                    onItemClick={this.handleOptionSelected(togglePopover)}
                    items={options}
                    keyKey={keyKey}
                    valueKey={valueKey}
                    labelKey={labelKey}
                    subLabelKey={subLabelKey}
                    broadcastFullOption={broadcastFullOption}
                    filterRightIcon='remove'
                    filterRightOnClick={togglePopover}
                    filterRightGlyphicon
                />
            </DropdownContent>
        );
        return (
            <Dropdown
                disabled={disabled}
                render={dropdownContent}
                positionSettings={{offsetY: -39}}
            >
                <DropdownInput
                    {...rest}
                    value={manualValue || (selectedOption && selectedOption[labelKey])}
                    disabled={disabled}
                    rightIcon='down-dir'
                    label={label}
                />
            </Dropdown>
        );
    }
}
