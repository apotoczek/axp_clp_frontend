import {combineReducers} from 'redux';

import {createReducer} from 'reducers/utils';
import {
    DASHBOARD_DETAILS_SUCCESS,
    DASHBOARD_META_REMOVE,
    DASHBOARD_SELECT_COMPONENT,
    DASHBOARD_SET_ACTIVE,
    DASHBOARD_VALUE_MAP_FAILURE,
    DASHBOARD_VALUE_MAP_REQUEST,
    DASHBOARD_VALUE_MAP_SUCCESS,
    DASHBOARD_UPDATE_VALUE_HASH_TO_REQUEST_HASH_MAP,
} from 'action-types/dashboards';

const selectedComponentByDashboardId = createReducer(
    {
        [DASHBOARD_SELECT_COMPONENT]: ({componentId, dashboardId}, state) => ({
            ...state,
            [dashboardId]: componentId,
        }),
        [DASHBOARD_DETAILS_SUCCESS]: ({selectedId, dashboardId}, state) => ({
            ...state,
            [dashboardId]: selectedId || state[dashboardId],
        }),
    },
    {},
);

const activeDashboard = createReducer(
    {
        [DASHBOARD_SET_ACTIVE]: ({dashboardId}) => dashboardId,
        [DASHBOARD_META_REMOVE]: ({dashboardId}, state) => (dashboardId === state ? null : state),
    },
    null,
);

const valueMap = createReducer(
    {
        [DASHBOARD_VALUE_MAP_FAILURE]: () => ({}),
        [DASHBOARD_VALUE_MAP_REQUEST]: (_payload, state) => state || {},
        [DASHBOARD_VALUE_MAP_SUCCESS]: ({valueMap}) => valueMap,
    },
    {},
);

const requestHashByValueHash = createReducer(
    {
        [DASHBOARD_UPDATE_VALUE_HASH_TO_REQUEST_HASH_MAP]: (payload, state) => ({
            ...(payload.clearOld ? {} : state),
            ...payload.valueHashToRequestHash,
        }),
        [DASHBOARD_SET_ACTIVE]: () => ({}),
    },
    {},
);

export default combineReducers({
    selectedComponentByDashboardId,
    activeDashboard,
    valueMap,
    requestHashByValueHash,
});
