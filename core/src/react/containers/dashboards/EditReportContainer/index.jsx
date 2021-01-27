import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Box} from '@rebass/grid';
import memoize from 'lodash.memoize';

import auth from 'auth';
import {is_set} from 'src/libs/Utils';

import {NotificationContext, DashboardContext} from 'contexts';
import dashboardComponents from 'libs/dashboard-components';

import backendConnect from 'utils/backendConnect';
import ExtraPropTypes from 'utils/extra-prop-types';
import {NotificationType} from 'src/libs/Enums';

import DashboardLayout from 'libs/multi-page-dashboard-layout';
import {PageFormat} from 'src/libs/Enums';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as componentSelectors from 'selectors/dashboards/component';

import * as componentActions from 'actions/dashboards/components';
import * as endpoints from 'actions/data/endpoints';
import * as requestActions from 'actions/data/requests';
import * as dashboardActions from 'actions/dashboards';
import * as modalActions from 'actions/view/modal';

import Modal from 'containers/ModalContainer';
import DashboardSettingsContainer from 'containers/dashboards/DashboardSettingsContainer';
import ComponentSettingsContainer from 'containers/dashboards/ComponentSettingsContainer';

import AddComponent from 'components/dashboards/AddComponent';

import {Viewport, Page, Container} from 'components/layout';
import Breadcrumbs from 'components/Breadcrumbs';
import Loader from 'components/basic/Loader';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import {Columns} from './shared';
import Editor from './Editor';

const HorizontalScrollContent = styled(Box)`
    flex: 1;
    display: flex;
    min-width: 100%;
    overflow-x: auto;
    max-height: 100%;
    overflow-y: hidden;
`;

const StyledPage = styled(Page)`
    background: ${({theme}) => theme.dashboard.pagesContainer.bg};
`;

/**
 * Manual implementation of scrolling behavior in dashboards. Every tick of the animation
 * it asks the position of the child column we want to scroll towards, and interpolates the
 * behavior of scrolling towards that direction. This was manually implemented because we
 * needed to continously check the position of the child column to scroll towards, which is
 * not something that the JS standard library provides functionality for.
 *
 * The reason we need to continously check the position of the child column is because it
 * might change when the size of a child changes.
 *
 * @param {DOMNode} scrollToElement The DOM node of the column with in the container to scroll
 *  into view.
 * @param {DOMNode} scrollElement The DOM node of the container in which all the child columns
 *  are. This is the container that performs the actual scrolling.
 */
function scrollTo(scrollToElement, scrollElement, animationTime = 500) {
    const startLeftPos = scrollElement.scrollLeft;
    let leftPos;

    let startTimestamp;
    let timeLapsed = 0;
    function _scrollTo(timestamp) {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }
        timeLapsed = timestamp - startTimestamp;

        const left = scrollToElement.offsetLeft;

        if (leftPos === left) {
            return;
        }

        // Calculate the percentage of the total time we have spent on performing the animation
        const percentTime = Math.min(timeLapsed / animationTime, 1);
        const percentEasingPattern =
            percentTime < 0.5
                ? 2 * percentTime * percentTime
                : -1 + (4 - 2 * percentTime) * percentTime;

        // Calculate the current scroll position given the above percentage
        leftPos = startLeftPos + (left - startLeftPos) * percentEasingPattern;

        // Update scroll position, i.e. simulate scroll.
        scrollElement.scrollLeft = Math.floor(leftPos);

        // Make sure the animation continues
        window.requestAnimationFrame(_scrollTo);
    }

    // Start animation
    window.requestAnimationFrame(_scrollTo);
}

function filteredComponents() {
    const availableComponents = {};

    for (const [key, spec] of Object.entries(dashboardComponents)) {
        if (is_set(spec.requiredFeatures, true) && !auth.user_has_features(spec.requiredFeatures)) {
            continue;
        }

        availableComponents[key] = spec;
    }

    return availableComponents;
}

