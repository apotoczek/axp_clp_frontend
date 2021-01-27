import uuid from 'uuid/v4';

import {deep_copy_object, is_set} from 'src/libs/Utils';
import {singularizeEntityType, pluralizeEntityType} from 'src/libs/Mapping';

import ValuesHandler from 'libs/spec-engine/values-handler';
import {getComponentFiller} from 'libs/spec-engine/utils';

/**
 * Derives new components in a specification based on a set of repeating
 * components and the component responsible for creating those. The returned
 * specification will include new components if they are not already existing
 * in the provided specificaton.
 *
 *
 * @param {Object} repeaters A map between component ids and an arrya of
 * component ids. The keys are the components responsible for the creation
 * (because of repeating) of the components with the ids in the value array.
 * @param {Object} spec The specification that we should derive the new
 * repeated components in.
 * @param {Array} componentIds A list of root repeaters to limit the derivation
 * to. If not defined, all root repeaters will be derived.
 *
 * @memberOf module:spec-engine
 */
export function deriveSpecRepeaters(repeaters, spec, componentIds = []) {
    const derivedSpec = deep_copy_object(spec);
    let componentsToDerive = [...componentIds];

    // If we weren't given a subset of components to derive the layout data for
    // we do it for all of the components instead.
    if (!is_set(componentsToDerive, true)) {
        componentsToDerive = Object.keys(spec);
    }

    for (const repeaterRootComponentId of componentsToDerive) {
        // If the repeaterRootComponentId is not in the derived layout data,
        // it was probably removed in an earlier iteration of the loop. So just
        // skip ahead.
        if (!(repeaterRootComponentId in derivedSpec)) {
            continue;
        }

        const newComponentIds = repeaters[repeaterRootComponentId] || [];

        const derivedRepeatRootSpec = derivedSpec[repeaterRootComponentId];
        derivedRepeatRootSpec.repeatIds = derivedRepeatRootSpec.repeatIds || [];

        const repeatRootSpec = spec[repeaterRootComponentId];
        const {repeatIds: oldRepeatedComponentIds = []} = repeatRootSpec;

        // If we don't have any new ids to repeat over, and we don't have
        // any old ids being repeated, we don't have anything to do here, so
        // just go to next component.
        if (!is_set(newComponentIds, true) && !is_set(derivedRepeatRootSpec.repeatIds, true)) {
            continue;
        }

        // If we have less new components thant he components that already
        // exist in the dashboard, we want to remove some components
        if (newComponentIds.length < oldRepeatedComponentIds.length) {
            let oldNewComponentIdPairs = oldRepeatedComponentIds.zip(newComponentIds);
            for (const [oldComponentId, newComponentId] of oldNewComponentIdPairs) {
                // We never want to remove the root repeater, so we just skip
                // to the next component. If the new id is the same as the old,
                // we're all set too.
                if (
                    newComponentId === repeaterRootComponentId ||
                    oldComponentId === newComponentId
                ) {
                    continue;
                }

                // If we have a new component id, we don't want to remove the
                // component, so we replace the component id and continue.
                if (newComponentId && newComponentId !== oldComponentId) {
                    // Replace the old id with the new one in the repeater roots
                    // list of repeated components, since it's keeping track.
                    const index = derivedRepeatRootSpec.repeatIds.indexOf(oldComponentId);
                    derivedRepeatRootSpec.repeatIds.splice(index, 1, newComponentId);

                    derivedSpec[newComponentId] = derivedSpec[oldComponentId];
                    delete derivedSpec[oldComponentId];
                } else {
                    // Since we don't have a new component id to assign, we should
                    // be removing the component.
                    let idx = derivedRepeatRootSpec.repeatIds.indexOf(oldComponentId);
                    derivedRepeatRootSpec.repeatIds.splice(idx, 1);
                    if (derivedRepeatRootSpec.repeatIds.length == 0) {
                        delete derivedRepeatRootSpec.repeatIds;
                    }

                    delete derivedSpec[oldComponentId];
                }
            }

            // If we get here, we don't need to remove any components from the
            // dashboard. But we might need to add some or just reassign component
            // ids.
        } else {
            let oldNewComponentIdPairs = newComponentIds.zip(oldRepeatedComponentIds);
            for (const [newComponentId, oldComponentId] of oldNewComponentIdPairs) {
                if (
                    newComponentId === repeaterRootComponentId ||
                    oldComponentId === newComponentId
                ) {
                    continue;
                }

                // If we have an old component id, we simply copy the old
                // component to the new component id.
                if (oldComponentId) {
                    let idx = derivedRepeatRootSpec.repeatIds.indexOf(oldComponentId);
                    derivedRepeatRootSpec.repeatIds.splice(idx, 1, newComponentId);

                    derivedSpec[newComponentId] = derivedSpec[oldComponentId];
                    delete derivedSpec[oldComponentId];

                    // We don't have an old component id, so we need to create a new
                    // component and add it to the dashboard. We simply copy it from
                    // the repeat root and update the repeat roots' repeater ids.
                } else {
                    if (derivedRepeatRootSpec.repeatIds.indexOf(newComponentId) == -1) {
                        derivedRepeatRootSpec.repeatIds.push(newComponentId);
                    }

                    derivedSpec[newComponentId] = deep_copy_object(derivedRepeatRootSpec);
                    derivedSpec[newComponentId].fromRepeatIn = repeaterRootComponentId;
                }
            }
        }
    }

    return derivedSpec;
}

