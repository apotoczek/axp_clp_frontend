import React, {useState} from 'react';
import styled from 'styled-components';

import {Flex, Box} from '@rebass/grid';

import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';

import {H1, H2, Bold, Description} from 'components/basic/text';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import DataTable from 'components/basic/DataTable';
import {contextMenuCellRenderer, DotsCell} from 'components/basic/DataTable/cellRenderers';
import Modal, {ModalContent, ModalHeader} from 'components/basic/Modal';
import Button from 'components/basic/forms/Button';
import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';

import {LightTheme} from 'themes';

import {Viewport, Page} from 'components/layout';
import {EditingPage, EditingSection, ListPage, TableSection} from 'components/reporting/shared';
import MetaDataTable from 'components/reporting/MetaDataTable';
import DataTemplateForm, {SupportingDocumentsTable} from 'components/reporting/DataTemplateForm';

import {is_set} from 'src/libs/Utils';
import {format_array} from 'src/libs/Formatters';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Loader from 'components/basic/Loader';
import {MetricVersionType} from 'src/libs/Enums';
import TextBlock from 'components/basic/TextBlock';

const toMeta = specs => {
    return specs.map(m => ({
        label: m.label,
        values: m.fields
            .map(f => {
                return {
                    label: f.label,
                    value: f.description,
                };
            })
            .filter(m => m !== null),
    }));
};

const VersionWrapper = styled(Box)`
    min-width: 450px;
    width: 500px;
`;

const MetricWrapper = styled(Flex)`
    overflow-x: auto;
    overflow-y: visible;
`;

const Well = styled(Box)`
    padding: 10px;
    border: 1px solid #566174;
    border-radius: 3px;
`;

const Label = styled(Box)`
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    color: #a4a4a4;
`;

const Value = styled(Box)`
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 1px;
    color: #000000;
`;

const Help = styled(Box)`
    padding: 10px;
`;

const StyledTextBlock = styled(TextBlock)`
    .quill {
        padding: 5px;

        background-color: #f8f8f8;
        border-radius: 3px;

        border: 1px solid #888888;
    }
`;

const SheetSettings = ({versionType, sheet}) =>
    versionType == MetricVersionType.Backward ? (
        <div>
            <Label mb={2}>Collect</Label>
            <Value>{sheet.collectMonths} months</Value>
            <Label mb={2} mt={3}>
                Historical Data
            </Label>
            <Value>{sheet.backfillMonths} months</Value>
        </div>
    ) : (
        <div>
            <Label mb={2}>Forecast Forward</Label>
            <Value>{sheet.collectMonths} months</Value>
            <Label mb={2} mt={3}>
                Historical Forecast
            </Label>
            <Value>None</Value>
        </div>
    );

