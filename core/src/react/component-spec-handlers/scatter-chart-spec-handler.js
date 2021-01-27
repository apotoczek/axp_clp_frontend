import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';
import uuid from 'uuid/v4';

import {is_set} from 'src/libs/Utils';

function initializeAxis(axisName, valueId, componentId, componentData, dataSpec) {
    // Value didn't exist. Setup initial component data structure.
    componentData = {
        ...componentData,
        [componentId]: {
            ...componentData[componentId],
            [`${axisName}ValueId`]: valueId,
        },
        valueSettings: {
            ...componentData[componentId].valueSettings,
        },
    };

    // Setup initial data spec structure.
    dataSpec[componentId].values = {
        ...dataSpec[componentId].values,
        [valueId]: {type: 'base'},
    };

    return {componentData, dataSpec};
}

export default class ScatterChartSpecHandler extends BaseSpecHandler {
    static changeValueKey(payload, componentId, componentData, dataSpec, valueMap) {
        const {
            valueId = uuid(),
            payload: {valueKey, axisName},
        } = payload;

        // Ensure that the axis has an associated dataspec and component data entry
        if (!is_set(componentData[componentId][`${axisName}ValueId`])) {
            ({dataSpec, componentData} = initializeAxis(
                axisName,
                valueId,
                componentId,
                componentData,
                dataSpec,
            ));
        }

        // Change the value, note that this resets all the parameters.
        let [
            {componentData: updatedComponentData1, updatedComponents: updatedComponentDataIds1},
            {dataSpec: updatedDataSpec1, updatedComponents: updatedDataSpecIds1},
        ] = this.changeValue(
            {valueId, key: valueKey, blacklistParamKeys: ['group_by']},
            componentId,
            componentData,
            dataSpec,
            valueMap,
        );

        return [
            {
                componentData: updatedComponentData1,
                updatedComponents: [componentId, ...updatedComponentDataIds1],
            },
            {dataSpec: updatedDataSpec1, updatedComponents: [...updatedDataSpecIds1]},
        ];
    }

    static changeGrouping(payload, componentId, componentData, dataSpec) {
        const {value} = payload;
        return this._changeParameter(
            {key: 'group_by', value},
            componentId,
            componentData,
            dataSpec,
        );
    }

    static changeDisabledOption(payload, componentId, componentData, dataSpec) {
        const {optionName, payload: disabled} = payload;
        return this.changeSettings(
            {[`${optionName}Disabled`]: disabled},
            componentId,
            componentData,
            dataSpec,
        );
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
}
