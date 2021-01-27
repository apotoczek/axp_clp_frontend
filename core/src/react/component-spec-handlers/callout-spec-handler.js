import uuid from 'uuid/v4';

import BaseSpecHandler from 'src/react/component-spec-handlers/base-spec-handler';

export default class CalloutSpecHandler extends BaseSpecHandler {
    static _changeEntity(payload, componentId, componentData, dataSpec) {
        let {entity, valueId} = payload;

        if (!valueId) {
            valueId = uuid();
            dataSpec[componentId].values = {
                [valueId]: {type: 'base'},
            };
        }

        return BaseSpecHandler.changeEntity(
            {entity, valueId},
            componentId,
            componentData,
            dataSpec,
        );
    }
}
