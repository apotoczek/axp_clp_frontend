import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';

import Emails from 'components/reporting/Emails';
import ko from 'knockout';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';

import {gen_endpoint} from 'src/helpers/reporting';

import 'src/libs/bindings/react';

const navigate = (prefix, uid) => {
    if (prefix && uid) {
        window.location.hash = `#!/reporting-emails/${prefix}/${uid}`;
    } else {
        window.location.hash = '#!/reporting-emails';
    }
};

const mapped_step = ({
    ordering_value: orderingValue,
    relative_base: relativeBase,
    relative_days: daysOffset,
    ...rest
}) => ({
    ...rest,
    daysOffset,
    relativeBase,
    orderingValue,
});

class EmailsVM extends Context {
    constructor() {
        super({id: 'gp_emails'});

        this.datasources = {
            templates: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/email-templates',
                    },
                },
            }),
            sequences: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/email-sequences',
                    },
                    mapping: sequences =>
                        sequences.map(sequence => ({
                            ...sequence,
                            steps: sequence.steps.map(mapped_step),
                        })),
                },
            }),
        };

        this.endpoints = {
            create_or_update_template: gen_endpoint('actions/create-or-update-email-template'),
            create_or_update_sequence: gen_endpoint('actions/create-or-update-email-sequence'),
        };

        this.dfd = this.new_deferred();

        this.active_uid = ko.observable();
        this.create_new = ko.observable(false);
        this.mode = ko.observable();

        this.mainComponent = Emails;

        this.props = ko.pureComputed(() => {
            const templates = this.datasources.templates.data() || [];
            const sequences = this.datasources.sequences.data() || [];

            return {
                templates,
                sequences,
                navigate,
                activeUid: this.active_uid(),
                createNew: this.create_new(),
                saveTemplate: this.save_template,
                saveSequence: this.save_sequence,
                mode: this.mode(),
            };
        });

        Observer.register_hash_listener('reporting-emails', ([_, mode, uid]) => {
            this.mode(mode);

            if (uid === 'new') {
                this.active_uid(undefined);
                this.create_new(true);
            } else {
                this.active_uid(uid);
                this.create_new(false);
            }
        });

        // Resolve dfd
        this.dfd.resolve();
    }

    save_template = template => {
        this.endpoints.create_or_update_template({
            data: {
                name: template.name,
                subject: template.subject,
                body: template.body,
                template_uid: template.uid,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();

                navigate();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    save_sequence = sequence => {
        this.endpoints.create_or_update_sequence({
            data: {
                name: sequence.name,
                steps: sequence.steps.map(
                    ({relativeBase, daysOffset, orderingValue: _, ...rest}, index) => ({
                        ...rest,
                        relative_base: relativeBase,
                        relative_days: daysOffset,
                        ordering_value: index + 1,
                    }),
                ),
                sequence_uid: sequence.uid,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();

                navigate();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };
}

export default EmailsVM;
