import BaseModal from 'src/libs/components/basic/BaseModal';
import ko from 'knockout';
import DataThing from 'src/libs/DataThing';

class UpdateNoteModal extends BaseModal {
    constructor(opts, components) {
        super(opts, components);

        const _dfd = this.new_deferred();
        this.define_template(`
        <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-md">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 data-bind="text: title"></h4>
                    </div>
                    <div class="modal-body">
                        <h5>NOTE</h5>
                        <input class="form-control" type="text" data-bind="textInput: note"/>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" data-bind="click:save">Save</button>
                        <button class="btn btn-ghost-default" data-bind="click:cancel">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        `);

        this.note = ko.observable('');
        this.metric_pair_uids = opts.metric_pair_uids;

        this.title = opts.title;

        this._update = DataThing.backends.useractionhandler({
            url: 'update_pair_notes',
        });

        this.save = () => {
            this._update({
                data: {
                    uids: this.metric_pair_uids(),
                    note: this.note(),
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    this.cancel();
                }),
                error: DataThing.api.XHRError(() => {
                    this.cancel();
                }),
            });
        };
        this.cancel = () => {
            this.note('');
            this.reset();
        };
        _dfd.resolve();
    }
}
export default UpdateNoteModal;
