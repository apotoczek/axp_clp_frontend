import React, {Component, useCallback, useMemo} from 'react';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import memoize from 'lodash.memoize';
import {Flex, Box} from '@rebass/grid';

import ExtraPropTypes from 'utils/extra-prop-types';
import {PageFormat} from 'src/libs/Enums';
import dashboardComponents from 'libs/dashboard-components';

import {Viewport, ScrollableContent} from 'components/layout';

import ComponentBarContainer from 'containers/dashboards/ComponentBarContainer';

import ReportPage from 'components/dashboards/ReportPage';

import {Column, Columns} from './shared';

const PagesWrapper = styled.div`
    padding: 24px 0;
    position: relative;
    z-index: 0;
`;

const PageWrapper = styled(Box)`
    height: ${props => props.height}px;
    width: ${props => props.width}px;
    margin: 8px auto;
    position: relative;
`;

const EditGridItem = styled.div`
    position: relative;
    cursor: move;

    ${Viewport} {
        pointer-events: none;
    }

    ${props =>
        props.selected &&
        css`
            ${Viewport} {
                pointer-events: auto;
            }

            opacity: 1;
        `}

    ${props =>
        !props.selected &&
        props.componentKey !== 'rect' &&
        css`
            border: 1px solid #e1e1e1;
        `}

    ${props =>
        props.selected &&
        css`
            border: 1px dashed #283142;

            > .react-resizable-handle {
                position: absolute;
                width: 30px;
                height: 30px;
                bottom: 0;
                right: 0;
                cursor: nwse-resize;
            }

            > .react-resizable-handle::after {
                content: '';
                position: absolute;
                right: -4px;
                bottom: -4px;
                width: 8px;
                height: 8px;
                background: rgba(255, 255, 255);
                border: 1px solid rgba(0, 0, 0, 0.6);
            }
        `}

`;

const PageIndicatorWrapper = styled(Flex)`
    background: ${({theme}) => theme.dashboard.pageIndicator.bg};
    color: ${({theme}) => theme.dashboard.pageIndicator.fg};
    font-size: 12px;
    justify-content: center;
    align-items: center;
    padding: 4px 6px;

    position: absolute;
    right: 0;
    top: 0;
    transform: translateX(150%);
    display: inline-block;
`;

const CSSLeftArrow = styled.div`
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    position: absolute;
    left: -5px;
    top: 8px;

    border-right: 5px solid ${({theme}) => theme.dashboard.pageIndicator.bg};
`;

function PageIndicator({currentPage, pageCount}) {
    return (
        <PageIndicatorWrapper>
            {currentPage} of {pageCount}
            <CSSLeftArrow />
        </PageIndicatorWrapper>
    );
}

const Pages = React.forwardRef(
    (
        {
            dashboard,
            pageRefs,
            layoutChanged,
            layoutEngine,
            pageIndices,
            setSharedState,
            sharedState,
            selectComponent,
            toggleComponentSettings,
            setDashboardSize,
            updateComponentSpec,
            layoutData,
            componentData,
            selectedComponentId,
            onChangeComponentPage,
            selectedLayoutData,
            onChangePage,
            currentPageIdx,
            onResizeComponentStart,
            onResizeComponentStop,
        },
        ref,
    ) => {
        const handleDropOutside = useCallback(
            (item, up, rows, cols) => onChangeComponentPage(item.i, up, rows, cols),
            [onChangeComponentPage],
        );

        const handleDragOutside = useCallback(
            (_item, direction) => {
                const newPage = selectedLayoutData.pageIdx + direction;
                if (newPage != currentPageIdx) {
                    onChangePage(newPage);
                }
            },
            [currentPageIdx, onChangePage, selectedLayoutData],
        );

        const handleDragInside = useCallback(
            _item => {
                if (currentPageIdx != selectedLayoutData.pageIdx) {
                    onChangePage(selectedLayoutData.pageIdx);
                }
            },
            [currentPageIdx, onChangePage, selectedLayoutData],
        );

        const handleLayoutChange = useCallback(
            newLayout => {
                const changed = !isEqual(layoutData, newLayout);

                if (changed) {
                    layoutChanged(newLayout);
                }
            },
            [layoutChanged, layoutData],
        );

        const layoutDataForPage = useMemo(
            () => memoize(page => layoutData.filter(component => (component.pageIdx || 0) == page)),
            [layoutData],
        );

        return (
            <PagesWrapper ref={ref}>
                {pageIndices.map(page => (
                    <PageWrapper
                        key={page}
                        ref={el => (pageRefs[page] = el)}
                        width={layoutEngine.pageWidth}
                        height={layoutEngine.pageHeight}
                    >
                        <ReportPage
                            isEditing
                            onLayoutChange={handleLayoutChange}
                            onSelection={selectComponent}
                            toggleComponentSettings={toggleComponentSettings}
                            onResizeDashboard={setDashboardSize}
                            onResizeComponentStart={onResizeComponentStart}
                            onResizeComponentStop={onResizeComponentStop}
                            updateComponentSpec={updateComponentSpec}
                            pageIdx={page}
                            pageCount={pageIndices.length}
                            gridItemComponent={EditGridItem}
                            layoutData={layoutDataForPage(page)}
                            componentData={componentData}
                            sharedState={sharedState[selectedComponentId]}
                            selectedComponentId={selectedComponentId}
                            onSharedStateChange={setSharedState}
                            preventCollision={dashboard.settings.template.preventCollision}
                            disableCompact={dashboard.settings.template.disableCompact}
                            pageBgColor={dashboard.settings.template.backgroundColor}
                            components={dashboardComponents}
                            onDropOutside={handleDropOutside}
                            onDragOutside={handleDragOutside}
                            onDragInside={handleDragInside}
                            layoutEngine={layoutEngine}
                        />
                        {layoutEngine.pageFormat !== PageFormat.DASHBOARD && (
                            <PageIndicator currentPage={page + 1} pageCount={pageIndices.length} />
                        )}
                    </PageWrapper>
                ))}
            </PagesWrapper>
        );
    },
);
Pages.displayName = 'Pages';