function ShowView({template, breadcrumbs, options, onEdit, onPreview, navigate}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [inUseModalOpen, setInUseModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);

    const toggleDeleteModal = () => {
        setModalItem(template);
        setDeleteModalOpen(s => !s);
    };

    const toggleInUseModal = () => {
        setInUseModalOpen(s => !s);
    };

    return (
        <Viewport>
            <Breadcrumbs
                path={breadcrumbs.concat([template.name])}
                urls={['#!/reporting-relationships', '#!/reporting-templates']}
                linkComponent={NonRouterLink}
            />
            <Toolbar flex>
                <ToolbarItem onClick={onEdit} icon='edit' glyphicon right>
                    Edit
                </ToolbarItem>
                <ToolbarItem onClick={toggleDeleteModal} icon='trash' glyphicon right>
                    Delete
                </ToolbarItem>
                <ToolbarItem onClick={onPreview} glyphicon icon='search' right>
                    Download Preview
                </ToolbarItem>
            </Toolbar>
            <LightTheme>
                <Page>
                    <Box p={4} width={1}>
                        <Box px={2} pb={4}>
                            <H1>{template.name}</H1>
                        </Box>
                        <MetricWrapper>
                            {template.sheets.map(sheet => (
                                <VersionWrapper key={sheet.uid} pb={4} px={1}>
                                    <Box px={2} pb={1}>
                                        <H2>{sheet.metricVersion.name}</H2>
                                    </Box>
                                    <Well mb={2}>
                                        <SheetSettings
                                            versionType={sheet.metricVersion.versionType}
                                            sheet={sheet}
                                            options={options}
                                        />
                                    </Well>
                                    <DataTable
                                        rowKey='uid'
                                        pushHeight
                                        enableSorting={false}
                                        enableColumnToggle={false}
                                        rows={sheet.metrics}
                                        columns={[
                                            {
                                                label: 'Metric',
                                                key: 'metric:name',
                                            },
                                            {
                                                label: 'Required',
                                                key: 'required',
                                                formatter: ({cellData}) =>
                                                    cellData ? 'Yes' : 'No',
                                                right: true,
                                            },
                                        ]}
                                    />
                                </VersionWrapper>
                            ))}
                        </MetricWrapper>
                        {template.includedTextData.length ? (
                            <Box width={1} pb={4} px={1}>
                                <Box px={2} pb={1}>
                                    <H2>Additional Information</H2>
                                </Box>
                                <MetaDataTable metaData={toMeta(template.includedTextData)} />
                            </Box>
                        ) : null}
                        {template.instructions && (
                            <Box width={1} pb={4} px={1}>
                                <Box px={2} pb={1}>
                                    <H2>Instructions</H2>
                                </Box>
                                <StyledTextBlock text={template.instructions} />
                            </Box>
                        )}
                        {template?.enableSupportingDocuments &&
                            template?.supportingDocuments?.length > 0 && (
                                <Box width={1} pb={4} px={1}>
                                    <Box px={2} pb={1}>
                                        <H2>Supporting Documents</H2>
                                    </Box>
                                    <SupportingDocumentsTable
                                        supportingDocuments={template.supportingDocuments}
                                    />
                                </Box>
                            )}
                    </Box>
                </Page>
                <DataTemplateDeleteModal
                    templateData={modalItem}
                    isOpen={deleteModalOpen}
                    toggleModal={toggleDeleteModal}
                    toggleInUseModal={toggleInUseModal}
                    navigate={navigate}
                />
                <DataTemplateInUseModal
                    templateData={modalItem}
                    isOpen={inUseModalOpen}
                    toggleModal={toggleInUseModal}
                />
                ;
            </LightTheme>
        </Viewport>
    );
}

class EditingView extends React.Component {
    state = {
        template: this.props.template,
        errors: {},
    };

    handleValueChanged = (key, value) => {
        const {template} = this.state;

        this.setState({template: {...template, [key]: value}});
    };

    validate = template => {
        const errors = {};

        if (!is_set(template.name, true)) {
            errors.name = 'You have to enter a name for your template';
        }

        if (!is_set(template.sheets, true)) {
            errors.sheets = 'The template has to include at least one version';
        }

        for (const {metrics} of template.sheets) {
            if (!is_set(metrics, true)) {
                errors.sheets = 'Each version has to include at least one metric.';
                break;
            }
        }

        // if(!is_set(template.frequency)) {
        //     errors.frequency = 'Please select a time frame';
        // }

        // if(!is_set(template.timeFrame)) {
        //     errors.timeFrame = 'Please select a reporting period';
        // }

        // if(!is_set(template.metrics) || template.metrics.length === 0) {
        //     errors.metrics = 'You have to add at least one metric';
        // }

        return errors;
    };

    handleSave = () => {
        const {onSave} = this.props;
        const {template} = this.state;

        const errors = this.validate(template);

        if (is_set(errors, true)) {
            this.setState({
                errors,
            });

            return;
        }

        onSave(template);
    };

    handleCancel = () => {
        const {onCancel} = this.props;

        onCancel();
    };

