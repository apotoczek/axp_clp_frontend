import React from 'react';
import ReactDOM from 'react-dom';

import Context from 'src/libs/Context';
import Documents from 'src/react/apps/documents';
import {AppContainer} from 'react-hot-loader';

import 'src/libs/bindings/react';

class DocumentsVM extends Context {
    constructor() {
        super({id: 'documents'});
        // Internal deferred
        this.dfd = this.new_deferred();

        this.Documents = Documents;

        this.render = Component => {
            ReactDOM.render(
                <AppContainer>
                    <Component />
                </AppContainer>,
                document.getElementById('documents'),
            );
        };

        this.mount = () => {
            this.render(Documents);
        };

        this.unmount = () => {
            ReactDOM.unmountComponentAtNode(document.getElementById('documents'));
        };

        this.mount();

        if (module.hot) {
            module.hot.accept('src/react/apps/documents', () => {
                this.render(require('src/react/apps/documents').default);
            });
        }

        this.dfd.resolve();
    }
}

export default DocumentsVM;
