import {createComponentSelector} from 'selectors/utils';

import BaseProvider from 'providers/base-provider';

export default class TabularProvider extends BaseProvider {
    static selectorDependencies = [];

    static selectorFn = () => ({
        providerData: {
            columns: [],
            rows: [],
        },
        componentData: {},
    });

    static fromSelector = createComponentSelector(
        TabularProvider.selectorDependencies,
        (...args) => {
            const {providerData, componentData} = TabularProvider.selectorFn(...args);
            return new TabularProvider(providerData, componentData);
        },
    );
}
