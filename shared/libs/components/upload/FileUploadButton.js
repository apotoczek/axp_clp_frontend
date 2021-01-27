/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';
import ErrorUploadModal from 'src/libs/components/modals/ErrorUploadModal';
import SuccessUploadModal from 'src/libs/components/modals/SuccessUploadModal';
import 'src/libs/bindings/fileupload';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_file_upload_button';

    self.uploading = ko.observable(false);

    self.success_keys = opts.success_keys;

    self.upload_endpoint = opts.upload_endpoint;
    self.confirm_endpoint = opts.confirm_endpoint;
    self.cancel_endpoint = opts.cancel_endpoint;

    self.css = opts.css;
    self.max_size = opts.max_size;
    self.display_module = opts.display_module !== false;
    self.enableChunks = opts.enableChunks;
    self.allow_include_names = opts.allow_include_names;

    self.error_modal = self.new_instance(ErrorUploadModal, {
        id: 'error_upload_modal',
    });

    self.success_modal = self.new_instance(SuccessUploadModal, {
        id: 'success_upload_modal',
        success_keys: self.success_keys,
        confirm_endpoint: self.confirm_endpoint,
        cancel_endpoint: self.cancel_endpoint,
        allow_include_names: self.allow_include_names,
    });

    self.label = ko.observable(opts.label);
    self.upload_options = {
        url: config.api_base_url + self.upload_endpoint,
        data: self.data,
        uploading: self.uploading,
        max_size: self.max_size,
        display_module: self.display_module,
        enableChunks: self.enableChunks,
        label: 'Upload Spreadsheet',
        success: DataThing.api.XHRSuccess(data => {
            self.uploading(true);
            if (data) {
                if (data.success) {
                    self.success_modal.data(data);
                    if (self.display_module) {
                        self.success_modal.show();
                    }
                } else {
                    self.error_modal.data(data);
                    self.error_modal.show();
                }
                self.uploading(false);
            }
        }),
        error: DataThing.api.XHRError(data => {
            self.uploading(false);
            alert(data);
        }),
    };

    return self;
}
