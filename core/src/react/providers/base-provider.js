import {createComponentSelector} from 'selectors/utils';
import * as componentSelectors from 'selectors/dashboards/component';
import * as dashboardSelectors from 'selectors/dashboards/dashboard';
import * as dashboardsSelectors from 'selectors/dashboards';
import {customColors} from 'selectors/siteCustomizations';

import {FrontendDataType} from 'src/libs/Enums';
import {deepGet} from 'src/libs/Utils';

import {dateSelectionTimestamp, formattedDateSelectionValue} from 'src/helpers/dashboards';
import {is_set} from 'src/libs/Utils';
import ValuesHandler from 'libs/spec-engine/values-handler';
import ValueProvider, {ValueSettingsProvider} from 'providers/value-provider';

export default class BaseProvider {
    static selectorDependencies = [
        componentSelectors.componentData,
        componentSelectors.componentEntityData,
        componentSelectors.componentValueMapEntries,
        componentSelectors.dataSpec,
        dashboardSelectors.activeDashboardGlobalParams,
        componentSelectors.isComponentLoading,
        componentSelectors.componentErrorMessage,
        customColors,
    ];

    static selectorFn = (
        componentData,
        componentEntityData,
        componentValueMapEntries,
        componentDataSpec,
        globalParams,
        isLoading,
        errorMessage,
        customColors,
    ) => {
        const additionalData = {
            isLoading,
            errorMessage,
            componentDataSpec,
            componentValueMapEntries,
            customColors,
            globalParams,
        };

        const valueProvider = new ValueProvider(
            ValuesHandler.componentValues(componentDataSpec),
            componentValueMapEntries,
            componentEntityData,
            componentDataSpec,
        );

        return {componentData, additionalData, valueProvider};
    };

    static defaultColors = () => [
        '#39BEE5',
        '#FF006E',
        '#3AC376',
        '#6D83A3',
        '#F39C12',
        '#C33A3A',
        '#006FF1',
        '#F95532',
        '#BEBEBE',
        '#4A4A4A',
        '#555555',
        '#000000',
        '#FFFFFF',
    ];

    static fromSelector = (ProviderClass = BaseProvider) =>
        createComponentSelector(BaseProvider.selectorDependencies, (...args) => {
            const {componentData, additionalData, valueProvider} = BaseProvider.selectorFn(...args);
            return new ProviderClass(valueProvider, componentData, additionalData);
        });

    constructor(valueProvider, componentData, additionalData) {
        this.valueProvider = valueProvider;
        this.componentData = componentData || {};
        this.additionalData = additionalData || {};

        this.staticData = this._extractStaticValues();
    }

    _extractStaticValues = () => {
        const staticDataValues = {};
        for (const [valueId, value] of Object.entries(this.componentData.staticData || {})) {
            if (value.type === FrontendDataType.DateValue && is_set(value.date, true)) {
                const formattedValue = formattedDateSelectionValue(
                    value.date,
                    this.additionalData.globalParams.globalDate,
                    value.format,
                );
                staticDataValues[valueId] = {...value, formattedValue};
                continue;
            }
            staticDataValues[valueId] = value;
        }

        return staticDataValues;
    };

    isLoading = () => this.additionalData.isLoading;
    hasError = () => is_set(this.additionalData.errorMessage, true);
    getErrorMessage = () => this.additionalData.errorMessage;

    hasData = () => this.valueProvider.keys().length > 0;

    _getGroupColor(idx) {
        // To be used in providers with grouped data, especially charts which needs to generate colors
        const colors = is_set(this.additionalData.customColors, true)
            ? this.additionalData.customColors
            : BaseProvider.defaultColors();

        return colors[idx % colors.length];
    }

    isReportingComponent() {
        return is_set(this.componentData.base, true);
    }

    foundReportingComponent() {
        return this.isReportingComponent() && !this.componentData.base.notFound;
    }

    getSettings() {
        return this.componentData.settings || {};
    }

    componentDataValueForComponent(key, defaultValue, notSetChecker) {
        return deepGet(this.componentData, key, defaultValue, notSetChecker);
    }

