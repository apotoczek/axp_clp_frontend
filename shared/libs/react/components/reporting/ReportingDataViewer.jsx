import React from 'react';
import {lighten} from 'polished';
import styled, {css} from 'styled-components';
import {downloadDataTraceFile} from 'api';

import {Box, Flex} from '@rebass/grid';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import genFormatter from 'utils/formatters';
import {is_set} from 'src/libs/Utils';
import MetaDataTable from 'src/libs/react/components/reporting/MetaDataTable';

const A = styled.a`
    cursor: pointer;
`;

const Tab = styled.div`
    padding: 7px 30px;
    background-color: ${props => (props.active ? '#545B68' : '#FFFFFF')};
    border: 1px solid #bec2d5;
    border-bottom-width: 0;
    border-right-width: 0;
    user-select: none;

    &:last-child {
        border-right-width: 1px;
    }

    &:hover {
        background-color: ${props => (props.active ? '#323743' : '#F2F2F2')};
        color: ${props => (props.active ? '#FFFFFF' : '#000000')};
    }

    cursor: pointer;

    font-size: 15px;
    color: ${props => (props.active ? '#FFFFFF' : '#4A4A4A')};
`;

const TabViewWrapper = styled(Flex)`
    flex-direction: column;
    height: 100%;
`;

const TabViewHeader = styled.div`
    flex-direction: row;
    display: flex;
`;

const MetricDataTableWrapper = styled.div`
    height: 100%;
    border: 1px solid #666666;
    padding-bottom: 2px;
    padding-right: 2px;

    .gridBottomLeft,
    .gridTopRight {
        &::-webkit-scrollbar {
            -webkit-appearance: none;
            width: 0;
            height: 0;
        }
    }
    .ReactVirtualized__Grid {
        outline: none;
    }
`;

const MetaDataWrapper = styled(Box)`
    overflow-y: auto;
    height: 100%;
`;

const TabViewBody = styled(Box)`
    padding: 10px;
    background-color: #ffffff;
    border: 1px solid #a4a4a4;
    flex: 1;
    margin-top: -1px;
    height: 1%;
`;

const Cell = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    padding: 0 1em;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid #666666;
    border-bottom: 1px solid #BEC2D5;

    font-size: 13px;

    position: relative;

    z-index: ${props => (props.zIndex ? props.zIndex : 'auto')};

    text-align: right;

    text-overflow: ellipsis;

    background-color: ${props => (props.odd ? '#FFFFFF' : '#F6F8FF')};
    color: #4A4A4A;

    ${props =>
        props.isHeader &&
        css`
        background-color: ${props.isInputColumn ? '#D9DCEC' : '#D9DCEC'};
        /* border-color: ${props.isInputColumn ? '#1BA1CC' : '#BEC2D5'}; */
        text-transform: uppercase;
        font-weight: ${props.isInputColumn ? 600 : 400};
        font-size: 14px;

        /* ${!props.isFixedColumn &&
            css`
            &::after {
                content: "${props.isInputColumn ? 'Input' : 'Historic'}";
                font-size: 11px;
                font-weight: 400;
            }
        `} */
    `}

    ${props =>
        !props.isHeader &&
        props.isFixedColumn &&
        css`
        background-color: ${props.odd ? '#FFFFFF' : '#F6F8FF'};
        /* ${props.warning &&
            css`
                color: #c33a3a;
                font-weight: 600;
            `} */
    `}

    ${props =>
        !props.isHeader &&
        props.isInputColumn &&
        css`
            color: ${lighten(0.15, '#444444')};
        `}

    ${props =>
        props.isFixedColumn &&
        css`
            text-align: left;
        `}
`;

// const CellHighlight = styled.div`
//     position: absolute;
//     top: -2px;
//     left: -2px;
//     bottom: -2px;
//     right: -2px;
//     border: 2px solid #1BA1CC;
//     border-width: 0 2px;
//     background-color: transparent;
//     z-index: 100;
// `;

const WarningText = styled.span`
    color: #c33a3a;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
`;

const Muted = styled.span`
    color: #8c939c;
    font-weight: 600;
`;

class MetricDataTable extends React.PureComponent {
    fixedColumnWidth = 200;
    minColumnWidth = 150;
    rowHeight = 50;
    fixedRowCount = 1;
    fixedColumnCount = 2;

    columnWidth = (columnCount, totalWidth) => ({index}) => {
        if (index < this.fixedColumnCount) {
            return this.fixedColumnWidth;
        }

        const remWidth = totalWidth - this.fixedColumnCount * this.fixedColumnWidth;
        const calculatedColumnWidth = remWidth / (columnCount - this.fixedColumnCount);

        return Math.max(calculatedColumnWidth, this.minColumnWidth);
    };

