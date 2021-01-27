import {is_set, deepGet} from 'src/libs/Utils';
import {getValueMapEntries} from 'libs/spec-engine/value-map';
import {getValueParameters} from 'libs/spec-engine/params';

import ValuesHandler from 'libs/spec-engine/values-handler';

export default class ValueProvider {
    /**
     *
     *
     * @param {object} uniqueComponentValue An object representing unique values from
     * the spec.
     * @param {object} valueMapEntries The value map entries for the unique values.
     * @param {object} entityData The entity data for the entity defined by the
     * unique value.
     */
    constructor(uniqueComponentValues, valueMapEntries, entityData, dataSpec) {
        this._dataSpec = dataSpec;
        this._setupValueData(uniqueComponentValues, valueMapEntries, entityData);
    }

    _setupValueData(uniqueComponentValues, valueMapEntries, entityData) {
        this._data = {};
        this._dataByValueId = {};

        for (const [
            valueHash,
            {entity, params: uniqueValueParams = {}, valueId, valueKey},
        ] of Object.entries(uniqueComponentValues)) {
            const valueMapEntry = valueMapEntries[valueHash];
            const entityUid = entity.uid;
            if (!is_set(valueMapEntry, true)) {
                continue;
            }
            const {statePath = [valueKey]} = valueMapEntry;

            const additionalData = deepGet(entityData, [valueId, entityUid]);
            const value = deepGet(entityData, [valueId, entityUid, ...statePath]);
            const isGrouped = is_set(uniqueValueParams.group_by) && Object.isObject(value || {});
            const formatArgs = this._fillFormatArguments(
                valueId,
                entityUid,
                valueMapEntry,
                entityData,
            );

            // This data does not depend on the value hash nor the group id. So we keep a
            // structure of data that we would like to access given only our value id.
            this._dataByValueId[valueId] = {
                id: valueId,
                format: valueMapEntry.format,
                formatArgs,
                params: valueMapEntry.params,
                valueLabel: valueMapEntry.label,
                isGrouped,
                valueKey,
                entity,
            };

            const entityName = deepGet(entityData, [valueId, entityUid, 'entity_name']);

            if (isGrouped) {
                const dataPerGroup = value || {};
                for (const [groupId, value] of Object.entries(dataPerGroup)) {
                    if (!is_set(value.groupLabel)) {
                        continue;
                    }
                    // TODO(Simon, 3 Jan 2020): Make this dict nested by valueId->groupId instead.
                    // that way we avoid valueHash, which is no longer required when we don't use
                    // repeating.
                    this._data[groupId] = this._data[groupId] || {};
                    this._data[groupId][valueHash] = {
                        id: valueId,
                        format: valueMapEntry.format,
                        formatArgs,
                        groupLabel: value.groupLabel,
                        params: valueMapEntry.params,
                        value: value.value,
                        additionalData,
                        valueLabel: valueMapEntry.label,
                        isGrouped: true,
                        valueKey,
                        entity,
                        entityName,
                    };
                }
            } else {
                // TODO(Simon, 3 Jan 2020): Migrate away the nested dict structure here. We
                // can do just fine with only `valueId` as the key. No need for valueHash when data
                // is not grouped anymore.
                this._data[valueKey] = this._data[valueKey] || {};
                this._data[valueKey][valueHash] = {
                    id: valueId,
                    format: valueMapEntry.format,
                    formatArgs,
                    params: valueMapEntry.params,
                    value,
                    additionalData,
                    valueLabel: valueMapEntry.label,
                    isGrouped: false,
                    valueKey,
                    entity,
                    entityName,
                };
            }
        }
    }

    _fillFormatArguments(valueId, entityUid, valueMapEntry, entityData) {
        if (!valueMapEntry.formatArgs) {
            return {};
        }

        const filledFormatArgs = {};
        for (const arg of valueMapEntry.formatArgs) {
            const entry = deepGet(entityData, [valueId, entityUid, arg]);
            // Add the format arg if it exists
            if (is_set(entry)) {
                filledFormatArgs[arg] = entry;
            }
        }
        return filledFormatArgs;
    }

    valuesByGroup(valueHash) {
        const groups = {};

        for (const [groupId, valueHashToValue] of Object.entries(this._data)) {
            for (const [_valueHash, value] of Object.entries(valueHashToValue)) {
                if ((valueHash && valueHash !== _valueHash) || !value.isGrouped) {
                    continue;
                }

                groups[groupId] = value;
            }
        }

        return groups;
    }

