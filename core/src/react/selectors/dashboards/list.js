import {createSelector} from 'reselect';

const dashboardViewData = state => state.view.dashboards;
const dashboards = state => state.entities.dashboards;

export const getFilters = createSelector([dashboardViewData], viewData => viewData.filters);

export const getOrder = createSelector([dashboardViewData], viewData =>
    Object.values(viewData.listOrder),
);

export const getList = createSelector([getOrder, dashboards], (order, dashboardsById) =>
    order.map(uid => dashboardsById[uid]),
);

/**
 * Selects the dashboards that are currently visible in the list of dashboards,
 * given the filters applied in the CPanel.
 */
export const filteredList = createSelector([getFilters, getList], (filters, list) =>
    list.filter(dashboard => dashboard.name.toLowerCase().includes(filters.toLowerCase())),
);
