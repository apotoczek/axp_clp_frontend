/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_report_toc';

    self.toc = opts.toc;

    _dfd.resolve();

    return self;
}
