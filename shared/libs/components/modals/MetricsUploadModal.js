import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import UploadButton from 'src/libs/components/upload/UploadButton';
import Observer from 'src/libs/Observer';
import EventRegistry from 'src/libs/components/basic/EventRegistry';

const upload_endpoint = 'data-collection/upload/metrics';
const template = `
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-body">
        <div class="container" style="width: 100%; border: 2px dashed #bbb; border-radius: 6px; padding:30px;">
          <!-- ko ifnot: $data.has_response -->
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

class MetricsUploadModal extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);
        this.events = this.new_instance(EventRegistry, {});

        this.define_template(template);
        const _dfd = this.new_deferred();

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
            label: 'Select a file...',
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
        });

        Observer.register(broadcast_error, r => {
            this.response({
                message: r.message,
                error: true,
            });
        });
    }

    show() {
        this.response(null);
        bison.helpers.modal(this.template, this, this.get_id());
    }

    reset() {
        bison.helpers.close_modal(this.get_id());
        this.loading(false);
    }
}

export default MetricsUploadModal;
