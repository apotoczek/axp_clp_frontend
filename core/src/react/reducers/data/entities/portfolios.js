import {createReducer, mergeEntities} from 'reducers/utils';

export default createReducer(
    {
        DEFAULT: (payload, state) => mergeEntities('portfolios', payload, state),
    },
    {},
);
