import Context from 'src/libs/Context';
import ko from 'knockout';
import auth from 'auth';

import MyPortals from 'containers/reporting/MyPortals';
import MyCompanies from 'containers/reporting/MyCompanies';

import 'src/libs/bindings/react';

class RelationshipsVM extends Context {
    constructor() {
        super({id: 'gp_relationships'});

        this.dfd = this.new_deferred();

        this.relationship_uid = ko.observable();

        this.create_new = ko.observable();

        this.props = {};

        this.mainComponent = ko.pureComputed(() => {
            if (auth.user_has_feature('data_collection_internal')) {
                return MyCompanies;
            }

            return MyPortals;
        });

        // Resolve dfd
        this.dfd.resolve();
    }
}

export default RelationshipsVM;
