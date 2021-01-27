import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {Box} from '@rebass/grid';

import {ParamType} from 'src/libs/Enums';

import AttributeSelectorDropdown from 'components/basic/forms/dropdowns/AttributeSelectorDropdown';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import DateParameter from 'components/dashboards/component-settings/DateParameter';
import Checkbox from 'components/basic/forms/Checkbox';

SingleSelectionParameter.propTypes = {
    options: PropTypes.array.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    onValueChanged: PropTypes.func.isRequired,
};

function SingleSelectionParameter({options, label, value, onValueChanged}) {
    if (Object.values(options).length > 10) {
        return (
            <FilterableDropdownList
                label={label}
                options={options}
                value={value}
                onValueChanged={onValueChanged}
            />
        );
    }

    return (
        <DropdownList
            label={label}
            options={options}
            value={value}
            onValueChanged={onValueChanged}
        />
    );
}

function FilterSelectionParameter(param, onParameterChanged) {
    const filterChanged = useCallback(
        (filterKey, value) =>
            onParameterChanged({
                value: {filterKey, value},
                key: 'filters', // Enables us to detect filter changes in the spec handler
            }),
        [onParameterChanged],
    );

    const attributeFilters = Object.entries(param).map(([uid, attribute]) => ({
        value: uid,
        label: attribute.label,
        options: attribute.options,
        selected: attribute.selected,
    }));
    return (
        <Box mb={1}>
            <AttributeSelectorDropdown
                items={attributeFilters}
                onAttributeClicked={filterChanged}
            />
        </Box>
    );
}

function ToggleParameter({value, onValueChanged, label}) {
    return <Checkbox label={label} checked={value} onValueChanged={onValueChanged} />;
}

function Parameter({paramKey, param, onParameterChanged}) {
    const parameterChanged = useCallback(value => onParameterChanged({value, key: paramKey}), [
        paramKey,
        onParameterChanged,
    ]);

    let ParameterComponent;
    if (param.type === ParamType.SINGLE_SELECTION) {
        ParameterComponent = SingleSelectionParameter;
    } else if (param.type === ParamType.DATE_SELECTION) {
        ParameterComponent = DateParameter;
    } else if (param.type === ParamType.TOGGLE) {
        ParameterComponent = ToggleParameter;
    } else {
        // The only parameter without a type is the filter. We can add a type pretty easily
        // in the future if we want but we would have to nest all the attribute filters in
        // an object in the value map defined on the backend. This is fine for now.
        return FilterSelectionParameter(param, onParameterChanged);
    }

    return (
        <Box mb={1}>
            <ParameterComponent {...param} onValueChanged={parameterChanged} />
        </Box>
    );
}

export default function Parameters({params, onParameterChanged, enableFilters = false}) {
    return (
        <>
            {Object.entries(params)
                .filter(([key, _]) => enableFilters || key !== 'filters')
                .map(([key, param]) => (
                    <Parameter
                        key={key}
                        paramKey={key}
                        param={param}
                        onParameterChanged={onParameterChanged}
                    />
                ))}
        </>
    );
}
