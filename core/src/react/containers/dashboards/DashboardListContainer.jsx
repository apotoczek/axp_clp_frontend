import React, {Component} from 'react';
import {withRouter} from 'react-router';
import PropTypes from 'prop-types';

import {joinUrl} from 'src/libs/Utils';
import backendConnect from 'utils/backendConnect';

import * as listActions from 'actions/dashboards/list';
import * as requests from 'actions/data/requests';
import * as dashboardListSelectors from 'selectors/dashboards/list';

import Breadcrumbs from 'components/Breadcrumbs';
import {Page, Content, Viewport, ScrollableContent} from 'components/layout';
import DashboardList from 'components/dashboards/DashboardList';
import DashboardListCPanel from 'components/dashboards/DashboardListCPanel';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';

class DashboardListContainer extends Component {
    static propTypes = {
        // Redux actions
        filterDashboardList: PropTypes.func.isRequired,
        removeDashboard: PropTypes.func.isRequired,

        // Redux selectors
        dashboards: PropTypes.arrayOf(PropTypes.object).isRequired,
        filters: PropTypes.any,
    };

    state = {
        edit: false,
        selected: undefined,
    };

    componentDidMount() {
        this.props.triggerRequests();
    }

    handleCreateDashboard = () => {
        this.props.history.push(joinUrl('dashboards', 'create'));
    };

    handleRemoveDashboard = uid => {
        this.props.removeDashboard(uid);
        this.setState({selected: undefined});
    };

    handleCopyDashboard = uid => {
        this.props.copyDashboard(uid);
    };

    handleEditList = () => {
        this.setState({edit: !this.state.edit});
    };

    handleSelectDashboard = uid => {
        const {selected} = this.state;
        if (selected && selected === uid) {
            this.setState({selected: undefined});
        } else {
            this.setState({selected: uid});
        }
    };

    render() {
        const {edit, selected} = this.state;
        const {filters, filterDashboardList, dashboards, requests} = this.props;

        return (
            <Viewport>
                <Breadcrumbs path={['Dashboards', 'Search']} />
                <Page>
                    <DashboardListCPanel
                        searchFilterValue={filters}
                        onFilterChange={filterDashboardList}
                    />
                    <Content>
                        <Toolbar>
                            <ToolbarItem onClick={this.handleEditList} icon='edit' glyphicon right>
                                {edit ? 'Done' : 'Edit'}
                            </ToolbarItem>
                            <ToolbarItem onClick={this.handleCreateDashboard} icon='plus-1' right>
                                Create new
                            </ToolbarItem>
                            {selected && edit && (
                                <ToolbarItem
                                    onClick={() => this.handleRemoveDashboard(selected)}
                                    icon='trash-1'
                                    right
                                >
                                    Delete selected
                                </ToolbarItem>
                            )}
                            {selected && edit && (
                                <ToolbarItem
                                    onClick={() => this.handleCopyDashboard(selected)}
                                    icon='copy'
                                    glyphicon
                                    right
                                >
                                    Copy Selected
                                </ToolbarItem>
                            )}
                        </Toolbar>
                        <ScrollableContent>
                            <DashboardList
                                dashboards={dashboards}
                                onRemoveDashboard={this.handleRemoveDashboard}
                                onCopyDashboard={this.handleCopyDashboard}
                                loading={requests.dashboards.loading}
                                edit={edit}
                                selectedUid={selected}
                                onSelectDashboard={this.handleSelectDashboard}
                            />
                        </ScrollableContent>
                    </Content>
                </Page>
            </Viewport>
        );
    }
}

const data = _props => ({
    dashboards: requests.fetchDashboards(),
});

const mapStateToProps = (state, _props) => ({
    dashboards: dashboardListSelectors.filteredList(state),
    filters: dashboardListSelectors.getFilters(state),
});

const dispatchToProps = {
    // Backend calls
    copyDashboard: listActions.copy,
    removeDashboard: listActions.remove,

    // State changers
    filterDashboardList: listActions.filterDashboardList,
};

export default withRouter(
    backendConnect(data, {}, mapStateToProps, dispatchToProps)(DashboardListContainer),
);
