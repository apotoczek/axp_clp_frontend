/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Mapping from 'src/libs/Mapping';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    opts = opts || {};

    self.color = opts.color;

    self.mapping_fn = Mapping.gen_mapping(opts);

    self.mapped = ko.computed(() => {
        let data = self.data();
        if (data) {
            let mapped;

            if (self.mapping_fn) {
                mapped = self.mapping_fn(data);
            } else {
                mapped = {...data};
            }

            mapped.color = self.color;

            return mapped;
        }
    });

    return self;
}
