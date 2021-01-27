import * as api from 'api';

import {joinUrl} from 'src/libs/Utils';
import history from 'utils/history';

import {request} from 'actions/data/endpoints';
import {
    DASHBOARD_CPANEL_FILTER_SEARCH,
    DASHBOARD_META_CREATE,
    DASHBOARD_META_REMOVE,
} from 'action-types/dashboards';

export const requestDashboardList = () => request('dataprovider/dashboards');

export const create = (
    name,
    description,
    templateSettings,
    dashboardSettings,
    parentUid,
) => dispatch => {
    return api
        .createDashboard(name, description, templateSettings, dashboardSettings, parentUid)
        .then(({uid: dashboardId, user_name, is_owner}) => {
            dispatch({
                type: DASHBOARD_META_CREATE,
                payload: {dashboardId, name, description, user_name, is_owner},
            });
            history.push(joinUrl('/documents/', dashboardId, 'edit'));
        });
};

export const remove = uid => dispatch => {
    return api.deleteDashboard(uid).then(response => {
        if (response && response[0]) {
            let uid = response[0];
            dispatch({type: DASHBOARD_META_REMOVE, payload: {dashboardId: uid}});
        }
    });
};

export const copy = uid => dispatch => {
    return api.copyDashboard(uid).then(({uid, name, user_name, is_owner}) => {
        dispatch({
            type: DASHBOARD_META_CREATE,
            payload: {
                dashboardId: uid,
                name,
                user_name,
                is_owner,
            },
        });
    });
};

export const filterDashboardList = filter => ({
    type: DASHBOARD_CPANEL_FILTER_SEARCH,
    payload: {
        searchFilter: filter,
    },
});
