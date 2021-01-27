import React, {useCallback, useState} from 'react';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import {Format} from 'libs/spec-engine/utils';

import {SectionSubTitle} from 'components/dashboards/component-settings/base';
import Checkbox from 'components/basic/forms/Checkbox';
import TextInput from 'components/basic/forms/input/TextInput';
import NumberInput from 'components/basic/forms/input/NumberInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Icon from 'components/basic/Icon';
import InfoTextDropdown from 'components/basic/forms/dropdowns/InfoTextDropdown';
import {Wrapper} from 'components/basic/forms/base';
import Collapsible from 'components/dashboards/component-settings/Collapsible';
import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';
import CustomDataIntervalSettings from 'components/dashboards/component-settings/CustomDataIntervalSettings';

const DERIVED_DATA_POINT_LABEL_DESCRIPTION = [
    {
        title: 'Value',
        description: oneLine`
            {{xValue}} / {{yValue}} / {{zValue}} gets replaced with the value
            for the respective axis at the data point
        `,
    },
    {
        title: 'Value Name',
        description: oneLine`
            {{xValueName}} / {{yValueName}} / {{zValueName}} gets replaced with the name
            of the value that was set for the respective axis.
        `,
    },
    {
        title: 'Entity Name',
        description: oneLine`
            {{entityName}} gets replaced with the name of the entity that the data point
            comes from.
        `,
    },
    {
        title: 'Group Name',
        description: oneLine`
            {{groupName}} gets replaced with the name of the group that the data point
            comes from.
        `,
        italic: ' Only works if the value that the data point comes from is grouped.',
    },
];

const LabelStyleWrapper = styled(Wrapper)`
    padding: 2px;
    display: flex;
    align-items: center;

    &:hover,
    &:focus-within {
        border: 1px solid ${({theme}) => theme.input.border};
    }
`;

const LabelStyleIconBox = styled(Icon)`
    display: block;
    align-items: center;
    padding: 4px;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background: #212428;
        color: #f5f5f5;
    }

    ${props =>
        props.active &&
        css`
            color: #3ac376;
        `}
`;

function LabelStyleSettings({provider, axisName, onLabelSettingChanged}) {
    const toggleStyle = useCallback(
        key => {
            onLabelSettingChanged({
                key,
                value: !provider.settingsValueForComponent([`${axisName}Label`, key]),
            });
        },
        [axisName, onLabelSettingChanged, provider],
    );

    return (
        <Flex mb={1}>
            <NumberInput
                leftLabel='Font Size'
                value={provider.settingsValueForComponent([`${axisName}Label`, 'fontSize'])}
                placeholder='E.g. 14 (Default 10)'
                min={1}
                onValueChanged={value => onLabelSettingChanged({key: 'fontSize', value})}
            />
            <LabelStyleWrapper ml={1} flex='0 1 auto'>
                <LabelStyleIconBox
                    bisonicon
                    active={provider.settingsValueForComponent([`${axisName}Label`, 'bold'])}
                    onClick={() => toggleStyle('bold')}
                    name='bold'
                    title='Bold'
                    size={24}
                />
                <LabelStyleIconBox
                    bisonicon
                    active={provider.settingsValueForComponent([`${axisName}Label`, 'italic'])}
                    onClick={() => toggleStyle('italic')}
                    name='italic'
                    title='Italic'
                    size={24}
                />
                <LabelStyleIconBox
                    bisonicon
                    active={provider.settingsValueForComponent([`${axisName}Label`, 'underline'])}
                    onClick={() => toggleStyle('underline')}
                    name='underline'
                    title='Underline'
                    size={24}
                />
                <ColorPickerDropdown
                    colors={provider.getCustomColors()}
                    color={provider.settingsValueForComponent(
                        [`${axisName}Label`, 'color'],
                        '#666666',
                    )}
                    onChange={value => onLabelSettingChanged({key: 'color', value})}
                >
                    <LabelStyleIconBox
                        bisonicon
                        name='text-color'
                        title='Text Color'
                        color={provider.settingsValueForComponent(
                            [`${axisName}Label`, 'color'],
                            '#666666',
                        )}
                        size={24}
                    />
                </ColorPickerDropdown>
            </LabelStyleWrapper>
        </Flex>
    );
}

