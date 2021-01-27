import {createSelector} from 'reselect';
import {utils as reactGridLayoutUtils} from 'react-grid-layout';
import * as normalizr from 'normalizr';
import merge from 'lodash.merge';

import * as backendSchema from 'libs/backendSchema';
import ValuesHandler from 'libs/spec-engine/values-handler';
import {is_set} from 'src/libs/Utils';

import {createComponentSelector} from 'selectors/utils';
import * as entitiesSelectors from 'selectors/entities';
import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as dashboardsSelectors from 'selectors/dashboards';
import * as valueMapSelectors from 'selectors/dashboards/valueMapSelectors';

const derivedData = state => state.derivedData;

const valueEntityKeys = [
    'userFunds',
    'attributes',
    'attributeMembers',
    'attributeValues',
    'textDataValues',
    'portfolios',
    'deals',
    'metrics',
];

const valueEntities = createComponentSelector(
    valueEntityKeys.map(key => state => state.entities[key]),
    (...args) => {
        const entities = {};

        for (const [idx, key] of valueEntityKeys.entries()) {
            entities[key] = args[idx];
        }

        return entities;
    },
);

const componentId = (state, componentId) => componentId;

export const dataSpec = createComponentSelector(
    [dashboardSelectors.activeDataSpec, componentId],
    (dataSpec, componentId) => dataSpec && dataSpec[componentId],
);

export const componentData = createComponentSelector(
    [dashboardSelectors.activeComponentData, componentId],
    (componentData, componentId) => componentData && componentData[componentId],
);

export const selectedComponentValueMapEntries = createSelector(
    [dataSpec, dashboardsSelectors.valueMap],
    (componentDataSpec, valueMap) => {
        return ValuesHandler.getValueMapEntriesForValues(componentDataSpec, valueMap);
    },
);

export const componentValueMapEntries = createComponentSelector(
    [dataSpec, dashboardsSelectors.valueMap, componentId],
    (componentDataSpec, valueMap) => {
        return ValuesHandler.getValueMapEntriesForValues(componentDataSpec, valueMap);
    },
);

const requestMetaData = (state, _props) => state.requestMetaData;

const componentRequestMetaData = createComponentSelector(
    [dataSpec, dashboardSelectors.requestHashByValueHash, requestMetaData],
    (componentDataSpec, requestHashByValueHash, requestMetaData) => {
        // Get all unique values in the current component. This is multiple entries
        // even for values that have been repeated.
        const componentValues = ValuesHandler.componentValues(componentDataSpec) || {};

        const items = [];

        for (const valueHash of Object.keys(componentValues)) {
            const requestHash = requestHashByValueHash[valueHash];

            if (!requestHash) {
                continue;
            }

            const metaData = requestMetaData[requestHash];

            if (!metaData) {
                continue;
            }

            items.push(metaData);
        }

        return items;
    },
);

export const isComponentLoading = createComponentSelector(
    [componentRequestMetaData],
    componentMetaData => {
        for (const {isLoading} of componentMetaData) {
            if (isLoading) {
                return true;
            }
        }

        return false;
    },
);

export const componentErrorMessage = createComponentSelector(
    [componentRequestMetaData],
    componentMetaData => {
        for (const {failReason} of componentMetaData) {
            if (failReason) {
                return failReason;
            }
        }

        return null;
    },
);

export const componentHasError = createComponentSelector([componentErrorMessage], errorMessage => {
    return is_set(errorMessage, true);
});

export const componentEntityData = createComponentSelector(
    [
        dataSpec,
        dashboardSelectors.requestHashByValueHash,
        valueEntities,
        derivedData,
        componentValueMapEntries,
        isComponentLoading,
        componentHasError,
    ],
    (
        componentDataSpec,
        requestHashByValueHash,
        valueEntities,
        derivedData,
        valueMap,
        isLoading,
        hasError,
    ) => {
        if (!Object.keys(valueMap).length || isLoading || hasError) {
            return {};
        }
        const entityDataByValueId = {};

        // Get all unique values in the current component. This is multiple entries
        // even for values that have been repeated.
        const componentValues = ValuesHandler.componentValues(componentDataSpec);
        // Filter the redux state for the entities that this component has values for
        const entitiesToDenormalize = Object.values(componentValues)
            .map(({entity}) => [entity.uid, entity.type.underscore(false)])
            .map(p => ({id: p[0], schema: p[1]}));

        for (const [valueHash, {entity, valueId, valueKey, params}] of Object.entries(
            componentValues,
        )) {
            const valueMapEntry = valueMap[valueHash] || {};
            const requestHash = requestHashByValueHash[valueHash];
            const derivedEntities = derivedData[requestHash];

            // Denormalize the state again so that we get all the data we need in nested
            // form
            const denormalizedEntities = normalizr.denormalize(
                entitiesToDenormalize,
                [backendSchema.vehicle],
                merge({}, derivedEntities, valueEntities),
            );

            let entityData = denormalizedEntities.find(({entity_uid}) => entity_uid === entity.uid);

            let stateSelector = valueMapEntry.stateSelector;
            if (stateSelector) {
                const stateSelectorFn = valueMapSelectors[stateSelector];
                entityData = stateSelectorFn(valueKey, entityData, params);
            }

            entityDataByValueId[valueId] = {
                ...(entityDataByValueId[valueId] || {}),
                [entity.uid]: entityData,
            };
        }

        return entityDataByValueId;
    },
);

const explicitlySelectedComponentId = createSelector(
    [dashboardSelectors.activeDashboardId, dashboardsSelectors.selectedComponentByDashboardId],
    (dashboardId, selectedComponentByDashboardId) => {
        if (selectedComponentByDashboardId && selectedComponentByDashboardId[dashboardId]) {
            return selectedComponentByDashboardId[dashboardId];
        }

        return undefined;
    },
);

export const selectedComponentId = createSelector(
    [
        explicitlySelectedComponentId,
        state => dashboardSelectors.activeLayoutData(state, true, false),
    ],
    (explicitlySelectedComponentId, layoutData) => {
        if (explicitlySelectedComponentId) {
            return explicitlySelectedComponentId;
        }

        if (!layoutData || !layoutData.length) {
            return undefined;
        }

        // No component has been explcitly selected by the user, we fallback to
        // automatically selecting the upper most left item in the dashboard
        const layoutItems = reactGridLayoutUtils.sortLayoutItems(layoutData, 'vertical');

        return layoutItems && layoutItems.length > 0 && layoutItems[0].i;
    },
);

export const selectedComponentData = createSelector(
    [dashboardSelectors.activeComponentData, selectedComponentId],
    (componentData, selectedId) => componentData && componentData[selectedId],
);

export const selectedLayoutData = createSelector(
    [state => dashboardSelectors.activeLayoutData(state, false, true), selectedComponentId],
    (layoutData, selectedId) => layoutData && layoutData[selectedId],
);

export const selectedDataSpec = createSelector(
    [dashboardSelectors.activeDataSpec, selectedComponentId],
    (dataSpec, selectedId) => dataSpec && dataSpec[selectedId],
);

export const selectedEntityName = createSelector(
    [entitiesSelectors.allVehicles, selectedDataSpec],
    (vehicles, dataSpec) => {
        if (!dataSpec || !dataSpec.entity) {
            return 'N/A';
        }

        let vehicle = vehicles && vehicles[dataSpec.entity.uid];
        if (vehicle) {
            return vehicle.entity_name || 'N/A';
        }
    },
);
