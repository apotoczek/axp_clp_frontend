import React from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';

import backendConnect from 'utils/backendConnect';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as entitiesSelectors from 'selectors/entities';
import * as dashboardActions from 'actions/dashboards';
import * as endpointActions from 'actions/data/endpoints';

import {H1, H3, H4} from 'components/basic/text';
import Button from 'components/basic/forms/Button';
import Loader from 'components/basic/Loader';
import Icon from 'components/basic/Icon';
import BaseEntityForm from 'components/dashboards/dashboard-settings/BaseEntityForm';

const Header = styled(Box)`
    border-bottom: 1px solid #566174;
`;

const NameLabel = styled.span`
    font-weight: 600;
`;

class BaseEntityFormModalContainer extends React.Component {
    static propTypes = {
        toggleModal: PropTypes.func.isRequired,
    };

    state = {
        baseEntityChanges: {
            add: [],
            remove: [],
            replace: {},
        },
    };

    componentDidMount() {
        this.props.triggerRequests();
    }

    handleOKClick = () => {
        this.props.setBaseEntities(this.state.baseEntityChanges).then(() => {
            this.props.toggleModal();
        });
    };

    handleAddBaseEntity = entityUuid => {
        this.setState({
            baseEntityChanges: {
                ...this.state.baseEntityChanges,
                add: [...this.state.baseEntityChanges.add, entityUuid],
            },
        });
    };

    handleRemoveBaseEntity = entityUuid => {
        this.setState({
            baseEntityChanges: {
                ...this.state.baseEntityChanges,
                remove: [...this.state.baseEntityChanges.remove, entityUuid],
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
        const {replace, add, remove} = this.state.baseEntityChanges;
        let baseEntities = this.props.baseEntities;

        // Add uuids
        baseEntities = Array.from(new Set([...baseEntities, ...add]));

        // Filter out removed uuids
        baseEntities = baseEntities.filter(entity => remove.indexOf(entity) == -1);

        // Replace uuids
        baseEntities = baseEntities.map(entity => replace[entity] || entity);

        return baseEntities;
    };

    render() {
        if (
            this.props.requests.dashboard.loading ||
            this.props.requests.baseEntities.loading ||
            this.props.requests.userEntities.loading
        ) {
            return <Loader />;
        }

        return (
            <Flex flexDirection='column' width={500}>
                <Header pb={2} mb={3}>
                    <H1>
                        Base entities for <NameLabel>{this.props.dashboard.name}</NameLabel>
                    </H1>
                </Header>
                <Box>
                    <H3>Base Entities</H3>
                </Box>
                <Box pl={2}>
                    <H4>Selected Entities</H4>
                </Box>
                <BaseEntityForm
                    vehicles={this.props.vehicles}
                    baseEntities={this.baseEntities()}
                    onAddEntity={this.handleAddBaseEntity}
                    onChangeEntity={this.handleChangeBaseEntity}
                    onRemoveEntity={this.handleRemoveBaseEntity}
                    enableAddEntity={false}
                />
                <Box alignSelf='flex-end' mt={3}>
                    <Button onClick={this.handleOKClick} primary>
                        OK
                        <Icon name='ok' glyphicon right />
                    </Button>
                </Box>
            </Flex>
        );
    }
}

const data = props => ({
    dashboard: endpointActions.call('dataprovider/dashboard', {
        dashboard_uid: props.match.params.uid,
    }),
    userEntities: endpointActions.call('dataprovider/user_vehicles', {}),
    baseEntities: {
        waitFor: ['dashboard'],
        request: endpointActions.call('dataprovider/dashboards/entities', dashboard => {
            const entities = (dashboard.settings.dashboard.baseEntities || []).map(uid => ({
                entity_uid: uid,
            }));
            return {dashboard_uid: props.match.params.uid, entities};
        }),
    },
});

const mapStateToProps = state => ({
    baseEntities: dashboardSelectors.activeDashboardBaseEntities(state),
    dashboard: dashboardSelectors.activeDashboard(state),
    vehicles: entitiesSelectors.formattedVehicles(state),
});

const dispatchToProps = {
    setBaseEntities: dashboardActions.setBaseEntities,
};

export default withRouter(
    backendConnect(data, {}, mapStateToProps, dispatchToProps)(BaseEntityFormModalContainer),
);
