import * as api from 'api';
import {getSchema, extractData} from 'libs/backendSchema';
import * as normalizr from 'normalizr';
import {is_set} from 'src/libs/Utils';
import {batch} from 'react-redux';
import mergeWith from 'lodash.mergewith';
import union from 'lodash.union';
import {
    BACKEND_REQUEST_META_EXPIRE,
    BACKEND_REQUEST_META_FAILURE,
    BACKEND_REQUEST_META_SUCCESS,
    BACKEND_REQUEST_META,
    BACKEND_DERIVED_DATA_SUCCESS,
    BACKEND_MULTI_DERIVED_DATA_SUCCESS,
    BACKEND_MULTI_REQUEST_META_SUCCESS,
    BACKEND_MULTI_REQUEST_META_EXPIRE,
    BACKEND_MULTI_REQUEST_META_FAILURE,
    BACKEND_MULTI_REQUEST_META,
    BACKEND_REQUEST_SUCCESS,
} from 'action-types/backend';

export function request(
    endpoint,
    params,
    normalize = true,
    actionTypes = [null, BACKEND_REQUEST_SUCCESS, null, null],
    noHashParams = [],
    hashCallback,
) {
    return (dispatch, getState) => {
        const state = getState();
        const dataThing = api.dataThing;

        const endpointHash = dataThing.hashed(endpoint, params, noHashParams);
        if (typeof hashCallback === 'function') {
            hashCallback(endpointHash);
        }

        // We have to check both DataThing and Redux because DataThing might be
        // used outside of the context of Redux.
        const requestIsCached =
            dataThing.isCached(endpoint, params) && state.requestMetaData[endpointHash]; // DataThing cache // Redux cache
        // If the request is cached already, don't request again.
        if (requestIsCached) {
            const res = api.callEndpoint(endpoint, params);
            dispatch({type: BACKEND_REQUEST_META_SUCCESS, payload: {endpointHash}});
            return res;
        }

        const [requestAction, successAction, failureAction, expireAction] = actionTypes;

        // Tell redux we started a request
        batch(() => {
            dispatch({type: BACKEND_REQUEST_META, payload: {endpointHash, endpoint, params}});
            if (requestAction) {
                dispatch({type: requestAction, payload: {endpoint, params}});
            }
        });

        const backendRequest = api.callEndpoint(endpoint, params);

        const requestHandlerArgs = {
            dispatch,
            successAction,
            failureAction,
            normalize,
            endpointHash,
            endpoint,
        };

        // When DataThing expires the result, we tell Redux that this value is no
        // longer cached.
        backendRequest.expired.then(() => {
            batch(() => {
                dispatch({type: BACKEND_REQUEST_META_EXPIRE, payload: {endpointHash}});
                if (expireAction) {
                    dispatch({type: expireAction, payload: {endpointHash}});
                }
                dispatch(request(endpoint, params, normalize, actionTypes));
            });
        });

        // Tell Redux when the backend request succeeds or fails.
        return backendRequest.then(_requestSuccess(requestHandlerArgs)).catch(message => {
            batch(() => {
                dispatch({
                    type: BACKEND_REQUEST_META_FAILURE,
                    payload: {
                        endpointHash,
                        message,
                    },
                });
                if (failureAction) {
                    dispatch({
                        type: failureAction,
                        payload: {
                            endpointHash,
                            message,
                        },
                    });
                }
            });
        });
    };
}

