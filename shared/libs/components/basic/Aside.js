/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';

export default class Aside extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.css = opts.css;
        this.title = opts.title;
        this.title_css = opts.title_css;
        this.visible = ko.observable(opts.visible === undefined ? true : opts.visible);
        this.visible_event = opts.visible_event;
        this.visible_event_fn = opts.visible_event_fn || (a => a);
        this.asides = opts.asides;

        if (this.visible_event) {
            Observer.register(this.visible_event, visibility => {
                this.visible(visibility);
            });
        }

        _dfd.resolve();
    }
}
