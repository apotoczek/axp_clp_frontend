import React from 'react';
import {ThemeProvider} from 'styled-components';

import theme from 'theme';

export const DarkTheme = props => <ThemeProvider theme={theme.darkTheme} {...props} />;
export const LightTheme = props => <ThemeProvider theme={theme} {...props} />;
export const CommanderTheme = props => <ThemeProvider theme={theme.commanderTheme} {...props} />;
