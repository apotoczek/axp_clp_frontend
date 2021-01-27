/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import * as Utils from 'src/libs/Utils';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 data-bind="text: text"></h4>
                        </div>
                        <div class="modal-body">
                            <form>
                                <textarea size="500" maxlength="255" style="resize:none;width:100%; height:125px;" placeholder="Type Your Message" data-bind="textInput: body_text" class="form-control input-sm"></textarea>
                                <div class="clearfix">
                                <button class="btn btn-sm btn-cpanel-success pull-right" style="margin-top:5px;margin-bottom:5px;" data-bind="click: submit">Send Request</button>
                                <button class="btn btn-sm btn-default pull-right" style="margin-top:5px;margin-bottom:5px; margin-right:10px;" data-bind="click: cancel">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.text = opts.text || 'Contact Customer Success';
    self.dfd = self.new_deferred();
    self.body_text = ko.observable();

    self.cancel = function() {
        self.reset();
    };

    self.submit_endpoint = DataThing.backends.useractionhandler({
        url: 'support_form',
    });

    self.submit = function() {
        let pixel_ratio = window.devicePixelRatio || 1;
        let resolution;

        if (screen && screen.width && screen.height) {
            resolution = `${screen.width * pixel_ratio}x${screen.height * pixel_ratio}`;
        }

        let data = {
            text: self.body_text(),
            url: window.location.href,
            browser: Utils.browser(),
            dimensions: `${window.innerWidth}x${window.innerHeight}`,
            pixel_ratio: pixel_ratio,
            resolution: resolution,
            os: Utils.os(),
        };

        if (DataThing.errors.length) {
            data.errors = DataThing.errors;
        }

        self.submit_endpoint({
            data: data,
            success: DataThing.api.XHRSuccess(() => {
                self.clear();
                self.reset();
                bison.utils.Notify(
                    'Submitted!',
                    "Your message has been sent and you'll be contacted shortly.",
                    'alert-success',
                );
            }),
        });

        self.close();
    };

    self.dfd.resolve();

    return self;
}
