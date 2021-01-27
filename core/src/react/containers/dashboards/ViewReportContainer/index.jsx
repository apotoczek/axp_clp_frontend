import React from 'react';
import styled from 'styled-components';

import {exportReport} from 'api';
import backendConnect from 'utils/backendConnect';
import {PageFormat} from 'src/libs/Enums';

import * as dashboardActions from 'actions/dashboards';
import * as endpoints from 'actions/data/endpoints';
import * as requests from 'actions/data/requests';
import * as modalActions from 'actions/view/modal';
import * as clientSelectors from 'selectors/client';

import Modal from 'containers/ModalContainer';
import BaseEntityFormModalContainer from 'containers/dashboards/BaseEntityFormModalContainer';

import {joinUrl, is_set} from 'src/libs/Utils';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

import EmptyDashboard from 'components/dashboards/EmptyDashboard';
import DashboardShare from 'components/dashboards/DashboardShare';

import {Container, Content, Page, Viewport} from 'components/layout';

import Loader from 'components/basic/Loader';
import Breadcrumbs from 'components/Breadcrumbs';
import Viewer from './Viewer';

const StyledPage = styled(Page)`
    background: ${({theme}) => theme.dashboard.pagesContainer.bg};
`;

class ViewReportContainer extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            exporting: false,
            containerWidth: null,
        };

        this.containerRef = React.createRef();
    }

    componentDidMount() {
        const {match, populateValueMap, setActiveDashboard, triggerRequests} = this.props;

        populateValueMap().then(() => {
            setActiveDashboard(match.params.uid).then(() => {
                triggerRequests();
                this.setState({isLoading: false});
            });
        });

        this.updateContainerWidth();
    }

    componentDidUpdate(_prevProps, _nextProps) {
        this.updateContainerWidth();
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

    handleOpenShareModal() {
        this.props.toggleModal('share-dashboard');
    }

    handleDeleteShare(payload) {
        const {deleteDashboardShare} = this.props;
        const {shareUid, entityUid} = payload;
        deleteDashboardShare(shareUid, entityUid);
    }

    toggleBaseEntityFormModal = () => {
        this.props.toggleModal('base-entity-form-modal');
    };

    handleGeneratePdf = () => {
        this.setState({exporting: true});

        exportReport({dashboardUid: this.props.dashboard.uid})
            .then(() => {
                this.setState({exporting: false});
            })
            .catch(() => {
                this.setState({exporting: false});
            });
    };

    renderContent() {
        const {
            dashboard,
            staticLayoutData = [],
            componentData,
            dashboardNbrOfPages,
            dashboardShares,
            clientUsers,
        } = this.props;

        const {containerWidth, exporting} = this.state;

        return (
            <Viewport>
                <Breadcrumbs path={['Reports', dashboard.name]} urls={['/documents/browse']} />
                <Toolbar>
                    <ToolbarItem onClick={this.toggleBaseEntityFormModal} icon='cog' glyphicon>
                        Change Base Entities
                    </ToolbarItem>
                    {dashboard.write && (
                        <ToolbarItem
                            to={joinUrl(this.props.match.url, 'edit')}
                            icon='edit'
                            glyphicon
                            right
                        >
                            Edit Mode
                        </ToolbarItem>
                    )}
                    {dashboard.share && (
                        <ToolbarItem
                            icon='share'
                            glyphicon
                            right
                            onClick={this.handleOpenShareModal.bind(this)}
                        >
                            Share
                        </ToolbarItem>
                    )}
                    <ToolbarItem
                        icon='download-alt'
                        glyphicon
                        right
                        onClick={this.handleGeneratePdf}
                        disabled={!is_set(staticLayoutData, true) || exporting}
                    >
                        Export PDF
                    </ToolbarItem>
                </Toolbar>
                <StyledPage>
                    <Content>
                        {!is_set(staticLayoutData, true) ? (
                            <EmptyDashboard goTo={joinUrl(this.props.match.url, 'edit')} />
                        ) : (
                            <Viewer
                                containerWidth={containerWidth}
                                dashboard={dashboard}
                                staticLayoutData={staticLayoutData}
                                componentData={componentData}
                                dashboardNbrOfPages={dashboardNbrOfPages}
                            />
                        )}
                    </Content>
                </StyledPage>
                <DashboardShare
                    dashboard={dashboard}
                    onShare={this.props.shareDashboard}
                    onDeleteShare={this.handleDeleteShare.bind(this)}
                    shares={dashboardShares}
                    users={clientUsers}
                />
                <Modal
                    render={({toggleModal}) => (
                        <BaseEntityFormModalContainer toggleModal={toggleModal} />
                    )}
                    modalKey='base-entity-form-modal'
                />
            </Viewport>
        );
    }

    render() {
        const {dashboard, requests} = this.props;

        const {isLoading} = this.state;

        const isDashboardLoading =
            requests.dashboard.loading || requests.allVehicles.loading || !dashboard || isLoading;
        return (
            <Container ref={this.containerRef}>
                {isDashboardLoading ? <Loader /> : this.renderContent()}
            </Container>
        );
    }
}

const data = props => ({
    dashboard: endpoints.call('dataprovider/dashboard', {dashboard_uid: props.match.params.uid}),
    dashboardShares: endpoints.call('dataprovider/dashboard_shares', {
        dashboard_uid: props.match.params.uid,
    }),
    allVehicles: endpoints.call('dataprovider/user_vehicles', {}),
    dashboards: requests.fetchDashboards(),
    clientUsers: requests.fetchClientUsers(),
    siteCustomizations: requests.fetchSiteCustomizations(),
});

const mapStateToProps = state => ({
    dashboard: dashboardSelectors.activeDashboard(state),
    staticLayoutData: dashboardSelectors.activeLayoutData(state, true, true),
    componentData: dashboardSelectors.activeComponentData(state),
    dashboardShares: dashboardSelectors.activeDashboardShares(state),
    dashboardNbrOfPages: dashboardSelectors.dashboardNbrOfPages(state),
    clientUsers: clientSelectors.users(state),
});

const dispatchToProps = {
    setActiveDashboard: dashboardActions.setActiveDashboard,
    populateValueMap: dashboardActions.populateValueMap,
    shareDashboard: dashboardActions.shareDashboard,
    deleteDashboardShare: dashboardActions.deleteDashboardShare,

    toggleModal: modalActions.toggleModal,
};

export default backendConnect(data, {}, mapStateToProps, dispatchToProps)(ViewReportContainer);
