import {createSelector} from 'reselect';
import createCachedSelector from 're-reselect';
import cloneDeep from 'lodash.clonedeep';

import {object_from_array} from 'src/libs/Utils';

import specEngine from 'libs/spec-engine';

import * as entitiesSelectors from 'selectors/entities';

const dashboards = state => state.entities.dashboards || {};
const dashboardContext = state => state.dashboards;
const dashboardViewData = state => state.view.dashboards;
const dashboardShares = state => state.entities.dashboardShares || {};

export const activeDashboardId = createSelector(
    [dashboardContext],
    context => context.activeDashboard,
);

export const dashboardSize = createSelector([dashboardViewData], view => view.size);

export const activeDashboard = createSelector(
    [activeDashboardId, dashboards],
    (dashboardId, dashboards) => dashboards[dashboardId],
);

export const activeDashboardSettings = createSelector(
    [activeDashboard],
    dashboard => (dashboard && dashboard.settings && dashboard.settings.dashboard) || {},
);

export const activeDashboardTemplateSettings = createSelector(
    [activeDashboard],
    dashboard => (dashboard && dashboard.settings && dashboard.settings.template) || {},
);

export const activeDashboardGlobalDate = createSelector(
    [activeDashboardSettings],
    settings => settings.globalDate,
);

export const activeDashboardGlobalParams = createSelector(
    [activeDashboardGlobalDate],
    globalDate => ({globalDate}),
);

export const activeDashboardFillers = createSelector(
    [activeDashboard],
    dashboard => dashboard && dashboard.dataSpecFillers,
);

export const activeDashboardBaseEntities = createSelector(
    [activeDashboardSettings],
    settings => settings.baseEntities || [],
);

export const activeDashboardFormattedBaseEntities = createSelector(
    [activeDashboardBaseEntities, entitiesSelectors.formattedVehicles],
    (baseEntities, vehicles) =>
        object_from_array(
            baseEntities.filter(uid => uid in vehicles),
            uid => [uid, vehicles[uid]],
        ),
);

const getActivePart = createCachedSelector(
    [activeDashboard, (_state, key) => key],
    (activeDashboard, key) => {
        return activeDashboard ? activeDashboard[key] : undefined;
    },
)((_state, key) => key);

export const activeLayoutData = createCachedSelector(
    [
        state => getActivePart(state, 'layoutData'),
        (_state, asReactGridLayout) => asReactGridLayout,
        (_state, _asReactGridLayout, makeStatic) => makeStatic,
    ],
    (layoutData, asReactGridLayout, makeStatic) => {
        if (!layoutData) {
            return undefined;
        }

        let copiedLayoutData = cloneDeep(layoutData);
        if (makeStatic) {
            for (const componentId of Object.keys(copiedLayoutData)) {
                copiedLayoutData[componentId].static = true;
            }
        }

        if (!asReactGridLayout) {
            return copiedLayoutData;
        }

        return copiedLayoutData && specEngine.asReactGridLayout(copiedLayoutData);
    },
)((_state, asReactGridLayout, makeStatic) => {
    return `${asReactGridLayout}:${makeStatic}`;
});

export const activeComponentData = createSelector(
    [state => getActivePart(state, 'componentData')],
    componentData => componentData,
);

export const activeDataSpec = createSelector(
    [state => getActivePart(state, 'dataSpec')],
    dataSpec => dataSpec,
);

export const requestHashByValueHash = createSelector(
    [dashboardContext],
    context => context.requestHashByValueHash,
);

export const activeDashboardShares = createSelector(
    [activeDashboardId, dashboardShares],
    (activeDashboard, dashboardShares) => {
        return Object.values(dashboardShares).filter(
            share => share.dashboard_uid === activeDashboard,
        );
    },
);

export const dashboardNbrOfPages = createSelector(
    [state => activeLayoutData(state, true)],
    activeLayoutData => {
        if (activeLayoutData) {
            return activeLayoutData.reduce((max, entry) => {
                return entry.pageIdx + 1 > max ? entry.pageIdx + 1 : max;
            }, 0);
        }
        return 0;
    },
);
