import mergeWith from 'lodash.mergewith';
import union from 'lodash.union';

export function mergeEntities(entityName, payload, state) {
    if (payload.entities && payload.entities[entityName]) {
        return mergeWith({}, state, payload.entities[entityName], (objValue, srcValue) =>
            Array.isArray(objValue) ? union(objValue, srcValue) : undefined,
        );
    }

    return state;
}

export function createReducer(actionHandlers = {}, defaultState = undefined) {
    return function(state = defaultState, action) {
        if (actionHandlers[action.type]) {
            return actionHandlers[action.type](action.payload || {}, state, action);
        } else if (actionHandlers['DEFAULT']) {
            return actionHandlers['DEFAULT'](action.payload || {}, state, action);
        }

        return state;
    };
}
