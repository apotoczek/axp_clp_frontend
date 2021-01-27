import '@babel/polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import store from 'react/store';
import {ThemeProvider, createGlobalStyle} from 'styled-components';
import {Provider} from 'react-redux';

import 'hooks';
import 'src/libs/bindings/highcharts';
import history from 'utils/history';
import theme from 'theme';
import {DarkTheme} from 'themes';
import {Router, Route} from 'react-router-dom';

import 'src/styles/DEPLOYMENT.scss';

import BareReportContainer from 'react/ssr/BareReportContainer';

if (!history.location.pathname.startsWith('/dashboards')) {
    history.push(window.location.hash.replace('#!', ''));
}

const GlobalStyle = createGlobalStyle`
    .ReactCrop {
        background-color: transparent !important;
    }

    .quill {
        height: 100% !important;
        cursor: text !important;
        white-space: pre-wrap;
    }

    .ql-blank[data-placeholder]::before {
        font-size: 14px;
    }

    body {
        background-color: #ffffff;
    }
`;

const dashboardRoot = (
    <ThemeProvider theme={theme}>
        <DarkTheme>
            <Router history={history}>
                <Provider store={store}>
                    <GlobalStyle />
                    <Route exact path='/:uid' component={BareReportContainer} />
                </Provider>
            </Router>
        </DarkTheme>
    </ThemeProvider>
);

ReactDOM.render(dashboardRoot, document.getElementById('dashboard-ssr-root'));
