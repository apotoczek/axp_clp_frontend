import React from 'react';
import PropTypes from 'prop-types';

import memoize from 'lodash.memoize';
import styled, {css} from 'styled-components';

import CustomGridLayout from 'containers/dashboards/CustomGridLayout';
import DashboardLayout from 'libs/multi-page-dashboard-layout';

import DashboardComponent from 'components/dashboards/DashboardComponent';

const ReportPageContainer = styled.div`
    background: ${props => props.pageBgColor || 'transparent'};
    box-shadow: ${({theme}) => theme.dashboard.page.dropShadow};
    height: 100%;
    width: 100%;
`;

const StyledLayout = styled(CustomGridLayout)`
    position: relative;
    background: transparent;
    ${props =>
        props.minHeight &&
        css`
            min-height: ${props.minHeight}px;
        `}

    .react-grid-item {
        background: #ffffff;
        padding: ${props => props.gridItemPadding}px;
        color: ${({theme}) => theme.dashboard.fg};

        &.cssTransforms {
            transition-property: transform;
        }

        &.resizing {
            will-change: width, height;
            z-index: 4 !important;
            background-color: #ffffff;
        }

        &.react-draggable-dragging {
            transition: none;
            will-change: transform;
            z-index: 4 !important;
            background-color: #ffffff;
        }

        &.react-grid-placeholder {
            border: 2px dashed #e1e1e1;
            background: #f5f5f5;
            opacity: 0.5;
            transition-duration: 200ms;
            z-index: 2;
            user-select: none;

            ${props =>
                props.isDraggingOutside &&
                css`
                    display: none;
                `}
        }
    }
`;

