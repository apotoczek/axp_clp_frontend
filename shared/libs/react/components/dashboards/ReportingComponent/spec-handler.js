import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';

export default class ReportingComponentSpecHandler extends BaseSpecHandler {
    static _changeAsOfDate(payload, componentId, componentData, dataSpec) {
        const {asOfDate} = payload;

        const updatedComponentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                base: {
                    ...componentData[componentId].base,
                    asOfDate,
                },
            },
        };

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
            true,
        ];
    }

    static _changeEntity(payload, componentId, componentData, dataSpec) {
        const {dealId} = payload;

        const updatedComponentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                base: {
                    ...componentData[componentId].base,
                    entity: {
                        uid: dealId,
                        type: 'deal',
                    },
                },
            },
        };

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
            true,
        ];
    }

    static _changeReportingComponent(payload, componentId, componentData, dataSpec) {
        const {reportingComponentId} = payload;

        const updatedComponentData = {
            ...componentData,
            [componentId]: {
                ...componentData[componentId],
                base: {
                    ...componentData[componentId].base,
                    reportingComponentId,
                },
            },
        };

        return [
            {componentData: updatedComponentData, updatedComponents: [componentId]},
            {dataSpec, updatedComponents: []},
            true,
        ];
    }
}
