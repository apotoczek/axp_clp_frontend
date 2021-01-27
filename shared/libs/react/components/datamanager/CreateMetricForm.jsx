import React from 'react';
import styled from 'styled-components';

import {H3} from 'components/basic/text';
import {Flex, Box} from '@rebass/grid';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import TextInput from 'components/basic/forms/input/TextInput';
import {ErrorDescription} from 'components/basic/forms/base';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';

const getLabel = (value, options) => {
    const option = options.find(o => o.value === value);

    return option && option.label;
};

const CheckboxWrapper = styled.label`
    margin: 5px 15px 5px 0;
    user-select: none;
    cursor: pointer;
`;

const CheckboxLabel = styled.span`
    margin-left: 5px;
    color: #374050;
    font-weight: 400;
`;

const Checkbox = ({label, name, checked = false, onValueChanged}) => (
    <CheckboxWrapper htmlFor={name}>
        <input
            type='checkbox'
            name={name}
            checked={checked}
            onChange={() => onValueChanged(!checked)}
        />
        <CheckboxLabel>{label}</CheckboxLabel>
    </CheckboxWrapper>
);
const CreateMetricForm = ({onValueChanged, options = {}, values = {}, errors = {}}) => {
    return (
        <Flex flexWrap='wrap'>
            <Box width={1} p={1}>
                <H3>Select Base</H3>
                <FilterableDropdownList
                    manualValue={getLabel(values.baseMetric, options.baseMetrics)}
                    options={options.baseMetrics}
                    onValueChanged={value => onValueChanged('baseMetric', value)}
                    error={errors.baseMetric}
                />
            </Box>
            {values.baseMetric === null && (
                <Box width={1} mt={3}>
                    <Flex width={1}>
                        <Box width={1 / 2} p={1}>
                            <H3>Metric Name</H3>
                            <TextInput
                                placeholder='Enter a name for the metric'
                                value={values.name}
                                onValueChanged={value => onValueChanged('name', value)}
                                error={errors.name}
                            />
                        </Box>
                        <Box width={1 / 2} p={1}>
                            <H3>Format</H3>
                            <DropdownList
                                manualValue={getLabel(values.format, options.formats)}
                                options={options.formats}
                                onValueChanged={value => onValueChanged('format', value)}
                                error={errors.format}
                            />
                        </Box>
                    </Flex>
                    <Box width={1} p={1} mt={3}>
                        <H3>Value Type</H3>
                        <DropdownList
                            manualValue={getLabel(values.valueType, options.valueTypes)}
                            options={options.valueTypes}
                            onValueChanged={value => onValueChanged('valueType', value)}
                            error={errors.valueType}
                        />
                    </Box>
                </Box>
            )}
            <Box width={1} mt={3} p={1}>
                <H3>Select Reporting Periods</H3>
                {errors.reportingPeriods && (
                    <ErrorDescription>{errors.reportingPeriods}</ErrorDescription>
                )}
                <Box>
                    {options.reportingPeriods
                        .filter(p => p.valueType === values.valueType)
                        .map(t => (
                            <Checkbox
                                key={t.value}
                                checked={values.reportingPeriods[t.value] || false}
                                label={t.label}
                                onValueChanged={value =>
                                    onValueChanged('reportingPeriods', {
                                        ...values.reportingPeriods,
                                        [t.value]: value,
                                    })
                                }
                            />
                        ))}
                </Box>
            </Box>
        </Flex>
    );
};

export default CreateMetricForm;
