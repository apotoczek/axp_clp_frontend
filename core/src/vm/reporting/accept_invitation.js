import React from 'react';
import ReactDOM from 'react-dom';

import Context from 'src/libs/Context';
import AcceptInvitation from 'src/react/apps/AcceptInvitation';
import {AppContainer} from 'react-hot-loader';

import 'src/libs/bindings/react';

export default class AcceptInvitationVM extends Context {
    constructor() {
        super({id: 'accept-invitation'});
        // Internal deferred
        this.dfd = this.new_deferred();

        this.AcceptInvitation = AcceptInvitation;

        this.render = Component => {
            ReactDOM.render(
                <AppContainer>
                    <Component />
                </AppContainer>,
                document.getElementById('react-root'),
            );
        };

        this.mount = () => {
            this.render(AcceptInvitation);
        };

        this.unmount = () => {
            ReactDOM.unmountComponentAtNode(document.getElementById('react-root'));
        };

        this.mount();

        if (module.hot) {
            module.hot.accept('src/react/apps/AcceptInvitation', () => {
                this.render(require('src/react/apps/AcceptInvitation').default);
            });
        }

        this.dfd.resolve();
    }
}
