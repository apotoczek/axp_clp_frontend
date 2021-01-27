/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import bison from 'bison';
import config from 'config';
import Cookies from 'js-cookie';
import 'blueimp-file-upload';

ko.bindingHandlers.fileupload = {
    init: function(element, valueAccessor) {
        let options = ko.unwrap(valueAccessor());

        let max_file_size = options.max_size || 16777216; // 16MB
        let enableChunks = options.enableChunks || false;

        const file_upload = {
            add: function(e, file) {
                let data;
                if (options.data) {
                    data = ko.toJS(options.data);
                } else {
                    data = {};
                }

                if (file && file.files && file.files.length > 0) {
                    if (file.files[0].size > max_file_size) {
                        bison.utils.Notify(
                            'Heads up!',
                            'The file is too large. Please try again with a smaller file.',
                            'alert-danger',
                        );
                        if (typeof options.uploading === 'function') {
                            options.uploading(false);
                        }
                        return false;
                    }

                    let request = function(args) {
                        if (typeof options.uploading === 'function') {
                            options.uploading(true);
                        }
                        file.formData = {...args.data, ...data};

                        let token = Cookies.get(config.csrf.cookie_name);

                        if (token) {
                            file.beforeSend = function(xhr) {
                                xhr.setRequestHeader(config.csrf.header_name, token);
                            };
                        }

                        return file
                            .submit()
                            .fail(args.error)
                            .done(args.success);
                    };

                    return request({
                        error: options.error,
                        success: options.success,
                        data: {},
                    });
                }
                return false;
            },
            stop: function() {
                if (typeof options.done_callback === 'function') {
                    options.done_callback();
                }
            },
            xhrFields: {
                withCredentials: true,
            },
            autoUpload: true,
            url: options.url,
            dataType: 'json',
            redirect: `${config.base_url}result.html?%s`,
        };

        if (enableChunks) {
            file_upload.maxChunkSize = 10000000; // 10Mb
        }
        $(element).fileupload(file_upload);

        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            $(element).fileupload('destroy');
        });
    },
};
