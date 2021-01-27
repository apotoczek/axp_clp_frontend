import merge from 'lodash.merge';
import {createReducer} from 'reducers/utils';

import {
    DASHBOARD_UPDATE,
    DASHBOARD_DETAILS_SUCCESS,
    DASHBOARD_LAYOUT_CHANGED,
    DASHBOARD_META_CREATE,
    DASHBOARD_META_REMOVE,
    DASHBOARD_SETTINGS_UPDATE,
    DASHBOARD_SET_COMPONENT_DATA,
    DASHBOARD_SET_DATA_SPEC,
    DASHBOARD_SET_LAYOUT_DATA,
    DASHOARD_SET_DATA_SPEC_FILLERS,
    DASHBOARD_SET_BASE_ENTITIES,
    DASHBOARD_SET_SETTINGS,
} from 'action-types/dashboards';

export default createReducer(
    {
        DEFAULT: (payload, state) => {
            if (payload.entities && payload.entities['dashboards']) {
                return merge({}, state, payload.entities['dashboards']);
            }
            return state;
        },
        [DASHBOARD_META_CREATE]: (
            {dashboardId, name, description, user_name, is_owner},
            state,
        ) => ({
            ...state,
            [dashboardId]: {
                uid: dashboardId,
                name,
                description,
                user_name,
                is_owner,
                componentData: {},
                layoutData: {},
                dataSpec: {},
            },
        }),
        [DASHBOARD_META_REMOVE]: ({dashboardId}, state) => {
            const newState = {...state};
            delete newState[dashboardId];
            return newState;
        },
        [DASHBOARD_UPDATE]: (payload, state) => ({
            ...state,
            [payload.dashboardId]: {
                ...state[payload.dashboardId],
                name: payload.updates.name || state[payload.dashboardId].name,
                description: payload.updates.description || state[payload.dashboardId].description,
            },
        }),
        [DASHBOARD_SETTINGS_UPDATE]: (payload, state) => ({
            ...state,
            [payload.dashboardId]: {
                ...state[payload.dashboardId],
                settings: {
                    dashboard: {
                        ...state[payload.dashboardId].settings.dashboard,
                        ...payload.updates.dashboard,
                    },
                    template: {
                        ...state[payload.dashboardId].settings.template,
                        ...payload.updates.template,
                    },
                },
            },
        }),
        [DASHBOARD_SET_BASE_ENTITIES]: (payload, state) => {
            const {
                dashboardId,
                changes: {replace = {}, add = [], remove = []},
            } = payload;
            let baseEntities = state[dashboardId].settings.dashboard.baseEntities || [];

            // Add uuids
            baseEntities = Array.from(new Set([...baseEntities, ...add]));

            // Filter out removed uuids
            baseEntities = baseEntities.filter(entity => remove.indexOf(entity) == -1);

            // Replace uuids
            baseEntities = baseEntities.map(entity => replace[entity] || entity);

            return {
                ...state,
                [payload.dashboardId]: {
                    ...state[payload.dashboardId],
                    settings: {
                        ...state[payload.dashboardId].settings,
                        dashboard: {
                            ...state[payload.dashboardId].settings.dashboard,
                            baseEntities,
                        },
                    },
                },
            };
        },
        [DASHBOARD_SET_SETTINGS]: (payload, state) => ({
            ...state,
            [payload.dashboardId]: {
                ...state[payload.dashboardId],
                settings: payload.settings,
            },
        }),
        [DASHBOARD_DETAILS_SUCCESS]: (payload, state) => ({
            ...state,
            [payload.dashboardId]: {
                ...state[payload.dashboardId],
                componentData: payload.componentData,
                layoutData: payload.layoutData,
                dataSpec: payload.dataSpec,
                dataSpecFillers: payload.dataSpecFillers,
            },
        }),

        //
        // COMPONENT DATA
        //
        [DASHBOARD_SET_COMPONENT_DATA]: (payload, state) => {
            if (payload.componentDatas) {
                return {
                    ...state,
                    [payload.dashboardId]: {
                        ...state[payload.dashboardId],
                        componentData: {
                            ...state[payload.dashboardId].componentData,
                            ...payload.componentDatas,
                        },
                    },
                };
            }

            return {
                ...state,
                [payload.dashboardId]: {
                    ...state[payload.dashboardId],
                    componentData: payload.componentData,
                },
            };
        },

        //
        // LAYOUT DATA
        //
        [DASHBOARD_SET_LAYOUT_DATA]: (payload, state) => {
            if (payload.layoutDatas) {
                return {
                    ...state,
                    [payload.dashboardId]: {
                        ...state[payload.dashboardId],
                        layoutData: {
                            ...state[payload.dashboardId].layoutData,
                            ...payload.layoutDatas,
                        },
                    },
                };
            }

            return {
                ...state,
                [payload.dashboardId]: {
                    ...state[payload.dashboardId],
                    layoutData: payload.layoutData,
                },
            };
        },
        [DASHBOARD_LAYOUT_CHANGED]: (payload, state) => {
            const layoutData = {...state[payload.dashboardId].layoutData};

            for (const [id, layout] of Object.entries(payload.newLayout)) {
                layoutData[id] = {...layoutData[id], ...layout};
            }

            return {
                ...state,
                [payload.dashboardId]: {
                    ...state[payload.dashboardId],
                    layoutData,
                },
            };
        },

        //
        // DATA SPEC
        //
        [DASHBOARD_SET_DATA_SPEC]: (payload, state) => {
            if (payload.dataSpecs) {
                return {
                    ...state,
                    [payload.dashboardId]: {
                        ...state[payload.dashboardId],
                        dataSpec: {
                            ...state[payload.dashboardId].dataSpec,
                            ...payload.dataSpecs,
                        },
                    },
                };
            }

            return {
                ...state,
                [payload.dashboardId]: {
                    ...state[payload.dashboardId],
                    dataSpec: payload.dataSpec,
                },
            };
        },

        //
        // DATA SPEC FILLERS
        //
        [DASHOARD_SET_DATA_SPEC_FILLERS]: (payload, state) => ({
            ...state,
            [payload.dashboardId]: {
                ...state[payload.dashboardId],
                dataSpecFillers: payload.fillers,
            },
        }),
    },
    {},
);
