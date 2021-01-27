/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default class HTMLContent extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        if (!opts.custom_template) {
            this.template = opts.template || 'tpl_html_content';
        } else {
            this.define_default_template(opts.custom_template);
        }

        this.visible = opts.visible || ko.observable(true);
        this.visible_event = opts.visible_event;
        this.css = opts.css;

        if (this.visible_event) {
            Observer.register(this.visible_event, data => {
                this.visible(!!data);
            });
        }

        if (ko.isObservable(opts.html)) {
            this.html = opts.html;
        } else {
            this.html = ko.observable(opts.html);
        }
    }
}
