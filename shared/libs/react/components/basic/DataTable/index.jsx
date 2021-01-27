import React from 'react';
import PropTypes from 'prop-types';
import styled, {css, keyframes} from 'styled-components';
import {Table, Column, createMultiSort} from 'react-virtualized/dist/es/Table';
import {defaultTableRowRenderer} from 'react-virtualized';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import memoize from 'lodash.memoize';

import ExtraPropTypes from 'utils/extra-prop-types';

import RoundCheckbox from 'components/basic/forms/RoundCheckbox';

import ColumnChecklistDropdown from './ColumnChecklistDropdown';

import Icon from 'components/basic/Icon';
import Loader from 'components/basic/Loader';
import {gen_sort_comp_fn} from 'src/libs/Utils';
import {Flex} from '@rebass/grid';

import {defaultCellRenderer} from './cellRenderers';
import {defaultCellDataGetter} from './cellDataGetters';

const StyledTable = styled(Table)`
    width: 100%;

    * {
        outline: none;
    }

    .evenRow,
    .oddRow {
        font-size: 12px;
        color: ${({theme}) => theme.dataTable.rowFg};
    }

    .evenRow {
        background-color: ${({theme}) => theme.dataTable.evenRowBg};
        border: 1px solid ${({theme}) => theme.dataTable.headerRowBorder};
        border-top: 0;
        border-bottom: 0;
    }

    .oddRow {
        background-color: ${({theme}) => theme.dataTable.oddRowBg};
        border: 1px solid ${({theme}) => theme.dataTable.headerRowBorder};
    }

    .headerRow {
        user-select: none;
        color: ${({theme}) => theme.dataTable.headerRowFg};
        background-color: ${({theme}) => theme.dataTable.headerRowBg};
        border-top: 1px solid ${({theme}) => theme.dataTable.headerRowBorder};
        border-bottom: 1px solid ${({theme}) => theme.dataTable.headerRowBorder};
    }

    .clickableRow {
        &:hover {
            background-color: ${({theme}) => theme.dataTable.clickableRowHover};
        }
        cursor: pointer;
    }

    .selectedRow {
        background-color: ${({theme}) => theme.dataTable.activeRowBg};
    }

    .headerColumn {
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        vertical-align: middle;
        line-height: 12px;
        white-space: nowrap;
    }

    .headerCell {
        display: inline-block;
        max-width: 100%;
        vertical-align: middle;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .rightAlignedColumn {
        text-align: right;
    }
`;

const FixedRoundCheckbox = styled(RoundCheckbox)`
    position: fixed;
`;

const ColumnToggleButton = styled.a`
    font-size: 13px;
    padding: 2px 5px 1px;
    color: ${({theme}) => theme.dataTable.columnToggleFg};
    background-color: ${({theme}) => theme.dataTable.columnToggleBg};
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.1);
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    border: 1px solid transparent;
    white-space: nowrap;
    border-radius: 4px;
    user-select: none;

    &:hover {
        color: ${({theme}) => theme.dataTable.columnToggleHover};
    }
`;

const ToggleWrapper = styled.div`
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 3;
`;

const HeaderWrapper = styled.div`
    background-color: ${({theme}) => theme.dataTable.headerBg};
    padding: 10px 15px;
    font-weight: 300;
`;

const HeaderLabel = styled.span`
    color: ${({theme}) => theme.dataTable.headerLabelFg};
    margin-right: 5px;
`;

const HeaderPageInfo = styled.span`
    font-size: 12px;
    color: ${({theme}) => theme.dataTable.headerPageInfoFg};
`;

const Header = ({label, pageInfo}) => (
    <HeaderWrapper>
        {label && <HeaderLabel>{label}</HeaderLabel>}
        {pageInfo && <HeaderPageInfo>{pageInfo}</HeaderPageInfo>}
    </HeaderWrapper>
);
const PaginationLink = styled.a`
    color: ${props =>
        props.isActive ? props.theme.dataTable.controlsActiveFg : props.theme.dataTable.controlsFg};
    font-size: 12px;

    padding: 8px 13px;
    text-decoration: none;
    user-select: none;

    border-radius: 2px;

    margin: 0 5px;

    cursor: ${props => (props.isActive ? 'auto' : 'pointer')};

    background-color: ${props =>
        props.isActive ? props.theme.dataTable.controlsActiveBg : props.theme.dataTable.controlsBg};

    &:hover {
        text-decoration: none;
        background-color: ${({theme}) => theme.dataTable.controlsActiveBg};
        color: ${({theme}) => theme.dataTable.controlsActiveFg};
    }
`;