class ReportPage extends React.Component {
    static propTypes = {
        layoutData: PropTypes.arrayOf(PropTypes.object.isRequired),
        componentData: PropTypes.object,
        components: PropTypes.object,
        sharedState: PropTypes.object,
        gridItemComponent: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.func,
            PropTypes.string,
        ]),

        layoutEngine: PropTypes.instanceOf(DashboardLayout),
        selectedComponentId: PropTypes.string,
        onDashboardRef: PropTypes.func,

        onLayoutChange: PropTypes.func,
        onDragOutside: PropTypes.func,
        onDropOutside: PropTypes.func,
        onDragInside: PropTypes.func,
        onResizeComponentStart: PropTypes.func,
        onResizeComponentStop: PropTypes.func,
        updateComponentSpec: PropTypes.func,

        pageBgColor: PropTypes.string,
        isEditing: PropTypes.bool,
        preventCollision: PropTypes.bool,
        disableCompact: PropTypes.bool,
    };

    static defaultProps = {
        toggleComponentSettings: () => {},
        onResizeComponentStart: () => {},
        onResizeComponentStop: () => {},
    };

    state = {
        isDraggingOutside: false,
    };

    handleResizeComponentStart = (layout, oldItem, newItem, _, mouseEvent) => {
        this.props.onResizeComponentStart(layout, oldItem, newItem, _, mouseEvent);
    };

    handleResizeComponentStop = (layout, oldItem, newItem, _, mouseEvent) => {
        this.props.onResizeComponentStop(layout, oldItem, newItem, _, mouseEvent);
        this.onStopEditing(layout, oldItem, newItem, _, mouseEvent);
    };

    onStopEditing = (layout, oldItem, newItem, _, mouseEvent) => {
        const droppedOutside = this.checkDroppedOutside(newItem, mouseEvent);
        const didClickComponent = this.checkDidClickComponent(oldItem, newItem);

        return droppedOutside || didClickComponent;
    };

    checkDroppedOutside = (newItem, mouseEvent) => {
        const {layoutEngine} = this.props;
        if (!this.pageRef) {
            return true;
        }

        const pageDom = this.pageRef.getBoundingClientRect();

        const outside = layoutEngine.itemOffsetToPage(pageDom.top, mouseEvent.y);

        if (outside) {
            const up = outside > 0;
            let newRow = Math.min(
                Math.floor(outside / (layoutEngine.rowHeight() + layoutEngine.gridItemPadding)),
                layoutEngine.rowCount,
            );

            let newCol = Math.min(
                Math.max(
                    0,
                    Math.floor(
                        (mouseEvent.x - pageDom.left) /
                            (layoutEngine.columnWidth() + layoutEngine.gridItemPadding),
                    ),
                ),
                layoutEngine.columnCount,
            );

            // Moved down a page
            if (!up) {
                newRow = layoutEngine.rowCount + newRow;
            }

            this.props.onDropOutside(newItem, up, newRow, newCol);
        }

        this.setState({isDraggingOutside: false});
        this.props.onSelection(newItem.i);

        return outside;
    };

    checkDidClickComponent = (oldItem, newItem) => {
        return (
            oldItem.x === newItem.x &&
            oldItem.y === newItem.y &&
            oldItem.w === newItem.w &&
            oldItem.h === newItem.h
        );
    };

    handleLayoutChange = newLayout => {
        if (!this.props.isEditing) {
            return;
        }
        this.props.onLayoutChange(newLayout);
    };

    handleDrag = (layout, oldItem, newItem, placeholder, event) => {
        const {onDragOutside, onDragInside, layoutEngine} = this.props;
        if (!this.pageRef) {
            return;
        }
        const pageDom = this.pageRef.getBoundingClientRect();
        const outside = layoutEngine.itemOffsetToPage(pageDom.top, event.y);

        if (outside) {
            if (!this.state.isDraggingOutside) {
                this.setState({isDraggingOutside: true});
            }
            onDragOutside(newItem, outside > 0 ? 1 : -1);
        } else if (this.state.isDraggingOutside) {
            this.setState({isDraggingOutside: false});
            onDragInside(newItem);
        }
    };

    renderComponents() {
        const {
            layoutData,
            componentData,
            components,
            sharedState,
            onSharedStateChange,
            selectedComponentId,
            isEditing,
            updateComponentSpec,
            gridItemComponent: GridItem = 'div',
            layoutEngine,
        } = this.props;

        return layoutData
            .map(({i: componentId, w, h}) => {
                if (!componentData[componentId]) {
                    return null;
                }

                let componentKey = componentData[componentId].componentKey;
                if (componentData[componentId].base && !componentKey) {
                    componentKey = 'reportingComponent';
                }

                const componentSpec = components[componentKey];
                const isSelected = selectedComponentId === componentId;

                const itemProps = {
                    selected: isSelected,
                    style: {
                        ...componentData[componentId].containerStyle,
                        zIndex: isSelected ? 3 : undefined,
                    },
                    componentKey,
                };

                const width = layoutEngine.innerWidth(w);
                const height = layoutEngine.innerHeight(h);
                const relativeFontSize = layoutEngine.relativeFontSize(width);

                return (
                    <GridItem key={componentId} {...itemProps}>
                        <DashboardComponent
                            componentId={componentId}
                            componentKey={componentKey}
                            toggleComponentSettings={this.props.toggleComponentSettings}
                            componentSpec={componentSpec}
                            sharedState={sharedState}
                            onSharedStateChange={onSharedStateChange}
                            width={width}
                            height={height}
                            relativeFontSize={relativeFontSize}
                            onSettingsChanged={updateComponentSpec}
                            isSelected={isSelected}
                            isEditing={isEditing}
                            {...componentData[componentId].settings}
                        />
                    </GridItem>
                );
            })
            .filter(el => el != null);
    }

    layoutMargins = memoize(() => [
        this.props.layoutEngine.gridItemMargin,
        this.props.layoutEngine.gridItemMargin,
    ]);

    render() {
        const {
            disableCompact,
            isEditing,
            layoutData,
            layoutEngine,
            onDashboardRef,
            pageBgColor,
            preventCollision,
        } = this.props;

        return (
            <ReportPageContainer
                pageBgColor={pageBgColor}
                ref={el => {
                    this.pageRef = el;
                    if (onDashboardRef) {
                        onDashboardRef(el);
                    }
                }}
            >
                <StyledLayout
                    layout={layoutData}
                    rowHeight={layoutEngine.rowHeight()}
                    gridItemPadding={layoutEngine.gridItemPadding}
                    margin={this.layoutMargins()}
                    compactType={disableCompact ? null : 'vertical'}
                    width={layoutEngine.pageWidth}
                    cols={layoutEngine.columnCount}
                    onResizeStart={this.handleResizeComponentStart}
                    onResizeStop={this.handleResizeComponentStop}
                    onDragStop={this.onStopEditing}
                    onDrag={this.handleDrag}
                    onLayoutChange={this.handleLayoutChange}
                    draggableCancel='.noDrag'
                    isEditing={isEditing}
                    preventCollision={preventCollision}
                    isDraggingOutside={this.state.isDraggingOutside}
                >
                    {this.renderComponents()}
                </StyledLayout>
            </ReportPageContainer>
        );
    }
}

export default ReportPage;
