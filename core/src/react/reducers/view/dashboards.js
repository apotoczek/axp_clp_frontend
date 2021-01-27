import {combineReducers} from 'redux';

import {createReducer} from 'reducers/utils';
import {
    DASHBOARD_CPANEL_FILTER_CLEAR,
    DASHBOARD_CPANEL_FILTER_SEARCH,
    DASHBOARD_META_CREATE,
    DASHBOARD_META_REMOVE,
    DASHBOARD_SET_SIZE,
    DASHBOARD_LIST_SUCCESS,
} from 'action-types/dashboards';

const filters = createReducer(
    {
        [DASHBOARD_CPANEL_FILTER_SEARCH]: ({searchFilter}) => searchFilter,
        [DASHBOARD_CPANEL_FILTER_CLEAR]: () => '',
    },
    '',
);

const listOrder = createReducer(
    {
        // TODO: This is temporary, we need to insert the new id according to order applied
        // by backend. Probably better to just refetch, but for now at least it pops up
        [DASHBOARD_META_CREATE]: ({dashboardId}, state) => [dashboardId, ...state],
        [DASHBOARD_META_REMOVE]: (payload, state) =>
            state.filter(dashboardId => dashboardId != payload.dashboardId),
        [DASHBOARD_LIST_SUCCESS]: ({entities}) => Object.keys(entities.dashboards || {}),
    },
    [],
);

const size = createReducer(
    {
        [DASHBOARD_SET_SIZE]: ({width, height}, state) => ({
            ...state,
            width: width || state.width,
            height: height || state.height,
        }),
    },
    {},
);

export default combineReducers({
    filters,
    listOrder,
    size,
});
