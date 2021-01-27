import memoize from 'lodash.memoize';

import {is_set, hashed} from 'src/libs/Utils';
import {EntityType} from 'src/libs/Enums';

export const ValueMapFilter = {
    True: 'true',
    False: 'false',
    Maybe: 'maybe',
};

/**
 * The function that you should use to fetch information about the available values, but
 * also more information about a value that you already have. One can use this function to
 * get the available parameters to a value for example.
 *
 * @param {Object} valueMap The complete value map.
 * @param {Object} entity An object representing an entity type and cashflow type. Should
 * contain keys `type` and `cashflowType`.
 * @param {Object} filters Specifies a set of filters that can be applied to filter the entries
 * given back. The allowed keys are: `overTime`, `grouped`, `value`. If `value` is set, a single
 * value map entry will be returned.
 *
 * `valueType`:
 *      An array of the enum type `ValueMapTypes`. Filters out what kind of value types should be
 *      returned.
 *
 * `value`:
 *      An object with the keys `value` and `isGrouped`. `values` is a string
 *      representing a value key. `isGrouped` should be true if the value is grouped by something,
 *      and false otherwise. Settings this parameter will filter for a value map entry for this
 *      specific value. Useful in scenarios where you want more information about a specific value.
 *
 * @returns {Object} Either an object where the keys are different values in the value map, or an
 * object representing a single value map entry from the value map.
 */
export const getValueMapEntries = memoize(
    (valueMap, entity, filters = {}) => {
        const {
            overTime: overTimeFilter = ValueMapFilter.Maybe,
            grouped: groupedFilter = ValueMapFilter.Maybe,
            filtered: filteredFilter = ValueMapFilter.Maybe,
            value: {key: valueKey, isGrouped = false, groupType = undefined, isOverTime = false},
        } = filters;

        let singleEntry = false;
        let filteredEntries = _typeFilter('overTime', overTimeFilter, valueMap.entries);
        filteredEntries = _typeFilter('grouped', groupedFilter, filteredEntries);
        filteredEntries = _typeFilter('filtered', filteredFilter, filteredEntries);

        const groupedByBaseEntity = isGrouped && ['deal', 'company'].includes(groupType);
        filteredEntries = _populateParams(filteredEntries, valueMap.params, groupedByBaseEntity);

        if (valueKey) {
            singleEntry = true;
            filteredEntries = filteredEntries[valueKey];
        }

        if (filteredEntries === undefined) {
            // eslint-disable-next-line no-console
            console.error(`
                filteredEntries is undefined in getValueMapEntries
                Entity: ${entity && JSON.stringify(entity)}
                Filters: ${filters && JSON.stringify(filters)}
            `);
        }

        const adjustedEntity = _adjustEntityForGrouping(isGrouped, groupedFilter, entity);

        // Filter out endpoints, and params based on overTime and entity / cashlow type pair
        return (
            _filterGroupParams(
                adjustedEntity,
                valueKey,
                singleEntry,
            )(
                _filterEndpoints(
                    isOverTime,
                    singleEntry,
                )(
                    _filterEntityTypes(
                        adjustedEntity,
                        singleEntry,
                    )(_filterCashflowTypes(adjustedEntity, singleEntry)(filteredEntries)),
                ),
            ) || {}
        );
    },
    (valueMap, entity, filters = {}) => oneLine`
        ${Object.keys(valueMap?.entries ?? {}).join(',')}
        ${Object.keys(valueMap?.params ?? {}).join(',')}
        ${hashed(entity)}
        ${hashed(filters)}
    `,
);

function _populateParams(entries, sharedParams, groupedByBaseEntity) {
    const newEntries = {};

    const trueish = [ValueMapFilter.True, ValueMapFilter.Maybe];

    for (const [key, entry] of Object.entries(entries)) {
        const newEntry = {...entry};

        if (trueish.includes(newEntry.index)) {
            newEntry.params = {...newEntry.params, ...sharedParams.index};
        }

        if (trueish.includes(newEntry.onQuarterEnd)) {
            newEntry.params = {...newEntry.params, ...sharedParams.on_quarter_end};
        }

        if (trueish.includes(newEntry.calculationMapping)) {
            newEntry.params = {...newEntry.params, ...sharedParams.calculation_mapping};
        }

        if (trueish.includes(newEntry.grouped)) {
            newEntry.params = {...newEntry.params, ...sharedParams.group};
        }

        if (trueish.includes(newEntry.filtered)) {
            newEntry.params = {
                ...newEntry.params,
                filters: sharedParams.filters,
            };
        }

        if (trueish.includes(newEntry.currency)) {
            newEntry.params = {...newEntry.params, ...sharedParams.currency};
        }

        if (trueish.includes(newEntry.metric)) {
            newEntry.params = {...newEntry.params, ...sharedParams.metric};
            if (groupedByBaseEntity) {
                delete newEntry.params['operation'];
            }
        }

        if (trueish.includes(newEntry.asOfDate)) {
            newEntry.params = {...newEntry.params, ...sharedParams.as_of_date};
        }

        if (trueish.includes(newEntry.startDate)) {
            newEntry.params = {...newEntry.params, ...sharedParams.start_date};
        }

        newEntries[key] = newEntry;
    }

    return newEntries;
}

