import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import {addParameters, addDecorator} from '@storybook/react';
import {ThemeProvider as SCThemeProvider} from 'styled-components';
import {ThemeProvider as MUIThemeProvider, StylesProvider} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import cobaltTheme from '../src/theme';

export const parameters = {
    actions: {argTypesRegex: '^on[A-Z].*'},
};

addDecorator(story => (
    React.createElement(StylesProvider, {injectFirst: true},
        React.createElement(CssBaseline, {}),
        React.createElement(MUIThemeProvider, {theme: cobaltTheme},
            React.createElement(SCThemeProvider, {theme: cobaltTheme}, story()),
        ),
    )
));
