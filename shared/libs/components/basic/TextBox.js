/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.define_template(`
            <h3 data-bind="text:value" style="display:inline-block"></h3>
        `);

    self.css = opts.css || {};

    self.value = ko.computed(() => {
        return self.data();
    });

    return self;
}
