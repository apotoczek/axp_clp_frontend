import ko from 'knockout';

import React from 'react';
import ReactDOM from 'react-dom';

import {ThemeProvider} from 'styled-components';
import {DarkTheme} from 'themes';
import theme from 'theme';
import {CommanderTheme} from 'src/libs/react/themes';

ko.bindingHandlers.reactPage = {
    init: function() {
        return {controlsDescendantBindings: true};
    },
};

ko.virtualElements.allowedBindings.reactPage = true;

ko.bindingHandlers.renderReactComponent = {
    init: function(element) {
        element._bReactComponent = true;
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            ReactDOM.unmountComponentAtNode(element);
        });

        return {controlsDescendantBindings: true};
    },
    update: function(element, valueAccessor, allBindings) {
        const Component = ko.unwrap(valueAccessor());
        const props = ko.toJS(allBindings.get('props'));
        const dark = allBindings.get('dark');
        const commander = allBindings.get('commander');

        let componentElement = React.createElement(Component, props, null);

        if (dark) {
            componentElement = React.createElement(DarkTheme, {}, componentElement);
        }

        if (commander) {
            componentElement = React.createElement(CommanderTheme, {}, componentElement);
        }

        const themeProvider = React.createElement(ThemeProvider, {theme}, componentElement);

        ReactDOM.render(themeProvider, element);
    },
};
