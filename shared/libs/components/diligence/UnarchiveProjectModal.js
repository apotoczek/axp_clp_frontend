import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import UnArchiveModalBase from 'src/libs/components/modals/UnArchiveModalBase';

class UnarchiveProjectModal extends UnArchiveModalBase {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this._unarchive_projects = DataThing.backends.useractionhandler({
            url: 'unarchive_projects',
        });

        this.unarchive_entities = function() {
            let data = this.data_to_restore();

            let project_uids = [];

            if (data && data.length > 0) {
                this.loading(true);

                for (const entity of data) {
                    if (entity.archived == true) {
                        project_uids.push(entity.uid);
                    }
                }
                this._unarchive_projects({
                    data: {
                        project_uids: project_uids,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        this.reset();

                        Observer.broadcast_for_id(
                            this.get_id(),
                            'UnarchiveProjectModal.unarchive_projects',
                            {
                                project_uids: project_uids,
                            },
                        );

                        Observer.broadcast('UnarchiveProjectModal.unarchive_projects', {
                            project_uids: project_uids,
                        });

                        if (this.origin_url) {
                            pager.navigate(this.origin_url);
                        }

                        setTimeout(() => {
                            DataThing.status_check();
                        }, 200);
                    }),
                });
            }
        };

        _dfd.resolve();
    }
}

export default UnarchiveProjectModal;
