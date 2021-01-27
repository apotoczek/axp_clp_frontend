import React from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';

import {is_set, parse_number} from 'src/libs/Utils';
import {Format} from 'libs/spec-engine/utils';
import ExtraPropTypes from 'utils/extra-prop-types';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import {number} from 'utils/formatters';

import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import TextInput from 'components/basic/forms/input/TextInput';

CustomDataIntervalSettings.propTypes = {
    axisFormat: ExtraPropTypes.valueFromEnum(Format).isRequired,
    onAxisIntervalChanged: PropTypes.func.isRequired,
};
export default function CustomDataIntervalSettings({
    axisName,
    axisFormat,
    onAxisIntervalChanged,
    provider,
}) {
    const onChangeIntervalField = usePartiallyAppliedCallback((fieldName, value) => {
        if (!is_set(value, true)) {
            onAxisIntervalChanged({[fieldName]: undefined});
            return;
        }

        if (axisFormat === Format.Date) {
            onAxisIntervalChanged({[fieldName]: value});
            return;
        }

        value = parse_number(value);

        if (axisFormat === Format.Percentage || axisFormat === Format.Percent) {
            value = value / 100.0;
        }

        onAxisIntervalChanged({[fieldName]: value});
    }, []);
    if (axisFormat === Format.Date) {
        return (
            <DateAxisIntervalSettings
                min={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'min',
                ])}
                max={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'max',
                ])}
                interval={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'interval',
                ])}
                onChangeMin={onChangeIntervalField('min')}
                onChangeMax={onChangeIntervalField('max')}
                onChangeInterval={onChangeIntervalField('interval')}
            />
        );
    } else if (
        axisFormat === Format.Money ||
        axisFormat === Format.Multiple ||
        axisFormat === Format.Percentage ||
        axisFormat === Format.Percent ||
        axisFormat === Format.Integer ||
        axisFormat === Format.Float
    ) {
        return (
            <TextInputAxisIntervalSettings
                axisFormat={axisFormat}
                min={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'min',
                ])}
                max={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'max',
                ])}
                interval={provider.settingsValueForComponent([
                    `${axisName}Label`,
                    'customDataInterval',
                    'interval',
                ])}
                onChangeMin={onChangeIntervalField('min')}
                onChangeMax={onChangeIntervalField('max')}
                onChangeInterval={onChangeIntervalField('interval')}
            />
        );
    }

    throw `Found unsupported axis type ${axisFormat}.`;
}

const AxisFormatStr = {
    [Format.Money]: '(Money)',
    [Format.Multiple]: '(Multiple)',
    [Format.Percentage]: '(Percent)',
    [Format.Percent]: '(Percent)',
};

const InputFormatter = {
    [Format.Money]: x => (Object.isNumber(x) ? number(x) : undefined),
    [Format.Multiple]: x => (Object.isNumber(x) ? number(x) : undefined),
    [Format.Percentage]: x => (Object.isNumber(x) ? x * 100 : undefined),
    [Format.Percent]: x => (Object.isNumber(x) ? x * 100 : undefined),
};

function TextInputAxisIntervalSettings({
    axisFormat,
    min,
    max,
    interval,
    onChangeMin,
    onChangeMax,
    onChangeInterval,
}) {
    const formatter = InputFormatter[axisFormat] || (x => x);
    return (
        <>
            <Flex flex={1} mb={1}>
                <TextInput
                    flex={1}
                    mr={1}
                    leftLabel='Axis Min'
                    rightLabel={AxisFormatStr[axisFormat]}
                    placeholder='Automatic'
                    value={formatter(min)}
                    onValueChanged={onChangeMin}
                />
                <TextInput
                    flex={1}
                    leftLabel='Axis Max'
                    rightLabel={AxisFormatStr[axisFormat]}
                    placeholder='Automatic'
                    value={formatter(max)}
                    onValueChanged={onChangeMax}
                />
            </Flex>
            <TextInput
                mb={1}
                leftLabel='Tick Interval'
                rightLabel={AxisFormatStr[axisFormat]}
                placeholder='Automatic'
                value={formatter(interval)}
                onValueChanged={onChangeInterval}
            />
        </>
    );
}

function DateAxisIntervalSettings({
    min,
    max,
    interval,
    onChangeMin,
    onChangeMax,
    onChangeInterval,
}) {
    return (
        <>
            <Flex flex={1} mb={1}>
                <DatePickerDropdown
                    flex={1}
                    mr={1}
                    label='Axis Min'
                    placeholder='Automatic'
                    value={min}
                    onChange={onChangeMin}
                    clearable
                    useTimestamp
                />
                <DatePickerDropdown
                    flex={1}
                    label='Axis Max'
                    placeholder='Automatic'
                    value={max}
                    onChange={onChangeMax}
                    clearable
                    useTimestamp
                />
            </Flex>
            <DropdownList
                mb={1}
                leftLabel='Tick Interval'
                options={[
                    {value: undefined, label: 'Automatic'},
                    {value: 'month', label: 'Monthly'},
                    {value: 'quarter', label: 'Quarterly'},
                    {value: 'year', label: 'Yearly'},
                ]}
                placeholder='Quarterly'
                value={interval}
                onValueChanged={onChangeInterval}
            />
        </>
    );
}