const PaginationIcon = styled(Icon)`
    color: ${({theme}) => theme.dataTable.controlsIconFg};
    font-size: 20px;

    padding: 2px;
    text-decoration: none;
    user-select: none;

    opacity: ${props => (props.isEnabled ? '1' : '0.5')};

    cursor: ${props => (props.isEnabled ? 'pointer' : 'auto')};

    ${props =>
        props.isEnabled &&
        css`
            &:hover {
                text-decoration: none;
                color: ${({theme}) => theme.dataTable.controlsIconHover};
            }
        `}
`;

const PaginationContainer = styled.div`
    z-index: 3;
    width: 100%;
`;

class Pagination extends React.Component {
    pages = () => {
        const {page, pageDisplayLimit} = this.props;

        const pageCount = this.pageCount();

        if (pageCount > 1) {
            const jumps = pageDisplayLimit;
            const split = Math.floor(pageDisplayLimit / 2);

            let high = Math.max(page + split, jumps - 1);
            let low = Math.min(page - split, pageCount - jumps);

            low = Math.max(low, 0);
            high = Math.min(high, pageCount - 1);

            return low.upto(high);
        }
    };

    pageCount = () => Math.ceil(this.props.count / this.props.resultsPerPage);
    isFirst = () => this.props.page === this.firstPage();
    isLast = () => this.props.page === this.lastPage();

    lastPage = () => this.pageCount() - 1;
    firstPage = () => 0;
    nextPage = () => Math.min(this.props.page + 1, this.lastPage());
    prevPage = () => Math.max(this.props.page - 1, this.firstPage());

    render() {
        const {page: currentPage, onPageChanged, pageDisplayLimit} = this.props;

        const pages = this.pages();

        const isFirst = currentPage === this.firstPage();
        const isLast = currentPage === this.lastPage();

        if (pages) {
            const items = pages.map(page => (
                <PaginationLink
                    key={page}
                    isActive={currentPage === page}
                    onClick={() => onPageChanged(page)}
                >
                    {page + 1}
                </PaginationLink>
            ));

            // Show quick nav if we have more pages than we can show
            if (this.pageCount() > pageDisplayLimit) {
                items.unshift(
                    <PaginationIcon
                        key='double-left'
                        name='angle-double-left'
                        isEnabled={!isFirst}
                        onClick={() => onPageChanged(this.firstPage())}
                    />,
                    <PaginationIcon
                        key='single-left'
                        name='left-dir'
                        isEnabled={!isFirst}
                        onClick={() => onPageChanged(this.prevPage())}
                    />,
                );
                items.push(
                    <PaginationIcon
                        key='double-right'
                        name='right-dir'
                        isEnabled={!isLast}
                        onClick={() => onPageChanged(this.nextPage())}
                    />,
                    <PaginationIcon
                        key='single-right'
                        name='angle-double-right'
                        isEnabled={!isLast}
                        onClick={() => onPageChanged(this.lastPage())}
                    />,
                );
            }

            return (
                <PaginationContainer>
                    <Flex justifyContent='center' flexWrap='nowrap'>
                        {items}
                    </Flex>
                </PaginationContainer>
            );
        }

        return null;
    }
}

const HorizontalScrollWrapper = styled.div`
    display: flex;
    height: 100%;
    overflow-x: ${props => (props.enableScroll ? 'auto' : 'visible')};
    width: ${({setWidth}) => setWidth}px;
`;

const TableWrapper = styled.div`
    flex: 1;
    position: relative;
    margin-bottom: ${props => (props.enablePagination ? '12px' : 0)};
    min-width: ${props => (props.minWidth ? `${props.minWidth}px` : '100%')};
    overflow: hidden;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: ${props => (props.pushHeight ? undefined : 1)};
    height: ${props => (props.pushHeight ? `${props.pushHeight}px` : '100%')};
    width: 100%;
    position: relative;
`;

