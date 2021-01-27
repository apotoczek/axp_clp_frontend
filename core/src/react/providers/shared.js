/**
 * Given the unique values and the settings for all values within a component, sorts the unique
 * values by the order specified in the settings for each value.
 *
 * @param {Array} uniqueValues An array containing the unique values output from the value-provider.
 * @param {Object} valueSettings A dict with value-ids as keys and settings for each value as values.
 */
export function orderValues(uniqueValues, valueSettings) {
    return uniqueValues.sort((leftValue, rightValue) => {
        const leftSettings = valueSettings[leftValue.id];
        const rightSettings = valueSettings[rightValue.id];

        return leftSettings.order - rightSettings.order;
    });
}

export function deriveLabel(template, variables) {
    let derivedLabel = template;
    for (const [name, value] of Object.entries(variables)) {
        derivedLabel = derivedLabel.replace(`{{${name}}}`, value);
    }
    return derivedLabel;
}
