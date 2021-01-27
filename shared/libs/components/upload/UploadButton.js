/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import 'src/libs/bindings/fileupload';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_upload_button';
    self.label = ko.observable(opts.label || 'Upload Spreadsheet');

    self.uploading = ko.observable(false);

    self.upload_endpoint = opts.upload_endpoint;

    self.broadcast_success = opts.broadcast_success;
    self.broadcast_error = opts.broadcast_error;

    self.css = opts.css || {
        btn: true,
        'btn-sm': true,
        'btn-cpanel-success': true,
        'fileinput-button': true,
    };

    self.upload_options = {
        url: config.api_base_url + self.upload_endpoint,
        data: self.data,
        uploading: self.uploading,
        label: self.label,
        success: DataThing.api.XHRSuccess(data => {
            self.uploading(false);
            if (self.broadcast_success && !data.error) {
                Observer.broadcast(self.broadcast_success, data);
            } else {
                Observer.broadcast(self.broadcast_error, data);
            }
        }),
        error: DataThing.api.XHRError(data => {
            self.uploading(false);
            if (self.broadcast_error) {
                Observer.broadcast(self.broadcast_error, data);
            }
        }),
    };
    return self;
}
