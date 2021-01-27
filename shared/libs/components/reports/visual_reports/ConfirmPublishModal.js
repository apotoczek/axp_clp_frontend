/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Observer from 'src/libs/Observer';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    let frozen_report_img = require('src/img/Frozen_report.svg');
    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Are you done?</h4>
                        </div>
                        <div class="modal-body">
                            <div style="text-align: center;">
                                <img src="${frozen_report_img}" style="margin-bottom:20px;"/>
                                <p class="lead">Finishing this report will freeze all data and you will
                            not be able to edit anything afterwards.</p>
                            </div>
                            <div style="height: 34px;">
                                <button class="btn btn-success pull-right" data-bind="click: confirm">Confirm</button>
                                <button class="btn btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.confirm_event = opts.confirm_event;

    self.confirm = function() {
        if (self.confirm_event) {
            Observer.broadcast(self.confirm_event);
        }
        self.reset();
    };

    self.cancel = function() {
        self.reset();
    };

    return self;
}
