import {utils} from 'react-grid-layout';

import {deep_copy_object, is_set} from 'src/libs/Utils';
import * as Mapping from 'src/libs/Mapping';

import ValuesHandler from 'libs/spec-engine/values-handler';
import {entityTypeForComponent} from 'libs/spec-engine/component-utils';

export const Format = {
    Money: 'money',
    Percentage: 'percentage',
    Multiple: 'multiple',
    String: 'string',
    Percent: 'percent',
    Integer: 'integer',
    Float: 'float',
    Date: 'date',
    BackendDate: 'backend_date',
};

/**
 * Given a derived layout data (layout data including repeaters) this helper
 * recalculates the position and size of all the components, such that the
 * result is a valid dashboard layout.
 *
 * This allows us to pass a non-valid layout, e.g. where components can be laid
 * on-top of eachother etc, and transform it into a layout where these issues
 * have been resolved.
 *
 * @param {Object} derivedLayoutData The layout data, including repeaters, in
 * which we should recalculate position and size for each component.
 *
 * @memberOf module:spec-engine
 */
export function recalculateLayout(derivedLayoutData) {
    const layoutData = deep_copy_object(derivedLayoutData);
    const rawLayout = asReactGridLayout(layoutData);

    const maxPageIdx = Object.values(derivedLayoutData).reduce((max, entry) => {
        return entry.pageIdx > max ? entry.pageIdx : max;
    }, 0);

    // Consider pageIdx when compacting
    for (let pageIdx = 0; pageIdx <= maxPageIdx; pageIdx++) {
        const entries = rawLayout.filter(component => (component['pageIdx'] || 0) == pageIdx);

        /** NOTE: second argument `false` is do NOT compact vertically.
        This is temporary while figuring out a solid solution to this.
        Problem is that we do not want to compact vertically when reports have been
        created and layouted with space intentionally.
        */
        const correctedLayout = utils.compact(entries, false, 12);

        for (const layout of correctedLayout) {
            layoutData[layout.i].x = layout.x;
            layoutData[layout.i].y = layout.y;
            layoutData[layout.i].w = layout.w;
            layoutData[layout.i].h = layout.h;
        }
    }

    return layoutData;
}

/**
 * Takes a layout representation in our format, and converts it into a format
 * that can be passed to react-grid-layout.
 *
 * @param {Object} formattedLayout The layout to convert into a format that
 * react-grid-layout can handle properly.
 *
 * @memberOf module:spec-engine
 */
export function asReactGridLayout(formattedLayout) {
    const RGLBaseProps = {
        isDraggable: undefined,
        isResizable: undefined,
        maxH: undefined,
        maxW: undefined,
        minH: undefined,
        minW: undefined,
        moved: false,
        static: false,
    };

    const deleteFromLocal = ['repeatIds', 'fromRepeatIn'];

    return Object.entries(formattedLayout).map(([i, layoutData]) => {
        const layout = {...RGLBaseProps, ...layoutData, i};
        for (const key of deleteFromLocal) {
            delete layout[key];
        }

        return layout;
    });
}

/**
 * Takes a layout object in the react-grid-layout format and converts it into
 * a format that we can use to store on the backend.
 *
 * @param {Array} layoutData The react-grid-layout layout representation to
 * transform into a format that we can store on the backend
 *
 * @memberOf module:spec-engine
 */
export function formatLayout(layoutData) {
    let formattedLayout = {};

    const toRemoveFromRGL = ['i', 'static', 'moved', 'isDraggable', 'isResizable'];

    for (const component of layoutData) {
        formattedLayout[component.i] = {...component};
        for (const key of toRemoveFromRGL) {
            delete formattedLayout[component.i][key];
        }
    }

    return formattedLayout;
}

