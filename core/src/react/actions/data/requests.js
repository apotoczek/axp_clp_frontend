import * as backendActions from 'actions/data/endpoints';
import {
    CUSTOMIZATIONS_FAILURE,
    CUSTOMIZATIONS_REQUEST,
    CUSTOMIZATIONS_SUCCESS,
    CLIENT_USERS_FAILURE,
    CLIENT_USERS_REQUEST,
    CLIENT_USERS_SUCCESS,
} from 'action-types/backend';

import {DASHBOARD_LIST_SUCCESS} from 'action-types/dashboards';

export const fetchDashboards = () =>
    backendActions.call('dataprovider/dashboards', {}, true, [null, DASHBOARD_LIST_SUCCESS, null]);

export const fetchSiteCustomizations = () =>
    backendActions.call('dataprovider/site_customizations', {}, false, [
        CUSTOMIZATIONS_REQUEST,
        CUSTOMIZATIONS_SUCCESS,
        CUSTOMIZATIONS_FAILURE,
    ]);

export const fetchClientUsers = () =>
    backendActions.call('dataprovider/dashboards/users_in_client', {}, false, [
        CLIENT_USERS_REQUEST,
        CLIENT_USERS_SUCCESS,
        CLIENT_USERS_FAILURE,
    ]);
