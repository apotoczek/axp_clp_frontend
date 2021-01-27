import uuid from 'uuid/v4';
import ValuesHandler from 'libs/spec-engine/values-handler';

import {is_set, deep_copy_object} from 'src/libs/Utils';
import {singularizeEntityType, pluralizeEntityType} from 'src/libs/Mapping';

/**
    Moves a component either up or down one page.

    @param {String} componentId - The id of the component to move
    @param {Boolean} up - True if component is to be moved up otherwise false (moved down instead)
    @param {Number} newRow - The row value of the component in the new page
    @param {Object} layoutData - The layoutdata for the dashboard
*/
export function changeComponentPage(componentId, up, newRow, newCol, layoutData) {
    const newLayoutData = {...layoutData};
    const componentLayout = newLayoutData[componentId];
    const newPageIdx = componentLayout['pageIdx'] + (up ? 1 : -1);
    // TODO: Should use some RGL logic to make sure we don't collide with other objects

    if (newPageIdx >= 0) {
        componentLayout['pageIdx'] = newPageIdx;
        componentLayout['y'] = newRow;
        componentLayout['x'] = newCol;
    }

    return {newLayoutData};
}

/**
 * Extracts the component ids that were created for each component that had a
 * repeat property specified when deriving the specification. Returns a map
 * from component id to component ids.
 *
 * @param {Object} derivedSpec This is a derived specification. Get
 * this by passing a non-derived spec to `insertEntityFillers(...)`,
 * `deriveSpecRepeaters(...)` or `deriveComponentData(...)`.
 *
 * @memberOf module:spec-engine
 */
export function extractComponentRepeaters(derivedSpec) {
    const componentRepeaters = {};

    for (const [componentId, componentSpec] of Object.entries(derivedSpec)) {
        let repeatRootId = componentSpec.fromRepeatIn;

        if (!repeatRootId) {
            continue;
        }

        componentRepeaters[repeatRootId] = componentRepeaters[repeatRootId] || [];
        componentRepeaters[repeatRootId].push(componentId);
    }

    return componentRepeaters;
}

/**
 * Gets the currently assigned values to a component in a dashboard.
 *
 * @param {String} componentId The id of the component to get the values for.
 * @param {Object} dataSpec The data specification of the dashboard where the
 * given component is defined.
 *
 * @memberOf module:spec-engine
 */
export function componentValues(componentId, dataSpec) {
    if (!(componentId in dataSpec) || !dataSpec[componentId].values) {
        return null;
    }
    return dataSpec[componentId].values;
}

export function entitiesForComponent(componentDataSpec, valueId) {
    if (!componentDataSpec) {
        return [];
    }

    let entities = [];

    if (is_set(componentDataSpec.entity, true)) {
        entities.push({...componentDataSpec.entity});
    }

    const values = valueId
        ? {
              [valueId]: componentDataSpec.values[valueId],
          }
        : componentDataSpec.values;

    entities = entities.concat(ValuesHandler.valueEntities(values));

    return entities;
}

export function entitiesForDataSpec(dataSpec, componentId, valueId) {
    if (!dataSpec) {
        return [];
    }

    const dataSpecs = componentId ? [dataSpec[componentId]] : Object.values(dataSpec);
    return dataSpecs.reduce(
        (entities, spec) => [...entities, ...entitiesForComponent(spec, valueId)],
        [],
    );
}

