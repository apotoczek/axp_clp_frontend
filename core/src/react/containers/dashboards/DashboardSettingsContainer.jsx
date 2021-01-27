import React, {Component} from 'react';

import PropTypes from 'prop-types';
import {withRouter} from 'react-router';

import {is_set} from 'src/libs/Utils';

import backendConnect from 'utils/backendConnect';
import * as dashboardActions from 'actions/dashboards';
import * as endpoints from 'actions/data/endpoints';
import * as requestActions from 'actions/data/requests';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as entitiesSelectors from 'selectors/entities';
import * as siteCustomizations from 'selectors/siteCustomizations';

import Loader from 'components/basic/Loader';
import DashboardSettings from 'components/dashboards/dashboard-settings/DashboardSettings';

class DashboardSettingsContainer extends Component {
    static propTypes = {
        match: PropTypes.shape({url: PropTypes.string.isRequired}).isRequired,
        toggleModal: PropTypes.func.isRequired,
    };

    state = {
        name: this.props.dashboard.name,
        description: this.props.dashboard.description,
        globalDate: this.props.globalDate,
        format: this.props.templateSettings.format,
        preventCollision: this.props.templateSettings.preventCollision || false,
        disableCompact: this.props.templateSettings.disableCompact || false,
        backgroundColor: this.props.templateSettings.backgroundColor,
        componentPadding: this.props.templateSettings.componentPadding,
        baseEntityChanges: {},
    };

    componentDidMount() {
        this.props.triggerRequests();
    }

    handleSave = () => {
        if (is_set(this.state.baseEntityChanges, true)) {
            this.props
                .setBaseEntities(
                    this.state.baseEntityChanges,
                    this.props.globalDate == this.state.globalDate, //If date changed data will be requested later
                )
                .then(() => {
                    this.updateSettings();
                    this.saveAndExit();
                });
        } else {
            this.updateSettings();
            this.saveAndExit();
        }
    };

    updateSettings = () => {
        const dashboardId = this.props.match.params.uid;
        const {
            globalDate,
            name,
            description,
            format,
            preventCollision,
            disableCompact,
            backgroundColor,
            componentPadding,
        } = this.state;

        if (this.props.globalDate != globalDate) {
            this.props.setGlobalDate(globalDate);
        }
        this.props.updateDashboard({name, description}, dashboardId);
        this.props.updateDashboardSettings(
            {
                template: {
                    preventCollision,
                    disableCompact,
                    backgroundColor,
                    componentPadding,
                    format,
                },
            },
            dashboardId,
        );
    };

    saveAndExit = () => this.props.saveDashboard().then(() => this.props.toggleModal());

    handleDiscard = () => {
        this.props.toggleModal();
    };

    handleAddBaseEntity = entityUuid => {
        this.setState({
            baseEntityChanges: {
                ...this.state.baseEntityChanges,
                add: [...(this.state.baseEntityChanges.add || []), entityUuid],
            },
        });
    };

    handleRemoveBaseEntity = entityUuid => {
        this.setState({
            baseEntityChanges: {
                ...this.state.baseEntityChanges,
                remove: [...(this.state.baseEntityChanges.remove || []), entityUuid],
            },
        });
    };

    handleChangeBaseEntity = (oldEntityUuid, newEntityUuid) => {
        const {baseEntityChanges = {}} = this.state;

        // If change an entity that has been changed before, we still want to map from
        // the original base entity to the one we swapped to the second time.
        let foundPrevChanged = false;
        const changes = Object.map(baseEntityChanges.replace, newUuid => {
            if (newUuid === oldEntityUuid) {
                foundPrevChanged = true;
                return newEntityUuid;
            }

            return oldEntityUuid;
        });

        if (foundPrevChanged) {
            this.setState({
                baseEntityChanges: {
                    ...this.state.baseEntityChanges,
                    replace: {...changes},
                },
            });
        } else {
            this.setState({
                baseEntityChanges: {
                    ...this.state.baseEntityChanges,
                    replace: {
                        ...this.state.baseEntityChanges.replace,
                        [oldEntityUuid]: newEntityUuid,
                    },
                },
            });
        }
    };

    baseEntities = () => {
        const {replace = {}, add = [], remove = []} = this.state.baseEntityChanges;
        let baseEntities = this.props.baseEntities;

        // Add uuids
        baseEntities = Array.from(new Set([...baseEntities, ...add]));

        // Filter out removed uuids
        baseEntities = Array.from(
            new Set(baseEntities.filter(entity => remove.indexOf(entity) == -1)),
        );

        // Replace uuids
        baseEntities = baseEntities.map(entity => replace[entity] || entity);

        return baseEntities;
    };

    handleChangeFormValue = key => value => {
        this.setState({[key]: value});
    };

    render() {
        if (
            this.props.requests.dashboard.loading ||
            this.props.requests.vehicles.loading ||
            this.props.requests.siteCustomizations.loading
        ) {
            return <Loader />;
        }

        return (
            <DashboardSettings
                toggleModal={this.props.toggleModal}
                vehicles={this.props.vehicles}
                onChange={this.handleChangeFormValue}
                onAddBaseEntity={this.handleAddBaseEntity}
                onChangeBaseEntity={this.handleChangeBaseEntity}
                onRemoveBaseEntity={this.handleRemoveBaseEntity}
                onSave={this.handleSave}
                onDiscard={this.handleDiscard}
                name={this.state.name}
                globalDate={this.state.globalDate}
                description={this.state.description}
                format={this.state.format}
                preventCollision={this.state.preventCollision}
                disableCompact={this.state.disableCompact}
                backgroundColor={this.state.backgroundColor}
                componentPadding={this.state.componentPadding}
                baseEntities={this.baseEntities()}
                customColors={this.props.customColors}
            />
        );
    }
}

const data = props => ({
    dashboard: endpoints.call('dataprovider/dashboard', {dashboard_uid: props.match.params.uid}),
    vehicles: endpoints.call('dataprovider/user_vehicles', {}),
    siteCustomizations: requestActions.fetchSiteCustomizations(),
});

const mapStateToProps = state => ({
    dashboard: dashboardSelectors.activeDashboard(state),
    vehicles: entitiesSelectors.formattedVehicles(state),
    baseEntities: dashboardSelectors.activeDashboardBaseEntities(state),
    globalDate: dashboardSelectors.activeDashboardGlobalDate(state),
    templateSettings: dashboardSelectors.activeDashboardTemplateSettings(state),
    customColors: siteCustomizations.customColors(state),
});

const dispatchToProps = {
    saveDashboard: dashboardActions.saveDashboard,
    setBaseEntities: dashboardActions.setBaseEntities,
    setGlobalDate: dashboardActions.setGlobalDate,
    updateDashboard: dashboardActions.updateDashboard,
    updateDashboardSettings: dashboardActions.updateDashboardSettings,
};

export default withRouter(
    backendConnect(data, {}, mapStateToProps, dispatchToProps)(DashboardSettingsContainer),
);