export default class Editor extends Component {
    static propTypes = {
        dashboard: PropTypes.shape({
            settings: PropTypes.shape({
                preventCollision: PropTypes.bool,
                disableCompact: PropTypes.bool,
                backgroundColor: PropTypes.string,
                template: PropTypes.shape({
                    format: ExtraPropTypes.valueFromEnum(PageFormat).isRequired,
                }).isRequired,
            }),
        }).isRequired,
        layoutData: PropTypes.arrayOf(PropTypes.object).isRequired,
        componentData: PropTypes.object.isRequired,
        selectedLayoutData: PropTypes.object,

        selectedComponentId: ExtraPropTypes.uuid,
        dashboardNbrOfPages: PropTypes.number.isRequired,

        layoutChanged: PropTypes.func.isRequired,
        selectComponent: PropTypes.func.isRequired,
        setDashboardSize: PropTypes.func.isRequired,
        updateComponentSpec: PropTypes.func.isRequired,
        changeComponentPage: PropTypes.func.isRequired,

        onChangePage: PropTypes.func.isRequired,
        columnRef: PropTypes.shape({
            current: PropTypes.instanceOf(Element),
        }),
    };

    state = {
        currentPageIdx: 0,
        sharedState: {},
    };

    pageRefs = [];

    setSharedState = (componentId, payload) => {
        this.setState(prevState => ({
            sharedState: {
                ...prevState.sharedState,
                [componentId]: {...payload},
            },
        }));
    };

    updateActivePageFromScrollPosition = event => {
        if (this.props.layoutEngine.pageFormat === PageFormat.DASHBOARD) {
            return;
        }

        const scrollY = event.target.scrollTop;
        const pageHeight = this.props.layoutEngine.pageHeight;
        const newPage = Math.min(
            this.props.dashboardNbrOfPages,
            Math.floor((scrollY + pageHeight * 0.5) / pageHeight),
        );

        if (newPage != this.state.currentPageIdx) {
            this.setState({currentPageIdx: newPage});
            this.props.onChangePage(newPage);
        }
    };

    handleClickCarousel = pageIdx => this.handlePageChange(pageIdx + 1);

    handlePageChange = newPage => {
        if (this.pageRefs[newPage - 1]) {
            this.pageRefs[newPage - 1].scrollIntoView({behavior: 'smooth'});
            this.props.onChangePage(newPage);
        }
    };

    toggleComponentSettings = () => this.props.onChangeColumn(Columns.SETTINGS);

    getPageNumbers = () => {
        // A single page dashboard or empty report should always only have one page
        const isDashboard = this.props.layoutEngine.pageFormat === PageFormat.DASHBOARD;
        if (isDashboard || this.props.layoutData.isEmpty()) {
            return [0];
        }

        return [...Array(this.props.dashboardNbrOfPages + 1).keys()];
    };

    render() {
        const pageIndices = this.getPageNumbers();

        return (
            <Column flex='1 0 100%' flexDirection='column' ref={this.props.columnRef}>
                <ComponentBarContainer
                    sharedState={this.state.sharedState[this.props.selectedComponentId]}
                    onAddComponentClicked={() => this.props.onChangeColumn(Columns.ADD_COMPONENT)}
                    onComponentSettingsClicked={() => this.props.onChangeColumn(Columns.SETTINGS)}
                    pageIndices={pageIndices}
                    currentPageIdx={this.state.currentPageIdx}
                    pageFormat={this.props.layoutEngine.pageFormat}
                />
                <ScrollableContent onScroll={this.updateActivePageFromScrollPosition}>
                    <Pages
                        ref={this.props.containerRef}
                        setSharedState={this.setSharedState}
                        dashboard={this.props.dashboard}
                        pageRefs={this.pageRefs}
                        layoutChanged={this.props.layoutChanged}
                        layoutEngine={this.props.layoutEngine}
                        pageIndices={pageIndices}
                        sharedState={this.state.sharedState}
                        selectComponent={this.props.selectComponent}
                        toggleComponentSettings={this.toggleComponentSettings}
                        setDashboardSize={this.props.setDashboardSize}
                        updateComponentSpec={this.props.updateComponentSpec}
                        layoutData={this.props.layoutData}
                        componentData={this.props.componentData}
                        selectedComponentId={this.props.selectedComponentId}
                        onChangeComponentPage={this.props.changeComponentPage}
                        selectedLayoutData={this.props.selectedLayoutData}
                        onChangePage={this.handlePageChange}
                        currentPageIdx={this.state.currentPageIdx}
                        onResizeComponentStart={this.props.onResizeComponentStart}
                        onResizeComponentStop={this.props.onResizeComponentStop}
                    />
                </ScrollableContent>
            </Column>
        );
    }
}