    settingsValueForComponent(key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.settings, key, defaultValue, notSetChecker);
    }

    settingsValueForValueId(valueId, key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.valueSettings[valueId], key, defaultValue, notSetChecker);
    }

    getCustomColors() {
        return this.additionalData.customColors;
    }
}

export class BaseSettingsProvider {
    static selectorDependencies = [
        componentSelectors.selectedComponentData,
        componentSelectors.selectedDataSpec,
        dashboardsSelectors.valueMap,
        dashboardSelectors.activeDashboardFormattedBaseEntities,
        dashboardSelectors.activeDashboardGlobalParams,
        customColors,
    ];

    static selectorFn = (
        selectedComponentData,
        selectedDataSpec,
        valueMap,
        baseEntities,
        globalParams,
        customColors,
    ) => {
        const additionalData = {
            baseEntities,
            valueMap,
            componentDataSpec: selectedDataSpec,
            globalParams,
            customColors,
        };
        const valueProvider = new ValueSettingsProvider(selectedDataSpec, valueMap, globalParams);

        return {componentData: selectedComponentData, additionalData, valueProvider};
    };

    static fromSelector = (ProviderClass = BaseSettingsProvider) =>
        createComponentSelector(BaseSettingsProvider.selectorDependencies, (...args) => {
            const {componentData, additionalData, valueProvider} = BaseSettingsProvider.selectorFn(
                ...args,
            );
            return new ProviderClass(valueProvider, componentData, additionalData);
        });

    constructor(valueProvider, componentData, additionalData) {
        this.valueProvider = valueProvider;
        this.componentData = componentData || {};
        this.additionalData = additionalData || {};

        this.staticData = this._extractStaticValues();
    }

    _extractStaticValues = () => {
        const staticDataValues = {};
        for (const [valueId, value] of Object.entries(this.componentData.staticData || {})) {
            if (value.type === FrontendDataType.DateValue && is_set(value.date, true)) {
                const ts = dateSelectionTimestamp(
                    value.date,
                    this.additionalData.globalParams.globalDate,
                );
                const formattedValue = formattedDateSelectionValue(
                    value.date,
                    this.additionalData.globalParams.globalDate,
                    value.format,
                );
                staticDataValues[valueId] = {...value, formattedValue, timestamp: ts};
                continue;
            }
            staticDataValues[valueId] = value;
        }

        return staticDataValues;
    };

    staticDataValue = valueId => this.staticData[valueId];

    formattedDate = (value, format) =>
        formattedDateSelectionValue(value, this.additionalData.globalParams.globalDate, format);

    dateTimestamp = dateValue =>
        dateSelectionTimestamp(dateValue, this.additionalData.globalParams.globalDate);

    getSettings() {
        return this.componentData.settings || {};
    }

    settingsValueForComponent(key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.settings, key, defaultValue, notSetChecker);
    }

    settingsValueForValueId(valueId, key, defaultValue, notSetChecker) {
        return deepGet(this.componentData.valueSettings[valueId], key, defaultValue, notSetChecker);
    }

    containerStyleValue = key => (this.componentData.containerStyle || {})[key];

    baseEntities = () => {
        return this.additionalData.baseEntities;
    };
    globalParams = () => this.additionalData.globalParams;
    getVehicle = uid => uid && this.baseEntities()[uid];
    vehicleOptions = () =>
        Object.values(this.baseEntities()).map(vehicle => ({
            key: vehicle.entity_uid,
            label: vehicle.entity_name,
            value: vehicle.entity_uid,
            description: vehicle.description,
        }));

    isReportingComponent() {
        return is_set(this.componentData.base, true);
    }

    getVehicleName(uid) {
        const vehicle = this.getVehicle(uid);

        if (vehicle) {
            return vehicle.entity_name;
        }

        return null;
    }

    getVehicleError(uid) {
        if (!uid || this.getVehicle(uid)) {
            return null;
        }

        return 'The selected entity was not found';
    }

    getCustomColors() {
        return this.additionalData.customColors;
    }
}
