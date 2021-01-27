import React, {useState} from 'react';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';

import {dataThing} from 'api';

import DataTable from 'components/basic/DataTable';
import InfoBox from 'components/InfoBox';

import FileUpload from 'components/upload/FileUpload';

import {H1, H2, Description} from 'components/basic/text';
import Button from 'components/basic/forms/Button';
import Icon from 'components/basic/Icon';
import Loader from 'components/basic/Loader';
import {useBackendData} from 'utils/backendConnect';

import {UploadStep, formatRequestStatus} from 'components/reporting/shared';

import ReportingDataViewer from 'components/reporting/ReportingDataViewer';
import MetricTable from 'components/basic/MetricTable';
import {mapped_details, mapped_sheet, sheet_of_supporting_documents} from 'src/helpers/reporting';

const A = styled.a`
    cursor: pointer;
`;
const RelativeDiv = styled.div`
    position: relative;
`;

const UploadedFile = styled.span`
    color: ${({theme}) => theme.reportingDataUpload.uploadedFileFg};
`;

const RequestedFileContainer = styled(Flex)`
    padding: 6px 6px 6px 15px;
    background-color: ${({error, theme}) =>
        error
            ? theme.reportingDataUpload.requestedFileErrorBg
            : theme.reportingDataUpload.requestedFileBg};
    border: 1px solid ${({theme}) => theme.reportingDataUpload.requestedFileBorder};
    border-radius: 3px;
`;
const RequestedFileLabel = styled(Box)`
    line-height: 35px;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.86px;
    display: inline-block;
`;
const RequestedFileDescription = styled(Box)`
    display: inline-block;
    font-size: 12px;
    letter-spacing: 0.86px;
    font-style: italic;
    color: ${({theme}) => theme.reportingDataUpload.requestedFileDescriptionFg};
`;
const RequestedFileRightLabel = styled(Box)`
    float: right;
    display: inline-block;
    padding: 8px;
`;
const RequiredFilesHeading = styled(H2)`
    margin-top: 16px;
`;

function RequestedFile({description, error, name, rightLabel, uploadProps, uploadButton}) {
    return (
        <RequestedFileContainer mt={3} error={error}>
            <Box flex={1}>
                <RequestedFileLabel mr={2}>{name}</RequestedFileLabel>

                <RequestedFileDescription mr={2}>{description}</RequestedFileDescription>

                <RequestedFileRightLabel mr={2}>{rightLabel}</RequestedFileRightLabel>
            </Box>

            <FileUpload
                loader={
                    <Button disabled>
                        Uploading
                        <Icon mx={2} glyphicon name='cog' className='animate-spin' />
                    </Button>
                }
                {...uploadProps}
            >
                {uploadButton}
            </FileUpload>
        </RequestedFileContainer>
    );
}

function MetricError({spreadsheet}) {
    const error = spreadsheet?.result?.reason;
    switch (error) {
        case 'missing_metrics':
            return (
                <RelativeDiv>
                    <InfoBox error m={0}>
                        <H2>Missing required metrics</H2>
                        <Box>
                            You have uploaded a data template with missing metric values at some
                            dates. Discard the template and make sure all dates and values are
                            filled out.
                        </Box>
                    </InfoBox>
                </RelativeDiv>
            );
        case 'invalid_as_of':
            return (
                <RelativeDiv>
                    <InfoBox error>
                        <H2>Invalid as of date</H2>
                        <Box>
                            You have uploaded a template with the wrong as of date. Discard and
                            upload the correct template to continue
                        </Box>
                    </InfoBox>
                </RelativeDiv>
            );
        default:
            return null;
    }
}

function ListView({requests, onClickRequest}) {
    return (
        <DataTable
            label='Pending Requests'
            rowKey='uid'
            rows={requests}
            enableRowClick
            enableContextHeader
            onRowClick={onClickRequest}
            defaultHiddenColumns={['requested_by:name']}
            columns={[
                {
                    label: 'Status',
                    key: 'status_text',
                    formatter: ({cellData, rowData}) =>
                        formatRequestStatus(cellData, rowData.state),
                    width: 250,
                },
                {
                    label: 'Manager',
                    key: 'relationship:recipient_name',
                    width: 200,
                    flexGrow: 1,
                    flexShrink: 0,
                },
                {
                    label: 'Requested By',
                    key: 'requested_by:name',
                    width: 150,
                },
                {
                    label: 'Template',
                    key: 'template:name',
                    width: 150,
                },
                {
                    label: 'As of date',
                    key: 'as_of_date',
                    format: 'backend_date',
                    width: 100,
                    right: true,
                },
                {
                    label: 'Due date',
                    key: 'due_date',
                    format: 'backend_date',
                    width: 100,
                    right: true,
                },
                {
                    label: 'Submitted',
                    key: 'latest_submission:created',
                    format: 'backend_local_datetime',
                    width: 200,
                    right: true,
                },
                {
                    label: 'Submitted By',
                    key: 'latest_submission:sent_by:name',
                    width: 150,
                },
            ]}
        />
    );
}

