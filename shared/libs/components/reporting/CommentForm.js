import DataThing from 'src/libs/DataThing';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

import ko from 'knockout';

import CommentInput from 'src/libs/components/reporting/CommentInput';

class CommentList extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.formatters = {
            date: Formatters.backend_local_datetime,
        };

        this.comments = this.data;

        this.define_template(`
            <!-- ko foreach: comments -->
                <div class="reporting-comment">
                    <div class="reporting-comment-header">
                        {{ $parent.formatters.date(created) }} - {{ name }} - {{ client_name }}
                    </div>
                    <div class="reporting-comment-body" data-bind="html: body"></div>
                </div>
            <!-- /ko -->
        `);
    }
}

export default class CommentForm extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.uid = ko.observable();
        this.uid_key = opts.uid_key || 'submission_uid';
        this.add_comment_endpoint =
            opts.add_comment_endpoint ||
            DataThing.backends.reporting({
                url: 'actions/add-comment',
            });

        this.send_btn_text = opts.send_btn_text || 'Add comment';

        this.comments_datasource = opts.comments_datasource || {
            type: 'dynamic',
            query: {
                target: 'reporting/submission-comments',
                submission_uid: {
                    type: 'placeholder',
                    required: true,
                },
            },
        };

        this.input = this.new_instance(CommentInput, {
            max_length: 1000,
            placeholder: opts.placeholder,
        });

        this.has_comment = ko.pureComputed(() => {
            return this.input.comment().length > 0;
        });

        this.comments = this.new_instance(CommentList, {
            datasource: this.comments_datasource,
        });

        this.uid.subscribe(uid => {
            this.comments.update_query({[this.uid_key]: uid});
        });

        this.define_template(`
            <!-- ko renderComponent: comments --><!-- /ko -->
            <!-- ko renderComponent: input --><!-- /ko -->
            <button
                type="button" class="btn btn-sm btn-success pull-left"
                style="margin-top: 10px;"
                data-bind="click: add_comment, enable: has_comment"
            >
                {{{ send_btn_text }}}
            </button>
        `);
    }

    add_comment() {
        this.add_comment_endpoint({
            data: {
                [this.uid_key]: ko.unwrap(this.uid),
                body: this.input.comment(),
            },
            success: DataThing.api.XHRSuccess(() => {
                this.input.reset();
                DataThing.status_check();
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    }
}
