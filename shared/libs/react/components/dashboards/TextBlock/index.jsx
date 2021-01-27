import React, {useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {useDebouncedCallback} from 'utils/hooks';
import {is_set} from 'src/libs/Utils';

import BaseTextBlock from 'components/basic/TextBlock';

import TextBlockProvider from 'providers/textblock-provider';

import Provider from 'components/dashboards/TextBlock/provider';
import * as specHandler from 'components/dashboards/TextBlock/spec-handler';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';

const VARIABLE_REGEX = /{{[\w ]+}}/gm;
const generateReplacerFn = provider => match => {
    const variableName = match.replace('{{', '').replace('}}', '');
    const mapped = provider.getMapping(variableName);
    if (is_set(mapped, true)) {
        return mapped;
    }

    return match;
};

const StyledBaseTextBlock = styled(BaseTextBlock)`
    .ql-container.ql-snow {
        background-color: ${props => props.backgroundColor};

        padding-top: ${props => props.paddingY ?? 0}px;
        padding-bottom: ${props => props.paddingY ?? 0}px;
        padding-left: ${props => props.paddingX ?? 0}px;
        padding-right: ${props => props.paddingX ?? 0}px;
    }
`;

TextBlock.propTypes = {
    ...TextBlock.propTypes,
    provider: PropTypes.oneOfType([
        PropTypes.instanceOf(TextBlockProvider),
        PropTypes.instanceOf(Provider),
    ]),
    onSpecHandlerAction: PropTypes.func,
};

export default function TextBlock({
    dataProvider: provider,
    isEditing,
    isSelected,
    onSpecHandlerAction = () => {},
    onSettingsChanged = () => {},
    text: _,
    componentId,
    onSharedStateChange = () => {},
    ...restProps
}) {
    const [bufferedContent, setBufferedContent] = useState();
    const quillRef = React.useRef(null);
    let text = bufferedContent || provider.getText();
    if (!isEditing) {
        text = text.replace(VARIABLE_REGEX, generateReplacerFn(provider));
    }

    React.useEffect(() => {
        onSharedStateChange(componentId, {quillRef});
    }, [onSharedStateChange, quillRef, componentId]);

    const debouncedTextChange = useDebouncedCallback(text => {
        onSpecHandlerAction(specHandler.changeText, {text});
        onSettingsChanged(BaseSpecHandler.changeSettings, {text}, componentId);
        setBufferedContent('');
    }, 250);

    const handleTextChanged = useCallback(
        text => {
            setBufferedContent(text);
            debouncedTextChange(text);
        },
        [debouncedTextChange],
    );

    return (
        <StyledBaseTextBlock
            backgroundColor={provider.settingsValueForComponent(['backgroundColor'], '#FFFFFF')}
            paddingX={provider.settingsValueForComponent(['paddingX'])}
            paddingY={provider.settingsValueForComponent(['paddingY'])}
            text={text}
            isEditing={isEditing}
            onTextChanged={handleTextChanged}
            quillClassNames={isSelected ? ['noDrag'] : []}
            quillRef={quillRef}
            showToolbar={isSelected}
            toolbar={null}
            readOnly={!isSelected}
            placeholder='Start typing a sentence, a paragraph or {{variables}}.'
            {...restProps}
        />
    );
}
