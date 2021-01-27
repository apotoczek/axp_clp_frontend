import {is_set} from 'src/libs/Utils';

/**
 * Given a dict of value settings for the values within a component, ensures that the
 * `order` setting on all the values have no gaps, while retaining the order of the values
 * as they were sent in.
 *
 * Example:
 * >>> ensureCorrectOrder({
 *     '2499c645-76d4-44a1-82fe-196f7058ea8a': {
 *         order: 3,
 *     },
 *     '35434f74-cf7b-475a-941f-2f954ad50394': {
 *         order: 1,
 *     },
 *     '212cb0cf-224f-4ba4-8f9a-9830187f9403': {
 *         order: 5,
 *     },
 * })
 * > {
 *     '2499c645-76d4-44a1-82fe-196f7058ea8a': {
 *         order: 1,
 *     },
 *     '35434f74-cf7b-475a-941f-2f954ad50394': {
 *         order: 0,
 *     },
 *     '212cb0cf-224f-4ba4-8f9a-9830187f9403': {
 *         order: 2,
 *     },
 * }
 *
 * @param {Object} valueSettings A dict with value-ids as keys and settings for each value as values.
 */
export function ensureCorrectOrder(valueSettings) {
    const orderedValueSettings = Object.values(valueSettings).sort(
        (left, right) => left.order - right.order,
    );

    for (const [idx, valueSettings] of orderedValueSettings.entries()) {
        valueSettings.order = idx;
    }

    return valueSettings;
}

/**
 * Takes a value within a component and sets the new position is should have relative the other
 * values within the component. Also adjusts the order of the other values within the component
 * so that no values have the same order value. Finishes off by calling `ensureCorrectOrder`,
 * making sure that the order values have no gaps. See documentation for `ensureCorrectOrder`.
 *
 * @param {String} valueId The value uuid of the value to change the order for in the component.
 * @param {Number} newOrder The new position of the value uuid provided, in the components values.
 * @param {Object} valueSettings A dict with value-ids as keys and settings for each value as values.
 */
export function reorderValue(valueId, newOrder, valueSettings) {
    let oldOrder = valueSettings[valueId].order;
    if (!is_set(oldOrder)) {
        oldOrder = Object.keys(valueSettings).findIndex(id => id === valueId);
    }

    for (const [currentValueId, currentValueSettings] of Object.entries(valueSettings)) {
        const currentValueOrder = currentValueSettings.order;
        if (!is_set(currentValueOrder) || currentValueId === valueId) {
            continue;
        }

        if (newOrder > oldOrder) {
            if (currentValueOrder <= newOrder && currentValueOrder >= oldOrder) {
                currentValueSettings.order -= 1;
            }
        } else {
            if (currentValueOrder <= oldOrder && currentValueOrder >= newOrder) {
                currentValueSettings.order += 1;
            }
        }
    }

    valueSettings[valueId].order = newOrder;

    return ensureCorrectOrder(valueSettings);
}