export function LabelSettings({
    title,
    axisName,
    provider,
    onLabelSettingChanged,
    onCustomDataIntervalChanged,
    onEnableDataLabelsChanged,
    onTickRotationChanged,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const header = `${title} Settings`;
    const axisFormat = provider.axisFormat(axisName);

    return (
        <Collapsible
            disabled={axisFormat === undefined}
            header={header}
            isOpen={isOpen}
            toggleOpen={() => setIsOpen(!isOpen)}
        >
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <Checkbox
                flex={1}
                mb={1}
                leftLabel='Enable Data Labels'
                checked={provider.settingsValueForComponent(
                    [`${axisName}Label`, 'enableDataLabels'],
                    true,
                )}
                onValueChanged={onEnableDataLabelsChanged}
            />
            <TextInput
                leftLabel='Axis Name'
                value={provider.settingsValueForComponent([`${axisName}Label`, 'name'])}
                onValueChanged={value => onLabelSettingChanged({key: 'name', value})}
                mb={1}
                placeholder='E.g. Currency'
            />
            {axisFormat !== undefined && (
                <>
                    <SectionSubTitle>Axis Ranges</SectionSubTitle>
                    <CustomDataIntervalSettings
                        flex={['1 1 auto', null, null, null, null, '4 1 auto']}
                        axisName={axisName}
                        axisFormat={axisFormat}
                        label='Set custom data intervals'
                        provider={provider}
                        onAxisIntervalChanged={onCustomDataIntervalChanged}
                    />
                </>
            )}
            <SectionSubTitle>Tick Placement</SectionSubTitle>
            <NumberInput
                flex={1}
                mb={1}
                leftLabel='Tick Rotation'
                rightLabel='(Degrees)'
                placeholder='E.g. 45 (Default 0)'
                min={axisName == 'xAxis' ? 0 : undefined}
                max={axisName == 'xAxis' ? 90 : undefined}
                value={provider.settingsValueForComponent([`${axisName}Label`, 'tickRotation'], 0)}
                onValueChanged={onTickRotationChanged}
            />
            <SectionSubTitle>Tick Formatting</SectionSubTitle>
            <LabelStyleSettings
                provider={provider}
                axisName={axisName}
                onLabelSettingChanged={onLabelSettingChanged}
            />
            <Flex mb={1}>
                <DropdownList
                    leftLabel='Display Units'
                    value={provider.settingsValueForComponent([`${axisName}Label`, 'displayUnits'])}
                    options={[
                        {label: 'None', value: undefined},
                        {label: 'Hundred', value: 'hundreds'},
                        {label: 'Thousands', value: 'thousands'},
                        {label: 'Millions', value: 'millions'},
                        {label: 'Billions', value: 'billions'},
                        {label: 'Trillions', value: 'trillions'},
                    ]}
                    onValueChanged={value => onLabelSettingChanged({key: 'displayUnits', value})}
                    mr={1}
                />
                <Checkbox
                    leftLabel='Show Unit'
                    checked={provider.settingsValueForComponent(
                        [`${axisName}Label`, 'showUnit'],
                        true,
                    )}
                    onValueChanged={value => onLabelSettingChanged({key: 'showUnit', value})}
                />
            </Flex>
            <NumberInput
                leftLabel='Decimal Places'
                min={0}
                max={20}
                placeholder='E.g. 0 (Default 2)'
                value={provider.settingsValueForComponent([`${axisName}Label`, 'decimalPlaces'])}
                onValueChanged={value => onLabelSettingChanged({key: 'decimalPlaces', value})}
                mb={1}
            />
            {axisFormat === Format.Money && (
                <TextInput
                    leftLabel='Currency Symbol Override'
                    min={0}
                    placeholder='E.g. USD'
                    value={provider.settingsValueForComponent([
                        `${axisName}Label`,
                        'currencySymbol',
                    ])}
                    onValueChanged={value => onLabelSettingChanged({key: 'currencySymbol', value})}
                    mb={1}
                />
            )}
        </Collapsible>
    );
}

export function DataPointsLabelSettings({
    provider,
    onEnableDataLabelsChanged,
    onLabelSettingChanged,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const header = 'Data Point Settings';

    return (
        <Collapsible header={header} isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)}>
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <Checkbox
                mb={1}
                leftLabel='Enable Labels'
                checked={provider.settingsValueForComponent(
                    ['dataPointLabel', 'enableDataLabels'],
                    false,
                )}
                onValueChanged={onEnableDataLabelsChanged}
            />
            <InfoTextDropdown
                title='Available Variables'
                infoTexts={DERIVED_DATA_POINT_LABEL_DESCRIPTION}
            >
                <TextInput
                    mb={1}
                    leftLabel='Label'
                    value={provider.settingsValueForComponent(['dataPointLabel', 'content'])}
                    placeholder='E.g. {{xValue}} ({{xValueName}})'
                    onValueChanged={value => onLabelSettingChanged({key: 'content', value})}
                />
            </InfoTextDropdown>
            <SectionSubTitle>Formatting</SectionSubTitle>
            <LabelStyleSettings
                provider={provider}
                axisName='dataPoint'
                onLabelSettingChanged={onLabelSettingChanged}
            />
            <Flex mb={1}>
                <DropdownList
                    leftLabel='Display Units'
                    value={provider.settingsValueForComponent(['dataPointLabel', 'displayUnits'])}
                    options={[
                        {label: 'None', value: undefined},
                        {label: 'Hundreds', value: 'hundreds'},
                        {label: 'Thousands', value: 'thousands'},
                        {label: 'Millions', value: 'millions'},
                        {label: 'Billions', value: 'billions'},
                        {label: 'Trillions', value: 'trillions'},
                    ]}
                    onValueChanged={value => onLabelSettingChanged({key: 'displayUnits', value})}
                    mr={1}
                />
                <Checkbox
                    leftLabel='Show Unit'
                    checked={provider.settingsValueForComponent(
                        ['dataPointLabel', 'showUnit'],
                        true,
                    )}
                    onValueChanged={value => onLabelSettingChanged({key: 'showUnit', value})}
                />
            </Flex>
            <NumberInput
                leftLabel='Decimal Places'
                min={0}
                max={20}
                placeholder='E.g. 0 (Default 2)'
                value={provider.settingsValueForComponent(['dataPointLabel', 'decimalPlaces'])}
                onValueChanged={value => onLabelSettingChanged({key: 'decimalPlaces', value})}
                mb={1}
            />
            <TextInput
                leftLabel='Currency Symbol Override'
                min={0}
                placeholder='E.g. USD'
                value={provider.settingsValueForComponent(['dataPointLabel', 'currencySymbol'])}
                onValueChanged={value => onLabelSettingChanged({key: 'currencySymbol', value})}
                mb={1}
            />
        </Collapsible>
    );
}
