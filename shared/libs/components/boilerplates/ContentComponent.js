/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import HTMLContent from 'src/libs/components/basic/HTMLContent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();

    self.events = self.new_instance(EventRegistry, {});

    self.content = self.new_instance(HTMLContent, {
        id: 'content',
        html: '<h1>Content</h1>',
    });

    self.define_default_template(`
            <!-- ko renderComponent: content --><!-- /ko -->
        `);

    self.when(self.content).done(() => {
        self.dfd.resolve();
    });

    return self;
}
