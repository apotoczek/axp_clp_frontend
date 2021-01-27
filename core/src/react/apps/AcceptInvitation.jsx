import React, {Component} from 'react';
import {Router, Route} from 'react-router-dom';

import {DarkTheme} from 'themes';

import history from 'utils/history';

import {Container} from 'components/layout';
import AcceptInvitationForm from 'src/react/containers/AcceptInvitationForm';

export default class AcceptInvitation extends Component {
    render() {
        return (
            <DarkTheme>
                <Router history={history}>
                    <Container>
                        <Route
                            exact
                            path='/reporting-invitation/:uid'
                            component={AcceptInvitationForm}
                        />
                    </Container>
                </Router>
            </DarkTheme>
        );
    }
}
