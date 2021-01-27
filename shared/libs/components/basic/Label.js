/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.label = opts.label;
    self.css = opts.css || {};

    _dfd.resolve();

    return self;
}
