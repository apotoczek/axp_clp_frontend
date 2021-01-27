import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import config from 'config';
import {prepareCsv, formPost} from 'api';

import BasicTable from 'components/basic/BasicTable';
import Loader from 'components/basic/Loader';

const ExportButton = styled.button`
    display: none;
    position: absolute;
    top: 1%;
    right: 1%;

    font-size: 12px;
    border-radius: 10px;
    color: ${({theme}) => theme.basicTable.exportBg};

    &:hover {
        background: ${({theme}) => theme.basicTable.exportHoverBg};
    }
`;

const Wrapper = styled.div`
    position: relative;

    &:hover ${ExportButton} {
        display: block;
    }

    padding-top: ${props => props.paddingY ?? 0}px;
    padding-bottom: ${props => props.paddingY ?? 0}px;
    padding-left: ${props => props.paddingX ?? 0}px;
    padding-right: ${props => props.paddingX ?? 0}px;
`;

const InnerBasicTableFromProvider = ({dataProvider: provider, _isEditing, ...rest}, ref) => {
    const handleExport = useCallback(() => {
        const rows = provider.tableData();

        if (rows.length < 1) {
            // There is no data to export
            return;
        }

        const dataToExport = rows.map(row => row.map(cell => provider.exportDataForCell(cell)));

        prepareCsv(dataToExport).then(response => {
            formPost(config.download_csv_base + response, '');
        });
    }, [provider]);

    if (provider.isLoading()) {
        return <Loader />;
    }

    return (
        <Wrapper
            paddingX={provider.settingsValueForComponent(['paddingX'])}
            paddingY={provider.settingsValueForComponent(['paddingY'])}
        >
            <ExportButton onClick={handleExport}>Export CSV</ExportButton>
            <BasicTable
                ref={ref}
                table={provider.tableData()}
                striped={provider.settingsValueForComponent(['bandedRows'], true)}
                stripedBgMain={provider.settingsValueForComponent(['rowBgColorMain'])}
                stripedBgAlt={provider.settingsValueForComponent(['rowBgColorAlt'])}
                {...rest}
            />
        </Wrapper>
    );
};

export const BasicTableFromProvider = React.forwardRef(InnerBasicTableFromProvider);

BasicTableFromProvider.propTypes = {
    dataProvider: PropTypes.shape({
        tableData: PropTypes.func.isRequired,
    }),
};
