import * as api from 'api';

import ValuesHandler from 'libs/spec-engine/values-handler';
import {isValidMetricVersion} from 'libs/spec-engine/params';

import {singularizeEntityType} from 'src/libs/Mapping';
import {
    is_any_set,
    is_set,
    object_from_array,
    set_intersection,
    set_difference,
    set_union,
} from 'src/libs/Utils';
import isEqual from 'lodash.isequal';

import {DateParamType} from 'src/libs/Enums';
import {dateSelectionTimestamp} from 'src/helpers/dashboards';

function entitiesParams({_valueKey, _params, entity, _valueMapEntry}) {
    const endpointParams = {
        entities: [
            {
                entity_type: entity.type.underscore(),
                entity_uid: entity.uid,
            },
        ],
    };

    return [endpointParams, new Set()];
}

function baseForEndpointParams(entity) {
    return {
        entity_type: entity.type.underscore(),
        [`${singularizeEntityType(entity.type).underscore()}_uid`]: entity.uid,
        entity_uid: entity.uid,
    };
}

function _handleFilters(valueMapEntry, params) {
    const filterParams = {};

    if (!is_set(valueMapEntry.params, true)) {
        return filterParams;
    }

    for (const [key, settings] of Object.entries(params.filters)) {
        /*
        Some filters are placed in some other entry than their key. That is found
        in filterName entry.
        */
        const filterName = valueMapEntry.params.filters[key].filterName;
        if (['custom_attributes', 'enums', 'cf_attribute_filters'].includes(filterName)) {
            const subFilterArray = filterParams[filterName] || [];
            subFilterArray.push({
                uid: key,
                value: {
                    leaves: settings.selected || [],
                },
            });
            filterParams[filterName] = subFilterArray;
        } else {
            filterParams[key] = settings.selected || [];
        }
    }
    return filterParams;
}

function pmeParams({_valueKey, params = {}, entity, _valueMapEntry}, globalParams) {
    const endpointParams = baseForEndpointParams(entity);

    if (is_set(params.asOfDate, true)) {
        endpointParams.as_of_date = dateSelectionTimestamp(
            params.asOfDate,
            globalParams.globalDate,
        );
    }
    if (is_set(params.startDate, true)) {
        const {years, quarters, months, type} = params.startDate;
        const isRelative =
            type === DateParamType.RELATIVE || type === DateParamType.RELATIVE_GLOBAL;

        if (!isRelative || is_any_set([years, quarters, months], true)) {
            // Only do relative if any relative parameter has been set
            endpointParams.start_date = dateSelectionTimestamp(
                params.startDate,
                globalParams.globalDate,
            );
        }
    }

    if (is_set(params, true)) {
        if (is_set(params.index)) {
            endpointParams.index = params.index;
        }
    }

    if (is_set(params.renderCurrency)) {
        endpointParams.render_currency = params.renderCurrency;
    }

    if (is_set(params.onQuarterEnd)) {
        endpointParams.quarterly_cashflows = params.onQuarterEnd;
    }

    if (is_set(params.calculationMapping)) {
        // Calculation mapping only applies to irr pmes and are also only available
        // for selection in irr pme values
        endpointParams.calculation_mapping = {['irr']: params.calculationMapping};
    }

    return [endpointParams, new Set()];
}

function vehicleGroupParams({_valueKey, params = {}, entity, valueMapEntry}) {
    const endpointParams = baseForEndpointParams(entity);

    if (is_set(params, true)) {
        if (is_set(params.group_by)) {
            endpointParams.group_by = params.group_by;
        }
        if (is_set(params.filters, true)) {
            endpointParams.filters = _handleFilters(valueMapEntry, params);
        }
    }

    return [endpointParams, new Set()];
}

