import React, {useCallback, useState} from 'react';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';

import {SectionSubTitle} from 'components/dashboards/component-settings/base';
import Checkbox from 'components/basic/forms/Checkbox';
import NumberInput from 'components/basic/forms/input/NumberInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Icon from 'components/basic/Icon';
import {Wrapper} from 'components/basic/forms/base';
import Collapsible from 'components/dashboards/component-settings/Collapsible';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';

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

const POSITIONS = [
    {value: 'bottom', label: 'Bottom'},
    {value: 'left', label: 'Left'},
    {value: 'right', label: 'Right'},
    {value: 'top', label: 'Top'},
];

export default function LegendSettings({provider, onLegendSettingChanged}) {
    const [isOpen, setIsOpen] = useState(false);

    const header = 'Legend Settings';

    const toggleStyle = useCallback(
        (key, defaultValue) => {
            onLegendSettingChanged({
                key,
                value: !provider.settingsValueForComponent(['legend', key], defaultValue),
            });
        },
        [onLegendSettingChanged, provider],
    );

    return (
        <Collapsible header={header} isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)}>
            <SectionSubTitle noTopMargin>General</SectionSubTitle>
            <Checkbox
                mb={1}
                flex='1 1 auto'
                leftLabel='Enable Legends'
                checked={provider.settingsValueForComponent(['legend', 'enable'], true)}
                onValueChanged={() => toggleStyle('enable', true)}
            />
            <Flex mb={1}>
                <NumberInput
                    leftLabel='Font Size'
                    value={provider.settingsValueForComponent(['legend', 'fontSize'])}
                    placeholder='E.g. 14 (Default 10)'
                    min={1}
                    onValueChanged={value => onLegendSettingChanged({key: 'fontSize', value})}
                />
                <LabelStyleWrapper ml={1} flex='0 1 auto'>
                    <LabelStyleIconBox
                        bisonicon
                        active={provider.settingsValueForComponent(['legend', 'bold'], true)}
                        onClick={() => toggleStyle('bold', true)}
                        name='bold'
                        title='Bold'
                        size={24}
                    />
                    <LabelStyleIconBox
                        bisonicon
                        active={provider.settingsValueForComponent(['legend', 'italic'])}
                        onClick={() => toggleStyle('italic')}
                        name='italic'
                        title='Italic'
                        size={24}
                    />
                    <LabelStyleIconBox
                        bisonicon
                        active={provider.settingsValueForComponent(['legend', 'underline'])}
                        onClick={() => toggleStyle('underline')}
                        name='underline'
                        title='Underline'
                        size={24}
                    />
                    <ColorPickerDropdown
                        color={provider.settingsValueForComponent(['legend', 'color'], '#666666')}
                        colors={provider.getCustomColors()}
                        onChange={value => onLegendSettingChanged({key: 'color', value})}
                    >
                        <LabelStyleIconBox
                            bisonicon
                            name='text-color'
                            title='Text Color'
                            color={provider.settingsValueForComponent(
                                ['legend', 'color'],
                                '#666666',
                            )}
                            size={24}
                        />
                    </ColorPickerDropdown>
                </LabelStyleWrapper>
            </Flex>
            <SectionSubTitle>Placement</SectionSubTitle>
            <DropdownList
                flex={1}
                mb={1}
                label='Placement'
                value={provider.settingsValueForComponent(['legend', 'placement'], 'bottom')}
                options={POSITIONS}
                keyKey='value'
                onValueChanged={value => onLegendSettingChanged({key: 'placement', value})}
            />
        </Collapsible>
    );
}
