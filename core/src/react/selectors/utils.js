import createCachedSelector from 're-reselect';

export const createComponentSelector = (selectors, selectorFn) =>
    createCachedSelector(selectors, selectorFn)((_state, componentId) => componentId);

export const createEntitySelector = (selectors, selectorFn) =>
    createCachedSelector(selectors, selectorFn)((_state, entityId) => entityId);