export function batchedRequest(
    requests,
    normalize = true,
    actionTypes = [null, BACKEND_REQUEST_SUCCESS, null, null],
    noHashParams = [],
) {
    return (dispatch, getState) => {
        const state = getState();
        const batchEndpoint = 'dataprovider/batch-request';
        const [requestAction, successAction, failureAction, expireAction] = actionTypes;

        let requestMap = {};
        requests.forEach(r => {
            // The backend batch request handler is only implemented for
            // dashboards, so send those calls off to the non-batched handlers
            if (!r.endpoint.startsWith('dataprovider/dashboards/')) {
                dispatch(request(r.endpoint, r.params, undefined, undefined, noHashParams));
                return;
            }

            // If the request is in the cache, don't request again
            const requestIsCached =
                api.dataThing.isCached(r.endpoint, r.params) && // DataThing cache
                state.requestMetaData[r.requestHash]; // Redux cache

            if (requestIsCached) {
                const res = api.callEndpoint(r.endpoint, r.params);
                dispatch({
                    type: BACKEND_REQUEST_META_SUCCESS,
                    payload: {
                        endpointHash: r.requestHash,
                    },
                });
                return res;
            }

            requestMap[r.requestHash] = {
                endpoint: r.endpoint,
                params: r.params,
            };
        });

        batch(() => {
            dispatch({
                type: BACKEND_MULTI_REQUEST_META,
                payload: {
                    endpointHashes: Object.keys(requestMap),
                },
            });
            if (requestAction) {
                dispatch({
                    type: requestAction,
                    payload: {
                        endpointHashes: Object.keys(requestMap),
                    },
                });
            }
        });

        const backendRequest = api.callEndpoint(batchEndpoint, requestMap);

        return backendRequest
            .then(response => {
                if (normalize) {
                    // Create a deferred expiry handler queue
                    const batchedExpiryFrameContainer = {requests: {}};
                    const batchExpiryCallback = _scheduleBulkExpiryRefresh(
                        dispatch,
                        batchedExpiryFrameContainer,
                        // ...requestArgs:
                        requests,
                        normalize,
                        actionTypes,
                        noHashParams,
                    );

                    _batchedNormalizedResponseHandler(
                        response,
                        requestMap,
                        dispatch,
                        batchExpiryCallback,
                        successAction,
                        failureAction,
                    );
                } else {
                    const expiryCallback = (endpointHash, req) => {
                        batch(() => {
                            dispatch({
                                type: BACKEND_REQUEST_META_EXPIRE,
                                payload: {endpointHash},
                            });
                            if (expireAction) {
                                dispatch({type: expireAction, payload: {endpointHash}});
                            }
                            dispatch(request(req.endpoint, req.params, normalize, actionTypes));
                        });
                    };
                    _batchedResponseHandler(
                        response,
                        requestMap,
                        dispatch,
                        expiryCallback,
                        successAction,
                        failureAction,
                    );
                }
            })
            .catch(message => {
                batch(() => {
                    dispatch({
                        type: BACKEND_MULTI_REQUEST_META_FAILURE,
                        payload: {
                            endpointHashes: Object.keys(requestMap),
                            message,
                        },
                    });
                    if (failureAction) {
                        dispatch({
                            type: failureAction,
                            payload: {
                                endpointHashes: Object.keys(requestMap),
                                message,
                            },
                        });
                    }
                });
            });
    };
}

// non-normalized response handler
function _batchedResponseHandler(
    response,
    requestMap,
    dispatch,
    expiryCallback,
    successAction,
    failureAction,
) {
    const fail = {};
    const success = {};

    Object.entries(response).forEach(([endpointHash, res]) => {
        if (res.error) {
            fail[endpointHash] = res;
        } else {
            success[endpointHash] = res;
        }
    });

    batch(() => {
        dispatch({
            type: BACKEND_MULTI_REQUEST_META_SUCCESS,
            payload: {
                endpointHashes: Object.keys(success),
            },
        });

        Object.entries(success).forEach(([endpointHash, res]) => {
            if (successAction) {
                dispatch({
                    type: successAction,
                    payload: {
                        data: res.result,
                        endpointHash,
                    },
                });
            }
        });

        _dispatchFailed(dispatch, fail, failureAction);
    });

    Object.entries(success).forEach(([endpointHash, res]) => {
        const req = requestMap[endpointHash];
        api.dataThing.registerExternalExpiry(req.endpoint, req.params, res, () =>
            expiryCallback(endpointHash, req),
        );
    });
}

