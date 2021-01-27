import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import ko from 'knockout';

import Mandates from 'components/reporting/Mandates';

import {mapped_mandate, mandate_params, frequencies, gen_endpoint} from 'src/helpers/reporting';

import 'src/libs/bindings/react';

const navigate = mandateUid => {
    const baseUrl = '#!/reporting-mandates';

    if (mandateUid) {
        window.location.hash = `${baseUrl}/${mandateUid}`;
    } else {
        window.location.hash = baseUrl;
    }
};

class MandatesVM extends Context {
    constructor() {
        super({id: 'gp_mandates'});

        this.dfd = this.new_deferred();

        this.mainComponent = Mandates;

        this.mandate_uid = ko.observable();

        this.create_new = ko.observable();

        this.datasources = {
            users: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'client',
                    },
                    mapping: client => client.users,
                },
            }),
            templates: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/templates',
                    },
                },
            }),
            defaults: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/mandate-defaults',
                    },
                },
            }),
            mandates: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/mandates',
                    },
                    mapping: mandates => mandates.map(m => mapped_mandate(m)),
                },
            }),
            sequences: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/email-sequences',
                    },
                },
            }),
        };

        this.endpoints = {
            create_or_update_mandate: gen_endpoint('actions/create-or-update-mandate'),
        };

        this.props = ko.pureComputed(() => {
            const users = this.datasources.users.data() || {};
            const templates = this.datasources.templates.data() || {};
            const mandates = this.datasources.mandates.data() || [];
            const defaults = this.datasources.defaults.data() || {};
            const sequences = this.datasources.sequences.data() || [];

            return {
                defaults: mapped_mandate(defaults),
                mandates,
                options: {
                    frequencies: frequencies(),
                    users,
                    templates,
                    emailSequences: sequences,
                },
                mandateUid: this.mandate_uid(),
                createNew: this.create_new(),
                saveMandate: this.save_mandate,
                navigate,
            };
        });

        Observer.register_hash_listener('reporting-mandates', ([_, uid]) => {
            if (uid === 'new') {
                this.mandate_uid(undefined);
                this.create_new(true);
            } else {
                this.mandate_uid(uid);
                this.create_new(false);
            }
        });

        // Resolve dfd
        this.dfd.resolve();
    }

    save_mandate = mandate => {
        this.endpoints.create_or_update_mandate({
            data: mandate_params(mandate),
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                navigate();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };
}

export default MandatesVM;