const EmptyWrapper = styled.div`
    width: 100%;
    font-size: 13px;
    font-weight: 200;
    color: ${({theme}) => theme.dataTable.emptyFg};
    padding: 10px;
    background-color: ${({theme}) => theme.dataTable.emptyBg};
    text-align: middle;

    > .glyphicon {
        margin-right: 3px;
        vertical-align: top;
    }
`;

const blink = keyframes`
    50% {
        opacity: 0;
    }
`;

const fade = keyframes`
    0% { opacity: 0; }
    100% { opacity: 1; }
`;

const ScrollIndicatorContainer = styled.div`
    position: absolute;

    ${props =>
        props.top &&
        css`
            top: ${props.top}px;
        `}

    ${props =>
        props.bottom &&
        css`
            bottom: ${props.bottom}px;
        `}

    right: 25px;
    z-index: 3;
    width: 30px;
    padding: 5px;
    border-radius: 2px;
    cursor: pointer;

    color: ${({theme}) => theme.dataTable.controlsFg};
    background-color: ${({theme}) => theme.dataTable.controlsBg};
    font-size: 14px;
    text-align: center;

    &:hover {
        background-color: ${({theme}) => theme.dataTable.controlsActiveBg};
        color: ${({theme}) => theme.dataTable.controlsActiveFg};
    }

    ${props =>
        props.blink
            ? css`
                  animation: ${blink} 0.8s linear 3;
              `
            : css`
                  animation: ${fade} 0.3s linear 1;
              `}
`;

const ScrollIndicator = ({icon, ...rest}) => (
    <ScrollIndicatorContainer {...rest}>
        <Icon glyphicon name={icon} />
    </ScrollIndicatorContainer>
);
const ColumnToggle = ({allColumns, visibleColumns, onToggleColumn, onToggleAllColumns}) => (
    <ToggleWrapper>
        <ColumnChecklistDropdown
            options={allColumns.filter(({label}) => label !== undefined)}
            selected={visibleColumns.map(({key}) => key)}
            onSelect={onToggleColumn}
            onToggleAll={onToggleAllColumns}
        >
            <ColumnToggleButton>
                <Icon glyphicon name='cog'></Icon>
            </ColumnToggleButton>
        </ColumnChecklistDropdown>
    </ToggleWrapper>
);
const paginate = (rows, page, resultsPerPage) => {
    const offset = page * resultsPerPage;

    return rows.slice(offset, offset + resultsPerPage);
};

const sort = (rows, sortBy, sortDirection, sortKeyMap) => {
    const sortedRows = rows.slice();

    const sortByReversed = sortBy.slice().reverse();

    for (const dataKey of sortByReversed) {
        sortedRows.sort(gen_sort_comp_fn(sortKeyMap[dataKey], sortDirection[dataKey] === 'DESC'));
    }

    return sortedRows;
};

const genSortKeyMap = columns => {
    const map = {};

    for (const item of columns) {
        map[item.key] = item.sortKey || item.key;
    }

    return map;
};

function processRows(
    rows,
    columns,
    enableSorting,
    sortBy,
    sortDirection,
    enablePagination,
    page,
    resultsPerPage,
) {
    let processedRows = rows;

    if (enableSorting) {
        const sortKeyMap = genSortKeyMap(columns);
        processedRows = sort(processedRows, sortBy, sortDirection, sortKeyMap);
    }

    if (enablePagination) {
        processedRows = paginate(processedRows, page, resultsPerPage);
    }

    return processedRows;
}

const filterColumns = (columns, hiddenKeys) => columns.filter(({key}) => !hiddenKeys.includes(key));

const genPageInfo = (enablePagination, page, resultsPerPage, visibleCount, totalCount) => {
    if (enablePagination && resultsPerPage && visibleCount) {
        const start = page * resultsPerPage;

        return `${start + 1} to ${start + visibleCount} of ${totalCount}`;
    }

    return null;
};

