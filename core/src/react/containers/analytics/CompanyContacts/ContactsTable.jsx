import React, {useCallback} from 'react';
import {useHistory, useParams} from 'react-router-dom';

import {useBackendData} from 'utils/backendConnect';

import {Content} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import DataTable from 'components/basic/DataTable';

export default function ComponentsTable() {
    const {companyId} = useParams();
    const history = useHistory();

    const {
        data: {contacts = []},
        isLoading: isTableLoading,
    } = useBackendData('company-contacts/list', {company_uid: companyId});

    const handleRowClick = useCallback(
        row => history.push(`/company-analytics/${companyId}/contacts/${row.uid}/edit`),
        [companyId, history],
    );

    return (
        <>
            <Content>
                <Toolbar>
                    <ToolbarItem
                        icon='plus'
                        glyphicon
                        right
                        to={`/company-analytics/${companyId}/contacts/new`}
                    >
                        Create New Contact
                    </ToolbarItem>
                </Toolbar>
                <DataTable
                    rowKey='uid'
                    isLoading={isTableLoading}
                    rows={contacts}
                    columns={[
                        {
                            key: 'first_name',
                            label: 'First Name',
                        },
                        {
                            key: 'last_name',
                            label: 'Last Name',
                        },
                        {
                            key: 'email',
                            label: 'Email',
                        },
                        {
                            key: 'title',
                            label: 'Title',
                        },
                        {
                            key: 'phone',
                            label: 'Phone',
                        },
                    ]}
                    enableSorting
                    sortInline
                    enableRowClick
                    onRowClick={handleRowClick}
                    label='Contacts'
                    enableContextHeader
                    enableHeaderRow
                    resultsPerPage={10}
                />
            </Content>
        </>
    );
}
