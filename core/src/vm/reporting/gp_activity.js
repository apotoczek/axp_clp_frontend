import Context from 'src/libs/Context';
import ko from 'knockout';
import auth from 'auth';

import Activity from 'containers/reporting/Activity';

import 'src/libs/bindings/react';

class GPActivityVM extends Context {
    constructor() {
        super({id: 'gp_activity'});

        this.dfd = this.new_deferred();

        this.mainComponent = Activity;

        this.props = ko.pureComputed(() => {
            return {
                internal: auth.user_has_feature('data_collection_internal'),
            };
        });

        // Resolve dfd
        this.dfd.resolve();
    }
}

export default GPActivityVM;