export function deriveReportingComponents(dashboard, rcInstancesByComponent, componentIds = []) {
    const compIds = componentIds.length ? componentIds : Object.keys(dashboard.componentData);

    const derivedComponentData = deep_copy_object(dashboard.componentData);
    const derivedLayoutData = deep_copy_object(dashboard.layoutData);
    const derivedDataSpec = deep_copy_object(dashboard.dataSpec);

    for (const componentId of compIds) {
        if (!dashboard.componentData[componentId].base) {
            continue;
        }

        if (!rcInstancesByComponent[componentId]) {
            derivedComponentData[componentId] = {
                ...dashboard.componentData[componentId],
                base: {
                    ...dashboard.componentData[componentId].base,
                    notFound: true,
                },
            };
            derivedLayoutData[componentId] = dashboard.layoutData[componentId];
            derivedDataSpec[componentId] = dashboard.dataSpec[componentId];
        } else {
            derivedComponentData[componentId] = {
                ...dashboard.componentData[componentId],
                ...rcInstancesByComponent[componentId].componentData,
            };
            derivedLayoutData[componentId] = {
                ...dashboard.layoutData[componentId],
                ...rcInstancesByComponent[componentId].layoutData,
            };
            derivedDataSpec[componentId] = {
                ...dashboard.dataSpec[componentId],
                ...rcInstancesByComponent[componentId].dataSpec,
            };
        }
    }

    return {
        componentData: derivedComponentData,
        dataSpec: derivedDataSpec,
        layoutData: derivedLayoutData,
    };
}

/**
 * Inserts entity uids into the root components of a data spec. This is the
 * function that takes a dashboard data specifcation template and makes an
 * instance of a dashboard.
 *
 * @param {*} fillers An object with component uids as keys and an entity uid
 * as the value. The entity uid is the entity which all of the components data
 * specification children should be based upon.
 * @param {*} dataSpec A data specificaton template for a dashboard.
 *
 * @memberOf module:spec-engine
 */
export function insertEntityFillers(fillers, dataSpec) {
    const derivedDataSpec = deep_copy_object(dataSpec);
    for (const [componentId, componentDataSpec] of Object.entries(dataSpec)) {
        // If this component doesn't have a parent, it should be filled out by
        // the user, we set reset the ids to ensure that we don't have any
        // ids from a previous fill lying around
        if (!is_set(componentDataSpec.parent)) {
            setComponentEntityId(undefined, componentId, derivedDataSpec);
        }

        const componentFillers = fillers[componentId] || {};

        // Again, if this component doesn't have a parent, it should be filled
        // out by the user, so we set the entity id from the fillers.
        if (!is_set(componentDataSpec.parent)) {
            setComponentEntityId(componentFillers.entityId, componentId, derivedDataSpec);
        }

        // Same thing for the values.
        ValuesHandler.insertValueEntityFillers(
            componentId,
            componentFillers.values,
            derivedDataSpec,
        );
    }

    return derivedDataSpec;
}

