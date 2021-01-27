import React, {useMemo} from 'react';
import PropTypes from 'prop-types';

import {object_from_array} from 'src/libs/Utils';

import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import FilterableChecklist from 'components/basic/forms/dropdowns/FilterableChecklist';
import {DropdownInput, DropdownContent} from 'components/basic/forms/dropdowns/base';

FilterableChecklistDropdown.propTypes = {
    values: PropTypes.arrayOf(PropTypes.any).isRequired,
    disabled: PropTypes.bool,
    ...DropdownInput.propTypes,
};
export default function FilterableChecklistDropdown({
    options,
    values = [],
    labelKey = 'label',
    keyKey = 'key',
    valueKey = 'value',
    noOptionsLabel,
    disabled,
    label,
    onValueChanged = () => {},
    parentRef,
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
            <FilterableChecklist
                options={options}
                values={values}
                noOptionsLabel={noOptionsLabel}
                onValueChanged={onValueChanged}
                labelKey={labelKey}
                keyKey={keyKey}
                valueKey={valueKey}
            />
        </DropdownContent>
    );

    return (
        <Dropdown disabled={disabled} render={dropdownContent} parentRef={parentRef}>
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
