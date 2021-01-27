/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 data-bind="html: text"></h4>
                        </div>
                        <div class="modal-body">
                            <div style="height: 34px;">
                                <button class="btn btn-danger pull-right" data-bind="click: click_event, text: btn_text"></button>
                                <button class="btn btn-default pull-right" style="margin-right:10px;" data-bind="click: cancel">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.btn_text = opts.button_text || 'Delete';

    self.text = opts.text || 'Are you sure?';

    self.payload = ko.observable(opts.payload);

    self.confirm_delete_event = opts.confirm_delete_event;

    self.click_event = function() {
        Observer.broadcast(self.confirm_delete_event, self.payload());
        self.reset();
    };

    self.cancel = function() {
        self.reset();
    };

    return self;
}
