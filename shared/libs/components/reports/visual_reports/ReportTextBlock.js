/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_template(`
            <div class="report-text-block">
                <div class="editing-form clearfix">
                    <textarea
                        class="form-control text-countdown"
                        style="resize:none;"
                        placeholder="Add a description..."
                        data-bind="
                            textInput: text_body,
                            attr: { rows: rows, maxlength: max_length},
                            disable: mode() == 'automatic'
                            ">
                    </textarea>
                    <p
                        class="countdown pull-left"
                        data-bind="countdown: text_body, max_length: max_length">
                    </p>
                    <div data-bind="ifnot: locked_mode" class="pull-right report-text-block-mode-switcher">
                        <input
                            type="button"
                            class="btn"
                            data-bind="
                                value: edit_button_text,
                                click: toggle_mode,
                                css: {
                                    'btn-success': mode() == 'automatic',
                                    'btn-default': mode() == 'manual'
                                }
                            " />
                    </div>
                </div>
            </div>
        `);

    /**
     * Can be either 'manual' or 'automatic'. If set to 'manual', the user is allowed
     * to edit the text body manually, if 'automatic' is set, the text body is taken
     * from the text_body_provider supplied.
     * "locked_mode" disabled the button that switches modes.
     * @type {string}
     */
    self.mode = ko.observable(opts.mode || 'manual');
    self.locked_mode = opts.locked_mode || false;

    /**
     * Supplies the report text block with a text body that can change from
     * outside the report text block on events etc. Note that this is only used if
     * mode is set to 'automatic'.
     * @type {Observable}
     */
    self.text_body_provider = opts.text_body_provider || undefined;

    // Holds the content that the user can modify in manual mode
    self._text_body_content = ko.observable(undefined);

    /**
     * Maximum number of characters allowed in the text body input field.
     * @type {int}
     */
    self.max_length = opts.max_length || 250;
    self.rows = opts.rows || Math.ceil(self.max_length / 100);

    self.reset = function() {
        self._text_body_content(undefined);
    };

    self.text_body = ko.pureComputed({
        write: value => {
            if (self.mode() != 'manual') {
                throw 'Cannot write to text body during automatic mode';
            }

            self._text_body_content(value || '');
        },
        read: () => {
            if (self.mode() == 'automatic' || self._text_body_content() == undefined) {
                if (ko.isObservable(self.text_body_provider)) {
                    return Utils.unescape_html(self.text_body_provider() || '');
                } else if (Utils.is_set(self.text_body_provider)) {
                    return Utils.unescape_html(self.text_body_provider);
                }
            }

            return Utils.unescape_html(self._text_body_content() || '');
        },
    });

    self.edit_button_text = ko.pureComputed(
        () => `${self.mode() == 'automatic' ? 'Enter' : 'Exit'} manual mode`,
    );

    self.toggle_mode = function() {
        self.mode(self.mode() == 'automatic' ? 'manual' : 'automatic');
    };

    _dfd.resolve();

    return self;
}
