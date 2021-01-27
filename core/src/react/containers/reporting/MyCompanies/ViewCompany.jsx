import React, {useState, useCallback} from 'react';
import styled from 'styled-components';

import {MetaValue, MetaInfo, SubmissionStatus} from 'components/reporting/shared';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Viewport, Page, Content} from 'components/layout';

import Breadcrumbs from 'components/Breadcrumbs';
import {useBackendData, useBackendEndpoint} from 'utils/backendConnect';
import Loader from 'components/basic/Loader';
import Error from 'components/basic/Error';
import history from 'utils/history';
import {useParams} from 'react-router-dom';
import {Box} from '@rebass/grid';
import {H1, H2} from 'components/basic/text';
import ConfirmDropdown from 'components/basic/forms/dropdowns/ConfirmDropdown';

import DataRequestCard from 'components/reporting/DataRequestCard';
import RequestDataModal from 'containers/reporting/RequestDataModal';
import ReviewSubmission from 'containers/reporting/ReviewSubmission';
import ViewEmailScheduleModal from 'containers/reporting/ViewEmailScheduleModal';
import AuditTrailModal from 'components/reporting/data-trace/AuditTrailModal';
import EditMetricValueModal from 'components/metrics/EditMetricValueModal';
import {usePartiallyAppliedCallback} from 'utils/hooks';
import UploadedMetrics from 'components/reporting/UploadedMetrics';

import {useCompanyData, Modals} from 'containers/reporting/helpers';

import MetaDataTable from 'components/reporting/MetaDataTable';
import auth from 'auth';

import EditCompanyModal from './EditCompanyModal';
import {BASE_PATH, BASE_CRUMB} from './helpers';

const EmptyDesc = styled(Box)`
    font-size: 15px;
    font-weight: 300;
    margin-left: 8px;
`;

export default function ViewCompany() {
    const {uid} = useParams();
    const [activeModal, setActiveModal] = useState(null);
    const [submissionUid, setSubmissionUid] = useState(null);
    const [requestUid, setRequestUid] = useState(null);
    const [activeMetric, setActiveMetric] = useState(null);

    const {triggerEndpoint: deleteRelationship} = useBackendEndpoint(
        'reporting/actions/delete-relationship',
    );

    const toggleModal = usePartiallyAppliedCallback(
        key => {
            setActiveModal(activeModal && activeModal === key ? null : key);
        },
        [activeModal],
    );

    const genReviewCallback = ({latest_submission}) => {
        if (latest_submission && latest_submission.status == SubmissionStatus.Pending) {
            return () => {
                setSubmissionUid(latest_submission.uid);
                setActiveModal(Modals.ReviewSubmission);
            };
        }

        return null;
    };

    const genViewScheduleCallback = ({email_sequence, uid}) => {
        if (email_sequence) {
            return () => {
                setRequestUid(uid);
                setActiveModal(Modals.ViewEmailSchedule);
            };
        }

        return null;
    };

    const deactivateMetric = useCallback(() => {
        if (activeModal !== Modals.AuditTrail && activeModal !== Modals.EditMetricValue) {
            setActiveMetric(null);
        }
    }, [activeModal]);

    const toggleMetricModal = usePartiallyAppliedCallback(
        (modal, metric) => {
            setActiveMetric(metric);
            toggleModal(modal)();
        },
        [toggleModal],
    );

    const handleDeleteRelationship = useCallback(() => {
        deleteRelationship({
            rel_uid: uid,
        }).then(() => {
            history.push(BASE_PATH);
        });
    }, [deleteRelationship, uid]);

    const {data: requestData, error: requestsError, isLoading: requestsLoading} = useBackendData(
        'reporting/data-requests/outgoing',
        {internal: true, relationship_uid: uid, include_approved: false},
        {requiredParams: ['relationship_uid']},
    );

    const requests = requestData.requests || [];

    const {data: listData, error: listError, isLoading: listLoading} = useBackendData(
        'reporting/list-relationships',
        {internal: true, relationship_uid: uid},
        {requiredParams: ['relationship_uid']},
    );

    const relationships = listData.relationships || null;

    const relationship = relationships && relationships[0];

    const breadcrumb = relationship && relationship.company_name;

    const relConfirmed = relationship && !relationship.pending;
    const companyUid = relationship && relationship.company_uid;

    const {data: companyData} = useBackendData(
        'dataprovider/company_data',
        {company_uid: companyUid},
        {requiredParams: ['company_uid']},
    );

    return (
        <Viewport>
            <Breadcrumbs path={[BASE_CRUMB, breadcrumb || '']} urls={[BASE_PATH]} />
            <Toolbar flex>
                <ToolbarItem icon='wrench' right onClick={toggleModal(Modals.Edit)}>
                    Edit
                </ToolbarItem>
                <ConfirmDropdown
                    right
                    text='Are you sure you want to delete this company?'
                    subText='All requests and submissions associated with the company will be deleted as well.'
                    onConfirm={handleDeleteRelationship}
                >
                    <ToolbarItem icon='trash'>Delete</ToolbarItem>
                </ConfirmDropdown>
                {relConfirmed && (
                    <ToolbarItem icon='clock' right onClick={toggleModal(Modals.RequestData)}>
                        Request Data
                    </ToolbarItem>
                )}
            </Toolbar>
            <RequestDataModal
                relationshipUid={uid}
                isOpen={activeModal === Modals.RequestData}
                toggleModal={toggleModal(Modals.RequestData)}
                internal={relationship && relationship.internal}
                company={companyData}
            />
            <ViewEmailScheduleModal
                key={requestUid || Modals.ViewEmailSchedule}
                isOpen={activeModal === Modals.ViewEmailSchedule}
                requestUid={requestUid}
                toggleModal={toggleModal(Modals.ViewEmailSchedule)}
            />
            <EditCompanyModal
                relationshipUid={uid}
                isOpen={activeModal === Modals.Edit}
                toggleModal={toggleModal(Modals.Edit)}
            />
            <EditMetricValueModal
                isOpen={activeModal === Modals.EditMetricValue}
                toggleModal={toggleModal(Modals.EditMetricValue)}
                metricSetUid={activeMetric?.setUid}
                date={activeMetric?.asOfDate}
                companyUid={companyUid}
                onClose={deactivateMetric}
            />
            <AuditTrailModal
                isOpen={activeModal === Modals.AuditTrail}
                toggleModal={toggleModal(Modals.AuditTrail)}
                metricSetUid={activeMetric?.setUid}
                date={activeMetric?.asOfDate}
                companyUid={companyUid}
                toggleEditModal={toggleModal(Modals.EditMetricValue)}
                onClose={deactivateMetric}
            />
            <Page>
                {activeModal === Modals.ReviewSubmission ? (
                    <Content p={3}>
                        <ReviewSubmission
                            submissionUid={submissionUid}
                            onClose={toggleModal(Modals.ReviewSubmission)}
                        />
                    </Content>
                ) : (
                    <PageContent
                        isLoading={listLoading || requestsLoading}
                        error={listError || requestsError}
                        relationship={relationship}
                        requests={requests}
                        genReviewCallback={genReviewCallback}
                        genViewScheduleCallback={genViewScheduleCallback}
                        toggleMetricModal={toggleMetricModal}
                        enableAuditTrail={auth.user_has_feature('beta_testing')}
                    />
                )}
            </Page>
        </Viewport>
    );
}

