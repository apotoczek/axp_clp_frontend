import React, {useState} from 'react';

import {Viewport} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';

import CPanel from 'components/basic/cpanel/base';
import CPanelModeButton from 'components/basic/cpanel/CPanelModeButton';
import {Page, Content} from 'components/layout';
import {LightTheme} from 'themes';

import DataRequests from 'components/reporting/sender/DataRequests';
import SupportingDocumentsList from 'components/reporting/sender/SupportingDocumentsList';

function ReportingCPanel({viewKey, setViewKey}) {
    return (
        <CPanel width={180}>
            <CPanelModeButton
                isActive={viewKey === 'dataRequests'}
                onClick={() => setViewKey('dataRequests')}
            >
                Data Requests
            </CPanelModeButton>
            <CPanelModeButton
                isActive={viewKey === 'documents'}
                onClick={() => setViewKey('documents')}
            >
                Documents
            </CPanelModeButton>
        </CPanel>
    );
}

function PortalDashboard({
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
    const [viewKey, setViewKey] = useState('dataRequests');
    let activeView;
    if (viewKey === 'documents') {
        activeView = <SupportingDocumentsList />;
    } else {
        // viewKey === 'dataRequests'
        activeView = (
            <DataRequests
                requests={requests}
                uploads={uploads}
                activeRequest={activeRequest}
                activeStep={activeStep}
                activeSubmissionUid={activeSubmissionUid}
                downloadTemplate={downloadTemplate}
                submitReport={submitReport}
                discardUpload={discardUpload}
                onClickRequest={onClickRequest}
                cancelUpload={cancelUpload}
            />
        );
    }
    return (
        <Viewport>
            <Breadcrumbs path={['Portal']} linkComponent={NonRouterLink} />
            <LightTheme>
                <Page>
                    <ReportingCPanel viewKey={viewKey} setViewKey={setViewKey} />
                    <Content>{activeView}</Content>
                </Page>
            </LightTheme>
        </Viewport>
    );
}

export default PortalDashboard;
