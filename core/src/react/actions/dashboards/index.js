import specEngine from 'libs/spec-engine';
import {deep_copy_object, is_set} from 'src/libs/Utils';

import {batchedRequest} from 'actions/data/endpoints';
import * as api from 'api';

import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as dashboardsSelectors from 'selectors/dashboards';

import {dateSelectionTimestamp} from 'src/helpers/dashboards';

import {
    DASHBOARD_UPDATE,
    DASHBOARD_DETAILS_FAILURE,
    DASHBOARD_DETAILS_REQUEST,
    DASHBOARD_DETAILS_SUCCESS,
    DASHBOARD_LAYOUT_CHANGED,
    DASHBOARD_SETTINGS_UPDATE,
    DASHBOARD_SET_ACTIVE,
    DASHBOARD_SET_SIZE,
    DASHBOARD_VALUE_MAP_FAILURE,
    DASHBOARD_VALUE_MAP_REQUEST,
    DASHBOARD_VALUE_MAP_SUCCESS,
    DASHBOARD_UPDATE_VALUE_HASH_TO_REQUEST_HASH_MAP,
    DASHBOARD_CREATE_SHARE,
    DASHBOARD_DELETE_SHARE,
    DASHOARD_SET_DATA_SPEC_FILLERS,
    DASHBOARD_SET_BASE_ENTITIES,
    DASHBOARD_SET_DATA_SPEC,
    DASHBOARD_SET_COMPONENT_DATA,
    DASHBOARD_SET_LAYOUT_DATA,
    DASHBOARD_SET_SETTINGS,
} from 'action-types/dashboards';

export function setDashboardSize(width, height) {
    return {
        type: DASHBOARD_SET_SIZE,
        payload: {
            width,
            height,
        },
    };
}

export function updateDashboard(updates, dashboard) {
    return {
        type: DASHBOARD_UPDATE,
        payload: {
            updates,
            dashboardId: dashboard,
        },
    };
}

export function updateDashboardSettings(updates, dashboard) {
    return {
        type: DASHBOARD_SETTINGS_UPDATE,
        payload: {
            updates,
            dashboardId: dashboard,
        },
    };
}

export function setGlobalDate(timestamp) {
    return function action(dispatch, getState) {
        const dashboardId = dashboardSelectors.activeDashboardId(getState());
        dispatch(updateDashboardSettings({dashboard: {globalDate: timestamp}}, dashboardId));
        const dataSpec = dashboardSelectors.activeDataSpec(getState());
        dispatch(requestDataForSpec(dashboardId, dataSpec, null));
    };
}

export function setBaseEntities(changes, requestData = true) {
    return function action(dispatch, getState) {
        const dashboardId = dashboardSelectors.activeDashboardId(getState());
        const dataSpec = dashboardSelectors.activeDataSpec(getState());
        const oldFillers = specEngine.getSpecFillers(dataSpec);

        const {replace = {}, remove = []} = changes;

        let fillers = oldFillers;
        for (const [oldEntityId, newEntityId] of Object.entries(replace)) {
            fillers = specEngine.swapFiller(oldEntityId, newEntityId, fillers);
        }

        for (const entityId of remove) {
            fillers = specEngine.removeFiller(entityId, fillers);
        }

        fillers = fillers || {};

        dispatch({type: DASHOARD_SET_DATA_SPEC_FILLERS, payload: {dashboardId, fillers}});
        dispatch({type: DASHBOARD_SET_BASE_ENTITIES, payload: {dashboardId, changes}});

        const layoutData = dashboardSelectors.activeLayoutData(getState());
        const componentData = dashboardSelectors.activeComponentData(getState());
        const filledDataSpec = specEngine.insertEntityFillers(fillers, dataSpec);

        return dispatch(
            deriveDashboard(requestData, {
                uid: dashboardId,
                layoutData,
                dataSpec: filledDataSpec,
                componentData,
            }),
        ).then(derivedDashboard => {
            dispatch({
                type: DASHBOARD_SET_DATA_SPEC,
                payload: {dashboardId, dataSpec: derivedDashboard.dataSpec},
            });
            dispatch({
                type: DASHBOARD_SET_COMPONENT_DATA,
                payload: {dashboardId, componentData: derivedDashboard.componentData},
            });
            dispatch({
                type: DASHBOARD_SET_LAYOUT_DATA,
                payload: {dashboardId, layoutData: derivedDashboard.layoutData},
            });
        });
    };
}

export function saveDashboard() {
    return function action(dispatch, getState) {
        const data = dashboardSelectors.activeDashboard(getState());
        const {cleanedDataSpec, dataSpecFillers} = specEngine.cleanRepeaters(data.dataSpec);
        const cleanDashboard = specEngine.cleanReportingComponents({
            componentData: data.componentData,
            layoutData: data.layoutData,
            dataSpec: cleanedDataSpec,
        });

        const dataToSave = deep_copy_object(data);
        dataToSave.dataSpec = cleanDashboard.dataSpec;
        dataToSave.componentData = cleanDashboard.componentData;
        dataToSave.layoutData = cleanDashboard.layoutData;
        dataToSave.dataSpecFillers = dataSpecFillers;

        return api.saveDashboard(dataToSave);
    };
}

