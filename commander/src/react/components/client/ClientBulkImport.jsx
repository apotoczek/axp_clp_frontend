import React, {useState, useCallback} from 'react';

import config from 'config';

import Loader from 'src/libs/react/components/basic/Loader';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {Box, Flex} from '@rebass/grid';
import {H1, H3} from 'src/libs/react/components/basic/text';
import {oneLine} from 'common-tags';
import styled, {css} from 'styled-components';
import {dataThing, formPost} from 'api';

import FileUpload from 'components/upload/FileUpload';
import Button from 'src/libs/react/components/basic/forms/Button';

import Modal, {ModalContent} from 'components/basic/Modal';

import TextInput from 'components/basic/forms/input/TextInput';

const ContentWrapper = css`
    padding: 20px;
    margin: 15px;
    border-radius: 2px;
    width: 600px;
`;
const WorkbookContentWrapper = styled(Box)`
    ${ContentWrapper}
`;

const WarningContentWrapper = styled(Box)`
    ${ContentWrapper}
    background: ${({theme}) => theme.bulkImport.warningBoxBg};
`;

const DisabledDownloadButton = styled(Button)`
    background: ${({theme}) => theme.bulkImport.disabledDownloadButtonBg};
    &:hover {
        background: ${({theme}) => theme.bulkImport.disabledDownloadButtonBg};
    }
`;

const DisabledUploadButton = styled(Button)`
    background: ${({theme}) => theme.bulkImport.disabledUploadButtonBg};
    color: #000000;
    font-weight: 700;
    &:hover {
        background: ${({theme}) => theme.bulkImport.disabledUploadButtonBg};
        color: #000000;
    }
`;

const WarningText = styled.span`
    color: ${({theme}) => theme.bulkImport.warningLabelFg};
    margin: 0 0 8px;

    font-weight: 500;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
`;
function DeleteMetricDataModal({clientData, isOpen, toggleModal, handleDeleteMetrics}) {
    const [clientName, setClientName] = useState(null);
    const [deleteStr, setDeleteStr] = useState(null);

    const canDelete = () => {
        return clientName === clientData.name && deleteStr && deleteStr.toLowerCase() === 'delete';
    };
    return (
        <Modal isOpen={isOpen} openStateChanged={toggleModal}>
            <ModalContent flexDirection='column'>
                <WarningContentWrapper>
                    <H1>Erase All Metrics Data & Configurations?</H1>
                    <Box my={3}>
                        <H3>All metrics settings will be erased</H3>
                        <H3>All metric data will be erased</H3>
                        <H3>All audit trail history will be lost</H3>
                        <WarningText>THIS ACTION CANNOT BE UNDONE</WarningText>
                    </Box>
                </WarningContentWrapper>
                <Flex px={2}>
                    <TextInput
                        leftLabel='Client Name'
                        placeholder='Type here'
                        value={clientName}
                        onValueChanged={setClientName}
                    />
                    <TextInput
                        leftLabel='Type Delete'
                        placeholder='Type here'
                        value={deleteStr}
                        onValueChanged={setDeleteStr}
                    />
                    <Button danger disabled={!canDelete()} onClick={handleDeleteMetrics}>
                        Confirm Erase All
                    </Button>
                </Flex>
            </ModalContent>
        </Modal>
    );
}

function WorkbookBox({hasCompanies, handleDownloadMetricTemplate, uploadProps}) {
    return hasCompanies ? (
        <WorkbookContentWrapper>
            <Button m={3} primary onClick={handleDownloadMetricTemplate}>
                Download Metrics Setup Workbook
            </Button>
            <FileUpload {...uploadProps}>
                <Button m={3}> Upload Metrics Setup Workbook</Button>
            </FileUpload>
        </WorkbookContentWrapper>
    ) : (
        <WorkbookContentWrapper>
            <DisabledDownloadButton m={3} disabled>
                Download Metrics Setup Workbook
            </DisabledDownloadButton>
            <DisabledUploadButton m={3} disabled>
                You must upload companies and cashflows first
            </DisabledUploadButton>
        </WorkbookContentWrapper>
    );
}

function RerunWorkbookBox({clientData, handleDeleteMetrics, toggleModal, isOpen}) {
    const deleteDescription = oneLine`
        If you need to re-run the bulk inmport tool you must first
        erase all metrics data and all metrics configuration settings.
    `;
    return (
        <>
            <DeleteMetricDataModal
                clientData={clientData}
                toggleModal={toggleModal}
                isOpen={isOpen}
                handleDeleteMetrics={handleDeleteMetrics}
            />
            <WarningContentWrapper>
                <span>
                    <H3>Re-Run Bulk Import Tool</H3>
                    {deleteDescription}
                    <Box my={3}>
                        <H3>All metrics settings will be erased</H3>
                        <H3>All metric data will be erased</H3>
                        <H3>All audit trail history will be lost</H3>
                    </Box>
                </span>
                <Button mr={2} danger onClick={() => toggleModal(true)}>
                    Erase All Metrics Data & Configurations
                </Button>
            </WarningContentWrapper>
        </>
    );
}

