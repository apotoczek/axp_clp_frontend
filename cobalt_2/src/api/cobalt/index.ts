import {useState, useEffect, useCallback} from 'react';
import axios from 'axios';
import {v4 as uuidv4} from 'uuid';

import config from 'config';
import {useIsMounted} from 'utils/hooks';

import DataThing from './DataThing';
import {CobaltBackend, CobaltAPIParams} from './types';
import {CobaltResponse} from './responses';

import {identity, isSet, hashed, objectFromArray} from 'utils/utils';

function configureBackend(
    baseUrl: string,
    csrfCookieName: string,
    csrfHeaderName: string,
): CobaltBackend {
    const axiosInstance = axios.create({
        baseURL: baseUrl,
        withCredentials: true,
        headers: {'Content-Type': 'application/json'},
        xsrfCookieName: csrfCookieName,
        xsrfHeaderName: csrfHeaderName,
    });

    // TODO: Implement directives?
    // TODO: Fix any types here
    const extractBody = (axiosFn: any) => (url: string, data?: any) =>
        axiosFn(url, data).then((response: any) => response.data.body);

    return {get: extractBody(axiosInstance.get), post: extractBody(axiosInstance.post)};
}

export const backend = configureBackend(
    config.apiBaseUrl,
    config.csrf.cookieName,
    config.csrf.headerName,
);

export const dataThing = new DataThing(backend);

type UseDataThingOptions = {
    deps?: string[];
    triggerConditional?: (params: CobaltAPIParams) => boolean;
    initialData?: CobaltResponse;
    requiredParams?: string[];
};

function isAllSet(...requiredParams: string[]) {
    return (params: CobaltAPIParams) => {
        for (const param of requiredParams) {
            if (!isSet(params[param])) {
                return false;
            }
        }

        return true;
    };
}

interface UseDataThingState {
    data: CobaltResponse;
    error: string | null;
    isLoading: boolean;
    hasTriggered: boolean;
    isInvalidated: boolean;
    forceRefreshId: boolean | string;
}

export function useDataThing<R extends CobaltResponse = CobaltResponse>(
    url: string,
    params: CobaltAPIParams = {},
    options: UseDataThingOptions = {},
) {
    const {
        deps,
        triggerConditional = isAllSet(...(options.requiredParams ?? [])),
        initialData = {},
    } = options;

    const [state, setState] = useState<UseDataThingState>({
        data: initialData,
        error: null,
        isLoading: false,
        hasTriggered: false,
        isInvalidated: false,
        forceRefreshId: false,
    });
    const isMounted = useIsMounted();

    // TODO: This needs to be fixed, we can't do this every time, it's gonna be too slow.
    let dependentParamsKeyValuePairs = Object.entries(params);
    if (isSet(deps, true)) {
        dependentParamsKeyValuePairs = dependentParamsKeyValuePairs.filter(([key]) =>
            deps.includes(key),
        );
    }
    const hashedParams = hashed(objectFromArray(dependentParamsKeyValuePairs, identity));

    useEffect(() => {
        setState(s => ({...s, hasTriggered: false}));
    }, [hashedParams, url, state.forceRefreshId]);

    useEffect(() => {
        // If one of the dependencies changed, but the request has already been triggered,
        // we opt out of triggering the request again. Note that if one of the query deps
        // change (including url), hasTriggered is set back to false.
        if (state.hasTriggered) {
            return;
        }

        // Don't fire the request untill all required fields are truthy.
        if (!triggerConditional(params)) {
            return;
        }
        setState(s => ({...s, isLoading: true, hasTriggered: true}));
        const endpointCall = dataThing.request<R>(url, params);

        endpointCall
            .then(response => {
                if (!isMounted.current) {
                    return response;
                }

                setState(s => ({...s, data: response, error: null, isLoading: false}));
                return response;
            })
            .catch(error => {
                if (!isMounted.current) {
                    return error;
                }

                // TODO: Need to improve error handling in network stack with the backend.
                // Very messy right now.
                let body: string;
                if (error?.response?.data?.body) {
                    body = error.response.data.body;
                } else if (error?.response?.data?.error) {
                    body = error.response.data.error;
                }

                setState(s => ({...s, error: body, data: initialData, isLoading: false}));
            })
            .expired.then(() => {
                if (!isMounted.current) {
                    return;
                }

                setState(s => ({...s, isInvalidated: true, isLoading: true}));
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hashedParams, triggerConditional, state.hasTriggered, url, state.forceRefreshId]);

    const forceRefresh = useCallback(() => {
        setState(s => ({...s, forceRefreshId: uuidv4()}));
    }, []);

    useEffect(() => {
        if (!state.isInvalidated) {
            return;
        }
        setState(s => ({
            ...s,
            isInvalidated: false,
            forceRefreshId: uuidv4(),
            data: initialData,
        }));
    }, [state.forceRefreshId, initialData, state.isInvalidated]);

    const hasData = state.hasTriggered && !state.isLoading && !state.isInvalidated;

    return {...state, forceRefresh, hasData};
}
