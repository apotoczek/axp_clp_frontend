/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.css = opts.css || {};

    self.modal = ko.observable();

    self.modal_dfd = self.init_component(opts.modal, self.modal);

    self.show_modal_event = opts.show_modal_event;

    self.show_modal = function() {
        if (self.modal()) {
            self.modal().show();
        }
    };

    return self;
}
