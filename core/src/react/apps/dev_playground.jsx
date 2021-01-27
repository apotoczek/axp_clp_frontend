import React, {Component} from 'react';
import {ThemeProvider} from 'styled-components';
import {Router, Route} from 'react-router-dom';
import {Provider} from 'react-redux';

import theme from 'theme';
import {LightTheme} from 'themes';
import {withRouter} from 'react-router';

import store from 'store';

import history from 'utils/history';

import {Container} from 'components/layout';
import NotificationManager from 'components/NotificationManager';
import {Viewport} from 'components/layout';
import Breadcrumbs from 'components/Breadcrumbs';

import PlaygroundComponent from 'containers/metrics/EditCalculatedMetricContainer';

export default class Playground extends Component {
    componentDidMount() {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        if (!history.location.pathname.startsWith('/playground')) {
            history.push(window.location.hash.replace('#!', ''));
        }
    }

    render() {
        if (typeof PlaygroundComponent == 'undefined') {
            return <div />;
        }
        return (
            <ThemeProvider theme={theme}>
                <LightTheme>
                    <NotificationManager>
                        <Router history={history}>
                            <Provider store={store}>
                                <Container>
                                    <Viewport>
                                        <Breadcrumbs
                                            path={['React Playground']}
                                            urls={['/playground']}
                                        />
                                        <Route
                                            exact
                                            path='/playground'
                                            component={withRouter('div')}
                                        />
                                    </Viewport>
                                </Container>
                            </Provider>
                        </Router>
                    </NotificationManager>
                </LightTheme>
            </ThemeProvider>
        );
    }
}
