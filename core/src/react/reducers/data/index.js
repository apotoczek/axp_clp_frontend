import {combineReducers} from 'redux';

import dashboards from 'reducers/data/entities/dashboards';
import dashboardShares from 'reducers/data/entities/dashboardShares';
import userFunds from 'reducers/data/entities/userFunds';
import attributes from 'reducers/data/entities/attributes';
import attributeMembers from 'reducers/data/entities/attributeMembers';
import attributeValues from 'reducers/data/entities/attributeValues';
import textDataValues from 'reducers/data/entities/textDataValues';
import portfolios from 'reducers/data/entities/portfolios';
import deals from 'reducers/data/entities/deals';
import metrics from 'reducers/data/entities/metrics';

import {
    BACKEND_REQUEST_META_EXPIRE,
    BACKEND_REQUEST_META_FAILURE,
    BACKEND_REQUEST_META_SUCCESS,
    BACKEND_REQUEST_META,
    BACKEND_DERIVED_DATA_SUCCESS,
    BACKEND_MULTI_DERIVED_DATA_SUCCESS,
    BACKEND_MULTI_REQUEST_META,
    BACKEND_MULTI_REQUEST_META_SUCCESS,
    BACKEND_MULTI_REQUEST_META_EXPIRE,
    BACKEND_MULTI_REQUEST_META_FAILURE,
} from 'action-types/backend';

import {createReducer} from 'reducers/utils';

export const derivedData = createReducer(
    {
        [BACKEND_DERIVED_DATA_SUCCESS]: ({endpointHash, derivedData}, state) => ({
            ...state,
            [endpointHash]: {
                ...derivedData,
            },
        }),
        [BACKEND_MULTI_DERIVED_DATA_SUCCESS]: ({updates}, state) => {
            const newState = {...state};
            for (const [endpointHash, derivedData] of updates) {
                newState[endpointHash] = {...newState[endpointHash], ...derivedData};
            }
            return newState;
        },
    },
    {},
);

export const entities = combineReducers({
    dashboards,
    dashboardShares,
    userFunds,
    attributes,
    attributeMembers,
    attributeValues,
    textDataValues,
    portfolios,
    deals,
    metrics,
});

export const requestMetaData = createReducer(
    {
        [BACKEND_REQUEST_META_FAILURE]: ({endpointHash, message}, state) => ({
            ...state,
            [endpointHash]: {
                ...state[endpointHash],
                isLoading: false,
                failReason: message,
            },
        }),
        [BACKEND_REQUEST_META]: ({endpointHash}, state) => ({
            ...state,
            [endpointHash]: {
                ...state[endpointHash],
                isLoading: true,
                failReason: null,
            },
        }),
        [BACKEND_REQUEST_META_SUCCESS]: ({endpointHash}, state) => ({
            ...state,
            [endpointHash]: {
                ...state[endpointHash],
                isLoading: false,
                failReason: null,
            },
        }),
        [BACKEND_REQUEST_META_EXPIRE]: ({endpointHash}, state) => {
            const newState = {...state};
            delete newState[endpointHash];
            return newState;
        },
        // Multi-request reducers:
        [BACKEND_MULTI_REQUEST_META]: ({endpointHashes}, state) => {
            const newState = {...state};
            for (const endpointHash of endpointHashes) {
                newState[endpointHash] = {
                    ...state[endpointHash],
                    isLoading: true,
                    failReason: null,
                };
            }
            return newState;
        },
        [BACKEND_MULTI_REQUEST_META_SUCCESS]: ({endpointHashes}, state) => {
            const newState = {...state};
            for (const endpointHash of endpointHashes) {
                newState[endpointHash] = {
                    ...state[endpointHash],
                    isLoading: false,
                    failReason: null,
                };
            }
            return newState;
        },
        [BACKEND_MULTI_REQUEST_META_FAILURE]: ({endpointHashes, message}, state) => {
            const newState = {...state};
            for (const endpointHash of endpointHashes) {
                newState[endpointHash] = {
                    ...state[endpointHash],
                    isLoading: false,
                    failReason: message,
                };
            }
            return newState;
        },
        [BACKEND_MULTI_REQUEST_META_EXPIRE]: ({endpointHashes}, state) => {
            const newState = {...state};
            for (const endpointHash of endpointHashes) {
                delete newState[endpointHash];
            }
            return newState;
        },
    },
    {},
);