class DataTable extends React.Component {
    constructor(props) {
        super(props);

        this.sortState = createMultiSort(({sortBy, sortDirection}) => {
            const {onSortingChanged, columns} = this.props;

            this.setState({
                sortBy,
                sortDirection,
            });

            const sortKeyMap = genSortKeyMap(columns);

            if (typeof onSortingChanged === 'function') {
                onSortingChanged(
                    sortBy.map(dataKey => ({
                        name: sortKeyMap[dataKey],
                        sort: sortDirection[dataKey].toLowerCase(),
                    })),
                );
            }
        });

        this.tableRef = React.createRef();
    }

    static rowHeight = 35;
    static headerHeight = 37;
    static contextHeaderHeight = 39;

    static defaultProps = {
        defaultHiddenColumns: [],

        enableSelection: false,
        enableRowClick: false,
        selectOnRowClick: true,

        enableColumnToggle: true,

        enableSorting: true,
        sortInline: true,

        enablePagination: false,
        resultsPerPage: 50,
        pageDisplayLimit: 5, // Max number of pages to show in pagination
        paginateInline: true,

        enableContextHeader: false,
        rowsAreFiltered: false,
        isLoading: false,
        enableHeaderRow: true,
        columnMinWidth: 100,
        enableHorizontalScrolling: true,
    };

    static propTypes = {
        rowKey: ExtraPropTypes.maybeRequired(PropTypes.string, 'enableRowClick', 'enableSelection'),

        rows: PropTypes.arrayOf(PropTypes.object).isRequired,
        columns: PropTypes.arrayOf(
            PropTypes.shape({
                key: PropTypes.string.isRequired,
                label: PropTypes.string,
                disableSort: PropTypes.bool,
                link: PropTypes.string,
                width: PropTypes.number,
                flexGrow: PropTypes.number,
                flexShrink: PropTypes.number,

                right: PropTypes.bool,
                formatter: PropTypes.func,
                format: PropTypes.string, // Old style format

                // Override these for custom cells (buttons etc)
                cellDataGetter: PropTypes.func,
                cellRenderer: PropTypes.func,
                headerRenderer: PropTypes.func,
            }),
        ).isRequired,
        defaultHiddenColumns: PropTypes.arrayOf(PropTypes.string),

        enableSorting: PropTypes.bool,
        onSortingChanged: PropTypes.func,
        sortInline: PropTypes.bool.isRequired,
        defaultSortBy: PropTypes.arrayOf(PropTypes.string),
        defaultSortDirection: PropTypes.object,

        enableSelection: PropTypes.bool,
        onSelectionChanged: PropTypes.func,
        selectOnRowClick: PropTypes.bool,
        selection: PropTypes.arrayOf(PropTypes.string),
        rowSelectablePredicate: PropTypes.func,

        enableRowClick: PropTypes.bool,
        onRowClick: PropTypes.func,
        onContextMenu: PropTypes.func,

        enableColumnToggle: PropTypes.bool,
        onColumnToggle: PropTypes.func,

        enablePagination: PropTypes.bool,
        paginateInline: PropTypes.bool,
        pageDisplayLimit: PropTypes.number,
        resultsPerPage: PropTypes.number,
        onPageChanged: PropTypes.func,
        totalCount: PropTypes.number,

        label: PropTypes.string,
        enableContextHeader: PropTypes.bool,

        rowsAreFiltered: PropTypes.bool,
        isLoading: PropTypes.bool,
        noRowsRenderer: PropTypes.func,
        enableHeaderRow: PropTypes.bool,
        pushHeight: PropTypes.bool,

        columnMinWidth: PropTypes.number,
        enableHorizontalScrolling: PropTypes.bool,

        theme: PropTypes.object,
    };

    state = {
        selectAll: false,
        selection: [],
        sortBy: [...(this.props.defaultSortBy || [])],
        sortDirection: {...this.props.defaultSortDirection},
        hiddenColumns: this.props.defaultHiddenColumns || [],
        page: 0,
        showScrollBottom: null,
        blinkScrollBottom: false,
        isHovered: false,
        showScrollTop: false,
    };

    getTableData = () => {
        return {
            columns: this.props.columns,
            rows: processRows(
                this.props.rows,
                this.props.columns,
                this.props.enableSorting && this.props.sortInline,
                this.state.sortBy,
                this.state.sortDirection,
                this.props.enablePagination && this.props.paginateInline,
                this.state.page,
                this.props.resultsPerPage,
            ),
        };
    };

