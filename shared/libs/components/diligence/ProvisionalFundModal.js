import BaseModal from 'src/libs/components/basic/BaseModal';
import ProvisionalFundForm from 'src/libs/components/diligence/ProvisionalFundForm';

class ProvisionalFundModal extends BaseModal {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Edit Fund Metrics</h4>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <!-- ko renderComponent: provisional_fund_form --><!-- /ko -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.provisional_fund_form = this.new_instance(ProvisionalFundForm, {
            id: 'provisional_fund_form',
            submit_text: opts.submit_text,
            user_fund_uid_event: opts.user_fund_uid_event,
            project_uid_event: opts.project_uid_event,
            modal_id: this.get_id(),
        });

        this.when().done(() => {
            dfd.resolve();
        });
    }
}

export default ProvisionalFundModal;