/**
 * Takes a data specificaiton and fills it out with new components that are
 * created because some components are set to repeat over a type of
 * value / entity. The returned object is a data specfication that contains the
 * new components.
 *
 * @param {Object} repeaters A two level deep nested object. First level; Keys
 * are entity uids for an entity, and values are objects, representing a map
 * between entity types and the uids of the given entity type corresponding to
 * the top level entity uid.
 * @param {Object} dataSpec A specification representing the data for different
 * components in a dashboard.
 * @param {Array} componentIds The ids for the components that you need to
 * derive repeaters for. If not defined, all root components will be derived.
 *
 * @memberOf module:spec-engine
 */
export function deriveDataSpec(repeaters, dataSpec, componentIds = []) {
    const derivedDataSpec = deep_copy_object(dataSpec);
    let componentsToDerive = [...componentIds];

    // If no specific component ids where specified, get all the ids for the
    // root components.
    if (!is_set(componentsToDerive, true)) {
        componentsToDerive = Object.entries(dataSpec)
            .filter(([_, spec]) => !is_set(spec.parent))
            .map(([id, _]) => id);
    }

    // We're modifying componentsToDerive in this loop, so we don't use the
    // iterator (for..of) to avoid undefined behavior.
    for (let i = 0; i < componentsToDerive.length; i++) {
        const componentId = componentsToDerive[i];
        const {children} = dataSpec[componentId];

        if (!(componentId in derivedDataSpec)) {
            continue;
        }

        // We add the current components children if it has any, so that they
        // will also be derived later.
        if (Array.isArray(children)) {
            componentsToDerive.push(...children);
        }

        deriveComponentEntity(componentId, derivedDataSpec);
        ValuesHandler.deriveRepeaters(componentId, repeaters, derivedDataSpec);
        deriveComponentRepeaters(componentId, repeaters, derivedDataSpec);
    }

    return derivedDataSpec;
}

function deriveComponentRepeaters(componentId, repeaters, derivedDataSpec) {
    const {repeatFor, repeatIds = [], parent: parentId} = derivedDataSpec[componentId];

    // Make sure this component should be repeated
    if (!is_set(repeatFor)) {
        return;
    }

    // We know the component has a parent if it's being repeated (doesn't
    // make to repeat over something when we're not relative to anything).
    const {entity: parentEntity} = derivedDataSpec[parentId] || {};

    const parentRepeaters = repeaters[parentEntity.uid] || {};
    const entitiesToRepeat = parentRepeaters[componentId] || [];
    const existingComponents = [componentId, ...repeatIds];

    // Fill upp existingComponents to make sure both are the same length,
    // this prepares us for the `zip` below.
    if (entitiesToRepeat.length > existingComponents.length) {
        for (let i = existingComponents.length; i < entitiesToRepeat.length; i++) {
            existingComponents.push(null);
        }
    }

    for (let [compId, entityId] of existingComponents.zip(entitiesToRepeat)) {
        // If we don't have a component id, we need to add a new
        // component to the dashboard as a repeated element of its root.
        if (!is_set(compId)) {
            compId = addRepeatedComponent(componentId, parentId, derivedDataSpec);
        }

        // If we have an entity id here, we just want to reassign the
        // component to display data for another entity.
        if (is_set(entityId)) {
            setComponentEntityType(singularizeEntityType(repeatFor), compId, derivedDataSpec);
            setComponentEntityId(entityId, compId, derivedDataSpec);

            // If we don't have an entity id, then we want to remove the
            // component from the dashboard.
        } else {
            if (!is_set(derivedDataSpec[compId].repeatFor)) {
                removeComponentFromSpec(compId, componentId, derivedDataSpec);

                // Since we removed the component from the spec, no need to continue
                // further.
                continue;

                // If we have a component that is responsible for repeating other
                // components, we don't want that component to be removed. Thus
                // we simply set the entity id to be undefined.
            } else {
                setComponentEntityId(undefined, compId, derivedDataSpec);
            }
        }
    }
}