    static getDerivedStateFromProps(props, state) {
        return {
            ...state,
            selection: props.selection || state.selection,
            selectAll: props.selectAll || state.selectAll,
        };
    }

    handleRowsRendered = visibleCount => ({startIndex, stopIndex}) => {
        const newState = {
            showScrollTop: false,
            showScrollBottom: false,
            blinkScrollBottom: false,
        };

        const lastIndex = visibleCount - 1;

        if (startIndex === 0 && stopIndex < lastIndex) {
            newState.showScrollBottom = true;

            if (this.state.showScrollBottom === null) {
                newState.blinkScrollBottom = true;
            }
        } else if (startIndex > 0 && stopIndex === lastIndex) {
            newState.showScrollTop = true;
        }

        const didChange = Object.keys(newState).reduce(
            (didChange, key) => didChange || newState[key] !== this.state[key],
            false,
        );

        if (didChange) {
            this.setState(newState);
        }
    };

    handleRowClick = ({index, rowData}) => {
        const {onRowClick, rowKey} = this.props;

        if (typeof onRowClick === 'function') {
            onRowClick(rowData, index);
        }

        if (this.selectOnRowClick()) {
            this.handleToggleSelection(rowData[rowKey]);
        }
    };

    handlePageChanged = page => {
        const {onPageChanged} = this.props;

        if (typeof onPageChanged === 'function') {
            onPageChanged(page);
        }

        this.setState({page});
    };

    handleToggleAllColumns = () => {
        const {columns, onColumnToggle} = this.props;

        if (this.state.hiddenColumns.length === 0) {
            // If all columns are shown, toggling all should hide all columns
            let hiddenColumns = columns.map(col => col.key);
            if (typeof onColumnToggle === 'function') {
                onColumnToggle(hiddenColumns);
            }

            this.setState({hiddenColumns});
        } else {
            // Otherwise, we should set all columns to shown
            let hiddenColumns = [];
            if (typeof onColumnToggle === 'function') {
                onColumnToggle(hiddenColumns);
            }

            this.setState({hiddenColumns});
        }
    };

    handleToggleColumn = key => {
        const {onColumnToggle} = this.props;

        let hiddenColumns = [...this.state.hiddenColumns];
        const keyIndex = hiddenColumns.indexOf(key);

        if (keyIndex >= 0) {
            hiddenColumns = [
                ...hiddenColumns.slice(0, keyIndex),
                ...hiddenColumns.slice(keyIndex + 1),
            ];
        } else {
            hiddenColumns.push(key);
        }

        if (typeof onColumnToggle === 'function') {
            onColumnToggle(hiddenColumns);
        }

        this.setState({hiddenColumns});
    };

    handleToggleAllSelection = () => {
        const {rowKey, rows, onSelectionChanged, rowSelectablePredicate} = this.props;

        const selectAll = !this.state.selectAll;
        const selection = [];

        if (selectAll) {
            rows.forEach(item => {
                if (!rowSelectablePredicate || rowSelectablePredicate(item)) {
                    selection.push(item[rowKey]);
                }
            });
        }

        if (typeof onSelectionChanged === 'function') {
            onSelectionChanged(selection);
        }

        this.setState({selectAll, selection});
    };

    handleToggleSelection = key => {
        const {onSelectionChanged, singleSelection} = this.props;

        let selection = [];
        if (!singleSelection) {
            selection = [...this.state.selection];
        }

        const keyIndex = selection.indexOf(key);

        if (keyIndex >= 0 && !singleSelection) {
            selection = [...selection.slice(0, keyIndex), ...selection.slice(keyIndex + 1)];
        } else {
            selection.push(key);
        }

        if (typeof onSelectionChanged === 'function') {
            onSelectionChanged(selection);
        }

        this.setState({selection});
    };

    handleCheckboxClick = cellData => event => {
        event.stopPropagation();
        return !this.selectOnRowClick() && this.handleToggleSelection(cellData);
    };

    emptyChildren = () => {
        const {rowsAreFiltered} = this.props;

        if (rowsAreFiltered) {
            return ['No matching results. Please modify your filters.'];
        }

        return ['No data to display.'];
    };

    defaultNoRowsRenderer = () => <EmptyWrapper>{this.emptyChildren()}</EmptyWrapper>;