const getLayoutEngine = memoize(
    (w, p, f) => new DashboardLayout(w, p, f, true),
    (w, p, f) => `${w}-${p}-${f}`,
);

class EditReportContainer extends Component {
    static contextType = NotificationContext;
    static propTypes = {
        match: PropTypes.shape({
            url: PropTypes.string.isRequired,
            params: PropTypes.shape({
                uid: ExtraPropTypes.uuid.isRequired,
            }),
        }).isRequired,

        selectedComponentId: PropTypes.string,

        dashboard: PropTypes.shape({
            uid: PropTypes.string,
            name: PropTypes.string,
        }),
        layoutData: PropTypes.arrayOf(PropTypes.object.isRequired),
        componentData: PropTypes.object,

        selectComponent: PropTypes.func.isRequired,
        setActiveDashboard: PropTypes.func.isRequired,
        saveDashboard: PropTypes.func.isRequired,

        layoutChanged: PropTypes.func.isRequired,
        addComponent: PropTypes.func.isRequired,
    };

    state = {
        isLoading: true,
        editorPageIdx: 0,
        scrollTo: Columns.EDITOR,
        renderedDashboardAtLeastOnce: false,
        containerWidth: null,
    };

    allowScrolling = true;

    initialScrollPositionSet = false;

    containerRef = React.createRef();
    columnWrapperRef = React.createRef();
    addComponentColumnRef = React.createRef();
    editorColumnRef = React.createRef();
    settingsColumnRef = React.createRef();

    availableComponents = filteredComponents();

    // The columns that are potentially rendered as children to the column wrapper.
    // If a column is in this list, and is rendered, it is being tracked and thus is
    // "active" when it covers the majority of the column wrapper viewport.
    columnRefsToTrack = {
        [Columns.ADD_COMPONENT]: this.addComponentColumnRef,
        [Columns.EDITOR]: this.editorColumnRef,
        [Columns.SETTINGS]: this.settingsColumnRef,
    };

    componentDidMount() {
        this.props.populateValueMap().then(async () => {
            await this.props.setActiveDashboard(this.props.match.params.uid);
            this.props.triggerRequests();
            this.setState({isLoading: false});
        });

        this.updateContainerWidth();
        window.addEventListener('resize', this.updateContainerWidth);
    }

