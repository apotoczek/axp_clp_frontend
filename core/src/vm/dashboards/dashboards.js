import React from 'react';
import ReactDOM from 'react-dom';

import Context from 'src/libs/Context';
import Dashboards from 'src/react/apps/dashboards';
import {AppContainer} from 'react-hot-loader';

import 'src/libs/bindings/react';

class DashboardsVM extends Context {
    constructor() {
        super({id: 'dashboards'});
        // Internal deferred
        this.dfd = this.new_deferred();

        this.Dashboards = Dashboards;

        this.render = Component => {
            ReactDOM.render(
                <AppContainer>
                    <Component />
                </AppContainer>,
                document.getElementById('dashboards'),
            );
        };

        this.mount = () => {
            this.render(Dashboards);
        };

        this.unmount = () => {
            ReactDOM.unmountComponentAtNode(document.getElementById('dashboards'));
        };

        this.mount();

        if (module.hot) {
            module.hot.accept('src/react/apps/dashboards', () => {
                this.render(require('src/react/apps/dashboards').default);
            });
        }

        this.dfd.resolve();
    }
}

export default DashboardsVM;
