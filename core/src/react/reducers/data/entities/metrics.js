import {createReducer, mergeEntities} from 'reducers/utils';

export default createReducer(
    {
        DEFAULT: (payload, state) => mergeEntities('metrics', payload, state),
    },
    {},
);
