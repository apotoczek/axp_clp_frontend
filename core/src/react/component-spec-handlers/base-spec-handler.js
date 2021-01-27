import uuid from 'uuid/v4';

import {is_set} from 'src/libs/Utils';
import {getValueMapEntries} from 'libs/spec-engine/value-map';
import {ParamType, EntityType} from 'src/libs/Enums';

export default class BaseSpecHandler {
    static updateSpecs(componentId, action, payload, componentData, dataSpec, valueMap) {
        const newArgs = [payload, componentId, {...componentData}, {...dataSpec}, {...valueMap}];

        if (typeof action === 'function') {
            return action.bind(this)(...newArgs);
        }

        let mappingFn = this[`_${action}`] || this[action];
        if (typeof mappingFn === 'function') {
            mappingFn = mappingFn.bind(this);
            return mappingFn(...newArgs);
        }

        return this._noOp(...newArgs);
    }

    static _noOp(payload, componentId, componentData, dataSpec) {
        return [
            {componentData, updatedComponents: []},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _changeContainerStyle(payload, componentId, componentData, dataSpec) {
        componentData[componentId].containerStyle = {
            ...componentData[componentId].containerStyle,
            ...payload,
        };

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static removeValue(payload, componentId, componentData, dataSpec) {
        const {valueId} = payload;

        delete dataSpec[componentId].values[valueId];
        dataSpec = {
            ...dataSpec,
            [componentId]: {
                ...dataSpec[componentId],
                values: {
                    ...dataSpec[componentId].values,
                },
            },
        };

        delete componentData[componentId].valueSettings[valueId];
        componentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                valueSettings: {
                    ...componentData[componentId].valueSettings,
                },
            },
        };

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static duplicateValue(payload, componentId, componentData, dataSpec) {
        const {valueId, newValueId = uuid()} = payload;

        dataSpec = {
            ...dataSpec,
            [componentId]: {
                ...dataSpec[componentId],
                values: {
                    ...dataSpec[componentId].values,
                    [newValueId]: {...dataSpec[componentId].values[valueId]},
                },
            },
        };

        componentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                valueSettings: {
                    ...componentData[componentId].valueSettings,
                    [newValueId]: {...componentData[componentId].valueSettings[valueId]},
                },
            },
        };

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static changeSettings(payload, componentId, componentData, dataSpec) {
        componentData[componentId].settings = {
            ...componentData[componentId].settings,
            ...payload,
        };

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static changeValueSettings(payload, componentId, componentData, dataSpec) {
        const valueSettings = componentData[componentId].valueSettings || {};
        const {valueId, ...settings} = payload;

        valueSettings[valueId] = {...valueSettings[valueId], ...settings};
        componentData[componentId].valueSettings = valueSettings;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static changeValueParameter(payload, componentId, componentData, dataSpec) {
        const {
            valueId,
            payload: {key, value},
        } = payload;

        if (key === 'filters') {
            // Filters are handled different so we have a special case for that
            // value is actually an object of {filterKey, value}
            return this._changeFilterSelection(
                {...value, valueId},
                componentId,
                componentData,
                dataSpec,
            );
        }
        return this._changeParameter({valueId, key, value}, componentId, componentData, dataSpec);
    }

    static changeValueEntity(payload, componentId, componentData, dataSpec) {
        const {valueId, payload: entity} = payload;
        return this.changeEntity({valueId, entity}, componentId, componentData, dataSpec);
    }

    static _changeRepeater(payload, componentId, componentData, dataSpec) {
        dataSpec[componentId].repeatFor = payload;

        return [
            {componentData, updatedComponents: []},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static changeEntity(payload, componentId, componentData, dataSpec) {
        const {entity, valueId} = payload;

        let entityObj = entity && {
            uid: entity.entity_uid,
            type: entity.entity_type.camelize(false),
            cashflowType: entity.cashflow_type,
        };

        if (valueId) {
            const value = dataSpec[componentId].values[valueId];
            // TODO Write helpers in component-utils to change this for
            // repeated components as well.
            if (entityObj) {
                value.entities = [entityObj];
                if (entityObj.type == 'deal' && is_set(value.params, true)) {
                    delete value.params.group_by;
                }
            } else {
                delete value.entities;
            }

            return [
                {componentData, updatedComponents: [componentId]},
                {dataSpec, updatedComponents: [componentId]},
            ];
        }

        dataSpec[componentId].entity = entityObj;
        if (entityObj.type == 'deal') {
            if (is_set(dataSpec[componentId].params)) {
                delete dataSpec[componentId].params.group_by;
            }

            for (const value of Object.values(dataSpec[componentId].values)) {
                if (value.entities) {
                    continue;
                }

                if (value && value.params) {
                    delete value.params.group_by;
                }
            }
        }

        return [
            {componentData, updatedComponents: []},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static _changeFilterSelection(payload, componentId, componentData, dataSpec) {
        const {valueId, filterKey, value} = payload;

        const componentValues = dataSpec[componentId].values || {};
        const filterEntry = componentValues[valueId]?.params?.filters?.[filterKey] ?? {};
        const selected = filterEntry.selected ?? [];

        const exists = selected.indexOf(value);
        if (exists != -1) {
            selected.splice(exists, 1);
        } else {
            selected.push(value);
        }
        const updatedValueFilters = {
            ...componentValues[valueId]?.params?.filters,
            [filterKey]: {
                ...filterEntry,
                selected,
            },
        };

        if (!is_set(selected, true)) {
            delete updatedValueFilters[filterKey];
        }

        componentValues[valueId] = {
            ...componentValues[valueId],
            params: {
                ...componentValues[valueId]?.params,
                filters: updatedValueFilters,
            },
        };

        dataSpec[componentId].values = componentValues;

        return [
            {componentData, updatedComponents: []},
            {dataSpec: dataSpec, updatedComponents: [componentId]},
        ];
    }

    static _changeParameter(payload, componentId, componentData, dataSpec) {
        const {valueId, key, value} = payload;

        if (valueId) {
            dataSpec[componentId].values = dataSpec[componentId].values || {};
            dataSpec[componentId].values[valueId] = dataSpec[componentId].values[valueId] || {};
            dataSpec[componentId].values = {
                ...dataSpec[componentId].values,
                [valueId]: {
                    ...(dataSpec[componentId].values[valueId] || {}),
                    params: {
                        ...((dataSpec[componentId].values[valueId] || {}).params || {}),
                        [key]: value,
                    },
                },
            };
        } else {
            dataSpec = {
                ...dataSpec,
                [componentId]: {
                    ...dataSpec[componentId],
                    params: {
                        ...dataSpec[componentId].params,
                        [key]: value,
                    },
                },
            };
        }

        return [
            {componentData, updatedComponents: []},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static changeValue(payload, componentId, componentData, dataSpec, valueMap) {
        const {valueId = uuid(), key, blacklistParamKeys = []} = payload;
        const values = dataSpec[componentId].values || {};
        const rootEntity = dataSpec[componentId].entity;
        const value = values[valueId] || {};
        const entity = is_set(value.entities, true) ? value.entities[0] : rootEntity;

        if (!is_set(entity, true)) {
            return [
                {componentData, updatedComponents: []},
                {dataSpec, updatedComponents: []},
            ];
        }

        const valueMapEntry = getValueMapEntries(valueMap, entity, {value: {key}});

        let newDataSpec = {...dataSpec};

        // If there are any previous params, we clear them all out
        if (
            newDataSpec[componentId] &&
            newDataSpec[componentId].values &&
            newDataSpec[componentId].values[valueId] &&
            newDataSpec[componentId].values[valueId].params
        ) {
            delete newDataSpec[componentId].values[valueId].params;
        }

        // Set all default parameters
        for (const [paramKey, param] of Object.entries(valueMapEntry.params || {})) {
            if (!is_set(param.defaultOption) || blacklistParamKeys.indexOf(paramKey) > -1) {
                continue;
            }

            let defaultValue = param.defaultOption;
            if (param.type === ParamType.SINGLE_SELECTION) {
                defaultValue = defaultValue.toString();
            }

            const [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler._changeParameter(
                {valueId, key: paramKey, value: defaultValue},
                componentId,
                componentData,
                newDataSpec,
            );
            newDataSpec = {...updatedDataSpec};
        }

        const valueMapEntryEntities = valueMapEntry.entities || [
            EntityType.Portfolio,
            EntityType.UserFund,
            EntityType.Deal,
        ];

        if (
            valueMapEntryEntities.findIndex(entity.type) < 0 &&
            blacklistParamKeys.indexOf('group_by') === -1
        ) {
            const [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler._changeParameter(
                {valueId, key: 'group_by', value: 'deal'},
                componentId,
                componentData,
                newDataSpec,
            );
            newDataSpec = {...updatedDataSpec};
        }

        newDataSpec[componentId].values = {
            ...newDataSpec[componentId].values,
            [valueId]: {
                ...(newDataSpec[componentId].values || {})[valueId],
                key,
            },
        };

        return [
            {componentData, updatedComponents: []},
            {dataSpec: newDataSpec, updatedComponents: [componentId]},
        ];
    }
}
