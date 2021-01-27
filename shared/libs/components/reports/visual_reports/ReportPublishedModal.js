/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Observer from 'src/libs/Observer';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Your report is ready!</h4>
                        </div>
                        <div class="modal-body">
                            <div style="text-align: center;">

                                <p class="lead">Download it now, or come back any time and download it from the export menu in the toolbar.</p>
                            </div>
                            <div style="height: 34px; text-align:center">
                                <button class="btn btn-success" data-bind="click: download"><span class="glyphicon glyphicon-download"></span>Download</button>
                                <button class="btn btn-ghost-default" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.download_pdf_event = opts.download_pdf_event;

    self.download = function() {
        if (self.download_pdf_event) {
            Observer.broadcast(self.download_pdf_event);
        }
        self.reset();
    };

    self.cancel = function() {
        self.reset();
    };

    return self;
}