export function shareDashboard(data) {
    return function action(dispatch, getState) {
        const dashboardId = dashboardSelectors.activeDashboardId(getState());

        return api.shareDashboard(dashboardId, data).then(result => {
            dispatch({type: DASHBOARD_CREATE_SHARE, payload: result});
        });
    };
}

export function deleteDashboardShare(shareUid, dashboardUid) {
    return function action(dispatch, _getState) {
        return api.deleteDashboardShare(shareUid, dashboardUid).then(() => {
            dispatch({type: DASHBOARD_DELETE_SHARE, payload: {uid: shareUid}});
        });
    };
}

export function layoutChanged(newLayout) {
    return function action(dispatch, getState) {
        let formattedLayout = specEngine.formatLayout(newLayout);
        dispatch({
            type: DASHBOARD_LAYOUT_CHANGED,
            payload: {
                dashboardId: dashboardSelectors.activeDashboardId(getState()),
                newLayout: formattedLayout,
            },
        });
    };
}

export function setActiveDashboard(dashboardId) {
    return async function action(dispatch, getState) {
        // If the provided dashboard is already active, return early
        let activeDashboardId = dashboardSelectors.activeDashboardId(getState());
        if (dashboardId == activeDashboardId) {
            return;
        }

        dispatch({type: DASHBOARD_SET_ACTIVE, payload: {dashboardId}});
        dispatch({type: DASHBOARD_DETAILS_REQUEST});

        try {
            // Fetch the dashboard information and let the spec engine derive it
            const dashboard = await api.callEndpoint('dataprovider/dashboard', {
                dashboard_uid: dashboardId,
            });

            // If there is not data, we can't derive further.
            if (!is_set(dashboard)) {
                return;
            }

            dispatch({
                type: DASHBOARD_SET_SETTINGS,
                payload: {
                    dashboardId,
                    settings: dashboard.settings,
                },
            });

            dashboard.dataSpec = specEngine.insertEntityFillers(
                dashboard.dataSpecFillers,
                dashboard.dataSpec,
            );

            // We need to derive the spec to continue fetching information to
            // display all the components
            const derivedDashboard = await dispatch(deriveDashboard(true, dashboard));

            dispatch({
                type: DASHBOARD_DETAILS_SUCCESS,
                payload: {
                    dashboardId,
                    layoutData: derivedDashboard.layoutData,
                    componentData: derivedDashboard.componentData,
                    dataSpec: derivedDashboard.dataSpec,
                    dataSpecFillers: derivedDashboard.dataSpecFillers,
                },
            });

            return;
        } catch (error) {
            dispatch({type: DASHBOARD_DETAILS_FAILURE, payload: {dashboardId, error}});
            throw error;
        }
    };
}

function _findRepeaterRoots(dataSpec = {}, componentIds = []) {
    const compIds = componentIds.length ? componentIds : Object.keys(dataSpec);
    return compIds.reduce((roots, componentId) => {
        const merged = {...roots};
        const repeatRootEntries = Object.entries(
            specEngine.extractRepeaterRoots(componentId, dataSpec),
        );

        for (const [uid, meta] of repeatRootEntries) {
            if (uid in merged) {
                merged[uid].targets = {...merged[uid].targets, ...meta.targets};
            } else {
                merged[uid] = meta;
            }
        }

        return merged;
    }, {});
}

function deriveSpecs(dashboard, repeaters, rcInstancesByComponent, componentIds = []) {
    // If we derive an already derived dashboard, we might end up in a state where data
    // from a previous reporting component definition is kept inside the spec after
    // derivation. To avoid this, we clean out the reporting components first, so that
    // we remove this "old" data. This causes us to potentially re-fetch the same data we
    // already had in the dashboard, but this is a minor performance issue, as long as you
    // pass a reasonable amount of component ids.
    let derivedDashboard = specEngine.cleanReportingComponents(dashboard, componentIds);
    derivedDashboard = specEngine.deriveReportingComponents(
        derivedDashboard,
        rcInstancesByComponent,
        componentIds,
    );

    const derivedDataSpec = specEngine.deriveDataSpec(
        repeaters,
        derivedDashboard.dataSpec,
        componentIds,
    );

    // Extract the repeaters from the derivation made of the data spec. This is used to
    // derive how to repeat components in component data and layout data, so that components
    // are repeated the same way across the specs.
    const componentRepeaters = specEngine.extractComponentRepeaters(derivedDataSpec);

    // Use the above extracted repeaters to derive component data and layout data.
    const derivedComponentData = specEngine.deriveSpecRepeaters(
        componentRepeaters,
        derivedDashboard.componentData,
        componentIds,
    );
    let derivedLayoutData = specEngine.deriveSpecRepeaters(
        componentRepeaters,
        derivedDashboard.layoutData,
        componentIds,
    );

    // Re-calculate the layout data, making sure that the layout of the dashboard is valid.
    derivedLayoutData = specEngine.recalculateLayout(derivedLayoutData);

    return {
        dataSpec: derivedDataSpec,
        componentData: derivedComponentData,
        layoutData: derivedLayoutData,
    };
}

