import React from 'react';
import ReactDOM from 'react-dom';

import Context from 'src/libs/Context';
import {AppContainer} from 'react-hot-loader';

import 'src/libs/bindings/react';

import PlaygroundComponent from 'src/react/apps/dev_playground';

class PlaygroundVM extends Context {
    constructor() {
        super({id: 'playground'});
        // Internal deferred
        this.dfd = this.new_deferred();

        this.PlaygroundComponent = PlaygroundComponent;

        this.render = Component => {
            ReactDOM.render(
                <AppContainer>
                    <Component />
                </AppContainer>,
                document.getElementById('playground'),
            );
        };

        this.mount = () => {
            this.render(PlaygroundComponent);
        };

        this.unmount = () => {
            ReactDOM.unmountComponentAtNode(document.getElementById('playground'));
        };

        this.mount();

        if (module.hot) {
            module.hot.accept('src/react/apps/dev_playground', () => {
                this.render(require('src/react/apps/dev_playground').default);
            });
        }

        this.dfd.resolve();
    }
}

export default PlaygroundVM;
