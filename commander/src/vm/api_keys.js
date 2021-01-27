import ko from 'knockout';

import Context from 'src/libs/Context';
import APIKeys from 'containers/APIKeysContainer';
import 'src/libs/bindings/react';

export default class APIKeysVM extends Context {
    constructor() {
        super({id: 'api-keys'});
        this.dfd = this.new_deferred();
        this.mainComponent = APIKeys;
        this.props = ko.pureComputed(() => ({}));
        this.dfd.resolve();
    }
}