function vehicleAnalysisParams({valueKey, params = {}, entity, valueMapEntry}, globalParams) {
    const paramsToHash = new Set(['as_of_date']);
    const endpointParams = baseForEndpointParams(entity);

    if (is_set(params, true)) {
        if (is_set(params.asOfDate, true)) {
            endpointParams.as_of_date = dateSelectionTimestamp(
                params.asOfDate,
                globalParams.globalDate,
            );
        }
        if (is_set(params.startDate, true)) {
            const {years, quarters, months, type} = params.startDate;
            const isRelative =
                type === DateParamType.RELATIVE || type === DateParamType.RELATIVE_GLOBAL;

            if (!isRelative || is_any_set([years, quarters, months], true)) {
                // Only do relative if any relative parameter has been set
                endpointParams.start_date = dateSelectionTimestamp(
                    params.startDate,
                    globalParams.globalDate,
                );
            }
        }
        if (is_set(params.calculationMapping)) {
            endpointParams.calculation_mapping = {[valueKey]: params.calculationMapping};
        }
        if (is_set(params.onQuarterEnd)) {
            endpointParams.quarterly_cashflows = params.onQuarterEnd;
        }
        if (is_set(params.group_by)) {
            endpointParams.group_by = params.group_by;
        }
        if (is_set(params.renderCurrency)) {
            endpointParams.render_currency = params.renderCurrency;
        }
        if (is_set(params.filters, true)) {
            endpointParams.filters = _handleFilters(valueMapEntry, params);
        }
    }

    endpointParams.values = [valueKey];

    return [endpointParams, paramsToHash];
}

function textDataParams({_valueKey, params = {}, entity, _valueMapEntry}, globalParams) {
    const endpointParams = {
        entity_type: entity.type.underscore(),
        entity_uid: entity.uid,
    };

    if (is_set(params, true) && is_set(params.asOfDate)) {
        endpointParams.as_of_date = dateSelectionTimestamp(
            params.asOfDate,
            globalParams.globalDate,
        );
    }

    if (is_set(params.group_by)) {
        endpointParams.group_by = params.group_by;
    }

    return [endpointParams, new Set()];
}

function metricStatisticsParams({_valueKey, params = {}, entity, valueMapEntry}, globalParams) {
    const endpointParams = {
        entity_uid: entity.uid,
        entity_type: entity.type.underscore(),
        identifiers: [valueMapEntry.identifier],
    };

    if (is_set(valueMapEntry.calculatedMetric)) {
        endpointParams.calculated_metric = true;
        endpointParams.calc_metric_time_frame = valueMapEntry.timeFrame;
        endpointParams.calc_metric_frequency = valueMapEntry.frequency;
    }

    if (is_set(params, true)) {
        const timeFrame = parseInt(
            is_set(params.span) ? params.span : valueMapEntry.params.span.defaultOption,
        );

        if (!isNaN(timeFrame)) {
            endpointParams.span = timeFrame;
        }

        const metricVersion = isValidMetricVersion(params.metricVersion)
            ? params.metricVersion
            : valueMapEntry.params.metricVersion.defaultOption;

        endpointParams.metric_version = metricVersion;

        if (is_set(params.asOfDate, true)) {
            endpointParams.date_range = {
                ...endpointParams.date_range,
                max: dateSelectionTimestamp(params.asOfDate, globalParams.globalDate),
            };
        }

        if (is_set(params.startDate, true)) {
            const {years, quarters, months, type} = params.startDate;
            const isRelative =
                type === DateParamType.RELATIVE || type === DateParamType.RELATIVE_GLOBAL;

            if (!isRelative || is_any_set([years, quarters, months], true)) {
                // Only do relative if any relative parameter has been set
                endpointParams.date_range = {
                    ...endpointParams.date_range,
                    min: dateSelectionTimestamp(params.startDate, globalParams.globalDate),
                };
            }
        }

        if (is_set(params.operation)) {
            endpointParams.operation = params.operation;
        }

        if (is_set(params.group_by)) {
            endpointParams.group_by = params.group_by;
        }

        if (is_set(params.renderCurrency)) {
            endpointParams.render_currency = params.renderCurrency;
        }
        if (is_set(params.filters)) {
            endpointParams.filters = _handleFilters(valueMapEntry, params);
        }
    } else {
        const timeFrame = valueMapEntry.params && valueMapEntry.params.span.defaultOption;
        if (!isNaN(timeFrame)) {
            endpointParams.span = timeFrame;
        }

        const metricVersion =
            valueMapEntry.params && valueMapEntry.params.metricVersion.defaultOption;
        endpointParams.metric_version = metricVersion;
    }

    // Time frame parameter is required for this endpoint, so if we don't
    // have one we don't make a request.
    if (!is_set(endpointParams.span)) {
        return [undefined, undefined];
    }

    return [endpointParams, new Set()];
}

