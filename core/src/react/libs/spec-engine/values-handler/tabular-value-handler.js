import {is_set, serialize} from 'src/libs/Utils';
import {singularizeEntityType} from 'src/libs/Mapping';

import BaseValueHandler from 'libs/spec-engine/values-handler/base-value-handler';
import {getValueMapEntries, ValueMapFilter} from 'libs/spec-engine/value-map';

export default class TabularValueHandler extends BaseValueHandler {
    static insertValueEntityFillers(value, entityIds = {}) {
        value.entities = value.entities.map((entity, idx) => {
            entity.uid = entityIds.entities && entityIds.entities[idx];
            return entity;
        });

        value.rootEntities = value.rootEntities.map((entity, idx) => {
            entity.uid = entityIds.rootEntities && entityIds.rootEntities[idx];
            return entity;
        });
    }

    static deriveRepeaters(valueId, value, repeaters, _entity) {
        for (const entity of Object.values(value.rootEntities)) {
            // TODO: FIX THIS FOR NON REPEATING ELEMENTS!!!
            const repeatingUids = (repeaters[entity.uid] && repeaters[entity.uid][valueId]) || [];
            if (!entity.repeatFor || !is_set(repeatingUids, true)) {
                continue;
            }

            const newEntities = repeatingUids.map(uid => ({
                uid,
                cashflowType: entity.cashflowType,
                type: singularizeEntityType(entity.repeatFor),
                repeatFrom: entity,
            }));
            value.entities = newEntities;
        }
    }

    static resetRepeated(dataSpec) {
        const entities = dataSpec.entities;
        const filteredEntities = entities.filter(e => e.repeatFrom === undefined);
        dataSpec.entities = filteredEntities;
    }

    static getFillers(value) {
        return {
            rootEntities: value.rootEntities.map(({uid}) => uid),
            entities: value.entities.filter(e => e.repeatFrom === undefined).map(({uid}) => uid),
        };
    }

    static extractRepeaterRoots(dataSpec) {
        const repeaterRoots = {};

        for (const entity of Object.values(dataSpec.rootEntities)) {
            if (!entity.repeatFor) {
                continue;
            }

            repeaterRoots[entity.uid] = {
                type: entity.type.underscore(),
                target_type: entity.repeatFor.underscore(),
            };
        }

        return repeaterRoots;
    }

    static resetFillers(value) {
        value.entities.map(entity => {
            delete entity.uid;
            return entity;
        });

        value.rootEntities.map(entity => {
            delete entity.uid;
            return entity;
        });
    }

    static getValueMapEntriesForValue(value, componentEntity, valueMap) {
        // Gather up the entities that define the rows.
        const entities = this.valueEntities(value, componentEntity);

        // If there are no entities, we can't fetch anything from the value-map.
        if (!is_set(entities, true)) {
            return {};
        }

        // Now for each "row"(entity) we go through each column and find where
        // we can fetch that information from the backend.
        const result = {};
        for (const [valueId, innerValue] of Object.entries(value.values || {})) {
            for (const entity of entities) {
                const params = {...value.params, ...innerValue.params};
                const valueMapEntry = getValueMapEntries(valueMap, entity, {
                    overTime: ValueMapFilter.False,
                    value: {
                        key: innerValue.key,
                        isGrouped: is_set(params.group_by),
                        isOverTime: is_set(params.over_time),
                    },
                });

                if (!is_set(valueMapEntry, true) || !is_set(valueMapEntry.endpoints, true)) {
                    continue;
                }

                const valueHash = this.uniqueValueHash(entity.uid, innerValue.key, valueId, params);
                result[valueHash] = valueMapEntry;
            }
        }

        return result;
    }

    static componentValues(value, componentEntity) {
        // Gather up the entities that define the rows.
        const entities = this.valueEntities(value, componentEntity);

        // If there are no entities, we can't fetch anything from the value-map.
        if (!is_set(entities, true)) {
            return {};
        }

        const result = {};
        for (const [valueId, innerValue] of Object.entries(value.values || {})) {
            const params = {...value.params, ...innerValue.params};
            for (const entity of entities) {
                if (!entity.uid) {
                    continue;
                }
                const valueHash = this.uniqueValueHash(entity.uid, innerValue.key, valueId, params);
                result[valueHash] = {valueId, valueKey: innerValue.key, params, entity};
            }
        }

        return result;
    }

    static uniqueValueHash = (entityId, valueKey, valueId, params) =>
        `${entityId}:${valueKey}:${valueId}(${serialize(params)})`;
}
