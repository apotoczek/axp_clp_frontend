/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import Observer from 'src/libs/Observer';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import * as Utils from 'src/libs/Utils';

export default class PopoverRadioButton extends NewPopoverButton {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const _dfd = this.new_deferred();

        this.default_state = opts.default_state || false;

        this.state = ko.observable(this.default_state);

        this.css = ko.pureComputed(() => {
            const css = Utils.ensure_css_object(this._css);

            css.disabled = this.loading() || this.disabled();
            css.modified = this.modified();
            css.active = !!this.state();

            return css;
        });

        this.reset_event = opts.reset_event;

        if (this.reset_event) {
            Observer.register(this.reset_event, () => {
                this.state(false);
            });
        }

        _dfd.resolve();
    }

    click() {
        if (!this.state()) {
            this.state(true);
        }

        Observer.broadcast_for_id(this.get_id(), 'PopoverRadioButton.state', this.state());
    }
}