function metricTrendsParams({_valueKey, params = {}, entity, valueMapEntry}, globalParams) {
    // Same as statistics
    return metricStatisticsParams({_valueKey, params, entity, valueMapEntry}, globalParams);
}

/**
 * Calculates a set of parameters to send to the given endpoint, based on the
 * provided component value.
 *
 * @param {String} endpoint The endpoint to calculate the parameters for.
 * @param {Object} value An object describing the value that should be fetched from the
 * `endpoint`.
 *
 * @memberof module:spec-engine
 */
function parametersForEndpoint(endpoint, value, globalParams) {
    let mappingFn = {
        'dataprovider/dashboards/entities': entitiesParams,
        'dataprovider/dashboards/vehicle-attributes': vehicleGroupParams,
        'dataprovider/dashboards/vehicle-cashflow': vehicleAnalysisParams,
        'dataprovider/dashboards/vehicle-performance': vehicleAnalysisParams,
        'dataprovider/dashboards/vehicle-performance-progression': vehicleAnalysisParams,
        'dataprovider/dashboards/vehicle-spanning-cashflows': vehicleAnalysisParams,
        'dataprovider/dashboards/text-data': textDataParams,
        'dataprovider/dashboards/metric-statistics': metricStatisticsParams,
        'dataprovider/dashboards/metric-trends': metricTrendsParams,
        'dataprovider/dashboards/valuation-bridge': vehicleAnalysisParams,
        'dataprovider/dashboards/pme': pmeParams,
        'dataprovider/dashboards/pme-trends': pmeParams,
        'dataprovider/dashboards/entity': vehicleGroupParams,
    }[endpoint];
    if (!mappingFn) {
        // eslint-disable-next-line no-console
        console.error(oneLine`
            [spec-engine]: Trying to calculate parameters for endpoint
            (${endpoint}) that has not been explicility implemented.
        `);
    }

    return mappingFn ? mappingFn(value, globalParams) : [undefined, undefined];
}
/**
 * Calculates a list of endpoints that needs to be called to get all the data
 * required for a given dashboard data specification.
 *
 * @param {Object} dataSpec An object where the keys are component identifiers
 * and the values are data specifications for that given dashboard components.
 * @param {Object} valueMap The currently relevant value map for the values available in
 * dashboards.
 *
 * @returns {array} An array of components that need to be called in order to
 * get the required data to display a dashboard with the given data
 * specification from the backend.
 *
 * @memberOf module:spec-engine
 */
export function calculateEndpoints(dataSpec, valueMap, globalParams) {
    // NOTE(Simon, 22 Feb 2018): This DOES NOT support multi-level nesting of
    // children as of now. We'll save that for another time. One level nesting
    // should be ok for now.
    const specValues = Object.values(dataSpec).reduce((spec, componentDataSpec) => {
        const componentValues = ValuesHandler.componentValues(componentDataSpec);
        const valueMapEntries = ValuesHandler.getValueMapEntriesForValues(
            componentDataSpec,
            valueMap,
        );
        const combinedValues = object_from_array(Object.keys(componentValues), valueHash => [
            valueHash,
            {
                ...componentValues[valueHash],
                valueMapEntry: valueMapEntries[valueHash],
            },
        ]);

        return {...spec, ...combinedValues};
    }, {});

    const potentialRequests = _potentialRequests(specValues, globalParams);

    if (!is_set(potentialRequests, true)) {
        return [];
    }
    const mergedRequests = mergeRequests(Object.values(potentialRequests), globalParams);
    const potentialRequestsByResolveCount = mergedRequests.sort(
        ({resolves: left}, {resolves: right}) => left.size - right.size,
    );

    const calculatedRequests = [];
    const valueHashToRequestHash = {};
    let unresolvedValues = new Set(Object.keys(specValues));
    for (const potentialRequest of potentialRequestsByResolveCount) {
        if (set_intersection(potentialRequest.resolves, unresolvedValues).size == 0) {
            continue;
        }

        for (const valueHash of potentialRequest.resolves.values()) {
            valueHashToRequestHash[valueHash] = potentialRequest.requestHash;
        }

        unresolvedValues = set_difference(unresolvedValues, potentialRequest.resolves);
        calculatedRequests.push({
            endpoint: potentialRequest.endpoint,
            params: potentialRequest.params,
            hashParams: potentialRequest.reduxParamsWhitelist,
            requestHash: potentialRequest.requestHash,
        });
    }

    return [calculatedRequests, valueHashToRequestHash];
}