function _typeFilter(typeKey, filterValue, entries) {
    if (filterValue === ValueMapFilter.Maybe) {
        return entries;
    }

    const filteredEntries = {};

    for (const [key, entry] of Object.entries(entries)) {
        const typeValue = entry[typeKey] || ValueMapFilter.False;
        if (filterValue !== typeValue && typeValue !== ValueMapFilter.Maybe) {
            continue;
        }

        filteredEntries[key] = entry;
    }

    return filteredEntries;
}

function _adjustEntityForGrouping(isGrouped, groupedFilter, entity) {
    if (!is_set(entity)) {
        return [];
    }

    if (!isGrouped && groupedFilter === ValueMapFilter.False) {
        return [entity];
    }

    if (isGrouped) {
        if (entity.type === EntityType.UserFund || entity.cashflowType === 'gross') {
            return [{type: EntityType.Deal, cashflowType: entity.cashflowType}];
        } else if (entity.type === EntityType.Portfolio) {
            return [{type: EntityType.UserFund, cashflowType: entity.cashflowType}];
        }

        return [entity];
    } else if (groupedFilter === ValueMapFilter.Maybe || groupedFilter === ValueMapFilter.True) {
        let result = [entity];

        if (entity.type === EntityType.Portfolio) {
            result.push({type: EntityType.UserFund, cashflowType: entity.cashflowType});
        }

        if (entity.type !== EntityType.Deal && entity.cashflowType === 'gross') {
            result.push({type: EntityType.Deal, cashflowType: entity.cashflowType});
        }

        return result;
    }

    return [entity];
}

function _filterCashflowTypes(entities, singleEntry) {
    return entry => {
        if (!is_set(entry) || !is_set(entities, true)) {
            return entry;
        }

        const entitiesCashflowType = entities[0].cashflowType;

        if (singleEntry) {
            if (!is_set(entry.cashflowType)) {
                return entry;
            }

            return entry.cashflowType === entitiesCashflowType ? entry : undefined;
        }

        return Object.filter(
            entry,
            ({cashflowType}) => !is_set(cashflowType) || cashflowType === entitiesCashflowType,
        );
    };
}

function _filterEntityTypes(entities, singleEntry) {
    return entry => {
        if (!is_set(entry) || !is_set(entities, true)) {
            return entry;
        }

        const entityTypes = entities.map(e => e.type);

        if (singleEntry) {
            const {entities = [EntityType.Portfolio, EntityType.UserFund, EntityType.Deal]} = entry;
            return is_set(entities.intersect(entityTypes), true) ? entry : undefined;
        }

        return Object.filter(entry, value => {
            const {entities = [EntityType.Portfolio, EntityType.UserFund, EntityType.Deal]} = value;

            return is_set(entities.intersect(entityTypes), true);
        });
    };
}

function _filterEndpoints(overTime, singleEntry) {
    return entry => {
        if (!is_set(entry)) {
            return entry;
        }

        // Helper to filter out endpoints to get data over time or not.
        const _getEndpoints = endpoints =>
            Array.isArray(endpoints) ? endpoints : endpoints[(overTime && 'overTime') || 'raw'];

        if (singleEntry) {
            return {
                ...entry,
                endpoints: _getEndpoints(entry.endpoints),
            };
        }

        return Object.map(entry, value => ({...value, endpoints: _getEndpoints(value.endpoints)}));
    };
}

function _filterGroupParams(entities, valueKey, singleEntry) {
    return entry => {
        if (!is_set(entry) || entities.length !== 1 || !valueKey) {
            return entry;
        }

        const entity = entities[0];

        // We only need to filter if we have a deal or a net user fund. Gross funds and
        // portfolios can have all availabe grouping parameters no problem.
        if (
            entity.type === 'portfolio' ||
            (entity.type === 'userFund' && entity.cashflowType === 'gross')
        ) {
            return entry;
        }

        const _filterOptions = entry => {
            if (!is_set(entry.params) || !is_set(entry.params.group)) {
                return entry;
            }

            return {
                ...entry,
                params: {
                    ...entry.params,
                    group: {
                        ...entry.params.group,
                        options: {},
                    },
                },
            };
        };

        if (singleEntry) {
            return _filterOptions(entry);
        }

        return Object.map(entry, e => _filterOptions(e));
    };
}
