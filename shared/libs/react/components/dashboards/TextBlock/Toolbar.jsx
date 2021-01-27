import React, {useCallback, useState} from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import ColorPickerDropdown from 'components/basic/forms/dropdowns/ColorPickerDropdown';

import {DefaultToolbarSection} from 'components/basic/TextBlock';

import Icon from 'components/basic/Icon';
import Dropdown from 'components/basic/forms/dropdowns/Dropdown';
import TextInput from 'components/basic/forms/input/TextInput';
import {DropdownContent} from 'components/basic/forms/dropdowns/base';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';
import TextBlockSpecHandler from 'component-spec-handlers/text-block-spec-handler';
import * as specHandler from './spec-handler';

const InnerWrapper = styled.div`
    text-align: left;
    display: flex;
    background: ${({theme}) => theme.textBlock.bg};
    color: ${({theme}) => theme.textBlock.fg};

    .ql-picker-label {
        color: ${({theme}) => theme.textBlock.fg};
        font-weight: 400;
    }

    .ql-picker.ql-expanded .ql-picker-label {
        border: none !important;
        outline: none;
    }

    .ql-picker-item {
        color: ${({theme}) => theme.textBlock.fg};
    }

    .ql-stroke {
        color: ${({theme}) => theme.textBlock.fg};
        stroke: ${({theme}) => theme.textBlock.fg};
    }

    .ql-fill {
        color: ${({theme}) => theme.textBlock.fg};
        fill: ${({theme}) => theme.textBlock.fg};
    }

    .ql-color-picker .ql-picker-options {
        background: ${({theme}) => theme.textBlock.bg};
        border-color: #374050 !important;
        padding: 6px;
        outline: none;
        width: 433px;

        .ql-picker-item {
            width: 32px;
            height: 32px;
            border-radius: 2px;
            margin-right: 3px;
            margin-left: 3px;
        }
    }
`;

const OuterWrapper = styled.div`
    text-align: center;
    z-index: 20;

    .ql-container.ql-snow,
    .ql-toolbar.ql-snow {
        border: none;
        font-family: 'Lato', sans-serif;
        padding: 0;
    }

    .ql-toolbar.ql-snow .ql-formats {
        margin-right: 0;
    }

    .ql-font span[data-label='Lato']::before {
        font-family: 'Lato', sans-serif;
    }

    .ql-font span[data-label='Karla']::before {
        font-family: 'Karla', sans-serif;
    }

    .ql-font span[data-label='Dejavusansmono']::before {
        font-family: 'DejaVu Sans Mono', monospace;
    }

    /* Set content font-families */

    .ql-font-Lato {
        font-family: 'Lato', sans-serif;
    }

    .ql-font-Karla {
        font-family: 'Karla', sans-serif;
    }

    .ql-font-Dejavusansmono {
        font-family: 'DejaVu Sans Mono', monospace;
    }
`;

const EditButton = styled(Box)`
    cursor: pointer;

    &:hover {
        color: #0066cc;
    }
`;

const ClickableVariable = styled.div`
    cursor: pointer;
    padding: 4px;
    user-select: none;

    color: ${({theme}) => theme.textBlock.fg};

    &:hover {
        color: ${({theme}) => theme.textBlock.hoverFg};
    }
`;

const ColorBox = styled.div`
    background-color: ${props => props.color};
    width: 100%;
    height: 3px;
`;

function BackgroundColorIcon({color}) {
    return (
        <Box>
            <Icon bisonicon name='fill-color' size={20} button />
            <ColorBox color={color} />
        </Box>
    );
}

const ListWrapper = styled.div`
    overflow-y: scroll;
    margin-top: 4px;
    height: 130px;
    color: ${({theme}) => theme.textBlock.fg};
`;

