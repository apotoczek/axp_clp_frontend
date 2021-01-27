import BaseModal from 'src/libs/components/basic/BaseModal';
import bison from 'bison';
import 'src/libs/bindings/react';

import BulkDiligenceUpload from 'src/libs/react/components/upload/BulkDiligenceUpload';

class BatchDiligenceModal extends BaseModal {
    constructor(opts = {}, components = {}) {
        super(opts, components);
        this.BulkDiligenceUpload = BulkDiligenceUpload;
        this.props = {
            close: this.reset,
        };
        const dfd = this.new_deferred();

        this.show = () => {
            bison.helpers.modal(this.template, this, this.get_id(), 'static');
        };

        this.define_template(`
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header">
                        <label class="h4 modal-title" data-bind="text: modal_title"></label>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    </div>
                    <div class="modal-body">
                        <div data-bind="renderReactComponent: BulkDiligenceUpload, props: props"></div>
                    </div>
                </div>
            </div>
        </div>
        `);

        this.modal_title = opts.modal_title || 'Create new diligence project';
        dfd.resolve();
    }
}

export default BatchDiligenceModal;
