import {createReducer} from 'reducers/utils';

import {
    CLIENT_USERS_FAILURE,
    CLIENT_USERS_REQUEST,
    CLIENT_USERS_SUCCESS,
} from 'action-types/backend';

export default createReducer(
    {
        [CLIENT_USERS_REQUEST]: (_payload, _state) => [],
        [CLIENT_USERS_SUCCESS]: (payload, _) => [...payload.data],
        [CLIENT_USERS_FAILURE]: (_payload, _state) => [],
    },
    [],
);
