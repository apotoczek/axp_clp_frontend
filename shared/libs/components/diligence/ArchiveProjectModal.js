import pager from 'pager';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import ArchiveModalBase from 'src/libs/components/modals/ArchiveModalBase';

class ArchiveProjectModal extends ArchiveModalBase {
    constructor(opts, components) {
        super(opts, components);

        let _dfd = this.new_deferred();

        this._archive_projects = DataThing.backends.useractionhandler({
            url: 'archive_projects',
        });

        this.archive_entities = function() {
            let data = this.data_to_archive();

            let project_uids = [];

            if (data && data.length > 0) {
                this.loading(true);

                for (const entity of data) {
                    if (entity.archived == false) {
                        project_uids.push(entity.uid);
                    }
                }
                this._archive_projects({
                    data: {
                        project_uids: project_uids,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        this.reset();

                        Observer.broadcast_for_id(
                            this.get_id(),
                            'ArchiveProjectModal.archive_projects',
                            {
                                project_uids: project_uids,
                            },
                        );

                        Observer.broadcast('ArchiveProjectModal.archive_projects', {
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

export default ArchiveProjectModal;
