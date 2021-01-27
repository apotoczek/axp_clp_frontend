import React, {useEffect} from 'react';
import {Router, Switch, Route} from 'react-router-dom';
import history from 'utils/history';
import {Page} from 'components/layout';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import CPanel from 'components/basic/cpanel/base';

import ComponentsTable from './ComponentsTable';
import CreateComponentForm from './CreateComponentForm';
import EditComponentForm from './EditComponentForm';

export default function CompanyReportingComponentsRouter({modes, activeMode, setMode}) {
    useEffect(() => {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        history.push(window.location.hash.replace('#!', ''));
    }, []);

    return (
        <Page>
            {modes && (
                <CPanel>
                    <CompanyModeToggle activeMode={activeMode} setMode={setMode} modes={modes} />
                </CPanel>
            )}
            <Router history={history}>
                <Route
                    exact
                    path='/company-analytics/:companyId/reporting-components'
                    component={ComponentsTable}
                />
                <Switch>
                    <Route
                        exact
                        path='/company-analytics/:companyId/reporting-components/new'
                        component={CreateComponentForm}
                    />
                    <Route
                        exact
                        path='/company-analytics/:companyId/reporting-components/:instanceId/edit'
                        component={EditComponentForm}
                    />
                </Switch>
            </Router>
        </Page>
    );
}
