import {createReducer} from 'reducers/utils';

import {
    CUSTOMIZATIONS_FAILURE,
    CUSTOMIZATIONS_REQUEST,
    CUSTOMIZATIONS_SUCCESS,
} from 'action-types/backend';

export default createReducer(
    {
        [CUSTOMIZATIONS_REQUEST]: (_payload, _state) => ({}),
        [CUSTOMIZATIONS_SUCCESS]: (payload, state) => ({
            ...state,
            ...payload.data,
        }),
        [CUSTOMIZATIONS_FAILURE]: (_payload, _state) => ({}),
    },
    {},
);
