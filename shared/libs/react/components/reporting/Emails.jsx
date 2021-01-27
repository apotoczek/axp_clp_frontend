import React, {Component} from 'react';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import DataTable from 'components/basic/DataTable';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Viewport} from 'components/layout';
import {is_set} from 'src/libs/Utils';
import SequenceEditor from 'components/reporting/emails/SequenceEditor';
import EmailTemplateEditor from 'components/reporting/emails/EmailTemplateEditor';
import {stripIndent} from 'common-tags';
import {EMAIL_TEMPLATE_STRINGS} from 'src/libs/Constants';

import {ListPage, EditingPage, TableSection, EditingSection} from 'components/reporting/shared';

class EditTemplate extends Component {
    state = {
        template: {
            name: '',
            subject: '',
            body: '',
            ...this.props.template,
        },
        errors: {},
    };

    PAGE_DESCRIPTION = stripIndent`
        Set up your emails that will be sent to your portfolio companies.
        To make things simple, give each email a template name. This will
        be used when you set up the order of emails in your email sequences.
        Each email should have a subject line so the recipient knows what they
        are receiving. Our template strings will allow you to personalize your
        email templates by pulling in information relevant to each company.
    `;

    updateTemplate = templateData => {
        this.setState({
            template: {
                ...this.state.template,
                ...templateData,
            },
        });
    };

    validate = template => {
        const errors = {};

        if (!is_set(template.name, true)) {
            errors.name = 'Name is required';
        }

        if (!is_set(template.subject, true)) {
            errors.subject = 'Subject is required';
        }

        if (!is_set(template.body, true)) {
            errors.body = 'Body is required';
        }

        return errors;
    };

    handleSave = () => {
        let {template} = this.state;

        const errors = this.validate(template);

        if (is_set(errors, true)) {
            this.setState({
                errors: {
                    ...this.state.errors,
                    ...errors,
                },
            });
            return;
        }

        this.props.onSave(template);
    };

    render() {
        const {errors} = this.state;
        const {breadcrumbs, createNew, template: staticTemplate, onCancel} = this.props;

        const breadcrumbLeaf = createNew ? 'Create' : staticTemplate.name;

        return (
            <Viewport>
                <Breadcrumbs
                    path={breadcrumbs.concat(['Template', breadcrumbLeaf])}
                    urls={['#!/reporting-relationships', '#!/reporting-emails']}
                    linkComponent={NonRouterLink}
                />
                <Toolbar flex>
                    <ToolbarItem onClick={onCancel} icon='cancel' glyphicon right>
                        Cancel
                    </ToolbarItem>
                    <ToolbarItem onClick={this.handleSave} icon='save' glyphicon right>
                        Save Template
                    </ToolbarItem>
                </Toolbar>
                <EditingPage>
                    <EditingSection
                        heading={createNew ? 'Create Email Template' : 'Edit Email Template'}
                        description={this.PAGE_DESCRIPTION}
                    >
                        <EmailTemplateEditor
                            options={EMAIL_TEMPLATE_STRINGS.map(({label, value}) => ({
                                label,
                                subLabel: value,
                            }))}
                            template={this.state.template}
                            errors={errors}
                            onTemplateUpdate={this.updateTemplate}
                        />
                    </EditingSection>
                </EditingPage>
            </Viewport>
        );
    }
}

const EditingView = ({
    template,
    sequence,
    templates,
    mode,
    onSaveTemplate,
    onSaveSequence,
    ...rest
}) =>
    mode === 'template' ? (
        <EditTemplate onSave={onSaveTemplate} template={template} {...rest} />
    ) : (
        <SequenceEditor
            onSave={onSaveSequence}
            sequence={sequence}
            templates={templates}
            {...rest}
        />
    );
const ListView = ({
    sequences,
    templates,
    breadcrumbs,
    onNewTemplate,
    onNewSequence,
    onClickSequence,
    onClickTemplate,
}) => {
    return (
        <Viewport>
            <Breadcrumbs
                path={breadcrumbs}
                linkComponent={NonRouterLink}
                urls={['#!/reporting-relationships']}
            />
            <Toolbar flex>
                <ToolbarItem icon='plus' glyphicon right onClick={onNewTemplate}>
                    Create New Email Template
                </ToolbarItem>
                <ToolbarItem icon='plus' glyphicon right onClick={onNewSequence}>
                    Create New Email Sequence
                </ToolbarItem>
            </Toolbar>
            <ListPage>
                <TableSection heading='Email Sequences'>
                    <DataTable
                        rowKey='uid'
                        enableRowClick
                        onRowClick={onClickSequence}
                        rows={sequences}
                        isLoading={false}
                        columns={[
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                label: 'Created On',
                                key: 'created',
                                format: 'backend_date',
                            },
                            {
                                label: 'Last Updated',
                                key: 'modified',
                                format: 'backend_date',
                            },
                        ]}
                    />
                </TableSection>
                <TableSection heading='Email Templates' pt={4}>
                    <DataTable
                        rowKey='uid'
                        enableRowClick
                        onRowClick={onClickTemplate}
                        rows={templates}
                        isLoading={false}
                        columns={[
                            {
                                label: 'Name',
                                key: 'name',
                            },
                            {
                                label: 'Created On',
                                key: 'created',
                                format: 'backend_date',
                            },
                            {
                                label: 'Last Updated',
                                key: 'modified',
                                format: 'backend_date',
                            },
                        ]}
                    />
                </TableSection>
            </ListPage>
        </Viewport>
    );
};

class Emails extends Component {
    breadcrumbs = ['Data Collection', 'Email Center'];

    render() {
        const {
            templates,
            sequences,
            activeUid,
            saveTemplate,
            saveSequence,
            createNew,
            navigate,
            mode,
        } = this.props;

        const template = mode === 'template' && templates.find(t => t.uid == activeUid);
        const sequence = mode === 'sequence' && sequences.find(s => s.uid == activeUid);

        return activeUid || createNew ? (
            <EditingView
                breadcrumbs={this.breadcrumbs}
                templates={templates}
                key={activeUid}
                mode={mode}
                createNew={createNew}
                template={template}
                sequence={sequence}
                onSaveTemplate={saveTemplate}
                onSaveSequence={saveSequence}
                onCancel={() => navigate()}
            />
        ) : (
            <ListView
                breadcrumbs={this.breadcrumbs}
                templates={templates}
                sequences={sequences}
                onClickTemplate={template => navigate('template', template.uid)}
                onClickSequence={sequence => navigate('sequence', sequence.uid)}
                onNewSequence={() => navigate('sequence', 'new')}
                onNewTemplate={() => navigate('template', 'new')}
            />
        );
    }
}

export default Emails;
