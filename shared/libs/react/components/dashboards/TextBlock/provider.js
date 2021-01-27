import {is_set, deepGet} from 'src/libs/Utils';

export default class TextBlockProvider {
    constructor(componentData) {
        this.componentData = componentData || {};
    }

    getText() {
        return (this.componentData.settings && this.componentData.settings.text) || '';
    }

    isLoading() {
        return false;
    }

    hasError() {
        return false;
    }

    hasData() {
        return false;
    }

    isReportingComponent() {
        return is_set(this.componentData.base, true);
    }

    foundReportingComponent() {
        return this.isReportingComponent() && !this.componentData.base.notFound;
    }

    settingsValueForComponent(key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.settings, key, defaultValue, notSetChecker);
    }

    settingsValueForValueId(valueId, key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.valueSettings[valueId], key, defaultValue, notSetChecker);
    }

    getCustomColors() {
        return undefined;
    }
}