    componentDidUpdate(_prevProps, _prevState) {
        if (!this._isLoadingDashboard() && !this.state.renderedDashboardAtLeastOnce) {
            this.setState({renderedDashboardAtLeastOnce: true});
        }

        if (!this.columnWrapperRef.current) {
            return;
        }

        if (this.state.scrollTo) {
            this.scrollToColumn(this.state.scrollTo);
            this.setState({scrollTo: null});
        }

        // On initial render, set the initial scroll position to be `Columns.EDITOR`
        if (!this.initialScrollPositionSet) {
            this.initialScrollPositionSet = this.scrollToColumn(Columns.EDITOR, false);
        }

        this.updateContainerWidth();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateContainerWidth);
    }

    updateContainerWidth = () => {
        const {dashboard} = this.props;

        const templateSettings = dashboard?.settings?.template ?? {};
        const format = templateSettings.format;

        const containerNode = this.containerRef.current;

        if (containerNode && format === PageFormat.DASHBOARD) {
            this.setState(({containerWidth}) => {
                if (containerWidth === containerNode.offsetWidth) {
                    return null;
                }

                return {containerWidth: containerNode.offsetWidth};
            });
        }
    };

    scrollToColumn = (targetColumn, animate = true) => {
        const ref = this.columnRefsToTrack[targetColumn];
        if (!ref || !ref.current || !this.columnWrapperRef.current) {
            return false;
        }

        if (animate) {
            scrollTo(ref.current, this.columnWrapperRef.current);
        } else {
            const columnWrapperBB = this.columnWrapperRef.current.getBoundingClientRect();
            const columnBB = ref.current.getBoundingClientRect();
            const leftPos = columnBB.left - columnWrapperBB.left;
            this.columnWrapperRef.current.scrollLeft = leftPos;
        }

        return true;
    };

    handleAddComponent = component => {
        const layoutEngine = getLayoutEngine();
        this.props.addComponent(component, this.state.editorPageIdx, layoutEngine.columnCount);
    };

    handleEditorChangePage = editorPageIdx => this.setState({editorPageIdx});

    previewUrl = () => {
        return this.props.match.url.replace('/edit', '');
    };

    toggleDashboardSettings = () => {
        this.props.toggleModal('dashboard-settings');
    };

    save = () => {
        this.props.saveDashboard().then(() => {
            this.context.add(
                {
                    type: NotificationType.Success,
                    title: 'Save Dashboard',
                    message: 'Successfully saved your dashboard!',
                },
                3000,
            );
        });
    };

    changeColumn = scrollTo => this.setState({scrollTo});

    isColumnActive = (columnWrapper, columnBB) => {
        const columnWrapperBB = columnWrapper.getBoundingClientRect();
        const columnWrapperSize = {
            width: columnWrapper.clientWidth,
            height: columnWrapper.clientHeight,
        };

        const relativeColumnBB = {
            top: columnBB.top - columnWrapperBB.top,
            right: columnBB.right - columnWrapperBB.right,
            bottom: columnBB.bottom - columnWrapperBB.bottom,
            left: columnBB.left - columnWrapperBB.left,
        };

        if (
            relativeColumnBB.left <= 0 &&
            -relativeColumnBB.right <= columnWrapperSize.width / 2.0
        ) {
            return true;
        }

        if (relativeColumnBB.left >= 0 && relativeColumnBB.left < columnWrapperSize.width / 2.0) {
            return true;
        }
    };

    trackActiveColumn = (() => {
        if (!this.columnWrapperRef.current) {
            return;
        }

        for (const [column, columnRef] of Object.entries(this.columnRefsToTrack)) {
            if (!columnRef.current) {
                continue;
            }

            const columnBB = columnRef.current.getBoundingClientRect();
            if (this.isColumnActive(this.columnWrapperRef.current, columnBB)) {
                if (this.state.activeColumn === column) {
                    continue;
                }

                this.setState({activeColumn: column});
                return;
            }
        }
    }).debounce(50);

    handleEditorScroll = () => {
        if (!this.allowScrolling) {
            this.columnWrapperRef.current.scrollTo({left: this.keepScrollLeft});
        }

        this.trackActiveColumn();
    };

    enableScrolling = () => {
        this.allowScrolling = true;
    };
    disableScrolling = () => {
        if (this.columnWrapperRef && this.columnWrapperRef.current) {
            this.keepScrollLeft = this.columnWrapperRef.current.scrollLeft;
        }
        this.allowScrolling = false;
    };

    _isLoadingDashboard() {
        return (
            this.props.requests.dashboard.loading ||
            this.props.requests.vehicles.loading ||
            this.props.requests.siteCustomizations.loading ||
            !this.props.dashboard ||
            this.state.isLoading
        );
    }

    render() {
        const renderLoadingSpinner =
            this._isLoadingDashboard() && !this.state.renderedDashboardAtLeastOnce;
        const dashboard = this.props.dashboard;

        const templateSettings = dashboard?.settings?.template ?? {};

        const {format: pageFormat, componentPadding: gridItemPadding} = templateSettings;

        // TODO(Viktor): Should use `useMemo` for this instead
        const layoutEngine = getLayoutEngine(
            this.state.containerWidth,
            gridItemPadding,
            pageFormat,
        );

        return (
            <DashboardContext.Provider value={this.props.dashboard}>
                <Container>
                    <Viewport>
                        {!renderLoadingSpinner && (
                            <Breadcrumbs
                                path={['Reports', this.props.dashboard.name, 'Edit']}
                                urls={['/documents/browse', this.previewUrl()]}
                            />
                        )}
                        <Toolbar>
                            <ToolbarItem
                                onClick={this.toggleDashboardSettings}
                                icon='cog'
                                glyphicon
                            >
                                Dashboard Settings
                            </ToolbarItem>
                            <ToolbarItem to={this.previewUrl()} icon='eye-open' glyphicon right>
                                View Mode
                            </ToolbarItem>
                            <ToolbarItem onClick={this.save} icon='floppy-disk' glyphicon right>
                                Save
                            </ToolbarItem>
                        </Toolbar>
                        <StyledPage>
                            <HorizontalScrollContent
                                ref={this.columnWrapperRef}
                                onScroll={this.handleEditorScroll}
                            >
                                {renderLoadingSpinner ? (
                                    <Loader />
                                ) : (
                                    <>
                                        <AddComponent
                                            columnRef={this.addComponentColumnRef}
                                            onAddComponent={this.handleAddComponent}
                                            onChangeColumn={this.changeColumn}
                                            availableComponents={this.availableComponents}
                                        />
                                        <Editor
                                            containerRef={this.containerRef}
                                            columnRef={this.editorColumnRef}
                                            dashboard={this.props.dashboard}
                                            layoutData={this.props.layoutData}
                                            componentData={this.props.componentData}
                                            selectedLayoutData={this.props.selectedLayoutData}
                                            selectedComponentId={this.props.selectedComponentId}
                                            onResizeComponentStart={this.disableScrolling}
                                            onResizeComponentStop={this.enableScrolling}
                                            dashboardNbrOfPages={this.props.dashboardNbrOfPages}
                                            layoutChanged={this.props.layoutChanged}
                                            selectComponent={this.props.selectComponent}
                                            setDashboardSize={this.props.setDashboardSize}
                                            updateComponentSpec={this.props.updateComponentSpec}
                                            changeComponentPage={this.props.changeComponentPage}
                                            layoutEngine={layoutEngine}
                                            onChangePage={this.handleEditorChangePage}
                                            onChangeColumn={this.changeColumn}
                                        />
                                        <ComponentSettingsContainer
                                            columnRef={this.settingsColumnRef}
                                            active={this.state.activeColumn === Columns.SETTINGS}
                                            onChangeColumn={this.changeColumn}
                                            layoutEngine={layoutEngine}
                                        />
                                    </>
                                )}
                            </HorizontalScrollContent>
                        </StyledPage>
                    </Viewport>
                    <Modal
                        modalKey='dashboard-settings'
                        render={({toggleModal}) => (
                            <DashboardSettingsContainer toggleModal={toggleModal} />
                        )}
                    />
                </Container>
            </DashboardContext.Provider>
        );
    }
}

