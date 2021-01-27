import React, {Component} from 'react';
import TextInput from 'components/basic/forms/input/TextInput';
import {Box} from '@rebass/grid';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import TemplateEditor from 'components/reporting/emails/base/TemplateEditor';
import styled from 'styled-components';

export default class EmailTemplateEditor extends Component {
    get editor() {
        return this.editorRef;
    }

    handlePartialUpdate = key => value => {
        this.props.onTemplateUpdate({[key]: value});
    };

    render() {
        const {options, template, errors} = this.props;
        return (
            <Box p={1}>
                <Box mb={3}>
                    <TextInput
                        leftLabel='Template Name'
                        value={template.name}
                        onValueChanged={this.handlePartialUpdate('name')}
                        error={errors.name}
                    />
                </Box>
                <TemplateContainer>
                    <Box mb={2}>
                        <TextInput
                            leftLabel='Subject'
                            value={template.subject}
                            onValueChanged={this.handlePartialUpdate('subject')}
                            error={errors.subject}
                        />
                    </Box>
                    <Box width={1 / 3} mb={2}>
                        <FilterableDropdownList
                            leftLabel='Insert Template String'
                            options={options}
                            onValueChanged={e => this.editor.insertVariable(e.subLabel)}
                            broadcastFullOption
                        />
                    </Box>
                    <Box>
                        <TemplateEditor
                            ref={el => (this.editorRef = el)}
                            onContentUpdated={this.handlePartialUpdate('body')}
                            initialText={template.body || ''}
                            error={errors.body}
                        />
                    </Box>
                </TemplateContainer>
            </Box>
        );
    }
}

const TemplateContainer = styled(Box)`
    background-color: #d9dcec;
    border-radius: 3px;
    padding: 10px;
`;