// normalized response handler
function _batchedNormalizedResponseHandler(
    response,
    requestMap,
    dispatch,
    batchExpiryCallback,
    successAction,
    failureAction,
) {
    const derivedDataUpdates = {};
    let nonDerivedDataDifference = {};

    const success = {};
    const fail = {};

    Object.entries(response).forEach(([endpointHash, res]) => {
        if (res.error) {
            fail[endpointHash] = res;
            return;
        }
        success[endpointHash] = res;

        const req = requestMap[endpointHash];
        const endpoint = req.endpoint;
        const partitionedData = _partitionNormalizedData(endpoint, res.result);
        // If we're not getting data from _partitionNormalizedData then
        // we're trying to normalize an entity without a normalizr
        // schema. If this starts happening, it's probably a good idea
        // to look into why.
        if (!partitionedData) {
            return;
        }
        const {derivedData, nonDerivedData} = partitionedData;

        // Save some of the edited state to pass to redux bulk actions
        derivedDataUpdates[endpointHash] = derivedData;

        mergeWith(nonDerivedDataDifference, nonDerivedData, (objValue, srcValue) =>
            Array.isArray(objValue) ? union(objValue, srcValue) : undefined,
        );

        // Register an external handler for request expiry in
        // dataThing. We do this for each response for the batched
        // request to avoid invalidating the entire batch request when
        // one of its component requests expires
        api.dataThing.registerExternalExpiry(req.endpoint, req.params, res, () =>
            batchExpiryCallback(endpointHash, req),
        );
    });

    // Finally, bulk dispatch all state changes to redux
    batch(() => {
        if (is_set(derivedDataUpdates, true)) {
            dispatch({
                type: BACKEND_MULTI_DERIVED_DATA_SUCCESS,
                payload: {
                    updates: Object.entries(derivedDataUpdates),
                },
            });
        }
        // Send all metadata updates
        dispatch({
            type: BACKEND_MULTI_REQUEST_META_SUCCESS,
            payload: {
                endpointHashes: Object.keys(success),
            },
        });

        if (successAction) {
            dispatch({
                type: successAction,
                payload: {
                    entities: nonDerivedDataDifference,
                },
            });
        }

        _dispatchFailed(dispatch, fail, failureAction);
    });
}

function _dispatchFailed(dispatch, failedResponses, failureAction) {
    Object.entries(failedResponses).forEach(([endpointHash, res]) => {
        const message = _formatError(res.message);

        dispatch({
            type: BACKEND_REQUEST_META_FAILURE,
            payload: {
                endpointHash,
                message,
            },
        });

        if (failureAction) {
            dispatch({
                type: failureAction,
                payload: {
                    endpointHash,
                    message,
                },
            });
        }
    });
}

function _formatError(error) {
    switch (error) {
        case 'invalid_entity':
            return 'The selected entity was not found';
        case 'breakdown_not_available':
            return 'The selected entity cannot be grouped';
        case 'invalid_breakdown':
            return 'The selected entity cannot be grouped this way';
        case 'no_access':
            return "You don't have access to the selected entity";
        default:
            return 'An unknown error occurred';
    }
}

