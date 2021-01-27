import BaseComponent from 'src/libs/components/basic/BaseComponent';

import ko from 'knockout';

export default class CommentInput extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.placeholder = opts.placeholder || 'Add a comment...';
        this.max_length = opts.max_length;
        this.rows = opts.rows || 4;

        this.disabled = ko.observable(opts.disabled || false);

        if (ko.isObservable(opts.comment)) {
            this.comment = opts.comment;
        } else {
            this.comment = ko.observable(opts.comment || '');
        }

        this.define_template(`
            <textarea
                class="form-control reporting-comment-text-area"
                style="resize:none;"
                data-bind="
                    textInput: comment,
                    attr: { maxlength: max_length, rows: rows, placeholder: placeholder },
                    disable: disabled
                "
            >
            </textarea>
            <!-- ko if: max_length -->
            <p
                class="countdown pull-right"
                data-bind="countdown: comment, max_length: max_length">
            </p>
            <!-- /ko -->
        `);
    }

    reset() {
        this.comment('');
    }
}