    isDataGrouped(valueHash) {
        for (const [_groupId, valueHashToValue] of Object.entries(Object.values(this._data))) {
            for (const [_valueHash, value] of Object.entries(valueHashToValue)) {
                if (valueHash === _valueHash && value.isGrouped) {
                    return true;
                }
            }
        }

        return false;
    }

    data(key, valueHash) {
        return deepGet(this._data, [key, valueHash]);
    }

    keys() {
        return Object.keys(this._data);
    }

    valueIds() {
        return Object.keys(this._dataByValueId);
    }

    values(key) {
        if (key) {
            return this.valueHashes(key).map(valueHash => this.data(key, valueHash));
        }

        return this.keys()
            .map(key => this.values(key))
            .flatten();
    }

    valueHashes(key) {
        return Object.keys(this._data[key] || {}).filter(key => !key.startsWith('_b'));
    }

    /**
     * Fetches the underlying data of a value.
     *
     * @param {String} key The value key or the group id of the value to fetch data for.
     * @param {String} valueHash The hash of the value entry to fetch data for.
     */
    value(key, valueHash) {
        return deepGet(this._data, [key, valueHash, 'value']);
    }

    /**
     * Fetches the group label of a specific group in a grouped value.
     *
     * NOTE: This value is only defined if the value that you are searching for comes from
     * a dataspec value (valueId) that has been grouped.
     *
     * @param {String} groupId The group id of the value to fetch the group label for.
     * @param {String} valueHash The hash of the value hentry to fetch the group label for.
     */
    groupLabel(groupId, valueHash) {
        return deepGet(this._data, [groupId, valueHash, 'groupLabel']);
    }

    /**
     * Fetches the format of a value as a string. This can be used to generate a formatter
     * function using `genFormatter`.
     *
     * @param {String} valueId The id of the value to fetch the format for.
     */
    valueFormat(valueId) {
        return deepGet(this._dataByValueId, [valueId, 'format']);
    }

    /**
     * Fetches the arguments to provide the value formatter with for a value as an object.
     * This can be passed as an option to `genFormatter` to make some formatters more specific.
     *
     * @param {String} valueId The id of the value to fetch the format for.
     */
    valueFormatArgs(valueId) {
        return deepGet(this._dataByValueId, [valueId, 'formatArgs']);
    }

    /**
     * Fetches the label of a value.
     *
     * @param {String} valueId The id of the value to fetch the format for.
     */
    valueLabel(valueId) {
        return deepGet(this._dataByValueId, [valueId, 'valueLabel']);
    }

    /**
     * Gets a unique value hash for a specific value in the data spec. To get this unique
     * value hash, this function assumes that we only have one entity in the `entities`
     * array for the value in question.
     *
     * NOTE: This does not work with components that have had support for multiple entity
     * selection, nor support for repeating over entities.
     *
     * @param {String} valueId The value id to get the unique value hash for.
     */
    uniqueValueHash(valueId) {
        const valueEntry = this.valueEntry(valueId);
        if (!valueEntry) {
            return null;
        }

        const entity = is_set(valueEntry.entities, true)
            ? valueEntry.entities[0]
            : this._dataSpec.entity;

        if (!is_set(entity, true) || !is_set(valueEntry.key, true)) {
            return null;
        }

        if (!valueEntry.type) {
            return null;
        }

        const ValueHandler = ValuesHandler.getValueHandler(valueEntry.type);
        return ValueHandler.uniqueValueHash(entity.uid, valueEntry.key, valueId, valueEntry.params);
    }

    valueEntry(valueId) {
        if (!this._dataSpec.values) {
            return undefined;
        }

        return this._dataSpec.values[valueId];
    }
}