function ClientBulkImportContainer({
    clientData,
    companies,
    metricVersions,
    handleDownloadMetricTemplate,
    handleDeleteMetrics,
    deleteModalOpen,
    setDeleteModalOpen,
    setSuccesfullUpload,
    setErrorOnUpload,
}) {
    let hasCompanies = true;
    if (companies.count === 0) {
        hasCompanies = false;
    }

    let descText = oneLine`
        Looks like you are setting up a fresh account.
        If you have already uploaded your companies & cashflows
        you can use the Metric Setup Workbook to get started.
    `;

    let hasMetricConfig = false;
    if (metricVersions.length > 0) {
        hasMetricConfig = true;
        descText = oneLine`
            It looks like you have already set up metrics.
            If something went wrong and you need to re-run the bulk import you can do that here!
        `;
    }

    return (
        <>
            {descText}
            {!hasMetricConfig ? (
                <WorkbookBox
                    hasCompanies={hasCompanies}
                    handleDownloadMetricTemplate={handleDownloadMetricTemplate}
                    uploadProps={{
                        endpoint: 'commander/upload_metric_creation_template',
                        onSuccess: () => {
                            dataThing.statusCheck();
                            setSuccesfullUpload(true);
                        },
                        onError: ({response}) => {
                            setErrorOnUpload(response.data.body);
                        },
                        formData: {
                            client_uid: clientData.uid,
                        },
                    }}
                />
            ) : (
                <RerunWorkbookBox
                    clientData={clientData}
                    handleDeleteMetrics={handleDeleteMetrics}
                    isOpen={deleteModalOpen}
                    toggleModal={setDeleteModalOpen}
                />
            )}
        </>
    );
}

export default function ClientBulkImport({clientData = {}}) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [succesfulUpload, setSuccesfullUpload] = useState(false);
    const [errorOnUpload, setErrorOnUpload] = useState(null);

    const {data: metricVersions, isLoading: metricVersionsLoading} = useBackendData(
        'commander/list_metric_versions_for_client',
        {client_uid: clientData.uid},
        {triggerConditional: params => params.client_uid},
    );

    const {data: companies, isLoading: companiesLoading} = useBackendData(
        'commander/companies_for_client',
        {client_uid: clientData.uid},
        {triggerConditional: params => params.client_uid},
    );

    const {isLoading: isDeleting, triggerEndpoint: deleteMetricData} = useBackendEndpoint(
        'commander/delete_all_metric_data_for_client',
        {
            statusCheck: true,
            action: true,
        },
    );

    const handleDeleteMetrics = useCallback(() => {
        deleteMetricData({
            client_uid: clientData.uid,
        }).then(() => setDeleteModalOpen(false));
    }, [deleteMetricData, clientData.uid]);

    const {isLoading: isDownloading, triggerEndpoint: downloadMetricTemplate} = useBackendEndpoint(
        'commander/download_metric_creation_template',
        {
            statusCheck: true,
            action: true,
        },
    );

    const handleDownloadMetricTemplate = useCallback(() => {
        downloadMetricTemplate({
            client_uid: clientData.uid,
        }).then(({key}) => formPost(`${config.download_file_base + key}`));
    }, [downloadMetricTemplate, clientData.uid]);

    if (metricVersionsLoading || companiesLoading || isDeleting || isDownloading) {
        return <Loader />;
    }

    const headerComponent = (
        <Box flex={1}>
            <H1>{clientData.name}</H1>
        </Box>
    );

    if (succesfulUpload) {
        return (
            <>
                {headerComponent}
                <WorkbookContentWrapper>
                    <H3>Workbook imported successfully!</H3>
                </WorkbookContentWrapper>
            </>
        );
    }

    if (errorOnUpload) {
        return (
            <>
                {headerComponent}
                <WarningContentWrapper>
                    <div>
                        There was an errror processing your workbook.
                        {` ${errorOnUpload}`}
                    </div>
                    <Button onClick={() => setErrorOnUpload(null)}>Try again!</Button>
                </WarningContentWrapper>
            </>
        );
    }

    return (
        <>
            {headerComponent}
            <ClientBulkImportContainer
                clientData={clientData}
                companies={companies}
                metricVersions={metricVersions}
                handleDownloadMetricTemplate={handleDownloadMetricTemplate}
                handleDeleteMetrics={handleDeleteMetrics}
                deleteModalOpen={deleteModalOpen}
                setDeleteModalOpen={setDeleteModalOpen}
                setSuccesfullUpload={setSuccesfullUpload}
                setErrorOnUpload={setErrorOnUpload}
            />
        </>
    );
}
