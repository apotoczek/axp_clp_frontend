import React from 'react';
import {Content} from 'components/layout';
import DataTable from 'components/basic/DataTable';
import {Viewport, Page} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import Toolbar from 'components/basic/Toolbar';
import {useBackendData} from 'utils/backendConnect';
import {format_options} from 'src/libs/Constants';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import CPanel from 'components/basic/cpanel/base';

export default function CompanyCalculatedMetricSet({
    companyUid,
    metricUid,
    timeFrame,
    frequency,
    versionUid,
    modes,
    setMode,
    activeMode,
    forDataManager = false,
}) {
    const {
        data: {name: metricName, format},
    } = useBackendData(
        'calculated-metric/get',
        {calculated_metric_uid: metricUid},
        {requiredParams: ['calculated_metric_uid']},
    );

    const {data: analysisData, isLoading: isAnalysisLoading} = useBackendData(
        'dataprovider/company_metric_analysis',
        {
            operations: [
                {
                    type: 'calculated_metric',
                    calculated_metric_uid: metricUid,
                    frequency,
                    time_frame: timeFrame,
                },
            ],
            metric_versions: [{value: versionUid}],
            time_frame: timeFrame,
            company_uid: companyUid,
        },
        {requiredParams: ['operations', 'time_frame', 'company_uid', 'metric_versions']},
    );

    const {
        data: {name: companyName},
        isLoading: isLoadingCompany,
    } = useBackendData(
        'dataprovider/company_data',
        {company_uid: companyUid, include_attributes: false},
        {triggerConditional: () => companyUid && forDataManager},
    );

    const [versionName, analysisEntry] =
        Object.entries(analysisData?.metrics_for_version ?? {})[0] ?? [];
    const metricPairs = analysisEntry?.trends[metricName];

    const content = (
        <Content>
            <Toolbar />
            <DataTable
                enableContextHeader
                label={`${metricName} (${versionName})`}
                columns={[
                    {label: 'Date', key: 'date', format: 'date'},
                    {
                        label: 'Value',
                        key: 'value',
                        format: format_options[format ? format - 1 : 4].format,
                    },
                ]}
                isLoading={isAnalysisLoading}
                rowKey='uid'
                rows={
                    metricPairs?.values?.map(([date, value]) => ({
                        date,
                        value,
                    })) ?? []
                }
            />
        </Content>
    );

    if (forDataManager) {
        return (
            <Viewport>
                <Breadcrumbs
                    path={['Data Manager', 'Companies', companyName ?? '...', metricName ?? '... ']}
                    urls={[
                        '#!/data-manager',
                        '#!/data-manager/companies',
                        isLoadingCompany ? undefined : `#!/company-analytics/${companyUid}`,
                        undefined,
                    ]}
                    linkComponent={NonRouterLink}
                />
                <Page>{content}</Page>
            </Viewport>
        );
    }
    return (
        <Page>
            <CPanel>
                {modes && (
                    <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                )}
            </CPanel>
            {content}
        </Page>
    );
}