const data = props => ({
    dashboard: endpoints.call('dataprovider/dashboard', {dashboard_uid: props.match.params.uid}),
    vehicles: endpoints.call('dataprovider/user_vehicles', {}),
    siteCustomizations: requestActions.fetchSiteCustomizations(),
    dashboards: requestActions.fetchDashboards(),
});

const mapStateToProps = state => ({
    dashboard: dashboardSelectors.activeDashboard(state),
    componentData: dashboardSelectors.activeComponentData(state),
    layoutData: dashboardSelectors.activeLayoutData(state, true, false),
    selectedComponentId: componentSelectors.selectedComponentId(state),
    selectedLayoutData: componentSelectors.selectedLayoutData(state),
    dashboardNbrOfPages: dashboardSelectors.dashboardNbrOfPages(state),
});

const dispatchToProps = {
    setDashboardSize: dashboardActions.setDashboardSize,
    setActiveDashboard: dashboardActions.setActiveDashboard,
    layoutChanged: dashboardActions.layoutChanged,
    saveDashboard: dashboardActions.saveDashboard,
    populateValueMap: dashboardActions.populateValueMap,

    selectComponent: componentActions.selectComponent,
    addComponent: componentActions.addComponent,
    changeComponentPage: componentActions.changeComponentPage,
    updateComponentSpec: componentActions.updateComponentSpec,

    toggleModal: modalActions.toggleModal,
};

export default backendConnect(data, {}, mapStateToProps, dispatchToProps)(EditReportContainer);
