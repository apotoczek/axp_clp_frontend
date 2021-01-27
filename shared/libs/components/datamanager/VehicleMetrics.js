/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';
import auth from 'auth';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
        <div class="alert-callout alert-callout-info" style="padding-top: 22px;">
            <p class="text-left lead">
        To bulk edit your Metrics, download the spreadsheet.<br>
        Once you're done, upload it and Cobalt will update your entities accordingly.<br>
            </p>
        </div>
        <!-- ko renderComponent: table --><!-- /ko -->
    `);

    self.tools_menu_id = opts.tools_menu_id;

    self.vehicle_uid_event = opts.vehicle_uid_event;
    self.metric_versions_event = opts.metric_versions_event;
    self.company_name_event = opts.company_name_event;
    self.metric_identifiers_event = opts.metric_identifiers_event;

    self.vehicle_uid = ko.observable();

    self.table = self.new_instance(DataTable, {
        id: 'table',
        css: {'table-light': true, 'table-sm': true},
        enable_selection: true,
        label: 'Metrics',
        empty_template: 'tpl_data_table_empty_with_label',
        columns: [
            {
                label: 'Company',
                format: 'contextual_link',
                format_args: {
                    url: 'company-analytics/<company_uid>',
                    label_key: 'company_name',
                },
            },
            {
                label: 'Metric',
                format: 'contextual_link',
                format_args: {
                    url: 'data-manager/metric-sets/<uid>',
                    label_key: 'metric_name',
                },
            },
            {
                key: 'version_name',
                label: 'Metric Version',
                visible: auth.user_has_feature('metric_versions'),
            },
            {
                key: 'currency',
                label: 'Currency',
            },
            {
                key: 'count',
                label: 'Values',
            },
            {
                key: 'min_date',
                label: 'First Date',
                format: 'backend_date',
            },
            {
                key: 'max_date',
                label: 'Last Date',
                format: 'backend_date',
            },
        ],
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:metric_sets',
                entity_type: 'user_fund',
                entity_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
                filters: {
                    type: 'dynamic',
                    query: {
                        metric_versions: {
                            type: 'observer',
                            event_type: self.metric_versions_event,
                            mapping: objs => objs.map(obj => obj.value),
                        },
                        string_filter: {
                            type: 'observer',
                            event_type: self.company_name_event,
                        },
                        metric_identifiers: {
                            type: 'observer',
                            event_type: self.metric_identifiers_event,
                            mapping: objs => objs.map(obj => obj.identifier),
                        },
                    },
                },
            },
        },
    });

    Observer.register(self.vehicle_uid_event, uid => {
        self.vehicle_uid(uid);
    });

    _dfd.resolve();

    return self;
}