function _potentialRequests(specValues, globalParams) {
    let potentialRequests = {};

    for (const [valueHash, specValue] of Object.entries(specValues)) {
        for (const endpoint of (specValue.valueMapEntry || {}).endpoints || []) {
            const [backendParams, reduxParamsWhitelist] = parametersForEndpoint(
                endpoint,
                specValue,
                globalParams,
            );

            if (!is_set(backendParams) && !is_set(reduxParamsWhitelist)) {
                continue;
            }

            const requestHash = api.dataThing.hashed(endpoint, backendParams);
            if (potentialRequests[requestHash]) {
                potentialRequests[requestHash].resolves.add(valueHash);
            } else {
                potentialRequests[requestHash] = {
                    endpoint,
                    requestHash,
                    params: backendParams,
                    value: specValue,
                    reduxParamsWhitelist,
                    resolves: new Set([valueHash]),
                };
            }
        }
    }

    return potentialRequests;
}

/**
 * Tries to merge requests to the same endpoints together.
 *
 * @param {Array} requests A list of requests that should be merged if applicable.
 * @returns {Array} The given list of `requests` but having all "mergeable" requests
 * having been merged.
 */
function mergeRequests(requests, globalParams) {
    let mergedRequests = [];

    for (const [endpoint, unmergedReqs] of Object.entries(requests.groupBy('endpoint'))) {
        const mergeFn =
            {
                'dataprovider/dashboards/entities': entitiesParamsMergeFn,
                'dataprovider/dashboards/vehicle-attributes': vehicleAnalysisMergeFn,
                'dataprovider/dashboards/vehicle-cashflow': vehicleAnalysisMergeFn,
                'dataprovider/dashboards/vehicle-performance': vehicleAnalysisMergeFn,
                'dataprovider/dashboards/vehicle-performance-progression': vehicleAnalysisMergeFn,
                'dataprovider/dashboards/vehicle-spanning-cashflows': vehicleAnalysisMergeFn,
                'dataprovider/dashboards/text-data': textDataMergeFn,
                'dataprovider/dashboards/metric-statistics': metricStatisticsMergeFn,
                'dataprovider/dashboards/metric-trends': metricStatisticsMergeFn,
                'dataprovider/dashboards/valuation-bridge': vehicleAnalysisMergeFn,
            }[endpoint] || _defaultMerge;
        mergedRequests = mergedRequests.concat(_applyMergeFn(mergeFn, unmergedReqs, globalParams));
    }

    return mergedRequests;
}

/**
 * Given a list of requests to one specific endpoint, it tries to merge them together
 * if possible.
 *
 * The `mergeFn` determines whether or not two functions are "mergeable". This could
 * depend on all kinds of things. Say parameters for example; maybe an endpoint can take
 * multiple entity uids instead of making separate requests for all entities? Perfect
 * use case for merging them together.
 *
 * @param {function} mergeFn The function to use for merging the supplied requests
 * together. This function is usually specific to the endpoint that you are trying to
 * merge requests from.
 * @param {Array} requests The list of requests to the endpoint that should potentially be
 * merged together.
 * @params {Object} globalParams. Global params set on the dashboard
 * @returns {Array} A copy of the requests list specified containing some potentially
 * merged requests.
 */
