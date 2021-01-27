import React, {useState, useCallback, useEffect} from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';

import {ReportingMeta, SubmissionStatus, genRequestDefaults} from 'components/reporting/shared';

import Button from 'components/basic/forms/Button';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';
import MetricTable from 'components/basic/MetricTable';

import TextField from 'components/basic/forms/input/TextField';
import {H1, H2} from 'components/basic/text';
import {is_set, date_to_epoch} from 'src/libs/Utils';
import ReportingDataViewer from 'components/reporting/ReportingDataViewer';
import Loader from 'components/basic/Loader';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import {mapped_sheet, sheet_of_supporting_documents} from 'src/helpers/reporting';
import {backend_date} from 'src/libs/Formatters';

const RemainingSheetsNotice = styled(Box)`
    background-color: ${({theme}) => theme.dataCollectionReviewRemainingSheetsBg};
    & > a {
        cursor: pointer;
        float: right;
    }
`;
const to_epoch = d => (d ? date_to_epoch(d) : null);

const ReviewContent = ({request, submission, sheets, onClose, onApprove, onReject}) => {
    const [viewedSheets, setViewedSheets] = useState({0: true});
    const viewSheet = idx => setViewedSheets({...viewedSheets, [idx]: true});

    useEffect(() => {
        setViewedSheets({0: true});
    }, [submission]);

    const isPending = submission.status === SubmissionStatus.Pending;
    const isApproved = submission.status === SubmissionStatus.Approved;
    const isRejected = submission.status === SubmissionStatus.Rejected;

    const hasSheets = sheets && sheets.length;

    // We add -1 if the user skips the check that they've viewed all sheets
    const remainingSheetsToReview =
        viewedSheets[-1] || !hasSheets
            ? 0
            : Math.max(0, sheets.length - Object.keys(viewedSheets).length);

    return (
        <>
            <Box width={2 / 3}>
                <H1>Review Submission</H1>
                <H2>For {request.relationship.company_name}</H2>
            </Box>
            <Box my={3}>
                <MetricTable
                    rows={[
                        {label: 'Status', value: submission.status_text, key: 'status'},
                        {
                            label: 'Submitted By',
                            value: submission.sent_by.name,
                            key: 'submitted_by',
                        },
                        {
                            label: 'Submission Date',
                            value: submission.created,
                            key: 'submit_date',
                            format: 'backend_date',
                        },
                    ]}
                    numColumns={3}
                />
            </Box>
            {hasSheets && <ReportingDataViewer tabs={sheets} onSetActiveSheet={viewSheet} />}
            {!hasSheets && (
                <Flex width={1} flex={1} justifyContent='center' alignItems='center'>
                    <H2>Old submissions cannot be viewed at this time</H2>
                </Flex>
            )}

            <Flex py={3} flexWrap='nowrap' justifyContent='flex-end'>
                {isPending && (
                    <Box m={1}>
                        <ConfirmDropdown
                            disabled={!!remainingSheetsToReview}
                            onConfirm={onApprove}
                            text='Are you sure you want to approve this submission?'
                            subText='This action cannot be undone.'
                        >
                            <Button primary disabled={!!remainingSheetsToReview}>
                                Approve All Tabs
                            </Button>
                        </ConfirmDropdown>
                    </Box>
                )}
                {isPending && (
                    <Box m={1}>
                        <Button danger onClick={onReject}>
                            Request Changes
                        </Button>
                    </Box>
                )}
                {isApproved && (
                    <Box m={1}>
                        <Button primary disabled>
                            Approved
                        </Button>
                    </Box>
                )}
                {isRejected && (
                    <Box m={1}>
                        <Button danger disabled>
                            Changes Requested
                        </Button>
                    </Box>
                )}
                <Box m={1}>
                    <Button onClick={onClose}>Go Back</Button>
                </Box>
            </Flex>

            {isPending && (
                <Flex flexWrap='nowrap' justifyContent='flex-end'>
                    {!!remainingSheetsToReview && (
                        <RemainingSheetsNotice width={1 / 2} p={2}>
                            You have {remainingSheetsToReview} more tab
                            {remainingSheetsToReview > 1 ? 's' : ''} to review
                            <a onClick={() => viewSheet(-1)}>Skip</a>
                        </RemainingSheetsNotice>
                    )}
                </Flex>
            )}
        </>
    );
};

