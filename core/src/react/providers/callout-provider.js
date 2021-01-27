import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';
import genFormatter from 'utils/formatters';
import {ValueMapFilter} from 'libs/spec-engine/value-map';

export default class CalloutProvider extends BaseProvider {
    static fromSelector = BaseProvider.fromSelector(CalloutProvider);

    /**
     * Helper to find the key of value that is being displayed in the callout. This
     * works because there is only ever one value in a callout.
     */
    key = () => this.valueProvider.keys()[0];
    valueId = () => this.valueProvider.valueIds()[0];

    getLabel = () => this.valueProvider.valueLabel(this.valueId()) || 'Label';

    getValue = () => {
        const format = this.valueProvider.valueFormat(this.valueId());
        const formatArgs = {
            ...this.valueProvider.valueFormatArgs(this.valueId()),
            abbreviate: this.settingsValueForComponent(['displayUnits'], false),
            abbreviateAs: this.settingsValueForComponent(['displayUnits'], undefined),
            decimals: this.settingsValueForComponent(['decimalPlaces'], 2),
            showUnit: this.settingsValueForComponent(['showUnit'], true),
            currencySymbol: this.settingsValueForComponent(['currencySymbol']),
        };

        const valueEntry = this.valueProvider.valueEntry(this.valueId());
        if (!valueEntry) {
            return 'N/A';
        }

        const valueHash = this.valueProvider.uniqueValueHash(this.valueId());
        const value = this.valueProvider.value(valueEntry.key, valueHash);

        return genFormatter({type: format, formatArgs})(value) || 'N/A';
    };
}

export class CalloutSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(CalloutSettingsProvider);

    /**
     * Helper to find the key of value that is being displayed in the callout. This
     * works because there is only ever one value in a callout.
     */
    valueId = () => this.valueProvider.keys()[0];
    entity = () => this.valueProvider.entities(this.valueId())[0] || {};
    entityName = () => this.getVehicleName(this.entity().uid);
    entityError = () => this.getVehicleError(this.entity().uid);

    getFormat = () => this.valueProvider.valueFormat(this.valueId());
    getSelectedValue = () => this.valueProvider.valueLabel(this.valueId());
    getSelectedValueParams = () => this.valueProvider.params(this.valueId(), ['group_by']);
    getValues = () =>
        this.valueProvider.valueOptions(
            this.valueId(),
            this.entity(),
            ValueMapFilter.False,
            ValueMapFilter.False,
        );
}
