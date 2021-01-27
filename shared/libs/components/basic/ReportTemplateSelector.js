/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_h_top_template_selector';
    self.title = opts.title;
    self.title_css = opts.title_css;
    self.report_template = opts.templates;

    return self;
}