/**
 * Gets the entity type that the data of the given component relates to.
 *
 * @param {String} componentId The component to fetch the entity type for.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function entityTypeForComponent(componentId, dataSpec) {
    let currentDataSpec = dataSpec[componentId];

    return currentDataSpec && currentDataSpec.entity && currentDataSpec.entity.type;
}

export function cashflowTypeForComponent(componentId, dataSpec) {
    let currentDataSpec = dataSpec[componentId];

    return currentDataSpec && currentDataSpec.entity && currentDataSpec.entity.cashflowType;
}

/**
 * Checks if the value of the given component is editable by the user.
 *
 * @param {String} componentId The id of the component to check.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function canChangeValue(componentId, dataSpec) {
    return !isRepeated(componentId, dataSpec);
}

/**
 * Checks if the given component currently has data attached to it.
 *
 * @param {String} componentId The id of the component to check.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function hasDatasource(componentId, dataSpec) {
    return componentId in dataSpec;
}

/**
 * Checks if the given component was created because it was repeated from
 * another component.
 *
 * @param {String} componentId The id of the component to check.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function isRepeated(componentId, dataSpec) {
    return !!(dataSpec && dataSpec[componentId] && dataSpec[componentId].fromRepeatIn);
}

export function hasChildren(componentId, dataSpec) {
    return (
        dataSpec &&
        dataSpec[componentId] &&
        Array.isArray(dataSpec[componentId].children) &&
        dataSpec[componentId].children.length > 0
    );
}

/**
 * Checks if the given component is the child of any other component. Meaning
 * that the potential values in the component is not related to another entity.
 *
 * @param {String} componentId The id of the component to check.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function isRoot(componentId, dataSpec) {
    return dataSpec && dataSpec[componentId] && !dataSpec[componentId].parent;
}

/**
 * Checks if the given component is responsible for repeating any components,
 * meaning that it might be responsible for some other components creation.
 *
 * @param {String} componentId The id of the component to check.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function isRepeatRoot(componentId, dataSpec) {
    return !!(dataSpec && dataSpec[componentId] && dataSpec[componentId].repeatFor);
}

/**
 * Removes a component from the dashboard. This will remove the specified
 * component and the components that were repeated based on it.
 *
 * @param {String} componentId The id of the component to remove from the
 * dashboard.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function removeComponent(componentId, dataSpec, componentData, layoutData) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    if (isRepeated(componentId, dataSpec)) {
        return undefined;
    }

    const parentDataSpec = newDataSpec[newDataSpec[componentId].parent];

    // If the component that is being deleted is a repeat root, we take away
    // all of it's children too.
    if (isRepeatRoot(componentId, dataSpec)) {
        for (const repeatId of dataSpec[componentId].repeatIds) {
            // Delete the repeater from our parents children
            const index = parentDataSpec.children.findIndex(childId => childId === componentId);
            parentDataSpec.children.splice(index, 1);

            delete newDataSpec[repeatId];
            delete newComponentData[repeatId];
            delete newLayoutData[repeatId];
        }
    }

    // If we have a parent, remove ourselves from the parents children
    if (!isRoot(componentId, dataSpec)) {
        const index = parentDataSpec.children.findIndex(childId => childId === componentId);
        parentDataSpec.children.splice(index, 1);
    }

    // TODO(Simon 29 March 2018) Also remove all of the specified components
    // children if it has any

    delete newDataSpec[componentId];
    delete newComponentData[componentId];
    delete newLayoutData[componentId];

    return {newDataSpec, newComponentData, newLayoutData};
}

/**
 * Duplicates a component in a dashboard, creating an exact copy of it.
 *
 * @param {String} componentId The id of the component to duplicate.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function duplicateComponent(componentId, dataSpec, componentData, layoutData) {
    // TODO: We need to change the unique uids inside the spec  when we duplicate a
    // component. Examples of these unique uids are the value ids in the data spec.
    if (!canChangeValue(componentId, dataSpec)) {
        return;
    }

    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    let newComponentId = uuid();

    // Duplicate the component that was marked for duplication
    newDataSpec[newComponentId] = deep_copy_object(dataSpec[componentId] || {});
    newLayoutData[newComponentId] = deep_copy_object(layoutData[componentId] || {});
    newComponentData[newComponentId] = deep_copy_object(componentData[componentId] || {});

    // If the component that we are duplicating has any children, we duplicate those too.
    if (isRepeatRoot(componentId, dataSpec) || hasChildren(componentId, dataSpec)) {
        for (const childId of dataSpec[componentId].children) {
            const childDataSpec = dataSpec[childId] || {};
            const childLayoutData = layoutData[childId] || {};
            const childComponentData = componentData[childId] || {};

            let newChildId = uuid();
            newDataSpec[newChildId] = deep_copy_object(childDataSpec);
            newLayoutData[newChildId] = deep_copy_object(childLayoutData);
            newComponentData[newChildId] = deep_copy_object(childComponentData);
        }
    }

    return {newDataSpec, newComponentData, newLayoutData, newComponentId};
}

/**
 * Adds a new component to the dashboard.
 *
 * @param {Object} component Object containing at least `componentData` with the
 * set key `componentKey` set to the appropriate value of the component you would like
 * to add. You can also provide the keys `dataSpec` and `layoutData` in this component to
 * prefill them when we add the component to the report.
 * @param {Object} dashboard Dashboard to add the component into. Needs to contain
 * `componentData`, `dataSpec`, and `layoutData` keys.
 * @param {Number} nbrColumns Number of columns that the dashboard has. Defaults to 24.
 *
 * @memberOf module:spec-engine
 */