    render() {
        const {template, errors} = this.state;
        const {options, breadcrumbs, template: staticTemplate} = this.props;

        const createNew = staticTemplate.name === '';

        const path = createNew
            ? breadcrumbs.concat(['Create'])
            : breadcrumbs.concat([staticTemplate.name, 'Edit']);
        const urls = ['#!/reporting-relationships', '#!/reporting-templates'];

        if (!createNew) {
            urls.push(`#!/reporting-templates/${staticTemplate.uid}`);
        }

        return (
            <Viewport>
                <Breadcrumbs path={path} urls={urls} linkComponent={NonRouterLink} />
                <Toolbar flex>
                    <ToolbarItem onClick={this.handleCancel} icon='cancel' glyphicon right>
                        Cancel
                    </ToolbarItem>
                    <ToolbarItem onClick={this.handleSave} icon='save' glyphicon right>
                        Save Data Template
                    </ToolbarItem>
                </Toolbar>
                <EditingPage>
                    <EditingSection
                        heading={createNew ? 'Create Data Template' : 'Edit Data Template'}
                        description=''
                    >
                        <Help maxWidth={695} mb={2}>
                            A Data Template is the spreadsheet your client completes to fulfill your
                            data request. The Data Templates can be customized based on your needs,
                            and can be reused for multiple data requests, across different
                            companies.
                        </Help>
                        <DataTemplateForm
                            onValueChanged={this.handleValueChanged}
                            values={template}
                            errors={errors}
                            options={options}
                        />
                    </EditingSection>
                </EditingPage>
            </Viewport>
        );
    }
}

function DataTemplateInUseModal({isOpen, toggleModal, templateData}) {
    const {
        data: {results: inUseByRequests = []},
    } = useBackendData(
        'reporting/template-in-use',
        {
            template_uid: templateData?.uid,
        },
        {requiredParams: ['template_uid']},
    );

    return (
        <LightTheme>
            <Modal isOpen={isOpen} openStateChanged={toggleModal}>
                <ModalContent flexDirection='column' style={{maxWidth: '800px'}}>
                    <ModalHeader py={3}>
                        <H1>Error - Data Template in Use</H1>
                    </ModalHeader>
                    <Box mt={2}>
                        <Description>
                            Data Template <Bold>{templateData?.name}</Bold> cannot be deleted as
                            it&apos;s being used in the following Data Requests:
                        </Description>
                    </Box>
                    <Box my={3}>
                        <DataTable
                            pushHeight
                            enableColumnToggle={false}
                            enableSorting={false}
                            columns={[
                                {label: 'Data Request', key: 'mandate_name'},
                                {
                                    label: 'Company',
                                    key: 'company_name',
                                    link: 'reporting-relationships/<relationship_uid>',
                                },
                            ]}
                            rowKey='relationship_uid'
                            rows={inUseByRequests || []}
                        />
                    </Box>
                    <Flex my={3} justifyContent='flex-end'>
                        <Button mr={1} onClick={toggleModal}>
                            Cancel
                        </Button>
                    </Flex>
                </ModalContent>
            </Modal>
        </LightTheme>
    );
}

function DataTemplateDeleteModal({isOpen, toggleModal, templateData, navigate, toggleInUseModal}) {
    const {triggerEndpoint: deleteTemplate} = useBackendEndpoint(
        'reporting/actions/delete-template',
    );

    const handleDeleteTemplate = templateData => {
        deleteTemplate({
            template_uid: templateData.uid,
        })
            .then(() => {
                navigate();
            })
            .catch(() => {
                toggleInUseModal();
            });
    };

    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column' style={{maxWidth: '600px'}}>
                <ModalHeader>
                    <H1>Confirm delete</H1>
                </ModalHeader>
                <Box mt={2}>
                    <Description>
                        Are you sure you want to delete this data template? This action cannot be
                        undone.
                    </Description>
                    <Box my={3}>
                        <DataTable
                            pushHeight
                            enableHeaderRow={false}
                            enableColumnToggle={false}
                            columns={[{key: 'name'}]}
                            rowKey='uid'
                            rows={templateData ? [templateData] : []}
                        />
                    </Box>
                    <Flex my={3} justifyContent='flex-end'>
                        <Button mr={1} onClick={toggleModal}>
                            Cancel
                        </Button>
                        <Button
                            danger
                            onClick={() => {
                                handleDeleteTemplate(templateData);
                                toggleModal(templateData);
                            }}
                        >
                            Delete
                        </Button>
                    </Flex>
                </Box>
            </ModalContent>
        </Modal>
    );
}

