import {combineReducers} from 'redux';

import {MODAL_OPEN, MODAL_CLOSE} from 'action-types/view';

import {createReducer} from 'reducers/utils';

const key = createReducer(
    {
        [MODAL_OPEN]: ({key}, state) => key || state,
        [MODAL_CLOSE]: ({key}, state) => key || state,
    },
    null,
);

const isOpen = createReducer(
    {
        [MODAL_OPEN]: ({open}) => open,
        [MODAL_CLOSE]: ({open}) => open,
    },
    false,
);

export default combineReducers({key, isOpen});
