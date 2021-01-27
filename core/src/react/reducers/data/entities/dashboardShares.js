import {createReducer, mergeEntities} from 'reducers/utils';

import {DASHBOARD_CREATE_SHARE, DASHBOARD_DELETE_SHARE} from 'action-types/dashboards';

export default createReducer(
    {
        DEFAULT: (payload, state) => mergeEntities('dashboardShares', payload, state),
        [DASHBOARD_DELETE_SHARE]: ({uid}, state) => {
            const newState = {...state};
            delete newState[uid];
            return newState;
        },
        [DASHBOARD_CREATE_SHARE]: (payload, state) => {
            return {
                ...state,
                [payload.uid]: payload,
            };
        },
    },
    {},
);
