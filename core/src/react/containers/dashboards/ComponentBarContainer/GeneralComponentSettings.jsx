import React, {useState} from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';

import TextInput from 'components/basic/forms/input/TextInput';

import {usePartiallyAppliedCallback} from 'utils/hooks';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';

import Icon from 'components/basic/Icon';

const ButtonWrapper = styled(Flex)`
    position: relative;
    padding: 2px;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
`;

const MoreSettingsContainer = styled(Flex)`
    position: absolute;
    transform: translateX(-50%);
    top: 24px;
    z-index: 100;
    background: ${({theme}) => theme.dashboard.componentBar.dropdown.bg};
    border: 1px solid ${({theme}) => theme.dashboard.componentBar.dropdown.border};
    box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    padding: 4px;
    align-items: center;
    flex-direction: column;
    width: 250px;
`;

const Wrapper = styled(Flex)`
    padding: 0 16px;
`;

export default function GeneralComponentSettings({
    onSettingsChanged,
    settingsProvider,
    enableComponentPaddingSetting,
}) {
    const [dropdownOpenState, setDropdownOpenState] = useState({
        componentPadding: false,
    });

    const toggleDropdown = usePartiallyAppliedCallback(
        dropdownId => {
            setDropdownOpenState(dropdownOpenState => ({
                ...dropdownOpenState,
                [dropdownId]: !dropdownOpenState[dropdownId],
            }));
        },
        [setDropdownOpenState],
    );

    const changePadding = usePartiallyAppliedCallback(
        (axis, value) =>
            onSettingsChanged(BaseSpecHandler.changeSettings, {[`padding${axis}`]: value}),
        [onSettingsChanged],
    );

    return (
        <Wrapper>
            <ButtonWrapper active={dropdownOpenState.componentPadding}>
                {enableComponentPaddingSetting && (
                    <Icon
                        name='component-padding'
                        bisonicon
                        button
                        size={20}
                        onClick={toggleDropdown('componentPadding')}
                    />
                )}
                {dropdownOpenState.componentPadding && enableComponentPaddingSetting && (
                    <MoreSettingsContainer>
                        <TextInput
                            leftLabel='Spacing Y'
                            rightLabel='(px)'
                            placeholder='E.g. 5'
                            value={settingsProvider.settingsValueForComponent(['paddingY'])}
                            onValueChanged={changePadding('Y')}
                            noBorder
                            mb={1}
                        />
                        <TextInput
                            leftLabel='Spacing X'
                            rightLabel='(px)'
                            placeholder='E.g. 5'
                            value={settingsProvider.settingsValueForComponent(['paddingX'])}
                            onValueChanged={changePadding('X')}
                            noBorder
                        />
                    </MoreSettingsContainer>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
}
