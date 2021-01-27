import {createSelector} from 'reselect';

export const entities = state => state.entities;
export const userFunds = createSelector([entities], entities => entities.userFunds);
export const portfolios = createSelector([entities], entities => entities.portfolios);
export const deals = createSelector([entities], entities => entities.deals);

export const allVehicles = createSelector(
    [userFunds, portfolios, deals],
    (userFunds, portfolios, deals) => ({
        ...userFunds,
        ...portfolios,
        ...deals,
    }),
);

export const allVehiclesAsArray = createSelector(
    [userFunds, portfolios, deals],
    (userFunds, portfolios, deals) => [
        ...Object.values(userFunds),
        ...Object.values(portfolios),
        ...Object.values(deals),
    ],
);

const ENTITY_TYPE_LABELS = {
    portfolio: 'Portfolio',
    user_fund: 'Fund',
    company: 'Company',
    deal: 'Deal',
};

export function formatVehicle(vehicle) {
    const entity_type_label = vehicle.entity_type ? ENTITY_TYPE_LABELS[vehicle.entity_type] : '';

    const cashflow_type = vehicle.cashflow_type ? vehicle.cashflow_type.titleize() : '';

    const description =
        vehicle.entity_type === 'deal'
            ? vehicle.parent_name
            : `${cashflow_type} ${entity_type_label}`;

    return {
        ...vehicle,
        description,
    };
}

export const formattedVehicles = createSelector([allVehicles], vehicles =>
    Object.map(vehicles, formatVehicle),
);
