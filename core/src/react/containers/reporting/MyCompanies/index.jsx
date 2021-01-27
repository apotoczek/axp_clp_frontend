import React, {useEffect} from 'react';

import {LightTheme} from 'themes';
import NotificationManager from 'components/NotificationManager';
import history from 'utils/history';
import {Router, Switch, Route} from 'react-router-dom';

import {BASE_PATH} from './helpers';
import ViewCompany from './ViewCompany';
import AddCompany from './AddCompany';
import ListCompanies from './ListCompanies';

export default function MyCompanies() {
    useEffect(() => {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        history.push(window.location.hash.replace('#!', ''));
    }, []);

    return (
        <Router history={history}>
            <LightTheme>
                <NotificationManager>
                    <Route exact path={BASE_PATH} component={ListCompanies} />
                    <Switch>
                        <Route exact path={`${BASE_PATH}/new`} component={AddCompany} />
                        <Route exact path={`${BASE_PATH}/:uid`} component={ViewCompany} />
                    </Switch>
                </NotificationManager>
            </LightTheme>
        </Router>
    );
}
