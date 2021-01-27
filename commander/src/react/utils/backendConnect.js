import {useState, useEffect, useCallback} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import memoize from 'lodash.memoize';
import uuid from 'uuid/v4';

import {useIsMounted} from 'utils/hooks';

import * as api from 'api';

import {
    is_set,
    object_from_array,
    identity,
    hashed,
    map_object,
    set_intersection,
} from 'src/libs/Utils';

const _findReq = reqDef => (reqDef.waitFor ? reqDef.request : reqDef);

const _mapRequestDef = (allReqDefs, dispatch) => reqDef => {
    const reqFunc = _findReq(reqDef).request;
    const request = (...args) => dispatch(reqFunc(...args));

    return {request, waitFor: reqDef.waitFor};
};

const _triggerRequests = endpoints => {
    const finishedRequestIds = new Set();
    const finishedRequestData = {};
    const waitingRequests = Object.map(endpoints, endpoint => ({
        ...endpoint,
        waitFor: new Set(endpoint.waitFor || []),
    }));

    const _triggerReadyRequests = () => {
        let foundNonReady = false;
        for (const [id, reqDef] of Object.entries(waitingRequests)) {
            // If the request is still waiting for something, skip the request for now.
            if (set_intersection(reqDef.waitFor, finishedRequestIds).size < reqDef.waitFor.size) {
                foundNonReady = true;
                continue;
            }

            const data = Array.from(reqDef.waitFor).map(id => finishedRequestData[id]);
            const promise = reqDef.request(...data);
            promise.then(response => {
                finishedRequestData[id] = response;
                finishedRequestIds.add(id);

                if (foundNonReady) {
                    _triggerReadyRequests();
                }
            });
        }
    };

    _triggerReadyRequests();
};

export default function backendConnect(
    data = {},
    derivedData = {},
    mapStateToProps,
    mapDispatchToProps,
) {
    return function(Component) {
        const getData = memoize(
            props => {
                let mappedData = data;
                if (typeof mappedData === 'function') {
                    mappedData = data(props);
                }
                return mappedData;
            },
            props => hashed(props),
        );

        const getDerivedData = memoize(
            props => {
                let mappedDerivedData = derivedData;
                if (typeof mappedDerivedData === 'function') {
                    mappedDerivedData = derivedData(props);
                }
                return mappedDerivedData;
            },
            props => hashed(props),
        );

        const _requests = new Set();

        const triggerRequests = props => () => (dispatch, _getState) => {
            const mappedData = getData(props);
            const mappedDerivedData = getDerivedData(props);
            const hash = hashed(props);
            if (!_requests.has(hash)) {
                _requests.add(hash);
                _triggerRequests(
                    map_object(mappedData, _mapRequestDef(mappedData, dispatch)) || {},
                );
                _triggerRequests(
                    map_object(mappedDerivedData, _mapRequestDef(mappedDerivedData, dispatch)) ||
                        {},
                );
            }
        };

        const stateToProps = (state, props) => {
            const mappedData = getData(props);
            const mappedDerivedData = getDerivedData(props);

            return {
                ...(mapStateToProps ? mapStateToProps(state, props) : {}),
                ...map_object(mappedDerivedData, value =>
                    _findReq(value).dataSelector(state, props),
                ),
                requests: map_object(mappedData, value =>
                    _findReq(value).statusSelector(state, props),
                ),
            };
        };

        const dispatchToProps = (dispatch, ownProps) => {
            return bindActionCreators(
                {
                    ...mapDispatchToProps,
                    triggerRequests: triggerRequests(ownProps),
                },
                dispatch,
            );
        };

        return connect(stateToProps, dispatchToProps)(Component);
    };
}

export function isAllSet(...requiredParams) {
    return params => {
        for (const param of requiredParams) {
            if (!is_set(params[param])) {
                return false;
            }
        }

        return true;
    };
}

export function useBackendData(url, params = {}, options = {}) {
    const {
        deps,
        triggerConditional = isAllSet(...(options.requiredParams ?? [])),
        initialData = {},
    } = options;

    const [data, setData] = useState(initialData);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [isInvalidated, setIsInvalidated] = useState(false);
    const [forceRefreshId, setForceRefreshId] = useState(false);
    const isMounted = useIsMounted();

    // TODO: This needs to be fixed, we can't do this every time, it's gonna be too slow.
    let dependentParamsKeyValuePairs = Object.entries(params);
    if (is_set(deps, true)) {
        dependentParamsKeyValuePairs = dependentParamsKeyValuePairs.filter(([key]) =>
            deps.includes(key),
        );
    }
    const hashedParams = hashed(object_from_array(dependentParamsKeyValuePairs, identity));

    useEffect(() => {
        setHasTriggered(false);
    }, [hashedParams, url, forceRefreshId]);

    useEffect(() => {
        // If one of the dependencies changed, but the request has already been triggered,
        // we opt out of triggering the request again. Note that if one of the query deps
        // change (including url), hasTriggered is set back to false.
        if (hasTriggered) {
            return;
        }

        // Don't fire the request untill all required fields are truthy.
        if (!triggerConditional(params)) {
            return;
        }
        setIsLoading(true);
        setHasTriggered(true);
        const endpointCall = api.callEndpoint(url, params);

        endpointCall
            .then(response => {
                if (!isMounted.current) {
                    return response;
                }

                setData(response);
                setError(null);
                setIsLoading(false);
                return response;
            })
            .catch(error => {
                if (!isMounted.current) {
                    return error;
                }

                if (error?.response?.data?.body) {
                    setError(error.response.data.body);
                } else if (error?.response?.data?.error) {
                    setError(error.response.data.error);
                }

                setData(initialData);
                setIsLoading(false);
            });

        endpointCall.expired.then(() => {
            if (!isMounted.current) {
                return;
            }

            setIsInvalidated(true);
            setIsLoading(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hashedParams, triggerConditional, hasTriggered, url, forceRefreshId]);

    const forceRefresh = useCallback(() => {
        setForceRefreshId(uuid());
    }, []);

    useEffect(() => {
        if (isInvalidated) {
            setIsInvalidated(false);
            setData(initialData);
            forceRefresh();
        }
    }, [forceRefresh, initialData, isInvalidated]);

    return {data, error, isLoading, hasTriggered, isInvalidated, forceRefresh};
}

export function useBackendEndpoint(url, options = {}) {
    const {initialData = {}, statusCheck = true, action = false} = options;
    const [error, setError] = useState(null);
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    const callEndpoint = action ? api.callActionEndpoint : api.callEndpoint;

    const triggerEndpoint = useCallback(
        params => {
            setIsLoading(true);
            setHasTriggered(true);
            return callEndpoint(url, params)
                .then(response => {
                    setData(response);
                    setError(null);
                    setIsLoading(false);

                    if (statusCheck) {
                        api.dataThing.statusCheck();
                    }
                    return response;
                })
                .catch(error => {
                    setError(error.response.data.body);
                    setData(initialData);
                    setIsLoading(false);

                    setIsLoading(false);
                    if (statusCheck) {
                        api.dataThing.statusCheck();
                    }
                    throw error.response.data.body;
                });
        },
        [callEndpoint, initialData, statusCheck, url],
    );

    return {data, error, isLoading, hasTriggered, triggerEndpoint};
}

export function useFileDownload(url) {
    const [hasTriggered, setHasTriggered] = useState(false);

    const triggerDownload = useCallback(
        params => {
            setHasTriggered(true);
            return api.formPost(url, params);
        },
        [url],
    );

    return {hasTriggered, triggerDownload};
}