export function addNewComponent(component, dashboard, nbrColumns = 24) {
    const dataSpec = {...dashboard.dataSpec};
    const componentData = {...dashboard.componentData};
    const layoutData = {...dashboard.layoutData};

    const componentId = uuid();

    if (!component.componentData) {
        throw 'Cannot add component to dashboard without component data.';
    }

    component.dataSpec = component.dataSpec || {};
    component.layoutData = {
        w: component.layoutData.w || 5,
        h: component.layoutData.h || 5,
        pageIdx: component.layoutData.pageIdx || 0,
    };

    const {x, y} = _calculateComponentPosition(component.layoutData, layoutData, nbrColumns);
    component.layoutData.x = x;
    component.layoutData.y = y;

    dataSpec[componentId] = component.dataSpec;
    componentData[componentId] = component.componentData;
    layoutData[componentId] = component.layoutData;

    return [{dataSpec, componentData, layoutData}, componentId];
}

function _calculateComponentPosition(componentLayoutData, dashboardLayoutData, nbrColumns) {
    const pageLayoutData = Object.values(dashboardLayoutData).filter(
        ({pageIdx = 0}) => pageIdx === componentLayoutData.pageIdx,
    );

    const orderedBoxes = pageLayoutData
        .sort((b1, b2) => (b1.x < b2.x ? -1 : 1))
        .sort((b1, b2) => (b1.y < b2.y ? -1 : 1)); // y priotity

    const possibleOrigins = [{x: 0, y: 0}]
        .concat(orderedBoxes.map(posBox => ({x: posBox.x + posBox.w, y: posBox.y})))
        .concat(orderedBoxes.map(posBox => ({x: posBox.x, y: posBox.y + posBox.h})));

    outerloop: for (const origin of possibleOrigins) {
        const possibleBox = {
            w: componentLayoutData.w,
            h: componentLayoutData.h,
            x: origin.x,
            y: origin.y,
        };

        for (const positionedBox of orderedBoxes) {
            if (
                possibleBox.x + possibleBox.w > nbrColumns ||
                boxClash(possibleBox, positionedBox)
            ) {
                continue outerloop;
            }
        }

        // Return first coordinate where new box doesn't clash with previous boxes
        return {x: possibleBox.x, y: possibleBox.y};
    }

    return {x: 0, y: Infinity};
}

function boxClash(box1, box2) {
    return !!(
        box1.y + box1.h > box2.y &&
        box1.y < box2.y + box2.h &&
        box1.x + box1.w > box2.x &&
        box1.x < box2.x + box2.w
    );
}