function addRepeatedComponent(componentId, parentId, derivedDataSpec) {
    const repeatedCompId = uuid();
    const derivedComponentDataSpec = derivedDataSpec[componentId];
    derivedDataSpec[repeatedCompId] = deep_copy_object(derivedComponentDataSpec);
    derivedDataSpec[repeatedCompId].fromRepeatIn = componentId;
    derivedDataSpec[parentId].children.push(repeatedCompId);
    derivedComponentDataSpec.repeatIds = derivedComponentDataSpec.repeatIds || [];

    if (derivedComponentDataSpec.repeatIds.indexOf(repeatedCompId) == -1) {
        derivedComponentDataSpec.repeatIds.push(repeatedCompId);
    }

    delete derivedDataSpec[repeatedCompId].repeatFor;
    delete derivedDataSpec[repeatedCompId].repeatIds;

    return repeatedCompId;
}

function deriveComponentEntity(componentId, derivedDataSpec) {
    let {parent: parentId, entity} = derivedDataSpec[componentId];

    // If we don't have a parent, there is no place to derive the entity from
    if (!is_set(parentId) || is_set(entity)) {
        return;
    }

    derivedDataSpec[componentId].entity = deep_copy_object(derivedDataSpec[parentId].entity);
}

function setComponentEntityId(entityId, compId, derivedDataSpec) {
    if (entityId !== undefined) {
        derivedDataSpec[compId].entity = derivedDataSpec[compId].entity || {};
        derivedDataSpec[compId].entity.uid = entityId;
    } else {
        if (is_set(derivedDataSpec[compId].entity)) {
            delete derivedDataSpec[compId].entity.uid;
        }
    }
}

function setComponentEntityType(entityType, compId, derivedDataSpec) {
    derivedDataSpec[compId].entity = derivedDataSpec[compId].entity || {};
    derivedDataSpec[compId].entity.type = entityType;
}

function removeComponentFromSpec(compId, repeaterRootId, derivedDataSpec) {
    const derivedComponentDataSpec = derivedDataSpec[repeaterRootId];
    let index = derivedComponentDataSpec.repeatIds.indexOf(compId);
    derivedComponentDataSpec.repeatIds.splice(index, 1);

    // If we removed the last component from the repeater root,
    // delete the whole repeatIds list.
    if (derivedComponentDataSpec.repeatIds.length == 0) {
        delete derivedComponentDataSpec.repeatIds;
    }

    // Finally remove the component that we don't need anymore from
    // the spec.
    delete derivedDataSpec[compId];
}

/**
 * Cleans out a derived data specification from the fillers and repeaters that
 * were applied to it during `insertEntityFillers` and`deriveDataSpec`.
 *
 * @param {*} derivedDataSpec The data specification that was derived from a
 * normal data spec, fillers and repeaters. The returned result from
 * `insertEntityFillers` and `deriveDataSpec`.
 *
 * @memberOf module:spec-engine
 */
export function cleanRepeaters(derivedDataSpec) {
    // This is the data specification cleaned from fillers and repeaters. This
    // essentially represents a template to build a dashboard upon.
    let cleanedDataSpec = deep_copy_object(derivedDataSpec);
    let dataSpecFillers = {};

    for (const [componentId, componentDataSpec] of Object.entries(derivedDataSpec)) {
        const {parent, entity, fromRepeatIn, repeatIds} = componentDataSpec;

        // If this part of the spec was created because of some other component
        // repeating over a specific entity. We just delete the whole key/value
        // pair and remove it from the childrens array in its' parent.
        if (fromRepeatIn) {
            removeRepeatedComponent(cleanedDataSpec, fromRepeatIn, componentId, parent);

            // Since we deleted the whole object, we don't need to do anything
            // else to clean up.
            continue;
        }

        ValuesHandler.resetRepeated(componentId, cleanedDataSpec);

        if (is_set(entity)) {
            // Delete the uids that was input from the fillers.
            getComponentFiller(componentId, dataSpecFillers, cleanedDataSpec);
            extractComponentFiller(componentId, cleanedDataSpec);

            // We fill out entity type for all components for convenience during
            // derivation, so we reset it here if we need to.
            resetComponentEntityType(repeatIds, cleanedDataSpec, componentId, entity, parent);
        }
        ValuesHandler.extractFillers(componentId, dataSpecFillers, cleanedDataSpec);

        if (!is_set(cleanedDataSpec[componentId].repeatIds, true)) {
            delete cleanedDataSpec[componentId].repeatIds;
        }
        if (!is_set(cleanedDataSpec[componentId].entity, true)) {
            delete cleanedDataSpec[componentId].entity;
        }
    }

    return {cleanedDataSpec, dataSpecFillers};
}

