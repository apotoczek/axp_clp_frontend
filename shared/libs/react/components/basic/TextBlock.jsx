import React from 'react';
import ReactQuill from 'react-quill';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Wrapper = styled.div`
    text-align: center;
    height: 100%;
    width: 100%;

    /*
     * This is a hack to ensure that pasting does not reset the scroll position.
     * The code is taken from here:
     * https://github.com/quilljs/quill/issues/1374#issuecomment-534410373
     * In that issue you can also read more about what is going on and why this works.
     */
    .ql-clipboard {
        position: fixed;
        opacity: 0;
        left: 50%;
        top: 50%;
    }

    .ql-editor {
        padding: 0;
    }

    /* Restore default behavior, this was overwritten somewhere outside react context */
    .ql-editor p span {
        line-height: normal;
    }

    .ql-container.ql-snow,
    .ql-toolbar.ql-snow {
        border: none;
        font-family: 'Lato', sans-serif;
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

function quillSetup() {
    const Quill = ReactQuill.Quill;
    const Font = Quill.import('formats/font');
    Font.whitelist = ['Lato', 'Karla', 'Dejavusansmono', 'monospace', 'serif'];
    Quill.register(Font, true);
}

class Viewer extends React.Component {
    static propTypes = {
        text: PropTypes.string,
    };

    componentDidMount() {
        quillSetup();
    }

    modules = () => {
        return {
            toolbar: false,
            clipboard: {
                // Toggle to add extra line breaks when pasting HTML:
                matchVisual: false,
            },
        };
    };

    render() {
        return (
            <Wrapper className={this.props.className}>
                <ReactQuill
                    modules={this.modules()}
                    readOnly
                    theme='snow'
                    value={this.props.text || ''}
                />
            </Wrapper>
        );
    }
}

export const DefaultToolbarWrapper = styled.div`
    margin: 20px 8px;
    text-align: left;
    display: flex;
    border-radius: 3px;
    background: ${({theme}) => theme.textBlock.bg};
    color: ${({theme}) => theme.textBlock.fg};
    border: 1px solid ${({theme}) => theme.textBlock.border};

    .ql-picker-label {
        color: ${({theme}) => theme.textBlock.fg};
        font-weight: 400;
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

    .ql-picker-options {
        background: ${({theme}) => theme.textBlock.bg};
    }
`;

export const DefaultToolbarSection = styled.span`
    display: flex !important;
    border-right: 1px solid ${({theme}) => theme.textBlock.sectionBorder};
    padding: 0 10px;

    &:last-child {
        border: none;
    }

    &:first-child {
        padding-left: 0;
    }
`;

function DefaultToolbar() {
    return (
        <DefaultToolbarWrapper className='noDrag' id='toolbar'>
            <DefaultToolbarSection className='ql-formats'>
                <select className='ql-size' />
                <select className='ql-font' defaultValue='Lato'>
                    <option value='Lato'>Lato</option>
                    <option value='Karla'>Karla</option>
                    <option value='Dejavusansmono'>Dejavu</option>
                </select>
            </DefaultToolbarSection>
            <DefaultToolbarSection className='ql-formats'>
                <select className='ql-color' />
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
                <select className='ql-align' />
                <button className='ql-clean' />
            </DefaultToolbarSection>
        </DefaultToolbarWrapper>
    );
}

export class Editor extends React.Component {
    static propTypes = {
        text: PropTypes.string,
        placeholder: PropTypes.string,
        onTextChanged: PropTypes.func,
        quillClassNames: PropTypes.arrayOf(PropTypes.string),
        showToolbar: PropTypes.bool,
        readOnly: PropTypes.bool,
        debounceValueChange: PropTypes.bool,
    };

    static defaultProps = {
        placeholder: 'Start writing free text...',
        onTextChanged: () => {},
        quillClassNames: [],
        showToolbar: false,
        readOnly: false,
        debounceValueChange: true,
        toolbarId: '#toolbar',
        /* There's a bug in react-quill, which triggers an error incorrectly when the
           value prop is undefined, so we set it to null by default.
           There's PR out that fixes it: https://github.com/zenoamaro/react-quill/pull/530
        */
        text: null,
    };

    componentDidMount() {
        quillSetup();
    }

    quillClassNames = () => {
        const classNames = [...this.props.quillClassNames];
        return classNames.length > 0 ? classNames.join(' ') : undefined;
    };

    modules = () => {
        return {
            toolbar: this.props.showToolbar && this.props.toolbarId,
            clipboard: {
                // Toggle to add extra line breaks when pasting HTML:
                matchVisual: false,
            },
        };
    };

    handleTextChanged = text => this.props.onTextChanged(text);

    render() {
        const toolbar = this.props.toolbar === undefined ? <DefaultToolbar /> : this.props.toolbar;
        return (
            <Wrapper className={this.props.className}>
                <ReactQuill
                    ref={this.props.quillRef}
                    bounds='.react-grid-layout'
                    className={this.quillClassNames()}
                    modules={this.modules()}
                    onChange={this.handleTextChanged}
                    placeholder={this.props.placeholder}
                    readOnly={this.props.readOnly}
                    theme='snow'
                    value={this.props.text}
                />
                {this.props.showToolbar && toolbar}
            </Wrapper>
        );
    }
}

TextBlock.propTypes = {
    ...Editor.propTypes,
    ...Viewer.propTypes,
    isEditing: PropTypes.bool,
};

export default function TextBlock({isEditing, ...rest}) {
    const ActiveModeComponent = isEditing ? Editor : Viewer;
    return <ActiveModeComponent {...rest} />;
}
