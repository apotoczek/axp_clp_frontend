import BaseProvider, {BaseSettingsProvider} from 'providers/base-provider';

import {createComponentSelector} from 'selectors/utils';
import * as componentSelectors from 'selectors/dashboards/component';

export default class ShapeProvider extends BaseProvider {
    static selectorDependencies = [componentSelectors.componentData];

    static selectorFn = componentData => ({providerData: {}, componentData});

    static fromSelector = createComponentSelector(ShapeProvider.selectorDependencies, (...args) => {
        const {providerData, componentData} = ShapeProvider.selectorFn(...args);

        return new ShapeProvider(providerData, componentData);
    });
}

export class ShapeSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(ShapeSettingsProvider);
}
