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

export default function ListPortals() {
    return (
        <Viewport>
            <Breadcrumbs path={[BASE_CRUMB]} />
            <Toolbar flex>
                <ToolbarItem icon='plus' glyphicon right to={`${BASE_PATH}/new`}>
                    Create New Portal
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

    const handleClickPortal = useCallback(
        portal => {
            history.push(`${BASE_PATH}/${portal.uid}`);
        },
        [history],
    );

    const {data, error, isLoading} = useBackendData('reporting/list-relationships');

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <Error title='Something went wrong' body='Please refresh the page to try again' />;
    }

    const relationships = data?.relationships ?? [];

    return (
        <Content p={4}>
            <TableSection heading={BASE_CRUMB}>
                <DataTable
                    rowKey='uid'
                    enableRowClick
                    onRowClick={handleClickPortal}
                    rows={relationships}
                    isLoading={false}
                    columns={[
                        {
                            label: 'Company',
                            key: 'company_name',
                        },
                        {
                            label: 'Company Contact',
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
                        {
                            label: 'Pending Invitation',
                            key: 'pending',
                            format: 'boolean',
                        },
                    ]}
                />
            </TableSection>
        </Content>
    );
}
