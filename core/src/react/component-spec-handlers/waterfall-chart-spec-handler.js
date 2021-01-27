import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';
import uuid from 'uuid/v4';

export default class WaterfallChartSpecHandler extends BaseSpecHandler {
    static _addValue(payload, componentId, componentData, dataSpec) {
        const valueId = payload.valueId || uuid();

        const newValues = dataSpec[componentId].values || {};
        newValues[valueId] = {
            type: 'base',
            valueNegation: false,
        };

        dataSpec[componentId].values = newValues;

        return [
            {
                componentData,
                updatedComponents: [componentId],
            },
            {
                dataSpec: dataSpec,
                updatedComponents: [componentId],
            },
        ];
    }

    static _removeValue(payload, componentId, componentData, dataSpec) {
        const {valueId} = payload;

        delete dataSpec[componentId].values[valueId];

        return [
            {componentData, updatedComponents: []},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static _negateValue(payload, componentId, componentData, dataSpec) {
        const {valueId, negate} = payload;
        const values = componentData[componentId].values || {};
        values[valueId] = {...values[valueId], valueNegation: negate};
        componentData[componentId].values = values;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static _xLabel(payload, componentId, componentData, dataSpec) {
        const {valueId, label} = payload;
        const values = componentData[componentId].values || {};
        values[valueId] = {...values[valueId], label};
        componentData[componentId].values = values;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }
}
