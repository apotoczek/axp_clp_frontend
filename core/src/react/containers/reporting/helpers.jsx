import {grouped_text_data} from 'src/libs/Mapping';

import {useBackendData} from 'utils/backendConnect';

export const Modals = {
    ReviewSubmission: 'review-submission',
    ViewEmailSchedule: 'view-email-schedule',
    RequestData: 'request-data',
    Edit: 'edit',
    EditMetricValue: 'edit-value',
    AuditTrail: 'audit-trail',
};

export function useCompanyData(relationship) {
    const {data: textData, isLoading: textDataLoading} = useBackendData(
        'text_data/values',
        {company_uid: relationship && relationship.company_uid},
        {requiredParams: ['company_uid']},
    );

    const metaData = grouped_text_data(textData.values || []);

    const {data: metrics, isLoading: metricsLoading} = useBackendData(
        'dataprovider/company_metric_pairs',
        {company_uid: relationship && relationship.company_uid},
        {requiredParams: ['company_uid'], initialData: []},
    );

    return {
        metaData,
        metrics,
        isLoading: textDataLoading || metricsLoading,
    };
}

export function useClientUsers() {
    const {data: clientData} = useBackendData('dataprovider/client');

    return clientData.users || [];
}
