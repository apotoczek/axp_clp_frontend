import CommentForm from 'src/libs/components/reporting/CommentForm';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataThing from 'src/libs/DataThing';
import * as Formatters from 'src/libs/Formatters';

class ViewDataRequestModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        this.action = opts.action || 'to';

        this.comment_form = this.new_instance(CommentForm, {
            uid_key: 'data_request_uid',
            placeholder: 'Send a message...',
            send_btn_text: 'Send',
            add_comment_endpoint: DataThing.backends.reporting({
                url: 'actions/add-request-comment',
            }),
            comments_datasource: {
                type: 'dynamic',
                query: {
                    target: 'reporting/data-request-comments',
                    data_request_uid: {
                        type: 'placeholder',
                        required: true,
                    },
                },
            },
        });

        this.formatters = {
            date: Formatters.backend_date,
        };

        this.define_template(`
            <div class="modal fade">
                <div class="modal-dialog modal-xl">
                    <div class="data-collection-modal">
                        <div class="data-collection-modal-header">
                            <h2 data-bind="with: data">
                                Data request {{ $parent.action }} {{ client_name }}
                            </h2>
                            <i class="close icon-cancel-circled" data-dismiss="modal"></i>
                        </div>
                        <div class="data-collection-modal-body">
                            <div class="data-collection-modal-section no-margin">
                                <h3 data-bind="with:data">
                                    Issued on {{ $parent.formatters.date(created) }}
                                </h3>
                                <p class="text-muted" data-bind="with:data">
                                    The request is for data as of {{ $parent.formatters.date(as_of_date) }}
                                    and is due on {{ $parent.formatters.date(due_date) }}
                                </p>
                                {{ #renderComponent comment_form/ }}
                            </div>
                            <div class="data-collection-modal-buttons">
                                <button
                                    type="button"
                                    data-dismiss="modal"
                                    class="btn btn-default pull-right"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    open(data_request) {
        this.data(data_request);
        this.comment_form.uid(data_request.uid);
        this.show();
    }
}

export default ViewDataRequestModal;
