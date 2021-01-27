import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';
import ko from 'knockout';
import config from 'config';
import DataTemplates from 'components/reporting/DataTemplates';

import 'src/libs/bindings/react';

const gen_endpoint = url =>
    DataThing.backends.reporting({
        url: url,
    });

const mapped_metric = metric => ({
    uid: metric.uid,
    baseMetricName: metric.base_metric_name,
    timeFrameLabel: metric.time_frame_label,
    timeFrame: metric.time_frame,
    frequency: metric.frequency,
    frequencyLabel: metric.frequency_label,
    reportingPeriod: metric.reporting_period,
    name: metric.name,
    key: metric.uid,
});

const mapped_version = version => ({
    ...version,
    versionType: version.version_type,
});

const mapped_template = template => ({
    ...template,
    sheetNames: template.sheet_names && template.sheet_names.length ? template.sheet_names : null,
    instructions: template.instructions_html,
    sheets:
        (template.sheets &&
            template.sheets.map(s => ({
                ...s,
                metricVersion: mapped_version(s.metric_version),
                backfillMonths: s.backfill_months,
                enableBackfill: s.backfill_months > 0,
                collectMonths: s.collect_months,
                metrics: s.metrics.map(m => ({
                    ...m,
                    metric: mapped_metric(m.metric),
                })),
            }))) ||
        [],
    includedTextData: template.included_text_data,
    enableSupportingDocuments: template.enable_supporting_documents,
    supportingDocuments: template.supporting_documents,
});

const navigate = (uid, edit = false) => {
    const baseUrl = '#!/reporting-templates';
    let newHash;

    if (uid) {
        newHash = `${baseUrl}/${uid}`;
    } else {
        newHash = baseUrl;
    }

    if (edit) {
        newHash += '/edit';
    }

    window.location.hash = newHash;
};

const BACKFILL = [3, 6, 9, 10, 12, 24, 36].map(n => ({value: n, label: `${n} months`}));

BACKFILL.unshift({value: 0, label: 'None'});

const COLLECT = [1, 2, 3, 6, 9, 10, 12, 24, 36].map(n => ({value: n, label: `${n} months`}));

class TemplateVM extends Context {
    constructor() {
        super({id: 'reporting-settings'});

        this.dfd = this.new_deferred();

        this.template_uid = ko.observable();
        this.edit = ko.observable(false);

        this.mainComponent = DataTemplates;

        this.datasources = {
            templates: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'reporting/templates',
                    },
                    mapping: templates => templates.map(t => mapped_template(t)),
                },
            }),
            metric_versions: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'metric_versions_for_client',
                        results_per_page: 'all',
                    },
                    key: 'results',
                },
            }),
            text_data_groups: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'text-data/grouped-fields',
                    },
                    key: 'groups',
                },
            }),
            metrics: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'all_metrics_for_user',
                    },
                },
            }),
            attributes: this.new_instance(DataSource, {
                datasource: {
                    type: 'dynamic',
                    query: {
                        target: 'attributes',
                        paging: false,
                        include_members: false,
                        require_members: true,
                    },
                },
            }),
        };

        this.loading = ko.pureComputed(() => {
            for (const d of Object.values(this.datasources)) {
                if (d.loading()) {
                    return true;
                }
            }

            return false;
        });

        this.props = ko.pureComputed(() => {
            const metrics = this.datasources.metrics.data() || [];
            const metric_versions = this.datasources.metric_versions.data() || [];

            return {
                isLoading: this.loading(),
                templates: this.datasources.templates.data() || [],
                templateUid: this.template_uid(),
                edit: this.edit(),
                saveTemplate: this.update_template,
                duplicateTemplate: this.duplicate_template,
                previewTemplate: this.preview_template,
                options: {
                    textDataGroups: this.datasources.text_data_groups.data(),
                    attributes: this.datasources.attributes.data() || [],
                    backfill: BACKFILL,
                    collect: COLLECT,
                    metrics: metrics.map(m => mapped_metric(m)),
                    metricVersions: metric_versions.map(m => mapped_version(m)),
                },
                navigate,
            };
        });

        this.endpoints = {
            update_template: gen_endpoint('actions/create-or-update-template'),
            duplicate_template: gen_endpoint('actions/duplicate-template'),
            preview_template: gen_endpoint('actions/preview-template'),
        };

        Observer.register_hash_listener('reporting-templates', ([_, uid, edit]) => {
            if (uid === 'new') {
                this.template_uid(undefined);
                this.edit(true);
            } else {
                this.template_uid(uid);
                this.edit(!!edit);
            }
        });

        this.dfd.resolve();
    }

    duplicate_template = uid => {
        this.endpoints.duplicate_template({
            data: {
                template_uid: uid,
            },
            success: DataThing.api.XHRSuccess(() => {
                DataThing.status_check();
                navigate();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    preview_template = uid => {
        this.endpoints.preview_template({
            data: {
                template_uid: uid,
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    update_template = ({
        uid,
        name,
        includedTextData,
        sheets,
        instructions,
        supportingDocuments,
        enableSupportingDocuments,
    }) => {
        this.endpoints.update_template({
            data: {
                template_uid: uid,
                name: name,
                instructions,
                sheets: sheets.map(s => ({
                    uid: s.uid,
                    metric_version_uid: s.metricVersion.uid,
                    collect_months: s.collectMonths,
                    backfill_months: s.backfillMonths,
                    metrics: s.metrics.map(m => ({
                        metric_uid: m.metric.uid,
                        required: m.required,
                    })),
                })),
                text_data_group_uids: includedTextData.map(({uid}) => uid),
                enable_supporting_documents: enableSupportingDocuments,
                supporting_documents: supportingDocuments,
            },
            success: DataThing.api.XHRSuccess(uid => {
                DataThing.status_check();
                navigate(uid);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };
}

export default TemplateVM;
