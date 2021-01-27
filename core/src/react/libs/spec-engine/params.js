import {getValueMapEntries} from 'libs/spec-engine/value-map';
import {is_set, valid_uid} from 'src/libs/Utils';

import {formattedDateSelectionValue} from 'src/helpers/dashboards';

export const getValueParameters = (entity, valueKey, valueMap, paramValues, globalParams = {}) => {
    const valueMapEntry = getValueMapEntries(valueMap, entity, {
        value: {
            key: valueKey,
            isGrouped: is_set(paramValues.group_by),
            groupType: paramValues.group_by,
            isOverTime: is_set(paramValues.over_time),
        },
    });

    const params = valueMapEntry.params || {};
    const valueParameters = {};
    for (const [paramKey, param] of Object.entries(params)) {
        // Filters is nested params
        if (paramKey === 'filters') {
            valueParameters['filters'] = handleFilters(param, paramValues.filters || {});
            continue;
        }
        valueParameters[paramKey] = {
            type: param.type,
            label: param.label,
            subType: param.subType,
        };

        if (is_set(paramValues[paramKey])) {
            valueParameters[paramKey].value = paramValues[paramKey];
        }

        if (is_set(param.options, true)) {
            valueParameters[paramKey].options = Object.entries(param.options)
                .map(([key, val]) => ({value: key, key, label: val.label}))
                .concat([{value: undefined, label: param.defaultLabel || 'None'}]);
            valueParameters[paramKey].defaultOption = param.defaultOption;

            valueParameters[paramKey].value =
                valueParameters[paramKey].value || param.defaultOption;
        } else if (param.type === 'dateSelection') {
            valueParameters[paramKey].value = valueParameters[paramKey].value || {};
        } else if (param.type === 'toggle') {
            valueParameters[paramKey].value = valueParameters[paramKey].value ?? param.defaultValue;
        }

        valueParameters[paramKey].formattedValue = _formattedParameterValue(
            valueParameters[paramKey],
            globalParams,
        );
    }
    return valueParameters;
};

function handleFilters(valueMapFilters, filterValues) {
    const valueFilters = {};
    for (const [key, settings] of Object.entries(valueMapFilters)) {
        valueFilters[key] = {...settings};
        if (is_set(filterValues[key], true)) {
            valueFilters[key].selected = filterValues[key].selected;
        }
    }
    return valueFilters;
}

export function _formattedParameterValue(parameter, globalParams) {
    return {
        singleSelection: _formattedSingleSelectionValue,
        dateSelection: _formattedDateSelectionValue,
        toggle: _formattedToggleValue,
    }[parameter.type](parameter, globalParams);
}

function _formattedToggleValue({value}) {
    return value ? 'Yes' : 'No';
}

function _formattedSingleSelectionValue({value, defaultLabel = 'None', options = []}) {
    const selectedOption = options.find(option => option.value === value);

    if (is_set(selectedOption)) {
        return selectedOption.label;
    }

    return defaultLabel;
}

function _formattedDateSelectionValue({value}, {globalDate}) {
    return formattedDateSelectionValue(value, globalDate, '{Mon} {d}, {yyyy}');
}

export function isValidMetricVersion(metricVersion) {
    return is_set(metricVersion) && valid_uid(metricVersion);
}
