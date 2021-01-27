import {is_set} from 'src/libs/Utils';

export const attributeSelectorHelper = (valueKey, entityData, params) => {
    const [_, uid] = valueKey.split(':');

    if (!uid) {
        return entityData;
    }

    const {attributes = []} = entityData;
    for (const attributeEntry of attributes) {
        if (is_set(params) && is_set(params.group_by) && attributeEntry.uid === uid) {
            entityData[valueKey] = attributeEntry;
            break;
        }

        // If it is not grouped, the attributeEntry will be an actual attributeValue
        const {attribute, attribute_member: attributeMember} = attributeEntry;

        if ((!is_set(params) || !is_set(params.group_by)) && attribute.uid === uid) {
            entityData[valueKey] = attributeMember.name;
            break;
        }
    }

    return entityData;
};

export const metricSelectorHelper = (valueKey, entityData, params) => {
    const [type, ...valueKeyParams] = valueKey.split(':');
    let identifier;
    let subKey;
    if (type == 'metric') {
        [identifier, subKey = 'last_value'] = valueKeyParams;
    } else if (type == 'calculated_metric') {
        let calculatedMetricUid;
        let timeFrame;
        let frequency;
        [calculatedMetricUid, timeFrame, frequency, subKey = 'last_value'] = valueKeyParams;
        identifier = `${calculatedMetricUid}:${timeFrame}:${frequency}`;
    }
    if (!identifier) {
        return entityData;
    }

    const {metrics = []} = entityData;
    for (const metric of metrics) {
        if (metric.identifier !== identifier) {
            continue;
        }

        if (is_set(params.over_time)) {
            // If there is a value there is no grouping so we return the value
            // else we return entire metric including grouping
            if (is_set(params.group_by)) {
                entityData[valueKey] = metric;
            } else {
                entityData[valueKey] = (metric[entityData.entity_uid] || {}).value;
            }
            break;
        }

        // A special case when we are requesting a specific value from statistics
        const chosenMetric = metric[subKey] || {};
        if (is_set(params.group_by)) {
            // If it is a user fund there will always be a grouping
            entityData[valueKey] = chosenMetric;
        } else {
            entityData[valueKey] = (chosenMetric[entityData.entity_uid] || {}).value;
        }
        break;
    }
    return entityData;
};

export const textDataSelectorHelper = (valueKey, entityData, params) => {
    const {text_data = []} = entityData;
    const [_prefix, uid] = valueKey.split(':');

    for (const textDataValue of text_data) {
        if (textDataValue.spec_uid !== uid) {
            continue;
        }

        entityData[valueKey] = textDataValue;

        if (is_set(params.group_by)) {
            entityData[valueKey] = textDataValue;
        } else {
            entityData[valueKey] = textDataValue.value;
        }
    }
    return entityData;
};

export const parentSelectorHelper = (valueKey, entityData) => {
    const {parent} = entityData;
    entityData['parent_name'] = parent && parent.entity_name;
    return entityData;
};
