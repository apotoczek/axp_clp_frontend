import {is_set, object_from_array} from 'src/libs/Utils';

import BaseValueHandler from 'libs/spec-engine/values-handler/base-value-handler';
import TabularValueHandler from 'libs/spec-engine/values-handler/tabular-value-handler';

class ValuesHandler {
    static getValueHandler(valueType) {
        if (valueType === 'tabular') {
            return TabularValueHandler;
        } else if (valueType === 'base') {
            return BaseValueHandler;
        }

        throw oneLine`
            Trying to get value handler for non-supported value type (${valueType}).
        `;
    }

    static insertValueEntityFillers(componentId, fillers = {}, derivedDataSpec) {
        const componentValues = derivedDataSpec[componentId].values || {};
        for (const [valueId, value] of Object.entries(componentValues)) {
            this.getValueHandler(value.type).insertValueEntityFillers(value, fillers[valueId]);
        }
    }

    static deriveRepeaters(componentId, repeaters, derivedDataSpec) {
        const derivedComponentDataSpec = derivedDataSpec[componentId];
        const {entity = {}} = derivedComponentDataSpec;

        const componentValues = derivedComponentDataSpec.values || {};
        for (const [valueId, value] of Object.entries(componentValues)) {
            this.getValueHandler(value.type).deriveRepeaters(valueId, value, repeaters, entity);
        }
    }

    static resetRepeated(componentId, cleanedDataSpec) {
        const componentValues = cleanedDataSpec[componentId].values || {};
        for (const value of Object.values(componentValues)) {
            this.getValueHandler(value.type).resetRepeated(value);
        }
    }

    static getFillers(componentId, dataSpecFillers, cleanedDataSpec) {
        ValuesHandler._getAndExtractFillers(componentId, dataSpecFillers, cleanedDataSpec, false);
    }

    static extractFillers(componentId, dataSpecFillers, cleanedDataSpec) {
        ValuesHandler._getAndExtractFillers(componentId, dataSpecFillers, cleanedDataSpec, true);
    }

    static _getAndExtractFillers(componentId, dataSpecFillers, cleanedDataSpec, extract) {
        // Clean up and extract the uids filled in at the component values level
        const componentValues = cleanedDataSpec[componentId].values || {};

        for (const [valueId, value] of Object.entries(componentValues)) {
            // Extract the uids to the fillers
            const fillers = this.getValueHandler(value.type).getFillers(value);

            if (is_set(fillers, true)) {
                if (extract) {
                    this.getValueHandler(value.type).resetFillers(value);
                }

                dataSpecFillers[componentId] = dataSpecFillers[componentId] || {};
                dataSpecFillers[componentId].values = dataSpecFillers[componentId].values || {};
                dataSpecFillers[componentId].values[valueId] = fillers;
            }
        }
    }

    static extractRepeaterRoots(componentId, dataSpec) {
        const componentDataSpec = dataSpec[componentId];
        if (!is_set(componentDataSpec)) {
            return {};
        }

        const rootsByValue = object_from_array(
            Object.entries(componentDataSpec.values || {}),
            ([valueId, value]) => {
                const ValueHandler = this.getValueHandler(value.type);
                return [valueId, ValueHandler.extractRepeaterRoots(value)];
            },
        );

        const rootComponents = {};

        for (const [valueId, rootEntities] of Object.entries(rootsByValue)) {
            for (const [entityId, {type, target_type}] of Object.entries(rootEntities)) {
                rootComponents[entityId] = {
                    type,
                    targets: {
                        ...(rootComponents[entityId] || {}).targets,
                        [valueId]: {
                            target_type,
                        },
                    },
                };
            }
        }

        return rootComponents;
    }

    /**
     * Gets the entries in the value map which corresponds to the values which the
     * given component has defined that it needs in the data specification. The
     * result is an object containing value keys and one value map entry
     * per key.
     *
     * @param {String} componentId The id of the component to get the appropriate
     * value map entry for.
     * @param {Object} dataSpec The data specification of the dashboard where the
     * component is in.
     *
     * @memberOf module:spec-engine
     */
    static getValueMapEntriesForValues(componentDataSpec, valueMap) {
        if (!componentDataSpec) {
            return {};
        }

        let {values: componentValues = {}, entity: componentEntity} = componentDataSpec;

        let result = {};
        // Go through all the values in the component and extract the entries from
        // the value map that corresponds with each value.
        for (const [valueId, value] of Object.entries(componentValues)) {
            const ValueHandler = this.getValueHandler(value.type);
            const valueMapEntry = ValueHandler.getValueMapEntriesForValue(
                value,
                componentEntity,
                valueMap,
                valueId,
            );

            result = {...result, ...valueMapEntry};
        }

        return result;
    }

    static componentValues(componentDataSpec) {
        let {
            values: componentValues = {},
            params: componentParams = {},
            entity: componentEntity,
        } = componentDataSpec;

        let result = {};
        for (const [valueId, value] of Object.entries(componentValues)) {
            const ValueHandler = this.getValueHandler(value.type);
            const componentValues = ValueHandler.componentValues(value, componentEntity, valueId);

            // We inject some data from the component level specification into each value.
            for (const value of Object.values(componentValues)) {
                // If the value handler didn't specify a valueId itself, we inject the
                // component valueId.
                value.valueId = value.valueId || valueId;

                // Value level params override component level params = CORRECT!
                value.params = {...componentParams, ...value.params};
            }

            result = {...result, ...componentValues};
        }

        return result;
    }

    static valueEntities(componentValues) {
        let entities = [];

        for (const value of Object.values(componentValues || {})) {
            entities = entities.concat(this.getValueHandler(value.type).valueEntities(value) || []);
        }

        return entities;
    }
}

export default ValuesHandler;