const RejectForm = ({
    request,
    submission,
    onCancel,
    onSubmit,
    values,
    onValueChanged,
    errors,
    templates,
}) => {
    return (
        <>
            <Box width={1} pb={2} mb={3}>
                <Box width={2 / 3}>
                    <H1>Request Changes</H1>
                    <H2>From {request.relationship.company_name}</H2>
                </Box>
            </Box>
            <Flex flexWrap='wrap' mb={2}>
                <Box width={1 / 2} p={1}>
                    <FilterableDropdownList
                        label='Data Template'
                        valueKey='uid'
                        labelKey='name'
                        value={values.templateUid}
                        options={templates}
                        onValueChanged={value => onValueChanged('templateUid', value)}
                        error={errors.templateUid}
                    />
                </Box>
                <Box width={1 / 2} p={1}>
                    <DatePickerDropdown
                        label='Due Date'
                        value={values.dueDate}
                        onChange={value => onValueChanged('dueDate', value)}
                        error={errors.dueDate}
                        fromMonth={new Date()}
                    />
                </Box>
                <Box width={1} p={1}>
                    <TextField
                        value={values.message}
                        onValueChanged={value => onValueChanged('message', value)}
                        topLabel='Type a message'
                        error={errors.message}
                        autoGrow
                        height={150}
                    />
                </Box>
            </Flex>
            <Flex mb={2}>
                <Flex width={1 / 2} flexDirection='column' my={1} mx={2}>
                    <ReportingMeta label='Status' value={request.relationship.company_name} />
                    <ReportingMeta label='Submitted By' value={submission.sent_by?.name} />
                    <ReportingMeta label='Submitted On' value={backend_date(submission.created)} />
                </Flex>
                <Flex width={1 / 2} flexWrap='nowrap' alignItems='center'>
                    <Box width={1 / 2} m={1}>
                        <Button danger onClick={onSubmit}>
                            Request Changes
                        </Button>
                    </Box>
                    <Box width={1 / 2} m={1}>
                        <Button onClick={onCancel}>Cancel</Button>
                    </Box>
                </Flex>
            </Flex>
        </>
    );
};

function validateForm(values) {
    const errors = {};

    const today = new Date();
    today.reset('day');

    if (!is_set(values.templateUid, true)) {
        errors.templateUid = 'Template is required';
    }

    if (!is_set(values.dueDate, true)) {
        errors.dueDate = 'Due date is required';
    } else if (values.dueDate < today) {
        errors.dueDate = 'Due date has to be in the future';
    }

    if (!is_set(values.message, true)) {
        errors.message = 'Please enter a message';
    }

    return errors;
}

const Mode = {
    Review: 'review',
    Reject: 'reject',
};

function ReviewSubmission({submissionUid, onClose}) {
    const [mode, setMode] = useState(Mode.Review);
    const [values, setValues] = useState(null);
    const [errors, setErrors] = useState({});

    const {data: templates} = useBackendData('reporting/templates', {}, {initialData: []});

    const {triggerEndpoint: approveSubmission} = useBackendEndpoint('reporting/actions/approve');

    const {triggerEndpoint: rejectSubmission} = useBackendEndpoint('reporting/actions/reject');

    const handleValueChanged = useCallback((key, value) => setValues({...values, [key]: value}), [
        values,
    ]);

    const handleApprove = useCallback(() => {
        approveSubmission({
            submission_uid: submissionUid,
        }).then(() => onClose());
    }, [approveSubmission, submissionUid, onClose]);

    const handleReject = useCallback(() => {
        const errors = validateForm(values);

        setErrors(errors);

        if (is_set(errors, true)) {
            return;
        }

        const {dueDate, templateUid, message} = values;

        rejectSubmission({
            submission_uid: submissionUid,
            due_date: to_epoch(dueDate),
            template_uid: templateUid,
            message,
        }).then(() => onClose());
    }, [rejectSubmission, submissionUid, onClose, values]);

    const handleCancel = useCallback(() => {
        setMode(Mode.Review);
        onClose();
    }, [onClose]);

    const {data, isLoading} = useBackendData(
        'reporting/get-submission-data',
        {submission_uid: submissionUid},
        {requiredParams: ['submission_uid']},
    );

    const {submission, request, supporting_documents} = data;
    const sheets = data.sheets?.map(mapped_sheet);

    if (supporting_documents?.length && sheets) {
        sheets.push(sheet_of_supporting_documents(supporting_documents));
    }

    if (!values && request) {
        setValues(genRequestDefaults(request));
    }

    if (!submission || isLoading) {
        return <Loader />;
    }

    switch (mode) {
        case Mode.Review:
            return (
                <ReviewContent
                    request={request}
                    submission={submission}
                    sheets={sheets}
                    onClose={onClose}
                    onApprove={handleApprove}
                    onReject={() => setMode(Mode.Reject)}
                />
            );
        case Mode.Reject:
            return (
                <RejectForm
                    request={request}
                    submission={submission}
                    onCancel={handleCancel}
                    onSubmit={handleReject}
                    values={values}
                    errors={errors}
                    templates={templates}
                    onValueChanged={handleValueChanged}
                />
            );
    }
}

export default ReviewSubmission;