    defaultHeaderRenderer = ({dataKey, columnData, label}) => {
        const children = [];

        if (this.props.enableSorting && !columnData.disableSort) {
            const isSorting = this.sortState.sortBy.includes(dataKey);

            const sortDirection = isSorting && this.sortState.sortDirection[dataKey].toLowerCase();
            let sortSuffix = '';
            if (sortDirection === 'desc') {
                sortSuffix = '-down';
            } else if (sortDirection === 'asc') {
                sortSuffix = '-up';
            }

            children.push(<span key='icon' className={`icon-sort${sortSuffix}`} />);
        }

        children.push(
            <span className='headerCell' key='label' title={label}>
                {label}
            </span>,
        );

        return children;
    };

    selectOnRowClick = () => {
        const {enableRowClick, selectOnRowClick, enableSelection} = this.props;

        return enableSelection && enableRowClick && selectOnRowClick;
    };

    selectionCellRenderer = ({cellData, rowData}) => {
        if (this.props.rowSelectablePredicate) {
            return this.props.rowSelectablePredicate(rowData) ? (
                <FixedRoundCheckbox
                    checked={this.state.selection.includes(cellData)}
                    onClick={this.handleCheckboxClick(cellData)}
                />
            ) : null;
        }
        return (
            <FixedRoundCheckbox
                checked={this.state.selection.includes(cellData)}
                onClick={this.handleCheckboxClick(cellData)}
            />
        );
    };

    selectionHeaderRenderer = () => {
        if (this.props.singleSelection) {
            return null;
        }

        return (
            <RoundCheckbox
                checked={this.state.selectAll}
                onClick={() => this.handleToggleAllSelection()}
            />
        );
    };

    rowClassName = processedRows =>
        memoize(({index}) => {
            if (index < 0) {
                return 'headerRow';
            }

            const classNames = [];

            if (this.props.enableRowClick) {
                classNames.push('clickableRow');
            }

            const rowData = processedRows[index];
            if (this.state.selection.includes(rowData[this.props.rowKey])) {
                classNames.push('selectedRow');
            }

            classNames.push(index % 2 === 0 ? 'evenRow' : 'oddRow');

            return classNames.join(' ');
        });

    renderSelectionColumn = rowKey => (
        <Column
            disableSort
            dataKey={rowKey}
            cellRenderer={this.selectionCellRenderer}
            headerRenderer={this.selectionHeaderRenderer}
            className='selectionColumn'
            width={37}
        />
    );

    renderColumn = (column, defaultWidth) => (
        <Column
            key={column.key}
            label={column.label}
            dataKey={column.key}
            disableSort={column.disableSort}
            cellDataGetter={column.cellDataGetter || defaultCellDataGetter}
            cellRenderer={column.cellRenderer || defaultCellRenderer}
            width={column.width || defaultWidth}
            flexGrow={column.flexGrow}
            flexShrink={column.flexShrink}
            headerRenderer={column.headerRenderer || this.defaultHeaderRenderer}
            columnData={column}
            className={column.right && 'rightAlignedColumn'}
            headerClassName={column.right && 'rightAlignedColumn'}
        />
    );

    scrollToRow = index => {
        this.tableRef.current.scrollToRow(index);
    };

    tableHeight = (processedRows, expandedTable, expansionHeight) => {
        let calculatedHeight =
            DataTable.rowHeight * (processedRows.length || 1) +
            (expandedTable ? expansionHeight : 0);

        if (this.props.enableHeaderRow) {
            calculatedHeight += DataTable.headerHeight;
        }

        if (this.props.enableContextHeader) {
            calculatedHeight += DataTable.contextHeaderHeight;
        }

        return calculatedHeight + (this.props.enablePagination ? 50 : 0);
    };

