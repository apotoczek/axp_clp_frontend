/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

export default function(opts, components) {
    let self = new DeleteModalBase(opts, components);

    self.dfd = $.Deferred();
    self.dfds.push(self.dfd);

    self._delete_lists = DataThing.backends.useractionhandler({
        url: 'delete_lists',
    });

    self.warning_text =
        'Are you sure you want to delete these lists? This action can not be undone.';

    self.delete_entities = function() {
        let data = self.data_to_delete();

        if (data && data.length > 0) {
            let uids = [];

            for (let i = 0, j = data.length; i < j; i++) {
                if (data[i].share_info.write) {
                    uids.push(data[i].uid);
                }
            }

            self._delete_lists({
                data: {
                    uids: uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    DataThing.status_check();
                    self.reset();
                }),
                error: DataThing.api.XHRError(() => {
                    DataThing.status_check();
                    self.reset();
                }),
            });
        }
    };

    self.dfd.resolve();

    return self;
}