export class ValueSettingsProvider {
    /**
     *
     *
     * @param {object} dataSpec The data spec of the component we want the settings values for.
     * @param {object} valueMap The value map entries for the data spec values.
     * @param {object} entityData The entity data for the entities defined by the data spec.
     */
    constructor(dataSpec = {}, valueMap, globalParams) {
        const _data = {};

        // TODO: Remove all references to rootEntities when tables use breakdown by vehicles instead
        // of repeating
        const {entity, values = {}} = dataSpec;
        for (const [valueId, value] of Object.entries(values)) {
            const {
                entities = [],
                rootEntities = [],
                values: innerValues = {},
                key: valueKey,
                params: dataSpecParams = {},
            } = value;
            if (is_set(innerValues, true)) {
                for (const [innerValueId, innerValue] of Object.entries(innerValues)) {
                    _data[`${valueId}${innerValueId}`] = this._handleValue(
                        innerValueId,
                        innerValue.key,
                        {...dataSpecParams, ...innerValue.params},
                        entity ? [...entities, entity] : [...entities],
                        rootEntities,
                        valueMap,
                        globalParams,
                    );
                }
            }

            _data[valueId] = this._handleValue(
                valueId,
                valueKey,
                dataSpecParams,
                entity ? [...entities, entity] : [...entities],
                rootEntities,
                valueMap,
                globalParams,
            );
        }

        this._data = _data;
        this._dataSpec = dataSpec;
        this._valueMap = valueMap;
    }

    _handleValue = (valueId, valueKey, params, entities, rootEntities, valueMap, globalParams) => {
        // NOTE: Next line assumes all entities are of same type.
        const firstEntity = rootEntities[0] || entities[0];

        // If there is no valueKey set we don't need to fetch valueMapEntry since it is never going to exist
        // also fetching valueMapEntry when no valueKey is specified is heavy.
        const valueMapEntry = !is_set(valueKey, true)
            ? {}
            : getValueMapEntries(valueMap, firstEntity, {
                  value: {
                      key: valueKey,
                      isGrouped: !!params.group_by,
                      isOverTime: !!params.over_time,
                  },
              });
        // If there is no valueKey we don't need to fetch params. Also fetching params for an undefined value
        // is very heavy at the moment.
        const valueParams = is_set(valueKey, true)
            ? getValueParameters(firstEntity, valueKey, valueMap, params, globalParams)
            : {};
        const data = {
            id: valueId,
            entities,
            params: valueParams,
            valueLabel: (valueMapEntry && valueMapEntry.label) || '',
            valueKey,
            isGrouped: !!params.group_by,
            format: valueMapEntry.format,
        };

        if (rootEntities) {
            data.rootEntities = rootEntities;
        }

        return data;
    };

    valueOptions = (valueId, entity, overTime, grouped, filtered) => {
        const valueParams = (valueId && this.params(valueId)) || {};
        const valueMapEntries = getValueMapEntries(this._valueMap, entity, {
            overTime,
            grouped,
            filtered,
            value: {
                key: undefined,
                isGrouped: is_set(valueParams.group_by) && valueParams.group_by.value,
                isOverTime: is_set(valueParams.over_time) && valueParams.over_time.value,
            },
        });
        return Object.entries(valueMapEntries).map(([valueKey, valueEntry]) => ({
            label: valueEntry.label,
            value: valueKey,
            key: valueKey,
        }));
    };

    /**
     * Fetches the format of a value as a string. This can be used to generate a formatter
     * function using `genFormatter`.
     *
     * @param {String} valueId The id of the value to fetch the format for.
     */
    valueFormat(valueId) {
        return deepGet(this._data, [valueId, 'format']);
    }

    isValueGrouped = valueId => this._data[valueId].isGrouped;
    data = valueId => this._data[valueId];
    keys = () => Object.keys(this._data);
    values = () => Object.values(this._data);
    valueHashes = key => Object.keys(this._data[key] || {});

    params = (valueId, blacklistKeys) => {
        let params = deepGet(this._data, [valueId, 'params']);
        if (!is_set(blacklistKeys, true)) {
            return params;
        }

        const blacklistKeysSet = new Set(blacklistKeys);
        return Object.filter(params, (_, key) => !blacklistKeysSet.has(key));
    };
    valueLabel = valueId => deepGet(this._data, [valueId, 'valueLabel']);
    entities = valueId => {
        if (valueId) {
            const {entities: valueEntities = []} = this.data(valueId) || {};
            return [...valueEntities];
        }

        return this._dataSpec.entity ? [this._dataSpec.entity] : [];
    };

    rawParamValues = () => {
        return this._dataSpec.params || {};
    };

    rawParamValuesForValueId = valueId =>
        (this._dataSpec &&
            this._dataSpec.values &&
            this._dataSpec.values[valueId] &&
            this._dataSpec.values[valueId].params) ||
        {};
}
