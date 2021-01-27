import React, {useMemo} from 'react';
import PropTypes from 'prop-types';

import {object_from_array} from 'src/libs/Utils';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import Checklist from 'components/basic/forms/dropdowns/Checklist';
import {DropdownInput, DropdownContent} from 'components/basic/forms/dropdowns/base';

ChecklistDropdown.propTypes = {
    values: PropTypes.arrayOf(PropTypes.any).isRequired,
    disabled: PropTypes.bool,
    ...DropdownInput.propTypes,
};
export default function ChecklistDropdown({
    options,
    values = [],
    labelKey = 'label',
    keyKey = 'key',
    valueKey = 'value',
    noOptionsLabel,
    disabled,
    label,
    onValueChanged = () => {},
    iconKey,
    iconType,
    ...restProps
}) {
    const optionsByValue = useMemo(() => object_from_array(options, opt => [opt[valueKey], opt]), [
        options,
        valueKey,
    ]);
    const selectedValueLabels = useMemo(
        () => values.map(selectedValue => optionsByValue[selectedValue][labelKey]).join(', '),
        [labelKey, optionsByValue, values],
    );

    const dropdownContent = () => (
        <DropdownContent>
            <Checklist
                options={options}
                values={values}
                noOptionsLabel={noOptionsLabel}
                onValueChanged={onValueChanged}
                labelKey={labelKey}
                keyKey={keyKey}
                valueKey={valueKey}
                iconKey={iconKey}
                iconType={iconType}
            />
        </DropdownContent>
    );

    return (
        <Dropdown disabled={disabled} render={dropdownContent}>
            {restProps.children || (
                <DropdownInput
                    {...restProps}
                    value={selectedValueLabels}
                    disabled={disabled}
                    rightIcon='down-dir'
                    label={label}
                />
            )}
        </Dropdown>
    );
}
