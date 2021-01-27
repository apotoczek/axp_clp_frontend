import React, {useEffect} from 'react';
import {Router, Switch, Route} from 'react-router-dom';
import history from 'utils/history';
import {Page} from 'components/layout';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';
import CPanel from 'components/basic/cpanel/base';

import ContactsTable from './ContactsTable';
import {NewContactForm, EditContactForm} from './ContactForm';

export default function CompanyContacts({modes, setMode, activeMode}) {
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
                    path='/company-analytics/:companyId/contacts'
                    component={ContactsTable}
                />
                <Switch>
                    <Route
                        exact
                        path='/company-analytics/:companyId/contacts/new'
                        component={NewContactForm}
                    />
                    <Route
                        exact
                        path='/company-analytics/:companyId/contacts/:contactId/edit'
                        component={EditContactForm}
                    />
                </Switch>
            </Router>
        </Page>
    );
}