function _applyMergeFn(mergeFn, requests, globalParams) {
    const maxIterations = 100;

    for (let iterationCount = 0; iterationCount < maxIterations; iterationCount++) {
        const mergedRequests = [];
        const mergedIndexes = new Set();
        for (let i = 0; i < requests.length; i++) {
            if (mergedIndexes.has(i)) {
                // Request has already been merged, no need to consider it
                continue;
            }
            mergedRequests.push(requests[i]);
            for (let j = i + 1; j < requests.length; j++) {
                if (mergedIndexes.has(j)) {
                    // Request has already been merged, no need to consider it
                    continue;
                }
                const lastMerged = mergedRequests[mergedRequests.length - 1];
                const mergeResult = mergeFn(lastMerged, requests[j], globalParams);
                if (!mergeResult) {
                    continue;
                }
                const [mergedParams, value] = mergeResult;
                mergedRequests[mergedRequests.length - 1] = {
                    endpoint: lastMerged.endpoint,
                    params: mergedParams,
                    value,
                    requestHash: api.dataThing.hashed(lastMerged.endpoint, mergedParams),
                    resolves: set_union(lastMerged.resolves, requests[j].resolves),
                    reduxParamsWhitelist: lastMerged.reduxParamsWhitelist,
                };
                mergedIndexes.add(j);
            }
        }

        if (mergedIndexes.size === 0) {
            // No merge occurred we can return
            return mergedRequests;
        }

        // Some requests were merged so we need to re-run the merging
        requests = mergedRequests;
    }

    throw `Reached maxIterations=${maxIterations} in _applyMergeFn`;
}

/**
 * Determines whether or not two requests can be merged together, and if so returns the
 * merged versions.
 *
 * @param {Object} leftReq The request to try to merge with `rightReq`.
 * @param {Object} rightReq The request to try to merge with `leftReq`.
 * @returns {Boolean|object} False if the two requests could not be merged, the merged
 * request object otherwise.
 */
function _defaultMerge(leftReq, rightReq) {
    if (leftReq.requestHash !== rightReq.requestHash) {
        return false;
    }

    return leftReq;
}

function entitiesParamsMergeFn(leftReq, rightReq) {
    const newValue = {
        valueKey: leftReq.value.key,
        params: leftReq.value.params,
        valueMapEntry: leftReq.value.valueMapEntry,
    };

    return [
        {
            entities: [...leftReq.params.entities, ...rightReq.params.entities],
        },
        newValue,
    ];
}

function textDataMergeFn(leftReq, rightReq) {
    const newValue = {
        valueKey: leftReq.value.key,
        params: leftReq.value.params,
        valueMapEntry: leftReq.value.valueMapEntry,
    };

    if (leftReq.params.entity_uid !== rightReq.params.entity_uid) {
        return false;
    }

    if (leftReq.params.as_of_date !== rightReq.params.as_of_date) {
        return false;
    }

    if (leftReq.params.group_by !== rightReq.params.group_by) {
        return false;
    }

    return [{...leftReq.value.params}, newValue];
}

