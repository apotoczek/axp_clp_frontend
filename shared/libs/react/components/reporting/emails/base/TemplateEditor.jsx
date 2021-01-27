import React from 'react';
import styled, {css} from 'styled-components';
import {Box} from '@rebass/grid';
import {ContentState, Modifier, CompositeDecorator, Editor, EditorState} from 'draft-js';
import {lighten} from 'polished';
// import 'draft-js/dist/Draft.css';
import {EMAIL_TEMPLATE_STRINGS} from 'src/libs/Constants';
import {ErrorDescription} from 'components/basic/forms/base';

const StyledErrorDescription = styled(ErrorDescription)`
    position: absolute;
    right: 15px;
    top: 10px;
    max-width: 50%;
    text-align: right;
`;

function findWithRegex(regex, contentBlock, callback) {
    const text = contentBlock.getText();
    let result, start;
    while ((result = regex.exec(text)) !== null) {
        start = result.index;
        callback(start, start + result[0].length);
    }
}

const ValidVariableComponent = props => {
    return (
        <span offsetkey={props.offsetKey} style={{color: '#3AC376'}}>
            {props.children}
        </span>
    );
};

const VARIABLE_OPTIONS = EMAIL_TEMPLATE_STRINGS.map(({value}) => value);
const VARIABLE_REGEX = new RegExp(`{{ ?(${VARIABLE_OPTIONS.join('|')}) ?}}`, 'g');

const validVariableStrategy = (block, callback) => {
    findWithRegex(VARIABLE_REGEX, block, callback);
};

const decorator = new CompositeDecorator([
    {
        strategy: validVariableStrategy,
        component: ValidVariableComponent,
    },
]);

export const createEditorStateFromText = text => {
    const content = ContentState.createFromText(text);
    return EditorState.createWithContent(content, decorator);
};

class BaseEditor extends React.Component {
    state = {
        editorState: createEditorStateFromText(this.props.initialText),
    };

    editorRef = React.createRef();

    get editor() {
        return this.editorRef.current;
    }

    insertVariable = variable => {
        const {editorState} = this.state;
        const currentContent = editorState.getCurrentContent();
        const selection = editorState.getSelection();

        const formattedVariable = `{{ ${variable} }}`;
        const contentState = Modifier.replaceText(currentContent, selection, formattedVariable);
        let newState = EditorState.push(editorState, contentState, 'insert-characters');
        this.onChange(newState);
    };

    onChange = editorState => {
        this.setState({editorState}, () => this.props.onContentUpdated(this.getPlainText()));
    };

    getPlainText() {
        let content = this.state.editorState.getCurrentContent();
        return content.getPlainText();
    }

    replaceAll = text => {
        const {editorState} = this.state;
        const newContent = ContentState.createFromText(text);
        this.onChange(EditorState.push(editorState, newContent));
    };

    render() {
        return (
            <Box id='editor-box' {...this.props} onClick={() => this.editor.focus()}>
                {this.props.error && (
                    <StyledErrorDescription>{this.props.error}</StyledErrorDescription>
                )}
                <Editor
                    editorState={this.state.editorState}
                    onChange={this.onChange}
                    ref={this.editorRef}
                />
            </Box>
        );
    }
}

export default styled(BaseEditor)`
    position: relative;
    cursor: text;
    background-color: ${({theme}) => theme.input.wrapperBg};
    padding: 14px;
    min-height: 250px;
    border-radius: 3px;
    border: 1px solid ${({theme}) => theme.input.border};
    &:hover,
    &:focus-within {
        border: 1px solid ${({theme}) => theme.input.hoverBorder};
    }

    color: ${({theme}) => lighten(0.25, theme.input.labelFg)};

    ${props =>
        props.error &&
        css`
            border: 1px solid ${({theme}) => theme.input.errorBorder};

            &:hover,
            &:focus-within {
                border: 1px solid ${({theme}) => theme.input.errorBorder};
            }
        `}
`;
