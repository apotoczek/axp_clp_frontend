import React, {Component} from 'react';
import {createGlobalStyle} from 'styled-components';
import {Router, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';

import {LightTheme} from 'themes';

import store from 'store';

import history from 'utils/history';

import {Container} from 'components/layout';
import DocumentsIndexContainer from 'containers/documents/DocumentsIndexContainer';
import ViewReportContainer from 'containers/dashboards/ViewReportContainer';
import DashboardCreateContainer from 'containers/dashboards/DashboardCreateContainer';
import EditReportContainer from 'containers/dashboards/EditReportContainer';
import NotificationManager from 'components/NotificationManager';

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
        color: ${({theme}) => theme.dashboardTextBlockPlaceholder};
        font-size: 14px;
    }

    ::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(50, 50, 50, 0.2);
    }
`;

export default class Documents extends Component {
    componentDidMount() {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        if (!history.location.pathname.startsWith('/documents')) {
            history.push(window.location.hash.replace('#!', ''));
        }
    }

    render() {
        return (
            <LightTheme>
                <NotificationManager>
                    <Router history={history}>
                        <Provider store={store}>
                            <Container>
                                <GlobalStyle />
                                <Switch>
                                    <Route
                                        exact
                                        path='/documents/browse/:dir*'
                                        component={DocumentsIndexContainer}
                                    />
                                    <Route
                                        exact
                                        path='/documents/create'
                                        component={DashboardCreateContainer}
                                    />
                                    <Route
                                        exact
                                        path='/documents/create/:parent'
                                        component={DashboardCreateContainer}
                                    />
                                    <Route
                                        exact
                                        path='/documents/:uid'
                                        component={ViewReportContainer}
                                    />
                                </Switch>
                                <Route
                                    exact
                                    path='/documents/:uid/edit'
                                    component={EditReportContainer}
                                />
                            </Container>
                        </Provider>
                    </Router>
                </NotificationManager>
            </LightTheme>
        );
    }
}