function ListViewOptionsCell(onEdit, onDuplicate, onDelete, {cellData, columnData, rowData}) {
    const renderer = contextMenuCellRenderer(
        ({rowData}) => [
            {
                key: 'edit',
                label: 'Edit',
                onClick: onEdit.bind(null, rowData),
            },
            {
                key: 'duplicate',
                label: 'Duplicate',
                onClick: onDuplicate.bind(null, rowData),
            },
            {
                key: 'delete',
                label: 'Delete',
                onClick: onDelete.bind(null, rowData),
            },
        ],
        DotsCell,
    );
    return renderer({cellData, columnData, rowData});
}

function ListView({
    templates,
    onItemClick,
    onNewTemplate,
    onEdit,
    onDuplicate,
    breadcrumbs,
    navigate,
}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [inUseModalOpen, setInUseModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);

    const toggleDeleteModal = rowData => {
        setModalItem(rowData);
        setDeleteModalOpen(s => !s);
    };

    const toggleInUseModal = () => {
        setInUseModalOpen(s => !s);
    };

    return (
        <Viewport>
            <Breadcrumbs
                path={breadcrumbs}
                urls={['#!/reporting-relationships']}
                linkComponent={NonRouterLink}
            />
            <Toolbar flex>
                <ToolbarItem icon='plus' glyphicon right onClick={onNewTemplate}>
                    Create New Data Template
                </ToolbarItem>
            </Toolbar>
            <ListPage>
                <TableSection heading='Data Templates'>
                    <DataTable
                        rowKey='uid'
                        enableRowClick
                        onRowClick={onItemClick}
                        rows={templates}
                        isLoading={false}
                        columns={[
                            {
                                label: 'Name',
                                key: 'name',
                                flexGrow: 1,
                                width: 200,
                            },
                            {
                                label: 'Sheets',
                                key: 'sheetNames',
                                flexGrow: 1,
                                width: 200,
                                formatter: ({cellData}) => format_array(cellData, 3, 'other'),
                            },
                            {
                                key: 'actions',
                                disableSort: true,
                                right: true,
                                flexShrink: 1,
                                width: 40,
                                cellRenderer: ListViewOptionsCell.bind(
                                    null,
                                    onEdit,
                                    onDuplicate,
                                    toggleDeleteModal,
                                ),
                            },
                        ]}
                    />
                </TableSection>
            </ListPage>
            <DataTemplateDeleteModal
                templateData={modalItem}
                isOpen={deleteModalOpen}
                toggleModal={toggleDeleteModal}
                toggleInUseModal={toggleInUseModal}
                navigate={navigate}
            />
            <DataTemplateInUseModal
                templateData={modalItem}
                isOpen={inUseModalOpen}
                toggleModal={toggleInUseModal}
            />
            ;
        </Viewport>
    );
}

class DataTemplates extends React.Component {
    breadcrumbs = ['Data Collection', 'Data Templates'];

    render() {
        const {
            isLoading,
            templates,
            navigate,
            edit,
            templateUid,
            saveTemplate,
            duplicateTemplate,
            previewTemplate,
            options,
        } = this.props;

        if (isLoading) {
            return <Loader />;
        }

        const defaults = {
            name: '',
            sheets: [],
            includedTextData: [],
            enableSupportingDocuments: false,
            supportingDocuments: [],
        };

        const template = templates.find(m => m.uid == templateUid) || defaults;

        if (edit) {
            return (
                <EditingView
                    key={templateUid}
                    template={template}
                    options={options}
                    onSave={saveTemplate}
                    onCancel={() => (templateUid === 'new' ? navigate() : navigate(templateUid))}
                    breadcrumbs={this.breadcrumbs}
                />
            );
        }

        if (templateUid) {
            return (
                <ShowView
                    key={templateUid}
                    template={template}
                    options={options}
                    onEdit={() => navigate(templateUid, true)}
                    onPreview={() => previewTemplate(templateUid)}
                    breadcrumbs={this.breadcrumbs}
                    navigate={navigate}
                />
            );
        }

        return (
            <ListView
                templates={templates}
                options={options}
                onNewTemplate={() => navigate('new')}
                onItemClick={item => navigate(item.uid)}
                onEdit={item => navigate(`${item.uid}/edit`)}
                onDuplicate={item => duplicateTemplate(item.uid)}
                breadcrumbs={this.breadcrumbs}
                navigate={navigate}
            />
        );
    }
}

export default DragDropContext(HTML5Backend)(DataTemplates);