// This function creates a queueable dispatch function that triggers all
// actions in a batch on an animationframe. This stops react from re-rendering
// on each individual dispatch. The reason that this works is that the
// callbacks from one finished status_check call run synchronously, and end up
// queueing all the invalidated requests before the animationframe triggers
function _scheduleBulkExpiryRefresh(dispatch, frameContainer, ...requestArgs) {
    return (requestHash, request) => {
        // On normal execution, just add the requests to the map of invalid
        // requests
        frameContainer.requests[requestHash] = request;

        if (!frameContainer.frame) {
            const expireAction = (requestArgs[2] || [])[3];

            // If we don't have a frame, we want to schedule one to dispatch the
            // invalid requests in.
            frameContainer.frame = requestAnimationFrame(() => {
                batch(() => {
                    dispatch({
                        type: BACKEND_MULTI_REQUEST_META_EXPIRE,
                        payload: {
                            endpointHashes: Object.keys(frameContainer.requests),
                        },
                    });
                    if (expireAction) {
                        dispatch({
                            type: expireAction,
                            payload: {
                                endpointHashes: Object.keys(frameContainer.requests),
                            },
                        });
                    }
                    dispatch(batchedRequest(...requestArgs));

                    // Make sure we free up the queued requests and delete the
                    // frame, so that future expiry handlers that trigger after
                    // we've already run the one being processed can allocate a new
                    // one.
                    frameContainer.requests = {};
                    frameContainer.frame = undefined;
                });
            });
        }
    };
}

function _partitionNormalizedData(endpoint, data) {
    const normalizrSchema = getSchema(endpoint);
    let normalizedEntityData;
    let derivedData;
    let nonDerivedData;
    if (normalizrSchema) {
        normalizedEntityData = normalizr.normalize(data, normalizrSchema);

        nonDerivedData = extractData(normalizedEntityData.entities, false);
        derivedData = extractData(normalizedEntityData.entities, true);
        return {nonDerivedData, derivedData};
    }
    // eslint-disable-next-line no-console
    console.warn(oneLine`
                        Trying to normalize data for endpoint /${endpoint} that
                        is missing schema. Ignoring result.  `);
    return;
}

function _requestSuccess({normalize, dispatch, successAction, endpoint, endpointHash}) {
    return result => {
        if (normalize) {
            const partitionedData = _partitionNormalizedData(endpoint, result);
            if (!partitionedData) {
                return;
            }
            const {nonDerivedData, derivedData} = partitionedData;

            batch(() => {
                if (is_set(derivedData, true)) {
                    dispatch({
                        type: BACKEND_DERIVED_DATA_SUCCESS,
                        payload: {
                            derivedData: derivedData,
                            endpointHash,
                        },
                    });
                }
                if (successAction) {
                    dispatch({
                        type: successAction,
                        payload: {
                            entities: nonDerivedData,
                            derivedData: derivedData,
                            endpointHash,
                        },
                    });
                }
                dispatch({type: BACKEND_REQUEST_META_SUCCESS, payload: {endpointHash}});
            });
        } else {
            batch(() => {
                dispatch({type: BACKEND_REQUEST_META_SUCCESS, payload: {endpointHash}});
                if (successAction) {
                    dispatch({
                        type: successAction,
                        payload: {
                            data: result,
                            endpointHash,
                        },
                    });
                }
            });
        }

        return result;
    };
}

export function callDerived(endpoint, params, normalize = true, actionTypes = [null, null, null]) {
    const callResult = call(endpoint, params, normalize, actionTypes);
    return {
        request: callResult.request,
        statusSelector: callResult.statusSelector,
        dataSelector: state => {
            // TODO: make this a reselect selector
            const requestHash = api.dataThing.hashed(endpoint, params);
            return state.derivedData[requestHash];
        },
    };
}

export function call(
    endpoint,
    params,
    normalize = true,
    actionTypes = [null, BACKEND_REQUEST_SUCCESS, null, null],
) {
    let requestHash;
    return {
        request: (...args) => {
            return request(
                endpoint,
                is_set(args, true) ? params(...args) : params,
                normalize,
                actionTypes,
                [],
                hash => (requestHash = hash),
            );
        },
        statusSelector: state => {
            const metaData = state.requestMetaData;

            let loading = true;
            let failReason;
            if (is_set(metaData[requestHash])) {
                failReason = metaData[requestHash].failReason;
                if (is_set(metaData[requestHash].isLoading)) {
                    loading = metaData[requestHash].isLoading;
                }
            }

            return {loading, failReason};
        },
    };
}
