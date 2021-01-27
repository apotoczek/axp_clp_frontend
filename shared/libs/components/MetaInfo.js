/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_meta_info';

    self.css = opts.css || {};

    self.formatter = Formatters.gen_formatter(opts);

    self.label = opts.label || 'Results';

    self.count = ko.computed(() => {
        return self.formatter(self.data());
    });

    return self;
}
