import React, {useEffect} from 'react';

import {LightTheme} from 'themes';
import NotificationManager from 'components/NotificationManager';
import history from 'utils/history';
import {Router, Switch, Route} from 'react-router-dom';

import {BASE_PATH} from './helpers';
import ViewPortal from './ViewPortal';
import CreatePortal from './CreatePortal';
import ListPortals from './ListPortals';

export default function MyPortals() {
    useEffect(() => {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        history.push(window.location.hash.replace('#!', ''));
    }, []);

    return (
        <Router history={history}>
            <LightTheme>
                <NotificationManager>
                    <Route exact path={BASE_PATH} component={ListPortals} />
                    <Switch>
                        <Route exact path={`${BASE_PATH}/new`} component={CreatePortal} />
                        <Route exact path={`${BASE_PATH}/:uid`} component={ViewPortal} />
                    </Switch>
                </NotificationManager>
            </LightTheme>
        </Router>
    );
}
