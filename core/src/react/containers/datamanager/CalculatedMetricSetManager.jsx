import React from 'react';
import {Container} from 'components/layout';
import DataTable from 'components/basic/DataTable';
import {Viewport, Page} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import Toolbar from 'components/basic/Toolbar';
import {useBackendData} from 'utils/backendConnect';
import {format_options} from 'src/libs/Constants';

export default function CalculatedMetricSetManager({args}) {
    const {company_uid, metric_uid, version_uid} = args;
    const time_frame = args.time_frame && +args.time_frame;
    const frequency = args.frequency && +args.frequency;

    const {
        data: {name: metricName, format},
    } = useBackendData(
        'calculated-metric/get',
        {calculated_metric_uid: metric_uid},
        {deps: [metric_uid]},
    );

    const {
        data: {name: companyName},
        isLoading: isLoadingCompany,
    } = useBackendData(
        'dataprovider/company_data',
        {company_uid, include_attributes: false},
        {deps: [company_uid]},
    );

    const {data: analysisData, isLoading: isAnalysisLoading} = useBackendData(
        'dataprovider/company_metric_analysis',
        {
            operations: [
                {
                    type: 'calculated_metric',
                    calculated_metric_uid: metric_uid,
                    frequency,
                    time_frame,
                },
            ],
            metric_versions: [{value: version_uid}],
            time_frame,
            company_uid,
        },
        {deps: [metric_uid, frequency, time_frame, company_uid, version_uid]},
    );

    let metricPairs = Object.values(analysisData.metrics_for_version)[0]?.trends[metricName];
    return (
        <Viewport>
            <Breadcrumbs
                path={['Data Manager', 'Companies', companyName ?? '...', metricName ?? '... ']}
                urls={[
                    '#!/data-manager',
                    '#!/company-analytics',
                    isLoadingCompany ? undefined : `#!/data-manager/companies/${company_uid}`,
                    undefined,
                ]}
                linkComponent={NonRouterLink}
            />
            <Toolbar />
            <Page>
                <Container>
                    <DataTable
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
                </Container>
            </Page>
        </Viewport>
    );
}
