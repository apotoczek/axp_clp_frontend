import {createReducer, mergeEntities} from 'reducers/utils';

export default createReducer(
    {
        DEFAULT: (payload, state) => mergeEntities('deals', payload, state),
    },
    {},
);
