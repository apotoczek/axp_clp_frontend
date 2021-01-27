import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';
import uuid from 'uuid/v4';

import {ensureCorrectOrder, reorderValue} from './shared';

export default class BarChartSpecHandler extends BaseSpecHandler {
    static changeDisabledOption(payload, componentId, componentData, dataSpec) {
        const {optionName, payload: disabled} = payload;
        return this.changeSettings(
            {[`${optionName}Disabled`]: disabled},
            componentId,
            componentData,
            dataSpec,
        );
    }

    static addValue(payload, componentId, componentData, dataSpec) {
        const {valueId = uuid()} = payload;
        const values = dataSpec[componentId].values || {};

        values[valueId] = {type: 'base'};
        dataSpec[componentId].values = values;

        const valueSettings = componentData[componentId].valueSettings || {};
        valueSettings[valueId] = {
            order: Object.keys(dataSpec[componentId].values).length - 1,
        };
        componentData[componentId].valueSettings = valueSettings;

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: [componentId]},
        ];
    }

    static removeValue(payload, componentId, componentData, dataSpec) {
        const [
            {componentData: updatedComponentData},
            {dataSpec: updatedDataSpec},
        ] = BaseSpecHandler.removeValue(payload, componentId, componentData, dataSpec);

        ensureCorrectOrder(updatedComponentData[componentId].valueSettings);

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec: updatedDataSpec, updatedComponents: [componentId]},
        ];
    }

    static duplicateValue(payload, componentId, componentData, dataSpec) {
        const {valueId} = payload;
        const newValueId = uuid();

        const [
            {componentData: updatedComponentData},
            {dataSpec: updatedDataSpec},
        ] = BaseSpecHandler.duplicateValue(
            {valueId, newValueId},
            componentId,
            componentData,
            dataSpec,
        );

        updatedComponentData[componentId].valueSettings[newValueId].order =
            Object.keys(updatedDataSpec[componentId].values).length - 1;
        ensureCorrectOrder(updatedComponentData[componentId].valueSettings);

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec: updatedDataSpec, updatedComponents: [componentId]},
        ];
    }

    static changeAxisLabelSetting(payload, componentId, componentData, dataSpec) {
        const {
            axisName,
            payload: {key, value},
        } = payload;
        const labelKey = `${axisName}Label`;
        const componentSettings = componentData[componentId].settings;
        return this.changeSettings(
            {[labelKey]: {...componentSettings[labelKey], [key]: value}},
            componentId,
            componentData,
            dataSpec,
        );
    }

    static changeAxisCustomDataInterval(payload, componentId, componentData, dataSpec) {
        const {axisName, payload: intervals} = payload;
        const labelKey = `${axisName}Label`;
        const componentSettings = componentData[componentId].settings;
        const oldIntervals = (componentSettings[labelKey] || {}).customDataInterval;

        return this.changeSettings(
            {
                [labelKey]: {
                    ...componentSettings[labelKey],
                    customDataInterval: {...oldIntervals, ...intervals},
                },
            },
            componentId,
            componentData,
            dataSpec,
        );
    }

    static changeValueOrder(payload, componentId, componentData, dataSpec) {
        const {valueId, payload: newOrder} = payload;
        reorderValue(valueId, newOrder, componentData[componentId].valueSettings);

        return [
            {componentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
        ];
    }

    static changeLegendSetting(payload, componentId, componentData, dataSpec) {
        const {
            payload: {key, value},
        } = payload;
        const componentSettings = componentData[componentId].settings;
        return this.changeSettings(
            {legend: {...componentSettings.legend, [key]: value}},
            componentId,
            componentData,
            dataSpec,
        );
    }
}
