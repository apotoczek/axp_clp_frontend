import {createSelector} from 'reselect';

const dashboardContext = state => state.dashboards;

//
// META DATA SELECTORS
//
export const selectedComponentByDashboardId = createSelector(
    [dashboardContext],
    context => context && context.selectedComponentByDashboardId,
);

//
// VALUE MAP
//
export const valueMap = createSelector([dashboardContext], context => context && context.valueMap);
