import React from 'react';
import PropTypes from 'prop-types';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import List, {optionArrayType} from 'components/basic/forms/dropdowns/List';
import {DropdownContent, DropdownInput} from 'components/basic/forms/dropdowns/base';

export default class DropdownList extends React.Component {
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
        value: PropTypes.any,
    };

    static defaultProps = {
        options: [],
        broadcastFullOption: false,
        onValueChanged: () => {},
        keyKey: 'key',
        valueKey: 'value',
        labelKey: 'label',
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
            iconType,
            iconKey,
            onValueChanged: _,
            noOptionsLabel,
            manualValue,
            value,
            ...rest
        } = this.props;

        let items = options;
        if (items.length === 0) {
            items = [{value: null, label: noOptionsLabel, disabled: true}];
        }

        const selectedOption = this.getSelectedOption(value);

        const dropdownContent = ({togglePopover}) => (
            <DropdownContent>
                <List
                    onItemClick={this.handleOptionSelected(togglePopover)}
                    items={items}
                    keyKey={keyKey}
                    valueKey={valueKey}
                    labelKey={labelKey}
                    subLabelKey={subLabelKey}
                    iconType={iconType}
                    iconKey={iconKey}
                    broadcastFullOption={broadcastFullOption}
                    selectedLabel={selectedOption?.[labelKey]}
                    values={[value]}
                />
            </DropdownContent>
        );

        return (
            <Dropdown disabled={disabled} render={dropdownContent}>
                {rest.children || (
                    <DropdownInput
                        {...rest}
                        value={manualValue || (selectedOption && selectedOption[labelKey])}
                        disabled={disabled}
                        rightIcon='down-dir'
                        label={label}
                    />
                )}
            </Dropdown>
        );
    }
}