const VariableDropdown = ({
    searchString,
    onSearchStringChanged,
    onClickEditVariables,
    variables,
    onClickVariable,
}) => (
    <Dropdown
        render={({togglePopover}) => (
            <DropdownContent>
                <Flex flexDirection='column'>
                    <Box mb={2}>Variables</Box>
                    <TextInput
                        autoFocus
                        small
                        value={searchString}
                        onValueChanged={onSearchStringChanged}
                        placeholder='Search variable'
                    />
                    <ListWrapper>
                        {variables
                            .filter(variable =>
                                variable.toLowerCase().includes(searchString.toLowerCase()),
                            )
                            .map(variable => (
                                <ClickableVariable
                                    onClick={() => onClickVariable(variable)}
                                    key={variable}
                                >
                                    {`{{${variable}}}`}
                                </ClickableVariable>
                            ))}
                    </ListWrapper>
                    <Flex>
                        <EditButton
                            mt={2}
                            ml={2}
                            onClick={() => onClickEditVariables(togglePopover)}
                        >
                            <Icon name='cogs' left />
                            Edit variables
                        </EditButton>
                    </Flex>
                </Flex>
            </DropdownContent>
        )}
    >
        <Icon bisonicon name='variable' size={20} button hoverColor='#006FF1' />
    </Dropdown>
);
export default function Toolbar({
    disableVariables,
    dataProvider,
    toggleComponentSettings,
    onSettingsChanged = () => {}, // Used in dashboards
    onSpecHandlerAction = () => {}, // Used in reporting components,
    sharedState,
}) {
    const [textColor, setTextColor] = useState('#000000');
    const [textBg, setTextBg] = useState('#ffffff');

    const [searchString, setSearchString] = useState('');
    const handleSearchStringChanged = useCallback(value => setSearchString(value), []);
    const handleBackgroundColorChanged = useCallback(
        backgroundColor => {
            onSpecHandlerAction(specHandler.changeSettings, {backgroundColor});
            onSettingsChanged(BaseSpecHandler.changeSettings, {backgroundColor});
        },
        [onSettingsChanged, onSpecHandlerAction],
    );
    const handleTextBackgroundColorChanged = useCallback(
        color => {
            const quillRef = sharedState?.quillRef?.current;
            if (quillRef) {
                try {
                    const editor = quillRef.getEditor();
                    editor.format('background', color);
                } catch (_e) {
                    // Could not get the editor for some reason
                }
            }
            setTextBg(color);
        },
        [sharedState],
    );
    const handleTextColorChanged = useCallback(
        color => {
            const quillRef = sharedState?.quillRef?.current;
            if (quillRef) {
                try {
                    const editor = quillRef.getEditor();
                    editor.format('color', color);
                } catch (_e) {
                    // Could not fetch the editor for some reason
                }
            }
            setTextColor(color);
        },
        [sharedState],
    );

    const handleClickEditVariables = useCallback(
        togglePopover => {
            toggleComponentSettings();
            togglePopover();
        },
        [toggleComponentSettings],
    );

    // This appends a variable to the end of the text. Ideally it should be at some cursor
    // location but there is no cursor locations since the textblock does not have focus
    // at this state. This could be solved by storing the last cursor position but not
    // necessary right now. Maybe a future extension.
    const handleClickVariable = useCallback(
        variableName => {
            let text = dataProvider.getText() || '';
            onSettingsChanged(TextBlockSpecHandler.changeText, {
                text: text.concat(`{{${variableName}}}`),
            });
        },
        [onSettingsChanged, dataProvider],
    );

    const customColors = dataProvider.getCustomColors() || [
        '#39BEE5',
        '#FF006E',
        '#3AC376',
        '#6D83A3',
        '#F39C12',
        '#C33A3A',
        '#006FF1',
        '#F95532',
        '#BEBEBE',
        '#4A4A4A',
        '#555555',
        '#000000',
        '#FFFFFF',
        'transparent',
    ];

    return (
        <OuterWrapper>
            <InnerWrapper className='noDrag' id='toolbar'>
                <DefaultToolbarSection className='ql-formats'>
                    <select className='ql-size' />
                    <select className='ql-font' defaultValue='Lato'>
                        <option value='Lato'>Lato</option>
                        <option value='Karla'>Karla</option>
                        <option value='Dejavusansmono'>Dejavu</option>
                    </select>
                </DefaultToolbarSection>
                <DefaultToolbarSection className='ql-formats'>
                    <ColorPickerDropdown
                        color={dataProvider.settingsValueForComponent(
                            ['backgroundColor'],
                            '#FFFFFF',
                        )}
                        colors={dataProvider.getCustomColors()}
                        onChange={handleBackgroundColorChanged}
                    >
                        <BackgroundColorIcon
                            color={dataProvider.settingsValueForComponent(
                                ['backgroundColor'],
                                '#FFFFFF',
                            )}
                        />
                    </ColorPickerDropdown>
                </DefaultToolbarSection>
                <DefaultToolbarSection className='ql-formats'>
                    <ColorPickerDropdown
                        label='Text background'
                        color={textBg}
                        colors={customColors}
                        onChange={handleTextBackgroundColorChanged}
                    >
                        <button className='ql-background' />
                    </ColorPickerDropdown>
                    <ColorPickerDropdown
                        label='Text color'
                        color={textColor}
                        colors={customColors}
                        onChange={handleTextColorChanged}
                    >
                        <button className='ql-color' />
                    </ColorPickerDropdown>
                    <button className='ql-bold' />
                    <button className='ql-italic' />
                    <button className='ql-underline' />
                    <button className='ql-strike' />
                </DefaultToolbarSection>
                <DefaultToolbarSection className='ql-formats'>
                    <button className='ql-list' value='ordered' />
                    <button className='ql-list' value='bullet' />
                    <button className='ql-blockquote' />
                    <button className='ql-code-block' />

                    {/*
                        We dont use dropdown (select tag) for alignment, because quill is
                        buggy: https://github.com/quilljs/quill/issues/2287
                    */}
                    <button className='ql-align' value='' />
                    <button className='ql-align' value='center' />
                    <button className='ql-align' value='right' />
                    <button className='ql-align' value='justify' />

                    <button className='ql-clean' />
                </DefaultToolbarSection>
                {dataProvider && !disableVariables ? (
                    <DefaultToolbarSection className='ql-formats'>
                        <VariableDropdown
                            variables={dataProvider.variableNames() || []}
                            onSearchStringChanged={handleSearchStringChanged}
                            searchString={searchString}
                            onClickEditVariables={handleClickEditVariables}
                            onClickVariable={handleClickVariable}
                        />
                    </DefaultToolbarSection>
                ) : null}
            </InnerWrapper>
        </OuterWrapper>
    );
}
