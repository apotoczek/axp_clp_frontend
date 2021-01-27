import React, {useCallback} from 'react';

import DataTable from 'components/basic/DataTable';
import {TableSection} from 'components/reporting/shared';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {Viewport, Page, Content} from 'components/layout';

import Breadcrumbs from 'components/Breadcrumbs';
import {useBackendData} from 'utils/backendConnect';
import Loader from 'components/basic/Loader';
import Error from 'components/basic/Error';
import {useHistory} from 'react-router-dom';

import {BASE_PATH, BASE_CRUMB} from './helpers';

export default function ListCompanies() {
    return (
        <Viewport>
            <Breadcrumbs path={[BASE_CRUMB]} />
            <Toolbar flex>
                <ToolbarItem icon='plus' glyphicon right to={`${BASE_PATH}/new`}>
                    Add Company
                </ToolbarItem>
            </Toolbar>
            <Page>
                <PageContent />
            </Page>
        </Viewport>
    );
}

function PageContent() {
    const history = useHistory();

    const handleClickCompany = useCallback(
        rel => {
            history.push(`${BASE_PATH}/${rel.uid}`);
        },
        [history],
    );

    const {data, error, isLoading} = useBackendData('reporting/list-relationships', {
        internal: true,
    });

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <Error title='Something went wrong' body='Please refresh the page to try again' />;
    }

    const relationships = (data && data.relationships) || [];

    return (
        <Content p={4}>
            <TableSection heading={BASE_CRUMB}>
                <DataTable
                    rowKey='uid'
                    enableRowClick
                    onRowClick={handleClickCompany}
                    rows={relationships}
                    isLoading={false}
                    columns={[
                        {
                            label: 'Company',
                            key: 'company_name',
                        },
                        {
                            label: 'Deal Team Member',
                            key: 'company_contact:name',
                        },
                        {
                            label: 'Email',
                            key: 'company_contact:email',
                        },
                        {
                            label: 'Your Contact Person',
                            key: 'recipient_contact:name',
                        },
                    ]}
                />
            </TableSection>
        </Content>
    );
}
