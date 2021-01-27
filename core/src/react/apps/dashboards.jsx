import React, {Component} from 'react';
import {createGlobalStyle} from 'styled-components';
import {Router, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';

import {DarkTheme} from 'themes';

import store from 'store';

import history from 'utils/history';

import {Container} from 'components/layout';
import ViewReportContainer from 'containers/dashboards/ViewReportContainer';
import DashboardCreateContainer from 'containers/dashboards/DashboardCreateContainer';
import DashboardListContainer from 'containers/dashboards/DashboardListContainer';
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
        color: ${({theme}) => theme.textBlock.placeholder};
        font-size: 14px;
    }
`;

export default class Dashboards extends Component {
    componentDidMount() {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        if (!history.location.pathname.startsWith('/dashboards')) {
            history.push(window.location.hash.replace('#!', ''));
        }
    }

    render() {
        return (
            <DarkTheme>
                <NotificationManager>
                    <Router history={history}>
                        <Provider store={store}>
                            <Container>
                                <GlobalStyle />
                                <Route
                                    exact
                                    path='/dashboards'
                                    component={DashboardListContainer}
                                />
                                <Switch>
                                    <Route
                                        exact
                                        path='/dashboards/create'
                                        component={DashboardCreateContainer}
                                    />
                                    <Route
                                        exact
                                        path='/dashboards/:uid'
                                        component={ViewReportContainer}
                                    />
                                </Switch>
                                <Route
                                    exact
                                    path='/dashboards/:uid/edit'
                                    component={EditReportContainer}
                                />
                            </Container>
                        </Provider>
                    </Router>
                </NotificationManager>
            </DarkTheme>
        );
    }
}