function PageContent({
    isLoading,
    error,
    relationship,
    requests,
    genViewScheduleCallback,
    genReviewCallback,
    toggleMetricModal,
    enableAuditTrail,
}) {
    const {metaData, metrics} = useCompanyData(relationship);

    const {triggerEndpoint: deactivateRequest} = useBackendEndpoint(
        'reporting/actions/deactivate-data-request',
    );

    const handleDeactivateRequest = usePartiallyAppliedCallback(
        ({uid}) => {
            deactivateRequest({
                data_request_uid: uid,
            }).then(() => {});
        },
        [deactivateRequest],
    );

    if (isLoading) {
        return <Loader />;
    }

    if (!relationship || error) {
        return <Error title='Company Not Found' body='The selected company does not exist' />;
    }

    const companyContact = relationship.company_contact || {};

    return (
        <Content>
            <Box p={3}>
                <Box p={2} mb={3}>
                    <Box px={2} pb={1}>
                        <H1>{relationship.company_name}</H1>
                        <MetaInfo>
                            Deal Team Member
                            <MetaValue>{companyContact.name}</MetaValue>
                        </MetaInfo>
                        <MetaInfo>
                            Email Address
                            <MetaValue>{companyContact.email}</MetaValue>
                        </MetaInfo>
                    </Box>
                </Box>
                <Box p={2} mb={3}>
                    <Box px={2} pb={1}>
                        <H2>Active Data Requests</H2>
                    </Box>
                    {requests.length ? (
                        requests.map(d => (
                            <DataRequestCard
                                key={d.uid}
                                dataRequest={d}
                                onViewSchedule={genViewScheduleCallback(d)}
                                onReviewSubmission={genReviewCallback(d)}
                                onDeactivate={handleDeactivateRequest(d)}
                            />
                        ))
                    ) : (
                        <EmptyDesc>No active data requests</EmptyDesc>
                    )}
                </Box>
                <Box p={2} mb={3}>
                    <Box px={2} pb={1}>
                        <H2>Meta Data</H2>
                    </Box>
                    {metaData.length ? (
                        <MetaDataTable metaData={metaData} />
                    ) : (
                        <EmptyDesc>No meta data yet</EmptyDesc>
                    )}
                </Box>
                <Box p={2} mb={3}>
                    <Box px={2} pb={1}>
                        <H2>Metrics</H2>
                    </Box>
                    {metrics.length ? (
                        <UploadedMetrics
                            metrics={metrics}
                            onClickEditValue={toggleMetricModal(Modals.EditMetricValue)}
                            onClickViewHistory={toggleMetricModal(Modals.AuditTrail)}
                            allowEdit={enableAuditTrail}
                        />
                    ) : (
                        <EmptyDesc>No metrics yet</EmptyDesc>
                    )}
                </Box>
            </Box>
        </Content>
    );
}
