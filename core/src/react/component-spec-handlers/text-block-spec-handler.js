import uuid from 'uuid/v4';

import {FrontendDataType} from 'src/libs/Enums';
import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';

export default class TextBlockSpecHandler extends BaseSpecHandler {
    static _createVariable(payload, componentId, componentData, dataSpec, valueMap) {
        const {name, entity, valueKey, params, valueId: currentValueId} = payload;

        const valueId = currentValueId || uuid();
        const dataSpecValues = dataSpec[componentId].values || {};
        const componentDataEntry = componentData[componentId] || {};
        const variables = componentDataEntry.variables || {};

        variables[valueId] = {name};
        componentDataEntry.variables = variables;

        dataSpecValues[valueId] = {
            entities: [entity],
            type: 'base',
        };
        dataSpec[componentId].values = dataSpecValues;
        let [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler.changeValue(
            {
                valueId,
                key: valueKey,
            },
            componentId,
            componentData,
            {...dataSpec},
            valueMap,
        );

        for (const [key, value] of Object.entries(params)) {
            [_, {dataSpec: updatedDataSpec}] = BaseSpecHandler._changeParameter(
                {
                    valueId,
                    key,
                    value,
                },
                componentId,
                componentData,
                {...updatedDataSpec},
            );
        }

        componentData[componentId] = componentDataEntry;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec: updatedDataSpec, updatedComponents: [componentId]},
        ];
    }

    static _createDateVariable = (payload, componentId, componentData, dataSpec) => {
        const {name, date, format, valueId: currentValueId} = payload;

        const valueId = currentValueId || uuid();
        const componentDataEntry = componentData[componentId] || {};
        const variables = componentDataEntry.variables || {};

        variables[valueId] = {
            name,
            type: FrontendDataType.DateValue,
        };

        componentDataEntry.variables = variables;

        const staticData = componentDataEntry.staticData || {};

        staticData[valueId] = {
            type: FrontendDataType.DateValue,
            format: format,
            date: date,
        };

        componentDataEntry.staticData = staticData;
        componentData[componentId] = componentDataEntry;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    };

    static _deleteVariables = (payload, componentId, componentData, dataSpec) => {
        const {valueIds} = payload;
        const componentDataEntry = componentData[componentId];
        let updateDataSpec = false;

        for (const valueId of valueIds) {
            const variablesEntry = componentDataEntry.variables[valueId];

            if (variablesEntry.type === FrontendDataType.DateValue) {
                // Date Values are stored in static data so remove that
                delete componentDataEntry.staticData[valueId];
            } else {
                // It is a regular data value, remove accordingly
                delete dataSpec[componentId].values[valueId];
                updateDataSpec = true;
            }
            // Delete the variable name mapping
            delete componentDataEntry.variables[valueId];
        }

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: updateDataSpec ? [componentId] : []},
        ];
    };

    static changeText(payload, componentId, componentData, dataSpec) {
        const {text} = payload;
        const updatedComponentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                settings: {
                    ...componentData[componentId].settings,
                    text,
                },
            },
        };

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }
}
