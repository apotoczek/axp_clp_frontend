import React, {useCallback, useState} from 'react';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import {SectionSubTitle} from 'components/dashboards/component-settings/base';

import {Wrapper} from 'components/basic/forms/base';
import Checkbox from 'components/basic/forms/Checkbox';
import Collapsible from 'components/dashboards/component-settings/Collapsible';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Icon from 'components/basic/Icon';
import InfoTextDropdown from 'components/basic/forms/dropdowns/InfoTextDropdown';
import NumberInput from 'components/basic/forms/input/NumberInput';
import TextInput from 'components/basic/forms/input/TextInput';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';

const DERIVED_DATA_POINT_LABEL_DESCRIPTION = [
    {
        title: 'Value Percent',
        description: oneLine`
            {{valuePercent}} gets replaced with the percent of the total that the value
            for the current data point represents.
        `,
    },
    {
        title: 'Value',
        description: oneLine`
            {{value}} gets replaced with the value for the current data point.
        `,
    },
    {
        title: 'Value Name',
        description: oneLine`
            {{valueName}} gets replaced with the name of the value that the data point
            comes from.
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
        background: ${props => props.theme.dashboard.settings.iconHoverBg};
        color: ${props => props.theme.dashboard.settings.iconHoverFg};
    }

    ${props =>
        props.active &&
        css`
            color: ${props => props.theme.dashboard.settings.iconActiveFg};
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
                mr={1}
            />
            <LabelStyleWrapper flex='0 1 auto'>
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
                    color={provider.settingsValueForComponent(
                        [`${axisName}Label`, 'color'],
                        '#666666',
                    )}
                    colors={provider.getCustomColors()}
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

export default function DataPointsLabelSettings({
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
                    true,
                )}
                onValueChanged={onEnableDataLabelsChanged}
            />
            <InfoTextDropdown
                title='Available Variables'
                infoTexts={DERIVED_DATA_POINT_LABEL_DESCRIPTION}
            >
                <TextInput
                    leftLabel='Label'
                    value={provider.settingsValueForComponent(['dataPointLabel', 'content'])}
                    placeholder='E.g. {{valuePercent}} ({{valueName}})'
                    onValueChanged={value => onLabelSettingChanged({key: 'content', value})}
                />
            </InfoTextDropdown>
            <SectionSubTitle>Tick Placement</SectionSubTitle>
            <Checkbox
                mb={1}
                flex={1}
                leftLabel='Data Point Labels Inside Slices'
                checked={provider.settingsValueForComponent(
                    ['dataPointLabel', 'insideSlices'],
                    false,
                )}
                onValueChanged={value => onLabelSettingChanged({key: 'insideSlices', value})}
            />
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