async function _fetchRCInstancesFromDefinitions(rcDefinitions, globalDate) {
    const instancesByComponent = {};

    for (const [componentId, rcDefintion] of Object.entries(rcDefinitions)) {
        const params = {
            reporting_component_uid: rcDefintion.reportingComponentId,
            as_of_date: dateSelectionTimestamp(rcDefintion.asOfDate, globalDate),
            deal_uid: rcDefintion.entity.uid,
        };

        try {
            const {reporting_component_instance: instance} = await api.callEndpoint(
                'reporting-components/instance/get',
                params,
            );
            instancesByComponent[componentId] = {
                layoutData: instance.layout_data,
                componentData: instance.component_data,
                dataSpec: instance.data_spec,
            };
        } catch (err) {
            continue;
        }
    }

    return instancesByComponent;
}

export function deriveDashboard(requestData, dashboard, componentIds = []) {
    return async function action(dispatch, getState) {
        const repeaterRoots = _findRepeaterRoots(dashboard.dataSpec || {}, componentIds);
        const globalDate = dashboardSelectors.activeDashboardGlobalDate(getState());
        const rcDefinitionsByComponent = specEngine.extractReportingComponentDefinitions(
            dashboard.componentData || {},
            componentIds,
        );

        const repeaters = await api.callEndpoint('dataprovider/repeaters_for_entities', {
            entities: repeaterRoots,
        });

        // Fetch reporting components from backend and re-map them into a structure
        // that is more appropriate for the frontend.
        const rcInstancesByComponent = await _fetchRCInstancesFromDefinitions(
            rcDefinitionsByComponent,
            globalDate,
        );

        const derivedSpecs = deriveSpecs(
            dashboard,
            repeaters,
            rcInstancesByComponent,
            componentIds,
        );

        if (requestData) {
            dispatch(requestDataForSpec(dashboard.uid, derivedSpecs.dataSpec, componentIds));
        }

        return {
            dataSpec: derivedSpecs.dataSpec,
            componentData: derivedSpecs.componentData,
            layoutData: derivedSpecs.layoutData,
            dataSpecFillers: dashboard.dataSpecFillers || {},
        };
    };
}

/**
 * Calculates what endpoints to call from the backend to fetch the appropriate
 * data for all components, and performs those requests.
 *
 * @param {str} dashboardId. Id of the dashboard. We need it to gain access to
 * data on the backend.
 * @param {object} dataSpec An object describing the data that each component
 * needs to be displayed correctly.
 * @param {string} componentId The component in the `dataSpec` to fetch data
 * for. This is optional. If not provided, data will be fetched for all
 * components in dataSpec.
 */
export function requestDataForSpec(dashboardId, dataSpec, componentIds) {
    return function action(dispatch, getState) {
        const valueMap = dashboardsSelectors.valueMap(getState());
        const globalParams = dashboardSelectors.activeDashboardGlobalParams(getState());

        // Calculate what endpoints we need to call from the data specification
        // that we derived above for each component in the dashboard.
        let clearOldValueHashToRequestHashMap = !is_set(componentIds, true);

        // TODO: we'll need to include parent as well.
        let spec = dataSpec;
        if (is_set(componentIds, true)) {
            spec = {};
            for (const componentId of componentIds) {
                spec[componentId] = dataSpec[componentId];
            }
        }

        const [endpoints = [], valueHashToRequestHash = {}] = specEngine.calculateEndpoints(
            spec,
            valueMap,
            globalParams,
        );

        if (is_set(endpoints, true)) {
            // add the dashboard_uid of the current dashboard to the params of each
            // request
            const endpointsWithDashboard = endpoints.map(endpoint => ({
                ...endpoint,
                params: {
                    ...endpoint.params,
                    dashboard_uid: dashboardId,
                },
            }));

            dispatch(
                batchedRequest(endpointsWithDashboard, undefined, undefined, ['dashboard_uid']),
            );
        }

        dispatch({
            type: DASHBOARD_UPDATE_VALUE_HASH_TO_REQUEST_HASH_MAP,
            payload: {
                valueHashToRequestHash,
                clearOld: clearOldValueHashToRequestHashMap,
            },
        });
    };
}

export function populateValueMap() {
    return function action(dispatch) {
        dispatch({type: DASHBOARD_VALUE_MAP_REQUEST});
        return api
            .callEndpoint('dataprovider/dynamic_value_map_entries')
            .then(dynamicValueMap => {
                const finalValueMap = deep_copy_object(dynamicValueMap);
                dispatch({
                    type: DASHBOARD_VALUE_MAP_SUCCESS,
                    payload: {
                        valueMap: finalValueMap,
                    },
                });
            })
            .catch(_ => {
                dispatch({type: DASHBOARD_VALUE_MAP_FAILURE});
            });
    };
}