function resetComponentEntityType(repeatIds, cleanedDataSpec, componentId, entity, parent) {
    // If we don't have an entity type there is nothing to reset
    if (!is_set(entity.type) || !is_set(parent)) {
        return;
    }

    // Reset entity type to a repeatFor key if we have a parent,
    // entity type and a list of components that were repeated.
    if (repeatIds) {
        cleanedDataSpec[componentId].repeatFor = pluralizeEntityType(entity.type);
    }

    delete cleanedDataSpec[componentId].entity;
}

function extractComponentFiller(componentId, dataSpec) {
    // Clean up the uid defined at the component level
    if (!is_set(dataSpec[componentId].parent)) {
        delete dataSpec[componentId].entity.uid;
    }
}

function removeRepeatedComponent(cleanedDataSpec, fromRepeatIn, componentId, parent) {
    // Remove from the repeater roots repeated ids.
    cleanedDataSpec[fromRepeatIn].repeatIds.splice(
        cleanedDataSpec[fromRepeatIn].repeatIds.indexOf(componentId),
        1,
    );

    // Remove the repeated element from the children of its parent.
    cleanedDataSpec[parent].children.splice(
        cleanedDataSpec[parent].children.indexOf(componentId),
        1,
    );

    // Finally remove the repeated component.
    delete cleanedDataSpec[componentId];
}

export function extractRepeaterRoots(componentId, dataSpec) {
    return ValuesHandler.extractRepeaterRoots(componentId, dataSpec);
}

export function extractReportingComponentDefinitions(componentData, componentIds = []) {
    const compIds = componentIds.length ? componentIds : Object.keys(componentData);

    const reportingComponents = {};
    for (const componentId of compIds) {
        const {base} = componentData[componentId] || {};
        if (base && base.reportingComponentId) {
            reportingComponents[componentId] = base;
        }
    }

    return reportingComponents;
}

export function cleanReportingComponents(derivedDashboard, componentIds = []) {
    componentIds = componentIds.length
        ? componentIds
        : Object.entries(derivedDashboard.componentData)
              .filter(([_, data]) => !!data.base)
              .map(([componentId]) => componentId);

    const cleanComponentData = _cleanComponentDataReportingComponents(
        derivedDashboard.componentData,
        componentIds,
    );
    const cleanDataSpec = _cleanDataSpecReportingComponents(
        derivedDashboard.dataSpec,
        componentIds,
    );
    const cleanLayoutData = _cleanLayoutDataReportingComponents(
        derivedDashboard.layoutData,
        componentIds,
    );

    return {
        componentData: cleanComponentData,
        dataSpec: cleanDataSpec,
        layoutData: cleanLayoutData,
    };
}

function _cleanComponentDataReportingComponents(derivedComponentData, componentIds) {
    const cleanedComponentData = deep_copy_object(derivedComponentData);
    for (const componentId of componentIds) {
        const {
            base: {notFound: _, ...base},
            repeatIds,
            fromRepeatIn,
        } = derivedComponentData[componentId];
        if (!base) {
            continue;
        }

        cleanedComponentData[componentId] = {base, repeatIds, fromRepeatIn};
    }

    return cleanedComponentData;
}

function _cleanDataSpecReportingComponents(derivedDataSpec, componentIds) {
    const cleanedDataSpec = deep_copy_object(derivedDataSpec);
    for (const componentId of componentIds) {
        const {repeatFor} = derivedDataSpec[componentId];
        cleanedDataSpec[componentId] = {repeatFor};
    }
    return cleanedDataSpec;
}

function _cleanLayoutDataReportingComponents(derivedLayoutData, componentIds) {
    const cleanedLayoutData = deep_copy_object(derivedLayoutData);
    for (const componentId of componentIds) {
        const {x, y, w, h, pageIdx, repeatIds, fromRepeatIn} = derivedLayoutData[componentId];
        cleanedLayoutData[componentId] = {x, y, w, h, pageIdx, repeatIds, fromRepeatIn};
    }
    return cleanedLayoutData;
}
