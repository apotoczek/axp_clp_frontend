import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import UploadButton from 'src/libs/components/upload/UploadButton';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import TextInput from 'src/libs/components/basic/TextInput';
import DataThing from 'src/libs/DataThing';

const upload_endpoint = 'useractionhandler/upload_commitments';

const template = `
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
   <div class="modal-dialog modal-lg">
      <div class="modal-content">
         <div class="modal-body">
            <div class="container" style="width: 100%; border: 2px dashed #bbb; border-radius: 6px; padding:30px;">
                <!-- ko if: $data.new_mode -->
                    <table class="callout-table callout-info">
                        <tr>
                            <td class="callout-icon">
                                <span class="glyphicon glyphicon-ok">
                            </td>
                            <td>
                                <table class="new-world-form" style="table-layout: fixed; width: 50%;">
                                    <tr>
                                        <td>
                                            <!-- ko renderComponent: $data.name_input --><!-- /ko -->
                                        </td>
                                    </tr>
                                </table>
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <p class="lead">
                                                <span>Please provide a name for your commitment plan</span>
                                            </p>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-confirm" data-bind="click: finish, disable: loading()">
                                                Continue
                                                <span class="glyphicon glyphicon-ok pull-left" style="color:#fff;"></span>
                                            </button>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                <!-- /ko -->
                <!-- ko ifnot: $data.new_mode -->
                    <!-- ko ifnot: $data.has_response -->
                        <div class="row">
                            <h2 style="text-align: center", data-bind="html: upload_description_text"></h2>
                        </div>
                        <div class="row">
                            <h2 style="text-align: center">Drag and Drop</h2>
                        </div>
                        <div class="row">
                            <h3 style="text-align: center; padding: 20px 0 30px 0;">or</h3>
                        </div>
                        <div class="row">
                            <div class="col-md-4 col-sm-offset-4" style="margin-bottom: 34px">
                                <!-- ko renderComponent: $data.upload_button --><!-- /ko -->
                            </div>
                        </div>
                    <!-- /ko -->
                    <!-- ko if: $data.has_response -->
                    <!-- ko with: $data.response -->
                        <div class="row">
                            <h4 style="text-align: center">
                                <!-- ko ifnot: error -->
                                <span class="glyphicon glyphicon-ok text-success" style="font-size:19px; padding:30px; padding-right:10px;"></span>
                                The upload of file '<span style="font-family:Courier" data-bind="text: filename" />'
                                was successful!
                                <!-- /ko -->
                                <!-- ko if: error -->
                                <span class="glyphicon glyphicon-remove text-danger" style="font-size:19px; padding:30px; padding-right:10px;"></span>
                                The upload of was unsuccessful.
                                <!-- /ko -->
                            </h4>
                        </div>
                        <div class="row" style="text-align: center">
                            <!-- ko if: error -->
                            <h4 style="color: darkred" data-bind="text: message" />
                            <!-- /ko -->
                        </div>
                        <div class="row">
                            <!-- ko if: error -->
                            <div class="form-group pull-right" style="padding-right: 12px">
                                <button class="btn btn-ghost-default" data-bind="click: $parent.reset_response">Try Again</button>
                                <button class="btn btn-ghost-default" data-dismiss="modal">Close</button>
                            </div>
                            <!-- /ko -->
                            <!-- ko ifnot:error -->
                            <div class="text-center" style="margin-top:30px"><button class="btn btn-success" data-dismiss="modal">Done</button></div>
                            <!-- /ko -->
                        </div>
                    <!-- /ko -->
                    <!-- /ko -->
                <!-- /ko -->
            </div>
         </div>
      </div>
   </div>
</div>
`;

const upload_button_css = {
    btn: true,
    'btn-lg': true,
    'btn-success': true,
    'fileinput-button': true,
};

class CommitmentUploadModal extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        const _dfd = this.new_deferred();

        this.events = this.new_instance(EventRegistry, {});
        this.define_template(template);
        this.portfolio_uid_event = opts.vehicle_uid_event;

        this.portfolio_uid = Observer.observable(this.portfolio_uid_event);

        this.commitment_plan_name_event = opts.commitment_plan_name_event;

        if (this.commitment_plan_name_event) {
            this.commitment_plan_name = Observer.observable(this.commitment_plan_name_event);
        }

        this.commitment_plan_uid_event = opts.commitment_plan_uid_event;

        if (this.commitment_plan_uid_event) {
            this.commitment_plan_uid = Observer.observable(this.commitment_plan_uid_event);
        }

        this.mode = ko.observable(opts.mode);

        this.entity_name = ko.observable('');

        this.new_mode = ko.pureComputed(() => {
            return this.entity_name().isEmpty() && this.mode() == 'new';
        });

        this.response = ko.observable(null);
        this.has_response = ko.computed(() => {
            let response = this.response();
            return response != null;
        });

        this.events.new('upload_success');
        this.events.new('upload_error');

        this.register_events();
        this.create_components();
        this.reset_response = () => {
            this.response(null);
        };

        this.selected = ko.pureComputed(() => {
            const data = this.data();
            if (data && data.length > 0) {
                return {
                    uid: data[0].uid,
                    name: data[0].name,
                };
            }
            return {};
        });

        this.plan_name = ko.pureComputed(() => {
            if (this.commitment_plan_name_event) {
                return this.commitment_plan_name();
            } else if (this.entity_name()) {
                return this.entity_name();
            } else if (this.selected()) {
                return this.selected().name;
            }
        });

        this.upload_description_text = ko.pureComputed(() => {
            const plan_name = this.plan_name();
            switch (this.mode()) {
                case 'new':
                    return `Upload commitments to <b>${plan_name}</b>`;
                case 'append':
                    return `Append commitments to <b>${plan_name}</b>`;
                case 'replace':
                    return `Replace commitments of <b>${plan_name}</b>`;
                default:
                    return '';
            }
        });

        _dfd.resolve();
    }

    create_components() {
        let broadcast_success = this.events.get('upload_success');
        let broadcast_error = this.events.get('upload_error');

        this.upload_button = this.new_instance(UploadButton, {
            upload_endpoint,
            broadcast_success,
            broadcast_error,
            css: upload_button_css,
            uploading: this.uploading,
            data: ko.pureComputed(() => {
                const name = this.entity_name();
                let uid = '';
                if (this.commitment_plan_uid_event) {
                    uid = this.commitment_plan_uid;
                } else {
                    uid = this.selected().uid;
                }
                return {
                    name: name,
                    uid: uid,
                    portfolio_uid: this.portfolio_uid,
                    mode: this.mode(),
                };
            }),
            label: 'Select a file...',
        });

        this.name_input = this.new_instance(TextInput, {
            placeholder: 'Name of commitment plan',
        });
    }

    register_events() {
        let broadcast_success = this.events.get('upload_success');
        let broadcast_error = this.events.get('upload_error');

        Observer.register(broadcast_success, r => {
            this.response({
                filename: r.filename,
                warnings: r.warnings,
                error: r.error,
            });
            DataThing.status_check();
        });

        Observer.register(broadcast_error, r => {
            this.response({
                message: r.message,
                error: true,
            });
        });
    }

    finish() {
        const name = this.name_input.value();
        this.entity_name(name);
    }

    show() {
        this.response(null);
        bison.helpers.modal(this.template, this, this.get_id());
    }

    reset() {
        bison.helpers.close_modal(this.get_id());
        this.loading(false);
        this.entity_name('');
        this.name_input.clear();
    }
}

export default CommitmentUploadModal;
