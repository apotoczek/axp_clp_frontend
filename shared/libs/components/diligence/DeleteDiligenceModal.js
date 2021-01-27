import DataThing from 'src/libs/DataThing';
import Observer from 'src/libs/Observer';
import pager from 'pager';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

class DeleteDiligenceModal extends DeleteModalBase {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        const dfd = this.new_deferred();

        this.warning_text =
            'Are you sure you want to delete these diligence projects? This action can not be undone.';

        this._delete_projects = DataThing.backends.useractionhandler({
            url: 'delete_projects',
        });

        this.delete_entities = function() {
            let data = this.data_to_delete();

            let diligence_uids = [];

            for (let i = 0, l = data.length; i < l; i++) {
                if (data[i].uid) {
                    diligence_uids.push(data[i].uid);
                }
            }

            this._delete_projects({
                data: {
                    diligence_uids: diligence_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    this.reset();

                    Observer.broadcast_for_id(this.get_id(), 'DeleteModal.success', {
                        diligence_uids: diligence_uids,
                    });

                    Observer.broadcast('DeleteModal.success', {
                        diligence_uids: diligence_uids,
                    });

                    if (this.origin_url) {
                        pager.navigate(this.origin_url);
                    }

                    setTimeout(() => {
                        DataThing.status_check();
                    }, 200);
                }),
            });
        };

        this.when().done(() => {
            dfd.resolve();
        });
    }
}

export default DeleteDiligenceModal;