/**
 * Sets the entity type to fetch data from of the given component to the
 * specified type.
 *
 * @param {String} componentId The id of the component to change entity type
 * for.
 * @param {String} entityType The new entity type to assign to the given
 * component.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function setEntityType(componentId, entityType, dataSpec, componentData, layoutData) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    if (!entityType) {
        throw oneLine`
            [spec-engine]: Cannot set entity type to undefined or null.
        `;
    }

    if (!isRoot(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity type on component that is relative
            to a parent entity type (${componentId}).
        `;
    }

    if (isRepeatRoot(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity type on repeater element. Try
            using 'setRepeatFor' instead.
        `;
    }

    newDataSpec[componentId].entity = {
        ...(newDataSpec[componentId].entity || {}),
        type: entityType.camelize(false),
    };

    const {children = []} = dataSpec[componentId];
    const components = [componentId, ...children];
    for (const compId of components) {
        // TODO (Simon 18 March 2018) When we go through the children, check if
        // their values are still valid for the new entity type, if they are,
        // keep them, otherwise reset them.
        delete newDataSpec[compId].values;
    }

    // TODO Re-derive the specs for any of the children that are repeaters.

    return {newDataSpec, newComponentData, newLayoutData};
}

/**
 * Sets the entity id to fetch data from of the given component to the
 * specified id.
 *
 * @param {String} componentId The id of the component to assign a new entity
 * id to.
 * @param {String} entityId The entity id to assign to the given component.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function setEntityId(componentId, entityId, dataSpec, componentData, layoutData) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    if (!isRoot(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity id on component that is relative
            to a parent entity (${componentId}).
        `;
    }

    if (isRepeatRoot(componentId, dataSpec) || isRepeated(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity id on repeated element. It will
            fill in automatically during repeating.
        `;
    }

    newDataSpec[componentId].entity = {
        ...(newDataSpec[componentId].entity || {}),
        uid: entityId,
    };

    // TODO Re-derive the specs for any of the children that are repeaters.

    return {newDataSpec, newComponentData, newLayoutData};
}

export function setEntityCashflowType(
    componentId,
    cashflowType,
    dataSpec,
    componentData,
    layoutData,
) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    if (!isRoot(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity id on component that is relative
            to a parent entity (${componentId}).
        `;
    }

    if (isRepeatRoot(componentId, dataSpec) || isRepeated(componentId, dataSpec)) {
        throw oneLine`
            [spec-engine]: Cannot set entity id on repeated element. It will
            fill in automatically during repeating.
        `;
    }

    newDataSpec[componentId].entity = {
        ...(newDataSpec[componentId].entity || {}),
        cashflowType,
    };

    // TODO Re-derive the specs for any of the children that are repeaters.

    return {newDataSpec, newComponentData, newLayoutData};
}

/**
 * Sets the type of entity that the specified component should be repeated for
 * based on the components parent.
 *
 * @param {String} componentId The id of the component to repeat for a specific
 * entity type.
 * @param {String} repeatFor The type of entity that the given component should
 * be repeated for relative to its parent entity.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function setRepeatFor(componentId, repeatFor, dataSpec, componentData, layoutData) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    if (!isRepeatRoot(componentId, dataSpec) && !isRoot(componentId, dataSpec)) {
        return;
    }

    const {repeatIds = []} = dataSpec[componentId];
    for (const repeatId of [componentId, ...repeatIds]) {
        newDataSpec[repeatId].entity = {
            ...newDataSpec[repeatId].entity,
            type: singularizeEntityType(repeatFor),
        };

        // TODO Keep if the values are still compatible
        // Delete the values since the entity type could be different.
        delete newDataSpec[repeatId].values;
    }
    newDataSpec[componentId].repeatFor = pluralizeEntityType(repeatFor);

    // TODO Re-derive the repeaters for this component id

    return {newDataSpec, newComponentData, newLayoutData};
}

/**
 * Sets the values to fetch of the given component and any of the components
 * that were repeated based on the given component.
 *
 * @param {String} componentId The id of the component to assign new values.
 * @param {String} newValues The new values to assign to the component. This
 * is the whole `value` object inside of a components data specification.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function setComponentValues(componentId, newValues, dataSpec) {
    if (!(componentId in dataSpec)) {
        return;
    }

    if (!isRepeatRoot(componentId, dataSpec) && !isRoot(componentId, dataSpec)) {
        return;
    }

    const updatedDataSpec = {...dataSpec};

    const {repeatIds = []} = updatedDataSpec[componentId];
    let components = [componentId, ...repeatIds];

    for (const compId of components) {
        if (!updatedDataSpec[compId]) {
            continue;
        }

        updatedDataSpec[compId].values = deep_copy_object(newValues);
    }

    return [updatedDataSpec, components];
}

export function setComponentData(componentId, data, componentData) {
    if (!(componentId in componentData)) {
        return;
    }

    // Can't set the component data of a component that has been repeated
    if (componentData[componentId].fromRepeatIn) {
        return;
    }

    const updatedComponentData = {...componentData};

    const {repeatIds = []} = updatedComponentData[componentId];
    let components = [componentId, ...repeatIds];

    for (const compId of components) {
        if (!updatedComponentData[compId]) {
            continue;
        }

        updatedComponentData[compId] = deep_copy_object(data);
    }

    return [updatedComponentData, components];
}

/**
 * Sets the component type of the specified component and all of the components
 * that were repeated based on it. This will reset the values that were assigned
 * to the component.
 *
 * @param {String} componentId The id of the component to assign a new component
 * type.
 * @param {String} componentKey The key representing the new type to assign to
 * the given component.
 * @param {Object} dataSpec The data specification that corresponds to the
 * dashboard that the given component is defined in.
 * @param {Object} componentData The component data specification that
 * corresponds to the dashboard that the given component is defined in.
 * @param {Object} layoutData The layout data specification that corresponds
 * to the dashboard that the given component is defined in.
 *
 * @memberOf module:spec-engine
 */
export function setComponentType(
    componentId,
    componentKey,
    dataSpec,
    componentData,
    layoutData,
    defaults,
    constraints,
    requireData,
) {
    const newDataSpec = {...dataSpec};
    const newComponentData = {...componentData};
    const newLayoutData = {...layoutData};

    newComponentData[componentId] = {componentKey: componentKey};

    if (requireData) {
        newDataSpec[componentId] = newDataSpec[componentId] || {};
        delete newDataSpec[componentId].values;
    } else {
        delete newDataSpec[componentId];
    }

    newLayoutData[componentId] = {
        ...newLayoutData[componentId],
        w: (defaults && defaults.width) || 5,
        h: (defaults && defaults.height) || 10,
        minH: constraints && constraints.height.min,
        maxH: constraints && constraints.height.max,
        minW: constraints && constraints.width.min,
        maxW: constraints && constraints.width.max,
    };

    // TODO (Simon 29 March 2018) Do for all repeated elements as well.

    return {newDataSpec, newComponentData, newLayoutData};
}