/**
 * Extract the entity path for a component from a data specification. An entity
 * path is an array describing the entity type of the current component relative
 * to its parents' entity types.
 *
 * **Example:**
 * > If the current component was fetching data from a company that had been
 * > repeated for all the companies in a portfolio, the result would be:
 * >    `['portfolio', 'company']`
 *
 * **Example:**
 * > If the current component was fetching data from a user fund that had been
 * > defined as a standalone entity for a component (not relative to another
 * > component), the result would be:
 * >    `['userFund']`
 *
 * @param {String} componentId The component to get the entity path for.
 * @param {Object} dataSpec The data specification to get the entity path from.
 * @param {Bool}   pluralize True if the entity types in the result should be
 * in pluralized form. Defaults to false.
 *
 * @memberOf module:spec-engine
 */
export function entityPath(componentId, dataSpec, pluralize = false) {
    let currentSpec = dataSpec[componentId];
    const entityPath = [];
    while (currentSpec) {
        let entityType = entityTypeForComponent(componentId, dataSpec);
        if (entityType) {
            entityPath.unshift(pluralize ? Mapping.pluralizeEntityType(entityType) : entityType);
        }

        if (!currentSpec.parent) {
            break;
        }
        currentSpec = dataSpec[currentSpec.parent];
    }

    return entityPath.length > 0 ? entityPath : undefined;
}

export function swapFiller(oldEntityId, newEntityId, fillers) {
    const newFillers = deep_copy_object(fillers || {});

    function swap(target) {
        if (Object.isObject(target)) {
            const mapped = {};
            for (const [key, value] of Object.entries(target)) {
                // Check both key and value against the old entity id, potentially swap
                // both
                mapped[key === oldEntityId ? newEntityId : key] = swap(value);
            }
            return mapped;
        } else if (Array.isArray(target)) {
            // For arrays, just map swap over each individiual value to swap each one
            return target.map(swap);
        }

        // Compare any value that is not an object or array directly.
        return target === oldEntityId ? newEntityId : target;
    }

    return swap(newFillers);
}

export function removeFiller(entityId, fillers) {
    const newFillers = deep_copy_object(fillers);

    function remove(target) {
        if (Object.isObject(target)) {
            const mapped = {};
            for (const [key, value] of Object.entries(target)) {
                // If the key matches the entityId to remove, continue to remove
                if (key === entityId) {
                    continue;
                }

                // Remove the value, if it was completely removed, continue to remove
                // the parent completely
                const removedValue = remove(value);
                if (removedValue === undefined) {
                    continue;
                }

                // Remap this key with the removed value
                mapped[key] = removedValue;
            }

            // If object is now empty after filtering, return undefined to remove the
            // parent completely
            return Object.size(mapped) > 0 ? mapped : undefined;
        } else if (Array.isArray(target)) {
            const newArray = target.map(remove).filter(value => value !== undefined);

            // If array is now empty after filtering, return undefined tor emove the
            // parent completely
            return newArray.length > 0 ? newArray : undefined;
        }

        // Compare any value that is not an array or object directly.
        return target === entityId ? undefined : target;
    }

    return remove(newFillers);
}

export function getComponentFiller(componentId, dataSpecFillers, dataSpec) {
    // Clean up and extract the uid defined at the component level
    if (!is_set(dataSpec[componentId].parent)) {
        dataSpecFillers[componentId] = {
            ...(dataSpecFillers[componentId] || {}),
            entityId: dataSpec[componentId].entity.uid,
        };
    }
}

/**
 * Goes through the given derived spec and finds all the fillers. This does not modify
 * the given spec, only finds the fillers.
 *
 * @param {*} derivedDataSpec The data specification that was derived from a
 * normal data spec, fillers and repeaters. The returned result from
 * `insertEntityFillers` and `deriveDataSpec`.
 */
export function getSpecFillers(derivedDataSpec) {
    // This is the data specification cleaned from fillers and repeaters. This
    // essentially represents a template to build a dashboard upon.
    const dataSpecFillers = {};

    for (const [componentId, componentDataSpec] of Object.entries(derivedDataSpec)) {
        if (is_set(componentDataSpec.entity)) {
            // Delete the uids that was input from the fillers.
            getComponentFiller(componentId, dataSpecFillers, derivedDataSpec);
        }
        ValuesHandler.getFillers(componentId, dataSpecFillers, derivedDataSpec);
    }

    return dataSpecFillers;
}
