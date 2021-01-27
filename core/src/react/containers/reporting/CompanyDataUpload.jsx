import React, {useCallback, useEffect, useState} from 'react';
import Loader from 'components/basic/Loader';
import {useBackendData} from 'utils/backendConnect';
import {epoch} from 'src/libs/Utils';
import {mapped_request} from 'src/helpers/reporting';
import {UploadStatus, RequestStatus, UploadStep} from 'components/reporting/shared';
import {callActionEndpoint, formPost, dataThing} from 'api';
import config from 'config';
import Toolbar from 'components/basic/Toolbar';

import {Page, Content} from 'components/layout';
import CPanel from 'components/basic/cpanel/base';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';

import DataRequests from 'components/reporting/sender/DataRequests';

export default function CompanyDataUpload({
    company,
    modes,
    setMode,
    activeMode,
    activeRequestUid: _activeRequestUid,
    history,
}) {
    const activeRequestUid =
        _activeRequestUid && _activeRequestUid.length ? _activeRequestUid : undefined;

    const {data: uploads} = useBackendData(
        'reporting/uploaded/list',
        {status: [UploadStatus.Processed, UploadStatus.Processing]},
        {initialData: []},
    );

    // This paragraph is a making the `requests` data "sticky" -- we don't want to remove invalidated data until
    // new data has arrived, this is to cut down on jitter
    const [[requests, hasRequests], setRequests] = useState([[], false]);
    const {
        data: {requests: _requests},
        hasData: requestsHaveLoaded,
    } = useBackendData(
        'reporting/data-requests/incoming',
        {company_uid: company?.uid},
        {requiredParams: ['company_uid'], initialData: {requests: []}},
    );
    useEffect(() => {
        if (requestsHaveLoaded) {
            setRequests([
                _requests
                    .filter(request => request.request_date * 1000 <= epoch())
                    .map(mapped_request),
                true,
            ]);
        }
    }, [_requests, requestsHaveLoaded]);

    // If we've opened a link with a request uid that can't be found, then it's a dead/invalidated link
    useEffect(() => {
        if (hasRequests) {
            if (activeRequestUid && !requests.some(v => v.uid === activeRequestUid)) {
                history.push(`/company-analytics/${company.uid}/data-upload`);
            }
        }
    }, [requests, hasRequests, activeRequestUid, company, history]);

    const cancelUpload = useCallback(
        () => history.push(`/company-analytics/${company.uid}/data-upload`),
        [company.uid, history],
    );
    const onClickRequest = useCallback(
        request => {
            history.push(`/company-analytics/${company.uid}/data-upload/${request.uid}`);
        },
        [company.uid, history],
    );

    const downloadTemplate = useCallback(data_request_uid => {
        return callActionEndpoint('reporting/actions/prepare-template-for-request', {
            data_request_uid,
        }).then(key => formPost(`${config.download_file_base}${key}`));
    }, []);

    const submitReport = useCallback((spreadsheet_uid, uploaded_supporting_document_uids) => {
        return callActionEndpoint('reporting/actions/submit-spreadsheet', {
            spreadsheet_uid,
            uploaded_supporting_document_uids,
        }).then(() => dataThing.statusCheck());
    }, []);

    const discardUpload = useCallback((uid, uploaded_supporting_document_uids) => {
        return callActionEndpoint('reporting/actions/discard-upload', {
            uid,
            uploaded_supporting_document_uids,
        }).then(() => dataThing.statusCheck());
    }, []);

    const activeRequest = activeRequestUid && requests.find(r => r.uid === activeRequestUid);
    const activeSubmissionUid = activeRequest?.latest_submission?.uid;

    // Determine the current step of the upload process based on the status of the request
    let activeStep;
    if (!activeRequestUid) {
        // If we're on the top-level route, then we're at the list view
        activeStep = null;
    } else if (!activeSubmissionUid) {
        // If we have a request active, but there's no latest submission for it, we should upload submission data
        activeStep = UploadStep.Upload;
    } else if (activeRequest?.status === RequestStatus.ChangesRequested) {
        // If there is an existing submission, but changes are requested, prompt for a new upload
        activeStep = UploadStep.Upload;
    } else {
        // If we do have a non-rejected submission, view it!
        activeStep = UploadStep.ViewSubmission;
    }

    return (
        <>
            <Page>
                <CPanel>
                    <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                </CPanel>
                <Content>
                    <Toolbar />
                    {!hasRequests ? (
                        <Loader />
                    ) : (
                        <DataRequests
                            activeRequestUid={activeRequestUid}
                            activeSubmissionUid={activeSubmissionUid}
                            activeStep={activeStep}
                            requests={requests}
                            uploads={uploads}
                            activeRequest={activeRequest}
                            cancelUpload={cancelUpload}
                            onClickRequest={onClickRequest}
                            downloadTemplate={downloadTemplate}
                            submitReport={submitReport}
                            discardUpload={discardUpload}
                        />
                    )}
                </Content>
            </Page>
        </>
    );
}
