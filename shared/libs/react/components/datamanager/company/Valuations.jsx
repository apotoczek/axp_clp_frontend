import React from 'react';
import {Page, Content, Section} from 'components/layout';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {money} from 'utils/formatters';

import CPanel from 'components/basic/cpanel/base';

import DataTable from 'components/basic/DataTable';

import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';

const ValuationsCPanel = ({setMode, activeMode, modes}) => (
    <CPanel flex>
        <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
    </CPanel>
);
class Valuations extends React.Component {
    columns = () => {
        const moneyFormatter = ({cellData, rowData}) =>
            money(cellData, {render_currency: rowData.base_currency});
        return [
            {
                label: 'Date',
                key: 'date',
                format: 'backend_date',
                right: true,
            },
            {
                label: 'Equity Value',
                key: 'equity_value',
                formatter: moneyFormatter,
                right: true,
            },
            {
                label: 'Enterprise Value',
                key: 'enterprise_value',
                formatter: moneyFormatter,
                right: true,
            },
            {
                label: 'Net Debt',
                key: 'debt',
                formatter: moneyFormatter,
                right: true,
            },
            {
                label: 'Revenue',
                key: 'revenue',
                formatter: moneyFormatter,
                right: true,
            },
            {
                label: 'EBITDA',
                key: 'ebitda',
                formatter: moneyFormatter,
                right: true,
            },
            {
                label: 'EV/EBITDA',
                key: 'ev_multiple',
                format: 'multiple',
                right: true,
            },
            {
                label: 'Net Debt/EBITDA',
                key: 'debt_multiple',
                format: 'multiple',
                right: true,
            },
            {
                label: 'Add-on Name',
                key: 'addon_name',
            },
        ];
    };

    renderValuations = () => {
        const {valuations, isLoading} = this.props;

        return (
            <DataTable
                rowKey='uid'
                rows={valuations}
                isLoading={isLoading}
                enableContextHeader
                label='Valuations'
                columns={this.columns()}
            />
        );
    };

    renderDerivedValuations = () => {
        const {derivedValuations, isLoading} = this.props;

        return (
            <DataTable
                rowKey='date'
                rows={derivedValuations}
                isLoading={isLoading}
                enableContextHeader
                label='Derived from Metrics'
                columns={this.columns()}
            />
        );
    };

    render = () => {
        const {setMode, activeMode, downloadValuations, upload, modes} = this.props;

        return (
            <Page>
                <ValuationsCPanel activeMode={activeMode} setMode={setMode} modes={modes} />
                <Content>
                    <Toolbar flex>
                        <ToolbarItem
                            key='edit'
                            onClick={downloadValuations}
                            icon='edit'
                            glyphicon
                            left
                        >
                            Download Editing Spreadsheet
                        </ToolbarItem>
                        <ToolbarItem key='upload' onClick={upload} icon='upload' left>
                            Upload
                        </ToolbarItem>
                    </Toolbar>
                    <Section>{this.renderValuations()}</Section>
                    <Section flex={2}>{this.renderDerivedValuations()}</Section>
                </Content>
            </Page>
        );
    };
}

export default Valuations;
