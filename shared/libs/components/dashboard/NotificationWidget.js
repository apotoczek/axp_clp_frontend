/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ContactSupportModal from 'src/libs/components/modals/ContactSupportModal';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    // title is not used ??
    self.title = ko.computed(() => {
        if (self.data() && self.data().title) {
            return self.data().title;
        }
    });

    self.description = ko.computed(() => {
        if (self.data() && self.data().description) {
            return self.data().description;
        }
    });

    self.contact_modal = self.new_instance(ContactSupportModal, {
        get_user: true,
    });

    self.show_contact_modal = function() {
        self.contact_modal.show();
    };

    // default template is not okay??
    self.template = opts.template || 'tpl_activity_widget_report';

    self.dfd.resolve();
    return self;
}