    render() {
        const {
            rowKey,
            rows,
            columns,
            enableSelection,
            enableSorting,
            sortInline,
            enableRowClick,
            noRowsRenderer,
            enablePagination,
            paginateInline,
            resultsPerPage,
            pageDisplayLimit,
            enableColumnToggle,
            enableContextHeader,
            label,
            isLoading,
            enableHeaderRow,
            pushHeight,
            columnMinWidth,
            enableHorizontalScrolling,
            rowRenderer,
            rowHeight,
            expandedTable,
            expansionHeight,
        } = this.props;

        const {
            sortBy,
            sortDirection,
            page,
            hiddenColumns,
            showScrollBottom,
            showScrollTop,
            blinkScrollBottom,
        } = this.state;

        const processedRows = processRows(
            rows,
            columns,
            enableSorting && sortInline,
            sortBy,
            sortDirection,
            enablePagination && paginateInline,
            page,
            resultsPerPage,
        );
        const visibleCount = processedRows.length;
        const totalCount = this.props.totalCount || rows.length;
        const visibleColumns = filterColumns(columns, hiddenColumns);

        const pageInfo = genPageInfo(
            enablePagination,
            page,
            resultsPerPage,
            visibleCount,
            totalCount,
        );

        const minWidth = visibleColumns.reduce(
            (sum, col) => sum + (col.width || columnMinWidth),
            0,
        );
        return (
            <Wrapper
                pushHeight={
                    pushHeight && this.tableHeight(processedRows, expandedTable, expansionHeight)
                }
            >
                {enableColumnToggle && (
                    <ColumnToggle
                        allColumns={columns}
                        visibleColumns={visibleColumns}
                        onToggleColumn={this.handleToggleColumn}
                        onToggleAllColumns={this.handleToggleAllColumns}
                    />
                )}
                {enableContextHeader && <Header label={label} pageInfo={pageInfo} />}
                {showScrollBottom && (
                    <ScrollIndicator
                        bottom={enablePagination ? 70 : 25}
                        blink={blinkScrollBottom}
                        onClick={() => this.scrollToRow(visibleCount - 1)}
                        icon='menu-down'
                    />
                )}
                {showScrollTop && (
                    <ScrollIndicator
                        top={
                            enableContextHeader
                                ? enableHeaderRow
                                    ? 100
                                    : 63
                                : enableHeaderRow
                                ? 60
                                : 23
                        }
                        onClick={() => this.scrollToRow(0)}
                        icon='menu-up'
                    />
                )}
                <AutoSizer disableHeight style={{flex: '1'}}>
                    {({width}) => (
                        <HorizontalScrollWrapper
                            enableScroll={enableHorizontalScrolling}
                            setWidth={width}
                        >
                            <TableWrapper enablePagination={enablePagination} minWidth={minWidth}>
                                {isLoading ? (
                                    <Loader />
                                ) : (
                                    <AutoSizer>
                                        {({width, height}) => (
                                            <StyledTable
                                                ref={this.tableRef}
                                                disableHeader={!enableHeaderRow}
                                                onRowsRendered={this.handleRowsRendered(
                                                    visibleCount,
                                                )}
                                                sort={
                                                    (enableSorting && this.sortState.sort) ||
                                                    undefined
                                                }
                                                onRowClick={
                                                    (enableRowClick && this.handleRowClick) ||
                                                    undefined
                                                }
                                                width={width}
                                                height={height}
                                                headerHeight={DataTable.headerHeight}
                                                rowHeight={rowHeight || DataTable.rowHeight}
                                                headerClassName='headerColumn'
                                                rowClassName={this.rowClassName(processedRows)}
                                                rowCount={processedRows.length}
                                                rowGetter={({index}) => processedRows[index]}
                                                rowRenderer={rowRenderer || defaultTableRowRenderer}
                                                noRowsRenderer={
                                                    noRowsRenderer || this.defaultNoRowsRenderer
                                                }
                                            >
                                                {enableSelection &&
                                                    this.renderSelectionColumn(rowKey)}
                                                {visibleColumns.map(column =>
                                                    this.renderColumn(
                                                        column,
                                                        width / visibleColumns.length,
                                                    ),
                                                )}
                                            </StyledTable>
                                        )}
                                    </AutoSizer>
                                )}
                            </TableWrapper>
                        </HorizontalScrollWrapper>
                    )}
                </AutoSizer>
                {enablePagination && (
                    <Pagination
                        count={totalCount}
                        page={page}
                        resultsPerPage={resultsPerPage}
                        pageDisplayLimit={pageDisplayLimit}
                        onPageChanged={this.handlePageChanged}
                    />
                )}
            </Wrapper>
        );
    }
}

export default DataTable;
