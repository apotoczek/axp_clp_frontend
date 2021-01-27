import Context from 'src/libs/Context';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import ko from 'knockout';
import config from 'config';

import PortalDashboard from 'components/reporting/PortalDashboard';

import {epoch} from 'src/libs/Utils';

import {UploadStatus, UploadStep, RequestStatus} from 'components/reporting/shared';

import {mapped_request} from 'src/helpers/reporting';

import 'src/libs/bindings/react';

class PCDashboardVM extends Context {
    constructor() {
        super({id: 'pc_dashboard'});

        this.dfd = this.new_deferred();

        this.mainComponent = PortalDashboard;

        this.datasources = {
            uploads: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/uploaded/list',
                        status: [UploadStatus.Processing, UploadStatus.Processed],
                    },
                },
            }),
            requests: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/data-requests/incoming',
                    },
                    key: 'requests',
                    mapping: requests =>
                        requests
                            .filter(request => request.request_date * 1000 <= epoch())
                            .map(mapped_request),
                },
            }),
        };

        this.endpoints = {
            download_template: DataThing.backends.reporting({
                url: 'actions/prepare-template-for-request',
            }),
            discard_upload: DataThing.backends.reporting({
                url: 'actions/discard-upload',
            }),
            approve_upload: DataThing.backends.reporting({
                url: 'actions/approve-upload',
            }),
            submit_spreadsheet: DataThing.backends.reporting({
                url: 'actions/submit-spreadsheet',
            }),
        };

        this.state = ko.observable({
            activeRequestUid: null,
            activeSubmissionUid: null,
            activeStep: null,
        });

        this.props = ko.pureComputed(() => {
            const state = this.state();

            const requests = this.datasources.requests.data() ?? [];
            const uploads = this.datasources.uploads.data() ?? [];

            const activeRequest =
                state.activeRequestUid && requests.find(r => r.uid === state.activeRequestUid);

            return {
                ...state,
                requests,
                uploads,
                activeRequest,
                cancelUpload: () => this.state({...state, activeStep: null}),
                onClickRequest: request => {
                    if (
                        request.latest_submission &&
                        request.status !== RequestStatus.ChangesRequested
                    ) {
                        this.state({
                            ...state,
                            activeSubmissionUid: request.latest_submission.uid,
                            activeStep: UploadStep.ViewSubmission,
                        });
                        return;
                    }

                    this.state({
                        ...state,
                        activeRequestUid: request?.uid,
                        activeStep: UploadStep.Upload,
                    });
                },
                downloadTemplate: uid => {
                    return this.endpoints.download_template({
                        data: {
                            data_request_uid: uid,
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_file_base + key);
                            DataThing.status_check();
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                },
                submitReport: (spreadsheet_uid, uploaded_supporting_document_uids) => {
                    this.endpoints.submit_spreadsheet({
                        data: {
                            spreadsheet_uid,
                            uploaded_supporting_document_uids,
                        },
                        success: DataThing.api.XHRSuccess(({submission_uid}) => {
                            this.state({
                                ...this.state,
                                activeSubmissionUid: submission_uid,
                                activeStep: UploadStep.ViewSubmission,
                            });
                            DataThing.status_check();
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                },
                discardUpload: (uid, uploaded_supporting_document_uids) => {
                    this.endpoints.discard_upload({
                        data: {
                            uid,
                            uploaded_supporting_document_uids,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                },
                approveUpload: uid => {
                    this.endpoints.approve_upload({
                        data: {
                            uid,
                        },
                        success: DataThing.api.XHRSuccess(() => {
                            DataThing.status_check();
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                },
            };
        });

        this.dfd.resolve();
    }
}

export default PCDashboardVM;
