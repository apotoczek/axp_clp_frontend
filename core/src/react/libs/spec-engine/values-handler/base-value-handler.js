import {is_set, serialize, hashed} from 'src/libs/Utils';
import {singularizeEntityType} from 'src/libs/Mapping';

import ValueHandler from 'libs/spec-engine/values-handler/value-handler';
import {getValueMapEntries} from 'libs/spec-engine/value-map';

export default class BaseValueHandler extends ValueHandler {
    static valueEntities(value, componentEntity) {
        if (value && is_set(value.entities, true)) {
            return value.entities;
        } else if (is_set(componentEntity, true)) {
            return [componentEntity];
        }

        return [];
    }

    static insertValueEntityFillers(value, entityIds = []) {
        // Reset the entity ids so that we can start from scratch
        BaseValueHandler.resetFillers(value);

        value.entities = value.entities.map((entity, idx) => {
            entity.uid = entityIds[idx];
            return entity;
        });

        // Delete any entities from the value that no longer have any valid
        // uid after filling in all the new ones.
        value.entities = value.entities.filter(({uid}) => is_set(uid));
    }

    static resetFillers(value) {
        value.entities = value.entities || [];
        value.entities = value.entities.map(entity => {
            delete entity.uid;
            return entity;
        });
    }

    static deriveRepeaters(valueId, value, repeaters, entity) {
        const filteredRepeaters = repeaters[entity.uid];
        const repeatFor = value.repeatFor;
        // If this value is not being repeated over some entity, we don't have
        // anything else to do here, so skip over it.
        if (!is_set(repeatFor)) {
            return;
        }

        // If there are no repeaters for this value, we remove any previously
        // defined entities and just skip to the next value.
        if (!is_set(filteredRepeaters, true) || !(valueId in filteredRepeaters)) {
            delete value.entities;
            return;
        }

        const valueRepeaters = filteredRepeaters[valueId];
        value.entities = valueRepeaters.map(uid => ({
            uid,
            type: singularizeEntityType(repeatFor),
            repeatFrom: entity,
        }));
    }

    static resetRepeated(value) {
        // If this value was not repeated over any entity, we don't have
        // anything to clean up.
        if (!is_set(value.repeatFor)) {
            return;
        }

        // Just remove the list of entities to clean this up.
        delete value.entities;
    }

    static getFillers(value) {
        if (!is_set(value.entities)) {
            return [];
        }

        return value.entities.map(({uid}) => uid);
    }

    static extractRepeaterRoots(_componentId, _dataSpec) {
        // We can't repeat the base value inside of a component. So we have no
        // repeat root.
        return {};
    }

    static getValueMapEntriesForValue(value, componentEntity, valueMap, valueId) {
        const entities = this.valueEntities(value, componentEntity);

        if (!value.key || !is_set(entities, true)) {
            return {};
        }
        const result = {};
        for (const entity of entities) {
            const valueMapEntry = getValueMapEntries(valueMap, entity, {
                value: {
                    key: value.key,
                    isGrouped: is_set(value.params && value.params.group_by),
                    isOverTime: is_set(value.params && value.params.over_time),
                },
            });

            if (!is_set(valueMapEntry, true)) {
                continue;
            }

            const valueHash = this.uniqueValueHash(entity.uid, value.key, valueId, value.params);
            result[valueHash] = valueMapEntry;
        }

        return result;
    }

    static componentValues(value, componentEntity, valueId) {
        const entities = this.valueEntities(value, componentEntity);

        if (!is_set(entities, true)) {
            return {};
        }

        const result = {};
        for (const entity of entities) {
            if (!entity.uid) {
                continue;
            }
            const uniqueValueHash = this.uniqueValueHash(
                entity.uid,
                value.key,
                valueId,
                value.params,
            );
            result[uniqueValueHash] = {
                entity,
                params: value.params,
                valueId,
                valueKey: value.key,
            };
        }
        return result;
    }

    static uniqueValueHash(entityId, valueKey, valueId, params) {
        return hashed(`${entityId}:${valueKey}:${valueId}(${serialize(params)})`);
    }
}
