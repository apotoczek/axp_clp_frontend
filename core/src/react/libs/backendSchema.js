import {schema} from 'normalizr';
import {is_set} from 'src/libs/Utils';

const nonDerivedKeys = {
    attributes: new Set(['uid', 'name']),
    attributeMembers: new Set(['uid', 'name']),
    attributeValues: new Set(['uid', 'value', 'entity', 'attribute', 'attribute_member']),
    textDataValues: new Set(['uid', 'value', 'spec_uid']),
    userFunds: new Set([
        'age',
        'base_currency',
        'deals',
        'cashflow_type',
        'entity_name',
        'entity_type',
        'entity_uid',
        'market_id',
        'portfolio_item_uid',
        'transaction_status',
    ]),
    portfolios: new Set([
        'entity_name',
        'entity_type',
        'entity_uid',
        'cashflow_type',
        'funds',
        'deals',
    ]),
    deals: new Set([
        'entity_name',
        'entity_type',
        'entity_uid',
        'cashflow_type',
        'meta_datas', //TODO: REMOVE THIS
        'metrics',
        'parent',
        'parent_name',
    ]),
    dashboards: new Set([
        'description',
        'is_owner',
        'layoutData',
        'meta_data',
        'name',
        'uid',
        'user_name', // TODO Set as user relation instead
        'componentData',
        'dataSpec',
        'dataSpecFillers',
        'settings',
        'read',
        'write',
        'share',
    ]),
    metrics: new Set(['format', 'entity_type', 'entity_uid']),
    dashboardShares: new Set([
        'uid',
        'read',
        'write',
        'share',
        'client_name',
        'client_uid',
        'dashboard_uid',
        'display_name',
        'email',
        'expired',
        'expiry',
        'first_name',
        'last_name',
        'pending',
        'revoked',
        'revoked_date',
        'shared_by_user_uid',
    ]),
};

export const extractData = (entities, derived = false) => {
    const result = {};

    for (const [entityType, keys] of Object.entries(nonDerivedKeys)) {
        const ensuredKeys = keys || new Set();
        if (!entities[entityType]) {
            continue;
        }

        result[entityType] = result[entityType] || {};
        for (const [uid, entity] of Object.entries(entities[entityType])) {
            result[entityType][uid] = Object.filter(entity, (_value, key) =>
                derived ? !ensuredKeys.has(key) : ensuredKeys.has(key),
            );

            // Remove the empty object if the entity didn't have any derived data
            if (!is_set(result[entityType][uid], true)) {
                delete result[entityType][uid];
            }
        }

        // Remove the empty object if no entity had any derived data
        if (!is_set(result[entityType], true)) {
            delete result[entityType];
        }
    }

    return result;
};

const attribute = new schema.Entity(
    'attributes',
    {},
    {
        idAttribute: 'uid',
    },
);

const attributeMember = new schema.Entity(
    'attributeMembers',
    {},
    {
        idAttribute: 'uid',
    },
);

const attributeValue = new schema.Entity(
    'attributeValues',
    {
        attribute_member: attributeMember,
        attribute: attribute,
    },
    {
        idAttribute: 'uid',
    },
);

const textDataValue = new schema.Entity(
    'textDataValues',
    {},
    {
        idAttribute: 'uid',
    },
);

const metric = new schema.Entity(
    'metrics',
    {},
    {
        idAttribute: 'identifier',
    },
);

export const deal = new schema.Entity(
    'deals',
    {
        metrics: [metric],
        text_data: [textDataValue],
    },
    {
        idAttribute: 'entity_uid',
    },
);

export const userFund = new schema.Entity(
    'userFunds',
    {
        deals: [deal],
        metrics: [metric],
    },
    {
        idAttribute: 'entity_uid',
    },
);
deal.define({parent: userFund});

export const portfolio = new schema.Entity(
    'portfolios',
    {
        funds: [userFund],
        deals: [deal],
    },
    {
        idAttribute: 'entity_uid',
    },
);

export const vehicle = new schema.Union(
    {
        user_fund: userFund,
        portfolio: portfolio,
        deal: deal,
    },
    'entity_type',
);
attributeValue.define('entity', vehicle);

const dashboard = new schema.Entity(
    'dashboards',
    {},
    {
        idAttribute: 'uid',
    },
);

const dashboardShare = new schema.Entity(
    'dashboardShares',
    {},
    {
        idAttribute: 'uid',
    },
);

export const getSchema = endpoint =>
    ({
        // TODO available_repeaters
        'dataprovider/dashboards/entities': [vehicle],
        'dataprovider/dashboards/vehicle-attributes': vehicle,
        'dataprovider/dashboards/vehicle-performance': vehicle,
        'dataprovider/dashboards/vehicle-performance-progression': vehicle,
        'dataprovider/dashboards/vehicle-cashflow': vehicle,
        'dataprovider/dashboards/vehicle-spanning-cashflows': vehicle,
        'dataprovider/dashboards': {results: new schema.Array(dashboard)}, // TODO: pagination
        'dataprovider/dashboard': dashboard,
        'dataprovider/user_vehicles': [vehicle],
        'dataprovider/dashboards/text-data': vehicle,
        'dataprovider/dashboards/metric-statistics': vehicle,
        'dataprovider/dashboards/metric-trends': vehicle,
        'dataprovider/dashboard_shares': [dashboardShare],
        'dataprovider/dashboards/valuation-bridge': vehicle,
        'dataprovider/dashboards/entity': vehicle,
        'dataprovider/dashboards/pme': vehicle,
        'dataprovider/dashboards/pme-trends': vehicle,
    }[endpoint]);

export default getSchema;