function vehicleAnalysisMergeFn(leftReq, rightReq, globalParams) {
    const leftEntity = leftReq.value.entity;
    const leftRepeatFrom = leftReq.value.entity.repeatFrom;
    const rightEntity = rightReq.value.entity;
    const rightRepeatFrom = rightReq.value.entity.repeatFrom;

    // If only one of the requests have parameters, we cannot merge them.
    if (
        (is_set(leftReq.params, true) && !is_set(rightReq.params, true)) ||
        (!is_set(leftReq.params, true) && is_set(rightReq.params, true))
    ) {
        return false;

        // If both requests have parameters, and they have different as of dates or start dates,
        // we cannot merge them.
    } else if (
        is_set(leftReq.params, true) &&
        is_set(rightReq.params, true) &&
        (leftReq.params.as_of_date !== rightReq.params.as_of_date ||
            leftReq.params.start_date !== rightReq.params.start_date ||
            leftReq.params.group_by !== rightReq.params.group_by ||
            leftReq.params.render_currency !== rightReq.params.render_currency ||
            leftReq.params.quarterly_cashflows !== rightReq.params.quarterly_cashflows ||
            !isEqual(leftReq.params.filters, rightReq.params.filters))
    ) {
        return false;
    }

    if (leftReq.params.calculation_mapping || rightReq.params.calculation_mapping) {
        // Calculation mapping is complex to merge, so let's just not do it for now
        return false;
    }

    // If both requests have the same entity we merge
    if (leftEntity.uid === rightEntity.uid) {
        const newParams = {...leftReq.params};
        newParams.values.push(...rightReq.params.values);
        return [newParams, leftReq.value];
    }

    // TODO: Implement merging values for repeat below

    // If entities from both requests are being repeated from the same element, we can
    // merge and pass in the parent entity to the request instead.
    if (leftRepeatFrom && rightRepeatFrom && leftRepeatFrom.uid === rightRepeatFrom.uid) {
        const newEntity = {
            uid: leftEntity.repeatFrom.uid,
            type: leftEntity.repeatFrom.type,
        };
        const newValue = {
            valueKey: leftReq.value.key,
            params: leftReq.value.params,
            valueMapEntry: leftReq.value.valueMapEntry,
            entity: newEntity,
        };
        return [vehicleAnalysisParams(newValue, globalParams)[0], newValue];
    }

    // Again, if one of the entities have a parent that it's being repeated for, we can
    // merge with a request that's already executing for that parent.
    if (leftRepeatFrom && rightEntity.uid === leftRepeatFrom.uid) {
        const newEntity = {
            uid: leftRepeatFrom.uid,
            type: leftRepeatFrom.type,
        };
        const newValue = {
            valueKey: leftReq.value.key,
            params: leftReq.value.params,
            valueMapEntry: leftReq.value.valueMapEntry,
            entity: newEntity,
        };
        return [vehicleAnalysisParams(newValue, globalParams)[0], newValue];
    } else if (rightRepeatFrom && leftEntity.uid === rightRepeatFrom.uid) {
        const newEntity = {
            uid: rightRepeatFrom.uid,
            type: rightRepeatFrom.type,
        };
        const newValue = {
            valueKey: rightReq.value.key,
            params: rightReq.value.params,
            valueMapEntry: rightReq.value.valueMapEntry,
            entity: newEntity,
        };
        return [vehicleAnalysisParams(newValue, globalParams)[0], newValue];
    }

    return false;
}

function metricStatisticsMergeFn(leftReq, rightReq) {
    if (
        (is_set(leftReq.params, true) && !is_set(rightReq.params, true)) ||
        (!is_set(leftReq.params, true) && is_set(rightReq.params, true))
    ) {
        return false;
    } else if (is_set(leftReq.params, true) && is_set(rightReq.params, true)) {
        if (leftReq.params.span !== rightReq.params.span) {
            return false;
        }

        if (leftReq.params.metric_version !== rightReq.params.metric_version) {
            return false;
        }

        if (leftReq.params.render_currency !== rightReq.params.render_currency) {
            return false;
        }

        if (
            (leftReq.params.date_range && !rightReq.params.date_range) ||
            (!leftReq.params.date_range && rightReq.params.date_range)
        ) {
            return false;
        } else if (
            leftReq.params.date_range &&
            rightReq.params.date_range &&
            leftReq.params.date_range.max !== rightReq.params.date_range.max
        ) {
            return false;
        }
        if (leftReq.params.group_by != rightReq.params.group_by) {
            return false;
        }
        if (leftReq.params.entity_uid != rightReq.params.entity_uid) {
            return false;
        }
        if (!isEqual(leftReq.params.filters, rightReq.params.filters)) {
            return false;
        }
        if (leftReq.params.calculated_metric != rightReq.params.calculated_metric) {
            return false;
        }
        if (leftReq.params.operation !== rightReq.params.operation) {
            return false;
        }
    }

    const newValue = {
        valueKey: leftReq.value.key,
        params: leftReq.value.params,
        valueMapEntry: leftReq.value.valueMapEntry,
    };

    return [
        {
            ...leftReq.params,
            identifiers: [...leftReq.params.identifiers, ...rightReq.params.identifiers],
        },
        newValue,
    ];
}
