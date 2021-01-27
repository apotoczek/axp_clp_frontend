import React from 'react';
import styled from 'styled-components';

import DataTable from 'components/basic/DataTable';
import Loader from 'components/basic/Loader';

import {useBackendData} from 'utils/backendConnect';
import {downloadDataTraceFile} from 'api';

const A = styled.a`
    cursor: pointer;
`;

function DownloadableFile({cellData, rowData}) {
    return rowData.document_index_uid ? (
        <A onClick={() => downloadDataTraceFile(rowData.document_index_uid)}>{cellData}</A>
    ) : (
        <span>{cellData}</span>
    );
}

function SupportingDocumentsList({needsCompany, companyUid}) {
    const {data, isLoading} = useBackendData(
        'reporting/list-submitted-supporting-documents',
        {company_uid: companyUid},
        needsCompany ? {requiredParams: ['company_uid']} : {},
    );

    if (isLoading) {
        return <Loader />;
    }

    return (
        <DataTable
            rowKey='uid'
            rows={data.documents ?? []}
            pushHeight
            columns={[
                {
                    label: 'Name',
                    key: 'name',
                },
                {
                    label: 'Description',
                    key: 'description',
                },
                {
                    label: 'Submission Date',
                    key: 'created',
                    format: 'backend_date',
                },
                {
                    label: 'Submitted By',
                    key: 'submitted_by',
                },
                {
                    label: 'File Name',
                    key: 'file_name',
                    cellRenderer: DownloadableFile,
                },
            ]}
        />
    );
}

export default SupportingDocumentsList;
