import React, {useEffect} from 'react';
import {Router, Route, Switch} from 'react-router-dom';
import {ThemeProvider} from 'styled-components';

import theme from 'theme';
import NotificationManager from 'components/NotificationManager';
import history from 'utils/history';

import EditCalculatedMetricContainer from 'containers/metrics/EditCalculatedMetricContainer';
import ListCalculatedMetricContainer from 'containers/metrics/ListCalculatedMetricContainer';

export default function ReactCalculatedMetrics() {
    useEffect(() => {
        history.push(window.location.hash.replace('#!', ''));
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <NotificationManager>
                <Router history={history}>
                    <Switch>
                        <Route
                            path='/data-manager/metrics:calculated'
                            component={ListCalculatedMetricContainer}
                            exact
                        />
                        <Route
                            path='/data-manager/metrics:calculated/:uid'
                            component={EditCalculatedMetricContainer}
                            exact
                        />
                    </Switch>
                </Router>
            </NotificationManager>
        </ThemeProvider>
    );
}
