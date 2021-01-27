import ko from 'knockout';
import config from 'config';
import bison from 'bison';
import auth from 'auth';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PCWWidgetWrapper from 'src/libs/components/upload/PCWWidgetWrapper';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import * as Utils from 'src/libs/Utils';
import 'src/libs/bindings/fileupload';

class SpreadsheetUploadWizard extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
        <div class="modal fade">
          <div class="modal-dialog modal-xl">
            <div class="spreadsheet-modal">
              <div class="spreadsheet-modal-header">
                <h2>Upload Spreadsheets</h2>
                <i class="close icon-cancel-circled" data-bind="click: close"></i>
              </div>
              <div class="spreadsheet-modal-body">
                <!-- ko if: user_has_dual_upload_permission -->
                <div class="spreadsheet-modal-upload-target">
                  <p>
                    Choose an upload option to continue.
                  </p>

                  <a class="btn btn-default fileinput-button" data-bind="css: { disabled: uploading }">
                    <!-- ko if: uploading -->
                    <span class="glyphicon glyphicon-cog animate-spin">
                    </span> Uploading
                    <!-- /ko -->
                    <!-- ko ifnot: uploading -->
                    <span class="glyphicon glyphicon-upload"></span>
                    Choose Standard File
                    <!-- /ko -->
                    <input type="file" name="file" data-bind="fileupload: upload_options" multiple>
                  </a>

                  <a class="btn btn-default fileinput-button" data-bind="css: { disabled: uploading }">
                    <!-- ko if: uploading -->
                    <span class="glyphicon glyphicon-cog animate-spin">
                    </span> Uploading
                    <!-- /ko -->
                    <!-- ko ifnot: uploading -->
                    <span class="glyphicon glyphicon-upload"></span>
                    Choose Combined Net/Gross File
                    <!-- /ko -->
                    <input type="file" name="file" data-bind="fileupload: dual_upload_options" multiple>
                  </a>
                </div>
                <!-- /ko -->
                <!-- ko ifnot: user_has_dual_upload_permission -->
                <div class="spreadsheet-modal-upload-target">
                  <p>
                    Browse for
                    spreadsheets to upload
                  </p>
                  <a class="btn btn-default fileinput-button" data-bind="css: { disabled: uploading }">
                    <!-- ko if: uploading -->
                    <span class="glyphicon glyphicon-cog animate-spin">
                    </span> Uploading
                    <!-- /ko -->
                    <!-- ko ifnot: uploading -->
                    <span class="glyphicon glyphicon-upload"></span>
                    Choose File
                    <!-- /ko -->
                    <input type="file" name="file" data-bind="fileupload: upload_options" multiple>
                  </a>
                </div>
                <!-- /ko -->
                <!-- ko ifnot: uploaded().length -->
                <div class="spreadsheet-modal-before-you-start">
                  <table class="callout-table callout-info">
                    <tr>
                      <td class="callout-icon">
                        <span class="icon-info">
                          <div class="callout-line"></div>
                        </span>
                      </td>
                      <td>
                        <table>
                          <tr>
                            <td>
                              <p class="lead" style="margin-bottom: 0px;">
                                Before you start
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p>Our system will recognize your funds much better if you use our cashflow
                                templates</p>
                              <a target="_blank" href="{{data_templates()}}" role='button' class="btn btn-info"><span
                                  class="glyphicon glyphicon-save" style="padding-right:10px;"></span>Download Templates</a>
                            </td>
                            <td>
                              <p>Check your file type, make sure it is .xls or .csv</p>
                              <img attr.src="{{callouts.xls}}"" width=" 55px">
                              <img attr.src="{{callouts.csv}}" width="55px">
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- /ko -->

                <!-- ko foreach: uploaded -->
                  <!-- ko renderComponent: $data --><!--/ko -->
                <!-- /ko -->

              </div>
            </div>
          </div>
        </div>

        `);

        this.callouts = {
            xls: require('src/img/callout-xls.png'),
            csv: require('src/img/callout-csv.png'),
        };
        this.data_templates = () => {
            if (__DEPLOYMENT__ == 'hl') {
                return require('src/data/cobalt_data_templates_lp.zip');
            }
            return require('src/data/cobalt_data_templates.zip');
        };
        this.uploading = ko.observable(false);
        this.uploaded = ko.observableArray([]);
        this.upload_success_event =
            opts.upload_success_event ||
            Utils.gen_event('SpreadsheetUploadWizard.upload_success', this.get_id());

        this._saved_spreadsheet_states = DataThing.backends.dataprovider({
            url: 'saved_spreadsheet_states',
        });

        this.user_has_dual_upload_permission = ko.pureComputed(() => {
            return auth.user_has_feature('dual_gross_net_upload');
        });

        this.dual_upload_options = {
            uploading: this.uploading,
            url: `${config.api_base_url}upload/dual-spreadsheet`,
            data: {},
            success: DataThing.api.XHRSuccess(() => {
                bison.helpers.close_modal(this.get_id());
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
            done_callback: function() {
                this.uploading(false);
            },
        };

        this.upload_options = {
            uploading: this.uploading,
            url: `${config.api_base_url}upload/spreadsheet`,
            data: {},
            success: DataThing.api.XHRSuccess(({sheets, filename}) => {
                this.uploaded.push(
                    ...sheets.map(sheet => this.uploaded_item_widget(sheet, filename)),
                );
            }),
            error: DataThing.api.XHRError(() => {}),
            done_callback: function() {
                this.uploading(false);
            },
        };

        _dfd.resolve();

        return this;
    }

    show() {
        bison.helpers.modal(null, this, this.get_id());

        this._saved_spreadsheet_states({
            data: {},
            success: DataThing.api.XHRSuccess(sheets => {
                this.uploaded.push(
                    ...sheets.map(sheet => this.uploaded_item_widget(sheet, sheet.filename)),
                );
            }),
        });
    }

    reset() {
        this.uploading(false);
        this.uploaded([]);
    }

    close() {
        bison.helpers.close_modal(this.get_id());
    }

    upload_success(payload) {
        Observer.broadcast(this.upload_success_event, payload);
    }

    uploaded_item_widget(data, filename) {
        let widget = new PCWWidgetWrapper({
            filename: filename,
        });

        widget.handle_required_action(data);

        Observer.register_for_id(
            widget.get_id(),
            'PCWWidgetWrapper.upload_success',
            this.upload_success.bind(this),
        );
        Observer.register_for_id(
            widget.get_id(),
            'PCWWidgetWrapper.navigating',
            this.close.bind(this),
        );
        Observer.register_for_id(widget.get_id(), 'remove_sheet', this.remove_sheet.bind(this));
        Observer.register_for_id(widget.get_id(), 'close_modal', this.close.bind(this));

        return widget;
    }

    remove_sheet(id) {
        this.uploaded.remove(uploaded => {
            return uploaded.get_id() === id;
        });
    }
}

export default SpreadsheetUploadWizard;
