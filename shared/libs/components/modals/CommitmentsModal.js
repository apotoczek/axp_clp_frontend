import ko from 'knockout';
import config from 'config';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import DataTable from 'src/libs/components/basic/DataTable';
import ActionButton from 'src/libs/components/basic/ActionButton';
import CommitmentUploadModal from 'src/libs/components/modals/CommitmentUploadModal';
import Observer from 'src/libs/Observer';
import bison from 'bison';
import auth from 'auth';

class CommitmentsModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();
        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md" data-bind="style: { width: model_fund_permission() ? '750px' : '650px' }">
                    <div class="modal-content">
                        <div class="modal-header">
                            <!-- ko renderComponent: download_button --><!-- /ko -->
                            <!-- ko renderComponent: append_button --><!-- /ko -->
                            <!-- ko renderComponent: replace_button --><!-- /ko -->
                            <h4 class="modal-title" data-bind="text: commitment_plan_name" />
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: table --><!-- /ko -->
                        </div>
                    </div>
                </div>
            </div>
        `);

        const events = opts.events;

        events.resolve_and_add('download_commitments', 'ActionButton.action.download_commitments');
        events.resolve_and_add('append_commitments', 'ActionButton.action.append_commitments');
        events.resolve_and_add('replace_commitments', 'ActionButton.action.replace_commitments');

        this.commitment_plan_uid = Observer.observable(events.get('commitment_plan_uid_event'));

        this.commitment_plan_name_observable = Observer.observable(
            events.get('commitment_plan_name_event'),
        );

        this.commitment_plan_name = ko.pureComputed(() => {
            return this.commitment_plan_name_observable();
        });

        this.model_fund_permission = ko.pureComputed(() => {
            return auth.user_has_feature('hl_model_path');
        });

        this.portfolio_uid = Observer.observable(events.get('portfolio_uid_event'));

        this.table = this.new_instance(DataTable, {
            id: 'commitment_table',
            enable_clear_order: true,
            enable_csv_export: false,
            column_toggle_css: {'fixed-column-toggle': true},
            css: {'table-light': true, 'table-sm': true},
            inline_data: true,
            clear_order_event: this.clear_event,
            columns: [
                {
                    label: 'Fund Name',
                    key: 'fund_name',
                },
                {
                    label: 'Year',
                    key: 'year',
                },
                {
                    label: 'Quarter',
                    key: 'quarter',
                },
                {
                    label: 'Commitment',
                    key: 'commitment',
                },
                {
                    label: 'Style / Focus',
                    key: 'attribute',
                },
                {
                    label: 'Horizon Model Path',
                    key: 'model_fund_name',
                    visible: auth.user_has_feature('hl_model_path'),
                },
            ],
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'user:commitments',
                    commitment_plan_uid: {
                        type: 'observer',
                        event_type: events.get('commitment_plan_uid_event'),
                        required: true,
                    },
                },
            },
        });

        this.download_button = this.new_instance(ActionButton, {
            id: 'download_commitments',
            label:
                'Download <span style="padding-left:3px" class="glyphicon glyphicon-download-alt"></span> ',
            action: 'download_commitments',
            css: {
                'pull-right': true,
                'btn-transparent-success': true,
            },
            id_callback: events.register_alias('download_commitments'),
        });

        this.append_button = this.new_instance(ActionButton, {
            id: 'append_commitments',
            label: 'Append <span class="icon-link"></span>',
            action: 'append_commitments',
            css: {
                'pull-right': true,
                'btn-transparent-success': true,
            },
            id_callback: events.register_alias('append_commitments'),
            trigger_modal: {
                id: 'append_upload_modal',
                component: CommitmentUploadModal,
                mode: 'append',
                commitment_plan_name_event: events.get('commitment_plan_name_event'),
                commitment_plan_uid_event: events.get('commitment_plan_uid_event'),
                vehicle_uid_event: events.get('portfolio_uid_event'),
            },
        });

        this.replace_button = this.new_instance(ActionButton, {
            id: 'replace_commitments',
            label: 'Replace <span class="icon-exchange"></span>',
            action: 'replace_commitments',
            css: {
                'pull-right': true,
                'btn-transparent-success': true,
            },
            id_callback: events.register_alias('replace_commitments'),
            trigger_modal: {
                id: 'replace_upload_modal',
                component: CommitmentUploadModal,
                mode: 'replace',
                commitment_plan_name_event: events.get('commitment_plan_name_event'),
                commitment_plan_uid_event: events.get('commitment_plan_uid_event'),
                vehicle_uid_event: events.get('portfolio_uid_event'),
            },
        });

        this._download_commitments = DataThing.backends.useractionhandler({
            url: 'download_commitments',
        });

        Observer.register(events.get('download_commitments'), () => {
            this._download_commitments({
                data: {
                    commitment_plan_uid: this.commitment_plan_uid(),
                    portfolio_uid: this.portfolio_uid(),
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        });

        Observer.register(events.get('append_commitments'), () => {
            bison.helpers.close_modal(this.get_id());
        });

        Observer.register(events.get('replace_commitments'), () => {
            bison.helpers.close_modal(this.get_id());
        });
        this.when(this.table, this.append_button, this.download_button).done(() => {
            _dfd.resolve();
        });
    }
}
export default CommitmentsModal;
