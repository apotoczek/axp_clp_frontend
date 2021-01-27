/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4 data-bind="text: text"></h4>
                            </div>
                            <div class="modal-body">
                                <div style="height: 34px;">
                                    <button class="btn btn-success pull-right" data-bind="click: click_event, text: confirm_button_text"></button>
                                    <button class="btn btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel, text: cancel_button_text"></button>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        `);

    self.text = opts.text || 'Are you sure?';
    self.confirm_button_text = opts.confirm_button_text || 'Confirm';
    self.cancel_button_text = opts.cancel_button_text || 'Cancel';

    if (opts.payload_from_data) {
        self.payload = self.data;
    } else {
        self.payload = ko.observable(opts.payload);
    }

    self.confirm_event = opts.confirm_event;

    self.click_event = function() {
        Observer.broadcast(self.confirm_event, self.payload());
        self.reset();
    };

    self.cancel = function() {
        self.reset();
    };

    return self;
}
