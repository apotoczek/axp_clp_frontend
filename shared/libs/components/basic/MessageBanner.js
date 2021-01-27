import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

/**
 * Component for conditionally displaying a message under the toolbar.
 * @extends BaseComponent
 */
export default class MessageBanner extends BaseComponent {
    /**
     * @param {Object} opts - Component Options
     * @param {string} opts.message - Text to display
     * @param {boolean} opts.active - Whether or not message should be shown.
     * @param {boolean} opts.warning - Display message as warning.
     */
    constructor({active, message, warning, ...opts}, components = {}) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this.define_template(`
            <div class="message-banner" data-bind="css: css">
            ${message}
            </div>
        `);

        this.active = ko.isObservable(active) ? active : ko.observable(active || false);

        this.css = ko.pureComputed(() => ({
            active: this.active(),
            warning: warning,
        }));

        _dfd.resolve();
    }
}