    cellRenderer = (rows, backfillCount) => ({
        columnIndex, // Horizontal (column) index of cell
        rowIndex, // Vertical (row) index of cell
        key, // Unique key within array of cells
        style,
    }) => {
        const isInputColumn = columnIndex > backfillCount + 1;

        return (
            <Cell
                key={key}
                style={style}
                isHeader={rowIndex === 0}
                isFixedColumn={columnIndex < this.fixedColumnCount}
                isInputColumn={isInputColumn}
                odd={rowIndex % 2 === 1}
            >
                {/* {isInputColumn && <CellHighlight />} */}
                {rows[rowIndex][columnIndex]}
            </Cell>
        );
    };

    render() {
        const {dates, backfillDates, metrics} = this.props;

        // We want to collapse values that will render into the same header label into the same column.
        // We collect all the header labels in order into the dateGroups array, and the date values for
        // that group in the datesForLabel
        const dateValuesForLabel = {};
        const dateGroups = [];
        for (const d of [...backfillDates.map(date => ({...date, backfill: true})), ...dates]) {
            if (dateValuesForLabel[d.label]) {
                dateValuesForLabel[d.label].push(d.key);
            } else {
                dateGroups.push({label: d.label, backfill: d.backfill});
                dateValuesForLabel[d.label] = [d.key];
            }
        }

        const headerRow = ['Metric', 'Reporting Period', ...dateGroups.map(d => d.label)];

        const bodyRows = metrics.map(m => [
            m.baseMetricName,
            m.reportingPeriod,
            ...dateGroups.map(({label, backfill}) => {
                const values = backfill ? m.backfillValues : m.values;
                const date = dateValuesForLabel[label].find(key => values[key]);
                const data = is_set(date) ? values[date] : undefined;

                if (!data) {
                    return null;
                }

                if (!backfill && data.missing) {
                    return <WarningText>Required</WarningText>;
                }

                if (!is_set(data.value)) {
                    return <Muted>N/A</Muted>;
                }

                return genFormatter(m.format)(data.value);
            }),
        ]);

        const rows = [headerRow, ...bodyRows];

        const rowCount = rows.length;
        const columnCount = headerRow.length;

        return (
            <MetricDataTableWrapper>
                <AutoSizer>
                    {({height, width}) => (
                        <MultiGrid
                            cellRenderer={this.cellRenderer(rows, backfillDates.length)}
                            columnWidth={this.columnWidth(columnCount, width)}
                            rowHeight={this.rowHeight}
                            columnCount={columnCount}
                            rowCount={rowCount}
                            fixedColumnCount={this.fixedColumnCount}
                            fixedRowCount={this.fixedRowCount}
                            width={width}
                            height={height}
                            enableFixedColumnScroll
                            // enableFixedRowScroll
                            classNameTopRightGrid='gridTopRight'
                            classNameBottomLeftGrid='gridBottomLeft'
                            scrollToColumn={columnCount - 1}
                        />
                    )}
                </AutoSizer>
            </MetricDataTableWrapper>
        );
    }
}

export default class ReportingDataViewer extends React.Component {
    state = {
        activeTabIdx: 0,
    };

    componentDidUpdate({tabs: prevTabs}) {
        const {tabs} = this.props;

        if (prevTabs !== tabs && this.state.activeTabIdx > 0) {
            this.setState({activeTabIdx: 0});
        }
    }

    setActiveTab = idx => {
        this.setState({activeTabIdx: idx});
    };

    renderBody = activeTab => {
        switch (activeTab.type) {
            case 'metrics':
                return (
                    <MetricDataTable
                        key={activeTab.name}
                        dates={activeTab.dates}
                        backfillDates={activeTab.backfillDates}
                        metrics={activeTab.metrics}
                    />
                );
            case 'metaData':
                return (
                    <MetaDataWrapper>
                        <MetaDataTable metaData={activeTab.data} />
                    </MetaDataWrapper>
                );
            case 'supportingDocuments':
                return (
                    <MetaDataWrapper>
                        <MetaDataTable
                            metaData={[
                                {
                                    ...activeTab.data,
                                    values: (activeTab?.data?.values ?? []).map(
                                        ({name, file_name, document_index_uid}) => ({
                                            label: name,
                                            value: (
                                                <A
                                                    onClick={() =>
                                                        downloadDataTraceFile(document_index_uid)
                                                    }
                                                >
                                                    {file_name}
                                                </A>
                                            ),
                                        }),
                                    ),
                                },
                            ]}
                        />
                    </MetaDataWrapper>
                );
        }
    };

    render() {
        const {tabs, onSetActiveSheet, ...rest} = this.props;
        const {activeTabIdx} = this.state;

        const activeTab = tabs[activeTabIdx];

        return (
            <TabViewWrapper {...rest}>
                <TabViewHeader>
                    {tabs.map((t, idx) => (
                        <Tab
                            key={t.name}
                            active={t.name === activeTab.name}
                            onClick={() => {
                                onSetActiveSheet?.(idx);
                                this.setActiveTab(idx);
                            }}
                        >
                            {t.name}
                        </Tab>
                    ))}
                </TabViewHeader>
                <TabViewBody>{this.renderBody(activeTab)}</TabViewBody>
            </TabViewWrapper>
        );
    }
}