function UploadView({
    activeRequest,
    downloadTemplate: _downloadTemplate,
    uploads,
    discardUpload,
    cancelUpload,
    openReview,
}) {
    const [lastDiscarded, setLastDiscarded] = useState(undefined);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);

    const currentUpload = uploads.find(v => v.data_request_uid === activeRequest?.uid);
    const discardMetrics = uid => {
        setLastDiscarded(uid);
        discardUpload(uid);
    };
    const downloadTemplate = () => {
        setDownloadingTemplate(true);
        return _downloadTemplate(activeRequest.uid)
            .then(() => setDownloadingTemplate(false))
            .catch(() => setDownloadingTemplate(false));
    };

    const {data: spreadsheet} = useBackendData(
        'reporting/uploaded/details',
        {uid: currentUpload?.uid},
        {
            // Workaround to make sure we don't re-request an invalidated upload we've already discarded
            triggerConditional: () => currentUpload && currentUpload?.uid !== lastDiscarded,
            deps: [currentUpload?.uid],
        },
    );

    const validSubmitState =
        currentUpload &&
        currentUpload?.uid !== lastDiscarded &&
        !spreadsheet?.result?.reason &&
        activeRequest?.supporting_documents?.every(v => v.uploaded);
    return (
        <Box p={4}>
            <MetricError spreadsheet={spreadsheet} />
            <H1>Upload Data</H1>
            <Description mb={3}>Upload your Data Template and any required documents.</Description>

            <RequiredFilesHeading>
                Required Files ( {1 + (activeRequest?.supporting_documents?.length ?? 0)} )
            </RequiredFilesHeading>

            <RequestedFile
                name='Data Collection Template'
                error={spreadsheet?.result?.eligible === false}
                rightLabel={
                    currentUpload ? (
                        <UploadedFile>{currentUpload.file_name}</UploadedFile>
                    ) : (
                        <A onClick={downloadTemplate}>
                            {downloadingTemplate ? (
                                <Icon mx={2} glyphicon name='cog' className='animate-spin' />
                            ) : (
                                <Icon mx={2} glyphicon name='download-alt' />
                            )}
                            Download Template
                        </A>
                    )
                }
                uploadProps={{
                    endpoint: '/reporting/actions/upload-spreadsheet',
                    onSuccess: () => {
                        dataThing.statusCheck();
                    },
                    formData: {
                        data_request_uid: activeRequest.uid,
                    },
                }}
                uploadButton={
                    currentUpload ? (
                        <Button
                            onClick={e => {
                                discardMetrics(currentUpload.uid);
                                e.stopPropagation();
                            }}
                        >
                            Discard
                        </Button>
                    ) : (
                        <Button>Choose File</Button>
                    )
                }
            />

            {activeRequest?.supporting_documents?.map(doc => (
                <RequestedFile
                    key={doc.supporting_document_uid}
                    currentFile={doc.uploaded ? doc : undefined}
                    request={activeRequest}
                    name={doc.name}
                    description={doc.description}
                    rightLabel={<UploadedFile>{doc.file_name}</UploadedFile>}
                    uploadProps={{
                        endpoint: '/reporting/actions/upload-supporting-document',
                        onSuccess: () => {
                            dataThing.statusCheck();
                        },
                        formData: {
                            data_request_uid: activeRequest.uid,
                            supporting_document_uid: doc.supporting_document_uid,
                        },
                    }}
                    uploadButton={
                        doc.uploaded ? <Button>Replace File</Button> : <Button>Choose File</Button>
                    }
                />
            ))}

            <Flex py={3} justifyContent='flex-end'>
                <Button flex={0} onClick={cancelUpload}>
                    Cancel
                </Button>
                <Button flex={0} ml={2} primary disabled={!validSubmitState} onClick={openReview}>
                    Review Files
                </Button>
            </Flex>
        </Box>
    );
}

