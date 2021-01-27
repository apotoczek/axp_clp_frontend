import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import {Redirect} from 'react-router-dom';
import {hot} from 'react-hot-loader/root';
import {ThemeProvider as SCThemeProvider} from 'styled-components';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import {ThemeProvider as MUIThemeProvider, StylesProvider} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import cobaltTheme from './theme';

import SignIn from 'pages/SignIn';
import SignOut from 'pages/SignOut';
import AutoSignOut from 'pages/AutoSignOut';
import PortfolioOverview from 'pages/PortfolioOverview';
import PortfolioFunds from 'pages/PortfolioFunds';
import PortfolioAssets from 'pages/PortfolioAssets';
import FullSizeLoadingPage from 'pages/FullSizeLoadingPage';

import 'libs/heap-analytics';

// Import cobalt api, automatically initializes DataThing.
import 'api/cobalt';

import {checkIsAuthenticated, isAuthenticated, user} from 'auth';

import {PrivateRoute} from 'utils/routing';

import config from 'config';

interface ApplicationProps {}

interface ApplicationState {
    isCheckingAuth: boolean;
}

class Application extends React.Component<ApplicationProps, ApplicationState> {
    constructor(props: ApplicationState) {
        super(props);

        this.state = {
            isCheckingAuth: true,
        };
    }

    componentDidMount() {
        checkIsAuthenticated(() => {
            this.setState({isCheckingAuth: false});

            if (isAuthenticated && user && config.enableHeapTracking) {
                heap.identify(user.uid);
                heap.addUserProperties({
                    name: user.name,
                    email: user.email,
                    client_name: user.client_name,
                    client_uid: user.client_uid,
                    mfa_enabled: user.mfa_enabled,
                    title: user.title,
                    uid: user.uid,
                });
            }
        });
    }

    render() {
        if (this.state.isCheckingAuth) {
            return <FullSizeLoadingPage />;
        }

        return (
            <StylesProvider injectFirst>
                <CssBaseline />
                <MUIThemeProvider theme={cobaltTheme}>
                    <SCThemeProvider theme={cobaltTheme}>
                        <Router>
                            <Route exact path='/'>
                                <Redirect to='/sign-in' />
                            </Route>
                            <Routes />
                        </Router>
                    </SCThemeProvider>
                </MUIThemeProvider>
            </StylesProvider>
        );
    }
}

export default hot(Application);

class Routes extends React.Component<{}, {}> {
    render() {
        return (
            <Switch>
                <Route path='/sign-in'>
                    <SignIn />
                </Route>
                <Route path='/sign-out'>
                    <SignOut />
                </Route>
                <Route path='/auto-sign-out'>
                    <AutoSignOut />
                </Route>
                <PrivateRoute path='/portfolio/'>
                    <Switch>
                        <PrivateRoute path='overview'>
                            <PortfolioOverview />
                        </PrivateRoute>
                        <PrivateRoute path='funds'>
                            <PortfolioFunds />
                        </PrivateRoute>
                        <PrivateRoute path='assets'>
                            <PortfolioAssets />
                        </PrivateRoute>
                    </Switch>
                </PrivateRoute>
            </Switch>
        );
    }
}