function ReviewView({
    activeRequest,
    uploads,
    discardUpload,
    cancelUpload,
    submitReport,
    submitted,
}) {
    const currentUpload = uploads.find(v => v.data_request_uid === activeRequest?.uid);
    const discardAll = () => {
        discardUpload(
            currentUpload.uid,
            activeRequest.supporting_documents.filter(v => v.uploaded).map(v => v.uid),
        );
        cancelUpload();
    };

    const submitAll = () => {
        submitReport(
            currentUpload.uid,
            activeRequest.supporting_documents.filter(v => v.uploaded).map(v => v.uid),
        );
    };

    const {data: spreadsheet, isLoading: isSpreadsheetLoading} = useBackendData(
        'reporting/uploaded/details',
        {uid: currentUpload?.uid},
        {
            triggerConditional: () => currentUpload?.uid,
            deps: [currentUpload?.uid],
        },
    );

    let sheets = (spreadsheet?.result && mapped_details(spreadsheet)?.sheets) ?? [];
    if (activeRequest.supporting_documents?.length) {
        sheets = [...sheets, sheet_of_supporting_documents(activeRequest.supporting_documents)];
    }

    return (
        <Flex p={4} flexDirection='column' height='100%'>
            <H1>Review Data Submission</H1>
            <MetricTable
                rows={[
                    {label: 'Status', value: spreadsheet?.status_label, key: 'status'},
                    {label: 'Uploaded By', value: spreadsheet?.user?.name, key: 'uploaded_by'},
                    {
                        label: 'Upload Date',
                        value: spreadsheet?.created,
                        key: 'uploaded_by',
                        format: 'backend_date',
                    },
                ]}
                numColumns={3}
            />

            {!isSpreadsheetLoading && sheets?.length ? (
                <ReportingDataViewer tabs={sheets} mt={3} flex={1} />
            ) : null}

            {!isSpreadsheetLoading && !sheets?.length && (
                <Flex width={1} flex={1} justifyContent='center' alignItems='center'>
                    <H2>Old submissions cannot be viewed at this time</H2>{' '}
                </Flex>
            )}

            <Flex py={3} justifyContent='flex-end'>
                {submitted ? (
                    <Button onClick={cancelUpload}>Go Back</Button>
                ) : (
                    <>
                        <Button mr={2} danger onClick={discardAll}>
                            Discard All Tabs
                        </Button>
                        <Button mr={2} primary onClick={submitAll}>
                            Submit All Tabs
                        </Button>
                        <Button onClick={cancelUpload}>Save As Draft</Button>
                    </>
                )}{' '}
            </Flex>
        </Flex>
    );
}

function ViewSubmission({activeSubmissionUid, exit}) {
    const {data, isLoading: _loading, hasTriggered, isInvalidated} = useBackendData(
        'reporting/get-submission-data',
        {submission_uid: activeSubmissionUid},
        {requiredParams: ['submission_uid']},
    );
    const isLoading = _loading || !hasTriggered || isInvalidated;

    if (isLoading) {
        return <Loader />;
    }

    const sheets = (data.sheets ?? []).map(mapped_sheet);
    if (data.supporting_documents?.length) {
        sheets.push(sheet_of_supporting_documents(data.supporting_documents));
    }

    return (
        <Flex p={4} flexDirection='column' height='100%'>
            <H1>View Data Submission</H1>
            <MetricTable
                rows={[
                    {label: 'Status', value: data?.submission?.status_text, key: 'status'},
                    {
                        label: 'Submitted By',
                        value: data?.submission?.sent_by?.name,
                        key: 'submitted_by',
                    },
                    {
                        label: 'Submission Date',
                        value: data?.submission?.created,
                        key: 'submit_date',
                        format: 'backend_date',
                    },
                ]}
                numColumns={3}
            />

            {!isLoading && !!sheets.length && <ReportingDataViewer tabs={sheets} mt={3} flex={1} />}

            {!isLoading && !sheets && (
                <Flex width={1} flex={1} justifyContent='center' alignItems='center'>
                    <H2>Old submissions cannot be viewed at this time</H2>
                </Flex>
            )}

            <Flex py={3} justifyContent='flex-end'>
                <Button onClick={exit}>Go Back</Button>
            </Flex>
        </Flex>
    );
}

export function DataRequests({
    requests,
    uploads,
    activeRequest,
    activeStep,
    activeSubmissionUid,
    downloadTemplate,
    submitReport,
    discardUpload,
    onClickRequest,
    cancelUpload,
}) {
    const [reviewing, setReviewing] = useState(false);
    const cancel = () => {
        cancelUpload();
        setReviewing(false);
    };

    let activeComponent;
    if (activeStep === UploadStep.Upload) {
        if (reviewing) {
            activeComponent = (
                <ReviewView
                    discardUpload={discardUpload}
                    activeRequest={activeRequest}
                    downloadTemplate={downloadTemplate}
                    uploads={uploads}
                    cancelUpload={cancel}
                    submitReport={submitReport}
                />
            );
        } else {
            activeComponent = (
                <UploadView
                    discardUpload={discardUpload}
                    activeRequest={activeRequest}
                    downloadTemplate={downloadTemplate}
                    uploads={uploads}
                    cancelUpload={cancel}
                    openReview={() => setReviewing(true)}
                />
            );
        }
    } else if (activeStep === UploadStep.ViewSubmission) {
        activeComponent = (
            <ViewSubmission activeSubmissionUid={activeSubmissionUid} exit={cancelUpload} />
        );
    } else if (!activeStep) {
        activeComponent = <ListView requests={requests} onClickRequest={onClickRequest} />;
    }

    return activeComponent;
}

export default DataRequests;
